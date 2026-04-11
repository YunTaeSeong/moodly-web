// API 호출 유틸리티
import { getAccessToken, getRefreshToken } from './token';
import { refreshToken as refreshSessionTokens } from './authApi';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8082';
const PRODUCT_API_BASE_URL = process.env.REACT_APP_PRODUCT_API_BASE_URL || 'http://localhost:8083';
const CART_API_BASE_URL = process.env.REACT_APP_CART_API_BASE_URL || 'http://localhost:8084';
const NOTIFICATION_API_BASE_URL = process.env.REACT_APP_NOTIFICATION_API_BASE_URL || 'http://localhost:8086';
const COUPON_API_BASE_URL = process.env.REACT_APP_COUPON_API_BASE_URL || 'http://localhost:8087';
const ORDER_API_BASE_URL = process.env.REACT_APP_ORDER_API_BASE_URL || 'http://localhost:8085';
const PAYMENT_API_BASE_URL = process.env.REACT_APP_PAYMENT_API_BASE_URL || 'http://localhost:8088';

const UNAUTHORIZED_HINT =
  '액세스 토큰 검증에 실패했습니다. 로그아웃 후 다시 로그인해 보세요. 원인 확인은 order-service(또는 payment-service) 실행 콘솔의 "JWT 검증 실패" 로그(만료·서명 불일치·iss/aud 불일치 등)를 보세요.';

const CART_OWNER_MISMATCH_HINT =
  '선택한 장바구니가 지금 로그인한 계정과 맞지 않습니다. 장바구니 화면으로 가서 목록이 새로고침된 뒤 다시 주문하기를 눌러 주세요. (다른 계정으로 로그인했거나, 예전 탭의 주문 화면을 연 경우 자주 발생합니다.)';

/**
 * GlobalExceptionHandler: { body: { code, message, detail } }
 * JwtAuthenticationFilter: { code, message } (body 없음)
 */
const interpretApiError = (status, err, fallback) => {
  const inner = err?.body && typeof err.body === 'object' ? err.body : err;
  const code = inner?.code;
  const msg = inner?.message;

  if (code === 'NOT_AUTHENTICATED') {
    return {
      message:
        '요청에 유효한 Bearer 토큰이 없거나 인증 단계까지 전달되지 않았습니다. 로그인 상태를 확인하고, 프론트 주소가 order-service CORS에 허용된 출처(localhost:3000 등)와 같은지 확인해 주세요.',
      errorCode: 'NOT_AUTHENTICATED',
    };
  }
  if (code === 'AUTHORIZATION_001' || msg === 'MISSING_AUTHORIZATION') {
    return { message: CART_OWNER_MISMATCH_HINT, errorCode: 'AUTHORIZATION_001' };
  }
  if (code === 'CART_001' || msg === 'CART_NOT_FOUND') {
    return {
      message: '장바구니에서 해당 상품을 찾을 수 없습니다. 장바구니에 다시 담은 후 주문해 주세요.',
      errorCode: 'CART_001',
    };
  }
  if (code === 'INVALID_TOKEN' || msg === 'Unauthorized') {
    return { message: UNAUTHORIZED_HINT, errorCode: code || 'INVALID_TOKEN' };
  }
  if (code === 'JWT_002' || msg === 'INVALID_JWT_TOKEN') {
    return { message: UNAUTHORIZED_HINT, errorCode: code };
  }
  if (status === 401) {
    return { message: UNAUTHORIZED_HINT, errorCode: code || 'HTTP_401' };
  }
  const detail = inner?.detail;
  const text =
    (typeof detail === 'string' && detail) || (typeof msg === 'string' && msg) || '';
  return { message: text || fallback, errorCode: code };
};

const messageForApiFailure = (status, err, fallback) =>
  interpretApiError(status, err, fallback).message;

/**
 * 액세스 토큰 만료 등으로 401이면 refresh 후 동일 요청을 한 번 더 시도합니다.
 * @param {(accessToken: string) => Promise<Response>} requestFn
 * @returns {Promise<Response|null>} 토큰이 전혀 없으면 null
 */
const fetchWithRefreshRetry = async (requestFn) => {
  const first = getAccessToken();
  if (!first) {
    return null;
  }
  let res = await requestFn(first);
  if (res.status === 401 && getRefreshToken()) {
    const rr = await refreshSessionTokens();
    if (rr.success) {
      const second = getAccessToken();
      if (second) {
        res = await requestFn(second);
      }
    }
  }
  return res;
};

