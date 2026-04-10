import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { isWishlisted, addToWishlist, removeFromWishlist } from '../utils/wishlist';
import { getDeliveryAddress, saveDeliveryAddress, hasDeliveryAddress } from '../utils/delivery';
import { isLoggedIn, isAdmin } from '../utils/cookie';
import { processPayment } from '../utils/payment';
import { getInquiries, addInquiry } from '../utils/inquiry';
import { receiveProductCoupon, getReceivedCoupons, checkCouponExpiry, applyCoupon } from '../utils/coupon';
import { allProducts } from '../utils/products';
import { getReviewsByProductId } from '../utils/review';
import { getCategoryProductById } from '../utils/categoryProducts';
import { createInquiryNotification, createInquiryNotificationForAdmin, createInquiryReplyNotification } from '../utils/notification';
import { getCookie } from '../utils/cookie';
import { getUserIdFromToken, getAccessToken } from '../utils/token';
import { getProductById, addToCart, getDeliveryAddresses, createDeliveryAddress, addWishlistItem, getWishlistItem, removeWishlistItem, createProductInquiryApi, getProductInquiriesApi, getAdminProductInquiriesApi, updateProductInquiryApi, deleteProductInquiryApi, adminReplyProductInquiryApi, adminUpdateProductInquiryApi, adminDeleteProductInquiryApi, fetchUserCoupons, createServerOrder, prepareCartIdsForCheckout } from '../utils/api';
import { orderLineTotal, displayListPriceFromSale } from '../utils/pricing';
import './ProductDetail.css';

