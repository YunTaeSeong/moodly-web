// 사용자 정보 관리 유틸리티

const USER_KEY = 'moodly_users';

// 모든 사용자 가져오기
export const getUsers = () => {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('사용자 목록을 가져오는 중 오류 발생:', error);
    return [];
  }
};

// 사용자 추가 (회원가입)
export const addUser = (userData) => {
  try {
    const users = getUsers();
    
    // 중복 체크
    const existingUser = users.find(u => u.userId.toLowerCase() === userData.userId.toLowerCase());
    if (existingUser) {
      return { success: false, message: '이미 사용중인 아이디입니다.' };
    }

    const newUser = {
      id: `USER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: userData.userId,
      password: userData.password, // 실제로는 해시화해야 함
      name: userData.name,
      phone: userData.phone,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    localStorage.setItem(USER_KEY, JSON.stringify(users));
    return { success: true, user: newUser };
  } catch (error) {
    console.error('사용자 추가 중 오류 발생:', error);
    return { success: false, message: '회원가입에 실패했습니다.' };
  }
};

// 사용자 인증 (로그인)
export const authenticateUser = (userId, password) => {
  try {
    const users = getUsers();
    const user = users.find(u => 
      u.userId.toLowerCase() === userId.toLowerCase() && 
      u.password === password
    );
    return user || null;
  } catch (error) {
    console.error('사용자 인증 중 오류 발생:', error);
    return null;
  }
};

// ID 찾기 (이름 + 전화번호)
export const findUserId = (name, phone) => {
  try {
    const users = getUsers();
    const user = users.find(u => 
      u.name === name && 
      u.phone === phone
    );
    
    if (user) {
      // 보안을 위해 일부만 표시 (예: test@test.com -> te**@test.com)
      const email = user.userId;
      const [localPart, domain] = email.split('@');
      const maskedEmail = localPart.length > 2 
        ? localPart.substring(0, 2) + '*'.repeat(localPart.length - 2) + '@' + domain
        : email;
      
      return { success: true, userId: maskedEmail, fullUserId: user.userId };
    }
    return { success: false, message: '일치하는 회원 정보를 찾을 수 없습니다.' };
  } catch (error) {
    console.error('ID 찾기 중 오류 발생:', error);
    return { success: false, message: 'ID 찾기에 실패했습니다.' };
  }
};

// 비밀번호 찾기 (ID + 이름 + 전화번호)
export const findPassword = (userId, name, phone) => {
  try {
    const users = getUsers();
    const user = users.find(u => 
      u.userId.toLowerCase() === userId.toLowerCase() &&
      u.name === name && 
      u.phone === phone
    );
    
    if (user) {
      // 임시 비밀번호 생성
      const tempPassword = generateTempPassword();
      
      // 비밀번호 업데이트
      const updatedUsers = users.map(u => 
        u.id === user.id ? { ...u, password: tempPassword } : u
      );
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUsers));
      
      return { success: true, tempPassword };
    }
    return { success: false, message: '일치하는 회원 정보를 찾을 수 없습니다.' };
  } catch (error) {
    console.error('비밀번호 찾기 중 오류 발생:', error);
    return { success: false, message: '비밀번호 찾기에 실패했습니다.' };
  }
};

// 임시 비밀번호 생성
const generateTempPassword = () => {
  const length = 10;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// 비밀번호 재설정
export const resetPassword = (userId, newPassword) => {
  try {
    const users = getUsers();
    const userIndex = users.findIndex(u => u.userId.toLowerCase() === userId.toLowerCase());
    
    if (userIndex === -1) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }

    users[userIndex].password = newPassword; // 실제로는 해시화해야 함
    localStorage.setItem(USER_KEY, JSON.stringify(users));
    return { success: true };
  } catch (error) {
    console.error('비밀번호 재설정 중 오류 발생:', error);
    return { success: false, message: '비밀번호 재설정에 실패했습니다.' };
  }
};

// 비밀번호 변경 (현재 비밀번호 확인 후 변경)
export const changePassword = (userId, currentPassword, newPassword) => {
  try {
    const users = getUsers();
    const user = users.find(u => u.userId.toLowerCase() === userId.toLowerCase());
    
    if (!user) {
      return { success: false, message: '사용자를 찾을 수 없습니다.' };
    }

    // 현재 비밀번호 확인
    if (user.password !== currentPassword) {
      return { success: false, message: '현재 비밀번호가 일치하지 않습니다.' };
    }

    // 새 비밀번호와 현재 비밀번호가 같은지 확인
    if (currentPassword === newPassword) {
      return { success: false, message: '새 비밀번호는 현재 비밀번호와 다르게 설정해주세요.' };
    }

    // 비밀번호 변경
    user.password = newPassword; // 실제로는 해시화해야 함
    const updatedUsers = users.map(u => u.id === user.id ? user : u);
    localStorage.setItem(USER_KEY, JSON.stringify(updatedUsers));
    return { success: true, message: '비밀번호가 성공적으로 변경되었습니다.' };
  } catch (error) {
    console.error('비밀번호 변경 중 오류 발생:', error);
    return { success: false, message: '비밀번호 변경에 실패했습니다.' };
  }
};

