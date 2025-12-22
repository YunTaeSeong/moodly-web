import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { saveOrder } from '../utils/order';
import './PaymentSuccess.css';

function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // URL 파라미터에서 결제 정보 가져오기
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    // 실제 운영 환경에서는 서버에 결제 승인 요청을 보내야 합니다
    // 여기서는 클라이언트 사이드에서만 처리
    // sessionStorage에서 주문 데이터 가져오기
    const pendingOrderData = sessionStorage.getItem('pendingOrder');
    if (pendingOrderData) {
      try {
        const orderData = JSON.parse(pendingOrderData);
        // 주문 정보 저장 (URL 파라미터가 있으면 사용, 없으면 sessionStorage의 데이터 사용)
        saveOrder({
          ...orderData,
          orderId: orderId || orderData.orderId,
          amount: amount ? parseInt(amount) : orderData.amount
        });
        // 임시 데이터 삭제
        sessionStorage.removeItem('pendingOrder');
        console.log('주문이 저장되었습니다:', { paymentKey, orderId: orderId || orderData.orderId, amount });
      } catch (error) {
        console.error('주문 저장 중 오류:', error);
      }
    } else if (paymentKey && orderId && amount) {
      // sessionStorage에 데이터가 없는 경우 (직접 URL 접근 등)
      console.log('결제 성공:', { paymentKey, orderId, amount });
    }
  }, [searchParams]);

  return (
    <div className="payment-result-container">
      <div className="payment-result-content">
        <div className="payment-success-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>
        <h1>결제가 완료되었습니다</h1>
        <p className="payment-result-message">
          주문이 정상적으로 처리되었습니다.
        </p>
        <div className="payment-result-actions">
          <button 
            className="payment-result-btn primary"
            onClick={() => navigate('/mypage')}
          >
            주문 내역 확인
          </button>
          <button 
            className="payment-result-btn secondary"
            onClick={() => navigate('/')}
          >
            쇼핑 계속하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentSuccess;

