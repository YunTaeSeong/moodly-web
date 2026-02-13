// 토큰 관리 유틸리티 (localStorage)

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

// 토큰 저장
export const setTokens = (accessToken, refreshToken) => {
  if (accessToken) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

// Access Token 가져오기
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

// Refresh Token 가져오기
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
};

// 토큰 삭제 (로그아웃)
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

// 로그인 상태 확인
export const hasTokens = () => {
  return !!getAccessToken() && !!getRefreshToken();
};

// JWT payload 파싱 (공통)
const getPayload = () => {
  try {
    const token = getAccessToken();
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch (error) {
    return null;
  }
};

// JWT 토큰에서 userId 추출
export const getUserIdFromToken = () => {
  try {
    const payload = getPayload();
    if (!payload) return null;
    return payload.sub ? parseInt(payload.sub, 10) : null;
  } catch (error) {
    console.error('JWT 토큰 파싱 오류:', error);
    return null;
  }
};

// JWT에 roles/role 클레임이 있는지
export const hasRolesInToken = () => {
  const payload = getPayload();
  if (!payload) return false;
  return payload.roles != null || payload.role != null;
};

// JWT 토큰에서 관리자(ADMIN) 여부 확인 (roles 클레임 기준)
export const isAdminFromToken = () => {
  try {
    const payload = getPayload();
    if (!payload) return false;
    const roles = payload.roles || payload.role;
    if (roles == null) return false;
    const list = Array.isArray(roles) ? roles : [roles];
    return list.some((r) => String(r).toUpperCase() === 'ADMIN' || String(r).toUpperCase() === 'ROLE_ADMIN');
  } catch (error) {
    return false;
  }
};

