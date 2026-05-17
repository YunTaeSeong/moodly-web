import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getAllProducts } from '../utils/api';
import { displayListPriceFromSale } from '../utils/pricing';
import { TREND_FALLBACK_PRODUCTS } from './trendCategoryFallback';
import './EventDetail.css';

function parseDiscount(raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

const EVENT_PRODUCT_LIMIT = 9;
const FOOD_BEAUTY_HOME_CATEGORY_IDS = [3, 4, 5];

const EVENT_PRODUCT_CONFIG = {
  3: {
    categoryId: 1,
    productSectionTitle: '🛍️ 봄맞이 할인 의류',
    emptyMessage:
      '봄맞이 할인 의류 상품이 없습니다. product-service 재시작 후 DB 시드를 확인해 주세요.',
  },
  4: {
    categoryId: 2,
    productSectionTitle: '🛍️ 할인 전자제품',
    emptyMessage:
      '할인 중인 전자제품이 없습니다. product-service 재시작 후 DB 시드를 확인해 주세요.',
  },
  5: {
    categoryIds: FOOD_BEAUTY_HOME_CATEGORY_IDS,
    productSectionTitle: '🛍️ 푸드·뷰티·홈 주말 할인',
    emptyMessage:
      '푸드·뷰티·홈인테리어 할인 상품이 없습니다. product-service 재시작 후 DB 시드를 확인해 주세요.',
  },
};

function resolveCategoryId(product) {
  const raw = product.categoryId ?? product.category_id;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

function matchesCategoryFilter(product, categoryFilter) {
  if (categoryFilter == null) return true;
  const categoryId = resolveCategoryId(product);
  if (categoryId == null) return false;
  if (Array.isArray(categoryFilter)) {
    return categoryFilter.includes(categoryId);
  }
  return categoryId === categoryFilter;
}

function selectDiscountedProducts(products, categoryFilter) {
  return products
    .filter(
      (p) =>
        parseDiscount(p.discount) > 0 && matchesCategoryFilter(p, categoryFilter)
    )
    .sort((a, b) => parseDiscount(b.discount) - parseDiscount(a.discount))
    .slice(0, EVENT_PRODUCT_LIMIT)
    .map(formatEventProduct);
}

function resolveApiCategoryId(categoryFilter) {
  if (typeof categoryFilter === 'number') return categoryFilter;
  if (Array.isArray(categoryFilter) && categoryFilter.length === 1) {
    return categoryFilter[0];
  }
  return undefined;
}

async function loadDiscountedEventProducts(categoryFilter) {
  const result = await getAllProducts(resolveApiCategoryId(categoryFilter));
  if (!result.success || !result.data?.length) {
    return [];
  }
  return selectDiscountedProducts(result.data, categoryFilter);
}

function getFallbackDiscountedProducts(categoryFilter) {
  return selectDiscountedProducts(TREND_FALLBACK_PRODUCTS, categoryFilter);
}

function getEventCategoryFilter(config) {
  if (config.categoryIds?.length) return config.categoryIds;
  if (config.categoryId != null) return config.categoryId;
  return null;
}

function formatEventProduct(product) {
  const salePrice = product.price ? parseFloat(product.price) : 0;
  const discount = parseDiscount(product.discount);
  const originalPrice =
    discount > 0 ? displayListPriceFromSale(salePrice, discount) : salePrice;

  return {
    id: product.id,
    name: product.name,
    image: product.image || '',
    description: product.description || '',
    salePrice,
    discount,
    originalPrice,
  };
}

const COMMON_EVENT_TERMS = [
  '할인율은 상품별로 상이할 수 있습니다.',
  '한정 수량으로 조기 품절될 수 있습니다.',
  '사이즈 교환은 재고가 있을 경우에만 가능합니다.',
];

const eventData = {
  3: {
    id: 3,
    title: '봄맞이 패션 세일',
    subtitle: '최대 50%',
    description: '새로운 시즌을 위한 특별한 가격',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
    period: '2026년 3월 1일 ~ 5월 31일',
    terms: COMMON_EVENT_TERMS,
  },
  4: {
    id: 4,
    title: '전자제품 특가',
    subtitle: '프리미엄 혜택',
    description: '최신 기술을 더 저렴하게',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=600&fit=crop',
    period: '2024년 1월 10일 ~ 2월 10일',
    terms: COMMON_EVENT_TERMS,
  },
  5: {
    id: 5,
    title: '주말 특별 할인',
    subtitle: '24시간 한정',
    description: '이번 주말만 특별한 가격',
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed5f6d3d0?w=1200&h=600&fit=crop',
    period: '매주 금요일 18:00 ~ 일요일 18:00',
    terms: COMMON_EVENT_TERMS,
  },
};

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const eventId = parseInt(id, 10);
  const event = eventData[eventId];
  const productConfig = EVENT_PRODUCT_CONFIG[eventId];
  const [eventProducts, setEventProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);

  useEffect(() => {
    if (!event || !productConfig) {
      setProductsLoading(false);
      return;
    }

    const categoryFilter = getEventCategoryFilter(productConfig);

    const loadProducts = async () => {
      setProductsLoading(true);

      try {
        let products = await loadDiscountedEventProducts(categoryFilter);
        if (products.length === 0) {
          products = getFallbackDiscountedProducts(categoryFilter);
        }
        setEventProducts(products);
      } catch {
        setEventProducts(getFallbackDiscountedProducts(categoryFilter));
      } finally {
        setProductsLoading(false);
      }
    };

    loadProducts();
  }, [event, productConfig]);

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  if (!event) {
    return (
      <div className="event-detail-container">
        <div className="event-not-found">
          <h2>이벤트를 찾을 수 없습니다</h2>
          <button type="button" onClick={() => navigate('/')} className="back-button">
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
          <h2 className="section-title">
            {productConfig?.productSectionTitle ?? '🛍️ 할인 상품'}
          </h2>
          {productsLoading ? (
            <p className="event-products-loading">상품을 불러오는 중...</p>
          ) : eventProducts.length === 0 ? (
            <p className="event-products-loading">
              {productConfig?.emptyMessage ?? '표시할 상품이 없습니다.'}
            </p>
          ) : (
            <div className="products-grid">
              {eventProducts.map((product) => (
                <div key={product.id} className="product-card-event">
                  <div className="product-image-event-container">
                    {product.discount > 0 && (
                      <span className="event-discount-badge">{product.discount}%</span>
                    )}
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
                      {product.discount > 0 && (
                        <span className="original-price">
                          {product.originalPrice.toLocaleString()}원
                        </span>
                      )}
                      <span className="discount-price">
                        {product.salePrice.toLocaleString()}원
                      </span>
                    </div>
                    <button
                      type="button"
                      className="product-button"
                      onClick={() => handleProductClick(product.id)}
                    >
                      구매하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
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
