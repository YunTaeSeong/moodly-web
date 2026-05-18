# Moodly Web

Moodly 쇼핑몰 **React 프론트엔드**입니다. Create React App 기반이며, 백엔드 MSA API와 연동합니다.

| 저장소 | 역할 |
|--------|------|
| **moodly-web** (본 저장소) | React UI |
| [moodly-api](https://github.com/YunTaeSeong/moodly-api) | Spring Boot MSA 백엔드 |
| [moodly-config](https://github.com/YunTaeSeong/moodly-config) | Config Server YAML |

---

## 주요 기능

- 회원가입 / 로그인 / 카카오 소셜 로그인
- 상품 목록·상세, 카테고리, 찜하기
- 장바구니, 주문·결제 (토스)
- 쿠폰, 마이페이지 (주문·배송지·쿠폰) — **신규회원 10% 쿠폰은 마이페이지에서 「받기」**
- 상품 문의, **구매후기** (작성·목록·관리자 답변·삭제)
- 알림 (SSE)
- 관리자: 상품문의·구매후기 답변/삭제

실제 데이터는 **백엔드 MySQL**에 저장됩니다. `database/schema.sql`은 MSA DB 구조 **참고용**이며, 런타임 스키마는 각 서비스 JPA `ddl-auto: update`가 담당합니다.

---

## 사전 요구사항

- Node.js **18+**, npm
- 백엔드: [moodly-api README](https://github.com/YunTaeSeong/moodly-api/blob/main/README.md) 참고 후 기동

---

## 실행 방식

백엔드 실행 방식과 **반드시 맞춰** API 주소를 설정하세요.

| 모드 | 백엔드 | 프론트 실행 | API 주소 |
|------|--------|-------------|----------|
| **Gateway** (권장) | `docker compose --profile app` | `npm run start:docker` | `http://localhost:8072/{SERVICE-NAME}` |
| **서비스 직접** (IDE) | IDE `local` + 인프라 Docker | `npm start` | 미설정 시 `8081`~`8088` |

> 전체 Docker(`--profile app`)인데 `8081`로 호출하면 로그인·API 호출이 실패합니다.

---

## Gateway 모드 (권장)

### 1. 환경 변수

```bash
cp .env.docker .env
# 카카오·토스 키 등 수정
```

### 2. 실행

```bash
npm install
npm run start:docker
```

브라우저: http://localhost:3000

`start:docker`는 [`.env.docker`](.env.docker)의 Gateway URL을 로드합니다.

```env
REACT_APP_AUTH_API_BASE_URL=http://localhost:8072/AUTH-SERVICE
REACT_APP_API_BASE_URL=http://localhost:8072/USER-SERVICE
REACT_APP_PRODUCT_API_BASE_URL=http://localhost:8072/PRODUCT-SERVICE
REACT_APP_CART_API_BASE_URL=http://localhost:8072/CART-SERVICE
REACT_APP_ORDER_API_BASE_URL=http://localhost:8072/ORDER-SERVICE
REACT_APP_NOTIFICATION_API_BASE_URL=http://localhost:8072/NOTIFICATION-SERVICE
REACT_APP_COUPON_API_BASE_URL=http://localhost:8072/COUPON-SERVICE
REACT_APP_PAYMENT_API_BASE_URL=http://localhost:8072/PAYMENT-SERVICE
```

백엔드 헬스체크: `curl http://localhost:8072/actuator/health`

---

## 서비스 직접 모드 (IDE 하이브리드)

```bash
cp .env.example .env
npm install
npm start
```

`REACT_APP_*_API_BASE_URL`을 설정하지 않으면 auth `8081`, user `8082` … 로 직접 요청합니다.

---

## 환경 변수

Create React App: **`REACT_APP_` 접두사**만 브라우저에 노출됩니다. 변경 후 **개발 서버 재시작**이 필요합니다.

템플릿: [`.env.example`](.env.example) · Gateway용: [`.env.docker`](.env.docker)

| 변수 | 필수 | 설명 |
|------|:----:|------|
| `REACT_APP_KAKAO_CLIENT_ID` | △ | 카카오 REST API 키 |
| `REACT_APP_KAKAO_REDIRECT_URI` | △ | 예: `http://localhost:3000/auth/kakao/callback` |
| `REACT_APP_TOSS_CLIENT_KEY` | △ | 토스 **클라이언트 키** (`test_ck_...`, [개발자센터](https://developers.tosspayments.com/my/api-keys)에서 복사). `test_sk_` 시크릿은 넣지 않음 |
| `REACT_APP_*_API_BASE_URL` | Gateway 모드 시 ✅ | 위 Gateway URL 블록 |

| 프론트 | 백엔드 (`moodly-api/docker-compose/.env`) |
|--------|------------------------------------------|
| `REACT_APP_KAKAO_CLIENT_ID` | `KAKAO_CLIENT_ID` |
| `REACT_APP_KAKAO_REDIRECT_URI` | `KAKAO_REDIRECT_URI` |
| `REACT_APP_TOSS_CLIENT_KEY` (`test_ck_...`) | `TOSS_SECRET_KEY` (`test_sk_...`, 같은 상점·테스트 세트) |

---

## npm 스크립트

| 명령 | 설명 |
|------|------|
| `npm run start:docker` | Gateway URL (`.env.docker`) |
| `npm start` | `.env` / 기본값(8081~) |
| `npm run build` | 프로덕션 빌드 |
| `npm test` | Jest |

---

## 프로젝트 구조

```text
moodly-web/
├── public/
├── src/
│   ├── components/       # 페이지·UI 컴포넌트
│   │   ├── ProductDetail.js   # 상품상세, 문의, 구매후기
│   │   ├── MyPage.js          # 마이페이지, 관리자 후기
│   │   ├── Cart.js, OrderCheckout.js, Login.js, ...
│   └── utils/
│       ├── api.js        # user, product, cart, order, review, ...
│       ├── authApi.js    # auth, JWT refresh
│       └── review.js     # 후기 작성 가능 여부 등
├── database/
│   └── schema.sql        # MSA DB 구조 참고 (실행 필수 아님)
├── .env.example
├── .env.docker
└── package.json
```

### database/schema.sql

- 서비스별 DB(`moodly_user`, `moodly_product`, …) 테이블 구조 **참고 문서**
- Docker Compose로 기동 시 **수동 실행 불필요** (JPA가 테이블 생성)
- 구매후기 답변·`uk_reviews_order_item`·`LONGTEXT` 이미지 등 최신 엔티티 기준으로 반영됨

---

## 신규회원 10% 할인 쿠폰

회원가입만으로 쿠폰이 들어오지 **않습니다.** 로그인 후 **마이페이지 → 쿠폰** 탭에서 받습니다.

| 순서 | 화면 / API | 설명 |
|:----:|------------|------|
| 1 | (백엔드 기동) | coupon-service가 **「신규회원 10% 할인」** 마스터 쿠폰을 DB에 준비 |
| 2 | 마이페이지 · 쿠폰 | `GET /coupon/receivable` — 아직 없으면 목록에 표시 |
| 3 | **받기** 버튼 | `POST /coupon/{couponId}/issue` — 내 쿠폰함에 저장 |
| 4 | 보유 쿠폰 | `GET /coupon` — 결제 시 사용 가능 |

구현: `MyPage.js` (`fetchReceivableCoupons`, `issueCouponById`) · `api.js`

---

## 관리자 테스트 계정

| 항목 | 값 |
|------|-----|
| 이메일 | `admin@admin.com` |
| 비밀번호 | `admin1234!@#$` |

상품상세·마이페이지에서 구매후기 답변/삭제 가능합니다.

---

## 트러블슈팅

| 증상 | 확인 |
|------|------|
| `ERR_CONNECTION_REFUSED` | 백엔드 기동, 실행 모드와 API URL 일치 (Docker 전체 → Gateway) |
| CORS `Allow-Origin` 중복 | Gateway 모드에서 auth 등 이중 CORS → 백엔드 auth·gateway 재빌드 |
| 카카오 로그인 실패 | `REACT_APP_KAKAO_*` ↔ 카카오 콘솔 Redirect URI ↔ api `KAKAO_*` 일치 |
| env 변경 안 됨 | `npm start` / `start:docker` 재시작 |
| 로그인 후 401 | 백엔드 `JWT_SECRET` 전 서비스 동일 |

---

## 보안

- `.env`는 Git에 커밋하지 마세요.
- 토스: 프론트는 `REACT_APP_TOSS_CLIENT_KEY`(`test_ck_...`)만, 백엔드는 `TOSS_SECRET_KEY`(`test_sk_...`)만. **시크릿 키는 프론트·Git에 넣지 마세요.**

---

## 관련 문서

- [moodly-api README](https://github.com/YunTaeSeong/moodly-api/blob/main/README.md)
- [moodly-config README](https://github.com/YunTaeSeong/moodly-config/blob/main/README.md)
