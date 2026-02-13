// API 호출 유틸리티
import { getAccessToken } from './token';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8082';
const PRODUCT_API_BASE_URL = process.env.REACT_APP_PRODUCT_API_BASE_URL || 'http://localhost:8083';
const CART_API_BASE_URL = process.env.REACT_APP_CART_API_BASE_URL || 'http://localhost:8084';
const NOTIFICATION_API_BASE_URL = process.env.REACT_APP_NOTIFICATION_API_BASE_URL || 'http://localhost:8086';

// API 호출 기본 함수
export const apiCall = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    method: 'GET', // 기본값은 GET
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // options에서 method와 body를 명시적으로 추출
  const method = options.method || defaultOptions.method;
  const body = options.body || null;

  const config = {
    method: method, // 명시적으로 method 설정
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  // body가 있으면 추가 (GET 요청이 아닐 때만)
  if (body && method !== 'GET') {
    config.body = body;
  }

  try {
    console.log('API 호출:', url, 'Method:', method, 'Body:', body, 'Config:', config);
    const response = await fetch(url, config);
    
    console.log('응답 상태:', response.status, response.statusText);
    
    if (!response.ok) {
      let errorData = {};
      try {
        const text = await response.text();
        console.log('에러 응답 본문:', text);
        errorData = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('에러 응답 파싱 실패:', e);
      }
      
      throw {
        status: response.status,
        message: errorData.message || errorData.error || `요청에 실패했습니다. (${response.status})`,
        data: errorData
      };
    }

    // 204 No Content 응답 처리
    if (response.status === 204) {
      console.log('204 No Content 응답');
      return null;
    }

    // 응답 본문이 있는 경우에만 JSON 파싱
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      if (text && text.trim()) {
        try {
          const data = JSON.parse(text);
          console.log('응답 데이터:', data);
          return data;
        } catch (parseError) {
          console.error('JSON 파싱 오류:', parseError);
          return null;
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error('API 호출 에러:', error);
    console.error('에러 타입:', error.constructor.name);
    console.error('에러 메시지:', error.message);
    
    if (error.status) {
      throw error;
    }
    
    // 네트워크 오류 또는 CORS 오류
    let errorMessage = '네트워크 오류가 발생했습니다.';
    
    if (error.message && error.message.includes('Failed to fetch')) {
      errorMessage = '서버에 연결할 수 없습니다. 백엔드 서버(http://localhost:8082)가 실행 중인지 확인해주세요.';
    } else if (error.message && error.message.includes('CORS')) {
      errorMessage = 'CORS 오류가 발생했습니다. 서버의 CORS 설정을 확인해주세요.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    throw {
      status: 0,
      message: errorMessage,
      data: null,
      originalError: error
    };
  }
};

// 회원가입 API 호출
export const registerUser = async (userData) => {
  try {
    const response = await apiCall('/user/register', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        rePassword: userData.rePassword,
        name: userData.name,
        phoneNumber: userData.phoneNumber
      }),
    });
    
    return { success: true, data: response };
  } catch (error) {
    return { 
      success: false, 
      message: error.message || '회원가입에 실패했습니다.',
      status: error.status
    };
  }
};

// 아이디 찾기 - 인증코드 요청
export const requestFindId = async (name, phoneNumber) => {
  try {
    const response = await apiCall('/user/find-id/request', {
      method: 'POST',
      body: JSON.stringify({
        name: name,
        phoneNumber: phoneNumber
      }),
    });
    
    return { 
      success: true, 
      maskedEmail: response.maskedEmail 
    };
  } catch (error) {
    return { 
      success: false, 
      message: error.message || '아이디 찾기에 실패했습니다.',
      status: error.status
    };
  }
};

// 이메일 마스킹 함수 (백엔드 EmailMasking과 동일한 로직)
const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.split('@');
  
  if (local.length <= 2) {
    return local.charAt(0) + '*' + '@' + domain;
  }
  
  const prefix = local.substring(0, 2);
  const mask = '*'.repeat(local.length - 2);
  return prefix + mask + '@' + domain;
};

