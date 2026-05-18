-- =============================================================================
-- Moodly MSA 데이터베이스 스키마 (참고용)
-- =============================================================================
-- 실제 런타임: 각 마이크로서비스 JPA ddl-auto: update 가 테이블을 생성·갱신합니다.
-- Docker Compose DB 이름: moodly_user, moodly_auth, moodly_product, ...
-- 이 파일은 구조 파악·로컬 수동 복구용 참고 스크립트입니다.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. user-service  →  moodly_user
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS moodly_user CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE moodly_user;

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(50) NULL COMMENT 'LOCAL 로그인 시 필수',
    password VARCHAR(255) NULL COMMENT 'BCrypt 해시',
    name VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20) NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'USER' COMMENT 'USER | ADMIN',
    provider VARCHAR(20) NOT NULL DEFAULT 'LOCAL' COMMENT 'LOCAL | KAKAO',
    provider_id VARCHAR(100) NULL,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system',
    last_modified_date TIMESTAMP NULL,
    last_modified_by VARCHAR(50) NULL,
    UNIQUE KEY uk_provider_provider_id (provider, provider_id),
    KEY idx_users_email (email)
);

CREATE TABLE delivery_addresses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    postcode VARCHAR(10) NOT NULL,
    address VARCHAR(200) NOT NULL,
    detail_address VARCHAR(200) NULL,
    recipient VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system',
    last_modified_date TIMESTAMP NULL,
    last_modified_by VARCHAR(50) NULL,
    KEY idx_delivery_user_id (user_id)
);

-- -----------------------------------------------------------------------------
-- 2. auth-service  →  moodly_auth
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS moodly_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE moodly_auth;

CREATE TABLE refresh_tokens (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    refresh_token_hash CHAR(64) NOT NULL,
    expired_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_refresh_token_hash (refresh_token_hash),
    KEY idx_refresh_user_id (user_id),
    KEY idx_refresh_expired_at (expired_at)
);

-- -----------------------------------------------------------------------------
-- 3. product-service  →  moodly_product
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS moodly_product CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE moodly_product;

CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    display_order INT DEFAULT 0,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system',
    last_modified_date TIMESTAMP NULL,
    last_modified_by VARCHAR(50) NULL,
    UNIQUE KEY uk_categories_name (name)
);

CREATE TABLE sub_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id BIGINT NOT NULL,
    name VARCHAR(50) NOT NULL,
    display_order INT DEFAULT 0,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system',
    last_modified_date TIMESTAMP NULL,
    last_modified_by VARCHAR(50) NULL,
    KEY idx_sub_categories_category_id (category_id)
);

CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    discount INT DEFAULT 0,
    image VARCHAR(500) NULL,
    description TEXT NULL,
    details TEXT NULL,
    category_id BIGINT NULL,
    sub_category_id BIGINT NULL,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    review_count INT DEFAULT 0,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system',
    last_modified_date TIMESTAMP NULL,
    last_modified_by VARCHAR(50) NULL,
    KEY idx_products_category_id (category_id),
    KEY idx_products_sub_category_id (sub_category_id)
);

CREATE TABLE product_inquiries (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING | COMPLETED',
    reply TEXT NULL,
    reply_date TIMESTAMP NULL,
    reply_id BIGINT NULL,
    reply_name VARCHAR(50) NULL,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system',
    last_modified_date TIMESTAMP NULL,
    last_modified_by VARCHAR(50) NULL,
    KEY idx_inquiries_product_id (product_id),
    KEY idx_inquiries_user_id (user_id),
    KEY idx_inquiries_status (status)
);

CREATE TABLE reviews (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_item_id BIGINT NOT NULL COMMENT 'order-service order_items.id',
    product_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    product_name VARCHAR(200) NULL,
    product_image VARCHAR(500) NULL,
    rating INT NOT NULL,
    content TEXT NOT NULL,
    reply TEXT NULL COMMENT '관리자 답변',
    reply_date TIMESTAMP NULL,
    reply_name VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_reviews_order_item (order_item_id),
    KEY idx_reviews_product_created (product_id, created_at),
    KEY idx_reviews_user_created (user_id, created_at)
);

CREATE TABLE review_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    review_id BIGINT NOT NULL,
    image_url LONGTEXT NOT NULL,
    display_order INT DEFAULT 0,
    KEY idx_review_images_review_id (review_id)
);

CREATE TABLE wishlist (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_wishlist_user_product (user_id, product_id),
    KEY idx_wishlist_user_id (user_id)
);

-- -----------------------------------------------------------------------------
-- 4. cart-service  →  moodly_cart
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS moodly_cart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE moodly_cart;

CREATE TABLE carts (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    checked BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system',
    last_modified_date TIMESTAMP NULL,
    last_modified_by VARCHAR(50) NULL,
    UNIQUE KEY uk_cart_user_product (user_id, product_id),
    KEY idx_cart_user_id (user_id)
);

