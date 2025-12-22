// 모든 상품 데이터 통합
export const allProducts = [
  // 인기 상품
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
  // 의류
  { id: 101, name: '데님 재킷', price: 89000, image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop', description: '클래식한 데님 재킷' },
  { id: 102, name: '후드티', price: 45000, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=300&h=300&fit=crop', description: '편안한 후드티' },
  { id: 103, name: '슬랙스', price: 65000, image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&h=300&fit=crop', description: '정장용 슬랙스' },
  { id: 104, name: '니트 스웨터', price: 75000, image: 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=300&h=300&fit=crop', description: '따뜻한 니트 스웨터' },
  { id: 105, name: '트레이닝복 세트', price: 120000, image: 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=300&h=300&fit=crop', description: '편안한 트레이닝복' },
  { id: 106, name: '코트', price: 180000, image: 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=300&h=300&fit=crop', description: '우아한 롱 코트' },
  // 가전용품
  { id: 201, name: '스마트 TV', price: 1200000, image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=300&h=300&fit=crop', description: '4K UHD 스마트 TV' },
  { id: 202, name: '무선 청소기', price: 350000, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=300&fit=crop', description: '강력한 무선 청소기' },
  { id: 203, name: '에어프라이어', price: 180000, image: 'https://images.unsplash.com/photo-1556910096-6f5e5ad8bcf4?w=300&h=300&fit=crop', description: '대용량 에어프라이어' },
  { id: 204, name: '로봇 청소기', price: 450000, image: 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=300&h=300&fit=crop', description: '스마트 로봇 청소기' },
  { id: 205, name: '공기청정기', price: 320000, image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=300&h=300&fit=crop', description: 'HEPA 필터 공기청정기' },
  { id: 206, name: '전자레인지', price: 150000, image: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=300&h=300&fit=crop', description: '인버터 전자레인지' },
  // 푸드
  { id: 301, name: '유기농 채소 세트', price: 25000, image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=300&fit=crop', description: '신선한 유기농 채소' },
  { id: 302, name: '프리미엄 한우', price: 85000, image: 'https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=300&h=300&fit=crop', description: '1등급 한우 세트' },
  { id: 303, name: '수입 치즈 세트', price: 45000, image: 'https://images.unsplash.com/photo-1618164436249-4473940d1f5c?w=300&h=300&fit=crop', description: '프리미엄 수입 치즈' },
  { id: 304, name: '신선 과일 박스', price: 35000, image: 'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=300&h=300&fit=crop', description: '계절 과일 세트' },
  { id: 305, name: '건강 간식 세트', price: 28000, image: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=300&h=300&fit=crop', description: '다양한 건강 간식' },
  { id: 306, name: '유기농 꿀', price: 32000, image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=300&h=300&fit=crop', description: '천연 유기농 꿀' },
  // 뷰티
  { id: 401, name: '스킨케어 세트', price: 120000, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=300&h=300&fit=crop', description: '프리미엄 스킨케어' },
  { id: 402, name: '립스틱 세트', price: 65000, image: 'https://images.unsplash.com/photo-1583241805004-e54e0752c8e5?w=300&h=300&fit=crop', description: '다양한 컬러 립스틱' },
  { id: 403, name: '향수', price: 150000, image: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&h=300&fit=crop', description: '프리미엄 향수' },
  { id: 404, name: '마스크팩 세트', price: 35000, image: 'https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=300&h=300&fit=crop', description: '수분 마스크팩 10매' },
  { id: 405, name: '선크림', price: 28000, image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=300&h=300&fit=crop', description: '자외선 차단 선크림' },
  { id: 406, name: '에센스', price: 95000, image: 'https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=300&h=300&fit=crop', description: '안티에이징 에센스' },
  // 홈인테리어
  { id: 501, name: '디퓨저 세트', price: 45000, image: 'https://images.unsplash.com/photo-1606800054160-8e3c14e1a0b0?w=300&h=300&fit=crop', description: '아로마 디퓨저' },
  { id: 502, name: '쿠션 세트', price: 65000, image: 'https://images.unsplash.com/photo-1584100936595-c0655cf3c8f0?w=300&h=300&fit=crop', description: '편안한 소파 쿠션' },
  { id: 503, name: '조명 램프', price: 85000, image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=300&h=300&fit=crop', description: '인테리어 조명' },
  { id: 504, name: '식물 화분 세트', price: 55000, image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=300&h=300&fit=crop', description: '공기정화 식물' },
  { id: 505, name: '커튼', price: 120000, image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&h=300&fit=crop', description: '블랙아웃 커튼' },
  { id: 506, name: '러그', price: 180000, image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=300&h=300&fit=crop', description: '프리미엄 러그' }
];

