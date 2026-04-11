import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { isLoggedIn } from '../utils/cookie';
import { registerUser, checkUserEmailAvailable } from '../utils/api';
import './Signup.css';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: ''
  });

  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [userIdStatus, setUserIdStatus] = useState(null); // 'checking', 'duplicate', 'available'
  const [passwordMatchStatus, setPasswordMatchStatus] = useState(null); // 'match', 'mismatch', null

  // 아이디 중복 체크를 위한 상태
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const emailCheckSeqRef = React.useRef(0);

  // 로그인 상태 체크
  React.useEffect(() => {
    if (isLoggedIn()) {
      navigate('/');
    }
  }, [navigate]);

  // 아이디 입력 핸들러 (4-20자 제한)
  const handleUserIdChange = (e) => {
    emailCheckSeqRef.current += 1;
    let value = e.target.value;
    // 20자 제한
    if (value.length > 20) {
      value = value.slice(0, 20);
    }

    setFormData(prev => ({
      ...prev,
      userId: value
    }));

    // 에러 초기화
    if (errors.userId) {
      setErrors(prev => ({
        ...prev,
        userId: ''
      }));
    }

    // blur 전까지는 서버 미확인 — 입력 변경 시 상태만 초기화
    setUserIdStatus(null);
  };

  const handleUserIdBlur = async (e) => {
    const value = e.target.value.trim();
    if (
      !value ||
      value.length < 4 ||
      value.length > 20 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    ) {
      setUserIdStatus(null);
      return;
    }

    const seq = emailCheckSeqRef.current;
    setUserIdStatus('checking');
    const result = await checkUserEmailAvailable(value);
    if (seq !== emailCheckSeqRef.current) {
      return;
    }
    if (!result.success) {
      setUserIdStatus(null);
      return;
    }
    if (result.exists) {
      setUserIdStatus('duplicate');
      setErrors(prev => ({ ...prev, userId: '사용중인 이메일입니다.' }));
    } else {
      setUserIdStatus('available');
      setErrors(prev => {
        if (prev.userId === '사용중인 이메일입니다.') {
          return { ...prev, userId: '' };
        }
        return prev;
      });
    }
  };

  // 비밀번호 입력 핸들러 (8-20자 제한)
  const handlePasswordChange = (e) => {
    let value = e.target.value;
    // 20자 제한
    if (value.length > 20) {
      value = value.slice(0, 20);
    }
    
    setFormData(prev => ({
      ...prev,
      password: value
    }));

    // 에러 초기화
    if (errors.password) {
      setErrors(prev => ({
        ...prev,
        password: ''
      }));
    }

    // 비밀번호 확인과 비교
    if (formData.confirmPassword) {
      // 일치 여부만 체크 (유효성과 관계없이)
      if (value === formData.confirmPassword) {
        setPasswordMatchStatus('match');
      } else {
        setPasswordMatchStatus('mismatch');
      }
    } else {
      setPasswordMatchStatus(null);
    }
  };

  // 비밀번호 확인 입력 핸들러
  const handleConfirmPasswordChange = (e) => {
    const value = e.target.value;
    
    setFormData(prev => ({
      ...prev,
      confirmPassword: value
    }));

    // 에러 초기화
    if (errors.confirmPassword) {
      setErrors(prev => ({
        ...prev,
        confirmPassword: ''
      }));
    }

    // 비밀번호와 비교
    if (value) {
      // 일치 여부만 체크 (유효성과 관계없이)
      if (value === formData.password) {
        setPasswordMatchStatus('match');
      } else {
        setPasswordMatchStatus('mismatch');
      }
    } else {
      setPasswordMatchStatus(null);
    }
  };

  // 입력값 변경 핸들러 (일반 필드)
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // 에러 초기화
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 유효성 검사
  const validate = () => {
    const newErrors = {};

    // 아이디(이메일) 검사
    if (!formData.userId) {
      newErrors.userId = '아이디(이메일)를 입력해주세요.';
    } else if (formData.userId.length < 4 || formData.userId.length > 20) {
      newErrors.userId = '아이디(이메일)는 4-20자로 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.userId)) {
      newErrors.userId = '올바른 이메일 형식을 입력해주세요.';
    } else if (userIdStatus === 'duplicate') {
      newErrors.userId = '사용중인 이메일입니다.';
    }

    // 비밀번호 검사 (영문, 숫자, 특수문자 포함 8-20자)
    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 8 || formData.password.length > 20) {
      newErrors.password = '비밀번호는 8-20자로 입력해주세요.';
    } else {
      // 영문, 숫자, 특수문자 각각 포함 여부 확인
      const hasLetter = /[a-zA-Z]/.test(formData.password);
      const hasNumber = /[0-9]/.test(formData.password);
      const hasSpecial = /[!@#$%^&*]/.test(formData.password);
      
      if (!hasLetter || !hasNumber || !hasSpecial) {
        newErrors.password = '비밀번호는 영문, 숫자, 특수문자를 모두 포함하여 입력해주세요.';
      }
    }

    // 비밀번호 확인
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else {
      // 비밀번호가 유효한지 먼저 확인
      const isPasswordValid = formData.password.length >= 8 && 
                              formData.password.length <= 20 &&
                              /[a-zA-Z]/.test(formData.password) &&
                              /[0-9]/.test(formData.password) &&
                              /[!@#$%^&*]/.test(formData.password);
      
      if (!isPasswordValid) {
        newErrors.confirmPassword = '비밀번호가 유효하지 않습니다.';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
      }
    }

    // 이름 검사
    if (!formData.name) {
      newErrors.name = '이름을 입력해주세요.';
    } else if (formData.name.length < 2) {
      newErrors.name = '이름은 2자 이상 입력해주세요.';
    }

    // 전화번호 검사
    if (!formData.phone) {
      newErrors.phone = '전화번호를 입력해주세요.';
    } else if (!/^010-\d{4}-\d{4}$/.test(formData.phone)) {
      newErrors.phone = '전화번호는 010-XXXX-XXXX 형식으로 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // 전화번호 자동 포맷팅
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    
    if (value.length > 7) {
      value = value.slice(0, 3) + '-' + value.slice(3, 7) + '-' + value.slice(7);
    } else if (value.length > 3) {
      value = value.slice(0, 3) + '-' + value.slice(3);
    }
    
    setFormData(prev => ({ ...prev, phone: value }));
  };


  // 폼 제출
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (validate()) {
      try {
        setIsCheckingDuplicate(true);
        // API 호출
        const result = await registerUser({
          email: formData.userId,
          password: formData.password,
          rePassword: formData.confirmPassword,
          name: formData.name,
          phoneNumber: formData.phone
        });
        
        if (result.success) {
          window.alert('회원가입이 완료되었습니다!');
          navigate('/');
        } else {
          const errorMessage = result.message || '회원가입에 실패했습니다.';
          const duplicated =
            result.status === 409 ||
            result.code === 'EMAIL_001' ||
            /DUPLICATED_EMAIL|중복|이미 사용/i.test(String(result.message || ''));

          if (duplicated) {
            setErrors(prev => ({ ...prev, userId: '사용중인 이메일입니다.' }));
            setUserIdStatus('duplicate');
          } else {
            window.alert(errorMessage);
          }
        }
      } catch (error) {
        console.error('회원가입 오류:', error);
        let errorMessage = '회원가입에 실패했습니다.';
        
        if (error.status === 400) {
          errorMessage = error.message || '입력 정보를 확인해주세요.';
        } else if (error.status === 0) {
          errorMessage = error.message || '서버에 연결할 수 없습니다. 백엔드 서버(http://localhost:8082)가 실행 중인지 확인해주세요.';
          console.error('원본 에러:', error.originalError);
          console.error('전체 에러 객체:', error);
        } else if (error.status) {
          errorMessage = error.message || `서버 오류가 발생했습니다. (${error.status})`;
        }
        
        window.alert(errorMessage);
      } finally {
        setIsCheckingDuplicate(false);
      }
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-box">
        <div className="signup-header">
          <h1 className="signup-title">회원가입</h1>
          <p className="signup-subtitle">Moodly에 오신 것을 환영합니다</p>
        </div>

        <form onSubmit={handleSubmit} className="signup-form">
          {/* 아이디(이메일) */}
          <div className="form-group">
            <label htmlFor="userId" className="form-label">
              아이디(이메일) <span className="required">*</span>
            </label>
            <input
              type="email"
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleUserIdChange}
              onBlur={handleUserIdBlur}
              placeholder="example@email.com"
              maxLength={20}
              className={`form-input ${errors.userId || userIdStatus === 'duplicate' ? 'error' : userIdStatus === 'available' ? 'success' : ''}`}
            />
            {(errors.userId || userIdStatus === 'duplicate') && (
              <span className="error-message">{errors.userId || '사용중인 이메일입니다.'}</span>
            )}
            {userIdStatus === 'checking' && <span className="checking-message">확인 중...</span>}
          </div>

          {/* 비밀번호 */}
          <div className="form-group">
            <label htmlFor="password" className="form-label">
              비밀번호 <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handlePasswordChange}
                placeholder="영문, 숫자, 특수문자 포함 8-20자"
                maxLength={20}
                className={`form-input ${errors.password ? 'error' : ''}`}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          {/* 비밀번호 확인 */}
          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">
              비밀번호 확인 <span className="required">*</span>
            </label>
            <div className="password-input-wrapper">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="비밀번호를 다시 입력해주세요"
                maxLength={20}
                className={`form-input ${
                  errors.confirmPassword || passwordMatchStatus === 'mismatch' ? 'error' : 
                  passwordMatchStatus === 'match' ? 'success' : ''
                }`}
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            {passwordMatchStatus === 'match' && formData.confirmPassword && (
              <span className="success-message">비밀번호가 같습니다.</span>
            )}
            {passwordMatchStatus === 'mismatch' && formData.confirmPassword && (
              <span className="error-message">비밀번호가 다릅니다.</span>
            )}
            {passwordMatchStatus === 'match' && formData.confirmPassword && 
             (formData.password.length < 8 || !/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password) || !/[!@#$%^&*]/.test(formData.password)) && (
              <span className="error-message">비밀번호가 유효하지 않습니다.</span>
            )}
          </div>

          {/* 이름 */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              이름 <span className="required">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력해주세요"
              className={`form-input ${errors.name ? 'error' : ''}`}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          {/* 전화번호 */}
          <div className="form-group">
            <label htmlFor="phone" className="form-label">
              전화번호 <span className="required">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handlePhoneChange}
              placeholder="010-1234-5678"
              className={`form-input ${errors.phone ? 'error' : ''}`}
            />
            {errors.phone && <span className="error-message">{errors.phone}</span>}
          </div>

          {/* 제출 버튼 */}
          <button 
            type="submit" 
            className="signup-submit-button"
            disabled={isCheckingDuplicate}
          >
            {isCheckingDuplicate ? '처리 중...' : '회원가입'}
          </button>

          {/* 로그인 링크 */}
          <div className="signup-footer">
            <p>
              이미 계정이 있으신가요?{' '}
              <Link to="/login" className="login-link">
                로그인
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Signup;

