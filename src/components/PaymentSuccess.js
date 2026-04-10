import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { postUserCouponUse, confirmServerPayment } from '../utils/api';
import './PaymentSuccess.css';

function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');

    const pendingOrderData = sessionStorage.getItem('pendingOrder');
    if (!pendingOrderData) {
      if (paymentKey && orderId && amount) {
        console.log('결제 성공:', { paymentKey, orderId, amount });
      }
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const orderData = JSON.parse(pendingOrderData);
        const finalOrderId = orderId || orderData.orderId;

        let subtotalForCoupon =
          orderData.orderSubtotalBeforeDiscount != null
            ? Number(orderData.orderSubtotalBeforeDiscount)
            : NaN;
        if (Number.isNaN(subtotalForCoupon)) {
          if (Array.isArray(orderData.orderItems) && orderData.orderItems.length > 0) {
            subtotalForCoupon = orderData.orderItems.reduce(
              (s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1),
              0
            );
          } else if (orderData.product && orderData.quantity) {
            subtotalForCoupon =
              (Number(orderData.product.price) || 0) * Number(orderData.quantity);
          } else {
            subtotalForCoupon = 0;
          }
        }

        const amt =
          amount != null && amount !== ''
            ? parseInt(amount, 10)
            : Math.round(Number(orderData.amount));

        let confirmSucceeded = false;
        if (paymentKey && finalOrderId && !Number.isNaN(amt)) {
          const cr = await confirmServerPayment({
            paymentKey,
            orderId: finalOrderId,
            amount: amt,
          });
          confirmSucceeded = cr.success;
          if (!cr.success) {
            window.alert(
              cr.message ||
                '결제 승인 확인에 실패했습니다. 결제는 되었을 수 있으니 고객센터로 문의해 주세요.'
            );
          }
        } else {
          console.warn('[PaymentSuccess] Toss 파라미터 부족 — 승인 확인 생략', {
            paymentKey,
            finalOrderId,
            amt,
          });
        }

        if (cancelled) return;

        const c = orderData.coupon;
        if (
          confirmSucceeded &&
          c &&
          c.couponId != null &&
          (c.userCouponId != null || c.id != null)
        ) {
          const userCouponId = c.userCouponId != null ? c.userCouponId : c.id;
          const ur = await postUserCouponUse(userCouponId, finalOrderId, subtotalForCoupon);
          if (!ur.success) {
            console.warn('[PaymentSuccess] 서버 쿠폰 사용 반영 실패:', ur.message);
          }
        }

        sessionStorage.removeItem('pendingOrder');
        console.log('주문이 저장되었습니다:', {
          paymentKey,
          orderId: finalOrderId,
          amount,
        });
      } catch (error) {
        console.error('주문 저장 중 오류:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
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