// 아이디 찾기 - 인증코드 확인
export const confirmFindId = async (code, phoneNumber) => {
  try {
    const response = await apiCall('/user/find-id/confirm', {
      method: 'POST',
      body: JSON.stringify({
        code: code,
        phoneNumber: phoneNumber
      }),
    });
    
    // 백엔드에서 반환된 이메일을 마스킹 처리
    const maskedEmail = maskEmail(response.maskedEmail);
    
    return { 
      success: true, 
      maskedEmail: maskedEmail
    };
  } catch (error) {
    let errorMessage = '올바르지 않은 코드입니다.';
    
    if (error.status === 400 || error.status === 404) {
      errorMessage = '올바르지 않은 코드입니다.';
    } else if (error.message && !error.message.includes('요청에 실패했습니다')) {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      message: errorMessage,
      status: error.status
    };
  }
};

// 비밀번호 재설정 요청 (이메일로 링크 발송)
export const requestPasswordReset = async (email) => {
  try {
    const response = await apiCall('/user/password/reset/request', {
      method: 'POST',
      body: JSON.stringify({
        userId: null, // 백엔드에서 email로 사용자를 찾으므로 null
        email: email
      }),
    });
    
    // 204 No Content 응답은 성공으로 처리
    // 백엔드에서 사용자를 찾지 못해도 204를 반환하므로,
    // 보안을 위해 항상 성공 메시지를 표시
    return { 
      success: true
    };
  } catch (error) {
    let errorMessage = '올바르지 않은 이메일입니다.';
    
    if (error.status === 400) {
      errorMessage = '올바르지 않은 이메일입니다.';
    } else if (error.status === 404) {
      errorMessage = '올바르지 않은 이메일입니다.';
    } else if (error.message && error.message.includes('Unexpected end of JSON')) {
      // 204 응답 처리 중 발생한 JSON 파싱 에러는 성공으로 처리
      return { success: true };
    } else if (error.message && !error.message.includes('요청에 실패했습니다')) {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      message: errorMessage,
      status: error.status
    };
  }
};

// 비밀번호 재설정 확인 (토큰으로 비밀번호 변경)
export const confirmPasswordReset = async (token, newPassword, rePassword) => {
  try {
    await apiCall('/user/password/reset/confirm', {
      method: 'POST',
      body: JSON.stringify({
        token: token,
        newPassword: newPassword,
        rePassword: rePassword
      }),
    });
    
    return { 
      success: true
    };
  } catch (error) {
    let errorMessage = '비밀번호 재설정에 실패했습니다.';
    
    if (error.status === 400) {
      errorMessage = '비밀번호가 일치하지 않습니다.';
    } else if (error.status === 404 || error.status === 410) {
      errorMessage = '링크가 만료되었거나 유효하지 않습니다.';
    } else if (error.message && !error.message.includes('요청에 실패했습니다')) {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      message: errorMessage,
      status: error.status
    };
  }
};

// 비밀번호 변경 (마이페이지 -> 보안설정)
export const changeMyPassword = async (userId, currentPassword, newPassword, newPasswordConfirm) => {
  try {
    await apiCall('/user/mypage/security/changePassword', {
      method: 'PATCH',
      body: JSON.stringify({
        userId: userId,
        currentPassword: currentPassword,
        newPassword: newPassword,
        newPasswordConfirm: newPasswordConfirm
      }),
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    });
    
    return { 
      success: true
    };
  } catch (error) {
    let errorMessage = '비밀번호 변경에 실패했습니다.';
    
    if (error.status === 400) {
      errorMessage = '현재 비밀번호가 일치하지 않거나, 새 비밀번호가 일치하지 않습니다.';
    } else if (error.status === 401) {
      errorMessage = '인증이 필요합니다. 다시 로그인해주세요.';
    } else if (error.message && !error.message.includes('요청에 실패했습니다')) {
      errorMessage = error.message;
    }
    
    return { 
      success: false, 
      message: errorMessage,
      status: error.status
    };
  }
};

