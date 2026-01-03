# Moodly 쇼핑몰 데이터베이스 스키마 V2

## 개요
이 데이터베이스는 Moodly 쇼핑몰 웹사이트의 모든 기능을 지원하기 위한 최소한의 필수 테이블 구조를 포함합니다.
구현에 문제 없을 정도로만 구성된 경량화된 스키마입니다.

## 데이터베이스 정보
- **데이터베이스명**: `moodly_shop`
- **문자셋**: `utf8mb4`
- **콜레이션**: `utf8mb4_unicode_ci`
- **버전**: V2 (최소 필수 컬럼만 포함)

## 테이블 목록

### 1. 사용자 관련
- **users**: 사용자 정보 (로그인, 회원가입, ID/PW 찾기, 비밀번호 변경)
  - 필수 컬럼: id, username, password, name, phone, role

### 2. 상품 관련
- **categories**: 카테고리
  - 필수 컬럼: id, name, display_order
- **sub_categories**: 서브카테고리
  - 필수 컬럼: id, category_id, name, display_order
- **products**: 상품 정보
  - 필수 컬럼: id, name, price, discount, image, description, details, category_id, sub_category_id, rating, review_count

### 3. 쇼핑 관련
- **cart_items**: 장바구니
  - 필수 컬럼: id, user_id, product_id, quantity, checked
- **wishlist**: 찜하기
  - 필수 컬럼: id, user_id, product_id, created_at
- **orders**: 주문 정보
  - 필수 컬럼: id, order_id, user_id, total_amount, discount_amount, shipping_fee, final_amount, coupon_id, delivery_address, customer_name, customer_phone, status, payment_id, order_date, delivered_date
- **order_items**: 주문 상세 (주문에 포함된 상품들)
  - 필수 컬럼: id, order_id, product_id, product_name, product_image, price, quantity, subtotal

### 4. 배송 관련
- **delivery_addresses**: 배송지 정보
  - 필수 컬럼: id, user_id, postcode, address, detail_address, recipient, phone, is_default

### 5. 쿠폰 관련
- **coupons**: 쿠폰 정보
  - 필수 컬럼: id, name, description, discount, discount_type, min_purchase, valid_from, valid_until
- **user_coupons**: 사용자가 받은 쿠폰
  - 필수 컬럼: id, user_id, coupon_id, status, received_at, used_at, order_id

### 6. 고객 서비스 관련
- **product_inquiries**: 상품 문의
  - 필수 컬럼: id, product_id, user_id, content, status, reply, reply_date, reply_user_id, created_at, updated_at
- **reviews**: 상품 리뷰
  - 필수 컬럼: id, order_id, product_id, user_id, product_name, product_image, rating, content, created_at
- **review_images**: 리뷰 이미지
  - 필수 컬럼: id, review_id, image_url, display_order

### 7. 마케팅 관련
- **events**: 이벤트 배너
  - 필수 컬럼: id, title, image, start_date, end_date, display_order, status

### 8. 알림 관련
- **notifications**: 알림 시스템
  - 필수 컬럼: id, user_id, type, title, message, link, read, created_at

## 설치 방법

### 1. MySQL/MariaDB 접속
```bash
mysql -u root -p
```

### 2. 스키마 실행
```bash
mysql -u root -p < schemaV2.sql
```

또는 MySQL 클라이언트에서:
```sql
source /path/to/schemaV2.sql
```

## 주요 관계

1. **사용자 → 주문**: 한 사용자는 여러 주문을 가질 수 있음 (1:N)
2. **주문 → 주문상세**: 한 주문은 여러 상품을 포함할 수 있음 (1:N)
3. **상품 → 리뷰**: 한 상품은 여러 리뷰를 가질 수 있음 (1:N)
4. **리뷰 → 리뷰이미지**: 한 리뷰는 여러 이미지를 가질 수 있음 (1:N)
5. **카테고리 → 서브카테고리**: 한 카테고리는 여러 서브카테고리를 가질 수 있음 (1:N)
6. **서브카테고리 → 상품**: 한 서브카테고리는 여러 상품을 가질 수 있음 (1:N)
7. **사용자 → 상품 문의**: 한 사용자는 여러 상품 문의를 작성할 수 있음 (1:N)
8. **상품 → 상품 문의**: 한 상품은 여러 문의를 받을 수 있음 (1:N)
9. **사용자 → 알림**: 한 사용자는 여러 알림을 받을 수 있음 (1:N)

## V2의 주요 특징

### 최소한의 필수 컬럼만 포함
- 불필요한 컬럼 제거 (original_price, purchase_count, stock, status 등 일부 제거)
- 구현에 필요한 핵심 컬럼만 유지
- 데이터베이스 용량 최적화

### 경량화된 구조
- 인덱스 없이 최소한의 구조만 유지
- 외래키 제약조건만 설정하여 데이터 무결성 보장

### 알림 시스템 추가
- 사용자별 알림 관리
- 상품 문의, 답변 등에 대한 알림 지원
- 읽음/안 읽음 상태 관리

## 주의사항

1. **비밀번호 해싱**: 실제 운영 환경에서는 bcrypt 등 안전한 해싱 알고리즘을 사용해야 합니다.
2. **이미지 저장**: 현재는 URL만 저장하지만, 실제로는 파일 시스템이나 S3 등에 저장하는 것을 권장합니다.
3. **JSON 필드**: `delivery_address` 필드는 JSON 타입을 사용합니다. (MySQL 5.7+)
4. **외래키 제약**: 데이터 무결성을 위해 외래키 제약조건을 설정했습니다.
5. **알림 user_id**: `notifications` 테이블의 `user_id`는 VARCHAR(100)로 설정되어 있어 username이나 'admin' 문자열을 저장합니다.

## 초기 데이터

스키마 실행 시 다음 초기 데이터가 자동으로 삽입됩니다:

- **관리자 계정**: `admin@admin.com` / `admin`
- **카테고리**: 의류, 가전용품, 푸드, 뷰티, 홈인테리어
- **기본 쿠폰**: 신규 가입 쿠폰, 10% 할인 쿠폰, 특별 할인 쿠폰

## 데이터 마이그레이션

현재 localStorage에 저장된 데이터를 데이터베이스로 마이그레이션하려면 별도의 마이그레이션 스크립트가 필요합니다.

## V1과의 차이점

- 불필요한 컬럼 제거로 테이블 구조 간소화
- 알림 테이블 추가 (notifications)
- 인덱스 제거로 최대한 경량화된 구조
- 초기 데이터 최소화

