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

/** 후기 카드에 표시할 작성자명 (없으면 userId 기반 표시) */
export const formatReviewAuthor = (review) => {
  const name = review?.author != null ? String(review.author).trim() : '';
  if (name) return name;
  const uid = review?.userId;
  if (uid != null && uid !== '') {
    const tail = String(uid).slice(-4);
    return tail ? `회원${tail}` : '회원';
  }
  return '회원';
};

export const findOrderLineForProduct = (rawOrder, productId) => {
  const pid = Number(productId);
  if (Number.isNaN(pid)) return null;
  return (rawOrder?.items || []).find((it) => Number(it.productId) === pid) || null;
};

/**
 * 해당 구매(주문 상품 라인)에 이미 후기가 있는지
 * - orderItemId 우선
 * - 동일 orderId + productId (구 데이터)
 */
const purchaseKeysMatch = (a, b) => {
  if (a == null || b == null || a === '' || b === '') return false;
  return String(a) === String(b);
};

export const hasReviewForPurchase = (
  {
    orderItemId,
    orderId,
    productId,
    userId,
    authorFallback = null,
  },
  reviewsSource = null
) => {
  const reviews = Array.isArray(reviewsSource) ? reviewsSource : getReviews();
  const pid = productId != null ? Number(productId) : null;

  return reviews.some((r) => {
    if (purchaseKeysMatch(r.orderItemId, orderItemId)) return true;
    if (orderId && r.orderId === orderId && pid != null && Number(r.productId) === pid) {
      if (r.orderItemId == null || r.orderItemId === '') return true;
    }
    return false;
  });
};

/** @deprecated 구매 건별 체크는 hasReviewForPurchase 사용 */
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
 * 마이페이지: 작성 가능한 후기 (결제 완료 주문 × 주문 상품 라인별 1건)
 */
export const buildWritableReviewRows = (orderRows, userId, authorFallback = null, reviewsSource = null) => {
  if (!Array.isArray(orderRows) || !orderRows.length) return [];
  const uid = userId != null && userId !== '' ? Number(userId) : null;
  if (uid == null || Number.isNaN(uid)) return [];

  const rows = [];
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
      if (
        hasReviewForPurchase(
          {
            orderItemId: item.orderItemId,
            orderId: order.orderId,
            productId,
            userId: uid,
            authorFallback,
          },
          reviewsSource
        )
      ) {
        continue;
      }
      const purchaseKey =
        item.orderItemId != null && item.orderItemId !== ''
          ? item.orderItemId
          : `${order.orderId || order.id}-${productId}`;
      rows.push({
        id: `${order.id}-${purchaseKey}`,
        orderId: order.orderId,
        orderItemId: purchaseKey,
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

/** 상품 상세: 해당 상품 중 아직 후기 없는 첫 구매 건 */
export const findEligiblePurchaseForReview = (
  rawOrders,
  productId,
  userId,
  authorFallback = null,
  reviewsSource = null
) => {
  if (!Array.isArray(rawOrders) || !rawOrders.length || productId == null) return null;
  const uid = userId != null && userId !== '' ? Number(userId) : null;
  if (uid == null || Number.isNaN(uid)) return null;
  const pid = Number(productId);
  if (Number.isNaN(pid)) return null;

  for (const o of rawOrders) {
    if (!isPaidServerOrderRaw(o)) continue;
    for (const line of o.items || []) {
      if (Number(line.productId) !== pid) continue;
      const orderItemId =
        line.id != null && line.id !== '' ? line.id : o.orderId ? `${o.orderId}-${pid}` : null;
      if (
        hasReviewForPurchase(
          {
            orderItemId,
            orderId: o.orderId,
            productId: pid,
            userId: uid,
            authorFallback,
          },
          reviewsSource
        )
      ) {
        continue;
      }
      return { rawOrder: o, line: { ...line, id: orderItemId } };
    }
  }
  return null;
};

// 모든 리뷰 가져오기 (항상 배열 반환)
export const getReviews = () => {
  try {
    const stored = localStorage.getItem(REVIEW_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) {
      console.warn('moodly_reviews 데이터가 배열이 아닙니다. 초기화합니다.', parsed);
      return [];
    }
    return parsed;
  } catch (error) {
    console.error('리뷰 목록을 가져오는 중 오류 발생:', error);
    return [];
  }
};

export const getReviewSaveFailureMessage = (reason) => {
  if (reason === 'quota') {
    return '저장 공간이 부족합니다. 첨부 사진을 줄이거나, 기존 후기 사진이 많으면 일부 삭제 후 다시 시도해 주세요.';
  }
  if (reason === 'invalid') {
    return '리뷰 정보가 올바르지 않습니다.';
  }
  return '리뷰 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.';
};

// 리뷰 저장 → { success, review?, reason? }
export const saveReview = (reviewData) => {
  try {
    if (!reviewData?.productId) {
      console.error('리뷰 저장 실패: productId 없음', reviewData);
      return { success: false, reason: 'invalid' };
    }

    const reviews = getReviews();
    const orderItemKey =
      reviewData.orderItemId != null && reviewData.orderItemId !== ''
        ? reviewData.orderItemId
        : reviewData.orderId && reviewData.productId != null
          ? `${reviewData.orderId}-${reviewData.productId}`
          : null;

    const newReview = {
      id: `REVIEW_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      orderId: reviewData.orderId ?? null,
      orderItemId: orderItemKey,
      productId: Number(reviewData.productId),
      productName: reviewData.productName,
      productImage: reviewData.productImage,
      rating: reviewData.rating,
      content: reviewData.content,
      author: reviewData.author,
      userId: reviewData.userId != null ? reviewData.userId : null,
      immutable: reviewData.immutable === true,
      createdAt: new Date().toISOString(),
      images: Array.isArray(reviewData.images) ? reviewData.images : [],
    };

    reviews.unshift(newReview);
    localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews));
    return { success: true, review: newReview };
  } catch (error) {
    if (error?.name === 'QuotaExceededError') {
      console.error('리뷰 저장 실패: 저장 공간 부족(사진 용량).', error);
      return { success: false, reason: 'quota' };
    }
    console.error('리뷰 저장 중 오류 발생:', error);
    return { success: false, reason: 'unknown' };
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
    return getReviews().filter((review) => review.userId != null && Number(review.userId) === uid);
  } catch (error) {
    console.error('사용자 리뷰를 가져오는 중 오류 발생:', error);
    return [];
  }
};

// 특정 주문에 대한 리뷰 작성 여부 확인
export const hasReviewForOrder = (orderId) => {
  try {
    const reviews = getReviews();
    return reviews.some((review) => review.orderId === orderId);
  } catch (error) {
    console.error('리뷰 작성 여부 확인 중 오류 발생:', error);
    return false;
  }
};

// 리뷰 수정
export const updateReview = (reviewId, updatedData) => {
  try {
    const reviews = getReviews();
    const reviewIndex = reviews.findIndex((review) => review.id === reviewId);
    if (reviewIndex > -1 && reviews[reviewIndex].immutable) {
      return null;
    }
    if (reviewIndex > -1) {
      reviews[reviewIndex] = {
        ...reviews[reviewIndex],
        ...updatedData,
        updatedAt: new Date().toISOString(),
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
    const filteredReviews = reviews.filter((review) => review.id !== reviewId);
    localStorage.setItem(REVIEW_KEY, JSON.stringify(filteredReviews));
    return true;
  } catch (error) {
    console.error('리뷰 삭제 중 오류 발생:', error);
    return false;
  }
};