// 상품 검색 (자동완성용)
export const searchProducts = async (keyword) => {
  try {
    if (!keyword || keyword.trim() === '') {
      return { success: true, data: [] };
    }

    const response = await fetch(`${PRODUCT_API_BASE_URL}/product/search?keyword=${encodeURIComponent(keyword.trim())}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: true, data: [] }; // 에러 시 빈 배열 반환
    }

    const data = await response.json();
    return { 
      success: true, 
      data: data || [] 
    };
  } catch (error) {
    console.error('상품 검색 오류:', error);
    return { 
      success: true, 
      data: [] // 에러 시 빈 배열 반환
    };
  }
};

// 상품 목록 조회 (전체 또는 카테고리별)
export const getAllProducts = async (categoryId = null) => {
  try {
    const url = categoryId 
      ? `${PRODUCT_API_BASE_URL}/product?categoryId=${categoryId}`
      : `${PRODUCT_API_BASE_URL}/product`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { 
        success: false, 
        message: '상품 목록 조회에 실패했습니다.',
        status: response.status,
        data: []
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      data: data || []
    };
  } catch (error) {
    console.error('상품 목록 조회 오류:', error);
    return { 
      success: false, 
      message: '상품 목록 조회 중 오류가 발생했습니다.',
      status: 0,
      data: []
    };
  }
};

// 상품 상세 조회
export const getProductById = async (productId) => {
  try {
    const response = await fetch(`${PRODUCT_API_BASE_URL}/product/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { 
          success: false, 
          message: '상품을 찾을 수 없습니다.',
          status: 404
        };
      }
      return { 
        success: false, 
        message: '상품 조회에 실패했습니다.',
        status: response.status
      };
    }

    const data = await response.json();
    return { 
      success: true, 
      data: data
    };
  } catch (error) {
    console.error('상품 조회 오류:', error);
    // 네트워크 오류인지 확인
    if (error.message && error.message.includes('Failed to fetch')) {
      return { 
        success: false, 
        message: '서버에 연결할 수 없습니다. 네트워크 연결을 확인해주세요.',
        status: 0,
        originalError: error
      };
    }
    return { 
      success: false, 
      message: '상품 정보를 불러오는 중 오류가 발생했습니다.',
      status: 0,
      originalError: error
    };
  }
};

