import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { allProducts } from '../utils/products';
import './EventDetail.css';

// 각 이벤트별로 표시할 상품 ID 범위 (인기상품 순서대로 9개씩)
const getEventProducts = (eventId) => {
  // 인기상품 순서대로 각 이벤트마다 9개씩 할당
  const productRanges = {
    1: [1, 2, 3, 4, 5, 6, 7, 8, 9],      // 이벤트 1: 상품 1-9
    2: [2, 3, 4, 5, 6, 7, 8, 9, 10],     // 이벤트 2: 상품 2-10
    3: [3, 4, 5, 6, 7, 8, 9, 10, 11],    // 이벤트 3: 상품 3-11
    4: [4, 5, 6, 7, 8, 9, 10, 11, 12],   // 이벤트 4: 상품 4-12
    5: [5, 6, 7, 8, 9, 10, 11, 12, 13]   // 이벤트 5: 상품 5-13
  };
  
  const productIds = productRanges[eventId] || [];
  return productIds.map(productId => {
    const product = allProducts.find(p => p.id === productId);
    if (product) {
      return {
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        description: product.description
      };
    }
    return null;
  }).filter(Boolean);
};

const eventData = {
  1: {
    id: 1,
    title: '신년맞이 할인',
    subtitle: '20% 특별 할인',
    description: '새해를 맞이하는 특별한 할인 이벤트',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    image: 'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1200&h=600&fit=crop',
    period: '2024년 1월 1일 ~ 1월 31일',
    discount: '20%',
    benefits: [
      '전 상품 20% 할인 적용',
      '추가 쿠폰 5,000원 지급',
      '무료 배송 (3만원 이상 구매 시)',
      '신규 회원 추가 10% 할인'
    ],
    terms: [
      '할인 쿠폰은 중복 사용 불가합니다.',
      '이벤트 기간 내 주문 건에만 적용됩니다.',
      '일부 상품은 할인 대상에서 제외될 수 있습니다.'
    ]
  },
  2: {
    id: 2,
    title: '아웃도어 가방, 신발세트',
    subtitle: '30% 특별 할인',
    description: '모험을 떠날 준비가 되셨나요?',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    image: 'https://images.unsplash.com/photo-1551524164-6cf77f7e7c8c?w=1200&h=600&fit=crop',
    period: '2024년 1월 15일 ~ 2월 15일',
    discount: '30%',
    benefits: [
      '아웃도어 가방 30% 할인',
      '등산화/트레킹화 30% 할인',
      '세트 구매 시 추가 5% 할인',
      '아웃도어 액세서리 증정'
    ],
    terms: [
      '세트 상품은 개별 구매 시 할인율이 다를 수 있습니다.',
      '색상 및 사이즈는 재고에 따라 제한될 수 있습니다.',
      '교환 및 반품은 미착용 상태에서만 가능합니다.'
    ]
  },
  3: {
    id: 3,
    title: '봄맞이 패션 세일',
    subtitle: '최대 50% 할인',
    description: '새로운 시즌을 위한 특별한 가격',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
    period: '2024년 3월 1일 ~ 3월 31일',
    discount: '최대 50%',
    benefits: [
      '봄 신상품 최대 50% 할인',
      '시즌 오프 상품 특가 판매',
      '패션 세트 구매 시 추가 혜택',
      '스타일링 컨설팅 서비스 제공'
    ],
    terms: [
      '할인율은 상품별로 상이할 수 있습니다.',
      '한정 수량으로 조기 품절될 수 있습니다.',
      '사이즈 교환은 재고가 있을 경우에만 가능합니다.'
    ]
  },
  4: {
    id: 4,
    title: '전자제품 특가',
    subtitle: '프리미엄 혜택',
    description: '최신 기술을 더 저렴하게',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=600&fit=crop',
    period: '2024년 1월 10일 ~ 2월 10일',
    discount: '특가',
    benefits: [
      '프리미엄 전자제품 특가 판매',
      '무이자 할부 (최대 12개월)',
      'A/S 연장 서비스 제공',
      '추가 액세서리 증정'
    ],
    terms: [
      '무이자 할부는 일정 금액 이상 구매 시 적용됩니다.',
      'A/S 연장 서비스는 구매 후 등록이 필요합니다.',
      '증정품은 재고 소진 시 종료될 수 있습니다.'
    ]
  },
  5: {
    id: 5,
    title: '주말 특별 할인',
    subtitle: '24시간 한정',
    description: '이번 주말만 특별한 가격',
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed5f6d3d0?w=1200&h=600&fit=crop',
    period: '매주 금요일 18:00 ~ 일요일 18:00',
    discount: '특가',
    benefits: [
      '주말 한정 특가 상품',
      '플래시 세일 상품 매일 업데이트',
      '주말 배송 서비스 제공',
      '추가 적립금 2배 지급'
    ],
    terms: [
      '주말 특가는 매주 금요일 18시부터 시작됩니다.',
      '플래시 세일 상품은 매일 오전 10시에 업데이트됩니다.',
      '주말 배송은 일부 지역에 한해 제공됩니다.',
      '이벤트는 재고 소진 시 조기 종료될 수 있습니다.'
    ]
  }
};

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = eventData[parseInt(id)];
  const eventProducts = event ? getEventProducts(parseInt(id)) : [];

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (!event) {
    return (
      <div className="event-detail-container">
        <div className="event-not-found">
          <h2>이벤트를 찾을 수 없습니다</h2>
          <button onClick={() => navigate('/')} className="back-button">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="event-detail-container">
      <div 
        className="event-hero"
        style={{ backgroundImage: `url(${event.image})` }}
      >
        <div className="event-hero-overlay" style={{ background: event.gradient }}>
          <div className="event-hero-content">
            <h1 className="event-hero-title">{event.title}</h1>
            <p className="event-hero-subtitle">{event.subtitle}</p>
            <p className="event-hero-description">{event.description}</p>
            <div className="event-period">{event.period}</div>
          </div>
        </div>
      </div>

      <div className="event-content">
        <div className="event-section">
          <h2 className="section-title">🎁 이벤트 혜택</h2>
          <div className="benefits-grid">
            {event.benefits.map((benefit, index) => (
              <div key={index} className="benefit-card">
                <div className="benefit-icon">✓</div>
                <p>{benefit}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="event-section">
          <h2 className="section-title">🛍️ 인기 상품</h2>
          <div className="products-grid">
            {eventProducts.map((product) => (
              <div key={product.id} className="product-card-event">
                <div className="product-image-event-container">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="product-image-event"
                  />
                </div>
                <div className="product-info-event">
                  <h3>{product.name}</h3>
                  <p className="product-description-event">{product.description}</p>
                  <div className="price-container">
                    <span className="discount-price">{product.price.toLocaleString()}원</span>
                  </div>
                  <button 
                    className="product-button"
                    onClick={() => handleProductClick(product.id)}
                  >
                    구매하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="event-section">
          <h2 className="section-title">📋 이벤트 안내</h2>
          <div className="terms-container">
            {event.terms.map((term, index) => (
              <div key={index} className="term-item">
                <span className="term-bullet">•</span>
                <p>{term}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventDetail;

