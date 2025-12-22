import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { setCookie } from '../utils/cookie';
import './Login.css';

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    // 로그인 검증
    if (username === 'test' && password === 'test') {
      // 쿠키에 로그인 정보 저장
      setCookie('isLoggedIn', 'true', 7);
      setCookie('username', username, 7);
      setCookie('userEmail', 'test@test.com', 7);
      
      // 홈으로 이동
      navigate('/');
    } else if (username === 'admin@admin.com' && password === 'admin') {
      // 관리자 계정 로그인
      setCookie('isLoggedIn', 'true', 7);
      setCookie('username', 'admin', 7);
      setCookie('userEmail', 'admin@admin.com', 7);
      
      // 홈으로 이동
      navigate('/');
    } else {
      setError('아이디 또는 비밀번호가 올바르지 않습니다.');
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
          <div className="login-hint">
            <p>테스트 계정: 아이디 - test, 비밀번호 - test</p>
            <p>관리자 계정: 아이디 - admin@admin.com, 비밀번호 - admin</p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Login;