// 오늘의 핫딜 상품 조회
export const getHotDealProducts = async (limit = 10) => {
  try {
    const response = await fetch(`${PRODUCT_API_BASE_URL}/product/hot-deal?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: '핫딜 상품 조회에 실패했습니다.',
        status: response.status,
        data: []
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('핫딜 상품 조회 오류:', error);
    return {
      success: false,
      message: '네트워크 오류 또는 서버 연결 실패.',
      status: 0,
      data: []
    };
  }
};

// 오늘의 특가 상품 조회
export const getTodaySpecialProducts = async (limit = 10) => {
  try {
    const response = await fetch(`${PRODUCT_API_BASE_URL}/product/today-special?limit=${limit}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return {
        success: false,
        message: '특가 상품 조회에 실패했습니다.',
        status: response.status,
        data: []
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('특가 상품 조회 오류:', error);
    return {
      success: false,
      message: '네트워크 오류 또는 서버 연결 실패.',
      status: 0,
      data: []
    };
  }
};

// 장바구니 추가
export const addToCart = async (productId, quantity = 1) => {
  try {
    const token = getAccessToken();
    if (!token) {
      return {
        success: false,
        message: '로그인이 필요합니다.',
        status: 401
      };
    }

    const response = await fetch(`${CART_API_BASE_URL}/cart`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        productId: productId,
        quantity: quantity
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || '장바구니 추가에 실패했습니다.',
        status: response.status
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  } catch (error) {
    console.error('장바구니 추가 오류:', error);
    return {
      success: false,
      message: '네트워크 오류 또는 서버 연결 실패.',
      status: 0,
      originalError: error
    };
  }
};

// 장바구니 조회
export const getCartItems = async () => {
  try {
    const token = getAccessToken();
    if (!token) {
      return {
        success: false,
        message: '로그인이 필요합니다.',
        status: 401,
        data: []
      };
    }

    const response = await fetch(`${CART_API_BASE_URL}/cart`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return {
        success: false,
        message: '장바구니 조회에 실패했습니다.',
        status: response.status,
        data: []
      };
    }

    const data = await response.json();
    return {
      success: true,
      data: data || []
    };
  } catch (error) {
    console.error('장바구니 조회 오류:', error);
    return {
      success: false,
      message: '네트워크 오류 또는 서버 연결 실패.',
      status: 0,
      data: []
    };
  }
};

// 장바구니 수량 변경
export const updateCartQuantity = async (cartId, quantity) => {
  try {
    const token = getAccessToken();
    if (!token) {
      return {
        success: false,
        message: '로그인이 필요합니다.',
        status: 401
      };
    }

    const response = await fetch(`${CART_API_BASE_URL}/cart/${cartId}/quantity?quantity=${quantity}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || '수량 변경에 실패했습니다.',
        status: response.status
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('수량 변경 오류:', error);
    return {
      success: false,
      message: '네트워크 오류 또는 서버 연결 실패.',
      status: 0,
      originalError: error
    };
  }
};

// 장바구니 삭제
export const deleteCartItem = async (cartId) => {
  try {
    const token = getAccessToken();
    if (!token) {
      return {
        success: false,
        message: '로그인이 필요합니다.',
        status: 401
      };
    }

    const response = await fetch(`${CART_API_BASE_URL}/cart/${cartId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || '장바구니 삭제에 실패했습니다.',
        status: response.status
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('장바구니 삭제 오류:', error);
    return {
      success: false,
      message: '네트워크 오류 또는 서버 연결 실패.',
      status: 0,
      originalError: error
    };
  }
};

// 체크박스 선택/해제
export const updateCartChecked = async (cartId, checked) => {
  try {
    const token = getAccessToken();
    if (!token) {
      return {
        success: false,
        message: '로그인이 필요합니다.',
        status: 401
      };
    }

    const response = await fetch(`${CART_API_BASE_URL}/cart/${cartId}/checked`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ checked })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || '체크박스 업데이트에 실패했습니다.',
        status: response.status
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('체크박스 업데이트 오류:', error);
    return {
      success: false,
      message: '네트워크 오류 또는 서버 연결 실패.',
      status: 0,
      originalError: error
    };
  }
};

// 전체 선택/해제
export const updateAllCartChecked = async (checked) => {
  try {
    const token = getAccessToken();
    if (!token) {
      return {
        success: false,
        message: '로그인이 필요합니다.',
        status: 401
      };
    }

    const response = await fetch(`${CART_API_BASE_URL}/cart/checked/all?checked=${checked}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || '전체 선택/해제에 실패했습니다.',
        status: response.status
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('전체 선택/해제 오류:', error);
    return {
      success: false,
      message: '네트워크 오류 또는 서버 연결 실패.',
      status: 0,
      originalError: error
    };
  }
};

// 선택된 상품 일괄 삭제
export const deleteSelectedCartItems = async (cartIds) => {
  try {
    const token = getAccessToken();
    if (!token) {
      return {
        success: false,
        message: '로그인이 필요합니다.',
        status: 401
      };
    }

    const response = await fetch(`${CART_API_BASE_URL}/cart/selected`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ cartIds })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || '선택된 상품 삭제에 실패했습니다.',
        status: response.status
      };
    }

    return {
      success: true
    };
  } catch (error) {
    console.error('선택된 상품 삭제 오류:', error);
    return {
      success: false,
      message: '네트워크 오류 또는 서버 연결 실패.',
      status: 0,
      originalError: error
    };
  }
};

// ========== 찜(wishlist) API - product-service, Gateway 경유 ==========
/** 백엔드 에러 응답에서 메시지 추출 (common-core ErrorResponse: body.message) */
const getErrorMessage = (errorData, fallback) => {
  if (!errorData) return fallback;
  const msg = errorData.body?.message ?? errorData.message ?? errorData.error;
  return (typeof msg === 'string' && msg.trim()) ? msg : fallback;
};

/** 찜 추가 (로그인 필요, DB 저장) - product-service 직접 호출 */
export const addWishlistItem = async (productId) => {
  try {
    const token = getAccessToken();
    if (!token) {
      return { success: false, message: '로그인이 필요합니다.', status: 401 };
    }
    const response = await fetch(`${PRODUCT_API_BASE_URL}/wishlist/${productId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ productId: Number(productId) })
    });
    let body = {};
    try {
      body = await response.json();
    } catch {
      body = {};
    }
    if (!response.ok) {
      const message = getErrorMessage(body, '찜 추가에 실패했습니다.');
      return {
        success: false,
        message,
        status: response.status,
        alreadyExists: response.status === 409
      };
    }
    return { success: true, data: body };
  } catch (error) {
    console.error('찜 추가 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0 };
  }
};

/** 찜 단건 조회 - product-service 직접 호출 */
export const getWishlistItem = async (productId) => {
  try {
    const token = getAccessToken();
    if (!token) {
      return { success: false, message: '로그인이 필요합니다.', status: 401 };
    }
    const response = await fetch(`${PRODUCT_API_BASE_URL}/wishlist/${productId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const errorData = await response.json().catch(() => ({}));
    if (response.status === 409) {
      // 서버 기준 찜하지 않은 상태
      return { success: false, status: 409, notExists: true };
    }
    if (!response.ok) {
      const message = getErrorMessage(errorData, '찜 상태 조회에 실패했습니다.');
      return { success: false, message, status: response.status };
    }
    return { success: true, data: errorData };
  } catch (error) {
    console.error('찜 상태 조회 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0 };
  }
};

/** 찜 전체 조회 - product-service 직접 호출 */
export const getWishlistItems = async () => {
  try {
    const token = getAccessToken();
    if (!token) {
      return { success: false, message: '로그인이 필요합니다.', status: 401 };
    }
    const response = await fetch(`${PRODUCT_API_BASE_URL}/wishlist/all`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    const errorData = await response.json().catch(() => ([]));
    if (response.status === 409) {
      // 찜 목록 없음
      return { success: true, data: [] };
    }
    if (!response.ok) {
      const message = getErrorMessage(errorData, '찜 목록 조회에 실패했습니다.');
      return { success: false, message, status: response.status };
    }
    return { success: true, data: errorData || [] };
  } catch (error) {
    console.error('찜 목록 조회 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0 };
  }
};

/** 찜 삭제 - product-service 직접 호출 */
export const removeWishlistItem = async (productId) => {
  try {
    const token = getAccessToken();
    if (!token) {
      return { success: false, message: '로그인이 필요합니다.', status: 401 };
    }
    const response = await fetch(`${PRODUCT_API_BASE_URL}/wishlist/${productId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    let errorData = {};
    try {
      errorData = await response.json();
    } catch {
      errorData = {};
    }
    if (response.status === 409) {
      // 이미 없는 경우도 성공으로 취급
      return { success: true, notExists: true };
    }
    if (!response.ok) {
      const message = getErrorMessage(errorData, '찜 삭제에 실패했습니다.');
      return { success: false, message, status: response.status };
    }
    return { success: true };
  } catch (error) {
    console.error('찜 삭제 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0 };
  }
};

// ========== 상품 문의 API (product-service) ==========
const mapInquiryFromApi = (item) => {
  if (!item) return null;
  const status = item.status === 'COMPLETED' ? '답변완료' : '답변대기';
  return {
    id: item.id,
    productId: item.productId,
    userId: item.userId,
    content: item.content,
    status,
    reply: item.reply || null,
    replyDate: item.replyDate || null,
    replyId: item.replyId,
    replyName: item.replyName,
    createdDate: item.createdDate,
    lastModifiedDate: item.lastModifiedDate,
    createdAt: item.createdDate,
    author: '회원'
  };
};

/** 상품 문의 등록 (로그인 필요) */
export const createProductInquiryApi = async (productId, content) => {
  try {
    const token = getAccessToken();
    if (!token) return { success: false, message: '로그인이 필요합니다.', status: 401 };
    const response = await fetch(`${PRODUCT_API_BASE_URL}/product/inquiry/${productId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content: content.trim() })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, message: getErrorMessage(data, '문의 등록에 실패했습니다.'), status: response.status };
    return { success: true, data: mapInquiryFromApi(data) };
  } catch (e) {
    console.error('상품 문의 등록 오류:', e);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0 };
  }
};

/** 상품 문의 목록 조회 (본인 문의만, productId 있으면 해당 상품만) */
export const getProductInquiriesApi = async ({ productId, status, content, page = 0, size = 20 } = {}) => {
  try {
    const token = getAccessToken();
    if (!token) return { success: false, message: '로그인이 필요합니다.', status: 401 };
    const params = new URLSearchParams();
    if (productId != null) params.set('productId', productId);
    if (status) params.set('status', status);
    if (content) params.set('content', content);
    params.set('page', String(page));
    params.set('size', String(size));
    const response = await fetch(`${PRODUCT_API_BASE_URL}/product/inquiry/all?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, message: getErrorMessage(data, '문의 목록 조회에 실패했습니다.'), status: response.status };
    const list = (data.content || []).map(mapInquiryFromApi);
    return { success: true, data: list, totalElements: data.totalElements ?? list.length, totalPages: data.totalPages ?? 1 };
  } catch (e) {
    console.error('상품 문의 목록 조회 오류:', e);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0 };
  }
};

/** 상품 문의 수정 (본인 글만, 답변 전만) */
export const updateProductInquiryApi = async (inquiryId, content) => {
  try {
    const token = getAccessToken();
    if (!token) return { success: false, message: '로그인이 필요합니다.', status: 401 };
    const response = await fetch(`${PRODUCT_API_BASE_URL}/product/inquiry/${inquiryId}/update`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content: content.trim() })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, message: getErrorMessage(data, '문의 수정에 실패했습니다.'), status: response.status };
    return { success: true, data: mapInquiryFromApi(data) };
  } catch (e) {
    console.error('상품 문의 수정 오류:', e);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0 };
  }
};

/** 상품 문의 삭제 (본인 글만, 답변 전만) */
export const deleteProductInquiryApi = async (inquiryId) => {
  try {
    const token = getAccessToken();
    if (!token) return { success: false, message: '로그인이 필요합니다.', status: 401 };
    const response = await fetch(`${PRODUCT_API_BASE_URL}/product/inquiry/${inquiryId}/delete`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 204 || response.ok) return { success: true };
    const data = await response.json().catch(() => ({}));
    return { success: false, message: getErrorMessage(data, '문의 삭제에 실패했습니다.'), status: response.status };
  } catch (e) {
    console.error('상품 문의 삭제 오류:', e);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0 };
  }
};

/** 관리자: 상품 문의 목록 (페이징/필터) */
export const getAdminProductInquiriesApi = async ({ productId, status, content, page = 0, size = 20 } = {}) => {
  try {
    const token = getAccessToken();
    if (!token) return { success: false, message: '로그인이 필요합니다.', status: 401 };
    const params = new URLSearchParams();
    if (productId != null) params.set('productId', productId);
    if (status) params.set('status', status);
    if (content) params.set('content', content);
    params.set('page', String(page));
    params.set('size', String(size));
    const response = await fetch(`${PRODUCT_API_BASE_URL}/internal/product/inquiry?${params}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, message: getErrorMessage(data, '문의 목록 조회에 실패했습니다.'), status: response.status };
    const list = (Array.isArray(data) ? data : (data.content || [])).map(mapInquiryFromApi);
    return { success: true, data: list, totalElements: data.totalElements ?? list.length, totalPages: data.totalPages ?? 1 };
  } catch (e) {
    console.error('관리자 문의 목록 오류:', e);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0 };
  }
};

/** 관리자: 문의 답변 등록 (상태 COMPLETED) */
export const adminReplyProductInquiryApi = async (inquiryId, reply) => {
  try {
    const token = getAccessToken();
    if (!token) return { success: false, message: '로그인이 필요합니다.', status: 401 };
    const response = await fetch(`${PRODUCT_API_BASE_URL}/internal/product/inquiry/${inquiryId}/reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ reply: reply.trim() })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, message: getErrorMessage(data, '답변 등록에 실패했습니다.'), status: response.status };
    return { success: true, data: mapInquiryFromApi(data) };
  } catch (e) {
    console.error('관리자 답변 등록 오류:', e);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0 };
  }
};

