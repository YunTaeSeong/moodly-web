// 주문 관련 유틸리티 함수

const ORDER_KEY = 'moodly_orders';

// 주문 저장
export const saveOrder = (orderData) => {
  try {
    const orders = getOrders();
    const newOrder = {
      id: orderData.orderId || `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      orderId: orderData.orderId,
      orderName: orderData.orderName,
      product: orderData.product,
      quantity: orderData.quantity,
      amount: orderData.amount,
      discountAmount: orderData.discountAmount || 0,
      coupon: orderData.coupon || null,
      deliveryAddress: orderData.deliveryAddress,
      customerName: orderData.customerName,
      status: '결제완료',
      orderDate: new Date().toISOString(),
      estimatedDelivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 후
      trackingNumber: null
    };
    
    orders.unshift(newOrder); // 최신 주문이 위에 오도록
    localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
    return newOrder;
  } catch (error) {
    console.error('주문 저장 중 오류 발생:', error);
    return null;
  }
};

// 모든 주문 가져오기
export const getOrders = () => {
  try {
    const stored = localStorage.getItem(ORDER_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  } catch (error) {
    console.error('주문 목록을 가져오는 중 오류 발생:', error);
    return [];
  }
};

// 주문 건수 가져오기
export const getOrderCount = () => {
  try {
    const orders = getOrders();
    return orders.length;
  } catch (error) {
    console.error('주문 건수 가져오는 중 오류 발생:', error);
    return 0;
  }
};

// 특정 주문 가져오기
export const getOrderById = (orderId) => {
  try {
    const orders = getOrders();
    return orders.find(order => order.id === orderId || order.orderId === orderId);
  } catch (error) {
    console.error('주문 가져오는 중 오류 발생:', error);
    return null;
  }
};

// 주문 상태 업데이트
export const updateOrderStatus = (orderId, status) => {
  try {
    const orders = getOrders();
    const orderIndex = orders.findIndex(order => order.id === orderId || order.orderId === orderId);
    
    if (orderIndex > -1) {
      orders[orderIndex].status = status;
      if (status === '배송중' && !orders[orderIndex].trackingNumber) {
        orders[orderIndex].trackingNumber = `TRACK${Date.now()}`;
      }
      if (status === '배송완료' && !orders[orderIndex].deliveredDate) {
        orders[orderIndex].deliveredDate = new Date().toISOString();
      }
      localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
      return orders[orderIndex];
    }
    return null;
  } catch (error) {
    console.error('주문 상태 업데이트 중 오류 발생:', error);
    return null;
  }
};

// 테스트용 주문 추가 (노트북 스탠드)
export const addTestOrder = (product) => {
  try {
    const orders = getOrders();
    const orderId = `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date();
    
    const newOrder = {
      id: orderId,
      orderId: orderId,
      orderName: product.name,
      product: product,
      quantity: 1,
      amount: product.price,
      discountAmount: 0,
      coupon: null,
      deliveryAddress: {
        postcode: '12345',
        address: '서울시 강남구 테헤란로 123',
        detailAddress: '456호',
        recipient: '홍길동',
        phone: '010-1234-5678'
      },
      customerName: '홍길동',
      status: '배송완료',
      orderDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2일 전 주문
      estimatedDelivery: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1일 전 배송 예정
      deliveredDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1일 전 배송 완료
      trackingNumber: `TRACK${Date.now()}`
    };
    
    orders.unshift(newOrder);
    localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
    return newOrder;
  } catch (error) {
    console.error('테스트 주문 추가 중 오류 발생:', error);
    return null;
  }
};

