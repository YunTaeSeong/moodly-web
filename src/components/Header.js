import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isLoggedIn, deleteCookie, getCookie, isAdmin } from '../utils/cookie';
import { logout as authLogout } from '../utils/authApi';
import { allProducts } from '../utils/products';
import { searchProducts } from '../utils/api';
import { getNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead, deleteAllNotifications } from '../utils/notification';
import CategorySidebar from './CategorySidebar';
import './Header.css';

function Header() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const categoryMenuRef = useRef(null);
  const searchRef = useRef(null);
  const notificationRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 로그인 상태 확인 함수
  const checkLoginStatus = () => {
    setLoggedIn(isLoggedIn());
  };

  // 알림 목록 가져오기
  const loadNotifications = () => {
    if (isLoggedIn()) {
      const userEmail = getCookie('userEmail') || '';
      const username = getCookie('username') || 'test';
      const userId = isAdmin() ? 'admin' : (userEmail || username);
      const userNotifications = getNotifications(userId);
      setNotifications(userNotifications);
      setUnreadCount(getUnreadNotificationCount(userId));
    }
  };

  useEffect(() => {
    // 컴포넌트 마운트 시 로그인 상태 확인
    checkLoginStatus();
    loadNotifications();

    // 주기적으로 로그인 상태 확인 (쿠키 변경 감지)
    const interval = setInterval(() => {
      checkLoginStatus();
      loadNotifications();
    }, 1000);

    // location 변경 시에도 로그인 상태 확인
    checkLoginStatus();
    loadNotifications();

    return () => clearInterval(interval);
  }, [location]);

  // 검색어 변경 핸들러
  const handleSearchChange = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setSearchResults([]);
      setShowSearchResults(false);
    } else {
      // API 호출로 상품 검색
      try {
        const result = await searchProducts(query);
        if (result.success && result.data) {
          // API 응답을 프론트엔드 형식으로 변환
          const formattedResults = result.data.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price ? parseFloat(product.price) : 0,
            image: product.image || ''
          }));
          setSearchResults(formattedResults);
          setShowSearchResults(formattedResults.length > 0);
        } else {
          setSearchResults([]);
          setShowSearchResults(false);
        }
      } catch (error) {
        console.error('검색 오류:', error);
        setSearchResults([]);
        setShowSearchResults(false);
      }
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
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 알림 클릭 핸들러
  const handleNotificationClick = (notification) => {
    markNotificationAsRead(notification.id);
    loadNotifications();
    setShowNotificationMenu(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = () => {
    if (isLoggedIn()) {
      const userEmail = getCookie('userEmail') || '';
      const username = getCookie('username') || 'test';
      const userId = isAdmin() ? 'admin' : (userEmail || username);
      markAllNotificationsAsRead(userId);
      loadNotifications();
    }
  };

  // 모든 알림 삭제
  const handleDeleteAllNotifications = () => {
    if (isLoggedIn()) {
      if (window.confirm('모든 알림을 삭제하시겠습니까?')) {
        const userEmail = getCookie('userEmail') || '';
        const username = getCookie('username') || 'test';
        const userId = isAdmin() ? 'admin' : (userEmail || username);
        deleteAllNotifications(userId);
        loadNotifications();
        setShowNotificationMenu(false); // 알림 드롭다운 닫기
      }
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLogoutClick = async () => {
    try {
      // auth-service의 logout API 호출 및 토큰 삭제
      await authLogout();
      
      // 쿠키도 삭제 (기존 코드 호환성)
      deleteCookie('isLoggedIn');
      deleteCookie('username');
      deleteCookie('userEmail');
      
      // 로그인 상태 업데이트
      setLoggedIn(false);
      
      // 홈으로 이동
      navigate('/');
      
      // 페이지 새로고침하여 모든 상태 초기화
      window.location.reload();
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      // 에러가 발생해도 로그아웃 처리
      deleteCookie('isLoggedIn');
      deleteCookie('username');
      deleteCookie('userEmail');
      setLoggedIn(false);
      navigate('/');
      window.location.reload();
    }
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
            {loggedIn && (
              <div 
                className="notification-wrapper"
                ref={notificationRef}
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              >
                <button className="icon-link notification-icon-btn" title="알림">
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
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                  </svg>
                  {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                  )}
                </button>
                {showNotificationMenu && (
                  <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                      <h3>알림</h3>
                      <div className="notification-header-actions">
                        {unreadCount > 0 && (
                          <button 
                            className="mark-all-read-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAllAsRead();
                            }}
                          >
                            모두 읽음
                          </button>
                        )}
                        {notifications.length > 0 && (
                          <button 
                            className="delete-all-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAllNotifications();
                            }}
                          >
                            모두 삭제
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="notification-list">
                      {notifications.length === 0 ? (
                        <div className="notification-empty">
                          <p>알림이 없습니다</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`notification-item ${!notification.read ? 'unread' : ''}`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="notification-content">
                              <div className="notification-title">{notification.title}</div>
                              <div className="notification-message">{notification.message}</div>
                              <div className="notification-time">
                                {new Date(notification.createdAt).toLocaleString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                            {!notification.read && <div className="notification-dot"></div>}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
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