/** 관리자: 문의 수정 */
export const adminUpdateProductInquiryApi = async (inquiryId, content) => {
  try {
    const token = getAccessToken();
    if (!token) return { success: false, message: '로그인이 필요합니다.', status: 401 };
    const response = await fetch(`${PRODUCT_API_BASE_URL}/internal/product/inquiry/${inquiryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ content: content.trim() })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { success: false, message: getErrorMessage(data, '문의 수정에 실패했습니다.'), status: response.status };
    return { success: true, data: mapInquiryFromApi(data) };
  } catch (e) {
    console.error('관리자 문의 수정 오류:', e);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0 };
  }
};

/** 관리자: 문의 삭제 */
export const adminDeleteProductInquiryApi = async (inquiryId) => {
  try {
    const token = getAccessToken();
    if (!token) return { success: false, message: '로그인이 필요합니다.', status: 401 };
    const response = await fetch(`${PRODUCT_API_BASE_URL}/internal/product/inquiry/${inquiryId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 204 || response.ok) return { success: true };
    const data = await response.json().catch(() => ({}));
    return { success: false, message: getErrorMessage(data, '문의 삭제에 실패했습니다.'), status: response.status };
  } catch (e) {
    console.error('관리자 문의 삭제 오류:', e);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0 };
  }
};

