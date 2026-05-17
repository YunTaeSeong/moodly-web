/**
 * HOT TREND 카테고리별 섹션 메타
 * backendId = DB category_id (카테고리 상세 페이지와 동일)
 * hotKeywords = 서브카테고리 6개 (클릭 시 해당 서브카테고리 필터로 이동)
 */
export const TREND_CATEGORY_BLOCKS = [
  {
    backendId: 1,
    routePath: 'clothing',
    title: '의류',
    accent: '#e91e8c',
    hotKeywords: [
      { label: '남성의류', subCategory: '남성의류' },
      { label: '여성의류', subCategory: '여성의류' },
      { label: '아동의류', subCategory: '아동의류' },
      { label: '신발', subCategory: '신발' },
      { label: '가방', subCategory: '가방' },
      { label: '액세서리', subCategory: '액세서리' },
    ],
    bannerSlides: [
      {
        image:
          'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop',
        line1: '심플 시즌 신상 ~40%',
        line2: '데일리로 입기 좋은 아이템',
      },
      {
        image:
          'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?q=80&w=1200&auto=format&fit=crop',
        line1: '스타일 위크',
        line2: '트렌디한 실루엣을 만나보세요',
      },
    ],
  },
  {
    backendId: 2,
    routePath: 'electronics',
    title: '가전·디지털',
    accent: '#1976d2',
    hotKeywords: [
      { label: 'TV/영상가전', subCategory: 'TV/영상가전' },
      { label: '냉장고', subCategory: '냉장고' },
      { label: '세탁기/건조기', subCategory: '세탁기/건조기' },
      { label: '청소기', subCategory: '청소기' },
      { label: '공기청정기', subCategory: '공기청정기' },
      { label: '주방가전', subCategory: '주방가전' },
    ],
    bannerSlides: [
      {
        image:
          'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?q=80&w=1200&auto=format&fit=crop',
        line1: '스마트 홈 위크',
        line2: '생활을 바꾸는 가전 모음',
      },
      {
        image:
          'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?q=80&w=1200&auto=format&fit=crop',
        line1: '프리미엄 사운드',
        line2: '몰입감 있는 음향 기기',
      },
    ],
  },
  {
    backendId: 3,
    routePath: 'food',
    title: '푸드',
    accent: '#2e7d32',
    hotKeywords: [
      { label: '신선식품', subCategory: '신선식품' },
      { label: '냉동식품', subCategory: '냉동식품' },
      { label: '간편식', subCategory: '간편식' },
      { label: '과자/스낵', subCategory: '과자/스낵' },
      { label: '음료', subCategory: '음료' },
      { label: '건강식품', subCategory: '건강식품' },
    ],
    bannerSlides: [
      {
        image:
          'https://images.unsplash.com/photo-1542838132-92c53300491e?q=80&w=1200&auto=format&fit=crop',
        line1: '오늘의 신선 배송',
        line2: '테이블까지 정성 가득',
      },
      {
        image:
          'https://images.unsplash.com/photo-1603048297172-c92544798d5a?q=80&w=1200&auto=format&fit=crop',
        line1: '프리미엄 식재료',
        line2: '특별한 날을 위한 한 상',
      },
    ],
  },
  {
    backendId: 4,
    routePath: 'beauty',
    title: '뷰티',
    accent: '#c2185b',
    hotKeywords: [
      { label: '스킨케어', subCategory: '스킨케어' },
      { label: '메이크업', subCategory: '메이크업' },
      { label: '향수', subCategory: '향수' },
      { label: '헤어케어', subCategory: '헤어케어' },
      { label: '바디케어', subCategory: '바디케어' },
      { label: '선케어', subCategory: '선케어' },
    ],
    bannerSlides: [
      {
        image:
          'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?q=80&w=1200&auto=format&fit=crop',
        line1: '기초 케어 ~35%',
        line2: '건강한 피부의 시작',
      },
      {
        image:
          'https://images.unsplash.com/photo-1541643600914-78b084683601?q=80&w=1200&auto=format&fit=crop',
        line1: '데일리 메이크업',
        line2: '자연스러운 컬러 제안',
      },
    ],
  },
  {
    backendId: 5,
    routePath: 'home-interior',
    title: '홈인테리어',
    accent: '#6a1b9a',
    hotKeywords: [
      { label: '가구', subCategory: '가구' },
      { label: '침구/커튼', subCategory: '침구/커튼' },
      { label: '조명', subCategory: '조명' },
      { label: '수납/정리', subCategory: '수납/정리' },
      { label: '인테리어소품', subCategory: '인테리어소품' },
      { label: '주방용품', subCategory: '주방용품' },
    ],
    bannerSlides: [
      {
        image:
          'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=1200&auto=format&fit=crop',
        line1: '리빙 스타일링',
        line2: '아늑한 공간을 완성하세요',
      },
      {
        image:
          'https://images.unsplash.com/photo-1556911220-bff31c812dba?q=80&w=1200&auto=format&fit=crop',
        line1: '무드 조명 특가',
        line2: '분위기를 바꾸는 한 스푼',
      },
    ],
  },
];
