// API 호출 유틸리티

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8082';

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

    const data = await response.json();
    console.log('응답 데이터:', data);
    return data;
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

