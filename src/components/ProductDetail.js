import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { isWishlisted, addToWishlist, removeFromWishlist } from '../utils/wishlist';
import { getDeliveryAddress, saveDeliveryAddress, hasDeliveryAddress } from '../utils/delivery';
import { isLoggedIn, isAdmin } from '../utils/cookie';
import { processPayment, generateOrderId } from '../utils/payment';
import { addInquiry, getInquiries, addInquiryReply } from '../utils/inquiry';
import { receiveProductCoupon, getReceivedCoupons, checkCouponExpiry, applyCoupon } from '../utils/coupon';
import { saveOrder } from '../utils/order';
import { allProducts } from '../utils/products';
import { getReviewsByProductId } from '../utils/review';
import { getCategoryProductById } from '../utils/categoryProducts';
import './ProductDetail.css';

// 샘플 상품 데이터 (실제로는 API나 상태 관리에서 가져올 수 있습니다)
const products = {
  1: {
    id: 1,
    name: '스마트폰 케이스',
    price: 15000,
    originalPrice: 20000,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1601972602237-8c79241e468b?w=500&h=500&fit=crop',
    description: '고급스러운 스마트폰 케이스로 기기를 보호하세요. 얇고 가벼우면서도 강력한 보호 기능을 제공합니다.',
    details: '• 방수 기능\n• 충격 흡수\n• 다양한 색상 제공\n• 1년 품질 보증',
    category: '가전용품',
    categoryId: 'electronics',
    rating: 4.5,
    reviewCount: 288,
    purchaseCount: 934
  },
  2: {
    id: 2,
    name: '무선 이어폰',
    price: 89000,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop',
    description: '프리미엄 무선 이어폰으로 최고의 음질을 경험하세요. 노이즈 캔슬링 기능이 탑재되어 있습니다.',
    details: '• 노이즈 캔슬링\n• 30시간 배터리\n• IPX7 방수\n• 터치 제어'
  },
  3: {
    id: 3,
    name: '노트북 스탠드',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop',
    description: '인체공학적 노트북 스탠드로 편안한 작업 환경을 만들어보세요.',
    details: '• 높이 조절 가능\n• 알루미늄 소재\n• 통풍 설계\n• 휴대용'
  },
  4: {
    id: 4,
    name: '블루투스 스피커',
    price: 120000,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop',
    description: '고음질 블루투스 스피커로 어디서나 음악을 즐기세요.',
    details: '• 360도 사운드\n• 20시간 재생\n• 방수 기능\n• 다중 연결 지원'
  },
  5: {
    id: 5,
    name: '스마트 워치',
    price: 250000,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    description: '최신 스마트 워치로 건강과 일상을 관리하세요.',
    details: '• 심박수 측정\n• GPS 내장\n• 7일 배터리\n• 스마트 알림'
  },
  6: {
    id: 6,
    name: '무선 마우스',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop',
    description: '에르고노믹 무선 마우스로 장시간 사용해도 편안합니다.',
    details: '• 인체공학 디자인\n• 6개월 배터리\n• 고정밀 센서\n• 조용한 클릭'
  },
  7: {
    id: 7,
    name: 'USB-C 케이블',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500&h=500&fit=crop',
    description: '고속 충전 USB-C 케이블로 빠르게 충전하세요.',
    details: '• 고속 충전 지원\n• 내구성 강화\n• 다양한 길이\n• 데이터 전송'
  },
  8: {
    id: 8,
    name: '태블릿 거치대',
    price: 28000,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop',
    description: '조절 가능한 태블릿 거치대로 다양한 각도에서 사용하세요.',
    details: '• 각도 조절\n• 안정적인 지지\n• 접이식 디자인\n• 범용 호환'
  },
  9: {
    id: 9,
    name: '무선 키보드',
    price: 75000,
    image: 'https://images.unsplash.com/photo-1587829741301-dc918b0c716f?w=500&h=500&fit=crop',
    description: '프리미엄 무선 키보드로 편안한 타이핑을 경험하세요.',
    details: '• 기계식 키\n• 백라이트 지원\n• 1년 배터리\n• 멀티 디바이스 연결'
  },
  10: {
    id: 10,
    name: '게이밍 마우스패드',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=500&h=500&fit=crop',
    description: '대형 게이밍 마우스패드로 정밀한 조작이 가능합니다.',
    details: '• 대형 사이즈\n• 미끄럼 방지\n• 내구성 강화\n• 세척 가능'
  },
  11: {
    id: 11,
    name: '웹캠 HD',
    price: 95000,
    image: 'https://images.unsplash.com/photo-1587825143138-044a3fa50491?w=500&h=500&fit=crop',
    description: '고화질 웹캠으로 선명한 화상 통화를 즐기세요.',
    details: '• 1080p HD 화질\n• 자동 초점\n• 노이즈 캔슬링 마이크\n• 범용 호환'
  },
  12: {
    id: 12,
    name: '스탠딩 데스크',
    price: 180000,
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&h=500&fit=crop',
    description: '전동 스탠딩 데스크로 건강한 업무 환경을 만들어보세요.',
    details: '• 전동 높이 조절\n• 안정적인 구조\n• 넓은 작업 공간\n• 메모리 기능'
  },
  13: {
    id: 13,
    name: 'USB 허브',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=500&h=500&fit=crop',
    description: '다중 포트 USB 허브로 여러 기기를 동시에 연결하세요.',
    details: '• 7포트 지원\n• 고속 전송\n• 컴팩트 디자인\n• 플러그 앤 플레이'
  },
  14: {
    id: 14,
    name: '모니터 스탠드',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop',
    description: '조절 가능한 모니터 스탠드로 최적의 시야각을 설정하세요.',
    details: '• 높이 조절\n• 각도 조절\n• 케이블 관리\n• 안정적인 지지'
  },
  15: {
    id: 15,
    name: '블루투스 어댑터',
    price: 18000,
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500&h=500&fit=crop',
    description: 'USB 블루투스 어댑터로 무선 연결을 확장하세요.',
    details: '• 블루투스 5.0\n• 플러그 앤 플레이\n• 저전력 소비\n• 범용 호환'
  },
  16: {
    id: 16,
    name: '노이즈 캔슬링 이어폰',
    price: 150000,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    description: '프리미엄 노이즈 캔슬링 이어폰으로 집중력을 높이세요.',
    details: '• 액티브 노이즈 캔슬링\n• 프리미엄 사운드\n• 30시간 배터리\n• 터치 제어'
  },
  // 오늘의 핫딜 상품 (101-110)
  101: {
    id: 101,
    name: '프리미엄 무선 이어폰',
    price: 99000,
    originalPrice: 150000,
    discount: 34,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop',
    description: '프리미엄 무선 이어폰으로 최고의 음질을 경험하세요. 노이즈 캔슬링 기능이 탑재되어 있습니다.',
    details: '• 노이즈 캔슬링\n• 30시간 배터리\n• IPX7 방수\n• 터치 제어\n• 프리미엄 사운드'
  },
  102: {
    id: 102,
    name: '스마트 워치 프로',
    price: 249000,
    originalPrice: 350000,
    discount: 29,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    description: '최신 스마트 워치 프로로 건강과 일상을 관리하세요. 고급 기능이 탑재되어 있습니다.',
    details: '• 심박수 측정\n• GPS 내장\n• 7일 배터리\n• 스마트 알림\n• 운동 추적'
  },
  103: {
    id: 103,
    name: '블루투스 스피커',
    price: 129000,
    originalPrice: 180000,
    discount: 28,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop',
    description: '고음질 블루투스 스피커로 어디서나 음악을 즐기세요.',
    details: '• 360도 사운드\n• 20시간 재생\n• 방수 기능\n• 다중 연결 지원\n• 강력한 베이스'
  },
  104: {
    id: 104,
    name: '에어프라이어 대용량',
    price: 179000,
    originalPrice: 250000,
    discount: 28,
    image: 'https://images.unsplash.com/photo-1556910096-6f5e5ad8bcf4?w=500&h=500&fit=crop',
    description: '대용량 에어프라이어로 건강한 요리를 즐기세요.',
    details: '• 대용량 5.5L\n• 빠른 조리\n• 건강한 요리\n• 쉬운 세척\n• 디지털 디스플레이'
  },
  105: {
    id: 105,
    name: '프리미엄 향수 세트',
    price: 139000,
    originalPrice: 200000,
    discount: 31,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=500&fit=crop',
    description: '프리미엄 향수 세트로 특별한 하루를 시작하세요.',
    details: '• 프리미엄 향료\n• 오래 지속되는 향\n• 세트 구성\n• 우아한 디자인\n• 선물 포장 가능'
  },
  106: {
    id: 106,
    name: '스킨케어 스페셜 세트',
    price: 119000,
    originalPrice: 180000,
    discount: 34,
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=500&fit=crop',
    description: '프리미엄 스킨케어 세트로 건강한 피부를 관리하세요.',
    details: '• 천연 성분\n• 수분 공급\n• 안티에이징\n• 세트 구성\n• 피부 진정 효과'
  },
  107: {
    id: 107,
    name: '디퓨저 아로마 세트',
    price: 55000,
    originalPrice: 80000,
    discount: 31,
    image: 'https://images.unsplash.com/photo-1606800054160-8e3c14e1a0b0?w=500&h=500&fit=crop',
    description: '아로마 디퓨저 세트로 편안한 공간을 만들어보세요.',
    details: '• LED 조명\n• 타이머 기능\n• 조용한 작동\n• 아로마 오일 포함\n• 실내 공기 정화'
  },
  108: {
    id: 108,
    name: '프리미엄 한우 세트',
    price: 89000,
    originalPrice: 120000,
    discount: 26,
    image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=500&h=500&fit=crop',
    description: '1등급 한우 세트로 특별한 식사를 즐기세요.',
    details: '• 1등급 한우\n• 신선한 원육\n• 적절한 포장\n• 냉동 보관\n• 조리 가이드 포함'
  },
  109: {
    id: 109,
    name: '노트북 프로 15인치',
    price: 1790000,
    originalPrice: 2200000,
    discount: 19,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&h=500&fit=crop',
    description: '고성능 노트북 프로로 업무와 창작을 완벽하게 처리하세요.',
    details: '• 고성능 프로세서\n• 15인치 디스플레이\n• 대용량 메모리\n• 빠른 저장장치\n• 긴 배터리 수명'
  },
  110: {
    id: 110,
    name: '무선 청소기 프로',
    price: 329000,
    originalPrice: 450000,
    discount: 27,
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=500&fit=crop',
    description: '강력한 무선 청소기 프로로 깨끗한 집을 만드세요.',
    details: '• 강력한 흡입력\n• 무선 사용\n• 긴 배터리\n• 다양한 헤드\n• HEPA 필터'
  },
  // 오늘의 특가 상품 (201-210)
  201: {
    id: 201,
    name: '프리미엄 노이즈캔슬링 헤드폰',
    price: 199000,
    originalPrice: 280000,
    discount: 29,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    description: '프리미엄 노이즈캔슬링 헤드폰으로 몰입감 있는 음악을 즐기세요.',
    details: '• 액티브 노이즈 캔슬링\n• 프리미엄 사운드\n• 30시간 배터리\n• 터치 제어\n• 편안한 착용감'
  },
  202: {
    id: 202,
    name: '4K 울트라 와이드 모니터',
    price: 329000,
    originalPrice: 450000,
    discount: 27,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=500&h=500&fit=crop',
    description: '4K 울트라 와이드 모니터로 넓은 화면을 경험하세요.',
    details: '• 4K 해상도\n• 울트라 와이드\n• HDR 지원\n• 빠른 응답속도\n• 다양한 연결 포트'
  },
  203: {
    id: 203,
    name: '프리미엄 커피 머신',
    price: 229000,
    originalPrice: 320000,
    discount: 28,
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=500&h=500&fit=crop',
    description: '프리미엄 커피 머신으로 카페 수준의 커피를 집에서 즐기세요.',
    details: '• 자동 추출\n• 다양한 커피 종류\n• 온도 조절\n• 쉬운 세척\n• 컴팩트 디자인'
  },
  204: {
    id: 204,
    name: '스마트 홈 시큐리티 세트',
    price: 279000,
    originalPrice: 380000,
    discount: 27,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop',
    description: '스마트 홈 시큐리티 세트로 안전한 집을 만드세요.',
    details: '• 실시간 모니터링\n• 모바일 앱 연동\n• 야간 촬영\n• 알림 기능\n• 쉬운 설치'
  },
  205: {
    id: 205,
    name: '프리미엄 운동화',
    price: 129000,
    originalPrice: 180000,
    discount: 28,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&h=500&fit=crop',
    description: '프리미엄 운동화로 편안한 운동을 즐기세요.',
    details: '• 쿠션 기술\n• 가벼운 무게\n• 통기성 좋음\n• 내구성 강화\n• 다양한 사이즈'
  },
  206: {
    id: 206,
    name: '무선 충전기 스탠드',
    price: 45000,
    originalPrice: 65000,
    discount: 31,
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500&h=500&fit=crop',
    description: '무선 충전기 스탠드로 편리하게 충전하세요.',
    details: '• 고속 무선 충전\n• 스탠드 기능\n• 다양한 기기 지원\n• 안정적인 거치\n• LED 표시등'
  },
  207: {
    id: 207,
    name: '프리미엄 캠핑 텐트',
    price: 249000,
    originalPrice: 350000,
    discount: 29,
    image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=500&h=500&fit=crop',
    description: '프리미엄 캠핑 텐트로 편안한 캠핑을 즐기세요.',
    details: '• 방수 기능\n• 통기성 좋음\n• 쉬운 설치\n• 넓은 공간\n• 내구성 강화'
  },
  208: {
    id: 208,
    name: '스마트 냉장고',
    price: 2190000,
    originalPrice: 2800000,
    discount: 22,
    image: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=500&h=500&fit=crop',
    description: '스마트 냉장고로 식품을 효율적으로 관리하세요.',
    details: '• 스마트 제어\n• 에너지 효율\n• 넓은 수납공간\n• 디지털 디스플레이\n• 음성 제어 지원'
  },
  209: {
    id: 209,
    name: '프리미엄 가죽 가방',
    price: 299000,
    originalPrice: 420000,
    discount: 29,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500&h=500&fit=crop',
    description: '프리미엄 가죽 가방으로 세련된 스타일을 완성하세요.',
    details: '• 천연 가죽\n• 넓은 수납공간\n• 내구성 강화\n• 우아한 디자인\n• 다양한 수납공간'
  },
  210: {
    id: 210,
    name: '로봇 진공청소기',
    price: 399000,
    originalPrice: 550000,
    discount: 27,
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=500&fit=crop',
    description: '로봇 진공청소기로 자동으로 깨끗한 집을 만드세요.',
    details: '• 자동 청소\n• 스마트 매핑\n• 강력한 흡입력\n• 자동 충전\n• 모바일 앱 제어'
  }
};

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const productId = parseInt(id);
  // 먼저 기본 products에서 찾고, 없으면 categoryProducts에서 찾기
  const product = products[productId] || getCategoryProductById(productId);
  const [activeTab, setActiveTab] = useState('detail');
  const [wishlistStatus, setWishlistStatus] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedTotal, setSelectedTotal] = useState(null);
  const [couponReceived, setCouponReceived] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [inquiryContent, setInquiryContent] = useState('');
  const [inquiries, setInquiries] = useState([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedInquiryId, setSelectedInquiryId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewSortOrder, setReviewSortOrder] = useState('latest'); // 'latest' or 'rating'

  // 찜한 상품 상태 확인 및 배송지 정보 불러오기
  useEffect(() => {
    if (product) {
      setWishlistStatus(isWishlisted(product.id));
      setSelectedProductId(product.id); // 현재 상품을 기본값으로 설정
    }
    // 저장된 배송지 정보 불러오기
    const savedAddress = getDeliveryAddress();
    if (savedAddress) {
      setDeliveryAddress(savedAddress);
    }
  }, [product]);

  // 상품 문의 목록 불러오기
  useEffect(() => {
    if (product && activeTab === 'inquiry') {
      const productInquiries = getInquiries(product.id);
      setInquiries(productInquiries);
    }
  }, [product, activeTab]);

  // 구매후기 목록 불러오기 및 정렬
  useEffect(() => {
    if (product) {
      let productReviews = getReviewsByProductId(product.id);
      
      // 정렬 적용
      if (reviewSortOrder === 'rating') {
        // 별점순: 높은 별점부터
        productReviews = [...productReviews].sort((a, b) => b.rating - a.rating);
      } else {
        // 최신순: 최신 후기부터
        productReviews = [...productReviews].sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );
      }
      
      setReviews(productReviews);
    }
  }, [product, activeTab, reviewSortOrder]);

  if (!product) {
    return (
      <div className="product-detail-container">
        <div className="product-not-found">
          <h2>상품을 찾을 수 없습니다</h2>
          <button onClick={() => navigate('/')} className="back-button">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'detail', label: '상세설명' },
    { id: 'review', label: '구매후기' },
    { id: 'inquiry', label: '상품 문의' },
    { id: 'return', label: '교환/반품' }
  ];

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleSelect = () => {
    const total = product.price * quantity;
    setSelectedTotal({ quantity, total });
  };

  const handleAddToCart = () => {
    // 장바구니 추가 로직
    window.alert(`${product.name} ${quantity}개가 장바구니에 추가되었습니다.`);
  };

  // 쿠폰 모달 열기
  const handleOpenCouponModal = () => {
    // 로그인 확인
    if (!isLoggedIn()) {
      window.alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    // 배송지 확인
    if (!hasDeliveryAddress() || !deliveryAddress) {
      const setAddress = window.confirm('배송지가 설정되지 않았습니다. 배송지를 설정하시겠습니까?');
      if (setAddress) {
        handleAddressSet();
        return;
      } else {
        window.alert('배송지 설정이 필요합니다.');
        return;
      }
    }

    // 사용 가능한 쿠폰 가져오기
    checkCouponExpiry();
    const coupons = getReceivedCoupons();
    const usableCoupons = coupons.filter(coupon => {
      // 사용 가능한 상태인지 확인
      if (coupon.status !== 'received') return false;
      
      // 만료일 확인
      const validUntil = new Date(coupon.validUntil);
      if (validUntil < new Date()) return false;

      // 상품별 쿠폰인 경우 해당 상품에만 적용 가능
      if (coupon.productId && coupon.productId !== product.id) return false;

      // 최소 구매 금액 확인
      const totalAmount = product.price * quantity;
      if (coupon.minPurchase && totalAmount < coupon.minPurchase) return false;

      return true;
    });

    setAvailableCoupons(usableCoupons);
    setShowCouponModal(true);
  };

  // 쿠폰 선택
  const handleSelectCoupon = (coupon) => {
    setSelectedCoupon(coupon);
  };

  // 쿠폰 모달 닫기
  const handleCloseCouponModal = () => {
    setShowCouponModal(false);
    setSelectedCoupon(null);
  };

  // 최종 결제 진행
  const handleFinalPayment = async () => {
    // 결제 금액 계산
    const totalAmount = product.price * quantity;
    let discountAmount = 0;

    // 쿠폰 할인 금액 계산
    if (selectedCoupon) {
      if (selectedCoupon.discountType === 'fixed') {
        discountAmount = selectedCoupon.discount;
      } else if (selectedCoupon.discountType === 'percent') {
        discountAmount = Math.floor(totalAmount * (selectedCoupon.discount / 100));
      }
    }

    const subtotal = Math.max(0, totalAmount - discountAmount);
    const shippingFee = subtotal >= 15000 ? 0 : 3000; // 무료배송 조건
    const finalAmount = subtotal + shippingFee;

    // 주문 정보
    const orderId = generateOrderId();
    const orderName = quantity > 1 
      ? `${product.name} 외 ${quantity - 1}개`
      : product.name;

    // 결제 데이터 준비
    const paymentData = {
      amount: finalAmount,
      orderId: orderId,
      orderName: orderName,
      customerName: deliveryAddress.recipient || '고객님',
      product: product,
      quantity: quantity,
      deliveryAddress: deliveryAddress,
      coupon: selectedCoupon,
      discountAmount: discountAmount
    };

    try {
      // 쿠폰 사용 처리
      if (selectedCoupon) {
        applyCoupon(selectedCoupon.id);
      }

      // 결제 데이터를 sessionStorage에 임시 저장 (결제 성공 시 주문 저장용)
      sessionStorage.setItem('pendingOrder', JSON.stringify(paymentData));

      // 토스페이먼츠 결제 처리
      await processPayment(paymentData);
      handleCloseCouponModal();
    } catch (error) {
      window.alert(`결제 처리 중 오류가 발생했습니다: ${error.message}`);
      sessionStorage.removeItem('pendingOrder');
    }
  };

  const handleBuyNow = async () => {
    handleOpenCouponModal();
  };

  const handleCouponReceive = () => {
    if (!isLoggedIn()) {
      window.alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    const result = receiveProductCoupon(
      product.id,
      product.name,
      product.discount || 15
    );

    if (result.success) {
      setCouponReceived(true);
      window.alert(result.message);
    } else {
      window.alert(result.message);
    }
  };

  const handleAddressSet = () => {
    // 다음 주소 API 사용
    if (!window.daum || !window.daum.Postcode) {
      window.alert('주소 검색 서비스를 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }

    new window.daum.Postcode({
      oncomplete: function(data) {
        // 주소 선택 완료 후 상세주소 입력 받기
        const fullAddress = data.address; // 선택한 주소
        const extraAddress = ''; // 참고항목

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

        // 상세주소 입력 받기
        const detailAddress = window.prompt(`상세주소를 입력해주세요:\n\n기본주소: ${fullAddress}${extraAddress}`);
        
        if (detailAddress === null) {
          return; // 취소한 경우
        }

        // 받는 분 이름 입력 받기
        const recipient = window.prompt('받는 분 이름을 입력해주세요:') || '고객님';
        
        // 연락처 입력 받기
        const phone = window.prompt('연락처를 입력해주세요:') || '';

        // 최종 주소 조합 (상세주소가 있으면 추가)
        const detailAddr = detailAddress.trim();
        const finalAddress = detailAddr 
          ? `${fullAddress}${extraAddress} ${detailAddr}`.trim()
          : `${fullAddress}${extraAddress}`.trim();

        const addressData = {
          postcode: data.zonecode, // 우편번호
          address: finalAddress,
          roadAddress: data.roadAddress, // 도로명주소
          jibunAddress: data.jibunAddress, // 지번주소
          recipient: recipient,
          phone: phone
        };

        const saved = saveDeliveryAddress(addressData);
        if (saved) {
          setDeliveryAddress(saved);
          window.alert('배송지가 설정되었습니다.');
        }
      },
      width: '100%',
      height: '100%',
      maxSuggestItems: 5
    }).open({
      q: '', // 검색어 (선택사항)
      left: (window.screen.width / 2) - (500 / 2),
      top: (window.screen.height / 2) - (600 / 2)
    });
  };

  const handleRatingClick = () => {
    setActiveTab('review');
    // 구매후기 탭으로 스크롤
    setTimeout(() => {
      const tabContent = document.querySelector('.product-tabs');
      if (tabContent) {
        tabContent.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleWishlistToggle = () => {
    if (wishlistStatus) {
      removeFromWishlist(product.id);
      setWishlistStatus(false);
    } else {
      addToWishlist(product);
      setWishlistStatus(true);
    }
  };

  const handleOpenInquiryModal = () => {
    if (!isLoggedIn()) {
      window.alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    setShowInquiryModal(true);
    setSelectedProductId(product.id);
    setInquiryContent('');
  };

  const handleCloseInquiryModal = () => {
    setShowInquiryModal(false);
    setInquiryContent('');
  };

  const handleSubmitInquiry = () => {
    if (!product) {
      window.alert('상품 정보를 불러올 수 없습니다.');
      return;
    }

    if (!inquiryContent.trim()) {
      window.alert('문의내용을 입력해주세요.');
      return;
    }

    const inquiryData = {
      productId: product.id,
      productName: product.name,
      content: inquiryContent.trim(),
      author: 'test' // 실제로는 로그인한 사용자 정보 사용
    };

    const newInquiry = addInquiry(inquiryData);
    
    if (newInquiry) {
      window.alert('상품 문의가 등록되었습니다.');
      handleCloseInquiryModal();
      // 상품 문의 목록 새로고침
      const productInquiries = getInquiries(product.id);
      setInquiries(productInquiries);
    } else {
      window.alert('상품 문의 등록에 실패했습니다.');
    }
  };

  const handleOpenReplyModal = (inquiryId) => {
    setSelectedInquiryId(inquiryId);
    setReplyContent('');
    setShowReplyModal(true);
  };

  const handleCloseReplyModal = () => {
    setShowReplyModal(false);
    setSelectedInquiryId(null);
    setReplyContent('');
  };

  const handleSubmitReply = () => {
    if (!selectedInquiryId) {
      window.alert('문의를 선택해주세요.');
      return;
    }

    if (!replyContent.trim()) {
      window.alert('답변 내용을 입력해주세요.');
      return;
    }

    const updatedInquiry = addInquiryReply(selectedInquiryId, replyContent.trim());
    
    if (updatedInquiry) {
      window.alert('답변이 등록되었습니다.');
      handleCloseReplyModal();
      // 상품 문의 목록 새로고침
      const productInquiries = getInquiries(product.id);
      setInquiries(productInquiries);
    } else {
      window.alert('답변 등록에 실패했습니다.');
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'detail':
        return (
          <div className="tab-content-detail">
            <div className="detail-section">
              <h3>상품 설명</h3>
              <p>{product.description}</p>
            </div>
            <div className="detail-section">
              <h3>상품 상세</h3>
              <pre>{product.details}</pre>
            </div>
          </div>
        );
      case 'review':
        return (
          <div className="tab-content-review">
            {reviews.length === 0 ? (
              <div className="review-empty">
                <p>아직 등록된 구매후기가 없습니다.</p>
                <p className="review-empty-sub">첫 번째 후기를 작성해보세요!</p>
              </div>
            ) : (
              <>
                <div className="review-header-bar">
                  <div className="review-count">리뷰 {reviews.length}건</div>
                  <div className="review-sort-controls">
                    <button
                      className={`review-sort-btn ${reviewSortOrder === 'rating' ? 'active' : ''}`}
                      onClick={() => setReviewSortOrder('rating')}
                    >
                      별점순
                    </button>
                    <span className="review-sort-divider">|</span>
                    <button
                      className={`review-sort-btn ${reviewSortOrder === 'latest' ? 'active' : ''}`}
                      onClick={() => setReviewSortOrder('latest')}
                    >
                      최신순
                    </button>
                  </div>
                </div>
                <div className="review-list">
                  {reviews.map((review) => (
                    <div key={review.id} className="review-item">
                      <div className="review-header-section">
                        <div className="review-author-row">
                          <span className="review-author">{review.author}</span>
                          <div className="review-rating">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 24 24"
                                fill={i < review.rating ? "#ff9800" : "#e0e0e0"}
                                className="review-star"
                              >
                                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                              </svg>
                            ))}
                          </div>
                          <span className="review-date">
                            {new Date(review.createdAt).toLocaleDateString('ko-KR', {
                              year: 'numeric',
                              month: 'numeric',
                              day: 'numeric'
                            }).replace(/\./g, '.').replace(/\s/g, '')}
                          </span>
                        </div>
                        <div className="review-product-title">{review.productName}</div>
                        {review.images && review.images.length > 0 && (
                          <div className="review-images">
                            {review.images.map((image, index) => (
                              <img
                                key={index}
                                src={image}
                                alt={`리뷰 이미지 ${index + 1}`}
                                className="review-image"
                              />
                            ))}
                          </div>
                        )}
                        <div className="review-content">
                          <p>{review.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        );
      case 'inquiry':
        return (
          <div className="tab-content-inquiry">
            <div className="inquiry-header">
              <h3>상품 문의</h3>
              <button className="inquiry-write-btn" onClick={handleOpenInquiryModal}>
                문의하기
              </button>
            </div>
            <div className="inquiry-notice">
              <h4>상품 문의 안내</h4>
              <ul>
                <li>구매한 상품의 취소/반품은 마이페이지 상품 문의에서 신청 가능합니다.</li>
                <li>상품 문의 및 후기게시판을 통해 취소나 환불, 반품 등은 처리되지 않습니다.</li>
                <li>가격, 판매자, 교환/환불 및 배송 등 해당 상품 자체와 관련 없는 문의는 고객센터 내 1:1 문의하기를 이용해주세요.</li>
                <li>"해당 상품 자체"와 관계없는 글, 양도, 광고성, 욕설, 비방, 도배 등의 글은 예고 없이 이동, 노출제한, 삭제 등의 조치가 취해질 수 있습니다.</li>
                <li>공개 게시판이므로 전화번호, 메일 주소 등 고객님의 소중한 개인정보는 절대 남기지 말아주세요.</li>
              </ul>
            </div>
            {inquiries.length === 0 ? (
              <div className="inquiry-empty">
                <p>아직 등록된 상품 문의가 없습니다.</p>
              </div>
            ) : (
              <div className="inquiry-list">
                {inquiries.map((inquiry) => (
                  <div key={inquiry.id} className="inquiry-item">
                    <div className="inquiry-item-header">
                      <div className="inquiry-item-header-left">
                        <span className="inquiry-author">{inquiry.author}</span>
                        <span className="inquiry-date">
                          {new Date(inquiry.createdAt).toLocaleDateString('ko-KR')}
                        </span>
                        <span className={`inquiry-status ${inquiry.status === '답변완료' ? 'completed' : ''}`}>
                          {inquiry.status}
                        </span>
                      </div>
                      {isAdmin() && inquiry.status === '답변대기' && (
                        <button 
                          className="inquiry-reply-btn"
                          onClick={() => {
                            setSelectedInquiryId(inquiry.id);
                            setReplyContent('');
                            setShowReplyModal(true);
                          }}
                        >
                          답변하기
                        </button>
                      )}
                    </div>
                    <div className="inquiry-item-content">{inquiry.content}</div>
                    {inquiry.reply && (
                      <div className="inquiry-reply">
                        <div className="inquiry-reply-header">
                          <span className="inquiry-reply-label">관리자 답변</span>
                          <span className="inquiry-reply-date">
                            {new Date(inquiry.replyDate).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <div className="inquiry-reply-content">{inquiry.reply}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      case 'return':
        return (
          <div className="tab-content-return">
            <div className="return-info">
              <h3>교환/반품 안내</h3>
              <div className="return-section">
                <h4>교환/반품 가능 기간</h4>
                <p>상품 수령 후 7일 이내</p>
              </div>
              <div className="return-section">
                <h4>교환/반품 불가 사유</h4>
                <ul>
                  <li>고객님의 단순 변심으로 인한 교환/반품은 상품 수령 후 7일 이내에만 가능합니다.</li>
                  <li>상품이 이미 사용되었거나 훼손된 경우</li>
                  <li>상품의 가치가 현저히 감소한 경우</li>
                  <li>시간이 지나 재판매가 어려운 경우</li>
                </ul>
              </div>
              <div className="return-section">
                <h4>교환/반품 배송비</h4>
                <p>단순 변심으로 인한 교환/반품 시 배송비는 고객님 부담입니다.</p>
              </div>
              <div className="return-section">
                <h4>문의</h4>
                <p>교환/반품 관련 문의는 고객센터(1588-0000)로 연락주시기 바랍니다.</p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="product-detail-container">
      {/* 브레드크럼 */}
      <div className="breadcrumb">
        <span className="breadcrumb-item" onClick={() => navigate('/')}>홈</span>
        <span className="breadcrumb-separator"> &gt; </span>
        <span className="breadcrumb-item" onClick={() => navigate(`/category/${product.categoryId || 'electronics'}`)}>
          {product.category || '가전용품'}
        </span>
        <span className="breadcrumb-separator"> &gt; </span>
        <span className="breadcrumb-item active">{product.name}</span>
      </div>

      <div className="product-detail-content">
        <div className="product-detail-image">
          <img src={product.image} alt={product.name} />
        </div>
        <div className="product-detail-info">
          {/* 판매자 정보 */}
          <div className="seller-info">
            <span className="seller-name">Moodly</span>
            <span className="seller-badge">공식</span>
          </div>

          {/* 상품명 및 아이콘 */}
          <div className="product-title-row">
            <h1 className="product-detail-name">{product.name}</h1>
            <button 
              className={`wishlist-button ${wishlistStatus ? 'active' : ''}`}
              onClick={handleWishlistToggle}
              aria-label="찜하기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={wishlistStatus ? "#e74c3c" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </div>

          {/* 별점 및 구매 정보 */}
          <div className="product-rating-info" onClick={handleRatingClick} style={{ cursor: 'pointer' }}>
            <div className="rating-stars">
              {[1, 2, 3, 4, 5].map((star) => (
                <span key={star} className={`star ${star <= Math.round(product.rating || 4.5) ? 'filled' : ''}`}>
                  ★
                </span>
              ))}
            </div>
            <span className="rating-text">({product.reviewCount || 0})</span>
            <span className="rating-separator">|</span>
            <span className="purchase-count">구매 {product.purchaseCount || 0}</span>
          </div>

          {/* 가격 정보 */}
          <div className="product-price-section">
            {product.originalPrice && (
              <span className="product-original-price">{product.originalPrice.toLocaleString()}원</span>
            )}
            <div className="price-row">
              <span className="product-detail-price">{product.price.toLocaleString()}원</span>
              {product.discount && (
                <span className="discount-badge">{product.discount}% 할인</span>
              )}
            </div>
            {product.originalPrice && (
              <span className="coupon-price-label">
                쿠폰적용가
                <svg className="info-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </span>
            )}
          </div>

          {/* 쿠폰 받기 */}
          <div className="coupon-section">
            {!couponReceived ? (
              <>
                <button className="coupon-button" onClick={handleCouponReceive}>
                  최대 {product.discount || 15}% 할인 쿠폰을 받으세요!
                </button>
                <button className="coupon-download-btn" onClick={handleCouponReceive}>
                  ↓ 쿠폰받기
                </button>
              </>
            ) : (
              <div className="coupon-received">
                <span>✓ 쿠폰이 발급되었습니다!</span>
              </div>
            )}
          </div>

          {/* 배송 정보 */}
          <div className="delivery-section">
            <div className="delivery-header">
              <svg className="delivery-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              <span>배송 받을 주소를 설정해보세요.</span>
              <button className="address-set-btn" onClick={handleAddressSet}>
                설정하기
              </button>
            </div>
            {deliveryAddress ? (
              <div className="delivery-address">
                <div className="delivery-address-info">
                  <span className="delivery-address-label">✓ 배송지:</span>
                  {deliveryAddress.postcode && (
                    <span className="delivery-postcode">[{deliveryAddress.postcode}]</span>
                  )}
                  <span className="delivery-address-text">{deliveryAddress.address}</span>
                  {deliveryAddress.recipient && (
                    <span className="delivery-recipient">받는 분: {deliveryAddress.recipient}</span>
                  )}
                  {deliveryAddress.phone && (
                    <span className="delivery-phone">연락처: {deliveryAddress.phone}</span>
                  )}
                </div>
                <button className="delivery-change-btn" onClick={handleAddressSet}>
                  변경하기
                </button>
                <span className="delivery-date">12/22(월) 도착보장 (강남구 역삼동 기준)</span>
              </div>
            ) : (
              <div className="delivery-info">
                <span className="delivery-date">12/22(월) 도착보장 (강남구 역삼동 기준)</span>
                <svg className="info-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
              </div>
            )}
            <div className="free-shipping">무료배송 (1.5만원 이상 구매시)</div>
          </div>

          {/* 수량 선택 */}
          <div className="quantity-section">
            <label>수량</label>
            <div className="quantity-controls">
              <button 
                className="quantity-btn" 
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="quantity-value">{quantity}</span>
              <button 
                className="quantity-btn" 
                onClick={() => handleQuantityChange(1)}
              >
                +
              </button>
            </div>
          </div>

          {/* 선택 버튼 및 선택 정보 */}
          <div className="select-section">
            <button className="select-button" onClick={handleSelect}>
              선택
            </button>
            {selectedTotal && (
              <div className="selected-info">
                <span>선택한 상품: {selectedTotal.quantity}개</span>
                <span className="selected-total">총 {selectedTotal.total.toLocaleString()}원</span>
              </div>
            )}
          </div>

          {/* 장바구니 및 구매하기 */}
          <div className="product-detail-actions">
            <button className="add-to-cart-button" onClick={handleAddToCart}>
              장바구니
            </button>
            <button className="buy-now-button" onClick={handleBuyNow}>
              구매하기
            </button>
          </div>
        </div>
      </div>
      
      {/* 탭 메뉴 */}
      <div className="product-tabs">
        <div className="tab-buttons">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        
        {/* 탭 컨텐츠 */}
        <div className="tab-content">
          {renderTabContent()}
        </div>
      </div>

      {/* 쿠폰 선택 모달 */}
      {showCouponModal && (
        <div className="coupon-modal-overlay" onClick={handleCloseCouponModal}>
          <div className="coupon-modal" onClick={(e) => e.stopPropagation()}>
            <div className="coupon-modal-header">
              <h3>쿠폰 선택</h3>
              <button className="coupon-modal-close" onClick={handleCloseCouponModal}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="coupon-modal-body">
              <div className="coupon-modal-product-info">
                <img src={product.image} alt={product.name} className="coupon-modal-product-image" />
                <div className="coupon-modal-product-details">
                  <h4>{product.name}</h4>
                  <p>수량: {quantity}개</p>
                  <p className="coupon-modal-product-price">상품금액: {(product.price * quantity).toLocaleString()}원</p>
                </div>
              </div>

              <div className="coupon-modal-coupon-list">
                <h4>사용 가능한 쿠폰</h4>
                {availableCoupons.length === 0 ? (
                  <div className="coupon-modal-empty">
                    <p>사용 가능한 쿠폰이 없습니다.</p>
                  </div>
                ) : (
                  <div className="coupon-modal-coupons">
                    <div 
                      className={`coupon-modal-coupon-item ${selectedCoupon === null ? 'selected' : ''}`}
                      onClick={() => setSelectedCoupon(null)}
                    >
                      <input 
                        type="radio" 
                        name="coupon" 
                        checked={selectedCoupon === null}
                        onChange={() => setSelectedCoupon(null)}
                      />
                      <label>쿠폰 미사용</label>
                    </div>
                    {availableCoupons.map((coupon) => {
                      const totalAmount = product.price * quantity;
                      let discountAmount = 0;
                      if (coupon.discountType === 'fixed') {
                        discountAmount = coupon.discount;
                      } else {
                        discountAmount = Math.floor(totalAmount * (coupon.discount / 100));
                      }
                      const finalAmount = Math.max(0, totalAmount - discountAmount);

                      return (
                        <div 
                          key={coupon.id}
                          className={`coupon-modal-coupon-item ${selectedCoupon?.id === coupon.id ? 'selected' : ''}`}
                          onClick={() => handleSelectCoupon(coupon)}
                        >
                          <input 
                            type="radio" 
                            name="coupon" 
                            checked={selectedCoupon?.id === coupon.id}
                            onChange={() => handleSelectCoupon(coupon)}
                          />
                          <div className="coupon-modal-coupon-info">
                            <div className="coupon-modal-coupon-name">{coupon.name}</div>
                            <div className="coupon-modal-coupon-desc">{coupon.description}</div>
                            {coupon.discountType === 'fixed' ? (
                              <div className="coupon-modal-coupon-discount">{coupon.discount.toLocaleString()}원 할인</div>
                            ) : (
                              <div className="coupon-modal-coupon-discount">{coupon.discount}% 할인 (최대 {discountAmount.toLocaleString()}원)</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 결제 금액 요약 */}
              <div className="coupon-modal-summary">
                <div className="coupon-modal-summary-row">
                  <span>상품금액</span>
                  <span>{(product.price * quantity).toLocaleString()}원</span>
                </div>
                {selectedCoupon && (
                  <>
                    <div className="coupon-modal-summary-row">
                      <span>쿠폰 할인</span>
                      <span className="coupon-discount-amount">
                        -{(() => {
                          const totalAmount = product.price * quantity;
                          if (selectedCoupon.discountType === 'fixed') {
                            return selectedCoupon.discount.toLocaleString();
                          } else {
                            return Math.floor(totalAmount * (selectedCoupon.discount / 100)).toLocaleString();
                          }
                        })()}원
                      </span>
                    </div>
                    <div className="coupon-modal-summary-row">
                      <span>할인 후 금액</span>
                      <span>
                        {(() => {
                          const totalAmount = product.price * quantity;
                          let discountAmount = 0;
                          if (selectedCoupon.discountType === 'fixed') {
                            discountAmount = selectedCoupon.discount;
                          } else {
                            discountAmount = Math.floor(totalAmount * (selectedCoupon.discount / 100));
                          }
                          return Math.max(0, totalAmount - discountAmount).toLocaleString();
                        })()}원
                      </span>
                    </div>
                  </>
                )}
                <div className="coupon-modal-summary-row">
                  <span>배송비</span>
                  <span>
                    {(() => {
                      const totalAmount = product.price * quantity;
                      let discountAmount = 0;
                      if (selectedCoupon) {
                        if (selectedCoupon.discountType === 'fixed') {
                          discountAmount = selectedCoupon.discount;
                        } else {
                          discountAmount = Math.floor(totalAmount * (selectedCoupon.discount / 100));
                        }
                      }
                      const subtotal = Math.max(0, totalAmount - discountAmount);
                      return subtotal >= 15000 ? '무료' : '3,000원';
                    })()}
                  </span>
                </div>
                <div className="coupon-modal-summary-row total">
                  <span>최종 결제금액</span>
                  <span className="coupon-modal-final-amount">
                    {(() => {
                      const totalAmount = product.price * quantity;
                      let discountAmount = 0;
                      if (selectedCoupon) {
                        if (selectedCoupon.discountType === 'fixed') {
                          discountAmount = selectedCoupon.discount;
                        } else {
                          discountAmount = Math.floor(totalAmount * (selectedCoupon.discount / 100));
                        }
                      }
                      const subtotal = Math.max(0, totalAmount - discountAmount);
                      const shippingFee = subtotal >= 15000 ? 0 : 3000;
                      return (subtotal + shippingFee).toLocaleString();
                    })()}원
                  </span>
                </div>
              </div>
            </div>
            <div className="coupon-modal-footer">
              <button className="coupon-modal-btn cancel" onClick={handleCloseCouponModal}>
                취소
              </button>
              <button 
                className="coupon-modal-btn confirm" 
                onClick={handleFinalPayment}
              >
                결제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상품 문의 작성 모달 */}
      {showInquiryModal && (
        <div className="inquiry-modal-overlay" onClick={handleCloseInquiryModal}>
          <div className="inquiry-modal" onClick={(e) => e.stopPropagation()}>
            <div className="inquiry-modal-header">
              <h3>상품 문의 작성</h3>
              <button className="inquiry-modal-close" onClick={handleCloseInquiryModal}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="inquiry-modal-body">
              <div className="inquiry-form-group">
                <label>상품정보</label>
                <div className="inquiry-product-info">
                  <div className="inquiry-product-image">
                    <img src={product.image} alt={product.name} />
                  </div>
                  <div className="inquiry-product-details">
                    <div className="inquiry-product-name">{product.name}</div>
                    <div className="inquiry-product-price">{product.price.toLocaleString()}원</div>
                  </div>
                </div>
              </div>
              <div className="inquiry-form-group">
                <label htmlFor="inquiry-content">문의내용</label>
                <textarea
                  id="inquiry-content"
                  className="inquiry-content-textarea"
                  value={inquiryContent}
                  onChange={(e) => setInquiryContent(e.target.value)}
                  placeholder="문의하실 내용을 입력해주세요."
                  rows={8}
                />
              </div>
            </div>
            <div className="inquiry-modal-footer">
              <button className="inquiry-modal-btn cancel" onClick={handleCloseInquiryModal}>
                취소
              </button>
              <button className="inquiry-modal-btn submit" onClick={handleSubmitInquiry}>
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 답변 작성 모달 */}
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
              {selectedInquiryId && inquiries.find(i => i.id === selectedInquiryId) && (
                <div className="inquiry-form-group">
                  <label>문의 내용</label>
                  <div className="inquiry-original-content">
                    {inquiries.find(i => i.id === selectedInquiryId).content}
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
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;

