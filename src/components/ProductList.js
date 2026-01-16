import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EventBanner from './EventBanner';
import HotDeal from './HotDeal';
import TodaySpecial from './TodaySpecial';
import { getAllProducts } from '../utils/api';
import './ProductList.css';

// 인기 상품 fallback 데이터 (API 실패 시 사용)
const fallbackPopularProducts = [
  {
    id: 1,
    name: '스마트폰 케이스',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1601972602237-8c79241e468b?w=500&h=500&fit=crop',
    description: '고급스러운 스마트폰 케이스로 기기를 완벽하게 보호하세요. 얇고 가벼우면서도 강력한 보호 기능을 제공합니다.'
  },
  {
    id: 2,
    name: '무선 이어폰',
    price: 89000,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop',
    description: '프리미엄 무선 이어폰으로 최고의 음질을 경험하세요. 노이즈 캔슬링 기능이 탑재되어 있어 어디서나 몰입감 있는 음악 감상을 즐길 수 있습니다.'
  },
  {
    id: 3,
    name: '노트북 스탠드',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop',
    description: '인체공학적 노트북 스탠드로 편안한 작업 환경을 만들어보세요. 높이와 각도를 자유롭게 조절할 수 있어 목과 어깨의 피로를 줄여줍니다.'
  },
  {
    id: 4,
    name: '블루투스 스피커',
    price: 120000,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop',
    description: '고음질 블루투스 스피커로 어디서나 음악을 즐기세요. 강력한 베이스와 선명한 고음으로 콘서트장 같은 몰입감을 선사합니다.'
  },
  {
    id: 5,
    name: '스마트 워치',
    price: 250000,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    description: '최신 스마트 워치로 건강과 일상을 관리하세요. 운동 추적부터 알림까지 모든 것을 한 손목에서 처리할 수 있습니다.'
  },
  {
    id: 6,
    name: '무선 마우스',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop',
    description: '에르고노믹 무선 마우스로 장시간 사용해도 편안합니다. 손목의 피로를 줄이고 정밀한 작업을 도와줍니다.'
  },
  {
    id: 7,
    name: 'USB-C 케이블',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500&h=500&fit=crop',
    description: '고속 충전 USB-C 케이블로 빠르게 충전하세요. 데이터 전송과 충전을 동시에 지원하는 프리미엄 케이블입니다.'
  },
  {
    id: 8,
    name: '태블릿 거치대',
    price: 28000,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop',
    description: '조절 가능한 태블릿 거치대로 다양한 각도에서 사용하세요. 독서부터 영상 시청까지 최적의 각도로 설정할 수 있습니다.'
  },
  {
    id: 9,
    name: '무선 키보드',
    price: 75000,
    image: 'https://images.unsplash.com/photo-1587829741301-dc918b0c716f?w=500&h=500&fit=crop',
    description: '프리미엄 무선 키보드로 편안한 타이핑을 경험하세요. 기계식 키 스위치로 만족스러운 타건감을 제공합니다.'
  },
  {
    id: 10,
    name: '게이밍 마우스패드',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=500&h=500&fit=crop',
    description: '대형 게이밍 마우스패드로 정밀한 조작이 가능합니다. 부드러운 표면으로 마우스 움직임을 정확하게 추적합니다.'
  },
  {
    id: 11,
    name: '웹캠 HD',
    price: 95000,
    image: 'https://images.unsplash.com/photo-1587825143138-044a3fa50491?w=500&h=500&fit=crop',
    description: '고화질 웹캠으로 선명한 영상 통화를 즐기세요. 자동 조명 보정 기능으로 어두운 환경에서도 밝은 화면을 제공합니다.'
  },
  {
    id: 12,
    name: '스탠딩 데스크',
    price: 180000,
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&h=500&fit=crop',
    description: '전동 스탠딩 데스크로 건강한 업무 환경을 만들어보세요. 앉아서 일하는 시간을 줄이고 건강을 지킬 수 있습니다.'
  },
  {
    id: 13,
    name: 'USB 허브',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=500&h=500&fit=crop',
    description: '다중 포트 USB 허브로 여러 기기를 동시에 연결하세요. 고속 데이터 전송을 지원하는 프리미엄 허브입니다.'
  },
  {
    id: 14,
    name: '모니터 스탠드',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop',
    description: '조절 가능한 모니터 스탠드로 최적의 시야각을 설정하세요. 목과 어깨의 피로를 줄이고 작업 효율을 높여줍니다.'
  },
  {
    id: 15,
    name: '블루투스 어댑터',
    price: 18000,
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500&h=500&fit=crop',
    description: 'USB 블루투스 어댑터로 기존 PC에 무선 기능을 추가하세요. 간편한 설치로 즉시 사용할 수 있습니다.'
  },
  {
    id: 16,
    name: '노이즈 캔슬링 이어폰',
    price: 150000,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop',
    description: '프리미엄 노이즈 캔슬링 이어폰으로 완벽한 음악 감상을 즐기세요. 외부 소음을 차단하고 최고의 음질을 제공합니다.'
  }
];

function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState(fallbackPopularProducts); // 초기값으로 fallback 데이터 사용
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const result = await getAllProducts(); // category_id 없이 전체 상품 조회
        if (result.success && result.data && result.data.length > 0) {
          // API 응답을 프론트엔드 형식으로 변환
          const formattedProducts = result.data.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price ? parseFloat(product.price) : 0,
            image: product.image || '',
            description: product.description || ''
          }));
          setProducts(formattedProducts);
        } else {
          // API 실패 시 fallback 데이터 유지
          setProducts(fallbackPopularProducts);
        }
      } catch (error) {
        console.error('상품 목록 로드 오류:', error);
        // 에러 시 fallback 데이터 유지
        setProducts(fallbackPopularProducts);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="product-list-container">
      <EventBanner />
      <HotDeal />
      <TodaySpecial />
      <h2 className="product-list-title">인기 상품</h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>상품을 불러오는 중...</div>
      ) : (
        <div className="product-grid">
          {products.map((product) => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => handleProductClick(product.id)}
            >
              <div className="product-image-container">
                <img
                  src={product.image}
                  alt={product.name}
                  className="product-image"
                />
              </div>
              <div className="product-info">
                <h3 className="product-name">{product.name}</h3>
                <p className="product-description">{product.description}</p>
                <p className="product-price">{product.price.toLocaleString()}원</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductList;

