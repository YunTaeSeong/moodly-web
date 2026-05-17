import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './EventBanner.css';

const banners = [
  {
    id: 3,
    title: '봄맞이 패션 세일',
    subtitle: '최대 50%',
    description: '새로운 시즌을 위한 특별한 가격',
    color: '#3498db',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop'
  },
  {
    id: 4,
    title: '전자제품 특가',
    subtitle: '프리미엄 혜택',
    description: '최신 기술을 더 저렴하게',
    color: '#9b59b6',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    image: 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=1200&h=400&fit=crop'
  },
  {
    id: 5,
    title: '주말 특별 할인',
    subtitle: '24시간 한정',
    description: '이번 주말만 특별한 가격',
    color: '#e67e22',
    gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed5f6d3d0?w=1200&h=400&fit=crop'
  }
];

function EventBanner() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const intervalRef = useRef(null);

  // 자동 슬라이드 (3초마다)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 3000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // 터치 시작
  const handleTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  // 터치 종료
  const handleTouchEnd = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
    handleSwipe();
  };

  // 스와이프 처리
  const handleSwipe = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // 왼쪽으로 스와이프 (다음 배너)
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, 3000);
    }

    if (isRightSwipe) {
      // 오른쪽으로 스와이프 (이전 배너)
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
      }, 3000);
    }

    setTouchStart(null);
    setTouchEnd(null);
  };

  // 인디케이터 클릭
  const handleIndicatorClick = (index) => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCurrentIndex(index);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 3000);
  };

  // 배너 클릭 핸들러
  const handleBannerClick = (bannerId) => {
    navigate(`/event/${bannerId}`);
  };


  // 이전 배너로 이동
  const goToPrevious = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCurrentIndex((prevIndex) => (prevIndex - 1 + banners.length) % banners.length);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 3000);
  };

  // 다음 배너로 이동
  const goToNext = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    intervalRef.current = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 3000);
  };

  return (
    <div className="event-banner-container">
      <div className="banner-layout">
        {/* 배너 영역 */}
        <div 
          className="banner-main-section"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          {/* 이전 버튼 */}
          <button 
            className="banner-nav-button banner-nav-prev"
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            aria-label="이전 배너"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>

          {/* 다음 버튼 */}
          <button 
            className="banner-nav-button banner-nav-next"
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            aria-label="다음 배너"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>

          <div 
            className="event-banner-wrapper"
            style={{ transform: `translateX(-${currentIndex * 100}%)` }}
          >
            {banners.map((banner) => (
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
                    <button className="banner-button" onClick={(e) => { e.stopPropagation(); handleBannerClick(banner.id); }}>지금 확인하기</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* 인디케이터 */}
          <div className="banner-indicators">
            {banners.map((_, index) => (
              <button
                key={index}
                className={`indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => handleIndicatorClick(index)}
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

