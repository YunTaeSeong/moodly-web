import React from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { getAllCategoryProducts, getCategoryProducts } from '../utils/categoryProducts';
import './CategoryDetail.css';

function CategoryDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const subCategoryName = searchParams.get('sub');
  
  const allCategories = getAllCategoryProducts();
  const category = allCategories[id];

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

  // 서브카테고리별 상품 가져오기
  const products = getCategoryProducts(id, subCategoryName);

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
        {products.length === 0 ? (
          <div className="category-empty">
            <p>상품이 없습니다.</p>
          </div>
        ) : (
          <div className="category-products-grid">
            {products.map((product) => (
              <div
                key={product.id}
                className="category-product-card"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="category-product-image-container">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="category-product-image"
                  />
                </div>
                <div className="category-product-info">
                  <h3 className="category-product-name">{product.name}</h3>
                  <p className="category-product-description">{product.description}</p>
                  <p className="category-product-price">{product.price.toLocaleString()}원</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CategoryDetail;

