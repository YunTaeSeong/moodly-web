import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './TodaySpecialDetail.css';

// 오늘의 특가 상품 10개 (TodaySpecial과 동일)
const todaySpecialProducts = [
  {
    id: 201,
    name: '프리미엄 노이즈캔슬링 헤드폰',
    originalPrice: 280000,
    salePrice: 199000,
    discount: 29,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    description: '프리미엄 노이즈캔슬링 헤드폰'
  },
  {
    id: 202,
    name: '4K 울트라 와이드 모니터',
    originalPrice: 450000,
    salePrice: 329000,
    discount: 27,
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=300&h=300&fit=crop',
    description: '4K 울트라 와이드 모니터'
  },
  {
    id: 203,
    name: '프리미엄 커피 머신',
    originalPrice: 320000,
    salePrice: 229000,
    discount: 28,
    image: 'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7?w=300&h=300&fit=crop',
    description: '프리미엄 커피 머신'
  },
  {
    id: 204,
    name: '스마트 홈 시큐리티 세트',
    originalPrice: 380000,
    salePrice: 279000,
    discount: 27,
    image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop',
    description: '스마트 홈 시큐리티 세트'
  },
  {
    id: 205,
    name: '프리미엄 운동화',
    originalPrice: 180000,
    salePrice: 129000,
    discount: 28,
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=300&fit=crop',
    description: '프리미엄 운동화'
  },
  {
    id: 206,
    name: '무선 충전기 스탠드',
    originalPrice: 65000,
    salePrice: 45000,
    discount: 31,
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=300&h=300&fit=crop',
    description: '무선 충전기 스탠드'
  },
  {
    id: 207,
    name: '프리미엄 캠핑 텐트',
    originalPrice: 350000,
    salePrice: 249000,
    discount: 29,
    image: 'https://images.unsplash.com/photo-1478131143081-80f7f84ca84d?w=300&h=300&fit=crop',
    description: '프리미엄 캠핑 텐트'
  },
  {
    id: 208,
    name: '스마트 냉장고',
    originalPrice: 2800000,
    salePrice: 2190000,
    discount: 22,
    image: 'https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=300&h=300&fit=crop',
    description: '스마트 냉장고'
  },
  {
    id: 209,
    name: '프리미엄 가죽 가방',
    originalPrice: 420000,
    salePrice: 299000,
    discount: 29,
    image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300&h=300&fit=crop',
    description: '프리미엄 가죽 가방'
  },
  {
    id: 210,
    name: '로봇 진공청소기',
    originalPrice: 550000,
    salePrice: 399000,
    discount: 27,
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop',
    description: '로봇 진공청소기'
  }
];

function TodaySpecialDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedProductId = searchParams.get('productId') ? parseInt(searchParams.get('productId')) : null;
  const selectedProductRef = useRef(null);

  // 선택된 상품으로 스크롤
  useEffect(() => {
    if (selectedProductId) {
      setTimeout(() => {
        if (selectedProductRef.current) {
          selectedProductRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 300);
    }
  }, [selectedProductId]);

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  // 모든 상품을 순서 번호와 함께 반환
  const getAllProducts = () => {
    return todaySpecialProducts.map((product, index) => ({
      ...product,
      orderNumber: index + 1,
      isSelected: product.id === selectedProductId
    }));
  };

  return (
    <div className="todayspecial-detail-container">
      <div className="todayspecial-detail-header">
        <h1 className="todayspecial-detail-title">오늘의 특가</h1>
      </div>

      <div className="todayspecial-detail-products-grid">
        {getAllProducts().map((product) => (
          <div
            key={product.id}
            ref={product.isSelected ? selectedProductRef : null}
            className={`todayspecial-detail-product-card ${product.isSelected ? 'todayspecial-detail-product-selected' : ''}`}
            onClick={() => handleProductClick(product.id)}
          >
            <div className="todayspecial-detail-number-badge">
              {product.orderNumber}
            </div>
            <div className="todayspecial-detail-badge">
              <span className="todayspecial-detail-discount">{product.discount}%</span>
            </div>
            <div className="todayspecial-detail-image-container">
              <img
                src={product.image}
                alt={product.name}
                className="todayspecial-detail-image"
              />
            </div>
            <div className="todayspecial-detail-info">
              <h3 className="todayspecial-detail-product-name">{product.name}</h3>
              <div className="todayspecial-detail-price-container">
                <span className="todayspecial-detail-original-price">
                  {product.originalPrice.toLocaleString()}원
                </span>
                <span className="todayspecial-detail-sale-price">
                  {product.salePrice.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TodaySpecialDetail;