/** 백엔드 Product.price(정가) + 할인율% 와 동일한 기준 */
function catalogDiscountPercent(p) {
  if (!p) return 0;
  return p.productDiscount != null ? p.productDiscount : p.discount || 0;
}

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
    originalPrice: 166667,
    discount: 28,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop',
    description: '고음질 블루투스 스피커로 어디서나 음악을 즐기세요. 강력한 베이스와 선명한 고음으로 콘서트장 같은 몰입감을 선사합니다.',
    details: '• 360도 사운드로 어디서나 균일한 음질\n• 20시간 연속 재생 가능한 배터리\n• IPX5 방수 기능으로 야외 사용 가능\n• 다중 연결 지원으로 여러 기기 연결\n• 프리미엄 드라이버로 깊이 있는 사운드',
    rating: 4.8,
    reviewCount: 678
  },
  5: {
    id: 5,
    name: '스마트 워치',
    price: 250000,
    originalPrice: 352112,
    discount: 29,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    description: '최신 스마트 워치로 건강과 일상을 관리하세요. 운동 추적부터 알림까지 모든 것을 한 손목에서 처리할 수 있습니다.',
    details: '• 심박수 측정으로 건강 모니터링\n• GPS 내장으로 운동 경로 추적\n• 7일 배터리 수명으로 장시간 사용\n• 스마트 알림으로 중요한 정보 확인\n• 수영 방수 기능으로 다양한 운동 지원',
    rating: 4.65,
    reviewCount: 892
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
  // 오늘의 핫딜/특가에서 사용하는 추가 상품들
  25: {
    id: 25,
    name: '에어프라이어',
    price: 180000,
    originalPrice: 250000,
    discount: 28,
    image: 'https://images.unsplash.com/photo-1556910096-6f5e5ad8bcf4?w=500&h=500&fit=crop',
    description: '대용량 에어프라이어로 건강한 요리를 즐기세요. 기름 없이도 바삭하고 맛있는 요리를 만들 수 있습니다.',
    details: '• 대용량으로 가족 단위 요리 가능\n• 기름 없이 바삭한 요리 가능\n• 다양한 요리 모드 제공\n• 빠른 예열로 시간 절약\n• 세척이 쉬운 분리형 부품',
    rating: 4.65,
    reviewCount: 789
  },
  26: {
    id: 26,
    name: '로봇 청소기',
    price: 450000,
    originalPrice: 616438,
    discount: 27,
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=500&fit=crop',
    description: '스마트 로봇 청소기로 자동으로 깨끗한 집을 유지하세요. 스마트 매핑 기능으로 효율적인 청소 경로를 설정합니다.',
    details: '• 스마트 매핑으로 효율적인 청소\n• 자동 충전 기능으로 연속 청소\n• 모바일 앱으로 원격 제어\n• 강력한 흡입력으로 깊은 청소\n• 다양한 바닥재에 적합',
    rating: 4.8,
    reviewCount: 456
  },
  30: {
    id: 30,
    name: '프리미엄 한우',
    price: 85000,
    originalPrice: 114865,
    discount: 26,
    image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=500&h=500&fit=crop',
    description: '1등급 한우 세트로 프리미엄 고기를 즐기세요. 최상급 한우를 엄선하여 신선하게 배송해드립니다.',
    details: '• 1등급 한우로 최상급 품질\n• 신선도 보장으로 당일 배송\n• 다양한 부위 구성 (등심, 안심, 갈비 등)\n• 냉동 보관으로 오래 보관 가능\n• 특별한 날에 완벽한 선택',
    rating: 4.85,
    reviewCount: 234
  },
  35: {
    id: 35,
    name: '스킨케어 세트',
    price: 120000,
    originalPrice: 181818,
    discount: 34,
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=500&fit=crop',
    description: '프리미엄 스킨케어 세트로 건강한 피부를 만들어보세요. 모든 피부 타입에 적합한 완벽한 스킨케어 루틴을 제공합니다.',
    details: '• 클렌징, 토너, 세럼, 크림 완벽 구성\n• 모든 피부 타입에 적합\n• 수분 공급과 영양 공급 동시에\n• 프리미엄 원료로 안전하게 제조\n• 지속적인 사용으로 피부 개선',
    rating: 4.75,
    reviewCount: 567
  },
  37: {
    id: 37,
    name: '향수',
    price: 150000,
    originalPrice: 217391,
    discount: 31,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=500&fit=crop',
    description: '프리미엄 향수로 고급스러운 향을 즐기세요. 오래 지속되는 향과 세련된 향조를 제공합니다.',
    details: '• 프리미엄 향료로 고급스러운 향\n• 오래 지속되는 향기 (8시간 이상)\n• 세련된 향조로 다양한 상황에 적합\n• 우아한 디자인으로 소장 가치\n• 특별한 날에 완벽한 선택',
    rating: 4.8,
    reviewCount: 345
  },
  41: {
    id: 41,
    name: '디퓨저 세트',
    price: 45000,
    originalPrice: 65217,
    discount: 31,
    image: 'https://images.unsplash.com/photo-1606800054160-8e3c14e1a0b0?w=500&h=500&fit=crop',
    description: '아로마 디퓨저로 집안을 향기롭게 만들어보세요. 다양한 아로마 오일과 함께 사용하여 분위기를 연출할 수 있습니다.',
    details: '• 아로마 오일과 함께 사용하는 디퓨저\n• 다양한 향 옵션 제공\n• 조용한 작동으로 수면 방해 없음\n• LED 조명 기능으로 분위기 연출\n• 넓은 공간 향기 확산',
    rating: 4.65,
    reviewCount: 345
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
  const [searchParams] = useSearchParams();
  const productId = parseInt(id);
  
  // 상품 데이터 상태
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'detail');
  const [wishlistStatus, setWishlistStatus] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedTotal, setSelectedTotal] = useState(null);
  const [couponReceived, setCouponReceived] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState(null);
  const [showDeliveryAddressModal, setShowDeliveryAddressModal] = useState(false);
  const [deliveryAddresses, setDeliveryAddresses] = useState([]);
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    postcode: '',
    address: '',
    detailAddress: '',
    recipient: '',
    phoneNumber: '',
    isDefault: false
  });
  const setNewAddressFormRef = useRef(null);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);
  const [inquiryContent, setInquiryContent] = useState('');
  const [inquiries, setInquiries] = useState([]);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [selectedInquiryId, setSelectedInquiryId] = useState(null);
  const [replyContent, setReplyContent] = useState('');
  const [showEditInquiryModal, setShowEditInquiryModal] = useState(false);
  const [editingInquiryId, setEditingInquiryId] = useState(null);
  const [editingInquiryContent, setEditingInquiryContent] = useState('');
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reviewSortOrder, setReviewSortOrder] = useState('latest'); // 'latest' or 'rating'

  // 상품 데이터 로드
  useEffect(() => {
    const loadProduct = async () => {
      if (!productId || isNaN(productId)) {
        setError('유효하지 않은 상품 ID입니다.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getProductById(productId);
        
        if (result.success && result.data) {
          // API 응답을 프론트엔드 형식으로 변환
          const apiProduct = result.data;
          
          // description이나 details가 없으면 기본값 제공
          const defaultDescription = `${apiProduct.name}은(는) 프리미엄 품질의 제품으로, 고객 만족을 최우선으로 제작되었습니다. 세심한 주의를 기울여 만들어진 이 제품은 일상 생활에서 편리함과 만족감을 제공합니다.`;
          const defaultDetails = `• 프리미엄 품질 보증\n• 안전한 포장 및 배송\n• 빠른 배송 서비스\n• 1년 품질 보증\n• 고객 만족도 우수\n• 다양한 사용자 후기\n• 신뢰할 수 있는 브랜드\n• 환경 친화적 제품`;
          
          const salePrice = apiProduct.price ? parseFloat(apiProduct.price) : 0;
          const productDiscount = apiProduct.discount || 0;
          const formattedProduct = {
            id: apiProduct.id,
            name: apiProduct.name,
            price: salePrice,
            productDiscount,
            originalPrice:
              productDiscount > 0
                ? Math.round(salePrice / (1 - productDiscount / 100))
                : undefined,
            discount: productDiscount,
            image: apiProduct.image || '',
            description: apiProduct.description || defaultDescription,
            details: apiProduct.details || defaultDetails,
            category: apiProduct.categoryName || '',
            categoryId: apiProduct.categoryId || null,
            rating: apiProduct.rating ? parseFloat(apiProduct.rating) : 0,
            reviewCount: apiProduct.reviewCount || 0,
            purchaseCount: 0 // API에 없으면 0으로 설정
          };
          setProduct(formattedProduct);
        } else {
          // API 실패 시 fallback 데이터 사용
          const fallbackProduct = products[productId] || getCategoryProductById(productId);
          if (fallbackProduct) {
            // fallback 데이터를 API 형식에 맞게 변환
            const formattedProduct = {
              id: fallbackProduct.id,
              name: fallbackProduct.name,
              price: fallbackProduct.price || 0,
              productDiscount: fallbackProduct.discount || 0,
              originalPrice: fallbackProduct.originalPrice || fallbackProduct.price || 0,
              discount: fallbackProduct.discount || 0,
              image: fallbackProduct.image || '',
              description: fallbackProduct.description || '',
              details: fallbackProduct.details || '',
              category: fallbackProduct.category || '',
              categoryId: fallbackProduct.categoryId || null,
              rating: fallbackProduct.rating || 0,
              reviewCount: fallbackProduct.reviewCount || 0,
              purchaseCount: fallbackProduct.purchaseCount || 0
            };
            setProduct(formattedProduct);
          } else {
            // fallback도 없으면 에러 표시
            const errorMessage = result.message || '상품을 찾을 수 없습니다.';
            setError(errorMessage);
          }
        }
      } catch (err) {
        console.error('상품 로드 오류:', err);
        // 네트워크 오류 또는 기타 예외 발생 시 fallback 데이터 사용
        const fallbackProduct = products[productId] || getCategoryProductById(productId);
        if (fallbackProduct) {
          // fallback 데이터를 API 형식에 맞게 변환
          const formattedProduct = {
            id: fallbackProduct.id,
            name: fallbackProduct.name,
            price: fallbackProduct.price || 0,
            productDiscount: fallbackProduct.discount || 0,
            originalPrice: fallbackProduct.originalPrice || fallbackProduct.price || 0,
            discount: fallbackProduct.discount || 0,
            image: fallbackProduct.image || '',
            description: fallbackProduct.description || '',
            details: fallbackProduct.details || '',
            category: fallbackProduct.category || '',
            categoryId: fallbackProduct.categoryId || null,
            rating: fallbackProduct.rating || 0,
            reviewCount: fallbackProduct.reviewCount || 0,
            purchaseCount: fallbackProduct.purchaseCount || 0
          };
          setProduct(formattedProduct);
        } else {
          // fallback도 없으면 에러 표시
          if (err.message && err.message.includes('Failed to fetch')) {
            setError('서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.');
          } else {
            setError('상품 정보를 불러오는 중 오류가 발생했습니다.');
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadProduct();
  }, [productId]);

  // 페이지 로드 시 스크롤을 맨 위로 이동
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [productId]);

  // 찜한 상품 상태 확인 및 배송지 정보 불러오기
  useEffect(() => {
    const syncWishlistAndDelivery = async () => {
      if (!product) return;

      setSelectedProductId(product.id); // 현재 상품을 기본값으로 설정

      if (isLoggedIn()) {
        // 서버 기준 찜 상태 확인
        const result = await getWishlistItem(product.id);
        if (result.success) {
          setWishlistStatus(true);
          addToWishlist(product); // 로컬 스토리지 동기화
        } else if (result.notExists) {
          setWishlistStatus(false);
          removeFromWishlist(product.id);
        } else {
          // 에러 시에는 기존 localStorage 기준으로 표시
          setWishlistStatus(isWishlisted(product.id));
        }

        await loadDeliveryAddresses();
      } else {
        // 로그인하지 않은 경우에는 localStorage 기준
        setWishlistStatus(isWishlisted(product.id));
        const savedAddress = getDeliveryAddress();
        if (savedAddress) {
          setDeliveryAddress(savedAddress);
        }
      }
    };

    syncWishlistAndDelivery();
  }, [product]);

  // 마이페이지 배송지 변경 감지 및 동기화
  useEffect(() => {
    if (!isLoggedIn()) return;

    // 초기 마운트 시 lastUpdate 설정
    const currentUpdate = localStorage.getItem('deliveryAddressCurrentUpdate');
    if (currentUpdate) {
      localStorage.setItem('deliveryAddressLastUpdate', currentUpdate);
    }

    // 배송지 변경 이벤트 감지 함수
    const checkDeliveryAddressUpdate = async () => {
      const lastUpdate = localStorage.getItem('deliveryAddressLastUpdate');
      const currentUpdate = localStorage.getItem('deliveryAddressCurrentUpdate');
      
      // 마이페이지에서 배송지가 변경되었는지 확인
      if (currentUpdate && currentUpdate !== lastUpdate) {
        localStorage.setItem('deliveryAddressLastUpdate', currentUpdate);
        await loadDeliveryAddresses();
      }
    };

    // 초기 확인
    checkDeliveryAddressUpdate();

    // 주기적으로 확인 (5초마다)
    const interval = setInterval(checkDeliveryAddressUpdate, 5000);

    // 페이지 포커스 시 확인
    const handleFocus = () => {
      checkDeliveryAddressUpdate();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  // setNewAddressFormRef 업데이트
  useEffect(() => {
    setNewAddressFormRef.current = setNewAddressForm;
  }, []);

  // 배송지 목록 불러오기
  const loadDeliveryAddresses = async () => {
    if (!isLoggedIn()) return;
    setLoadingAddresses(true);
    const result = await getDeliveryAddresses();
    if (result.success && result.data) {
      setDeliveryAddresses(result.data);
      
      // 기본 배송지가 있으면 자동 선택 (항상 최신 기본 배송지로 업데이트)
      const defaultAddress = result.data.find(addr => addr.isDefault);
      if (defaultAddress) {
        const newAddress = {
          postcode: defaultAddress.postcode,
          address: defaultAddress.address,
          detailAddress: defaultAddress.detailAddress || '',
          recipient: defaultAddress.recipient,
          phone: defaultAddress.phoneNumber
        };
        setDeliveryAddress(newAddress);
        // 로컬 스토리지에도 저장
        saveDeliveryAddress(newAddress);
      } else if (result.data.length > 0) {
        // 기본 배송지가 없으면 첫 번째 배송지 선택
        const firstAddress = result.data[0];
        const newAddress = {
          postcode: firstAddress.postcode,
          address: firstAddress.address,
          detailAddress: firstAddress.detailAddress || '',
          recipient: firstAddress.recipient,
          phone: firstAddress.phoneNumber
        };
        setDeliveryAddress(newAddress);
        saveDeliveryAddress(newAddress);
      } else {
        // 배송지가 없으면 현재 선택된 배송지도 삭제
        setDeliveryAddress(null);
        const { removeDeliveryAddress } = require('../utils/delivery');
        removeDeliveryAddress();
      }
      
      // 현재 선택된 배송지가 목록에 없는지 확인 (삭제된 경우)
      if (deliveryAddress && result.data.length > 0) {
        const currentAddressExists = result.data.some(addr => 
          addr.postcode === deliveryAddress.postcode &&
          addr.address === deliveryAddress.address &&
          addr.recipient === deliveryAddress.recipient
        );
        
        if (!currentAddressExists) {
          // 현재 선택된 배송지가 삭제되었으므로 기본 배송지 또는 첫 번째 배송지로 변경
          const defaultAddr = result.data.find(addr => addr.isDefault) || result.data[0];
          if (defaultAddr) {
            const newAddress = {
              postcode: defaultAddr.postcode,
              address: defaultAddr.address,
              detailAddress: defaultAddr.detailAddress || '',
              recipient: defaultAddr.recipient,
              phone: defaultAddr.phoneNumber
            };
            setDeliveryAddress(newAddress);
            saveDeliveryAddress(newAddress);
          } else {
            setDeliveryAddress(null);
            const { removeDeliveryAddress } = require('../utils/delivery');
            removeDeliveryAddress();
          }
        }
      }
    } else if (result.status === 401 || result.status === 403) {
      // 인증 오류 시 배송지 초기화
      setDeliveryAddress(null);
    }
    setLoadingAddresses(false);
  };

  // 상품 문의 목록 불러오기 (관리자: 전체 문의 API, 유저: 내 문의 API, 비로그인: localStorage)
  const loadInquiryList = async () => {
    if (!product) return;
    if (isLoggedIn()) {
      const res = isAdmin()
        ? await getAdminProductInquiriesApi({ productId: product.id, page: 0, size: 100 })
        : await getProductInquiriesApi({ productId: product.id, page: 0, size: 100 });
      if (res.success && res.data) setInquiries(res.data);
      else setInquiries([]);
    } else {
      setInquiries(getInquiries(product.id));
    }
  };

  useEffect(() => {
    if (product && activeTab === 'inquiry') loadInquiryList();
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

  // 로딩 중
  if (loading) {
    return (
      <div className="product-detail-container">
        <div className="product-loading">
          <h2>상품 정보를 불러오는 중...</h2>
        </div>
      </div>
    );
  }

  // 에러 또는 상품 없음
  if (error || !product) {
    return (
      <div className="product-detail-container">
        <div className="product-not-found">
          <h2>{error || '상품을 찾을 수 없습니다'}</h2>
          <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
            {error && error.includes('서버에 연결할 수 없습니다') 
              ? '백엔드 서버가 실행 중인지 확인해주세요.'
              : '상품 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.'}
          </p>
          {/* <div style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={() => navigate('/')} className="back-button">
              홈으로 돌아가기
            </button>
            <button 
              onClick={() => window.location.reload()} 
              className="back-button"
              style={{ backgroundColor: '#007bff', color: 'white', border: 'none' }}
            >
              새로고침
            </button>
          </div> */}
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

  const catalogPct = catalogDiscountPercent(product);
  const catalogSubtotalForUi = orderLineTotal({ price: product.price, quantity });

  const handleQuantityChange = (delta) => {
    setQuantity((prev) => Math.max(1, prev + delta));
  };

  const handleSelect = () => {
    const total = orderLineTotal({ price: product.price, quantity });
    setSelectedTotal({ quantity, total });
  };

  const handleAddToCart = async () => {
    // 로그인 체크
    if (!isLoggedIn()) {
      if (window.confirm('로그인이 필요합니다. 로그인 페이지로 이동하시겠습니까?')) {
        navigate('/login');
      }
      return;
    }

    try {
      const result = await addToCart(productId, quantity);
      if (result.success) {
        window.alert(`${product.name} ${quantity}개가 장바구니에 추가되었습니다.`);
      } else {
        window.alert(result.message || '장바구니 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('장바구니 추가 오류:', error);
      window.alert('장바구니 추가 중 오류가 발생했습니다.');
    }
  };

  // 쿠폰 모달 열기
  const handleOpenCouponModal = async () => {
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

    checkCouponExpiry();
    const totalAmount = orderLineTotal({ price: product.price, quantity });
    const apiRes = await fetchUserCoupons();
    const fromApi = apiRes.success ? (apiRes.data || []) : [];
    const localCoupons = getReceivedCoupons();
    const merged = [...fromApi, ...localCoupons];
    const usableCoupons = merged.filter(coupon => {
      if (coupon.status !== 'received') return false;
      if (coupon.validUntil) {
        const validUntil = new Date(coupon.validUntil);
        if (!Number.isNaN(validUntil.getTime()) && validUntil < new Date()) return false;
      }
      if (coupon.productId && coupon.productId !== product.id) return false;
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
    if (!getAccessToken()) {
      window.alert('주문·결제는 JWT 로그인이 필요합니다. 로그아웃 후 이메일 계정으로 다시 로그인해 주세요.');
      navigate('/login', { replace: true });
      return;
    }
    const catalogSubtotal = orderLineTotal({ price: product.price, quantity });
    let discountAmount = 0;

    if (selectedCoupon) {
      if (selectedCoupon.discountType === 'fixed') {
        discountAmount = selectedCoupon.discount;
      } else if (selectedCoupon.discountType === 'percent') {
        discountAmount = Math.floor(catalogSubtotal * (selectedCoupon.discount / 100));
      }
    }

    const subtotal = Math.max(0, catalogSubtotal - discountAmount);
    const shippingFee = subtotal >= 15000 ? 0 : 3000;
    const finalAmount = subtotal + shippingFee;

    const orderName = quantity > 1
      ? `${product.name} 외 ${quantity - 1}개`
      : product.name;

    const orderItems = [{
      productId: product.id,
      name: product.name,
      price: product.price,
      productDiscount: catalogDiscountPercent(product),
      quantity,
      image: product.image
    }];

    try {
      const cartPrep = await prepareCartIdsForCheckout(orderItems, false, []);
      if (!cartPrep.success) {
        window.alert(cartPrep.message || '장바구니 준비에 실패했습니다.');
        return;
      }

      const phone = deliveryAddress.phone || deliveryAddress.phoneNumber || '';
      const userCouponId =
        selectedCoupon && selectedCoupon.couponId != null ? selectedCoupon.id : null;

      const orderRes = await createServerOrder({
        cartIds: cartPrep.cartIds,
        customerName: deliveryAddress.recipient || '고객님',
        customerPhoneNumber: phone,
        deliveryAddress,
        couponId: userCouponId,
        discountAmount,
      });

      if (!orderRes.success) {
        window.alert(orderRes.message || '주문 생성에 실패했습니다.');
        if (orderRes.errorCode === 'AUTHORIZATION_001' || orderRes.errorCode === 'CART_001') {
          navigate('/cart', { replace: true });
        }
        return;
      }

      const srv = orderRes.data;
      const payAmount = Math.round(Number(srv.finalAmount));

      if (selectedCoupon) {
        const locals = getReceivedCoupons();
        if (locals.some(c => String(c.id) === String(selectedCoupon.id))) {
          applyCoupon(selectedCoupon.id);
        }
      }

      const paymentData = {
        amount: payAmount,
        orderId: srv.orderId,
        orderName,
        customerName: deliveryAddress.recipient || '고객님',
        product,
        quantity,
        deliveryAddress,
        coupon: selectedCoupon,
        discountAmount,
        orderSubtotalBeforeDiscount: catalogSubtotal,
        orderItems,
        serverOrderId: srv.orderId,
        serverOrderNumericId: srv.id,
      };

      sessionStorage.setItem('pendingOrder', JSON.stringify(paymentData));
      await processPayment(paymentData);
      handleCloseCouponModal();
    } catch (error) {
      window.alert(`결제 처리 중 오류가 발생했습니다: ${error.message}`);
      sessionStorage.removeItem('pendingOrder');
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    if (quantity < 1) {
      window.alert('수량을 선택해주세요.');
      return;
    }
    navigate('/order/checkout', {
      state: {
        from: 'product',
        product: {
          id: product.id,
          name: product.name,
          price: product.price ?? product.originalPrice,
          discount: catalogDiscountPercent(product),
          productDiscount: catalogDiscountPercent(product),
          image: product.image,
          productId: product.id
        },
        quantity
      }
    });
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

  // 배송지 설정 모달 열기 (배송지 목록 선택)
  const handleAddressSet = () => {
    if (!isLoggedIn()) {
      window.alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    setShowDeliveryAddressModal(true);
    loadDeliveryAddresses();
  };

  // 배송지 변경하기 (주소 검색 모달 직접 열기)
  const handleChangeAddress = () => {
    if (!isLoggedIn()) {
      window.alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }
    // 기존 배송지 정보를 폼에 채우기
    if (deliveryAddress) {
      setNewAddressForm({
        postcode: deliveryAddress.postcode || '',
        address: deliveryAddress.address || '',
        detailAddress: deliveryAddress.detailAddress || '',
        recipient: deliveryAddress.recipient || '',
        phoneNumber: deliveryAddress.phone || '',
        isDefault: false
      });
    } else {
      setNewAddressForm({
        postcode: '',
        address: '',
        detailAddress: '',
        recipient: '',
        phoneNumber: '',
        isDefault: false
      });
    }
    setShowAddAddressModal(true);
  };

  // 배송지 선택
  const handleSelectDeliveryAddress = (address) => {
    setDeliveryAddress({
      postcode: address.postcode,
      address: address.address,
      detailAddress: address.detailAddress || '',
      recipient: address.recipient,
      phone: address.phoneNumber
    });
    // 로컬 스토리지에도 저장
    saveDeliveryAddress({
      postcode: address.postcode,
      address: address.address,
      detailAddress: address.detailAddress || '',
      recipient: address.recipient,
      phone: address.phoneNumber
    });
    setShowDeliveryAddressModal(false);
    window.alert('배송지가 선택되었습니다.');
  };

  // 새 배송지 추가 모달 열기
  const handleOpenAddAddressModal = () => {
    setNewAddressForm({
      postcode: '',
      address: '',
      detailAddress: '',
      recipient: '',
      phoneNumber: '',
      isDefault: false
    });
    setShowAddAddressModal(true);
    setShowDeliveryAddressModal(false);
  };

  // 주소 검색 (Daum Postcode API)
  const handleSearchAddress = () => {
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
        const setter = setNewAddressFormRef.current;
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
  };

  // 새 배송지 저장
  const handleSaveNewAddress = async () => {
    // 로그인 체크
    if (!isLoggedIn()) {
      window.alert('로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    if (!newAddressForm.postcode || !newAddressForm.address || 
        !newAddressForm.recipient || !newAddressForm.phoneNumber) {
      window.alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    try {
      const result = await createDeliveryAddress({
        postcode: newAddressForm.postcode,
        address: newAddressForm.address,
        detailAddress: newAddressForm.detailAddress,
        recipient: newAddressForm.recipient,
        phoneNumber: newAddressForm.phoneNumber,
        isDefault: newAddressForm.isDefault
      });

      if (result.success) {
        // 배송지 정보 업데이트 (새로운 주소로 변경)
        const updatedAddress = {
          postcode: newAddressForm.postcode,
          address: newAddressForm.address,
          detailAddress: newAddressForm.detailAddress || '',
          recipient: newAddressForm.recipient,
          phone: newAddressForm.phoneNumber
        };
        
        setDeliveryAddress(updatedAddress);
        
        // 로컬 스토리지에도 저장
        saveDeliveryAddress(updatedAddress);
        
        // 배송지 목록 다시 불러오기
        await loadDeliveryAddresses();
        
        // 배송지 변경 이벤트 발생 (마이페이지에 알림)
        localStorage.setItem('deliveryAddressCurrentUpdate', Date.now().toString());
        
        window.alert('배송지가 저장되었습니다.');
        setShowAddAddressModal(false);
        
        // 배송지 목록 모달이 열려있으면 닫기
        if (showDeliveryAddressModal) {
          setShowDeliveryAddressModal(false);
        }
      } else {
        // Unauthorized 오류 처리
        if (result.status === 401 || result.status === 403) {
          window.alert('인증이 만료되었습니다. 다시 로그인해주세요.');
          navigate('/login');
        } else {
          window.alert(result.message || '배송지 저장에 실패했습니다.');
        }
      }
    } catch (error) {
      console.error('배송지 저장 오류:', error);
      window.alert('배송지 저장 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
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

  const handleWishlistToggle = async () => {
    if (wishlistStatus) {
      if (isLoggedIn()) {
        const result = await removeWishlistItem(product.id);
        if (result.success || result.notExists) {
          removeFromWishlist(product.id);
          setWishlistStatus(false);
          window.alert('찜한 상품에서 삭제되었습니다.');
        } else {
          if (result.status === 401) navigate('/login');
          else window.alert(result.message || '찜 해제에 실패했습니다.');
        }
      } else {
        removeFromWishlist(product.id);
        setWishlistStatus(false);
        window.alert('찜한 상품에서 삭제되었습니다.');
      }
    } else {
      if (isLoggedIn()) {
        const result = await addWishlistItem(product.id);
        if (result.success || result.alreadyExists) {
          addToWishlist(product);
          setWishlistStatus(true);
          window.alert('찜한 상품에 추가되었습니다.');
        } else {
          if (result.status === 401) navigate('/login');
          else window.alert(result.message || '찜 추가에 실패했습니다.');
        }
      } else {
        addToWishlist(product);
        setWishlistStatus(true);
        window.alert('찜한 상품에 추가되었습니다.');
      }
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

  const handleSubmitInquiry = async () => {
    if (!product) {
      window.alert('상품 정보를 불러올 수 없습니다.');
      return;
    }
    if (!inquiryContent.trim()) {
      window.alert('문의내용을 입력해주세요.');
      return;
    }
    if (isLoggedIn()) {
      const res = await createProductInquiryApi(product.id, inquiryContent.trim());
      if (res.success) {
        window.alert('상품 문의가 등록되었습니다.');
        handleCloseInquiryModal();
        setInquiryContent('');
        await loadInquiryList();
      } else {
        window.alert(res.message || '상품 문의 등록에 실패했습니다.');
        if (res.status === 401) navigate('/login');
      }
    } else {
      const inquiryData = { productId: product.id, productName: product.name, content: inquiryContent.trim(), author: getCookie('username') || '회원', userEmail: getCookie('userEmail') || '' };
      const newInquiry = addInquiry(inquiryData);
      if (newInquiry) {
        window.alert('상품 문의가 등록되었습니다.');
        handleCloseInquiryModal();
        setInquiryContent('');
        setInquiries(getInquiries(product.id));
      } else {
        window.alert('상품 문의 등록에 실패했습니다.');
      }
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

  // 문의 수정 모달 열기
  const handleOpenEditInquiryModal = (inquiryId, currentContent) => {
    setEditingInquiryId(inquiryId);
    setEditingInquiryContent(currentContent);
    setShowEditInquiryModal(true);
  };

  // 문의 수정 모달 닫기
  const handleCloseEditInquiryModal = () => {
    setShowEditInquiryModal(false);
    setEditingInquiryId(null);
    setEditingInquiryContent('');
  };

  // 문의 수정 제출 (관리자: 답변 후에도 수정 가능, 유저: 답변 전만)
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
      if (res.success) {
        window.alert('상품 문의가 수정되었습니다.');
        handleCloseEditInquiryModal();
        await loadInquiryList();
      } else {
        window.alert(res.message || '상품 문의 수정에 실패했습니다.');
        if (res.status === 401) navigate('/login');
      }
    } else {
      const { updateInquiry } = await import('../utils/inquiry');
      const updatedInquiry = updateInquiry(editingInquiryId, editingInquiryContent.trim());
      if (updatedInquiry) {
        window.alert('상품 문의가 수정되었습니다.');
        handleCloseEditInquiryModal();
        setInquiries(getInquiries(product.id));
      } else {
        window.alert('답변이 달린 문의는 수정할 수 없습니다.');
      }
    }
  };

  // 문의 삭제 (관리자: 답변 후에도 삭제 가능, 유저: 답변 전만)
  const handleDeleteInquiry = async (inquiryId) => {
    if (!window.confirm('상품 문의를 삭제하시겠습니까?')) return;
    if (isLoggedIn()) {
      const api = isAdmin() ? adminDeleteProductInquiryApi : deleteProductInquiryApi;
      const res = await api(inquiryId);
      if (res.success) {
        window.alert('상품 문의가 삭제되었습니다.');
        await loadInquiryList();
      } else {
        window.alert(res.message || '상품 문의 삭제에 실패했습니다.');
        if (res.status === 401) navigate('/login');
      }
    } else {
      if ((await import('../utils/inquiry')).deleteInquiry(inquiryId)) {
        window.alert('상품 문의가 삭제되었습니다.');
        setInquiries(getInquiries(product.id));
      } else {
        window.alert('상품 문의 삭제에 실패했습니다.');
      }
    }
  };

  const handleSubmitReply = async () => {
    if (!selectedInquiryId) {
      window.alert('문의를 선택해주세요.');
      return;
    }
    if (!replyContent.trim()) {
      window.alert('답변 내용을 입력해주세요.');
      return;
    }
    if (isAdmin()) {
      const res = await adminReplyProductInquiryApi(selectedInquiryId, replyContent.trim());
      if (res.success) {
        window.alert('답변이 등록되었습니다.');
        handleCloseReplyModal();
        await loadInquiryList();
      } else {
        window.alert(res.message || '답변 등록에 실패했습니다.');
        if (res.status === 401) navigate('/login');
      }
    } else {
      const { addInquiryReply } = await import('../utils/inquiry');
      const updatedInquiry = addInquiryReply(selectedInquiryId, replyContent.trim());
      if (updatedInquiry) {
        window.alert('답변이 등록되었습니다.');
        handleCloseReplyModal();
        setInquiries(getInquiries(product.id));
      } else {
        window.alert('답변 등록에 실패했습니다.');
      }
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
                {inquiries.map((inquiry) => {
                  const currentUserId = getUserIdFromToken();
                  const isMyInquiry = isLoggedIn() && currentUserId != null && Number(inquiry.userId) === Number(currentUserId);
                  const canEditDelete = isMyInquiry && !inquiry.reply && inquiry.status !== '답변완료';
                  const dateStr = inquiry.createdAt || inquiry.createdDate;
                  return (
                    <div key={inquiry.id} className="inquiry-item">
                      <div className="inquiry-item-header">
                        <div className="inquiry-item-header-left">
                          <span className="inquiry-author">{inquiry.author || '회원'}</span>
                          <span className="inquiry-date">
                            {dateStr ? new Date(dateStr).toLocaleDateString('ko-KR') : ''}
                          </span>
                          <span className={`inquiry-status ${inquiry.status === '답변완료' ? 'completed' : ''}`}>
                            {inquiry.status}
                          </span>
                        </div>
                        <div className="inquiry-item-header-right">
                          {(canEditDelete || isAdmin()) && (
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
                      </div>
                      <div className="inquiry-item-content">{inquiry.content}</div>
                    {inquiry.reply && (
                      <div className="inquiry-reply">
                        <div className="inquiry-reply-header">
                          <span className="inquiry-reply-label">관리자 답변{inquiry.replyName ? ` (${inquiry.replyName})` : ''}</span>
                          <span className="inquiry-reply-date">
                            {inquiry.replyDate ? new Date(inquiry.replyDate).toLocaleDateString('ko-KR') : ''}
                          </span>
                        </div>
                        <div className="inquiry-reply-content">{inquiry.reply}</div>
                      </div>
                    )}
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
          {/* 판매자 정보 (브랜드만 표시) */}
          <div className="seller-info">
            <span className="seller-name">Moodly</span>
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

          {/* 가격 정보 — 핫딜/특가와 동일: 취소선은 역산 정가, 굵은 글씨는 DB 판매가 */}
          <div className="product-price-section">
            {catalogPct > 0 && (
              <span className="product-original-price">
                {displayListPriceFromSale(product.price, catalogPct).toLocaleString()}원
              </span>
            )}
            <div className="price-row">
              <span className="product-detail-price">{product.price.toLocaleString()}원</span>
              {catalogPct > 0 && (
                <span className="discount-badge">{catalogPct}% 할인</span>
              )}
            </div>
            {catalogPct > 0 && (
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

          {/* 상단에서는 배송/수량/선택을 노출하지 않고, 가격 바로 아래에 버튼만 배치 */}

          {/* 수량 + 장바구니 / 구매하기 */}
          <div className="product-detail-actions">
            <div className="product-detail-quantity-inline">
              <button 
                className="quantity-btn-inline" 
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
              >
                -
              </button>
              <span className="quantity-value-inline">{quantity}</span>
              <button 
                className="quantity-btn-inline" 
                onClick={() => handleQuantityChange(1)}
              >
                +
              </button>
            </div>
            <button className="add-to-cart-button" onClick={handleAddToCart}>
              장바구니
            </button>
            <button className="buy-now-button" onClick={handleBuyNow}>
              결제하기
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
                  <p className="coupon-modal-product-price">상품금액: {catalogSubtotalForUi.toLocaleString()}원</p>
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
                      const totalAmount = catalogSubtotalForUi;
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
                  <span>{catalogSubtotalForUi.toLocaleString()}원</span>
                </div>
                {selectedCoupon && (
                  <>
                    <div className="coupon-modal-summary-row">
                      <span>쿠폰 할인</span>
                      <span className="coupon-discount-amount">
                        -{(() => {
                          const totalAmount = catalogSubtotalForUi;
                          if (selectedCoupon.discountType === 'fixed') {
                            return selectedCoupon.discount.toLocaleString();
                          }
                          return Math.floor(totalAmount * (selectedCoupon.discount / 100)).toLocaleString();
                        })()}원
                      </span>
                    </div>
                    <div className="coupon-modal-summary-row">
                      <span>할인 후 금액</span>
                      <span>
                        {(() => {
                          const totalAmount = catalogSubtotalForUi;
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
                      const totalAmount = catalogSubtotalForUi;
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
                      const totalAmount = catalogSubtotalForUi;
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

      {/* 배송지 선택 모달 */}
      {showDeliveryAddressModal && (
        <div className="delivery-address-modal-overlay" onClick={() => setShowDeliveryAddressModal(false)}>
          <div className="delivery-address-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delivery-address-modal-header">
              <h3>배송지 선택</h3>
              <button className="delivery-address-modal-close" onClick={() => setShowDeliveryAddressModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="delivery-address-modal-body">
              {loadingAddresses ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>배송지를 불러오는 중...</p>
                </div>
              ) : deliveryAddresses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem' }}>
                  <p>등록된 배송지가 없습니다.</p>
                  <button 
                    className="delivery-address-add-btn"
                    onClick={handleOpenAddAddressModal}
                    style={{ marginTop: '1rem', padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    + 배송지 추가
                  </button>
                </div>
              ) : (
                <div className="delivery-address-list">
                  {deliveryAddresses.map((address) => (
                    <div 
                      key={address.id} 
                      className={`delivery-address-item ${address.isDefault ? 'default' : ''}`}
                      onClick={() => handleSelectDeliveryAddress(address)}
                      style={{ cursor: 'pointer', padding: '1rem', border: '1px solid #ddd', borderRadius: '4px', marginBottom: '0.5rem' }}
                    >
                      {address.isDefault && (
                        <div style={{ color: '#007bff', fontSize: '0.8rem', marginBottom: '0.5rem' }}>기본 배송지</div>
                      )}
                      <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{address.recipient}</div>
                      <div style={{ color: '#666', fontSize: '0.9rem' }}>
                        [{address.postcode}] {address.address} {address.detailAddress || ''}
                      </div>
                      <div style={{ color: '#666', fontSize: '0.9rem', marginTop: '0.25rem' }}>{address.phoneNumber}</div>
                    </div>
                  ))}
                  <button 
                    className="delivery-address-add-btn"
                    onClick={handleOpenAddAddressModal}
                    style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', backgroundColor: '#f0f0f0', border: '1px dashed #ddd', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    + 새 배송지 추가
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 새 배송지 추가/변경 모달 */}
      {showAddAddressModal && (
        <div className="delivery-address-modal-overlay" onClick={() => setShowAddAddressModal(false)}>
          <div className="delivery-address-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="delivery-address-modal-header">
              <h3>{deliveryAddress ? '배송지 변경' : '배송지 추가'}</h3>
              <button className="delivery-address-modal-close" onClick={() => setShowAddAddressModal(false)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <div className="delivery-address-modal-body">
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">
                  우편번호 <span className="required">*</span>
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={newAddressForm.postcode}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, postcode: e.target.value })}
                    placeholder="우편번호"
                    className="form-input"

                    maxLength="10"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={handleSearchAddress}
                    style={{ padding: '0.5rem 1rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    주소 검색
                  </button>
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">
                  주소 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={newAddressForm.address}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, address: e.target.value })}
                  placeholder="주소"
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">상세주소</label>
                <input
                  type="text"
                  value={newAddressForm.detailAddress}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, detailAddress: e.target.value })}
                  placeholder="상세주소 (선택사항)"
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">
                  수령인 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  value={newAddressForm.recipient}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, recipient: e.target.value })}
                  placeholder="수령인 이름"
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label className="form-label">
                  전화번호 <span className="required">*</span>
                </label>
                <input
                  type="tel"
                  value={newAddressForm.phoneNumber}
                  onChange={(e) => setNewAddressForm({ ...newAddressForm, phoneNumber: e.target.value })}
                  placeholder="010-1234-5678"
                  className="form-input"
                />
              </div>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newAddressForm.isDefault}
                    onChange={(e) => setNewAddressForm({ ...newAddressForm, isDefault: e.target.checked })}
                  />
                  <span>기본 배송지로 설정</span>
                </label>
              </div>
            </div>
            <div className="delivery-address-modal-footer" style={{ display: 'flex', gap: '0.5rem', padding: '1rem', borderTop: '1px solid #ddd' }}>
              <button
                className="delivery-address-modal-btn cancel"
                onClick={() => setShowAddAddressModal(false)}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#f0f0f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                취소
              </button>
              <button
                className="delivery-address-modal-btn submit"
                onClick={handleSaveNewAddress}
                style={{ flex: 1, padding: '0.75rem', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                {deliveryAddress ? '저장하기' : '추가하기'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;
