import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isLoggedIn, deleteCookie, getCookie } from '../utils/cookie';
import { allProducts } from '../utils/products';
import CategorySidebar from './CategorySidebar';
import './Header.css';

function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const categoryMenuRef = useRef(null);
  const searchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 로그인 상태 확인 함수
  const checkLoginStatus = () => {
    setLoggedIn(isLoggedIn());
  };

  useEffect(() => {
    // 컴포넌트 마운트 시 로그인 상태 확인
    checkLoginStatus();

    // 주기적으로 로그인 상태 확인 (쿠키 변경 감지)
    const interval = setInterval(() => {
      checkLoginStatus();
    }, 500);

    // location 변경 시에도 로그인 상태 확인
    checkLoginStatus();

    return () => clearInterval(interval);
  }, [location]);

  // 검색어 변경 핸들러
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
    } else {
      // 상품명에 한 글자라도 포함되면 검색 결과에 포함 (대소문자 구분 없음)
      const queryLower = query.toLowerCase();
      const results = allProducts.filter(product =>
        product.name.toLowerCase().includes(queryLower)
      );
      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    }
  };

  // 검색 결과 클릭 핸들러
  const handleSearchResultClick = (productId) => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchResults(false);
    navigate(`/product/${productId}`);
  };

  // 외부 클릭 시 검색 결과 닫기
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchResults(false);
      }
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setShowCategoryMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLogoutClick = () => {
    deleteCookie('isLoggedIn');
    deleteCookie('username');
    setLoggedIn(false);
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-top">
        <div className="header-container">
          <Link to="/" className="logo">
            <h1>
              <span className="logo-moodly">Moodly</span>
            </h1>
          </Link>
          <div className="search-container" ref={searchRef}>
            <div className="search-input-wrapper">
              <svg 
                className="search-icon" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input
                type="text"
                className="search-input"
                placeholder="상품 검색..."
                value={searchQuery}
                onChange={handleSearchChange}
                onFocus={() => searchQuery && setShowSearchResults(true)}
              />
            </div>
            {showSearchResults && searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map((product) => (
                  <div
                    key={product.id}
                    className="search-result-item"
                    onClick={() => handleSearchResultClick(product.id)}
                  >
                    <img src={product.image} alt={product.name} className="search-result-image" />
                    <div className="search-result-info">
                      <p className="search-result-name">{product.name}</p>
                      <p className="search-result-price">{product.price.toLocaleString()}원</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="header-icons">
            <div 
              className="category-menu-wrapper"
              ref={categoryMenuRef}
              onMouseEnter={() => setShowCategoryMenu(true)}
              onMouseLeave={() => setShowCategoryMenu(false)}
            >
              <button 
                className="icon-link category-icon-btn" 
                title="카테고리"
              >
                <svg 
                  className="header-icon" 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              </button>
              {showCategoryMenu && (
                <CategorySidebar 
                  onClose={() => setShowCategoryMenu(false)} 
                />
              )}
            </div>
            <Link to="/mypage" className="icon-link" title="마이페이지">
              <svg 
                className="header-icon" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </Link>
            <Link to="/cart" className="icon-link" title="장바구니">
              <svg 
                className="header-icon cart-icon" 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
            </Link>
          </div>
        </div>
      </div>
      <div className="header-bottom">
        <div className="header-container">
          {loggedIn ? (
            <button className="logout-button" onClick={handleLogoutClick}>
              로그아웃
            </button>
          ) : (
            <div className="auth-buttons">
              <button className="signup-button" onClick={() => navigate('/signup')}>
                회원가입
              </button>
              <button className="login-button" onClick={handleLoginClick}>
                로그인
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;

