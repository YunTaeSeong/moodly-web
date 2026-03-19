import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isLoggedIn, isAdmin } from '../utils/cookie';
import { getWishlist, removeFromWishlist } from '../utils/wishlist';
import { getAvailableCoupons, getReceivedCoupons, receiveCoupon, checkCouponExpiry } from '../utils/coupon';
import { getOrders, getOrderCount, addTestOrder } from '../utils/order';
import { getReviewsByAuthor, hasReviewForOrder, saveReview, deleteReview } from '../utils/review';
import { getInquiries, deleteInquiry, updateInquiry } from '../utils/inquiry';
import { getCookie } from '../utils/cookie';
import { allProducts } from '../utils/products';
import { changeMyPassword, getDeliveryAddresses, createDeliveryAddress, updateDeliveryAddress, deleteDeliveryAddress, setDefaultDeliveryAddress, addToCart, getWishlistItems, removeWishlistItem, getProductById, getProductInquiriesApi, getAdminProductInquiriesApi, updateProductInquiryApi, deleteProductInquiryApi, adminUpdateProductInquiryApi, adminDeleteProductInquiryApi, adminReplyProductInquiryApi } from '../utils/api';
import { getUserIdFromToken, hasRolesInToken, isAdminFromToken } from '../utils/token';
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
    if (path === '/mypage/delivery') return 'delivery';
    return 'home'; // 기본값
  };
  
  const [activeMenu, setActiveMenu] = useState(getMenuFromPath());
  const [wishlist, setWishlist] = useState([]);
  const [selectedWishlistIds, setSelectedWishlistIds] = useState([]);
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
  const [inquiryProductCache, setInquiryProductCache] = useState({});
  const [showEditInquiryModal, setShowEditInquiryModal] = useState(false);
  const [editingInquiryId, setEditingInquiryId] = useState(null);
  const [editingInquiryContent, setEditingInquiryContent] = useState('');
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedInquiryIdForReply, setSelectedInquiryIdForReply] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [showDeliveryAddressModal, setShowDeliveryAddressModal] = useState(false);
  const [editingDeliveryAddress, setEditingDeliveryAddress] = useState(null);
  const [deliveryAddressForm, setDeliveryAddressForm] = useState({
    postcode: '',
    address: '',
    detailAddress: '',
    recipient: '',
    phoneNumber: '',
    isDefault: false
  });
  const setDeliveryAddressFormRef = useRef(setDeliveryAddressForm);
  
  // setDeliveryAddressForm ref 업데이트
  useEffect(() => {
    setDeliveryAddressFormRef.current = setDeliveryAddressForm;
  }, []);

  // 찜한 상품 목록 및 주문 내역 가져오기
  useEffect(() => {
    if (isLoggedIn()) {
      loadWishlistFromServer();
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
      
      // 상품 문의: 로그인 시 API에서 조회
      loadMyInquiriesFromServer();
    } else {
      // 비로그인 시에는 localStorage 기준으로만 찜 목록 표시
      setWishlist(getWishlist());
    }
  }, [activeMenu]);

  // 서버에서 찜 목록 조회
  const loadWishlistFromServer = async () => {
    if (!isLoggedIn()) {
      setWishlist(getWishlist());
      return;
    }

    const result = await getWishlistItems();
    if (!result.success) {
      console.error('찜 목록 조회 실패:', result);
      setWishlist(getWishlist());
      return;
    }

    const serverItems = result.data || [];
    if (serverItems.length === 0) {
      setWishlist([]);
      try {
        localStorage.setItem('moodly_wishlist', JSON.stringify([]));
      } catch (e) {
        console.error('찜 로컬 동기화 오류:', e);
      }
      return;
    }

    // productId 기준으로 상품 상세 조회
    const productResults = await Promise.all(
      serverItems.map(item => getProductById(item.productId))
    );

    const merged = productResults
      .filter(r => r && r.success && r.data)
      .map(r => {
        const p = r.data;
        return {
          id: p.id,
          name: p.name,
          price: p.price,
          image: p.image,
          addedAt: null,
        };
      });

    setWishlist(merged);

    try {
      localStorage.setItem('moodly_wishlist', JSON.stringify(merged));
    } catch (e) {
      console.error('찜 로컬 동기화 오류:', e);
    }
  };

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

  // 배송지 목록 조회
  useEffect(() => {
    if (isLoggedIn() && activeMenu === 'delivery') {
      loadDeliveryAddresses();
    }
  }, [activeMenu]);

  const loadDeliveryAddresses = async () => {
    const result = await getDeliveryAddresses();
    if (result.success && result.data) {
      setDeliveryAddresses(result.data);
      // 배송지 변경 이벤트 발생 (다른 페이지에 알림)
      localStorage.setItem('deliveryAddressCurrentUpdate', Date.now().toString());
    }
  };

  // 찜한 상품 제거 핸들러
  const handleRemoveWishlist = async (productId) => {
    // 개별 "삭제"는 해당 상품 체크박스를 먼저 선택했을 때만 동작
    if (!selectedWishlistIds.includes(productId)) {
      window.alert('삭제할 상품을 체크박스로 선택해주세요.');
      return;
    }
    if (isLoggedIn()) {
      const result = await removeWishlistItem(productId);
      if (!result.success && !result.notExists) {
        if (result.status === 401) {
          window.alert('로그인이 필요합니다.');
          navigate('/login');
          return;
        }
        window.alert(result.message || '찜 해제에 실패했습니다.');
      }
      await loadWishlistFromServer();
      setSelectedWishlistIds(prev => prev.filter(id => id !== productId));
    } else {
      removeFromWishlist(productId);
      setWishlist(getWishlist());
      setSelectedWishlistIds(prev => prev.filter(id => id !== productId));
    }
  };

  // 찜한 상품 전체선택
  const handleSelectAllWishlist = (e) => {
    if (e.target.checked) {
      setSelectedWishlistIds(wishlist.map(item => item.id));
    } else {
      setSelectedWishlistIds([]);
    }
  };

  // 찜한 상품 개별 선택
  const handleWishlistItemSelect = (productId) => {
    setSelectedWishlistIds(prev =>
      prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]
    );
  };

  // 선택한 찜 상품 일괄 삭제
  const handleDeleteSelectedWishlist = async () => {
    if (selectedWishlistIds.length === 0) {
      window.alert('삭제할 상품을 선택해주세요.');
      return;
    }
    if (isLoggedIn()) {
      for (const id of selectedWishlistIds) {
        await removeWishlistItem(id);
      }
      await loadWishlistFromServer();
      setSelectedWishlistIds([]);
      window.alert('선택한 상품이 찜 목록에서 삭제되었습니다.');
    } else {
      selectedWishlistIds.forEach(id => removeFromWishlist(id));
      setWishlist(getWishlist());
      setSelectedWishlistIds([]);
      window.alert('선택한 상품이 찜 목록에서 삭제되었습니다.');
    }
  };

  // 찜한 상품을 장바구니에 담기
  const handleAddToCartFromWishlist = async (item) => {
    if (!isLoggedIn()) {
      window.alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    const result = await addToCart(item.id, 1);
    if (result.success) {
      window.alert(`"${item.name}"이(가) 장바구니에 추가되었습니다.`);
    } else {
      window.alert(result.message || '장바구니 추가에 실패했습니다.');
    }
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

  // 상품문의 수정 제출 (관리자: admin API, 유저: user API, 비로그인: localStorage)
  const handleSubmitEditInquiry = async () => {
    if (!editingInquiryId) {
      window.alert('문의를 선택해주세요.');
      return;
    }
    if (!editingInquiryContent.trim()) {
      window.alert('문의 내용을 입력해주세요.');
      return;
    }
    if (isLoggedIn()) {
      const api = isAdmin() ? adminUpdateProductInquiryApi : updateProductInquiryApi;
      const res = await api(editingInquiryId, editingInquiryContent.trim());
      if (res && res.success) {
        window.alert('상품 문의가 수정되었습니다.');
        handleCloseEditInquiryModal();
        loadMyInquiriesFromServer();
      } else {
        window.alert(res?.message || '상품 문의 수정에 실패했습니다.');
      }
      return;
    }
    const updatedInquiry = updateInquiry(editingInquiryId, editingInquiryContent.trim());
    if (updatedInquiry) {
      window.alert('상품 문의가 수정되었습니다.');
      handleCloseEditInquiryModal();
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

  // 상품문의 삭제 (관리자: admin API, 유저: user API, 비로그인: localStorage)
  const handleDeleteInquiry = async (inquiryId) => {
    if (!window.confirm('상품 문의를 삭제하시겠습니까?')) return;
    if (isLoggedIn()) {
      const api = isAdmin() ? adminDeleteProductInquiryApi : deleteProductInquiryApi;
      const res = await api(inquiryId);
      if (res && res.success) {
        window.alert('상품 문의가 삭제되었습니다.');
        loadMyInquiriesFromServer();
      } else {
        window.alert(res?.message || '상품 문의 삭제에 실패했습니다.');
      }
      return;
    }
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
  };

  // 관리자 답변 모달 열기/닫기
  const handleOpenReplyModal = (inquiryId) => {
    setSelectedInquiryIdForReply(inquiryId);
    setReplyContent('');
    setShowReplyModal(true);
  };
  const handleCloseReplyModal = () => {
    setShowReplyModal(false);
    setSelectedInquiryIdForReply(null);
    setReplyContent('');
  };

  // 관리자 답변 제출
  const handleSubmitReply = async () => {
    if (!selectedInquiryIdForReply) return;
    if (!replyContent.trim()) {
      window.alert('답변 내용을 입력해주세요.');
      return;
    }
    const res = await adminReplyProductInquiryApi(selectedInquiryIdForReply, replyContent.trim());
    if (res && res.success) {
      window.alert('답변이 등록되었습니다.');
      handleCloseReplyModal();
      loadMyInquiriesFromServer();
    } else {
      window.alert(res?.message || '답변 등록에 실패했습니다.');
    }
  };

  // 마이페이지 상품 문의 목록 API에서 로드 (관리자: 전체 문의, 유저: 내 문의만)
  const loadMyInquiriesFromServer = async () => {
    if (!isLoggedIn()) return;
    const res = isAdmin()
      ? await getAdminProductInquiriesApi({ page: 0, size: 500 })
      : await getProductInquiriesApi({ page: 0, size: 500 });
    if (!res.success) {
      setMyInquiries([]);
      setInquiryCount(0);
      return;
    }
    const list = res.data || [];
    setMyInquiries(list);
    setInquiryCount(list.length);
    const productIds = [...new Set(list.map((i) => i.productId).filter(Boolean))];
    if (productIds.length === 0) {
      setInquiryProductCache({});
      return;
    }
    const productResults = await Promise.all(productIds.map((id) => getProductById(id)));
    const cache = {};
    productResults.forEach((r, idx) => {
      if (r && r.success && r.data) cache[productIds[idx]] = r.data;
    });
    setInquiryProductCache(cache);
  };

  // 상품 정보 가져오기 (문의용 캐시 → 전체 상품 → 카테고리)
  const getProductInfo = (productId) => {
    if (inquiryProductCache[productId]) return inquiryProductCache[productId];
    const product = allProducts.find(p => p.id === productId);
    if (product) return product;
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
      'coupon': '/mypage/coupons',
      'delivery': '/mypage/delivery'
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
    { id: 'coupon', label: '쿠폰함' },
    { id: 'delivery', label: '배송지 관리' }
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
      case 'home': {
        const isAdminForDisplay = hasRolesInToken() ? isAdminFromToken() : isAdmin();
        const displayName = isAdminForDisplay ? '관리자' : (getCookie('username') || '회원');
        return (
          <div className="mypage-content-section">
            <h2>마이쇼핑 홈</h2>
            <div className="mypage-welcome">
              <p>안녕하세요, <strong>{displayName}</strong>님!</p>
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
                <h3>{isAdminForDisplay ? '상품 문의 (전체)' : '상품 문의'}</h3>
                <p className="summary-count">{inquiryCount}건</p>
              </div>
            </div>
          </div>
        );
      }
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
              <>
                <div className="wishlist-toolbar">
                  <label className="wishlist-select-all">
                    <input
                      type="checkbox"
                      checked={wishlist.length > 0 && selectedWishlistIds.length === wishlist.length}
                      onChange={handleSelectAllWishlist}
                    />
                    <span>전체선택</span>
                  </label>
                  <button
                    type="button"
                    className="wishlist-delete-selected-btn"
                    onClick={handleDeleteSelectedWishlist}
                  >
                    선택삭제
                  </button>
                </div>
                <div className="wishlist-list">
                  {wishlist.map((item) => (
                    <div key={item.id} className="wishlist-row">
                      <label className="wishlist-row-checkbox">
                        <input
                          type="checkbox"
                          checked={selectedWishlistIds.includes(item.id)}
                          onChange={() => handleWishlistItemSelect(item.id)}
                        />
                      </label>
                      <div
                        className="wishlist-row-image"
                        onClick={() => navigate(`/product/${item.id}`)}
                      >
                        <img src={item.image || 'https://via.placeholder.com/120?text=No+Image'} alt={item.name} />
                      </div>
                      <div className="wishlist-row-details">
                        <h3
                          className="wishlist-row-name"
                          onClick={() => navigate(`/product/${item.id}`)}
                        >
                          {item.name}
                        </h3>
                        <p className="wishlist-row-price">{item.price != null ? Number(item.price).toLocaleString() : 0}원</p>
                      </div>
                      <div className="wishlist-row-actions">
                        <button
                          type="button"
                          className="wishlist-add-cart-btn"
                          onClick={() => handleAddToCartFromWishlist(item)}
                        >
                          장바구니 담기
                        </button>
                        <button
                          type="button"
                          className="wishlist-delete-btn"
                          onClick={() => handleRemoveWishlist(item.id)}
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
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
      case 'inquiry': {
        const isAdminInquiry = hasRolesInToken() ? isAdminFromToken() : isAdmin();
        return (
          <div className="mypage-content-section">
            <h2>{isAdminInquiry ? '상품 문의 (전체)' : '상품 문의'}</h2>
            {myInquiries.length === 0 ? (
              <div className="mypage-empty">
                <p>등록된 상품 문의가 없습니다.</p>
                {!isAdminInquiry && (
                  <button className="inquiry-create-btn" onClick={() => navigate('/')}>
                    상품 문의 작성하기
                  </button>
                )}
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
                          <div className="inquiry-item-header-right">
                            {(isAdmin() || (!inquiry.reply && inquiry.status !== '답변완료')) && (
                              <>
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
                              </>
                            )}
                            {isAdmin() && inquiry.status === '답변대기' && (
                              <button 
                                className="inquiry-reply-btn"
                                onClick={() => handleOpenReplyModal(inquiry.id)}
                              >
                                답변하기
                              </button>
                            )}
                          </div>
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

            {/* 관리자 답변 작성 모달 */}
            {showReplyModal && (
              <div className="inquiry-modal-overlay" onClick={handleCloseReplyModal}>
                <div className="inquiry-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="inquiry-modal-header">
                    <h3>답변 작성</h3>
                    <button className="inquiry-modal-close" onClick={handleCloseReplyModal}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div className="inquiry-modal-body">
                    {selectedInquiryIdForReply && myInquiries.find(i => i.id === selectedInquiryIdForReply) && (
                      <div className="inquiry-form-group">
                        <label>문의 내용</label>
                        <div className="inquiry-original-content">
                          {myInquiries.find(i => i.id === selectedInquiryIdForReply).content}
                        </div>
                      </div>
                    )}
                    <div className="inquiry-form-group">
                      <label htmlFor="reply-content">답변 내용</label>
                      <textarea
                        id="reply-content"
                        className="inquiry-content-textarea"
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="답변 내용을 입력해주세요."
                        rows={8}
                      />
                    </div>
                  </div>
                  <div className="inquiry-modal-footer">
                    <button className="inquiry-modal-btn cancel" onClick={handleCloseReplyModal}>
                      취소
                    </button>
                    <button className="inquiry-modal-btn submit" onClick={handleSubmitReply}>
                      답변 등록
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }
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
      case 'delivery':
        return (
          <div className="mypage-content-section">
            <h2>배송지 관리</h2>
            <div className="delivery-address-header">
              <button 
                className="delivery-address-add-btn"
                onClick={() => {
                  setEditingDeliveryAddress(null);
                  setDeliveryAddressForm({
                    postcode: '',
                    address: '',
                    detailAddress: '',
                    recipient: '',
                    phoneNumber: '',
                    isDefault: false
                  });
                  setShowDeliveryAddressModal(true);
                }}
              >
                + 배송지 추가
              </button>
            </div>
            {deliveryAddresses.length === 0 ? (
              <div className="mypage-empty">
                <p>등록된 배송지가 없습니다.</p>
              </div>
            ) : (
              <div className="delivery-address-list">
                {deliveryAddresses.map((address) => (
                  <div key={address.id} className={`delivery-address-item ${address.isDefault ? 'default' : ''}`}>
                    {address.isDefault && (
                      <div className="delivery-address-default-badge">기본 배송지</div>
                    )}
                    <div className="delivery-address-info">
                      <div className="delivery-address-recipient">
                        <strong>{address.recipient}</strong>
                        <span className="delivery-address-phone">{address.phoneNumber}</span>
                      </div>
                      <div className="delivery-address-full">
                        <span className="delivery-address-postcode">[{address.postcode}]</span>
                        <span className="delivery-address-address">{address.address}</span>
                        {address.detailAddress && (
                          <span className="delivery-address-detail">{address.detailAddress}</span>
                        )}
                      </div>
                    </div>
                    <div className="delivery-address-actions">
                      {!address.isDefault && (
                        <button
                          className="delivery-address-set-default-btn"
                          onClick={async () => {
                            const result = await setDefaultDeliveryAddress(address.id);
                            if (result.success) {
                              window.alert('기본 배송지로 설정되었습니다.');
                              await loadDeliveryAddresses();
                              // 배송지 변경 이벤트 발생
                              localStorage.setItem('deliveryAddressCurrentUpdate', Date.now().toString());
                            } else {
                              window.alert(result.message || '기본 배송지 설정에 실패했습니다.');
                            }
                          }}
                        >
                          기본 배송지로 설정
                        </button>
                      )}
                      <button
                        className="delivery-address-edit-btn"
                        onClick={() => {
                          setEditingDeliveryAddress(address);
                          setDeliveryAddressForm({
                            postcode: address.postcode,
                            address: address.address,
                            detailAddress: address.detailAddress || '',
                            recipient: address.recipient,
                            phoneNumber: address.phoneNumber,
                            isDefault: address.isDefault
                          });
                          setShowDeliveryAddressModal(true);
                        }}
                      >
                        수정
                      </button>
                      <button
                        className="delivery-address-delete-btn"
                        onClick={async () => {
                          if (window.confirm('배송지를 삭제하시겠습니까?')) {
                            const result = await deleteDeliveryAddress(address.id);
                            if (result.success) {
                              window.alert('배송지가 삭제되었습니다.');
                              await loadDeliveryAddresses();
                              // 배송지 변경 이벤트 발생
                              localStorage.setItem('deliveryAddressCurrentUpdate', Date.now().toString());
                            } else {
                              window.alert(result.message || '배송지 삭제에 실패했습니다.');
                            }
                          }
                        }}
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 배송지 추가/수정 모달 */}
            {showDeliveryAddressModal && (
              <div className="delivery-address-modal-overlay" onClick={() => setShowDeliveryAddressModal(false)}>
                <div className="delivery-address-modal" onClick={(e) => e.stopPropagation()}>
                  <div className="delivery-address-modal-header">
                    <h3>{editingDeliveryAddress ? '배송지 수정' : '배송지 추가'}</h3>
                    <button className="delivery-address-modal-close" onClick={() => setShowDeliveryAddressModal(false)}>
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                  <div className="delivery-address-modal-body">
                    <div className="form-group">
                      <label className="form-label">
                        우편번호 <span className="required">*</span>
                      </label>
                      <div className="postcode-input-group">
                        <input
                          type="text"
                          value={deliveryAddressForm.postcode}
                          onChange={(e) => setDeliveryAddressForm({ ...deliveryAddressForm, postcode: e.target.value })}
                          placeholder="우편번호"
                          className="form-input"
                          maxLength="10"
                        />
                        <button
                          type="button"
                          className="postcode-search-btn"
                          onClick={() => {
                            // 다음 주소 API 사용
                            if (!window.daum || !window.daum.Postcode) {
                              window.alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
                              return;
                            }

                            new window.daum.Postcode({
                              oncomplete: function(data) {
                                // 주소 선택 완료 후 처리
                                const fullAddress = data.address; // 선택한 주소
                                let extraAddress = ''; // 참고항목

                                // 법정동명이 있을 경우 추가
                                if(data.bname !== '' && /[동|로|가]$/g.test(data.bname)){
                                  extraAddress += data.bname;
                                }
                                // 건물명이 있을 경우 추가
                                if(data.buildingName !== '' && data.buildingName !== 'N'){
                                  extraAddress += (extraAddress !== '' ? ', ' + data.buildingName : data.buildingName);
                                }
                                // 표시할 참고항목이 있을 경우, 괄호까지 추가한 최종 문자열을 만든다.
                                if(extraAddress !== ''){
                                  extraAddress = ' (' + extraAddress + ')';
                                }

                                // 주소 정보 업데이트 (ref를 통해 최신 setter 사용)
                                const setter = setDeliveryAddressFormRef.current;
                                if (setter) {
                                  setter(prev => ({
                                    ...prev,
                                    postcode: data.zonecode,
                                    address: `${fullAddress}${extraAddress}`.trim()
                                  }));
                                }
                              },
                              width: '100%',
                              height: '100%'
                            }).open();
                          }}
                        >
                          주소 검색
                        </button>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        주소 <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryAddressForm.address}
                        onChange={(e) => setDeliveryAddressForm({ ...deliveryAddressForm, address: e.target.value })}
                        placeholder="주소"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">상세주소</label>
                      <input
                        type="text"
                        value={deliveryAddressForm.detailAddress}
                        onChange={(e) => setDeliveryAddressForm({ ...deliveryAddressForm, detailAddress: e.target.value })}
                        placeholder="상세주소 (선택사항)"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        수령인 <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        value={deliveryAddressForm.recipient}
                        onChange={(e) => setDeliveryAddressForm({ ...deliveryAddressForm, recipient: e.target.value })}
                        placeholder="수령인 이름"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">
                        전화번호 <span className="required">*</span>
                      </label>
                      <input
                        type="tel"
                        value={deliveryAddressForm.phoneNumber}
                        onChange={(e) => setDeliveryAddressForm({ ...deliveryAddressForm, phoneNumber: e.target.value })}
                        placeholder="010-1234-5678"
                        className="form-input"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-checkbox-label">
                        <input
                          type="checkbox"
                          checked={deliveryAddressForm.isDefault}
                          onChange={(e) => setDeliveryAddressForm({ ...deliveryAddressForm, isDefault: e.target.checked })}
                          className="form-checkbox"
                        />
                        <span>기본 배송지로 설정</span>
                      </label>
                    </div>
                  </div>
                  <div className="delivery-address-modal-footer">
                    <button
                      className="delivery-address-modal-btn cancel"
                      onClick={() => setShowDeliveryAddressModal(false)}
                    >
                      취소
                    </button>
                    <button
                      className="delivery-address-modal-btn submit"
                      onClick={async () => {
                        if (!deliveryAddressForm.postcode || !deliveryAddressForm.address || 
                            !deliveryAddressForm.recipient || !deliveryAddressForm.phoneNumber) {
                          window.alert('필수 항목을 모두 입력해주세요.');
                          return;
                        }

                        let result;
                        if (editingDeliveryAddress) {
                          result = await updateDeliveryAddress(editingDeliveryAddress.id, {
                            postcode: deliveryAddressForm.postcode,
                            address: deliveryAddressForm.address,
                            detailAddress: deliveryAddressForm.detailAddress,
                            recipient: deliveryAddressForm.recipient,
                            phoneNumber: deliveryAddressForm.phoneNumber
                          });
                          if (result.success) {
                            if (deliveryAddressForm.isDefault) {
                              await setDefaultDeliveryAddress(editingDeliveryAddress.id);
                            }
                            window.alert('배송지가 수정되었습니다.');
                          } else {
                            window.alert(result.message || '배송지 수정에 실패했습니다.');
                            return;
                          }
                        } else {
                          result = await createDeliveryAddress({
                            postcode: deliveryAddressForm.postcode,
                            address: deliveryAddressForm.address,
                            detailAddress: deliveryAddressForm.detailAddress,
                            recipient: deliveryAddressForm.recipient,
                            phoneNumber: deliveryAddressForm.phoneNumber,
                            isDefault: deliveryAddressForm.isDefault
                          });
                          if (result.success) {
                            window.alert('배송지가 추가되었습니다.');
                          } else {
                            window.alert(result.message || '배송지 추가에 실패했습니다.');
                            return;
                          }
                        }
                        setShowDeliveryAddressModal(false);
                        await loadDeliveryAddresses();
                        // 배송지 변경 이벤트 발생
                        localStorage.setItem('deliveryAddressCurrentUpdate', Date.now().toString());
                      }}
                    >
                      {editingDeliveryAddress ? '수정하기' : '추가하기'}
                    </button>
                  </div>
                </div>
              </div>
            )}
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
