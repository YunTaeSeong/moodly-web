import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getAllProducts } from '../utils/api';
import { displayListPriceFromSale } from '../utils/pricing';
import { BACKEND_ID_BY_ROUTE, resolveBackendCategoryId } from '../utils/categoryRoutes';
import './CategoryDetail.css';

const TIER_BADGE_MIN_PRICE = 500_000;

function parseDiscount(raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

// 카테고리 메타데이터
const categoryMeta = {
  'clothing': { name: '의류', icon: '👕', description: '트렌디한 패션 아이템을 만나보세요' },
  'electronics': { name: '가전용품', icon: '📱', description: '최신 기술의 가전제품을 만나보세요' },
  'food': { name: '푸드', icon: '🍔', description: '신선하고 건강한 식품을 만나보세요' },
  'beauty': { name: '뷰티', icon: '💄', description: '아름다움을 위한 뷰티 제품' },
  'home-interior': { name: '홈인테리어', icon: '🏠', description: '아늑한 공간을 만드는 인테리어 아이템' },
  'home': { name: '홈인테리어', icon: '🏠', description: '아늑한 공간을 만드는 인테리어 아이템' }
};

function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subCategoryName = searchParams.get('sub');
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const category = categoryMeta[id];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [id, subCategoryName]);

  useEffect(() => {
    const loadProducts = async () => {
      // 카테고리 ID가 유효하지 않으면 즉시 종료
      if (!id || !BACKEND_ID_BY_ROUTE[id]) {
        setError('유효하지 않은 카테고리입니다.');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        // 백엔드 카테고리 ID로 변환
        const backendCategoryId = resolveBackendCategoryId(id);
        
        const result = await getAllProducts(backendCategoryId);
        if (result.success && result.data) {
          let fetchedProducts = result.data;

          // 서브카테고리 필터링 (프론트엔드에서 처리)
          if (subCategoryName) {
            fetchedProducts = fetchedProducts.filter(p => p.subCategoryName === subCategoryName);
          }

          // API 응답을 프론트엔드 형식으로 변환
          const formattedProducts = fetchedProducts.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price ? parseFloat(product.price) : 0,
            discount: parseDiscount(product.discount),
            image: product.image || '',
            description: product.description || ''
          }));
          setProducts(formattedProducts);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error('카테고리 상품 로드 오류:', error);
        setError('상품을 불러오는 중 오류가 발생했습니다.');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, [id, subCategoryName]);

  if (!category) {
    return (
      <div className="category-detail-container">
        <div className="category-not-found">
          <h2>카테고리를 찾을 수 없습니다</h2>
          <button onClick={() => navigate('/')} className="back-button">
            홈으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="category-detail-container">
      <div className="category-header">
        <div className="category-header-content">
          <span className="category-header-icon">{category.icon}</span>
          <div>
            <h1 className="category-header-title">
              {category.name}
              {subCategoryName && <span className="subcategory-badge"> - {subCategoryName}</span>}
            </h1>
            <p className="category-header-description">{category.description}</p>
          </div>
        </div>
      </div>

      <div className="category-products-container">
        <h2 className="category-products-title">
          {subCategoryName ? `${subCategoryName} 상품` : '전체 상품 목록'}
        </h2>
        {loading ? (
          <div className="category-empty">
            <p>상품을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="category-empty">
            <p>{error}</p>
            <button onClick={() => navigate('/')} className="back-button">
              홈으로 돌아가기
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="category-empty">
            <p>상품이 없습니다.</p>
          </div>
        ) : (
          <div className="category-products-grid">
            {products.map((product) => {
              const listPrice =
                product.discount > 0
                  ? displayListPriceFromSale(product.price, product.discount)
                  : null;
              const showTierBadge =
                product.price >= TIER_BADGE_MIN_PRICE && product.discount > 0;
              return (
              <div
                key={product.id}
                className="category-product-card"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="category-product-image-container">
                  {showTierBadge && (
                    <span className="category-product-discount-badge" aria-hidden>
                      {product.discount}%
                    </span>
                  )}
                  <img
                    src={product.image || 'https://via.placeholder.com/300?text=No+Image'}
                    alt={product.name}
                    className="category-product-image"
                  />
                </div>
                <div className="category-product-info">
                  <h3 className="category-product-name">{product.name}</h3>
                  <p className="category-product-description">{product.description || '설명 없음'}</p>
                  {listPrice != null ? (
                    <div className="category-product-price-block">
                      <p className="category-product-list-price">
                        {listPrice.toLocaleString()}원
                      </p>
                      <p className="category-product-sale-price">
                        {product.price.toLocaleString()}원
                      </p>
                    </div>
                  ) : (
                    <p className="category-product-price">{product.price.toLocaleString()}원</p>
                  )}
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryDetail;

