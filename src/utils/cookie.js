// 쿠키 관리 유틸리티 함수

import { hasTokens } from './token';

const encodeCookieValue = (value) => encodeURIComponent(String(value ?? ''));

export const setCookie = (name, value, days = 7) => {
  const encoded = encodeCookieValue(value);
  if (days == null) {
    document.cookie = `${name}=${encoded};path=/;SameSite=Lax`;
    return;
  }
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encoded};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

/** 브라우저 세션 종료 시 삭제되는 쿠키 (로그인 UI용) */
export const setSessionCookie = (name, value) => {
  setCookie(name, value, null);
};

/** 토큰 없을 때 남은 로그인 쿠키 제거 */
export const clearAuthCookies = () => {
  deleteCookie('isLoggedIn');
  deleteCookie('username');
  deleteCookie('userEmail');
};

export const syncAuthCookiesWithTokens = () => {
  if (!hasTokens()) {
    clearAuthCookies();
    return false;
  }
  return true;
};

export const getCookie = (name) => {
  const nameEQ = name + '=';
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
  }
  return null;
};

export const deleteCookie = (name) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
};

export const isLoggedIn = () => {
  if (hasTokens()) {
    return true;
  }
  return false;
};

// 관리자 체크 함수
export const isAdmin = () => {
  const userEmail = getCookie('userEmail');
  return userEmail === 'admin@admin.com';
};

// 현재 로그인한 사용자 이메일 가져오기
export const getCurrentUserEmail = () => {
  return getCookie('userEmail');
};

