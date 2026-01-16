import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProducts } from '../utils/api';
import './TodaySpecial.css';

// 기존 하드코딩 데이터 (fallback)
const fallbackProducts = [
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

function TodaySpecial() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [todaySpecialProducts, setTodaySpecialProducts] = useState(fallbackProducts);
  const itemsPerPage = 5;

  useEffect(() => {
    const loadTodaySpecialProducts = async () => {
      try {
        const result = await getAllProducts();
        if (result.success && result.data && result.data.length > 0) {
          // 할인율이 있는 상품만 필터링하고 할인율 높은 순으로 정렬
          const productsWithDiscount = result.data
            .filter(product => product.discount && product.discount > 0)
            .map(product => {
              const price = product.price ? parseFloat(product.price) : 0;
              const discount = product.discount || 0;
              const originalPrice = discount > 0 ? Math.round(price / (1 - discount / 100)) : price;
              
              return {
                id: product.id,
                name: product.name,
                originalPrice: originalPrice,
                salePrice: price,
                discount: discount,
                image: product.image || '',
                description: product.description || ''
              };
            })
            .sort((a, b) => b.discount - a.discount) // 할인율 높은 순
            .slice(0, 10); // 상위 10개만
            
          if (productsWithDiscount.length > 0) {
            setTodaySpecialProducts(productsWithDiscount);
          }
        }
      } catch (error) {
        console.error('특가 상품 로드 오류:', error);
        // 에러 시 fallback 데이터 사용
      }
    };

    loadTodaySpecialProducts();
  }, []);

  const totalPages = Math.ceil(todaySpecialProducts.length / itemsPerPage);

  const handleProductClick = (productId) => {
    navigate(`/todayspecial?productId=${productId}`);
  };

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? totalPages - 1 : prevIndex - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === totalPages - 1 ? 0 : prevIndex + 1
    );
  };

  const getVisibleProducts = () => {
    const start = currentIndex * itemsPerPage;
    const end = start + itemsPerPage;
    const products = todaySpecialProducts.slice(start, end);
    // 각 상품에 전체 리스트에서의 순서 번호 추가
    return products.map((product, index) => ({
      ...product,
      orderNumber: start + index + 1
    }));
  };

  return (
    <div className="today-special-container">
      <div className="today-special-header">
        <h2 className="today-special-title">오늘의 특가</h2>
        <div className="today-special-nav-buttons">
          <button 
            className="today-special-nav-btn today-special-nav-prev"
            onClick={goToPrevious}
            aria-label="이전 상품"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button 
            className="today-special-nav-btn today-special-nav-next"
            onClick={goToNext}
            aria-label="다음 상품"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </div>
      <div className="today-special-products-wrapper">
        <div className="today-special-products">
          {getVisibleProducts().map((product) => (
            <div
              key={product.id}
              className="today-special-product-card"
              onClick={() => handleProductClick(product.id)}
            >
              <div className="today-special-number-badge">
                {product.orderNumber}
              </div>
              <div className="today-special-badge">
                <span className="today-special-discount">{product.discount}%</span>
              </div>
              <div className="today-special-image-container">
                <img
                  src={product.image}
                  alt={product.name}
                  className="today-special-image"
                />
              </div>
              <div className="today-special-info">
                <h3 className="today-special-product-name">{product.name}</h3>
                <div className="today-special-price-container">
                  <span className="today-special-original-price">
                    {product.originalPrice.toLocaleString()}원
                  </span>
                  <span className="today-special-sale-price">
                    {product.salePrice.toLocaleString()}원
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="today-special-indicators">
        {Array.from({ length: totalPages }).map((_, index) => (
          <button
            key={index}
            className={`today-special-indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`페이지 ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default TodaySpecial;

