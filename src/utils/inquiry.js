// 상품 문의 관리 유틸리티

const INQUIRY_KEY = 'moodly_product_inquiries';

// 상품 문의 목록 가져오기
export const getInquiries = (productId = null) => {
  try {
    const inquiries = localStorage.getItem(INQUIRY_KEY);
    const allInquiries = inquiries ? JSON.parse(inquiries) : [];
    
    if (productId) {
      return allInquiries.filter(inquiry => inquiry.productId === productId);
    }
    
    return allInquiries;
  } catch (error) {
    console.error('상품 문의 목록을 가져오는 중 오류 발생:', error);
    return [];
  }
};

// 상품 문의 추가
export const addInquiry = (inquiryData) => {
  try {
    const inquiries = getInquiries();
    const newInquiry = {
      id: Date.now().toString(),
      ...inquiryData,
      createdAt: new Date().toISOString(),
      status: '답변대기'
    };
    
    inquiries.push(newInquiry);
    localStorage.setItem(INQUIRY_KEY, JSON.stringify(inquiries));
    return newInquiry;
  } catch (error) {
    console.error('상품 문의 추가 중 오류 발생:', error);
    return null;
  }
};

// 상품 문의 삭제
export const deleteInquiry = (inquiryId) => {
  try {
    const inquiries = getInquiries();
    const filtered = inquiries.filter(inquiry => inquiry.id !== inquiryId);
    localStorage.setItem(INQUIRY_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('상품 문의 삭제 중 오류 발생:', error);
    return false;
  }
};

// 상품 문의 답변 추가
export const addInquiryReply = (inquiryId, replyContent) => {
  try {
    const inquiries = getInquiries();
    const inquiryIndex = inquiries.findIndex(inquiry => inquiry.id === inquiryId);
    
    if (inquiryIndex === -1) {
      return null;
    }
    
    inquiries[inquiryIndex].reply = replyContent;
    inquiries[inquiryIndex].replyDate = new Date().toISOString();
    inquiries[inquiryIndex].status = '답변완료';
    
    localStorage.setItem(INQUIRY_KEY, JSON.stringify(inquiries));
    return inquiries[inquiryIndex];
  } catch (error) {
    console.error('상품 문의 답변 추가 중 오류 발생:', error);
    return null;
  }
};

