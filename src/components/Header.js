import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { isLoggedIn, clearAuthCookies } from '../utils/cookie';
import { logout as authLogout } from '../utils/authApi';
import {
  searchProducts,
  getNotificationsApi,
  getUnreadNotificationCountApi,
  markNotificationAsReadApi,
  markAllNotificationsAsReadApi,
  deleteNotificationApi,
  deleteAllNotificationsApi,
} from '../utils/api';
import { getUserIdFromToken } from '../utils/token';
import { getAccessToken } from '../utils/token';
import CategorySidebar from './CategorySidebar';
import './Header.css';

const NOTIFICATION_API_BASE_URL = process.env.REACT_APP_NOTIFICATION_API_BASE_URL || 'http://localhost:8086';

function NotificationCloseIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

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
  const sseEventSourceRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 로그인 상태 확인 함수
  const checkLoginStatus = () => {
    setLoggedIn(isLoggedIn());
  };

  const mapNotificationItem = (n) => ({
    id: n.id,
    title: n.title,
    message: n.notificationMessage || n.message || n.notification_message,
    link: n.link,
    read: n.isRead === true || n.is_read === true,
    createdAt: n.createdAt || n.created_at
  });

  /** 서버 기준 읽지 않은 개수만 갱신 (배지용) */
  const refreshUnreadCount = async () => {
    if (!isLoggedIn()) return;
    const userId = getUserIdFromToken();
    if (userId == null || Number.isNaN(userId)) return;
    const countResult = await getUnreadNotificationCountApi(userId);
    if (countResult.success) {
      const c = countResult.data;
      const n = typeof c === 'number' && !Number.isNaN(c) ? c : Number(c) || 0;
      setUnreadCount(n);
    }
  };

  // 알림 목록 가져오기
  const loadNotifications = async () => {
    if (!isLoggedIn()) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const userId = getUserIdFromToken();
      if (!userId) {
        return;
      }

      const notificationsResult = await getNotificationsApi(0, 20, userId);
      if (notificationsResult.success && notificationsResult.data) {
        const content = notificationsResult.data.content || notificationsResult.data || [];
        const mappedNotifications = content.map(mapNotificationItem);
        setNotifications(mappedNotifications);
      } else {
        setNotifications([]);
      }

      await refreshUnreadCount();
    } catch (error) {
      console.error('알림 로드 오류:', error);
    }
  };

  /** SSE data: JSON 한 번 또는 이중 문자열 인코딩 모두 처리 */
  const parseSseNotification = (raw) => {
    if (raw == null || raw === '') return null;
    try {
      let v = JSON.parse(raw);
      if (typeof v === 'string') {
        v = JSON.parse(v);
      }
      return v && typeof v === 'object' ? v : null;
    } catch {
      return null;
    }
  };

    // SSE 연결 시작
    const startSSE = () => {
        if (!isLoggedIn()) {
            return;
        }

        const userId = getUserIdFromToken();
        if (!userId) {
            console.warn('SSE 연결 실패: userId를 가져올 수 없습니다.');
            return;
        }

        // 기존 연결이 있으면 닫기
        if (sseEventSourceRef.current) {
            sseEventSourceRef.current.close();
        }

        try {
            const url = `${NOTIFICATION_API_BASE_URL}/notification/sse?userId=${userId}`;
            const eventSource = new EventSource(url);

      eventSource.onopen = () => {
        console.log('[SSE] 연결 성공');
      };

      eventSource.addEventListener('notification', (event) => {
        try {
          const notification = JSON.parse(event.data);
          console.log('[SSE] 알림 수신:', notification);
          if (!notification) {
            refreshUnreadCount();
            return;
          }

          const mapped = mapNotificationItem(notification);
          setNotifications((prev) => {
            const rest = prev.filter((x) => x.id !== mapped.id);
            return [mapped, ...rest];
          });

          // 읽지 않은 알림 개수 증가
          if (!notification.isRead) {
            setUnreadCount(prev => prev + 1);
          }

          // 알림 목록 새로고침
          loadNotifications();
        } catch (error) {
          console.error('[SSE] 알림 파싱 오류:', error);
        }
      });

      eventSource.addEventListener('heartbeat', (event) => {
        console.log('[SSE] Heartbeat:', event.data);
      });

      eventSource.onerror = (error) => {
        console.error('[SSE] 연결 오류:', error);
        eventSource.close();
        
        // 3초 후 재연결 시도
        setTimeout(() => {
          if (isLoggedIn()) {
            startSSE();
          }
        }, 3000);
      };

      sseEventSourceRef.current = eventSource;
    } catch (error) {
      console.error('[SSE] 연결 실패:', error);
    }
  };

  // SSE 연결 종료
  const stopSSE = () => {
    if (sseEventSourceRef.current) {
      sseEventSourceRef.current.close();
      sseEventSourceRef.current = null;
    }
  };

  useEffect(() => {
    checkLoginStatus();

    if (isLoggedIn()) {
      loadNotifications();
      startSSE();
    } else {
      stopSSE();
      setNotifications([]);
      setUnreadCount(0);
    }

    checkLoginStatus();

    return () => {
      stopSSE();
    };
  }, [location]);

  // SSE가 끊기거나 백그라운드 탭에서 놓친 알림: 주기적으로 읽지 않은 개수만 동기화
  useEffect(() => {
    if (!isLoggedIn()) return undefined;
    refreshUnreadCount();
    const t = setInterval(() => refreshUnreadCount(), 15000);
    const onVis = () => {
      if (document.visibilityState === 'visible') {
        refreshUnreadCount();
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
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
  const handleNotificationClick = async (notification) => {
    if (!notification.read) {
      try {
        const userId = getUserIdFromToken();
        if (userId) {
          await markNotificationAsReadApi(notification.id, userId);
          loadNotifications();
        }
      } catch (error) {
        console.error('알림 읽음 처리 오류:', error);
      }
    }
    setShowNotificationMenu(false);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  // 모든 알림 읽음 처리
  const handleMarkAllAsRead = async () => {
    if (!isLoggedIn()) {
      return;
    }

    try {
      const userId = getUserIdFromToken();
      if (userId) {
        await markAllNotificationsAsReadApi(userId);
        loadNotifications();
      }
    } catch (error) {
      console.error('모든 알림 읽음 처리 오류:', error);
    }
  };

  const handleDeleteNotification = async (e, notificationId) => {
    e.stopPropagation();
    if (!isLoggedIn()) return;

    try {
      const userId = getUserIdFromToken();
      if (!userId) return;

      const result = await deleteNotificationApi(notificationId, userId);
      if (result.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
        await refreshUnreadCount();
      }
    } catch (error) {
      console.error('알림 삭제 오류:', error);
    }
  };

  const handleDeleteAllNotifications = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn() || notifications.length === 0) return;

    try {
      const userId = getUserIdFromToken();
      if (!userId) return;

      const result = await deleteAllNotificationsApi(userId);
      if (result.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('모든 알림 삭제 오류:', error);
    }
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleLogoutClick = async () => {
    try {
      // SSE 연결 종료
      stopSSE();
      
      // auth-service의 logout API 호출 및 토큰 삭제
      await authLogout();
      
      clearAuthCookies();
      
      // 로그인 상태 업데이트
      setLoggedIn(false);
      setNotifications([]);
      setUnreadCount(0);
      
      // 홈으로 이동
      navigate('/');
      
      // 페이지 새로고침하여 모든 상태 초기화
      window.location.reload();
    } catch (error) {
      console.error('로그아웃 중 오류:', error);
      // 에러가 발생해도 로그아웃 처리
      stopSSE();
      clearAuthCookies();
      setLoggedIn(false);
      setNotifications([]);
      setUnreadCount(0);
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
                onClick={() => {
                  setShowNotificationMenu(!showNotificationMenu);
                  if (!showNotificationMenu) {
                    loadNotifications();
                  }
                }}
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
                            type="button"
                            className="notification-icon-dismiss-btn notification-header-dismiss-btn"
                            title="모든 알림 삭제"
                            aria-label="모든 알림 삭제"
                            onClick={handleDeleteAllNotifications}
                          >
                            <NotificationCloseIcon />
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
                              <div className="notification-title">{notification.title || '알림'}</div>
                              <div className="notification-message">
                                {notification.message || notification.notificationMessage || notification.notification_message || ''}
                              </div>
                              <div className="notification-time">
                                {(notification.createdAt || notification.created_at)
                                  ? new Date(notification.createdAt || notification.created_at).toLocaleDateString('ko-KR', {
                                      month: 'long',
                                      day: 'numeric',
                                    })
                                  : ''}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="notification-icon-dismiss-btn notification-item-dismiss-btn"
                              title="알림 삭제"
                              aria-label="알림 삭제"
                              onClick={(e) => handleDeleteNotification(e, notification.id)}
                            >
                              <NotificationCloseIcon />
                            </button>
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