/** 배송지 객체 → order-service JSON 문자열 */
export const deliveryAddressToJsonString = (addr) => {
  if (!addr) return '{}';
  return JSON.stringify({
    postcode: addr.postcode || '',
    address: addr.address || '',
    detailAddress: addr.detailAddress || '',
    recipient: addr.recipient || '',
    phoneNumber: addr.phoneNumber || addr.phone || '',
  });
};

/**
 * order-service POST /order — 장바구니 라인 ID 목록 필요
 * @param {object} p
 * @param {number[]} p.cartIds
 * @param {string} p.customerName
 * @param {string} p.customerPhoneNumber
 * @param {object|string} p.deliveryAddress 객체 또는 이미 JSON 문자열
 * @param {number|null} [p.couponId] user_coupons.id
 * @param {number} [p.discountAmount] 쿠폰 할인 금액(원)
 */
export const createServerOrder = async (p) => {
  try {
    if (!getAccessToken()) {
      return { success: false, message: UNAUTHORIZED_HINT, status: 401 };
    }
    const deliveryJson =
      typeof p.deliveryAddress === 'string'
        ? p.deliveryAddress
        : deliveryAddressToJsonString(p.deliveryAddress);

    const body = {
      cartIds: p.cartIds,
      customerName: p.customerName,
      customerPhoneNumber: p.customerPhoneNumber || '',
      deliveryAddress: deliveryJson,
      couponId: p.couponId != null ? p.couponId : null,
      discountAmount: p.discountAmount != null ? p.discountAmount : 0,
    };

    const response = await fetchWithRefreshRetry((token) =>
      fetch(`${ORDER_API_BASE_URL}/order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })
    );

    if (!response) {
      return { success: false, message: UNAUTHORIZED_HINT, status: 401 };
    }

    if (!response.ok) {
      const errText = await response.text();
      let err = {};
      try {
        err = errText ? JSON.parse(errText) : {};
      } catch {
        /* plain text 401 등 */
      }
      if (response.status === 401) {
        console.error('[createServerOrder] POST /order 401 본문:', errText || '(비어 있음)');
      }
      const { message, errorCode } = interpretApiError(
        response.status,
        err,
        '주문 생성에 실패했습니다.'
      );
      return {
        success: false,
        message,
        status: response.status,
        errorCode,
      };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('주문 생성 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0, originalError: error };
  }
};

/**
 * payment-service POST /payment/confirm (Toss 승인 확정)
 */
export const confirmServerPayment = async ({ paymentKey, orderId, amount }) => {
  try {
    if (!getAccessToken()) {
      return { success: false, message: UNAUTHORIZED_HINT, status: 401 };
    }
    const payload = {
      paymentKey,
      orderId,
      amount: Number(amount),
    };
    const response = await fetchWithRefreshRetry((token) =>
      fetch(`${PAYMENT_API_BASE_URL}/payment/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
    );

    if (!response) {
      return { success: false, message: UNAUTHORIZED_HINT, status: 401 };
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        message: messageForApiFailure(
          response.status,
          err,
          '결제 승인에 실패했습니다.'
        ),
        status: response.status,
      };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('결제 승인 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0, originalError: error };
  }
};

/** payment-service POST /payment/cancel (Toss 전액 취소 + 주문 결제취소) */
export const cancelServerPayment = async ({ orderId, cancelReason }) => {
  try {
    if (!getAccessToken()) {
      return { success: false, message: UNAUTHORIZED_HINT, status: 401 };
    }
    const payload = {
      orderId,
      ...(cancelReason ? { cancelReason } : {}),
    };
    const response = await fetchWithRefreshRetry((token) =>
      fetch(`${PAYMENT_API_BASE_URL}/payment/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
    );

    if (!response) {
      return { success: false, message: UNAUTHORIZED_HINT, status: 401 };
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        message: messageForApiFailure(
          response.status,
          err,
          '결제 취소에 실패했습니다.'
        ),
        status: response.status,
      };
    }
    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('결제 취소 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0, originalError: error };
  }
};

/** GET /order/all → 마이페이지용 주문 목록 */
export const fetchServerOrders = async () => {
  try {
    if (!getAccessToken()) {
      return { success: false, message: UNAUTHORIZED_HINT, data: [], status: 401 };
    }
    const response = await fetchWithRefreshRetry((token) =>
      fetch(`${ORDER_API_BASE_URL}/order/all`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })
    );

    if (!response) {
      return { success: false, message: UNAUTHORIZED_HINT, data: [], status: 401 };
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return {
        success: false,
        message: messageForApiFailure(
          response.status,
          err,
          '주문 목록을 불러오지 못했습니다.'
        ),
        data: [],
        status: response.status,
      };
    }
    const list = await response.json();
    return { success: true, data: Array.isArray(list) ? list : [] };
  } catch (error) {
    console.error('주문 목록 조회 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', data: [], status: 0, originalError: error };
  }
};

export const mapServerOrderToMyPageRow = (o) => {
  const items = o.items || [];
  const first = items[0];
  const qtySum = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  let delivery = {};
  try {
    delivery = o.deliveryAddress ? JSON.parse(o.deliveryAddress) : {};
  } catch {
    delivery = {};
  }
  const statusMap = {
    PENDING_PAYMENT: '결제대기',
    PAYMENT_COMPLETED: '결제완료',
    PAYMENT_CANCELLED: '결제취소',
    PREPARING_SHIPMENT: '배송준비',
    SHIPPED: '배송중',
    DELIVERED: '배송완료',
  };
  const created = o.createdDate ? new Date(o.createdDate).toISOString() : new Date().toISOString();
  const est = new Date(new Date(created).getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  const orderName =
    items.length > 1
      ? `${first?.productName || '상품'} 외 ${items.length - 1}건`
      : first?.productName || '상품';

  return {
    id: o.id,
    orderId: o.orderId,
    orderName,
    product: first
      ? {
          id: first.productId,
          name: first.productName,
          price: Number(first.price),
          image: first.productImage,
        }
      : null,
    quantity: qtySum || Number(first?.quantity) || 1,
    amount: Number(o.finalAmount),
    discountAmount: Number(o.discountAmount || 0),
    coupon: o.couponId ? { id: o.couponId, name: '쿠폰 적용' } : null,
    deliveryAddress: {
      postcode: delivery.postcode,
      address: delivery.address,
      detailAddress: delivery.detailAddress,
      recipient: delivery.recipient,
      phone: delivery.phoneNumber,
    },
    status: statusMap[o.status] || o.status,
    orderDate: created,
    estimatedDelivery: est,
    trackingNumber: null,
    _serverStatus: o.status,
  };
};

/** coupon-service UserCouponDetailResponse → 결제/상품 쿠폰 UI용 형식 */
export const mapUserCouponApiToFrontend = (row) => {
  if (!row) return null;
  const discountType = row.discountType === 'FIXED' ? 'fixed' : 'percent';
  const statusMap = { ISSUED: 'received', USED: 'used', EXPIRED: 'expired', CANCELED: 'canceled' };
  let status = statusMap[row.status] || 'received';
  if (row.expiredAt && status === 'received') {
    const exp = new Date(row.expiredAt);
    if (!Number.isNaN(exp.getTime()) && exp < new Date()) status = 'expired';
  }
  return {
    id: row.id,
    userCouponId: row.id,
    couponId: row.couponId,
    name: row.couponName || '쿠폰',
    description: row.couponName && String(row.couponName).includes('신규')
      ? '회원가입을 축하합니다!'
      : '전 상품 적용',
    discount: row.discount != null ? Number(row.discount) : 0,
    discountType,
    minPurchase: row.minPurchase != null ? Number(row.minPurchase) : 0,
    validUntil: row.expiredAt,
    status,
    receivedAt: row.receivedAt,
  };
};

/**
 * 내 쿠폰 목록 (coupon-service GET /coupon)
 */
export const fetchUserCoupons = async () => {
  try {
    const token = getAccessToken();
    if (!token) {
      return { success: false, message: '로그인이 필요합니다.', data: [], status: 401 };
    }
    const response = await fetch(`${COUPON_API_BASE_URL}/coupon`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || errorData.body?.message || '쿠폰 목록을 불러오지 못했습니다.',
        data: [],
        status: response.status,
      };
    }
    const list = await response.json();
    const normalized = (Array.isArray(list) ? list : []).map(mapUserCouponApiToFrontend);
    return { success: true, data: normalized };
  } catch (error) {
    console.error('쿠폰 목록 조회 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', data: [], status: 0, originalError: error };
  }
};

/** 마스터 쿠폰(CouponDto) → 받을 수 있는 쿠폰 카드용 */
export const mapReceivableCouponApiToFrontend = (row) => {
  if (!row) return null;
  const discountType = row.discountType === 'FIXED' ? 'fixed' : 'percent';
  return {
    id: row.id,
    couponId: row.id,
    name: row.name || '쿠폰',
    description: '회원가입을 축하합니다!',
    discount: row.discount != null ? Number(row.discount) : 0,
    discountType,
    minPurchase: row.minPurchase != null ? Number(row.minPurchase) : 0,
    validDays: row.validDays,
  };
};

/**
 * 받을 수 있는 쿠폰 목록 (GET /coupon/receivable)
 */
export const fetchReceivableCoupons = async () => {
  try {
    const token = getAccessToken();
    if (!token) {
      return { success: false, message: '로그인이 필요합니다.', data: [], status: 401 };
    }
    const response = await fetch(`${COUPON_API_BASE_URL}/coupon/receivable`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || errorData.body?.message || '목록을 불러오지 못했습니다.',
        data: [],
        status: response.status,
      };
    }
    const list = await response.json();
    const normalized = (Array.isArray(list) ? list : []).map(mapReceivableCouponApiToFrontend).filter(Boolean);
    return { success: true, data: normalized };
  } catch (error) {
    console.error('받을 수 있는 쿠폰 조회 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', data: [], status: 0, originalError: error };
  }
};

/**
 * 쿠폰 수동 발급 (POST /coupon/{couponId}/issue)
 */
export const issueCouponById = async (couponId) => {
  try {
    const token = getAccessToken();
    if (!token) {
      return { success: false, message: '로그인이 필요합니다.', status: 401 };
    }
    const response = await fetch(`${COUPON_API_BASE_URL}/coupon/${couponId}/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || errorData.body?.message || '쿠폰을 받지 못했습니다.',
        status: response.status,
      };
    }
    return { success: true, status: response.status };
  } catch (error) {
    console.error('쿠폰 발급 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', status: 0, originalError: error };
  }
};

/**
 * 쿠폰 사용 처리 (결제 완료 후, 서버 쿠폰만)
 */
export const postUserCouponUse = async (userCouponId, orderId, orderAmount) => {
  try {
    const token = getAccessToken();
    if (!token || userCouponId == null || !orderId) {
      return { success: false, message: '쿠폰 사용 요청 정보가 부족합니다.' };
    }
    const params = new URLSearchParams({
      orderId: String(orderId),
      orderAmount: String(orderAmount),
    });
    const response = await fetch(`${COUPON_API_BASE_URL}/coupon/${userCouponId}/use?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        message: errorData.message || errorData.body?.message || '쿠폰 사용 처리에 실패했습니다.',
        status: response.status,
      };
    }
    return { success: true };
  } catch (error) {
    console.error('쿠폰 사용 오류:', error);
    return { success: false, message: '네트워크 오류 또는 서버 연결 실패.', originalError: error };
  }
};

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

/**
 * 결제 직전: 장바구니 라인 ID 확보 (바로구매 시 상품을 장바구니에 넣고 id 수집)
 */
export const prepareCartIdsForCheckout = async (orderItems, fromCart, existingCartIds) => {
  const existing = (existingCartIds || []).filter(Boolean);
  if (fromCart && existing.length > 0) {
    return { success: true, cartIds: existing };
  }
  const ids = [];
  for (const item of orderItems) {
    const pid = item.productId;
    const qty = item.quantity || 1;
    if (pid == null) {
      return { success: false, message: '상품 정보가 올바르지 않습니다.' };
    }
    const r = await addToCart(pid, qty);
    if (!r.success) {
      return { success: false, message: r.message || '장바구니 추가에 실패했습니다.' };
    }
    if (r.data?.id != null) {
      ids.push(r.data.id);
    }
  }
  if (ids.length === 0) {
    return { success: false, message: '장바구니 항목을 만들 수 없습니다.' };
  }
  return { success: true, cartIds: ids };
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
