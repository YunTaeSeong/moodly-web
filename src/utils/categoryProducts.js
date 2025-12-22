// 카테고리별 서브카테고리 상품 데이터 (각 서브카테고리당 9개)
// ID 범위: 의류(1000-1799), 가전용품(2000-2799), 푸드(3000-3799), 뷰티(4000-4799), 홈인테리어(5000-5799)

const generateProduct = (id, name, price, imageUrl, description, categoryId, categoryName, details = null) => {
  const originalPrice = Math.round(price * 1.2); // 20% 할인 가정
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100);
  
  return {
    id,
    name,
    price,
    originalPrice,
    discount,
    image: imageUrl,
    description,
    details: details || description + '\n• 프리미엄 품질\n• 빠른 배송\n• 안전한 포장\n• 1년 품질 보증',
    category: categoryName,
    categoryId: categoryId,
    rating: 4.0 + Math.random() * 1.0, // 4.0 ~ 5.0 랜덤
    reviewCount: Math.floor(Math.random() * 500) + 50, // 50 ~ 550 랜덤
    purchaseCount: Math.floor(Math.random() * 2000) + 100, // 100 ~ 2100 랜덤
    subCategory: null // 서브카테고리 정보는 별도로 관리
  };
};

// 의류 카테고리 (1000-1799)
const clothingProducts = {
  '남성의류': [
    generateProduct(1001, '남성 정장 셔츠', 65000, 'https://images.unsplash.com/photo-1594938291221-94f18cbb708b?w=400&h=400&fit=crop', '클래식한 남성 정장 셔츠', 'clothing', '의류', '• 면 100% 소재\n• 드라이 기능\n• 다양한 색상\n• 다양한 사이즈'),
    generateProduct(1002, '남성 청바지', 89000, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop', '슬림핏 남성 청바지', 'clothing', '의류'),
    generateProduct(1003, '남성 후드티', 55000, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop', '편안한 남성 후드티', 'clothing', '의류'),
    generateProduct(1004, '남성 니트', 75000, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop', '따뜻한 남성 니트', 'clothing', '의류'),
    generateProduct(1005, '남성 바지', 69000, 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop', '정장용 남성 바지', 'clothing', '의류'),
    generateProduct(1006, '남성 재킷', 120000, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop', '스타일리시한 남성 재킷', 'clothing', '의류'),
    generateProduct(1007, '남성 코트', 180000, 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=400&fit=crop', '우아한 남성 코트', 'clothing', '의류'),
    generateProduct(1008, '남성 트레이닝복', 95000, 'https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=400&h=400&fit=crop', '편안한 남성 트레이닝복', 'clothing', '의류'),
    generateProduct(1009, '남성 폴로셔츠', 45000, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop', '캐주얼 남성 폴로셔츠', 'clothing', '의류')
  ],
  '여성의류': [
    generateProduct(1010, '여성 원피스', 89000, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop', '우아한 여성 원피스', 'clothing', '의류'),
    generateProduct(1011, '여성 블라우스', 65000, 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop', '세련된 여성 블라우스', 'clothing', '의류'),
    generateProduct(1012, '여성 스커트', 75000, 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400&h=400&fit=crop', '스타일리시한 여성 스커트', 'clothing', '의류'),
    generateProduct(1013, '여성 니트', 85000, 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=400&fit=crop', '따뜻한 여성 니트', 'clothing', '의류'),
    generateProduct(1014, '여성 청바지', 95000, 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=400&fit=crop', '슬림핏 여성 청바지', 'clothing', '의류'),
    generateProduct(1015, '여성 재킷', 130000, 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=400&fit=crop', '트렌디한 여성 재킷', 'clothing', '의류'),
    generateProduct(1016, '여성 코트', 190000, 'https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=400&h=400&fit=crop', '우아한 여성 코트', 'clothing', '의류'),
    generateProduct(1017, '여성 티셔츠', 35000, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop', '베이직 여성 티셔츠', 'clothing', '의류'),
    generateProduct(1018, '여성 후드티', 55000, 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop', '편안한 여성 후드티', 'clothing', '의류')
  ],
  '아동의류': Array.from({ length: 9 }, (_, i) => generateProduct(1020 + i, `아동의류 ${i + 1}`, 25000 + i * 5000, `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&sig=${i}`, `아동의류 ${i + 1}`, 'clothing', '의류')),
  '언더웨어': Array.from({ length: 9 }, (_, i) => generateProduct(1030 + i, `언더웨어 ${i + 1}`, 15000 + i * 5000, `https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop&sig=${i}`, `언더웨어 ${i + 1}`, 'clothing', '의류')),
  '액세서리': Array.from({ length: 9 }, (_, i) => generateProduct(1040 + i, `액세서리 ${i + 1}`, 15000 + i * 10000, `https://images.unsplash.com/photo-1624222247344-550fb60583fd?w=400&h=400&fit=crop&sig=${i}`, `액세서리 ${i + 1}`, 'clothing', '의류')),
  '신발': Array.from({ length: 9 }, (_, i) => generateProduct(1050 + i, `신발 ${i + 1}`, 25000 + i * 15000, `https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop&sig=${i}`, `신발 ${i + 1}`, 'clothing', '의류')),
  '가방': Array.from({ length: 9 }, (_, i) => generateProduct(1060 + i, `가방 ${i + 1}`, 15000 + i * 20000, `https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=400&fit=crop&sig=${i}`, `가방 ${i + 1}`, 'clothing', '의류')),
  '시계': Array.from({ length: 9 }, (_, i) => generateProduct(1070 + i, `시계 ${i + 1}`, 45000 + i * 50000, `https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=400&fit=crop&sig=${i}`, `시계 ${i + 1}`, 'clothing', '의류'))
};

// 가전용품 카테고리 (2000-2799)
const electronicsProducts = {
  'TV/영상가전': [
    generateProduct(2001, '4K UHD TV', 1200000, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop', '55인치 4K UHD TV', 'electronics', '가전용품'),
    generateProduct(2002, 'OLED TV', 2500000, 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&h=400&fit=crop', '65인치 OLED TV', 'electronics', '가전용품'),
    generateProduct(2003, '프로젝터', 450000, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop', '4K 프로젝터', 'electronics', '가전용품'),
    generateProduct(2004, '사운드바', 350000, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop', '프리미엄 사운드바', 'electronics', '가전용품'),
    generateProduct(2005, '홈시어터', 850000, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400&h=400&fit=crop', '5.1채널 홈시어터', 'electronics', '가전용품'),
    generateProduct(2006, '스마트 TV 스탠드', 150000, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop', '조절 가능한 TV 스탠드', 'electronics', '가전용품'),
    generateProduct(2007, 'TV 벽걸이 브라켓', 80000, 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=400&fit=crop', '회전형 벽걸이 브라켓', 'electronics', '가전용품'),
    generateProduct(2008, '스트리밍 디바이스', 120000, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop', '4K 스트리밍 디바이스', 'electronics', '가전용품'),
    generateProduct(2009, '블루레이 플레이어', 250000, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=400&fit=crop', '4K 블루레이 플레이어', 'electronics', '가전용품')
  ],
  '냉장고': Array.from({ length: 9 }, (_, i) => generateProduct(2010 + i, `냉장고 ${i + 1}`, 350000 + i * 250000, `https://images.unsplash.com/photo-1571171637578-41bc2dd41cd2?w=400&h=400&fit=crop&sig=${i}`, `냉장고 ${i + 1}`, 'electronics', '가전용품')),
  '세탁기/건조기': Array.from({ length: 9 }, (_, i) => generateProduct(2020 + i, `세탁기/건조기 ${i + 1}`, 12000 + i * 200000, `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&sig=${i}`, `세탁기/건조기 ${i + 1}`, 'electronics', '가전용품')),
  '청소기': Array.from({ length: 9 }, (_, i) => generateProduct(2030 + i, `청소기 ${i + 1}`, 15000 + i * 50000, `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&sig=${i}`, `청소기 ${i + 1}`, 'electronics', '가전용품')),
  '공기청정기': Array.from({ length: 9 }, (_, i) => generateProduct(2040 + i, `공기청정기 ${i + 1}`, 45000 + i * 50000, `https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop&sig=${i}`, `공기청정기 ${i + 1}`, 'electronics', '가전용품')),
  '에어컨': Array.from({ length: 9 }, (_, i) => generateProduct(2050 + i, `에어컨 ${i + 1}`, 25000 + i * 200000, `https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=400&h=400&fit=crop&sig=${i}`, `에어컨 ${i + 1}`, 'electronics', '가전용품')),
  '주방가전': Array.from({ length: 9 }, (_, i) => generateProduct(2060 + i, `주방가전 ${i + 1}`, 85000 + i * 50000, `https://images.unsplash.com/photo-1556910096-6f5e5ad8bcf4?w=400&h=400&fit=crop&sig=${i}`, `주방가전 ${i + 1}`, 'electronics', '가전용품')),
  '생활가전': Array.from({ length: 9 }, (_, i) => generateProduct(2070 + i, `생활가전 ${i + 1}`, 85000 + i * 25000, `https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop&sig=${i}`, `생활가전 ${i + 1}`, 'electronics', '가전용품'))
};

// 푸드 카테고리 (3000-3799) - 나머지 상품들도 동일한 패턴으로 생성
const foodProducts = {
  '신선식품': Array.from({ length: 9 }, (_, i) => generateProduct(3001 + i, `신선식품 ${i + 1}`, 10000 + i * 5000, `https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop&sig=${i}`, `신선한 식품 ${i + 1}`, 'food', '푸드')),
  '냉동식품': Array.from({ length: 9 }, (_, i) => generateProduct(3010 + i, `냉동식품 ${i + 1}`, 8000 + i * 4000, `https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&h=400&fit=crop&sig=${i}`, `냉동 식품 ${i + 1}`, 'food', '푸드')),
  '간편식': Array.from({ length: 9 }, (_, i) => generateProduct(3020 + i, `간편식 ${i + 1}`, 5000 + i * 3000, `https://images.unsplash.com/photo-1618164436249-4473940d1f5c?w=400&h=400&fit=crop&sig=${i}`, `간편식 ${i + 1}`, 'food', '푸드')),
  '과자/스낵': Array.from({ length: 9 }, (_, i) => generateProduct(3030 + i, `과자/스낵 ${i + 1}`, 3000 + i * 2000, `https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=400&h=400&fit=crop&sig=${i}`, `과자/스낵 ${i + 1}`, 'food', '푸드')),
  '음료': Array.from({ length: 9 }, (_, i) => generateProduct(3040 + i, `음료 ${i + 1}`, 2000 + i * 1000, `https://images.unsplash.com/photo-1551024506-0bccd828d307?w=400&h=400&fit=crop&sig=${i}`, `음료 ${i + 1}`, 'food', '푸드')),
  '커피/차': Array.from({ length: 9 }, (_, i) => generateProduct(3050 + i, `커피/차 ${i + 1}`, 15000 + i * 5000, `https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=400&h=400&fit=crop&sig=${i}`, `커피/차 ${i + 1}`, 'food', '푸드')),
  '건강식품': Array.from({ length: 9 }, (_, i) => generateProduct(3060 + i, `건강식품 ${i + 1}`, 25000 + i * 10000, `https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=400&fit=crop&sig=${i}`, `건강식품 ${i + 1}`, 'food', '푸드')),
  '다이어트식품': Array.from({ length: 9 }, (_, i) => generateProduct(3070 + i, `다이어트식품 ${i + 1}`, 20000 + i * 8000, `https://images.unsplash.com/photo-1603048297172-c92544798d5a?w=400&h=400&fit=crop&sig=${i}`, `다이어트식품 ${i + 1}`, 'food', '푸드'))
};

// 뷰티 카테고리 (4000-4799)
const beautyProducts = {
  '스킨케어': Array.from({ length: 9 }, (_, i) => generateProduct(4001 + i, `스킨케어 ${i + 1}`, 50000 + i * 10000, `https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&h=400&fit=crop&sig=${i}`, `스킨케어 제품 ${i + 1}`, 'beauty', '뷰티')),
  '메이크업': Array.from({ length: 9 }, (_, i) => generateProduct(4010 + i, `메이크업 ${i + 1}`, 30000 + i * 8000, `https://images.unsplash.com/photo-1583241805004-e54e0752c8e5?w=400&h=400&fit=crop&sig=${i}`, `메이크업 제품 ${i + 1}`, 'beauty', '뷰티')),
  '향수': Array.from({ length: 9 }, (_, i) => generateProduct(4020 + i, `향수 ${i + 1}`, 80000 + i * 20000, `https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=400&fit=crop&sig=${i}`, `향수 ${i + 1}`, 'beauty', '뷰티')),
  '헤어케어': Array.from({ length: 9 }, (_, i) => generateProduct(4030 + i, `헤어케어 ${i + 1}`, 25000 + i * 5000, `https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&h=400&fit=crop&sig=${i}`, `헤어케어 제품 ${i + 1}`, 'beauty', '뷰티')),
  '바디케어': Array.from({ length: 9 }, (_, i) => generateProduct(4040 + i, `바디케어 ${i + 1}`, 20000 + i * 4000, `https://images.unsplash.com/photo-1556229010-6c3f2c9ca5f8?w=400&h=400&fit=crop&sig=${i}`, `바디케어 제품 ${i + 1}`, 'beauty', '뷰티')),
  '남성화장품': Array.from({ length: 9 }, (_, i) => generateProduct(4050 + i, `남성화장품 ${i + 1}`, 35000 + i * 7000, `https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop&sig=${i}`, `남성화장품 ${i + 1}`, 'beauty', '뷰티')),
  '네일': Array.from({ length: 9 }, (_, i) => generateProduct(4060 + i, `네일 ${i + 1}`, 15000 + i * 3000, `https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=400&h=400&fit=crop&sig=${i}`, `네일 제품 ${i + 1}`, 'beauty', '뷰티')),
  '선케어': Array.from({ length: 9 }, (_, i) => generateProduct(4070 + i, `선케어 ${i + 1}`, 25000 + i * 5000, `https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=400&h=400&fit=crop&sig=${i}`, `선케어 제품 ${i + 1}`, 'beauty', '뷰티'))
};

// 홈인테리어 카테고리 (5000-5799)
const homeInteriorProducts = {
  '가구': Array.from({ length: 9 }, (_, i) => generateProduct(5001 + i, `가구 ${i + 1}`, 200000 + i * 50000, `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&sig=${i}`, `가구 ${i + 1}`, 'home-interior', '홈인테리어')),
  '침구/커튼': Array.from({ length: 9 }, (_, i) => generateProduct(5010 + i, `침구/커튼 ${i + 1}`, 80000 + i * 20000, `https://images.unsplash.com/photo-1584100936595-c0655cf3c8f0?w=400&h=400&fit=crop&sig=${i}`, `침구/커튼 ${i + 1}`, 'home-interior', '홈인테리어')),
  '조명': Array.from({ length: 9 }, (_, i) => generateProduct(5020 + i, `조명 ${i + 1}`, 50000 + i * 15000, `https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400&h=400&fit=crop&sig=${i}`, `조명 ${i + 1}`, 'home-interior', '홈인테리어')),
  '수납/정리': Array.from({ length: 9 }, (_, i) => generateProduct(5030 + i, `수납/정리 ${i + 1}`, 40000 + i * 10000, `https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400&h=400&fit=crop&sig=${i}`, `수납/정리 ${i + 1}`, 'home-interior', '홈인테리어')),
  '인테리어소품': Array.from({ length: 9 }, (_, i) => generateProduct(5040 + i, `인테리어소품 ${i + 1}`, 30000 + i * 8000, `https://images.unsplash.com/photo-1606800054160-8e3c14e1a0b0?w=400&h=400&fit=crop&sig=${i}`, `인테리어소품 ${i + 1}`, 'home-interior', '홈인테리어')),
  '주방용품': Array.from({ length: 9 }, (_, i) => generateProduct(5050 + i, `주방용품 ${i + 1}`, 25000 + i * 5000, `https://images.unsplash.com/photo-1556910096-6f5e5ad8bcf4?w=400&h=400&fit=crop&sig=${i}`, `주방용품 ${i + 1}`, 'home-interior', '홈인테리어')),
  '욕실용품': Array.from({ length: 9 }, (_, i) => generateProduct(5060 + i, `욕실용품 ${i + 1}`, 35000 + i * 7000, `https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&h=400&fit=crop&sig=${i}`, `욕실용품 ${i + 1}`, 'home-interior', '홈인테리어')),
  '생활용품': Array.from({ length: 9 }, (_, i) => generateProduct(5070 + i, `생활용품 ${i + 1}`, 15000 + i * 3000, `https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&sig=${i}`, `생활용품 ${i + 1}`, 'home-interior', '홈인테리어'))
};

// 카테고리별 메타데이터
const categoryMeta = {
  clothing: { name: '의류', icon: '👕', description: '트렌디한 패션 아이템을 만나보세요' },
  electronics: { name: '가전용품', icon: '📱', description: '최신 기술의 가전제품을 만나보세요' },
  food: { name: '푸드', icon: '🍔', description: '신선하고 건강한 식품을 만나보세요' },
  beauty: { name: '뷰티', icon: '💄', description: '아름다움을 위한 뷰티 제품' },
  'home-interior': { name: '홈인테리어', icon: '🏠', description: '아늑한 공간을 만드는 인테리어 아이템' }
};

// 카테고리별 서브카테고리 상품 데이터 통합
export const getAllCategoryProducts = () => ({
  clothing: { ...categoryMeta.clothing, subCategories: clothingProducts },
  electronics: { ...categoryMeta.electronics, subCategories: electronicsProducts },
  food: { ...categoryMeta.food, subCategories: foodProducts },
  beauty: { ...categoryMeta.beauty, subCategories: beautyProducts },
  'home-interior': { ...categoryMeta['home-interior'], subCategories: homeInteriorProducts }
});

// 특정 카테고리와 서브카테고리의 상품 가져오기
export const getCategoryProducts = (categoryId, subCategoryName = null) => {
  const allProducts = getAllCategoryProducts();
  const category = allProducts[categoryId];
  
  if (!category) return [];
  
  if (subCategoryName) {
    return category.subCategories[subCategoryName] || [];
  }
  
  // 서브카테고리가 지정되지 않으면 모든 서브카테고리의 상품 합치기
  return Object.values(category.subCategories).flat();
};

// ID로 카테고리 상품 가져오기 (ProductDetail에서 사용)
export const getCategoryProductById = (productId) => {
  const allCategories = getAllCategoryProducts();
  const productIdNum = parseInt(productId);
  
  // ID 범위로 카테고리 판단
  let categoryId = null;
  if (productIdNum >= 1000 && productIdNum < 2000) {
    categoryId = 'clothing';
  } else if (productIdNum >= 2000 && productIdNum < 3000) {
    categoryId = 'electronics';
  } else if (productIdNum >= 3000 && productIdNum < 4000) {
    categoryId = 'food';
  } else if (productIdNum >= 4000 && productIdNum < 5000) {
    categoryId = 'beauty';
  } else if (productIdNum >= 5000 && productIdNum < 6000) {
    categoryId = 'home-interior';
  }
  
  if (!categoryId) return null;
  
  const category = allCategories[categoryId];
  if (!category) return null;
  
  // 모든 서브카테고리에서 상품 찾기
  for (const subCategoryProducts of Object.values(category.subCategories)) {
    const product = subCategoryProducts.find(p => p.id === productIdNum);
    if (product) return product;
  }
  
  return null;
};

