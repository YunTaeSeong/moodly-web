// 배송지 관리 유틸리티

const DELIVERY_KEY = 'moodly_delivery_address';

// 배송지 정보 가져오기
export const getDeliveryAddress = () => {
  try {
    const address = localStorage.getItem(DELIVERY_KEY);
    return address ? JSON.parse(address) : null;
  } catch (error) {
    console.error('배송지 정보를 가져오는 중 오류 발생:', error);
    return null;
  }
};

// 배송지 정보 저장
export const saveDeliveryAddress = (addressData) => {
  try {
    const address = {
      ...addressData,
      savedAt: new Date().toISOString()
    };
    localStorage.setItem(DELIVERY_KEY, JSON.stringify(address));
    return address;
  } catch (error) {
    console.error('배송지 정보 저장 중 오류 발생:', error);
    return null;
  }
};

// 배송지 정보 삭제
export const removeDeliveryAddress = () => {
  try {
    localStorage.removeItem(DELIVERY_KEY);
    return true;
  } catch (error) {
    console.error('배송지 정보 삭제 중 오류 발생:', error);
    return false;
  }
};

// 배송지가 설정되어 있는지 확인
export const hasDeliveryAddress = () => {
  return getDeliveryAddress() !== null;
};

