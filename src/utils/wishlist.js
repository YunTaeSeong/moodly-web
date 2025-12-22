// 찜한 상품 관리 유틸리티

const WISHLIST_KEY = 'moodly_wishlist';

// 찜한 상품 목록 가져오기
export const getWishlist = () => {
  try {
    const wishlist = localStorage.getItem(WISHLIST_KEY);
    return wishlist ? JSON.parse(wishlist) : [];
  } catch (error) {
    console.error('찜한 상품 목록을 가져오는 중 오류 발생:', error);
    return [];
  }
};

// 찜한 상품 추가
export const addToWishlist = (product) => {
  try {
    const wishlist = getWishlist();
    // 이미 찜한 상품인지 확인
    const exists = wishlist.find(item => item.id === product.id);
    if (!exists) {
      wishlist.push({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        addedAt: new Date().toISOString()
      });
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
    }
    return wishlist;
  } catch (error) {
    console.error('찜한 상품 추가 중 오류 발생:', error);
    return getWishlist();
  }
};

// 찜한 상품 제거
export const removeFromWishlist = (productId) => {
  try {
    const wishlist = getWishlist();
    const filtered = wishlist.filter(item => item.id !== productId);
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(filtered));
    return filtered;
  } catch (error) {
    console.error('찜한 상품 제거 중 오류 발생:', error);
    return getWishlist();
  }
};

// 찜한 상품인지 확인
export const isWishlisted = (productId) => {
  const wishlist = getWishlist();
  return wishlist.some(item => item.id === productId);
};

// 찜한 상품 개수 가져오기
export const getWishlistCount = () => {
  return getWishlist().length;
};

