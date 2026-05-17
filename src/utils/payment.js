// 토스페이먼츠 결제 유틸리티

// 토스페이먼츠 SDK 로드 확인
export const loadTossPayments = () => {
  return new Promise((resolve, reject) => {
    if (window.TossPayments) {
      resolve(window.TossPayments);
      return;
    }

    // SDK가 로드되지 않은 경우 스크립트 추가
    const script = document.createElement('script');
    script.src = 'https://js.tosspayments.com/v1/payment';
    script.onload = () => {
      if (window.TossPayments) {
        resolve(window.TossPayments);
      } else {
        reject(new Error('토스페이먼츠 SDK를 불러올 수 없습니다.'));
      }
    };
    script.onerror = () => {
      reject(new Error('토스페이먼츠 SDK 로드 실패'));
    };
    document.head.appendChild(script);
  });
};

/** Toss 결제창 X(사용자 취소) 등 */
export const isPaymentUserCancel = (error) => {
  if (!error) return false;
  const code = String(error.code || error.errorCode || '').toUpperCase();
  const msg = String(error.message || '');
  return (
    code === 'USER_CANCEL' ||
    code === 'PAY_PROCESS_CANCELED' ||
    code === 'PAY_PROCESS_CANCELLED' ||
    msg.includes('취소') ||
    msg.toLowerCase().includes('cancel')
  );
};

// 결제 처리 함수
export const processPayment = async (paymentData) => {
  try {
    const TossPayments = await loadTossPayments();
    
    const clientKey =
      process.env.REACT_APP_TOSS_CLIENT_KEY ||
      'test_ck_ZLKGPx4M3MqXZvJ0QQ2w3BaWypv1';
    
    const tossPayments = TossPayments(clientKey);

    // 결제 방법 선택 (기본값: 카드)
    // 실제로는 사용자에게 UI로 선택하게 하는 것이 좋습니다
    const method = '카드'; // 카드, 가상계좌, 계좌이체, 휴대폰 등

    // 결제 요청
    await tossPayments.requestPayment(method, {
      amount: paymentData.amount,
      orderId: paymentData.orderId,
      orderName: paymentData.orderName,
      customerName: paymentData.customerName,
      successUrl: `${window.location.origin}/payment/success?orderId=${paymentData.orderId}&amount=${paymentData.amount}`,
      failUrl: `${window.location.origin}/payment/fail?orderId=${paymentData.orderId}`,
    });

    return { success: true };
  } catch (error) {
    if (isPaymentUserCancel(error)) {
      const cancelError = new Error('결제가 취소되었습니다.');
      cancelError.code = 'USER_CANCEL';
      cancelError.userCancel = true;
      throw cancelError;
    }
    console.error('결제 처리 중 오류:', error);
    throw error;
  }
};

// 주문 ID 생성
export const generateOrderId = () => {
  return `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

