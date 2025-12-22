// 알림 관리 유틸리티

const NOTIFICATION_KEY = 'moodly_notifications';

// 모든 알림 가져오기
export const getNotifications = (userId = null) => {
  try {
    const stored = localStorage.getItem(NOTIFICATION_KEY);
    const allNotifications = stored ? JSON.parse(stored) : [];
    
    if (userId) {
      return allNotifications.filter(notif => notif.userId === userId);
    }
    
    return allNotifications;
  } catch (error) {
    console.error('알림 목록을 가져오는 중 오류 발생:', error);
    return [];
  }
};

// 읽지 않은 알림 개수 가져오기
export const getUnreadNotificationCount = (userId) => {
  try {
    const notifications = getNotifications(userId);
    return notifications.filter(notif => !notif.read).length;
  } catch (error) {
    console.error('읽지 않은 알림 개수를 가져오는 중 오류 발생:', error);
    return 0;
  }
};

// 알림 추가
export const addNotification = (notificationData) => {
  try {
    const notifications = getNotifications();
    const newNotification = {
      id: `NOTIF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...notificationData,
      read: false,
      createdAt: new Date().toISOString()
    };
    
    notifications.unshift(newNotification); // 최신 알림이 위로
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
    return newNotification;
  } catch (error) {
    console.error('알림 추가 중 오류 발생:', error);
    return null;
  }
};

// 알림 읽음 처리
export const markNotificationAsRead = (notificationId) => {
  try {
    const notifications = getNotifications();
    const notificationIndex = notifications.findIndex(notif => notif.id === notificationId);
    
    if (notificationIndex !== -1) {
      notifications[notificationIndex].read = true;
      localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(notifications));
      return true;
    }
    return false;
  } catch (error) {
    console.error('알림 읽음 처리 중 오류 발생:', error);
    return false;
  }
};

// 모든 알림 읽음 처리
export const markAllNotificationsAsRead = (userId) => {
  try {
    const notifications = getNotifications();
    const updated = notifications.map(notif => {
      if (notif.userId === userId && !notif.read) {
        return { ...notif, read: true };
      }
      return notif;
    });
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(updated));
    return true;
  } catch (error) {
    console.error('모든 알림 읽음 처리 중 오류 발생:', error);
    return false;
  }
};

// 알림 삭제
export const deleteNotification = (notificationId) => {
  try {
    const notifications = getNotifications();
    const filtered = notifications.filter(notif => notif.id !== notificationId);
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('알림 삭제 중 오류 발생:', error);
    return false;
  }
};

// 모든 알림 삭제 (사용자별)
export const deleteAllNotifications = (userId) => {
  try {
    const notifications = getNotifications();
    const filtered = notifications.filter(notif => notif.userId !== userId);
    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('모든 알림 삭제 중 오류 발생:', error);
    return false;
  }
};

// 상품 문의 등록 알림 생성 (사용자용)
export const createInquiryNotification = (userId, productId, productName) => {
  return addNotification({
    type: 'inquiry',
    userId: userId,
    title: '상품 문의가 등록되었습니다',
    message: `상품 문의가 등록되었습니다.`,
    productId: productId,
    productName: productName,
    link: '/mypage?menu=inquiry'
  });
};

// 상품 문의 등록 알림 생성 (관리자용)
export const createInquiryNotificationForAdmin = (userId, productId, productName, inquiryId) => {
  return addNotification({
    type: 'inquiry_admin',
    userId: 'admin',
    title: '새로운 상품 문의가 등록되었습니다',
    message: `${productName}에 대한 새로운 상품 문의가 등록되었습니다.`,
    productId: productId,
    productName: productName,
    inquiryId: inquiryId,
    link: `/product/${productId}?tab=inquiry`
  });
};

// 상품 문의 답변 알림 생성 (사용자용)
export const createInquiryReplyNotification = (userId, productId, productName) => {
  return addNotification({
    type: 'inquiry_reply',
    userId: userId,
    title: '상품 문의에 답변이 등록되었습니다',
    message: `${productName}에 대한 상품 문의에 관리자 답변이 등록되었습니다.`,
    productId: productId,
    productName: productName,
    link: `/product/${productId}?tab=inquiry`
  });
};

