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

// JWT 토큰에서 userId 추출
export const getUserIdFromToken = () => {
  try {
    const token = getAccessToken();
    if (!token) return null;
    
    // JWT는 base64로 인코딩된 3부분으로 구성: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // payload 디코딩
    const payload = JSON.parse(atob(parts[1]));
    
    // JWT의 subject(sub)가 userId (문자열로 저장되어 있음)
    return payload.sub ? parseInt(payload.sub, 10) : null;
  } catch (error) {
    console.error('JWT 토큰 파싱 오류:', error);
    return null;
  }
};

