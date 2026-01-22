import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import EventBanner from './EventBanner';
import HotDeal from './HotDeal';
import TodaySpecial from './TodaySpecial';
import { getAllProducts } from '../utils/api';
import './ProductList.css';

// 인기 상품 fallback 데이터 (API 실패 시 사용 - data.sql의 인기 상품 16개 + 카테고리별 상품들)
// 실제 products 테이블의 모든 상품을 포함 (총 40개 상품)
const fallbackPopularProducts = [
  // 인기 상품 (category_id NULL) - 16개
  { id: 1, name: '스마트폰 케이스', price: 15000, image: 'https://images.unsplash.com/photo-1601972602237-8c79241e468b?w=500&h=500&fit=crop', description: '고급스러운 스마트폰 케이스로 기기를 완벽하게 보호하세요. 얇고 가벼우면서도 강력한 보호 기능을 제공합니다.' },
  { id: 2, name: '무선 이어폰', price: 89000, image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=500&h=500&fit=crop', description: '프리미엄 무선 이어폰으로 최고의 음질을 경험하세요. 노이즈 캔슬링 기능이 탑재되어 있어 어디서나 몰입감 있는 음악 감상을 즐길 수 있습니다.' },
  { id: 3, name: '노트북 스탠드', price: 45000, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop', description: '인체공학적 노트북 스탠드로 편안한 작업 환경을 만들어보세요. 높이와 각도를 자유롭게 조절할 수 있어 목과 어깨의 피로를 줄여줍니다.' },
  { id: 4, name: '블루투스 스피커', price: 120000, image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=500&h=500&fit=crop', description: '고음질 블루투스 스피커로 어디서나 음악을 즐기세요. 강력한 베이스와 선명한 고음으로 콘서트장 같은 몰입감을 선사합니다.' },
  { id: 5, name: '스마트 워치', price: 250000, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&h=500&fit=crop', description: '최신 스마트 워치로 건강과 일상을 관리하세요. 운동 추적부터 알림까지 모든 것을 한 손목에서 처리할 수 있습니다.' },
  { id: 6, name: '무선 마우스', price: 35000, image: 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=500&h=500&fit=crop', description: '에르고노믹 무선 마우스로 장시간 사용해도 편안합니다. 손목의 피로를 줄이고 정밀한 작업을 도와줍니다.' },
  { id: 7, name: 'USB-C 케이블', price: 12000, image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500&h=500&fit=crop', description: '고속 충전 USB-C 케이블로 빠르게 충전하세요. 데이터 전송과 충전을 동시에 지원하는 프리미엄 케이블입니다.' },
  { id: 8, name: '태블릿 거치대', price: 28000, image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=500&h=500&fit=crop', description: '조절 가능한 태블릿 거치대로 다양한 각도에서 사용하세요. 독서부터 영상 시청까지 최적의 각도로 설정할 수 있습니다.' },
  { id: 9, name: '무선 키보드', price: 75000, image: 'https://images.unsplash.com/photo-1587829741301-dc918b0c716f?w=500&h=500&fit=crop', description: '프리미엄 무선 키보드로 편안한 타이핑을 경험하세요. 기계식 키 스위치로 만족스러운 타건감을 제공합니다.' },
  { id: 10, name: '게이밍 마우스패드', price: 25000, image: 'https://images.unsplash.com/photo-1612198188060-c7c2a3b66eae?w=500&h=500&fit=crop', description: '대형 게이밍 마우스패드로 정밀한 조작이 가능합니다. 부드러운 표면으로 마우스 움직임을 정확하게 추적합니다.' },
  { id: 11, name: '웹캠 HD', price: 95000, image: 'https://images.unsplash.com/photo-1587825143138-044a3fa50491?w=500&h=500&fit=crop', description: '고화질 웹캠으로 선명한 영상 통화를 즐기세요. 자동 조명 보정 기능으로 어두운 환경에서도 밝은 화면을 제공합니다.' },
  { id: 12, name: '스탠딩 데스크', price: 180000, image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=500&h=500&fit=crop', description: '전동 스탠딩 데스크로 건강한 업무 환경을 만들어보세요. 앉아서 일하는 시간을 줄이고 건강을 지킬 수 있습니다.' },
  { id: 13, name: 'USB 허브', price: 35000, image: 'https://images.unsplash.com/photo-1625842268584-8f3296236761?w=500&h=500&fit=crop', description: '다중 포트 USB 허브로 여러 기기를 동시에 연결하세요. 고속 데이터 전송을 지원하는 프리미엄 허브입니다.' },
  { id: 14, name: '모니터 스탠드', price: 55000, image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=500&h=500&fit=crop', description: '조절 가능한 모니터 스탠드로 최적의 시야각을 설정하세요. 목과 어깨의 피로를 줄이고 작업 효율을 높여줍니다.' },
  { id: 15, name: '블루투스 어댑터', price: 18000, image: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=500&h=500&fit=crop', description: 'USB 블루투스 어댑터로 기존 PC에 무선 기능을 추가하세요. 간편한 설치로 즉시 사용할 수 있습니다.' },
  { id: 16, name: '노이즈 캔슬링 이어폰', price: 150000, image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&h=500&fit=crop', description: '프리미엄 노이즈 캔슬링 이어폰으로 완벽한 음악 감상을 즐기세요. 외부 소음을 차단하고 최고의 음질을 제공합니다.' },
  // 의류 (category_id = 1) - 6개
  { id: 17, name: '데님 재킷', price: 89000, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&h=500&fit=crop', description: '클래식한 데님 재킷으로 스타일리시한 룩을 완성하세요. 다양한 스타일에 매치하기 좋은 베이직 아이템입니다.' },
  { id: 18, name: '후드티', price: 45000, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500&h=500&fit=crop', description: '편안한 후드티로 일상적인 룩을 연출하세요. 부드러운 소재로 착용감이 뛰어나며 다양한 컬러로 제공됩니다.' },
  { id: 19, name: '슬랙스', price: 65000, image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=500&h=500&fit=crop', description: '정장용 슬랙스로 세련된 비즈니스 룩을 완성하세요. 드레이프감이 뛰어나고 다양한 사이즈로 제공됩니다.' },
  { id: 20, name: '니트 스웨터', price: 75000, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=500&h=500&fit=crop', description: '따뜻한 니트 스웨터로 가을과 겨울을 따뜻하게 보내세요. 부드러운 터치감과 보온성이 뛰어납니다.' },
  { id: 21, name: '트레이닝복 세트', price: 120000, image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=500&h=500&fit=crop', description: '편안한 트레이닝복 세트로 운동과 일상을 모두 대비하세요. 기능성 소재로 땀 흡수와 건조가 빠릅니다.' },
  { id: 22, name: '코트', price: 180000, image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=500&h=500&fit=crop', description: '우아한 롱 코트로 세련된 겨울 룩을 완성하세요. 고급 원단과 정교한 마감으로 오래 입을 수 있는 아이템입니다.' },
  // 가전용품 (category_id = 2) - 6개
  { id: 23, name: '스마트 TV', price: 1200000, image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=500&h=500&fit=crop', description: '4K UHD 스마트 TV로 생생한 화질을 경험하세요. 스마트 기능이 탑재되어 다양한 콘텐츠를 즐길 수 있습니다.' },
  { id: 24, name: '무선 청소기', price: 350000, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500&h=500&fit=crop', description: '강력한 무선 청소기로 깨끗한 집을 만들어보세요. 강력한 흡입력과 긴 배터리 수명으로 효율적인 청소가 가능합니다.' },
  { id: 25, name: '에어프라이어', price: 180000, image: 'https://images.unsplash.com/photo-1556910096-6f5e5ad8bcf4?w=500&h=500&fit=crop', description: '대용량 에어프라이어로 건강한 요리를 즐기세요. 기름 없이도 바삭하고 맛있는 요리를 만들 수 있습니다.' },
  { id: 26, name: '로봇 청소기', price: 450000, image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=500&h=500&fit=crop', description: '스마트 로봇 청소기로 자동으로 깨끗한 집을 유지하세요. 스마트 매핑 기능으로 효율적인 청소 경로를 설정합니다.' },
  { id: 27, name: '공기청정기', price: 320000, image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=500&h=500&fit=crop', description: 'HEPA 필터 공기청정기로 깨끗한 공기를 마시세요. 미세먼지와 유해물질을 효과적으로 제거합니다.' },
  { id: 28, name: '전자레인지', price: 150000, image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=500&h=500&fit=crop', description: '인버터 전자레인지로 빠르고 균일하게 데울 수 있습니다. 다양한 요리 기능으로 활용도가 높습니다.' },
  // 푸드 (category_id = 3) - 6개
  { id: 29, name: '유기농 채소 세트', price: 25000, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&h=500&fit=crop', description: '신선한 유기농 채소 세트로 건강한 식사를 시작하세요. 농약 없이 재배된 신선한 채소를 직접 배송해드립니다.' },
  { id: 30, name: '프리미엄 한우', price: 85000, image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=500&h=500&fit=crop', description: '1등급 한우 세트로 프리미엄 고기를 즐기세요. 최상급 한우를 엄선하여 신선하게 배송해드립니다.' },
  { id: 31, name: '수입 치즈 세트', price: 45000, image: 'https://images.unsplash.com/photo-1618164436249-4473940d1f5c?w=500&h=500&fit=crop', description: '프리미엄 수입 치즈로 다양한 맛을 즐기세요. 세계 각국의 고급 치즈를 엄선하여 구성했습니다.' },
  { id: 32, name: '신선 과일 박스', price: 35000, image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=500&h=500&fit=crop', description: '계절 과일 세트로 달콤한 과일을 즐기세요. 제철 과일을 엄선하여 신선하게 배송해드립니다.' },
  { id: 33, name: '건강 간식 세트', price: 28000, image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=500&h=500&fit=crop', description: '다양한 건강 간식으로 영양을 챙기세요. 천연 재료로 만든 건강한 간식을 구성했습니다.' },
  { id: 34, name: '유기농 꿀', price: 32000, image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500&h=500&fit=crop', description: '천연 유기농 꿀로 건강을 챙기세요. 자연 그대로의 달콤함과 영양을 제공합니다.' },
  // 뷰티 (category_id = 4) - 6개
  { id: 35, name: '스킨케어 세트', price: 120000, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=500&h=500&fit=crop', description: '프리미엄 스킨케어 세트로 건강한 피부를 만들어보세요. 모든 피부 타입에 적합한 완벽한 스킨케어 루틴을 제공합니다.' },
  { id: 36, name: '립스틱 세트', price: 65000, image: 'https://images.unsplash.com/photo-1583241805004-e54e0752c8e5?w=500&h=500&fit=crop', description: '다양한 컬러 립스틱으로 다양한 룩을 연출하세요. 오래 지속되는 발색과 부드러운 발림감을 제공합니다.' },
  { id: 37, name: '향수', price: 150000, image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=500&h=500&fit=crop', description: '프리미엄 향수로 고급스러운 향을 즐기세요. 오래 지속되는 향과 세련된 향조를 제공합니다.' },
  { id: 38, name: '마스크팩 세트', price: 35000, image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=500&h=500&fit=crop', description: '수분 마스크팩 10매로 피부를 촉촉하게 만들어보세요. 다양한 기능의 마스크팩을 구성했습니다.' },
  { id: 39, name: '선크림', price: 28000, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=500&h=500&fit=crop', description: '자외선 차단 선크림으로 피부를 보호하세요. 일상 생활에서 필수적인 자외선 차단을 제공합니다.' },
  { id: 40, name: '에센스', price: 95000, image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=500&h=500&fit=crop', description: '안티에이징 에센스로 젊은 피부를 유지하세요. 집중 케어로 피부 노화를 방지하고 개선합니다.' },
  // 홈인테리어 (category_id = 5) - 6개
  { id: 41, name: '디퓨저 세트', price: 45000, image: 'https://images.unsplash.com/photo-1606800054160-8e3c14e1a0b0?w=500&h=500&fit=crop', description: '아로마 디퓨저로 집안을 향기롭게 만들어보세요. 다양한 아로마 오일과 함께 사용하여 분위기를 연출할 수 있습니다.' },
  { id: 42, name: '쿠션 세트', price: 65000, image: 'https://images.unsplash.com/photo-1584100936595-c0655cf3c8f0?w=500&h=500&fit=crop', description: '편안한 소파 쿠션으로 아늑한 공간을 만들어보세요. 부드러운 소재와 다양한 디자인으로 인테리어를 완성합니다.' },
  { id: 43, name: '조명 램프', price: 85000, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=500&h=500&fit=crop', description: '인테리어 조명으로 아늑한 분위기를 연출하세요. 다양한 조명 모드로 상황에 맞는 분위기를 만들 수 있습니다.' },
  { id: 44, name: '식물 화분 세트', price: 55000, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=500&h=500&fit=crop', description: '공기정화 식물로 건강한 공간을 만들어보세요. 공기 정화 기능이 있는 식물과 예쁜 화분을 구성했습니다.' },
  { id: 45, name: '커튼', price: 120000, image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500&h=500&fit=crop', description: '블랙아웃 커튼으로 편안한 수면을 즐기세요. 빛을 완전히 차단하여 어두운 환경을 만들어줍니다.' },
  { id: 46, name: '러그', price: 180000, image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=500&h=500&fit=crop', description: '프리미엄 러그로 고급스러운 공간을 완성하세요. 부드러운 터치감과 세련된 디자인으로 인테리어를 업그레이드합니다.' }
];

function ProductList() {
  const navigate = useNavigate();
  const [products, setProducts] = useState(fallbackPopularProducts); // 초기값으로 fallback 데이터 사용
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const result = await getAllProducts(); // category_id 없이 전체 상품 조회
        if (result.success && result.data && result.data.length > 0) {
          // API 응답을 프론트엔드 형식으로 변환
          const formattedProducts = result.data.map(product => ({
            id: product.id,
            name: product.name,
            price: product.price ? parseFloat(product.price) : 0,
            image: product.image || '',
            description: product.description || ''
          }));
          setProducts(formattedProducts);
        } else {
          // API 실패 시 fallback 데이터 유지
          setProducts(fallbackPopularProducts);
        }
      } catch (error) {
        console.error('상품 목록 로드 오류:', error);
        // 에러 시 fallback 데이터 유지
        setProducts(fallbackPopularProducts);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="product-list-container">
      <EventBanner />
      <HotDeal />
      <TodaySpecial />
      <h2 className="product-list-title">인기 상품</h2>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>상품을 불러오는 중...</div>
      ) : (
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
      )}
    </div>
  );
}

export default ProductList;

