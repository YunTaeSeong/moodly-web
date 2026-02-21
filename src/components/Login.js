import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { setCookie } from '../utils/cookie';
import { authenticateUser, findPassword } from '../utils/user';
import { login, kakaoLogin } from '../utils/authApi';
import { requestFindId, confirmFindId, requestPasswordReset } from '../utils/api';
import { hasTokens } from '../utils/token';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showFindModal, setShowFindModal] = useState(false);
  const [findType, setFindType] = useState(null); // 'id' or 'password'
  const [findFormData, setFindFormData] = useState({
    name: '',
    phone: '',
    userId: '',
    code: '' // 인증코드
  });
  const [findError, setFindError] = useState('');
  const [findResult, setFindResult] = useState(null);
  const [findIdStep, setFindIdStep] = useState('request'); // 'request' or 'confirm'
  const [codeTimer, setCodeTimer] = useState(null); // 인증코드 입력 타이머 (3분)
  const [timeLeft, setTimeLeft] = useState(180); // 남은 시간 (초 단위)
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // 카카오 로그인 콜백 처리
  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    
    if (code) {
      handleKakaoCallback(code);
    } else if (error) {
      setError('카카오 로그인에 실패했습니다.');
    }
  }, [searchParams]);

  // 카카오 로그인 콜백 처리
  const handleKakaoCallback = async (code) => {
    setError('');
    try {
      const result = await kakaoLogin(code);
      
      if (result.success) {
        setCookie('isLoggedIn', 'true', 7);
        navigate('/');
      } else {
        setError(result.message || '카카오 로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('카카오 로그인 콜백 처리 오류:', error);
      setError('카카오 로그인 중 예기치 않은 오류가 발생했습니다.');
    }
  };

  // 카카오 로그인 시작
  const handleKakaoLogin = () => {
    // 환경 변수 읽기 (React는 REACT_APP_ 접두사 필요)
    const KAKAO_CLIENT_ID = process.env.REACT_APP_KAKAO_CLIENT_ID;
    const KAKAO_REDIRECT_URI = process.env.REACT_APP_KAKAO_REDIRECT_URI || 'http://localhost:3000/auth/kakao/callback';
    
    // 디버깅: 환경 변수 상세 확인
    console.log('[KakaoLogin] ===== 환경 변수 디버깅 =====');
    console.log('[KakaoLogin] process.env.REACT_APP_KAKAO_CLIENT_ID:', process.env.REACT_APP_KAKAO_CLIENT_ID);
    console.log('[KakaoLogin] process.env.REACT_APP_KAKAO_REDIRECT_URI:', process.env.REACT_APP_KAKAO_REDIRECT_URI);
    console.log('[KakaoLogin] KAKAO_CLIENT_ID:', KAKAO_CLIENT_ID);
    console.log('[KakaoLogin] KAKAO_CLIENT_ID 타입:', typeof KAKAO_CLIENT_ID);
    console.log('[KakaoLogin] KAKAO_CLIENT_ID 길이:', KAKAO_CLIENT_ID?.length);
    console.log('[KakaoLogin] ============================');
    
    // Client ID 검증 (더 엄격하게)
    const invalidValues = [
      undefined,
      null,
      '',
      'your-kakao-client-id',
      'your-kakao-rest-api-key-here',
      'your-kakao-client-id-here'
    ];
    
    if (!KAKAO_CLIENT_ID || invalidValues.includes(KAKAO_CLIENT_ID) || KAKAO_CLIENT_ID.length < 10) {
      console.error('[KakaoLogin] Client ID 검증 실패:', KAKAO_CLIENT_ID);
      alert(
        '카카오 Client ID가 설정되지 않았습니다.\n\n' +
        '해결 방법:\n' +
        '1. moodly-web/.env 파일을 열어주세요\n' +
        '2. REACT_APP_KAKAO_CLIENT_ID=여기에_실제_REST_API_키 입력\n' +
        '3. 프론트엔드 서버를 완전히 종료 후 재시작 (npm start)\n\n' +
        '현재 값: ' + (KAKAO_CLIENT_ID || 'undefined')
      );
      return;
    }
    
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(KAKAO_REDIRECT_URI)}&response_type=code`;
    
    console.log('[KakaoLogin] 카카오 인증 URL 생성 완료');
    console.log('[KakaoLogin] URL:', kakaoAuthUrl);
    window.location.href = kakaoAuthUrl;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 기존 테스트 계정 체크 (하위 호환성 유지)
    if (username === 'test' && password === 'test') {
      setCookie('isLoggedIn', 'true', 7);
      setCookie('username', username, 7);
      setCookie('userEmail', 'test@test.com', 7);
      navigate('/');
      return;
    } else if (username === 'admin@admin.com' && password === 'admin') {
      setCookie('isLoggedIn', 'true', 7);
      setCookie('username', 'admin', 7);
      setCookie('userEmail', 'admin@admin.com', 7);
      navigate('/');
      return;
    }

    // 로컬 스토리지 기반 사용자 체크 (하위 호환성 유지)
    const localUser = authenticateUser(username, password);
    if (localUser) {
      setCookie('isLoggedIn', 'true', 7);
      setCookie('username', localUser.name, 7);
      setCookie('userEmail', localUser.userId, 7);
      navigate('/');
      return;
    }

    // Auth Service를 통한 로그인
    try {
      const result = await login(username, password);
      
      if (result.success) {
        // 로그인 성공 - 토큰은 authApi에서 자동으로 저장됨
        // 쿠키도 설정 (기존 코드 호환성)
        setCookie('isLoggedIn', 'true', 7);
        setCookie('userEmail', username, 7);
        
        navigate('/');
      } else {
        // 에러 메시지 표시
        const errorMsg = result.message || '아이디 또는 비밀번호가 올바르지 않습니다.';
        setError(errorMsg);
        console.error('로그인 실패:', result);
      }
    } catch (error) {
      console.error('로그인 예외 발생:', error);
      setError('로그인 중 예기치 않은 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 타이머 정리 (컴포넌트 언마운트 시)
  useEffect(() => {
    return () => {
      if (codeTimer) {
        clearInterval(codeTimer);
      }
    };
  }, [codeTimer]);

  // ID/PW 찾기 모달 열기
  const handleOpenFindModal = (type) => {
    setFindType(type);
    setShowFindModal(true);
    setFindFormData({ name: '', phone: '', userId: '', code: '' });
    setFindError('');
    setFindResult(null);
    setFindIdStep('request');
    setTimeLeft(180);
    // 기존 타이머 정리
    if (codeTimer) {
      clearInterval(codeTimer);
      setCodeTimer(null);
    }
  };

  // ID/PW 찾기 모달 닫기
  const handleCloseFindModal = () => {
    setShowFindModal(false);
    setFindType(null);
    setFindFormData({ name: '', phone: '', userId: '', code: '' });
    setFindError('');
    setFindResult(null);
    setFindIdStep('request');
    setTimeLeft(180);
    // 타이머 정리
    if (codeTimer) {
      clearInterval(codeTimer);
      setCodeTimer(null);
    }
  };

  // ID 찾기 - 인증코드 요청
  const handleFindIdRequest = async (e) => {
    e.preventDefault();
    setFindError('');

    if (!findFormData.name || !findFormData.phone) {
      setFindError('이름과 전화번호를 모두 입력해주세요.');
      return;
    }

    try {
      const result = await requestFindId(findFormData.name, findFormData.phone);
      if (result.success) {
        // 인증코드 입력 단계로 이동
        setFindIdStep('confirm');
        setFindError('');
        setTimeLeft(180); // 3분 타이머 시작
        setFindFormData({ ...findFormData, code: '' }); // 인증코드 필드 초기화
        
        // 기존 타이머 정리
        if (codeTimer) {
          clearInterval(codeTimer);
        }
        
        // 3분 타이머 시작
        const timer = setInterval(() => {
          setTimeLeft((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              setCodeTimer(null);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        
        setCodeTimer(timer);
      } else {
        setFindError(result.message || '아이디 찾기에 실패했습니다.');
      }
    } catch (error) {
      console.error('ID 찾기 요청 오류:', error);
      setFindError('아이디 찾기 중 오류가 발생했습니다.');
    }
  };

  // ID 찾기 - 인증코드 확인
  const handleFindIdConfirm = async (e) => {
    e.preventDefault();
    setFindError('');

    if (timeLeft <= 0) {
      setFindError('인증코드 입력 시간이 만료되었습니다. 다시 인증코드를 요청해주세요.');
      return;
    }

    if (!findFormData.code) {
      setFindError('인증코드를 입력해주세요.');
      return;
    }

    try {
      const result = await confirmFindId(findFormData.code, findFormData.phone);
      if (result.success) {
        // 타이머 정리
        if (codeTimer) {
          clearInterval(codeTimer);
          setCodeTimer(null);
        }
        
        setFindResult({
          type: 'id',
          message: `회원님의 아이디는 ${result.maskedEmail} 입니다.`
        });
        setFindIdStep('request');
        setTimeLeft(180);
      } else {
        setFindError(result.message || '올바르지 않은 코드입니다.');
      }
    } catch (error) {
      console.error('ID 찾기 확인 오류:', error);
      setFindError('올바르지 않은 코드입니다.');
    }
  };

  // 비밀번호 찾기 (이메일로 재설정 링크 발송)
  const handleFindPassword = async (e) => {
    e.preventDefault();
    setFindError('');
    setFindResult(null);

    if (!findFormData.userId) {
      setFindError('이메일을 입력해주세요.');
      return;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(findFormData.userId)) {
      setFindError('올바르지 않은 이메일입니다.');
      return;
    }

    try {
      const result = await requestPasswordReset(findFormData.userId);
      if (result.success) {
        setFindResult({
          type: 'password',
          message: `비밀번호 재설정 링크가 이메일로 발송되었습니다.\n이메일을 확인해주세요.`
        });
      } else {
        setFindError(result.message || '올바르지 않은 이메일입니다.');
      }
    } catch (error) {
      console.error('비밀번호 찾기 오류:', error);
      // JSON 파싱 에러는 204 응답일 수 있으므로 성공으로 처리
      if (error.message && error.message.includes('Unexpected end of JSON')) {
        setFindResult({
          type: 'password',
          message: `비밀번호 재설정 링크가 이메일로 발송되었습니다.\n이메일을 확인해주세요.`
        });
      } else {
        setFindError('올바르지 않은 이메일입니다.');
      }
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">로그인</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="username">아이디</label>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="아이디를 입력하세요"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">비밀번호</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" className="login-submit-button">
            로그인
          </button>
          
          {/* ID/PW 찾기 링크 */}
          <div className="login-find-links">
            <button 
              type="button" 
              className="find-link"
              onClick={() => handleOpenFindModal('id')}
            >
              ID 찾기
            </button>
            <span className="find-link-divider">|</span>
            <button 
              type="button" 
              className="find-link"
              onClick={() => handleOpenFindModal('password')}
            >
              PW 찾기
            </button>
          </div>

          <div className="login-hint">
            <p>테스트 계정: 아이디 - test, 비밀번호 - test</p>
            <p>관리자 계정: 아이디 - admin@admin.com, 비밀번호 - admin</p>
          </div>
        </form>

        {/* 카카오 로그인 버튼 */}
        <div className="social-login-section">
          <div className="social-login-divider">
            <span>또는</span>
          </div>
          <button 
            type="button" 
            className="kakao-login-button"
            onClick={handleKakaoLogin}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px' }}>
              <path d="M10 0C4.477 0 0 3.582 0 8c0 2.797 1.797 5.27 4.5 6.75L3.5 20l5.5-3.1c.5.05 1 .1 1.5.1 5.523 0 10-3.582 10-8S15.523 0 10 0z" fill="#FEE500"/>
              <path d="M10 2c3.866 0 7 2.462 7 5.5S13.866 13 10 13c-.5 0-1-.05-1.5-.15L5 15.5l1-2.25C3.5 11.8 3 9.95 3 7.5 3 4.462 6.134 2 10 2z" fill="#000"/>
            </svg>
            카카오 로그인
          </button>
        </div>
      </div>

      {/* ID/PW 찾기 모달 */}
      {showFindModal && (
        <div className="find-modal-overlay" onClick={handleCloseFindModal}>
          <div className="find-modal" onClick={(e) => e.stopPropagation()}>
            <div className="find-modal-header">
              <h2>{findType === 'id' ? 'ID 찾기' : '비밀번호 찾기'}</h2>
              <button className="find-modal-close" onClick={handleCloseFindModal}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div className="find-modal-body">
              {!findResult ? (
                <form onSubmit={findType === 'id' 
                  ? (findIdStep === 'request' ? handleFindIdRequest : handleFindIdConfirm)
                  : handleFindPassword}>
                  {findType === 'id' && findIdStep === 'confirm' ? (
                    // ID 찾기 - 인증코드 입력 단계
                    <>
                      <div className="form-group">
                        <label htmlFor="findCode" className="form-label">
                          인증코드 <span className="required">*</span>
                          {timeLeft > 0 && (
                            <span className="code-timer">
                              ({Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')})
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          id="findCode"
                          value={findFormData.code}
                          onChange={(e) => setFindFormData({ ...findFormData, code: e.target.value })}
                          placeholder="이메일로 받은 인증코드를 입력하세요"
                          className="form-input"
                          required
                          maxLength={6}
                          disabled={timeLeft <= 0}
                        />
                        <p className="form-hint">
                          {timeLeft > 0 
                            ? `이메일로 발송된 인증코드를 입력해주세요. (유효시간: 5분, 입력 제한: 3분)`
                            : '인증코드 입력 시간이 만료되었습니다. 다시 인증코드를 요청해주세요.'}
                        </p>
                      </div>
                      {findError && <div className="error-message">{findError}</div>}
                      {timeLeft <= 0 && (
                        <div className="error-message">
                          인증코드 입력 시간이 만료되었습니다. 다시 인증코드를 요청해주세요.
                        </div>
                      )}
                      <div className="find-modal-actions">
                        <button 
                          type="button" 
                          className="find-modal-btn cancel" 
                          onClick={() => {
                            setFindIdStep('request');
                            setFindFormData({ ...findFormData, code: '' });
                            setFindError('');
                            setTimeLeft(180);
                            // 타이머 정리
                            if (codeTimer) {
                              clearInterval(codeTimer);
                              setCodeTimer(null);
                            }
                          }}
                        >
                          이전
                        </button>
                        <button 
                          type="submit" 
                          className="find-modal-btn submit"
                          disabled={timeLeft <= 0}
                        >
                          확인
                        </button>
                      </div>
                    </>
                  ) : findType === 'id' ? (
                    // ID 찾기 - 이름/전화번호 입력 단계
                    <>
                      <div className="form-group">
                        <label htmlFor="findName" className="form-label">
                          이름 <span className="required">*</span>
                        </label>
                        <input
                          type="text"
                          id="findName"
                          value={findFormData.name}
                          onChange={(e) => setFindFormData({ ...findFormData, name: e.target.value })}
                          placeholder="이름을 입력하세요"
                          className="form-input"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="findPhone" className="form-label">
                          전화번호 <span className="required">*</span>
                        </label>
                        <input
                          type="tel"
                          id="findPhone"
                          value={findFormData.phone}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^0-9]/g, '');
                            if (value.length > 11) value = value.slice(0, 11);
                            if (value.length > 7) {
                              value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
                            } else if (value.length > 3) {
                              value = value.slice(0, 3) + '-' + value.slice(3);
                            }
                            setFindFormData({ ...findFormData, phone: value });
                          }}
                          placeholder="010-1234-5678"
                          className="form-input"
                          required
                        />
                      </div>
                      {findError && <div className="error-message">{findError}</div>}
                      <div className="find-modal-actions">
                        <button type="button" className="find-modal-btn cancel" onClick={handleCloseFindModal}>
                          취소
                        </button>
                        <button type="submit" className="find-modal-btn submit">
                          인증코드 받기
                        </button>
                      </div>
                    </>
                  ) : (
                    // 비밀번호 찾기 (이메일만 입력)
                    <>
                      <div className="form-group">
                        <label htmlFor="findUserId" className="form-label">
                          이메일(아이디) <span className="required">*</span>
                        </label>
                        <input
                          type="email"
                          id="findUserId"
                          value={findFormData.userId}
                          onChange={(e) => setFindFormData({ ...findFormData, userId: e.target.value })}
                          placeholder="이메일(아이디)를 입력하세요"
                          className="form-input"
                          required
                        />
                      </div>

                      {findError && <div className="error-message">{findError}</div>}

                      <div className="find-modal-actions">
                        <button type="button" className="find-modal-btn cancel" onClick={handleCloseFindModal}>
                          취소
                        </button>
                        <button type="submit" className="find-modal-btn submit">
                          재설정 링크 발송
                        </button>
                      </div>
                    </>
                  )}
                </form>
              ) : (
                <div className="find-result">
                  <div className="find-result-icon">
                    {findResult.type === 'id' ? '✓' : '🔑'}
                  </div>
                  <div className="find-result-message">
                    {findResult.message}
                  </div>
                  {findResult.type === 'id' && (
                    <>
                      <div className="find-password-link">
                        <button 
                          type="button" 
                          className="find-password-btn"
                          onClick={() => {
                            // 비밀번호 찾기로 전환 (모든 입력값 초기화)
                            setFindType('password');
                            setFindFormData({
                              name: '',
                              phone: '',
                              userId: '',
                              code: ''
                            });
                            setFindResult(null);
                            setFindError('');
                            setFindIdStep('request');
                          }}
                        >
                          비밀번호 찾기
                        </button>
                      </div>
                    </>
                  )}
                  {findResult.type === 'password' && (
                    <div className="find-result-password">
                      <div className="temp-password-box">
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                          <div style={{ fontSize: '48px', marginBottom: '15px' }}>📧</div>
                          <h3 style={{ marginBottom: '15px', color: '#333' }}>이메일을 확인해주세요</h3>
                          <p style={{ color: '#666', lineHeight: '1.6', marginBottom: '20px' }}>
                            비밀번호 재설정 링크가 이메일로 발송되었습니다.
                            <br />
                            이메일의 링크를 클릭하여 비밀번호를 재설정하세요.
                          </p>
                          <div style={{ 
                            padding: '15px', 
                            backgroundColor: '#f8f9fa', 
                            borderRadius: '5px',
                            marginTop: '20px'
                          }}>
                            <p style={{ fontSize: '12px', color: '#999', margin: 0 }}>
                              💡 이메일이 보이지 않는다면 스팸함을 확인해주세요.
                              <br />
                              ※ 링크는 15분간 유효합니다.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="find-modal-actions">
                    <button 
                      type="button" 
                      className="find-modal-btn submit" 
                      onClick={handleCloseFindModal}
                    >
                      확인
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;

