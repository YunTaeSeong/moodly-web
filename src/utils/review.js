// 리뷰 관련 유틸리티 함수

const REVIEW_KEY = 'moodly_reviews';

/** 서버 주문 상태: 결제 완료 이후만 후기 작성 허용용 */
export const PAID_ORDER_STATUSES_FOR_REVIEW = [
  'PAYMENT_COMPLETED',
  'PREPARING_SHIPMENT',
  'SHIPPED',
  'DELIVERED',
];

export const isPaidServerOrderRaw = (rawOrder) =>
  PAID_ORDER_STATUSES_FOR_REVIEW.includes(rawOrder?.status);

export const findOrderLineForProduct = (rawOrder, productId) => {
  const pid = Number(productId);
  if (Number.isNaN(pid)) return null;
  return (rawOrder?.items || []).find((it) => Number(it.productId) === pid) || null;
};

/**
 * 동일 회원·동일 상품 후기 중복 여부 (userId 우선, 구버전 리뷰는 author만 있는 경우 authorFallback)
 */
export const hasReviewForUserProduct = (userId, productId, authorFallback = null) => {
  const pid = Number(productId);
  if (Number.isNaN(pid)) return false;
  const uid = userId != null && userId !== '' ? Number(userId) : null;
  return getReviews().some((r) => {
    if (Number(r.productId) !== pid) return false;
    if (uid != null && !Number.isNaN(uid) && r.userId != null && Number(r.userId) === uid) return true;
    if (authorFallback && (r.userId == null || r.userId === '') && r.author === authorFallback) return true;
    return false;
  });
};

/**
 * 마이페이지·상품상세 공통: 작성 가능한 후기 행 목록
 * (결제 완료 이후 상태, 상품별 미작성)
 */
export const buildWritableReviewRows = (orderRows, userId, authorFallback = null) => {
  if (!Array.isArray(orderRows) || !orderRows.length) return [];
  const uid = userId != null && userId !== '' ? Number(userId) : null;
  if (uid == null || Number.isNaN(uid)) return [];

  const rows = [];
  const seenProductIds = new Set();
  for (const order of orderRows) {
    if (!isPaidServerOrderRaw({ status: order._serverStatus })) continue;

    const lineItems =
      order._items?.length > 0
        ? order._items
        : order.product
          ? [
              {
                orderItemId: order.orderItemId,
                productId: order.product.id,
                productName: order.product.name,
                productImage: order.product.image,
                price: order.product.price,
                quantity: order.quantity,
              },
            ]
          : [];

    for (const item of lineItems) {
      const productId = item.productId;
      if (productId == null) continue;
      const pidNum = Number(productId);
      if (Number.isNaN(pidNum) || seenProductIds.has(pidNum)) continue;
      if (hasReviewForUserProduct(uid, productId, authorFallback)) continue;
      seenProductIds.add(pidNum);
      rows.push({
        id: `${order.id}-${item.orderItemId ?? productId}`,
        orderId: order.orderId,
        orderItemId: item.orderItemId,
        orderDate: order.orderDate,
        status: order.status,
        _serverStatus: order._serverStatus,
        quantity: item.quantity || 1,
        product: {
          id: productId,
          name: item.productName,
          price: item.price,
          image: item.productImage,
        },
      });
    }
  }
  return rows;
};

/** 결제 완료 주문 중 해당 상품이 포함되고, 아직 후기가 없으면 { rawOrder, line } */
export const findEligiblePurchaseForReview = (rawOrders, productId, userId, authorFallback = null) => {
  if (!Array.isArray(rawOrders) || !rawOrders.length || productId == null) return null;
  const uid = userId != null && userId !== '' ? Number(userId) : null;
  if (uid == null || Number.isNaN(uid)) return null;
  if (hasReviewForUserProduct(uid, productId, authorFallback)) return null;
  for (const o of rawOrders) {
    if (!isPaidServerOrderRaw(o)) continue;
    const line = findOrderLineForProduct(o, productId);
    if (line) return { rawOrder: o, line };
  }
  return null;
};