// 배송지 목록 조회
export const getDeliveryAddresses = async () => {
  try {
    const token = getAccessToken();
    if (!token) {
      return { success: false, message: '로그인이 필요합니다.', status: 401 };
    }

    const response = await fetch(`${API_BASE_URL}/user/delivery-addresses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, message: errorData.message || '배송지 조회에 실패했습니다.', status: response.status };
    }

    const data = await response.json();
    return { success: true, data: data || [] };
  } catch (error) {
    console.error('배송지 조회 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0, originalError: error };
  }
};

// 배송지 생성
export const createDeliveryAddress = async (addressData) => {
  try {
    const token = getAccessToken();
    if (!token) {
      return { success: false, message: '로그인이 필요합니다.', status: 401 };
    }

    const response = await fetch(`${API_BASE_URL}/user/delivery-addresses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(addressData)
    });

    if (!response.ok) {
      let errorData = {};
      try {
        const text = await response.text();
        errorData = text ? JSON.parse(text) : {};
      } catch (e) {
        console.error('에러 응답 파싱 실패:', e);
      }
      
      // 401 또는 403 오류인 경우 명확한 메시지 반환
      if (response.status === 401 || response.status === 403) {
        return { 
          success: false, 
          message: '인증이 만료되었습니다. 다시 로그인해주세요.', 
          status: response.status 
        };
      }
      
      return { 
        success: false, 
        message: errorData.message || errorData.error || '배송지 생성에 실패했습니다.', 
        status: response.status 
      };
    }

    const data = await response.json();
    return { success: true, data: data };
  } catch (error) {
    console.error('배송지 생성 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0, originalError: error };
  }
};

