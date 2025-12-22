// 쿠폰 관련 유틸리티 함수

const COUPON_KEY = 'moodly_coupons';
const AVAILABLE_COUPONS_KEY = 'moodly_available_coupons';

// 사용 가능한 쿠폰 목록 (받기 전)
export const getAvailableCoupons = () => {
  try {
    const stored = localStorage.getItem(AVAILABLE_COUPONS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // 기본 쿠폰 목록
    const defaultCoupons = [
      {
        id: 'welcome',
        name: '신규 가입 쿠폰',
        description: '회원가입을 축하합니다!',
        discount: 5000,
        discountType: 'fixed', // 'fixed' 또는 'percent'
        minPurchase: 30000,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후
        status: 'available' // 'available', 'received', 'used', 'expired'
      },
      {
        id: 'discount10',
        name: '10% 할인 쿠폰',
        description: '전 상품 10% 할인',
        discount: 10,
        discountType: 'percent',
        minPurchase: 50000,
        validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60일 후
        status: 'available'
      },
      {
        id: 'special',
        name: '특별 할인 쿠폰',
        description: '20,000원 할인',
        discount: 20000,
        discountType: 'fixed',
        minPurchase: 100000,
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90일 후
        status: 'available'
      }
    ];
    localStorage.setItem(AVAILABLE_COUPONS_KEY, JSON.stringify(defaultCoupons));
    return defaultCoupons;
  } catch (error) {
    console.error('사용 가능한 쿠폰 목록을 가져오는 중 오류 발생:', error);
    return [];
  }
};

// 받은 쿠폰 목록 가져오기
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

// 쿠폰 받기
export const receiveCoupon = (couponId) => {
  try {
    const availableCoupons = getAvailableCoupons();
    const coupon = availableCoupons.find(c => c.id === couponId);
    
    if (!coupon) {
      return { success: false, message: '쿠폰을 찾을 수 없습니다.' };
    }

    if (coupon.status !== 'available') {
      return { success: false, message: '이미 받은 쿠폰입니다.' };
    }

    // 받은 쿠폰 목록에 추가
    const receivedCoupons = getReceivedCoupons();
    const receivedCoupon = {
      ...coupon,
      status: 'received',
      receivedAt: new Date().toISOString()
    };
    
    receivedCoupons.push(receivedCoupon);
    localStorage.setItem(COUPON_KEY, JSON.stringify(receivedCoupons));

    // 사용 가능한 쿠폰 목록에서 상태 업데이트
    const updatedAvailableCoupons = availableCoupons.map(c => 
      c.id === couponId ? { ...c, status: 'received' } : c
    );
    localStorage.setItem(AVAILABLE_COUPONS_KEY, JSON.stringify(updatedAvailableCoupons));

    return { success: true, message: '쿠폰을 받았습니다!' };
  } catch (error) {
    console.error('쿠폰 받기 중 오류 발생:', error);
    return { success: false, message: '쿠폰 받기에 실패했습니다.' };
  }
};

// 쿠폰 사용
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

// 쿠폰 만료 체크
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

// 상품별 쿠폰 생성 및 받기
export const receiveProductCoupon = (productId, productName, discountPercent) => {
  try {
    const couponId = `product-${productId}-${Date.now()}`;
    const discount = discountPercent || 15;
    
    // 이미 같은 상품의 쿠폰을 받았는지 확인
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
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후
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

