import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { isLoggedIn } from '../utils/cookie';
import { fetchFlashCouponStatus, issueCouponById } from '../utils/api';
import './EventBanner.css';

const staticBanners = [
  {
    id: 3,
    title: '봄맞이 패션 세일',
    subtitle: '최대 50%',
    description: '새로운 시즌을 위한 특별한 가격',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
  },
  {
    id: 4,
    title: '전자제품 특가',
    subtitle: '프리미엄 혜택',
    description: '최신 기술을 더 저렴하게',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=400&fit=crop',
  },
  {
    id: 5,
    title: '주말 특별 할인',
    subtitle: '24시간 한정',
    description: '이번 주말만 특별한 가격',
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed5f6d3d0?w=1200&h=400&fit=crop',
  },
];

const FLASH_GRADIENT = 'linear-gradient(135deg, #ff416c 0%, #ff4b2b 50%, #ff6a00 100%)';
const FLASH_IMAGE = 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1200&h=400&fit=crop';
const SLIDE_INTERVAL_MS = 3000;
const FLASH_POLL_INTERVAL_MS = 4000;

function EventBanner() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [flashStatus, setFlashStatus] = useState(null);
  const [flashLoading, setFlashLoading] = useState(true);
  const [issuing, setIssuing] = useState(false);
  const intervalRef = useRef(null);

  const bannerCount = 1 + staticBanners.length;

  const loadFlashStatus = useCallback(async () => {
    const result = await fetchFlashCouponStatus();
    if (result.success && result.data) {
      setFlashStatus(result.data);
    }
    setFlashLoading(false);
  }, []);

  useEffect(() => {
    loadFlashStatus();
    const pollId = setInterval(loadFlashStatus, FLASH_POLL_INTERVAL_MS);
    return () => clearInterval(pollId);
  }, [loadFlashStatus]);

  const resetAutoSlide = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % bannerCount);
    }, SLIDE_INTERVAL_MS);
  }, [bannerCount]);

  useEffect(() => {
    resetAutoSlide();
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [resetAutoSlide]);

  const goToSlide = (index) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCurrentIndex(index);
    resetAutoSlide();
  };

  const goToPrevious = () => {
    goToSlide((currentIndex - 1 + bannerCount) % bannerCount);
  };

  const goToNext = () => {
    goToSlide((currentIndex + 1) % bannerCount);
  };

  const handleBannerClick = (bannerId) => {
    navigate(`/event/${bannerId}`);
  };

  const getFlashDescription = () => {
    if (flashLoading) {
      return '선착순 쿠폰 정보를 불러오는 중...';
    }
    if (!flashStatus) {
      return '쿠폰 서버에 연결할 수 없습니다. coupon-service 기동 후 새로고침해 주세요.';
    }
    if (flashStatus.exhausted) {
      return '선착순 1,000명이 모두 마감되었습니다. 다음 이벤트를 기대해 주세요!';
    }
    if (flashStatus.alreadyReceived) {
      return `발급 완료! 마이페이지 > 쿠폰함 또는 상품 결제 시 바로 사용할 수 있습니다. (남은 ${flashStatus.remainingQuantity.toLocaleString()}장)`;
    }
    return `실시간 남은 수량 ${flashStatus.remainingQuantity.toLocaleString()} / ${flashStatus.totalQuantity.toLocaleString()}장 · 클릭 즉시 70% 할인 쿠폰 발급!`;
  };

  const getFlashButtonLabel = () => {
    if (issuing) return '발급 중...';
    if (flashLoading) return '불러오는 중...';
    if (!flashStatus) return '연결 실패';
    if (flashStatus.exhausted) return '선착순 마감';
    if (flashStatus.alreadyReceived) return '발급 완료';
    return '지금 쿠폰 받기';
  };

  const isFlashButtonDisabled = () => {
    if (issuing || flashLoading || !flashStatus) return true;
    return flashStatus.exhausted || flashStatus.alreadyReceived;
  };

  const handleFlashCouponClick = async (e) => {
    e.stopPropagation();

    if (flashLoading || !flashStatus) {
      window.alert('쿠폰 정보를 불러오는 중입니다. 잠시 후 다시 시도해 주세요.');
      return;
    }

    if (flashStatus.exhausted) {
      window.alert('선착순 1,000명이 모두 마감되었습니다.\n다음 이벤트를 기대해 주세요!');
      return;
    }

    if (flashStatus.alreadyReceived) {
      window.alert('이미 발급받으신 쿠폰입니다.\n마이페이지 > 쿠폰함에서 확인하거나 상품 결제 시 바로 사용할 수 있습니다.');
      return;
    }

    if (!isLoggedIn()) {
      window.alert('쿠폰 발급을 위해 로그인이 필요합니다.');
      navigate('/login');
      return;
    }

    setIssuing(true);
    try {
      const result = await issueCouponById(flashStatus.couponId);
      if (result.success) {
        window.alert('70% 할인 쿠폰이 발급되었습니다!\n마이페이지 > 쿠폰함 또는 상품 결제 시 바로 사용할 수 있습니다.');
        await loadFlashStatus();
        return;
      }

      if (result.errorCode === 'COUPON_007') {
        window.alert('아쉽지만 선착순 1,000명이 모두 마감되었습니다.\n다음 이벤트를 기대해 주세요!');
        await loadFlashStatus();
        return;
      }

      if (result.errorCode === 'COUPON_0012') {
        window.alert('이미 발급받으신 쿠폰입니다.\n마이페이지 > 쿠폰함에서 확인해 주세요.');
        await loadFlashStatus();
        return;
      }

      window.alert(result.message || '쿠폰을 받지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIssuing(false);
    }
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const endX = e.changedTouches[0].clientX;
    if (touchStart == null) return;

    const distance = touchStart - endX;
    if (distance > 50) {
      goToNext();
    } else if (distance < -50) {
      goToPrevious();
    }

    setTouchStart(null);
  };

  return (
    <div className="event-banner-container">
      <div className="banner-layout">
        <div
          className="banner-main-section"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            className="banner-nav-button banner-nav-prev"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            aria-label="이전 배너"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>

          <button
            type="button"
            className="banner-nav-button banner-nav-next"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label="다음 배너"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>

          <div
            className="event-banner-wrapper"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            <div
              className="event-banner-slide flash-coupon-slide"
              style={{ backgroundImage: `url(${FLASH_IMAGE})` }}
              onClick={handleFlashCouponClick}
            >
              <div className="banner-overlay flash-coupon-overlay" style={{ background: FLASH_GRADIENT }}>
                <div className="banner-content">
                  <span className="flash-coupon-badge">실시간 선착순</span>
                  <h2 className="banner-title">70% 초특가 쿠폰</h2>
                  <p className="banner-subtitle">1,000명 한정</p>
                  <p className="banner-description">{getFlashDescription()}</p>
                  <button
                    type="button"
                    className={`banner-button flash-coupon-button ${flashStatus?.exhausted ? 'disabled' : ''}`}
                    disabled={isFlashButtonDisabled()}
                    onClick={handleFlashCouponClick}
                  >
                    {getFlashButtonLabel()}
                  </button>
                </div>
              </div>
            </div>

            {staticBanners.map((banner) => (
              <div
                key={banner.id}
                className="event-banner-slide"
                style={{ backgroundImage: `url(${banner.image})` }}
                onClick={() => handleBannerClick(banner.id)}
              >
                <div className="banner-overlay" style={{ background: banner.gradient }}>
                  <div className="banner-content">
                    <h2 className="banner-title">{banner.title}</h2>
                    <p className="banner-subtitle">{banner.subtitle}</p>
                    <p className="banner-description">{banner.description}</p>
                    <button
                      type="button"
                      className="banner-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBannerClick(banner.id);
                      }}
                    >
                      지금 확인하기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="banner-indicators">
            {Array.from({ length: bannerCount }).map((_, index) => (
              <button
                key={index}
                type="button"
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`배너 ${index + 1}로 이동`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventBanner;
