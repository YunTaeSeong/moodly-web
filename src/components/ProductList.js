import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import EventBanner from './EventBanner';
import HotDeal from './HotDeal';
import TodaySpecial from './TodaySpecial';
import { getAllProducts } from '../utils/api';
import { displayListPriceFromSale } from '../utils/pricing';
import { TREND_CATEGORY_BLOCKS } from './trendCategoryConfig';
import { TREND_FALLBACK_PRODUCTS } from './trendCategoryFallback';
import './ProductList.css';

const TIER_BADGE_MIN_PRICE = 500_000;
const TREND_GRID_PAGE_SIZE = 6;
const TREND_GRID_MAX_PAGES = 3;

function parseDiscount(raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : 0;
}

function pickCategoryProducts(all, categoryId, limit = 6) {
  const list = all.filter((p) => Number(p.categoryId) === categoryId);
  return [...list]
    .sort((a, b) => {
      const da = Number(a.discount) || 0;
      const db = Number(b.discount) || 0;
      if (db !== da) return db - da;
      return Number(b.id) - Number(a.id);
    })
    .slice(0, limit);
}

function TrendCategoryRow({
  block,
  products,
  onProductClick,
  onCategoryNavigate,
  onSubCategoryNavigate,
}) {
  const [bannerIdx, setBannerIdx] = useState(0);
  const [gridPage, setGridPage] = useState(0);
  const slides = block.bannerSlides;
  const n = slides.length;

  const goPrev = useCallback(() => {
    setBannerIdx((i) => (i - 1 + n) % n);
  }, [n]);

  const goNext = useCallback(() => {
    setBannerIdx((i) => (i + 1) % n);
  }, [n]);

  const slide = slides[bannerIdx];

  useEffect(() => {
    if (n <= 1) return undefined;
    const timerId = window.setInterval(() => {
      setBannerIdx((i) => (i + 1) % n);
    }, 3000);
    return () => window.clearInterval(timerId);
  }, [n]);

  const pageCount = useMemo(() => {
    if (products.length === 0) return 1;
    return Math.min(TREND_GRID_MAX_PAGES, Math.ceil(products.length / TREND_GRID_PAGE_SIZE));
  }, [products.length]);

  const visibleGridProducts = useMemo(() => {
    const start = gridPage * TREND_GRID_PAGE_SIZE;
    return products.slice(start, start + TREND_GRID_PAGE_SIZE);
  }, [products, gridPage]);

  const paddedGridProducts = useMemo(() => {
    const list = [...visibleGridProducts];
    while (list.length < TREND_GRID_PAGE_SIZE) list.push(null);
    return list;
  }, [visibleGridProducts]);

  useEffect(() => {
    setGridPage(0);
  }, [block.backendId]);

  useEffect(() => {
    setGridPage((p) => Math.min(p, Math.max(0, pageCount - 1)));
  }, [pageCount]);

  const hasGridProducts = products.length > 0;

  const gridGoPrev = useCallback(() => {
    if (!hasGridProducts) return;
    setGridPage((p) => (p - 1 + pageCount) % pageCount);
  }, [hasGridProducts, pageCount]);

  const gridGoNext = useCallback(() => {
    if (!hasGridProducts) return;
    setGridPage((p) => (p + 1) % pageCount);
  }, [hasGridProducts, pageCount]);

  return (
    <section className="trend-category-section" aria-labelledby={`trend-cat-${block.backendId}`}>
      <div className="trend-category-inner">
        <aside className="trend-sidebar">
          <h3
            id={`trend-cat-${block.backendId}`}
            className="trend-sidebar-title"
            style={{ color: block.accent }}
          >
            {block.title}
          </h3>
          <Link className="trend-sidebar-link" to={`/category/${block.routePath}`}>
            {'\ubc14\ub85c\uac00\uae30 >'}
          </Link>
          <div className="trend-hot-keywords">
            <span className="trend-hot-label">{'HOT \ud0a4\uc6cc\ub4dc'}</span>
            <div className="trend-keyword-tags">
              {block.hotKeywords.map((kw) => (
                <button
                  key={kw.subCategory}
                  type="button"
                  className="trend-keyword-btn"
                  onClick={() => onSubCategoryNavigate(block.routePath, kw.subCategory)}
                >
                  #{kw.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="trend-main">
          <div className="trend-banner-wrap">
            <div
              className="trend-banner"
              role="button"
              tabIndex={0}
              onClick={() => onCategoryNavigate(block.routePath)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onCategoryNavigate(block.routePath);
                }
              }}
              aria-label={`${block.title} 카테고리로 이동`}
            >
              <img src={slide.image} alt={block.title} className="trend-banner-img" />
              <div className="trend-banner-caption" style={{ background: `${block.accent}cc` }}>
                <strong>{slide.line1}</strong>
                <span>{slide.line2}</span>
              </div>
              <button
                type="button"
                className="trend-banner-nav trend-banner-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  goPrev();
                }}
                aria-label={'\uc774\uc804 \ubc30\ub108'}
              >
                {'\u2039'}
              </button>
              <button
                type="button"
                className="trend-banner-nav trend-banner-next"
                onClick={(e) => {
                  e.stopPropagation();
                  goNext();
                }}
                aria-label={'\ub2e4\uc74c \ubc30\ub108'}
              >
                {'\u203a'}
              </button>
            </div>
          </div>

          <div className="trend-grid-panel">
            <div className="trend-grid-carousel">
              <button
                type="button"
                className="trend-grid-nav trend-banner-nav trend-grid-prev"
                onClick={gridGoPrev}
                disabled={!hasGridProducts}
                aria-label={'이전 상품'}
              >
                {'‹'}
              </button>

              <div className="trend-product-grid-wrap">
                <div className="trend-product-grid">
              {hasGridProducts ? (
                paddedGridProducts.map((product, idx) => {
                  if (!product) {
                    return <div key={`empty-${idx}`} className="trend-mini-card trend-mini-card-empty" aria-hidden />;
                  }
                  const disc = product.discount != null ? product.discount : 0;
                  const listPrice = disc > 0 ? displayListPriceFromSale(product.price, disc) : null;
                  const showDiscountBadge = disc > 0;
                  const showTierBadge = product.price >= TIER_BADGE_MIN_PRICE && disc > 0;

                  return (
                    <div
                      key={product.id}
                      className="trend-mini-card"
                      role="button"
                      tabIndex={0}
                      onClick={() => onProductClick(product.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onProductClick(product.id);
                        }
                      }}
                    >
                      <div className="trend-mini-image-wrap">
                        {showDiscountBadge && (
                          <span
                            className={`trend-mini-discount-badge ${showTierBadge ? 'tier' : ''}`}
                            aria-hidden
                          >
                            {disc}%
                          </span>
                        )}
                        <img
                          src={product.image || 'https://via.placeholder.com/200?text=No+Image'}
                          alt=""
                          className="trend-mini-img"
                        />
                      </div>
                      <div className="trend-mini-body">
                        <p className="trend-mini-name">{product.name}</p>
                        <span
                          className={`trend-mini-discount-label ${disc > 0 ? '' : 'is-hidden'}`}
                          aria-hidden={disc > 0 ? undefined : 'true'}
                        >
                          {'\ud560\uc778'}
                        </span>
                        <div className="trend-mini-price-row">
                          {listPrice != null ? (
                            <>
                              <span className="trend-mini-original">
                                {listPrice.toLocaleString()}
                                {'\uc6d0'}
                              </span>
                              <span className="trend-mini-sale">
                                {product.price.toLocaleString()}
                                {'\uc6d0'}
                              </span>
                            </>
                          ) : (
                            <span className="trend-mini-sale only">
                              {product.price.toLocaleString()}
                              {'\uc6d0'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="trend-grid-empty">
                  {'\uc774 \uce74\ud14c\uace0\ub9ac\uc5d0 \ud45c\uc2dc\ud560 \uc0c1\ud488\uc774 \uc5c6\uc2b5\ub2c8\ub2e4.'}
                </p>
              )}
                </div>
              </div>

              <button
                type="button"
                className="trend-grid-nav trend-banner-nav trend-grid-next"
                onClick={gridGoNext}
                disabled={!hasGridProducts}
                aria-label={'다음 상품'}
              >
                {'›'}
              </button>
            </div>
            {hasGridProducts && pageCount > 1 && (
              <div className="trend-grid-dots" aria-label={'상품 페이지'}>
                {Array.from({ length: pageCount }).map((_, i) => (
                  <button
                    key={`grid-dot-${i}`}
                    type="button"
                    className={`trend-grid-dot ${i === gridPage ? 'active' : ''}`}
                    aria-label={`${i + 1}`}
                    aria-current={i === gridPage ? 'true' : undefined}
                    onClick={() => setGridPage(i)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const result = await getAllProducts();
        if (result.success && result.data && result.data.length > 0) {
          const formattedProducts = result.data.map((product) => ({
            id: product.id,
            name: product.name,
            price: product.price ? parseFloat(product.price) : 0,
            discount: parseDiscount(product.discount),
            categoryId: product.categoryId != null ? Number(product.categoryId) : null,
            image: product.image || '',
            description: product.description || '',
          }));
          setProducts(formattedProducts);
        } else {
          setProducts(TREND_FALLBACK_PRODUCTS);
        }
      } catch (error) {
        console.error('Product list load error', error);
        setProducts(TREND_FALLBACK_PRODUCTS);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const goProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  const goCategory = (routePath) => {
    navigate(`/category/${routePath}`);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  const goSubCategory = (routePath, subCategoryName) => {
    navigate(`/category/${routePath}?sub=${encodeURIComponent(subCategoryName)}`);
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  return (
    <div className="product-list-container">
      <EventBanner />
      <HotDeal />
      <TodaySpecial />

      <div className="trend-popular-wrap">
        <header className="trend-section-header">
          <h2 className="trend-section-title">
            <span className="trend-hot">HOT!</span>{' '}
            <span className="trend-trend">TREND</span>
          </h2>
          <p className="trend-sub">
            {'\uce74\ud14c\uace0\ub9ac\ubcc4 \ucd94\ucc9c \uad11\uace0\uc0c1\ud488'}
          </p>
        </header>

        {loading ? (
          <div className="trend-loading">
            {'\uc0c1\ud488\uc744 \ubd88\ub7ec\uc624\ub294 \uc911...'}
          </div>
        ) : (
          TREND_CATEGORY_BLOCKS.map((block) => (
            <TrendCategoryRow
              key={block.backendId}
              block={block}
              products={pickCategoryProducts(
                products,
                block.backendId,
                TREND_GRID_PAGE_SIZE * TREND_GRID_MAX_PAGES
              )}
              onProductClick={goProduct}
              onCategoryNavigate={goCategory}
              onSubCategoryNavigate={goSubCategory}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default ProductList;
