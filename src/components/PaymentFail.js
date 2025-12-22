import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './PaymentFail.css';

function PaymentFail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // URL 파라미터에서 에러 정보 가져오기
    const code = searchParams.get('code');
    const message = searchParams.get('message');

    if (code && message) {
      console.log('결제 실패:', { code, message });
    }
  }, [searchParams]);

  const errorMessage = searchParams.get('message') || '결제 처리 중 오류가 발생했습니다.';

  return (
    <div className="payment-result-container">
      <div className="payment-result-content">
        <div className="payment-fail-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>
        <h1>결제에 실패했습니다</h1>
        <p className="payment-result-message">
          {errorMessage}
        </p>
        <div className="payment-result-actions">
          <button 
            className="payment-result-btn primary"
            onClick={() => navigate(-1)}
          >
            다시 시도
          </button>
          <button 
            className="payment-result-btn secondary"
            onClick={() => navigate('/')}
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentFail;

