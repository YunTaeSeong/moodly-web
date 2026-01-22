import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getHotDealProducts } from '../utils/api';
import './HotDealDetail.css';

// 백엔드 미실행 시 사용할 fallback 데이터 (products 테이블에 있는 실제 상품들 - 할인율 높은 순 10개)
const fallbackHotDealProducts = [
  {
    id: 2,
    name: '무선 이어폰',
    originalPrice: 134848,
    salePrice: 89000,
    discount: 34,
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop',
    description: '프리미엄 무선 이어폰으로 최고의 음질을 경험하세요. 노이즈 캔슬링 기능이 탑재되어 있어 어디서나 몰입감 있는 음악 감상을 즐길 수 있습니다.'
  },
  {
    id: 35,
    name: '스킨케어 세트',
    originalPrice: 181818,
    salePrice: 120000,
    discount: 34,
    image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=500&fit=crop',
    description: '프리미엄 스킨케어 세트로 건강한 피부를 만들어보세요. 모든 피부 타입에 적합한 완벽한 스킨케어 루틴을 제공합니다.'
  },
  {
    id: 37,
    name: '향수',
    originalPrice: 217391,
    salePrice: 150000,
    discount: 31,
    image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=500&fit=crop',
    description: '프리미엄 향수로 고급스러운 향을 즐기세요. 오래 지속되는 향과 세련된 향조를 제공합니다.'
  },
  {
    id: 41,
    name: '디퓨저 세트',
    originalPrice: 65217,
    salePrice: 45000,
    discount: 31,
    image: 'https://images.unsplash.com/photo-1606800054160-8e3c14e1a0b0?w=500&h=500&fit=crop',
    description: '아로마 디퓨저로 집안을 향기롭게 만들어보세요. 다양한 아로마 오일과 함께 사용하여 분위기를 연출할 수 있습니다.'
  },
  {
    id: 5,
    name: '스마트 워치',
    originalPrice: 352112,
    salePrice: 250000,
    discount: 29,
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop',
    description: '최신 스마트 워치로 건강과 일상을 관리하세요. 운동 추적부터 알림까지 모든 것을 한 손목에서 처리할 수 있습니다.'
  },
  {
    id: 4,
    name: '블루투스 스피커',
    originalPrice: 166667,
    salePrice: 120000,
    discount: 28,
    image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop',
    description: '고음질 블루투스 스피커로 어디서나 음악을 즐기세요. 강력한 베이스와 선명한 고음으로 콘서트장 같은 몰입감을 선사합니다.'
  },
  {
    id: 25,
    name: '에어프라이어',
    originalPrice: 250000,
    salePrice: 180000,
    discount: 28,
    image: 'https://images.unsplash.com/photo-1556910096-6f5e5ad8bcf4?w=500&h=500&fit=crop',
    description: '대용량 에어프라이어로 건강한 요리를 즐기세요. 기름 없이도 바삭하고 맛있는 요리를 만들 수 있습니다.'
  },
  {
    id: 26,
    name: '로봇 청소기',
    originalPrice: 616438,
    salePrice: 450000,
    discount: 27,
    image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=500&fit=crop',
    description: '스마트 로봇 청소기로 자동으로 깨끗한 집을 유지하세요. 스마트 매핑 기능으로 효율적인 청소 경로를 설정합니다.'
  },
  {
    id: 30,
    name: '프리미엄 한우',
    originalPrice: 114865,
    salePrice: 85000,
    discount: 26,
    image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=500&h=500&fit=crop',
    description: '1등급 한우 세트로 프리미엄 고기를 즐기세요. 최상급 한우를 엄선하여 신선하게 배송해드립니다.'
  },
  {
    id: 1,
    name: '스마트폰 케이스',
    originalPrice: 20000,
    salePrice: 15000,
    discount: 25,
    image: 'https://images.unsplash.com/photo-1601972602237-8c79241e468b?w=500&h=500&fit=crop',
    description: '고급스러운 스마트폰 케이스로 기기를 완벽하게 보호하세요. 얇고 가벼우면서도 강력한 보호 기능을 제공합니다.'
  }
];

function HotDealDetail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedProductId = searchParams.get('productId') ? parseInt(searchParams.get('productId')) : null;
  const selectedProductRef = useRef(null);
  const [hotDealProducts, setHotDealProducts] = useState(fallbackHotDealProducts); // 초기값으로 fallback 사용
  const [loading, setLoading] = useState(true);

  // 핫딜 상품 로드
  useEffect(() => {
    const loadHotDealProducts = async () => {
      setLoading(true);
      try {
        const result = await getHotDealProducts(10); // 상위 10개
        if (result.success && result.data && result.data.length > 0) {
          // 백엔드 응답을 프론트엔드 형식으로 변환
          const formattedProducts = result.data.map(product => {
            const price = product.price ? parseFloat(product.price) : 0;
            const discount = product.discount || 0;
            const originalPrice = discount > 0 ? Math.round(price / (1 - discount / 100)) : price;
            
            return {
              id: product.id,
              name: product.name,
              originalPrice: originalPrice,
              salePrice: price,
              discount: discount,
              image: product.image || 'https://via.placeholder.com/300?text=No+Image',
              description: product.description || ''
            };
          });
          setHotDealProducts(formattedProducts);
        } else {
          // API 호출 실패 시 fallback 데이터 사용
          setHotDealProducts(fallbackHotDealProducts);
        }
      } catch (error) {
        console.error('핫딜 상품 로드 오류:', error);
        // 에러 시 fallback 데이터 사용
        setHotDealProducts(fallbackHotDealProducts);
      } finally {
        setLoading(false);
      }
    };

    loadHotDealProducts();
  }, []);

  // 선택된 상품으로 스크롤
  useEffect(() => {
    if (selectedProductId && hotDealProducts.length > 0) {
      setTimeout(() => {
        if (selectedProductRef.current) {
          selectedProductRef.current.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }
      }, 300);
    }
  }, [selectedProductId, hotDealProducts]);

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

  if (loading) {
    return (
      <div className="hotdeal-detail-container">
        <div className="hotdeal-detail-header">
          <h1 className="hotdeal-detail-title">오늘의 핫딜</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>핫딜 상품을 불러오는 중...</div>
      </div>
    );
  }

  if (hotDealProducts.length === 0) {
    return (
      <div className="hotdeal-detail-container">
        <div className="hotdeal-detail-header">
          <h1 className="hotdeal-detail-title">오늘의 핫딜</h1>
        </div>
        <div style={{ textAlign: 'center', padding: '2rem' }}>현재 진행 중인 핫딜 상품이 없습니다.</div>
      </div>
    );
  }

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

