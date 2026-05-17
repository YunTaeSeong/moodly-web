/** 휴대폰 번호 최대 자릿수 (01012345678) */
export const KOREAN_MOBILE_MAX_DIGITS = 11;

/** 입력값 → 010-1234-5678 형식 (숫자만 최대 11자리) */
export function formatKoreanMobilePhone(raw) {
  let digits = String(raw ?? '').replace(/\D/g, '');
  if (digits.length > KOREAN_MOBILE_MAX_DIGITS) {
    digits = digits.slice(0, KOREAN_MOBILE_MAX_DIGITS);
  }
  if (digits.length > 7) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length > 3) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return digits;
}

export function stripPhoneDigits(formatted) {
  return String(formatted ?? '').replace(/\D/g, '');
}

/** 완성된 휴대폰 번호 (010-XXXX-XXXX) */
export function isValidKoreanMobilePhone(formatted) {
  return /^010-\d{4}-\d{4}$/.test(String(formatted ?? '').trim());
}
