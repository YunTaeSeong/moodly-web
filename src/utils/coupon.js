// 쿠폰 관련 유틸리티 (로컬: 상품별 받은 쿠폰 등 레거시). 마이페이지·서버 발급 쿠폰은 api.js fetchUserCoupons 사용.

const COUPON_KEY = 'moodly_coupons';

/** @deprecated 서버에서 쿠폰을 조회하므로 빈 배열 */
export const getAvailableCoupons = () => [];

// 받은 쿠폰 목록 (로컬스토리지 — 상품 상세에서 받은 전용 쿠폰 등)
export const getReceivedCoupons = () => {
  try {
    const stored = localStorage.getItem(COUPON_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('받은 쿠폰 목록을 가져오는 중 오류 발생:', error);
    return [];
  }
};

// 쿠폰 받기 (로컬 시드 쿠폰용 — 더 이상 사용하지 않음)
export const receiveCoupon = () => {
  return { success: false, message: '받을 수 있는 쿠폰은 서버에서 안내합니다.' };
};

// 쿠폰 사용 (로컬 쿠폰만 마킹)
export const applyCoupon = (couponId) => {
  try {
    const receivedCoupons = getReceivedCoupons();
    const couponIndex = receivedCoupons.findIndex(c => c.id === couponId);

    if (couponIndex === -1) {
      return { success: false, message: '쿠폰을 찾을 수 없습니다.' };
    }

    if (receivedCoupons[couponIndex].status === 'used') {
      return { success: false, message: '이미 사용한 쿠폰입니다.' };
    }

    receivedCoupons[couponIndex].status = 'used';
    receivedCoupons[couponIndex].usedAt = new Date().toISOString();
    localStorage.setItem(COUPON_KEY, JSON.stringify(receivedCoupons));

    return { success: true, message: '쿠폰을 사용했습니다.' };
  } catch (error) {
    console.error('쿠폰 사용 중 오류 발생:', error);
    return { success: false, message: '쿠폰 사용에 실패했습니다.' };
  }
};

// 쿠폰 만료 체크 (로컬 쿠폰)
export const checkCouponExpiry = () => {
  try {
    const receivedCoupons = getReceivedCoupons();
    const now = new Date();

    const updatedCoupons = receivedCoupons.map(coupon => {
      const validUntil = new Date(coupon.validUntil);
      if (validUntil < now && coupon.status === 'received') {
        return { ...coupon, status: 'expired' };
      }
      return coupon;
    });

    localStorage.setItem(COUPON_KEY, JSON.stringify(updatedCoupons));
    return updatedCoupons;
  } catch (error) {
    console.error('쿠폰 만료 체크 중 오류 발생:', error);
    return [];
  }
};

// 상품별 쿠폰 생성 및 받기 (로컬)
export const receiveProductCoupon = (productId, productName, discountPercent) => {
  try {
    const couponId = `product-${productId}-${Date.now()}`;
    const discount = discountPercent || 15;

    const receivedCoupons = getReceivedCoupons();
    const existingCoupon = receivedCoupons.find(c =>
      c.productId === productId && c.status === 'received'
    );

    if (existingCoupon) {
      return { success: false, message: '이미 이 상품의 쿠폰을 받으셨습니다.' };
    }

    const newCoupon = {
      id: couponId,
      name: `${productName} 할인 쿠폰`,
      description: `${productName} 구매 시 사용 가능`,
      discount: discount,
      discountType: 'percent',
      minPurchase: 0,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'received',
      receivedAt: new Date().toISOString(),
      productId: productId,
      productName: productName
    };

    receivedCoupons.push(newCoupon);
    localStorage.setItem(COUPON_KEY, JSON.stringify(receivedCoupons));

    return { success: true, message: '쿠폰이 발급되었습니다!', coupon: newCoupon };
  } catch (error) {
    console.error('상품 쿠폰 받기 중 오류 발생:', error);
    return { success: false, message: '쿠폰 발급에 실패했습니다.' };
  }
};
