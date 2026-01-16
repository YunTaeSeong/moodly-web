import React, { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './HotDealDetail.css';

// 오늘의 핫딜 상품 10개 (HotDeal과 동일)
const hotDealProducts = [
  {
    id: 101,
    name: '프리미엄 무선 이어폰',
    originalPrice: 150000,
    salePrice: 99000,
    discount: 34,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300&h=300&fit=crop',
    description: '프리미엄 무선 이어폰'
  },
  {
    id: 102,
    name: '스마트 워치 프로',
    originalPrice: 350000,
    salePrice: 249000,
    discount: 29,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=300&fit=crop',
    description: '최신 스마트 워치'
  },
  {
    id: 103,
    name: '블루투스 스피커',
    originalPrice: 180000,
    salePrice: 129000,
    discount: 28,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=300&fit=crop',
    description: '고음질 블루투스 스피커'
  },
  {
    id: 104,
    name: '에어프라이어 대용량',
    originalPrice: 250000,
    salePrice: 179000,
    discount: 28,
    image: 'https://images.unsplash.com/photo-1556910096-6f5e5ad8bcf4?w=300&h=300&fit=crop',
    description: '대용량 에어프라이어'
  },
  {
    id: 105,
    name: '프리미엄 향수 세트',
    originalPrice: 200000,
    salePrice: 139000,
    discount: 31,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop',
    description: '프리미엄 향수 세트'
  },
  {
    id: 106,
    name: '스킨케어 스페셜 세트',
    originalPrice: 180000,
    salePrice: 119000,
    discount: 34,
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop',
    description: '프리미엄 스킨케어'
  },
  {
    id: 107,
    name: '디퓨저 아로마 세트',
    originalPrice: 80000,
    salePrice: 55000,
    discount: 31,
    image: 'https://images.unsplash.com/photo-1606800054160-8e3c14e1a0b0?w=300&h=300&fit=crop',
    description: '아로마 디퓨저 세트'
  },
  {
    id: 108,
    name: '프리미엄 한우 세트',
    originalPrice: 120000,
    salePrice: 89000,
    discount: 26,
    image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=300&h=300&fit=crop',
    description: '1등급 한우 세트'
  },
  {
    id: 109,
    name: '노트북 프로 15인치',
    originalPrice: 2200000,
    salePrice: 1790000,
    discount: 19,
    image: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=300&h=300&fit=crop',
    description: '고성능 노트북'
  },
  {
    id: 110,
    name: '무선 청소기 프로',
    originalPrice: 450000,
    salePrice: 329000,
    discount: 27,
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop',
    description: '강력한 무선 청소기'
  }
];

function HotDealDetail() {
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
    return hotDealProducts.map((product, index) => ({
      ...product,
      orderNumber: index + 1,
      isSelected: product.id === selectedProductId
    }));
  };

  return (
    <div className="hotdeal-detail-container">
      <div className="hotdeal-detail-header">
        <h1 className="hotdeal-detail-title">오늘의 핫딜</h1>
      </div>

      <div className="hotdeal-detail-products-grid">
        {getAllProducts().map((product) => (
          <div
            key={product.id}
            ref={product.isSelected ? selectedProductRef : null}
            className={`hotdeal-detail-product-card ${product.isSelected ? 'hotdeal-detail-product-selected' : ''}`}
            onClick={() => handleProductClick(product.id)}
          >
            <div className="hotdeal-detail-number-badge">
              {product.orderNumber}
            </div>
            <div className="hotdeal-detail-badge">
              <span className="hotdeal-detail-discount">{product.discount}%</span>
            </div>
            <div className="hotdeal-detail-image-container">
              <img
                src={product.image}
                alt={product.name}
                className="hotdeal-detail-image"
              />
            </div>
            <div className="hotdeal-detail-info">
              <h3 className="hotdeal-detail-product-name">{product.name}</h3>
              <div className="hotdeal-detail-price-container">
                <span className="hotdeal-detail-original-price">
                  {product.originalPrice.toLocaleString()}원
                </span>
                <span className="hotdeal-detail-sale-price">
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

export default HotDealDetail;

