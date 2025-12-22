// 리뷰 관련 유틸리티 함수

const REVIEW_KEY = 'moodly_reviews';

// 리뷰 저장
export const saveReview = (reviewData) => {
  try {
    const reviews = getReviews();
    const newReview = {
      id: `REVIEW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: reviewData.orderId,
      productId: reviewData.productId,
      productName: reviewData.productName,
      productImage: reviewData.productImage,
      rating: reviewData.rating,
      content: reviewData.content,
      author: reviewData.author,
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
    const reviews = getReviews();
    return reviews.filter(review => review.productId === productId);
  } catch (error) {
    console.error('상품 리뷰를 가져오는 중 오류 발생:', error);
    return [];
  }
};

// 특정 사용자가 작성한 리뷰 가져오기
export const getReviewsByAuthor = (author) => {
  try {
    const reviews = getReviews();
    return reviews.filter(review => review.author === author);
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
    const filteredReviews = reviews.filter(review => review.id !== reviewId);
    localStorage.setItem(REVIEW_KEY, JSON.stringify(filteredReviews));
    return true;
  } catch (error) {
    console.error('리뷰 삭제 중 오류 발생:', error);
    return false;
  }
};