// 리뷰 저장
export const saveReview = (reviewData) => {
  try {
    const reviews = getReviews();
    const newReview = {
      id: `REVIEW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: reviewData.orderId,
      orderItemId: reviewData.orderItemId != null ? reviewData.orderItemId : null,
      productId: reviewData.productId,
      productName: reviewData.productName,
      productImage: reviewData.productImage,
      rating: reviewData.rating,
      content: reviewData.content,
      author: reviewData.author,
      userId: reviewData.userId != null ? reviewData.userId : null,
      immutable: reviewData.immutable === true,
      createdAt: new Date().toISOString(),
      images: reviewData.images || []
    };
    
    reviews.unshift(newReview); // 최신 리뷰가 위에 오도록
    localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews));
    return newReview;
  } catch (error) {
    console.error('리뷰 저장 중 오류 발생:', error);
    return null;
  }
};

// 모든 리뷰 가져오기
export const getReviews = () => {
  try {
    const stored = localStorage.getItem(REVIEW_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('리뷰 목록을 가져오는 중 오류 발생:', error);
    return [];
  }
};

// 특정 상품의 리뷰 가져오기
export const getReviewsByProductId = (productId) => {
  try {
    const pid = Number(productId);
    const reviews = getReviews();
    return reviews.filter((review) => Number(review.productId) === pid);
  } catch (error) {
    console.error('상품 리뷰를 가져오는 중 오류 발생:', error);
    return [];
  }
};

// 특정 사용자가 작성한 리뷰 가져오기 (author — 레거시)
export const getReviewsByAuthor = (author) => {
  try {
    const reviews = getReviews();
    return reviews.filter((review) => review.author === author);
  } catch (error) {
    console.error('사용자 리뷰를 가져오는 중 오류 발생:', error);
    return [];
  }
};

/** 로그인 회원 ID 기준 내 리뷰 (마이페이지용) */
export const getReviewsByUserId = (userId) => {
  try {
    const uid = userId != null && userId !== '' ? Number(userId) : null;
    if (uid == null || Number.isNaN(uid)) return [];
    return getReviews().filter(
      (review) => review.userId != null && Number(review.userId) === uid
    );
  } catch (error) {
    console.error('사용자 리뷰를 가져오는 중 오류 발생:', error);
    return [];
  }
};

// 특정 주문에 대한 리뷰 작성 여부 확인
export const hasReviewForOrder = (orderId) => {
  try {
    const reviews = getReviews();
    return reviews.some(review => review.orderId === orderId);
  } catch (error) {
    console.error('리뷰 작성 여부 확인 중 오류 발생:', error);
    return false;
  }
};

// 리뷰 수정
export const updateReview = (reviewId, updatedData) => {
  try {
    const reviews = getReviews();
    const reviewIndex = reviews.findIndex(review => review.id === reviewId);
    if (reviewIndex > -1 && reviews[reviewIndex].immutable) {
      return null;
    }
    if (reviewIndex > -1) {
      reviews[reviewIndex] = {
        ...reviews[reviewIndex],
        ...updatedData,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews));
      return reviews[reviewIndex];
    }
    return null;
  } catch (error) {
    console.error('리뷰 수정 중 오류 발생:', error);
    return null;
  }
};

// 리뷰 삭제
export const deleteReview = (reviewId) => {
  try {
    const reviews = getReviews();
    const target = reviews.find((r) => r.id === reviewId);
    if (target?.immutable) return false;
    const filteredReviews = reviews.filter(review => review.id !== reviewId);
    localStorage.setItem(REVIEW_KEY, JSON.stringify(filteredReviews));
    return true;
  } catch (error) {
    console.error('리뷰 삭제 중 오류 발생:', error);
    return false;
  }
};

