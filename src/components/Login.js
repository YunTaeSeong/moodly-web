import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setCookie } from '../utils/cookie';
import { authenticateUser, findUserId, findPassword } from '../utils/user';
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
    userId: ''
  });
  const [findError, setFindError] = useState('');
  const [findResult, setFindResult] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // 기존 테스트 계정 체크
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

    // 회원가입한 사용자 체크
    const user = authenticateUser(username, password);
    if (user) {
      setCookie('isLoggedIn', 'true', 7);
      setCookie('username', user.name, 7);
      setCookie('userEmail', user.userId, 7);
      navigate('/');
    } else {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
    }
  };

  // ID/PW 찾기 모달 열기
  const handleOpenFindModal = (type) => {
    setFindType(type);
    setShowFindModal(true);
    setFindFormData({ name: '', phone: '', userId: '' });
    setFindError('');
    setFindResult(null);
  };

  // ID/PW 찾기 모달 닫기
  const handleCloseFindModal = () => {
    setShowFindModal(false);
    setFindType(null);
    setFindFormData({ name: '', phone: '', userId: '' });
    setFindError('');
    setFindResult(null);
  };

  // ID 찾기
  const handleFindId = (e) => {
    e.preventDefault();
    setFindError('');
    setFindResult(null);

    if (!findFormData.name || !findFormData.phone) {
      setFindError('이름과 전화번호를 모두 입력해주세요.');
      return;
    }

    const result = findUserId(findFormData.name, findFormData.phone);
    if (result.success) {
      setFindResult({
        type: 'id',
        message: `회원님의 아이디는 ${result.userId} 입니다.`,
        fullUserId: result.fullUserId
      });
    } else {
      setFindError(result.message);
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
                <form onSubmit={findType === 'id' ? handleFindId : handleFindPassword}>
                  {findType === 'password' && (
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
                  )}
                  
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
                      <div className="find-result-id">
                        <strong>아이디: {findResult.fullUserId}</strong>
                      </div>
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
                              userId: ''
                            });
                            setFindResult(null);
                            setFindError('');
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

