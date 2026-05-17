// 토큰 관리 — sessionStorage (브라우저/탭 종료 시 삭제)

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

const tokenStorage = () => window.sessionStorage;

/** 이전 버전 localStorage 토큰 제거 */
const clearLegacyTokenStorage = () => {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

export const setTokens = (accessToken, refreshToken) => {
  clearLegacyTokenStorage();
  if (accessToken) {
    tokenStorage().setItem(ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    tokenStorage().setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
};

export const getAccessToken = () => {
  return tokenStorage().getItem(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = () => {
  return tokenStorage().getItem(REFRESH_TOKEN_KEY);
};

export const clearTokens = () => {
  tokenStorage().removeItem(ACCESS_TOKEN_KEY);
  tokenStorage().removeItem(REFRESH_TOKEN_KEY);
  clearLegacyTokenStorage();
};

export const hasTokens = () => {
  return !!getAccessToken() && !!getRefreshToken();
};

/** 앱 로드 시: 예전 localStorage 토큰 제거 */
export const syncAuthSessionOnLoad = () => {
  clearLegacyTokenStorage();
  return hasTokens();
};

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

export const hasRolesInToken = () => {
  const payload = getPayload();
  if (!payload) return false;
  return payload.roles != null || payload.role != null;
};

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
