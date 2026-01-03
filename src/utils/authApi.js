// Auth Service API 클라이언트 (Axios 기반)

import axios from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens } from './token';

const AUTH_API_BASE_URL = process.env.REACT_APP_AUTH_API_BASE_URL || 'http://localhost:8081';

// Axios instance 생성
const authApi = axios.create({
  baseURL: AUTH_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Refresh token을 사용하여 새로운 토큰 발급
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// 요청 interceptor: 모든 요청에 accessToken 자동 첨부
authApi.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 interceptor: 401 발생 시 refresh 후 재요청
authApi.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 401 에러이고, refresh 요청이 아닌 경우
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // 이미 refresh 중이면 대기
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return authApi(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = getRefreshToken();
      
      if (!refreshToken) {
        // refresh token이 없으면 로그아웃
        clearTokens();
        processQueue(new Error('No refresh token'), null);
        isRefreshing = false;
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // refresh token으로 새 토큰 발급
        const response = await axios.post(`${AUTH_API_BASE_URL}/auth/refresh`, {
          refreshToken: refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        // 새 토큰 저장 (refresh token rotation)
        setTokens(accessToken, newRefreshToken);

        // 원래 요청 재시도
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        processQueue(null, accessToken);
        isRefreshing = false;

        return authApi(originalRequest);
      } catch (refreshError) {
        // refresh 실패 시 로그아웃 처리
        clearTokens();
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // 로그인 페이지로 리다이렉트
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// 로그인 API
export const login = async (email, password) => {
  try {
    console.log('로그인 시도:', { email, baseURL: AUTH_API_BASE_URL });
    
    const response = await authApi.post('/auth/login', {
      email,
      password,
    });

    console.log('로그인 성공:', response.data);

    const { accessToken, refreshToken } = response.data;
    
    // 토큰 저장
    setTokens(accessToken, refreshToken);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    console.error('로그인 에러 상세:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      code: error.code,
      config: error.config,
    });

    let errorMessage = '로그인에 실패했습니다.';
    
    // CORS 에러 체크
    if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || error.message?.includes('CORS')) {
      errorMessage = `CORS 오류가 발생했습니다. auth-service의 SecurityConfig에 CORS 설정이 필요합니다.\n서버(${AUTH_API_BASE_URL})는 실행 중이지만 브라우저에서 접근이 차단되었습니다.`;
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = `서버에 연결할 수 없습니다. 백엔드 서버(${AUTH_API_BASE_URL})가 실행 중인지 확인해주세요.`;
    } else if (error.response) {
      // 서버가 응답했지만 에러 상태
      const status = error.response.status;
      if (status === 500) {
        errorMessage = `서버 내부 오류가 발생했습니다. (${status})\n백엔드 로그를 확인해주세요.`;
      } else if (status === 401) {
        errorMessage = error.response.data?.message || '아이디 또는 비밀번호가 올바르지 않습니다.';
      } else {
        errorMessage = error.response.data?.message || `서버 오류가 발생했습니다. (${status})`;
      }
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못함 (CORS 문제 가능성)
      errorMessage = `서버로부터 응답을 받지 못했습니다.\nCORS 설정이 필요할 수 있습니다. 서버(${AUTH_API_BASE_URL})가 실행 중인지 확인해주세요.`;
    } else {
      errorMessage = error.message || '로그인 중 오류가 발생했습니다.';
    }

    return {
      success: false,
      message: errorMessage,
      status: error.response?.status || 0,
      error: error,
    };
  }
};

// Refresh Token API (직접 호출용)
export const refreshToken = async () => {
  try {
    const refreshTokenValue = getRefreshToken();
    
    if (!refreshTokenValue) {
      throw new Error('Refresh token이 없습니다.');
    }

    const response = await axios.post(`${AUTH_API_BASE_URL}/auth/refresh`, {
      refreshToken: refreshTokenValue,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    
    // 새 토큰 저장 (refresh token rotation)
    setTokens(accessToken, newRefreshToken);

    return {
      success: true,
      data: response.data,
    };
  } catch (error) {
    clearTokens();
    return {
      success: false,
      message: error.response?.data?.message || error.message || '토큰 갱신에 실패했습니다.',
      status: error.response?.status || 0,
    };
  }
};

// 로그아웃
export const logout = () => {
  clearTokens();
  window.location.href = '/login';
};

// authApi export (다른 곳에서 사용할 수 있도록)
export default authApi;

