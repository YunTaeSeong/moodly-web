import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isLoggedIn } from '../utils/cookie';
import { getWishlist, removeFromWishlist } from '../utils/wishlist';
import { getAvailableCoupons, getReceivedCoupons, receiveCoupon, checkCouponExpiry } from '../utils/coupon';
import { getOrders, getOrderCount, addTestOrder } from '../utils/order';
import { getReviewsByAuthor, hasReviewForOrder, saveReview, deleteReview } from '../utils/review';
import { getInquiries, deleteInquiry, updateInquiry } from '../utils/inquiry';
import { getCookie } from '../utils/cookie';
import { allProducts } from '../utils/products';
import { changeMyPassword } from '../utils/api';
import { getUserIdFromToken } from '../utils/token';
import { logout } from '../utils/authApi';
import { deleteCookie } from '../utils/cookie';
import './MyPage.css';

function MyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // URL 경로에서 메뉴 추출
  const getMenuFromPath = () => {
    const path = location.pathname;
    if (path === '/mypage') return 'home';
    if (path === '/mypage/security') return 'security';
    if (path === '/mypage/orders') return 'orders';
    if (path === '/mypage/wishlist') return 'wishlist';
    if (path === '/mypage/reviews') return 'review'; // 경로는 reviews지만 메뉴 ID는 review
    if (path === '/mypage/inquiries') return 'inquiry'; // 경로는 inquiries지만 메뉴 ID는 inquiry
    if (path === '/mypage/coupons') return 'coupon';
    return 'home'; // 기본값
  };
  
  const [activeMenu, setActiveMenu] = useState(getMenuFromPath());
  const [wishlist, setWishlist] = useState([]);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [receivedCoupons, setReceivedCoupons] = useState([]);
  const [orders, setOrders] = useState([]);
  const [orderCount, setOrderCount] = useState(0);
  const [inquiryCount, setInquiryCount] = useState(0);
  const [myReviews, setMyReviews] = useState([]);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [reviewImages, setReviewImages] = useState([]);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [myInquiries, setMyInquiries] = useState([]);
  const [showEditInquiryModal, setShowEditInquiryModal] = useState(false);
  const [editingInquiryId, setEditingInquiryId] = useState(null);
  const [editingInquiryContent, setEditingInquiryContent] = useState('');

  // 찜한 상품 목록 및 주문 내역 가져오기
  useEffect(() => {
    if (isLoggedIn()) {
      setWishlist(getWishlist());
      let allOrders = getOrders();
      
      // 노트북 스탠드 주문이 없으면 추가 (테스트용)
      const laptopStandOrder = allOrders.find(order => 
        order.product && order.product.id === 3 && order.product.name === '노트북 스탠드'
      );
      
      if (!laptopStandOrder) {
        const laptopStand = allProducts.find(p => p.id === 3 && p.name === '노트북 스탠드');
        if (laptopStand) {
          addTestOrder(laptopStand);
          allOrders = getOrders(); // 다시 가져오기
        }
      }
      
      setOrders(allOrders);
      setOrderCount(getOrderCount());
      const username = getCookie('username') || 'test';
      setMyReviews(getReviewsByAuthor(username));
      
      // 상품 문의 건수 가져오기
      const allInquiries = getInquiries();
      setInquiryCount(allInquiries.length);
      
      // 사용자별 상품 문의 가져오기
      const userEmail = getCookie('userEmail') || '';
      const userInquiries = allInquiries.filter(inquiry => 
        inquiry.author === username || inquiry.userEmail === userEmail
      );
      setMyInquiries(userInquiries);
    }
  }, [activeMenu]);

  // URL 경로 변경 시 메뉴 업데이트
  useEffect(() => {
    const menu = getMenuFromPath();
    setActiveMenu(menu);
  }, [location.pathname]);

  // 쿠폰 목록 가져오기
  useEffect(() => {
    if (isLoggedIn() && activeMenu === 'coupon') {
      checkCouponExpiry(); // 만료된 쿠폰 체크
      setAvailableCoupons(getAvailableCoupons());
      setReceivedCoupons(getReceivedCoupons());
    }
  }, [activeMenu]);

  // 보안설정 메뉴 활성화 시 폼 초기화
  useEffect(() => {
    if (activeMenu === 'security') {
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
      setPasswordSuccess(false);
    }
  }, [activeMenu]);

  // 찜한 상품 제거 핸들러
  const handleRemoveWishlist = (productId) => {
    removeFromWishlist(productId);
    setWishlist(getWishlist());
  };

  // 쿠폰 받기 핸들러
  const handleReceiveCoupon = (couponId) => {
    const result = receiveCoupon(couponId);
    if (result.success) {
      window.alert(result.message);
      setAvailableCoupons(getAvailableCoupons());
      setReceivedCoupons(getReceivedCoupons());
    } else {
      window.alert(result.message);
    }
  };

  // 작성 가능한 리뷰 목록 가져오기 (배송 완료 후 30일 이내, 아직 리뷰 미작성)
  const getAvailableReviews = () => {
    const username = getCookie('username') || 'test';
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    return orders.filter(order => {
      // 배송 완료일 기준으로 30일 이내인지 확인
      // deliveredDate가 있으면 그것을 사용, 없으면 estimatedDelivery 또는 orderDate 사용
      let deliveryDate;
      if (order.deliveredDate) {
        deliveryDate = new Date(order.deliveredDate);
      } else if (order.status === '배송완료') {
        // 배송완료 상태이면 배송 완료일로 간주 (estimatedDelivery 또는 orderDate)
        deliveryDate = order.estimatedDelivery 
          ? new Date(order.estimatedDelivery)
          : new Date(order.orderDate);
      } else if (order.estimatedDelivery) {
        // estimatedDelivery가 지났으면 배송 완료로 간주
        const estimated = new Date(order.estimatedDelivery);
        deliveryDate = estimated <= now ? estimated : null;
      } else {
        // 주문일이 지났으면 배송 완료로 간주
        const orderDate = new Date(order.orderDate);
        deliveryDate = orderDate <= now ? orderDate : null;
      }
      
      if (!deliveryDate) return false;
      
      // 배송 완료 후 30일 이내
      const isWithin30Days = deliveryDate >= thirtyDaysAgo;
      // 아직 리뷰를 작성하지 않음
      const hasNoReview = !hasReviewForOrder(order.orderId || order.id);
      // 상품 정보가 있음
      return isWithin30Days && hasNoReview && order.product;
    });
  };

  // 리뷰 작성 모달 열기
  const handleOpenReviewModal = (order) => {
    setSelectedOrder(order);
    setReviewRating(5);
    setReviewContent('');
    setReviewImages([]);
    setShowReviewModal(true);
  };

  // 리뷰 작성 모달 닫기
  const handleCloseReviewModal = () => {
    setShowReviewModal(false);
    setSelectedOrder(null);
    setReviewRating(5);
    setReviewContent('');
    setReviewImages([]);
  };

  // 리뷰 이미지 업로드 핸들러
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (reviewImages.length + files.length > 3) {
      window.alert('최대 3장까지만 업로드 가능합니다.');
      return;
    }

    files.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        window.alert('이미지 파일만 업로드 가능합니다.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setReviewImages((prev) => [...prev, event.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  // 리뷰 이미지 삭제 핸들러
  const handleImageRemove = (index) => {
    setReviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  // 리뷰 작성 제출
  const handleSubmitReview = () => {
    if (!reviewContent.trim()) {
      window.alert('리뷰 내용을 입력해주세요.');
      return;
    }

    if (!selectedOrder || !selectedOrder.product) {
      window.alert('주문 정보를 찾을 수 없습니다.');
      return;
    }

    const username = getCookie('username') || 'test';
    const reviewData = {
      orderId: selectedOrder.orderId || selectedOrder.id,
      productId: selectedOrder.product.id,
      productName: selectedOrder.product.name,
      productImage: selectedOrder.product.image,
      rating: reviewRating,
      content: reviewContent,
      author: username,
      images: reviewImages
    };

    const savedReview = saveReview(reviewData);
    if (savedReview) {
      window.alert('리뷰가 작성되었습니다.');
      setMyReviews(getReviewsByAuthor(username));
      handleCloseReviewModal();
    } else {
      window.alert('리뷰 작성에 실패했습니다.');
    }
  };

  // 리뷰 삭제
  const handleDeleteReview = (reviewId) => {
    if (window.confirm('리뷰를 삭제하시겠습니까?')) {
      if (deleteReview(reviewId)) {
        window.alert('리뷰가 삭제되었습니다.');
        const username = getCookie('username') || 'test';
        setMyReviews(getReviewsByAuthor(username));
      } else {
        window.alert('리뷰 삭제에 실패했습니다.');
      }
    }
  };

  // 상품문의 수정 모달 열기
  const handleOpenEditInquiryModal = (inquiryId, currentContent) => {
    setEditingInquiryId(inquiryId);
    setEditingInquiryContent(currentContent);
    setShowEditInquiryModal(true);
  };

  // 상품문의 수정 모달 닫기
  const handleCloseEditInquiryModal = () => {
    setShowEditInquiryModal(false);
    setEditingInquiryId(null);
    setEditingInquiryContent('');
  };

  // 상품문의 수정 제출
  const handleSubmitEditInquiry = () => {
    if (!editingInquiryId) {
      window.alert('문의를 선택해주세요.');
      return;
    }

    if (!editingInquiryContent.trim()) {
      window.alert('문의 내용을 입력해주세요.');
      return;
    }

    const updatedInquiry = updateInquiry(editingInquiryId, editingInquiryContent.trim());
    
    if (updatedInquiry) {
      window.alert('상품 문의가 수정되었습니다.');
      handleCloseEditInquiryModal();
      // 상품 문의 목록 새로고침
      const allInquiries = getInquiries();
      const userEmail = getCookie('userEmail') || '';
      const username = getCookie('username') || 'test';
      const userInquiries = allInquiries.filter(inquiry => 
        inquiry.author === username || inquiry.userEmail === userEmail
      );
      setMyInquiries(userInquiries);
      setInquiryCount(allInquiries.length);
    } else {
      window.alert('상품 문의 수정에 실패했습니다.');
    }
  };

  // 상품문의 삭제
  const handleDeleteInquiry = (inquiryId) => {
    if (window.confirm('상품 문의를 삭제하시겠습니까?')) {
      if (deleteInquiry(inquiryId)) {
        window.alert('상품 문의가 삭제되었습니다.');
        const allInquiries = getInquiries();
        const userEmail = getCookie('userEmail') || '';
        const username = getCookie('username') || 'test';
        const userInquiries = allInquiries.filter(inquiry => 
          inquiry.author === username || inquiry.userEmail === userEmail
        );
        setMyInquiries(userInquiries);
        setInquiryCount(allInquiries.length);
      } else {
        window.alert('상품 문의 삭제에 실패했습니다.');
      }
    }
  };

  // 상품 정보 가져오기
  const getProductInfo = (productId) => {
    const product = allProducts.find(p => p.id === productId);
    if (product) return product;
    
    // categoryProducts에서 찾기
    try {
      const { getCategoryProductById } = require('../utils/categoryProducts');
      return getCategoryProductById(productId);
    } catch (e) {
      return null;
    }
  };

  // 로그인 체크
  if (!isLoggedIn()) {
    return (
      <div className="mypage-container">
        <div className="mypage-login-required">
          <h2>로그인이 필요합니다</h2>
          <p>마이페이지를 이용하시려면 로그인해주세요.</p>
          <button onClick={() => navigate('/login')} className="login-redirect-btn">
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  // 메뉴 ID를 경로로 변환
  const getPathFromMenuId = (menuId) => {
    const pathMap = {
      'security': '/mypage/security',
      'home': '/mypage',
      'orders': '/mypage/orders',
      'wishlist': '/mypage/wishlist',
      'review': '/mypage/reviews',
      'inquiry': '/mypage/inquiries',
      'coupon': '/mypage/coupons'
    };
    return pathMap[menuId] || '/mypage';
  };

  // 메뉴 클릭 핸들러
  const handleMenuClick = (menuId) => {
    const path = getPathFromMenuId(menuId);
    navigate(path);
  };

  const menuItems = [
    { id: 'security', label: '보안설정' },
    { id: 'home', label: '마이쇼핑 홈' },
    { id: 'orders', label: '주문/배송내역' },
    { id: 'wishlist', label: '찜한 상품' },
    { id: 'review', label: '리뷰 관리' },
    { id: 'inquiry', label: '상품 문의' },
    { id: 'coupon', label: '쿠폰함' }
  ];

  // 비밀번호 변경 핸들러
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordErrors({});
    setPasswordSuccess(false);

    // 유효성 검사
    const errors = {};
    
    if (!passwordForm.currentPassword) {
      errors.currentPassword = '현재 비밀번호를 입력해주세요.';
    }
    
    if (!passwordForm.newPassword) {
      errors.newPassword = '새 비밀번호를 입력해주세요.';
    } else {
      // 비밀번호 유효성 검사 (영문, 숫자, 특수문자 포함 8-20자)
      const passwordRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,20}$/;
      if (!passwordRegex.test(passwordForm.newPassword)) {
        errors.newPassword = '영문, 숫자, 특수문자를 포함하여 8-20자로 입력해주세요.';
      }
    }
    
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = '새 비밀번호 확인을 입력해주세요.';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (Object.keys(errors).length > 0) {
      setPasswordErrors(errors);
      return;
    }

    // JWT 토큰에서 userId 추출
    const userId = getUserIdFromToken();
    if (!userId) {
      setPasswordErrors({ submit: '로그인 정보를 확인할 수 없습니다. 다시 로그인해주세요.' });
      return;
    }

    try {
      // 비밀번호 변경 API 호출
      const result = await changeMyPassword(
        userId,
        passwordForm.currentPassword,
        passwordForm.newPassword,
        passwordForm.confirmPassword
      );

      if (result.success) {
        setPasswordSuccess(true);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        
        // 비밀번호 변경 성공 후 로그아웃 처리
        // 백엔드에서 이미 refresh token을 모두 삭제했으므로, 클라이언트에서만 정리
        setTimeout(async () => {
          // 로그아웃 처리 (서버의 refresh token은 이미 삭제됨)
          await logout();
          deleteCookie('isLoggedIn');
          deleteCookie('userEmail');
          deleteCookie('username');
          
          // 로그인 페이지로 이동
          window.alert('비밀번호가 변경되었습니다. 다시 로그인해주세요.');
          navigate('/login');
        }, 2000);
      } else {
        setPasswordErrors({ submit: result.message || '비밀번호 변경에 실패했습니다.' });
      }
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      setPasswordErrors({ submit: error.message || '비밀번호 변경 중 오류가 발생했습니다.' });
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'security':
        return (
          <div className="mypage-content-section">
            <h2>보안설정</h2>
            <div className="security-content">
              <h3 className="security-subtitle">비밀번호 변경</h3>
              <form onSubmit={handlePasswordChange} className="password-change-form">
                <div className="form-group">
                  <label htmlFor="currentPassword" className="form-label">
                    현재 비밀번호 <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="현재 비밀번호를 입력하세요"
                    className={`form-input ${passwordErrors.currentPassword ? 'error' : ''}`}
                  />
                  {passwordErrors.currentPassword && (
                    <span className="error-message">{passwordErrors.currentPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword" className="form-label">
                    새 비밀번호 <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="영문, 숫자, 특수문자 포함 8-20자"
                    className={`form-input ${passwordErrors.newPassword ? 'error' : ''}`}
                  />
                  {passwordErrors.newPassword && (
                    <span className="error-message">{passwordErrors.newPassword}</span>
                  )}
                  <p className="form-hint">영문, 숫자, 특수문자를 포함하여 8-20자로 입력해주세요.</p>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword" className="form-label">
                    새 비밀번호 확인 <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="새 비밀번호를 다시 입력하세요"
                    className={`form-input ${passwordErrors.confirmPassword ? 'error' : ''}`}
                  />
                  {passwordErrors.confirmPassword && (
                    <span className="error-message">{passwordErrors.confirmPassword}</span>
                  )}
                  {passwordForm.newPassword && passwordForm.confirmPassword && 
                   passwordForm.newPassword === passwordForm.confirmPassword && (
                    <span className="success-message">비밀번호가 일치합니다.</span>
                  )}
                </div>

                {passwordErrors.submit && (
                  <div className="error-message">{passwordErrors.submit}</div>
                )}

                {passwordSuccess && (
                  <div className="success-message-large">
                    ✓ 비밀번호가 성공적으로 변경되었습니다.
                  </div>
                )}

                <div className="form-actions">
                  <button type="submit" className="password-change-btn">
                    비밀번호 변경
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      case 'home':
        return (
          <div className="mypage-content-section">
            <h2>마이쇼핑 홈</h2>
            <div className="mypage-welcome">
              <p>안녕하세요, <strong>test</strong>님!</p>
              <p>오늘도 좋은 하루 되세요.</p>
            </div>
            <div className="mypage-summary">
              <div 
                className="summary-card summary-card-clickable"
                onClick={() => navigate('/mypage/orders')}
              >
                <h3>주문 내역</h3>
                <p className="summary-count">{orderCount}건</p>
              </div>
              <div 
                className="summary-card summary-card-clickable"
                onClick={() => navigate('/mypage/wishlist')}
              >
                <h3>찜한 상품</h3>
                <p className="summary-count">{wishlist.length}개</p>
              </div>
              <div 
                className="summary-card summary-card-clickable"
                onClick={() => navigate('/mypage/inquiries')}
              >
                <h3>상품 문의</h3>
                <p className="summary-count">{inquiryCount}건</p>
              </div>
            </div>
          </div>
        );
      case 'orders':
        return (
          <div className="mypage-content-section">
            <h2>주문/배송내역</h2>
            {orders.length === 0 ? (
              <div className="mypage-empty">
                <p>주문 내역이 없습니다.</p>
              </div>
            ) : (
              <div className="orders-list">
                {orders.map((order) => (
                  <div key={order.id} className="order-item">
                    <div className="order-header">
                      <div className="order-info-left">
                        <span className="order-date">
                          {new Date(order.orderDate).toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                        <span className="order-id">주문번호: {order.orderId}</span>
                      </div>
                      <span className={`order-status ${order.status === '결제완료' ? 'paid' : order.status === '배송중' ? 'shipping' : 'delivered'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="order-content">
                      <div className="order-product">
                        <img 
                          src={order.product?.image || 'https://via.placeholder.com/100'} 
                          alt={order.orderName}
                          className="order-product-image"
                        />
                        <div className="order-product-info">
                          <h4 className="order-product-name">{order.orderName}</h4>
                          <p className="order-product-quantity">수량: {order.quantity}개</p>
                          {order.coupon && (
                            <p className="order-coupon-used">
                              쿠폰 적용: {order.coupon.name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="order-summary">
                        <div className="order-amount-row">
                          <span>상품금액</span>
                          <span>{(order.product?.price * order.quantity || order.amount).toLocaleString()}원</span>
                        </div>
                        {order.discountAmount > 0 && (
                          <div className="order-amount-row discount">
                            <span>쿠폰 할인</span>
                            <span>-{order.discountAmount.toLocaleString()}원</span>
                          </div>
                        )}
                        <div className="order-amount-row total">
                          <span>결제금액</span>
                          <span className="order-total-amount">{order.amount.toLocaleString()}원</span>
                        </div>
                      </div>
                    </div>
                    {order.deliveryAddress && (
                      <div className="order-delivery">
                        <span className="delivery-label">배송지:</span>
                        <span className="delivery-address">
                          {order.deliveryAddress.postcode && `[${order.deliveryAddress.postcode}] `}
                          {order.deliveryAddress.address}
                          {order.deliveryAddress.recipient && ` (${order.deliveryAddress.recipient})`}
                        </span>
                      </div>
                    )}
                    {order.estimatedDelivery && (
                      <div className="order-estimated-delivery">
                        예상 배송일: {new Date(order.estimatedDelivery).toLocaleDateString('ko-KR')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'wishlist':
        return (
          <div className="mypage-content-section">
            <h2>찜한 상품</h2>
            {wishlist.length === 0 ? (
              <div className="mypage-empty">
                <p>찜한 상품이 없습니다.</p>
              </div>
            ) : (
              <div className="wishlist-grid">
                {wishlist.map((item) => (
                  <div key={item.id} className="wishlist-item">
                    <div 
                      className="wishlist-image-container"
                      onClick={() => navigate(`/product/${item.id}`)}
                    >
                      <img src={item.image} alt={item.name} className="wishlist-image" />
                    </div>
                    <div className="wishlist-info">
                      <h3 
                        className="wishlist-name"
                        onClick={() => navigate(`/product/${item.id}`)}
                      >
                        {item.name}
                      </h3>
                      <p className="wishlist-price">{item.price.toLocaleString()}원</p>
                      <button 
                        className="wishlist-remove-btn"
                        onClick={() => handleRemoveWishlist(item.id)}
                      >
                        찜 해제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'review':
        const availableReviews = getAvailableReviews();
        return (
          <div className="mypage-content-section">
            <h2>리뷰 관리</h2>
            
            {/* 작성 가능한 리뷰 */}
            <div className="review-section">
              <h3 className="review-section-title">작성 가능한 리뷰</h3>
              {availableReviews.length === 0 ? (
                <div className="mypage-empty">
                  <p>작성 가능한 리뷰가 없습니다.</p>
                </div>
              ) : (
                <div className="review-list">
                  {availableReviews.map((order) => (
                    <div key={order.id} className="review-item available">
                      <div className="review-product-info">
                        <img 
                          src={order.product?.image || 'https://via.placeholder.com/100'} 
                          alt={order.product?.name}
                          className="review-product-image"
                        />
                        <div className="review-product-details">
                          <h4 className="review-product-name">{order.product?.name}</h4>
                          <p className="review-order-date">
                            구매일: {new Date(order.orderDate).toLocaleDateString('ko-KR')}
                          </p>
                          <p className="review-order-quantity">수량: {order.quantity}개</p>
                        </div>
                      </div>
                      <button 
                        className="review-write-btn"
                        onClick={() => handleOpenReviewModal(order)}
                      >
                        리뷰 작성하기
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 내가 작성한 리뷰 */}
            <div className="review-section">
              <h3 className="review-section-title">내가 작성한 리뷰</h3>
              {myReviews.length === 0 ? (
                <div className="mypage-empty">
                  <p>작성한 리뷰가 없습니다.</p>
                </div>
              ) : (
                <div className="review-list">
                  {myReviews.map((review) => (
                    <div key={review.id} className="review-item written">
                      <div className="review-product-info">
                        <img 
                          src={review.productImage || 'https://via.placeholder.com/100'} 
                          alt={review.productName}
                          className="review-product-image"
                        />
                        <div className="review-product-details">
                          <h4 className="review-product-name">{review.productName}</h4>
                          <div className="review-rating">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill={i < review.rating ? "#ffc107" : "#e0e0e0"}
                                className="review-star"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            ))}
                            <span className="review-rating-text">{review.rating}점</span>
                          </div>
                          <p className="review-content-text">{review.content}</p>
                          <p className="review-date">
                            작성일: {new Date(review.createdAt).toLocaleDateString('ko-KR')}
                          </p>
                        </div>
                      </div>
                      <button 
                        className="review-delete-btn"
                        onClick={() => handleDeleteReview(review.id)}
                      >
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      case 'inquiry':
        return (
          <div className="mypage-content-section">
            <h2>상품 문의</h2>
            {myInquiries.length === 0 ? (
              <div className="mypage-empty">
                <p>등록된 상품 문의가 없습니다.</p>
                <button className="inquiry-create-btn" onClick={() => navigate('/')}>
                  상품 문의 작성하기
                </button>
              </div>
            ) : (
              <div className="inquiry-list">
                {myInquiries.map((inquiry) => {
                  const product = getProductInfo(inquiry.productId);
                  return (
                    <div key={inquiry.id} className="inquiry-item">
                      <div className="inquiry-product-info">
                        {product && (
                          <>
                            <img 
                              src={product.image || 'https://via.placeholder.com/100'} 
                              alt={product.name}
                              className="inquiry-product-image"
                              onClick={() => navigate(`/product/${inquiry.productId}`)}
                            />
                            <div className="inquiry-product-details">
                              <h4 
                                className="inquiry-product-name"
                                onClick={() => navigate(`/product/${inquiry.productId}`)}
                              >
                                {product.name}
                              </h4>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="inquiry-item-content-wrapper">
                        <div className="inquiry-item-header">
                          <div className="inquiry-item-header-left">
                            <span className="inquiry-date">
                              {new Date(inquiry.createdAt).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                            <span className={`inquiry-status ${inquiry.status === '답변완료' ? 'completed' : 'pending'}`}>
                              {inquiry.status}
                            </span>
                          </div>
                          {!inquiry.reply && inquiry.status !== '답변완료' && (
                            <div className="inquiry-item-header-right">
                              <button 
                                className="inquiry-edit-btn"
                                onClick={() => handleOpenEditInquiryModal(inquiry.id, inquiry.content)}
                              >
                                수정
                              </button>
                              <button 
                                className="inquiry-delete-btn"
                                onClick={() => handleDeleteInquiry(inquiry.id)}
                              >
                                삭제
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="inquiry-item-content">{inquiry.content}</div>
                        {inquiry.reply && (
                          <div className="inquiry-reply">
                            <div className="inquiry-reply-header">
                              <span className="inquiry-reply-label">관리자 답변</span>
                              <span className="inquiry-reply-date">
                                {new Date(inquiry.replyDate).toLocaleDateString('ko-KR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="inquiry-reply-content">{inquiry.reply}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 문의 수정 모달 */}
            {showEditInquiryModal && (
              <div className="inquiry-modal-overlay" onClick={handleCloseEditInquiryModal}>
                <div className="inquiry-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="inquiry-modal-header">
                    <h3>상품 문의 수정</h3>
                    <button className="inquiry-modal-close" onClick={handleCloseEditInquiryModal}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div className="inquiry-modal-body">
                    <div className="inquiry-form-group">
                      <label>문의 내용</label>
                      <textarea
                        value={editingInquiryContent}
                        onChange={(e) => setEditingInquiryContent(e.target.value)}
                        placeholder="문의 내용을 입력해주세요"
                        className="inquiry-content-textarea"
                        rows="8"
                      />
                    </div>
                  </div>
                  <div className="inquiry-modal-footer">
                    <button className="inquiry-modal-btn cancel" onClick={handleCloseEditInquiryModal}>
                      취소
                    </button>
                    <button className="inquiry-modal-btn submit" onClick={handleSubmitEditInquiry}>
                      수정하기
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      case 'coupon':
        return (
          <div className="mypage-content-section">
            <h2>쿠폰함</h2>
            
            {/* 받을 수 있는 쿠폰 */}
            <div className="coupon-section">
              <h3 className="coupon-section-title">받을 수 있는 쿠폰</h3>
              {availableCoupons.filter(c => c.status === 'available').length === 0 ? (
                <div className="mypage-empty">
                  <p>받을 수 있는 쿠폰이 없습니다.</p>
                </div>
              ) : (
                <div className="coupon-list">
                  {availableCoupons
                    .filter(c => c.status === 'available')
                    .map((coupon) => (
                      <div key={coupon.id} className="coupon-card available">
                        <div className="coupon-info">
                          <h4 className="coupon-name">{coupon.name}</h4>
                          <p className="coupon-description">{coupon.description}</p>
                          <div className="coupon-details">
                            {coupon.discountType === 'fixed' ? (
                              <span className="coupon-discount">{coupon.discount.toLocaleString()}원 할인</span>
                            ) : (
                              <span className="coupon-discount">{coupon.discount}% 할인</span>
                            )}
                            <span className="coupon-condition">최소 구매금액: {coupon.minPurchase.toLocaleString()}원</span>
                            <span className="coupon-validity">유효기간: ~{new Date(coupon.validUntil).toLocaleDateString('ko-KR')}</span>
                          </div>
                        </div>
                        <button 
                          className="coupon-receive-btn"
                          onClick={() => handleReceiveCoupon(coupon.id)}
                        >
                          받기
                        </button>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* 받은 쿠폰 */}
            <div className="coupon-section">
              <h3 className="coupon-section-title">내 쿠폰</h3>
              {receivedCoupons.length === 0 ? (
                <div className="mypage-empty">
                  <p>받은 쿠폰이 없습니다.</p>
                </div>
              ) : (
                <div className="coupon-list">
                  {receivedCoupons.map((coupon) => (
                    <div key={coupon.id} className={`coupon-card ${coupon.status}`}>
                      <div className="coupon-info">
                        <h4 className="coupon-name">{coupon.name}</h4>
                        <p className="coupon-description">{coupon.description}</p>
                        <div className="coupon-details">
                          {coupon.discountType === 'fixed' ? (
                            <span className="coupon-discount">{coupon.discount.toLocaleString()}원 할인</span>
                          ) : (
                            <span className="coupon-discount">{coupon.discount}% 할인</span>
                          )}
                          <span className="coupon-condition">최소 구매금액: {coupon.minPurchase.toLocaleString()}원</span>
                          <span className="coupon-validity">유효기간: ~{new Date(coupon.validUntil).toLocaleDateString('ko-KR')}</span>
                          {coupon.status === 'used' && (
                            <span className="coupon-status used">사용완료</span>
                          )}
                          {coupon.status === 'expired' && (
                            <span className="coupon-status expired">만료됨</span>
                          )}
                          {coupon.status === 'received' && (
                            <span className="coupon-status received">사용가능</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mypage-container">
      <div className="mypage-layout">
        {/* 왼쪽 메뉴 */}
        <div className="mypage-sidebar">
          <h3 className="mypage-sidebar-title">마이페이지</h3>
          <ul className="mypage-menu">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  className={`mypage-menu-item ${activeMenu === item.id ? 'active' : ''}`}
                  onClick={() => handleMenuClick(item.id)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* 오른쪽 컨텐츠 */}
        <div className="mypage-content">
          {renderContent()}
        </div>
      </div>

      {/* 리뷰 작성 모달 */}
      {showReviewModal && selectedOrder && (
        <div className="review-modal-overlay" onClick={handleCloseReviewModal}>
          <div className="review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="review-modal-header">
              <h3>리뷰 작성</h3>
              <button className="review-modal-close" onClick={handleCloseReviewModal}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="review-modal-body">
              <div className="review-modal-product">
                <img 
                  src={selectedOrder.product?.image || 'https://via.placeholder.com/100'} 
                  alt={selectedOrder.product?.name}
                  className="review-modal-product-image"
                />
                <div className="review-modal-product-info">
                  <h4>{selectedOrder.product?.name}</h4>
                  <p>구매일: {new Date(selectedOrder.orderDate).toLocaleDateString('ko-KR')}</p>
                </div>
              </div>

              <div className="review-modal-rating">
                <label>평점</label>
                <div className="review-rating-input">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      className={`rating-star-btn ${reviewRating >= rating ? 'active' : ''}`}
                      onClick={() => setReviewRating(rating)}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill={reviewRating >= rating ? "#ffc107" : "#e0e0e0"}
                        className="rating-star-icon"
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                      </svg>
                    </button>
                  ))}
                  <span className="rating-text">{reviewRating}점</span>
                </div>
              </div>

              <div className="review-modal-images">
                <label htmlFor="review-images">사진 첨부 (최대 3장)</label>
                <div className="review-image-upload-area">
                  {reviewImages.length < 3 && (
                    <label htmlFor="review-image-input" className="review-image-upload-btn">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="17 8 12 3 7 8"></polyline>
                        <line x1="12" y1="3" x2="12" y2="15"></line>
                      </svg>
                      <span>사진 추가</span>
                    </label>
                  )}
                  <input
                    id="review-image-input"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                  />
                  <div className="review-image-preview-list">
                    {reviewImages.map((image, index) => (
                      <div key={index} className="review-image-preview-item">
                        <img src={image} alt={`리뷰 이미지 ${index + 1}`} />
                        <button
                          type="button"
                          className="review-image-remove-btn"
                          onClick={() => handleImageRemove(index)}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="review-modal-content">
                <label htmlFor="review-content">리뷰 내용</label>
                <textarea
                  id="review-content"
                  className="review-content-textarea"
                  placeholder="상품에 대한 솔직한 리뷰를 작성해주세요."
                  value={reviewContent}
                  onChange={(e) => setReviewContent(e.target.value)}
                  rows={6}
                />
              </div>
            </div>
            <div className="review-modal-footer">
              <button className="review-modal-btn cancel" onClick={handleCloseReviewModal}>
                취소
              </button>
              <button className="review-modal-btn submit" onClick={handleSubmitReview}>
                작성하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyPage;