-- -----------------------------------------------------------------------------
-- 5. coupon-service  →  moodly_coupon
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS moodly_coupon CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE moodly_coupon;

CREATE TABLE coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    discount DECIMAL(12, 2) NOT NULL,
    discount_type VARCHAR(20) NOT NULL COMMENT 'FIXED | PERCENT',
    min_purchase DECIMAL(12, 2) NOT NULL DEFAULT 0,
    valid_start_date TIMESTAMP NULL,
    valid_end_date TIMESTAMP NULL,
    valid_days INT NOT NULL,
    total_quantity INT NULL,
    issued_quantity INT NOT NULL DEFAULT 0,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system',
    last_modified_date TIMESTAMP NULL,
    last_modified_by VARCHAR(50) NULL,
    KEY idx_coupons_end_date (valid_end_date),
    KEY idx_coupons_active (valid_start_date, valid_end_date)
);

CREATE TABLE user_coupons (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    coupon_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ISSUED' COMMENT 'ISSUED | USED | EXPIRED | CANCELED',
    received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expired_at TIMESTAMP NULL,
    used_at TIMESTAMP NULL,
    order_id VARCHAR(100) NULL,
    UNIQUE KEY uk_user_coupon (user_id, coupon_id),
    KEY idx_user_coupons_user_status (user_id, status),
    KEY idx_user_coupons_coupon_id (coupon_id),
    KEY idx_user_coupons_expires_at (expired_at)
);

-- -----------------------------------------------------------------------------
-- 6. order-service  →  moodly_order
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS moodly_order CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE moodly_order;

CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    user_id BIGINT NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    discount_amount DECIMAL(12, 2) DEFAULT 0,
    shipping_fee DECIMAL(12, 2) DEFAULT 3000,
    final_amount DECIMAL(12, 2) NOT NULL,
    coupon_id BIGINT NULL,
    delivery_address JSON NULL,
    customer_name VARCHAR(50) NOT NULL,
    customer_phone_number VARCHAR(20) NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING_PAYMENT',
    payment_id VARCHAR(100) NULL,
    delivered_date TIMESTAMP NULL,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system',
    last_modified_date TIMESTAMP NULL,
    last_modified_by VARCHAR(50) NULL,
    UNIQUE KEY uk_orders_order_id (order_id),
    KEY idx_orders_user_date (user_id, created_date),
    KEY idx_orders_status (status)
);

CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_image VARCHAR(500) NULL,
    price DECIMAL(12, 2) NOT NULL,
    quantity INT NOT NULL,
    sub_total DECIMAL(12, 2) NOT NULL,
    KEY idx_order_items_order_id (order_id),
    KEY idx_order_items_product_id (product_id)
);

-- -----------------------------------------------------------------------------
-- 7. payment-service  →  moodly_payment
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS moodly_payment CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE moodly_payment;

CREATE TABLE payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL,
    user_id BIGINT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    payment_key VARCHAR(200) NULL,
    payment_method VARCHAR(50) NULL,
    order_name VARCHAR(200) NULL,
    customer_name VARCHAR(50) NULL,
    approved_at TIMESTAMP NULL,
    fail_reason VARCHAR(500) NULL,
    fail_code VARCHAR(50) NULL,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system',
    last_modified_date TIMESTAMP NULL,
    last_modified_by VARCHAR(50) NULL,
    UNIQUE KEY uk_payments_payment_key (payment_key),
    KEY idx_payments_order_id (order_id),
    KEY idx_payments_user_created (user_id, created_date),
    KEY idx_payments_status (status)
);

CREATE TABLE payment_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NULL,
    order_id VARCHAR(100) NOT NULL,
    payment_key VARCHAR(200) NULL,
    event_type VARCHAR(50) NOT NULL,
    raw_payload JSON NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_payment_logs_order_id (order_id),
    KEY idx_payment_logs_payment_key (payment_key)
);

CREATE TABLE refunds (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id BIGINT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    reason VARCHAR(500) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    refund_key VARCHAR(200) NULL,
    created_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(50) NOT NULL DEFAULT 'system',
    completed_at TIMESTAMP NULL,
    KEY idx_refunds_payment_id (payment_id)
);

-- -----------------------------------------------------------------------------
-- 8. notification-service  →  moodly_notification
-- -----------------------------------------------------------------------------
CREATE DATABASE IF NOT EXISTS moodly_notification CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE moodly_notification;

CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    event_id VARCHAR(100) NOT NULL,
    notification_type VARCHAR(30) NOT NULL DEFAULT 'INQUIRY_CREATED',
    title VARCHAR(200) NOT NULL,
    notification_message TEXT NOT NULL,
    link VARCHAR(500) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uk_notifications_event_id (event_id),
    KEY idx_notifications_user_read_created (user_id, is_read, created_at)
);
