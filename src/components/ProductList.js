import React from 'react';
import { useNavigate } from 'react-router-dom';
import EventBanner from './EventBanner';
import HotDeal from './HotDeal';
import TodaySpecial from './TodaySpecial';
import './ProductList.css';

// 샘플 상품 데이터
const products = [
  {
    id: 1,
    name: '스마트폰 케이스',
    price: 15000,
    image: 'https://images.unsplash.com/photo-1601972602237-8c79241e468b?w=300&h=300&fit=crop',
    description: '고급스러운 스마트폰 케이스'
  },
  {
    id: 2,
    name: '무선 이어폰',
    price: 89000,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=300&fit=crop',
    description: '프리미엄 무선 이어폰'
  },
  {
    id: 3,
    name: '노트북 스탠드',
    price: 45000,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop',
    description: '인체공학적 노트북 스탠드'
  },
  {
    id: 4,
    name: '블루투스 스피커',
    price: 120000,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop',
    description: '고음질 블루투스 스피커'
  },
  {
    id: 5,
    name: '스마트 워치',
    price: 250000,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
    description: '최신 스마트 워치'
  },
  {
    id: 6,
    name: '무선 마우스',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=300&h=300&fit=crop',
    description: '에르고노믹 무선 마우스'
  },
  {
    id: 7,
    name: 'USB-C 케이블',
    price: 12000,
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=300&h=300&fit=crop',
    description: '고속 충전 USB-C 케이블'
  },
  {
    id: 8,
    name: '태블릿 거치대',
    price: 28000,
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=300&h=300&fit=crop',
    description: '조절 가능한 태블릿 거치대'
  },
  {
    id: 9,
    name: '무선 키보드',
    price: 75000,
    image: 'https://images.unsplash.com/photo-1587829741301-dc918b0c716f?w=300&h=300&fit=crop',
    description: '프리미엄 무선 키보드'
  },
  {
    id: 10,
    name: '게이밍 마우스패드',
    price: 25000,
    image: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=300&h=300&fit=crop',
    description: '대형 게이밍 마우스패드'
  },
  {
    id: 11,
    name: '웹캠 HD',
    price: 95000,
    image: 'https://images.unsplash.com/photo-1587825143138-044a3fa50491?w=300&h=300&fit=crop',
    description: '고화질 웹캠'
  },
  {
    id: 12,
    name: '스탠딩 데스크',
    price: 180000,
    image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=300&h=300&fit=crop',
    description: '전동 스탠딩 데스크'
  },
  {
    id: 13,
    name: 'USB 허브',
    price: 35000,
    image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=300&h=300&fit=crop',
    description: '다중 포트 USB 허브'
  },
  {
    id: 14,
    name: '모니터 스탠드',
    price: 55000,
    image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=300&fit=crop',
    description: '조절 가능한 모니터 스탠드'
  },
  {
    id: 15,
    name: '블루투스 어댑터',
    price: 18000,
    image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=300&h=300&fit=crop',
    description: 'USB 블루투스 어댑터'
  },
  {
    id: 16,
    name: '노이즈 캔슬링 이어폰',
    price: 150000,
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
    description: '프리미엄 노이즈 캔슬링 이어폰'
  }
];

function ProductList() {
  const navigate = useNavigate();

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="product-list-container">
      <EventBanner />
      <HotDeal />
      <TodaySpecial />
      <h2 className="product-list-title">인기 상품</h2>
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
    </div>
  );
}

export default ProductList;

