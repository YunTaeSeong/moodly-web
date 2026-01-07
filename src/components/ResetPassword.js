import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset } from '../utils/api';
import './Login.css';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  
  const [formData, setFormData] = useState({
    newPassword: '',
    rePassword: ''
  });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [passwordMatchStatus, setPasswordMatchStatus] = useState(null); // 'match', 'mismatch', null

  useEffect(() => {
    if (!token) {
      setErrors({ general: '유효하지 않은 링크입니다.' });
    }
  }, [token]);

  // 비밀번호 입력 핸들러 (8-20자 제한)
  const handlePasswordChange = (e) => {
    let value = e.target.value;
    // 20자 제한
    if (value.length > 20) {
      value = value.slice(0, 20);
    }
    
    setFormData(prev => ({
      ...prev,
      newPassword: value
    }));

    // 에러 초기화
    if (errors.newPassword) {
      setErrors(prev => ({
        ...prev,
        newPassword: ''
      }));
    }

    // 비밀번호 확인과 비교
    if (formData.rePassword) {
      if (value === formData.rePassword) {
        setPasswordMatchStatus('match');
      } else {
        setPasswordMatchStatus('mismatch');
      }
    } else {
      setPasswordMatchStatus(null);
    }
  };

  // 비밀번호 확인 입력 핸들러
  const handleRePasswordChange = (e) => {
    const value = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      rePassword: value
    }));

    // 에러 초기화
    if (errors.rePassword) {
      setErrors(prev => ({
        ...prev,
        rePassword: ''
      }));
    }

    // 비밀번호와 비교
    if (formData.newPassword) {
      if (value === formData.newPassword) {
        setPasswordMatchStatus('match');
      } else {
        setPasswordMatchStatus('mismatch');
      }
    } else {
      setPasswordMatchStatus(null);
    }
  };

  // 유효성 검사
  const validate = () => {
    const newErrors = {};

    // 비밀번호 검사 (영문, 숫자, 특수문자 포함 8-20자)
    if (!formData.newPassword) {
      newErrors.newPassword = '비밀번호를 입력해주세요.';
    } else if (formData.newPassword.length < 8 || formData.newPassword.length > 20) {
      newErrors.newPassword = '비밀번호는 8-20자로 입력해주세요.';
    } else {
      // 영문, 숫자, 특수문자 각각 포함 여부 확인
      const hasLetter = /[a-zA-Z]/.test(formData.newPassword);
      const hasNumber = /[0-9]/.test(formData.newPassword);
      const hasSpecial = /[!@#$%^&*]/.test(formData.newPassword);
      
      if (!hasLetter || !hasNumber || !hasSpecial) {
        newErrors.newPassword = '비밀번호는 영문, 숫자, 특수문자를 모두 포함하여 입력해주세요.';
      }
    }

    // 비밀번호 확인
    if (!formData.rePassword) {
      newErrors.rePassword = '비밀번호 확인을 입력해주세요.';
    } else {
      // 비밀번호가 유효한지 먼저 확인
      const isPasswordValid = formData.newPassword.length >= 8 && 
                              formData.newPassword.length <= 20 &&
                              /[a-zA-Z]/.test(formData.newPassword) &&
                              /[0-9]/.test(formData.newPassword) &&
                              /[!@#$%^&*]/.test(formData.newPassword);
      
      if (!isPasswordValid) {
        newErrors.rePassword = '비밀번호가 유효하지 않습니다.';
      } else if (formData.newPassword !== formData.rePassword) {
        newErrors.rePassword = '비밀번호가 일치하지 않습니다.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccess(false);

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await confirmPasswordReset(token, formData.newPassword, formData.rePassword);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setErrors({ general: result.message || '비밀번호 재설정에 실패했습니다.' });
      }
    } catch (error) {
      console.error('비밀번호 재설정 오류:', error);
      setErrors({ general: '비밀번호 재설정 중 오류가 발생했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1 className="login-title">비밀번호 재설정</h1>
          <div className="error-message">{errors.general || '유효하지 않은 링크입니다.'}</div>
          <button 
            type="button" 
            className="login-submit-button" 
            onClick={() => navigate('/login')}
          >
            로그인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1 className="login-title">비밀번호 재설정</h1>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>✓</div>
            <p style={{ fontSize: '18px', marginBottom: '10px' }}>비밀번호가 성공적으로 변경되었습니다.</p>
            <p style={{ fontSize: '14px', color: '#7f8c8d' }}>잠시 후 로그인 페이지로 이동합니다...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">비밀번호 재설정</h1>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="newPassword">새 비밀번호</label>
            <input
              type="password"
              id="newPassword"
              value={formData.newPassword}
              onChange={handlePasswordChange}
              placeholder="영문, 숫자, 특수문자 포함 8-20자"
              required
              maxLength={20}
            />
            {errors.newPassword && (
              <div style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {errors.newPassword}
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="rePassword">새 비밀번호 확인</label>
            <input
              type="password"
              id="rePassword"
              value={formData.rePassword}
              onChange={handleRePasswordChange}
              placeholder="새 비밀번호를 다시 입력하세요"
              required
              maxLength={20}
            />
            {errors.rePassword && (
              <div style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                {errors.rePassword}
              </div>
            )}
            {passwordMatchStatus === 'match' && formData.rePassword && (
              <div style={{ color: '#27ae60', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                ✓ 비밀번호가 일치합니다.
              </div>
            )}
            {passwordMatchStatus === 'mismatch' && formData.rePassword && (
              <div style={{ color: '#e74c3c', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                비밀번호가 일치하지 않습니다.
              </div>
            )}
          </div>
          {errors.general && <div className="error-message">{errors.general}</div>}
          <button 
            type="submit" 
            className="login-submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? '처리 중...' : '비밀번호 변경'}
          </button>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <button 
              type="button" 
              className="find-link"
              onClick={() => navigate('/login')}
            >
              로그인으로 돌아가기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;