// 배송지 수정
export const updateDeliveryAddress = async (id, addressData) => {
  try {
    const token = getAccessToken();
    if (!token) {
      return { success: false, message: '로그인이 필요합니다.', status: 401 };
    }

    const response = await fetch(`${API_BASE_URL}/user/delivery-addresses/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(addressData)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, message: errorData.message || '배송지 수정에 실패했습니다.', status: response.status };
    }

    const data = await response.json();
    return { success: true, data: data };
  } catch (error) {
    console.error('배송지 수정 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0, originalError: error };
  }
};

// 배송지 삭제
export const deleteDeliveryAddress = async (id) => {
  try {
    const token = getAccessToken();
    if (!token) {
      return { success: false, message: '로그인이 필요합니다.', status: 401 };
    }

    const response = await fetch(`${API_BASE_URL}/user/delivery-addresses/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, message: errorData.message || '배송지 삭제에 실패했습니다.', status: response.status };
    }

    return { success: true };
  } catch (error) {
    console.error('배송지 삭제 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0, originalError: error };
  }
};

// 기본 배송지 설정
export const setDefaultDeliveryAddress = async (id) => {
  try {
    const token = getAccessToken();
    if (!token) {
      return { success: false, message: '로그인이 필요합니다.', status: 401 };
    }

    const response = await fetch(`${API_BASE_URL}/user/delivery-addresses/${id}/default`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, message: errorData.message || '기본 배송지 설정에 실패했습니다.', status: response.status };
    }

    const data = await response.json();
    return { success: true, data: data };
  } catch (error) {
    console.error('기본 배송지 설정 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0, originalError: error };
  }
};

