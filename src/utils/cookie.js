// 쿠키 관리 유틸리티 함수

import { hasTokens } from './token';

export const setCookie = (name, value, days = 7) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
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
  // 토큰 기반 로그인 상태 확인 (우선)
  if (hasTokens()) {
    return true;
  }
  // 기존 쿠키 기반 로그인 상태 확인 (하위 호환성)
  return getCookie('isLoggedIn') === 'true';
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

