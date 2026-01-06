import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { setCookie } from '../utils/cookie';
import { authenticateUser, findPassword } from '../utils/user';
import { login } from '../utils/authApi';
import { requestFindId, confirmFindId } from '../utils/api';
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

  // 비밀번호 찾기
  const handleFindPassword = (e) => {
    e.preventDefault();
    setFindError('');
    setFindResult(null);

    if (!findFormData.userId || !findFormData.name || !findFormData.phone) {
      setFindError('모든 정보를 입력해주세요.');
      return;
    }

    const result = findPassword(findFormData.userId, findFormData.name, findFormData.phone);
    if (result.success) {
      setFindResult({
        type: 'password',
        message: `임시 비밀번호가 발급되었습니다.`,
        tempPassword: result.tempPassword
      });
    } else {
      setFindError(result.message);
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
                    // 비밀번호 찾기
                    <>
                      <div className="form-group">
                        <label htmlFor="findUserId" className="form-label">
                          아이디(이메일) <span className="required">*</span>
                        </label>
                        <input
                          type="email"
                          id="findUserId"
                          value={findFormData.userId}
                          onChange={(e) => setFindFormData({ ...findFormData, userId: e.target.value })}
                          placeholder="아이디(이메일)를 입력하세요"
                          className="form-input"
                          required
                        />
                      </div>
                      
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
                          찾기
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
                        <strong>임시 비밀번호:</strong>
                        <div className="temp-password">{findResult.tempPassword}</div>
                        <p className="temp-password-warning">
                          ⚠️ 보안을 위해 로그인 후 비밀번호를 변경해주세요.
                        </p>
                        <p className="temp-password-info">
                          비밀번호 변경은 마이페이지 → 보안설정에서 할 수 있습니다.
                        </p>
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