// ============================================
// Notification API
// ============================================

// 알림 목록 조회
export const getNotificationsApi = async (page = 0, size = 20, userId) => {
  try {
    if (!userId) {
      console.warn('[API] getNotificationsApi: userId가 없습니다.');
      return { success: false, message: 'userId가 필요합니다.' };
    }

    const url = `${NOTIFICATION_API_BASE_URL}/notification?page=${page}&size=${size}&userId=${userId}`;
    console.log('[API] 알림 조회 요청:', url);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[API] 알림 조회 응답 상태:', response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] 알림 조회 실패:', errorText);
      const errorData = errorText ? JSON.parse(errorText) : {};
      return { success: false, message: errorData.message || '알림 조회 실패', status: response.status };
    }

    const data = await response.json();
    console.log('[API] 알림 조회 성공:', data);
    return { success: true, data: data };
  } catch (error) {
    console.error('[API] 알림 조회 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0, originalError: error };
  }
};

// 읽지 않은 알림 개수 조회
export const getUnreadNotificationCountApi = async (userId) => {
  try {
    if (!userId) {
      return { success: false, data: 0 };
    }

    const response = await fetch(`${NOTIFICATION_API_BASE_URL}/notification/unread-count?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { success: false, data: 0 };
    }

    const data = await response.json();
    return { success: true, data: data };
  } catch (error) {
    console.error('읽지 않은 알림 개수 조회 오류:', error);
    return { success: false, data: 0 };
  }
};

// 알림 읽음 처리
export const markNotificationAsReadApi = async (notificationId, userId) => {
  try {
    if (!userId) {
      return { success: false, message: 'userId가 필요합니다.' };
    }

    const response = await fetch(`${NOTIFICATION_API_BASE_URL}/notification/${notificationId}/read?userId=${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, message: errorData.message || '알림 읽음 처리 실패', status: response.status };
    }

    return { success: true };
  } catch (error) {
    console.error('알림 읽음 처리 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0, originalError: error };
  }
};

// 모든 알림 읽음 처리
export const markAllNotificationsAsReadApi = async (userId) => {
  try {
    if (!userId) {
      return { success: false, message: 'userId가 필요합니다.' };
    }

    const response = await fetch(`${NOTIFICATION_API_BASE_URL}/notification/read-all?userId=${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return { success: false, message: errorData.message || '모든 알림 읽음 처리 실패', status: response.status };
    }

    return { success: true };
  } catch (error) {
    console.error('모든 알림 읽음 처리 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0, originalError: error };
  }
};
