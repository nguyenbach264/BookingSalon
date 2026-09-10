-- =======================================================
-- Flyway Migration V1: Initial Database Schema
-- Database: MySQL 8+
-- =======================================================

-- 1. Base Users & Specialized User Tables
CREATE TABLE IF NOT EXISTS users (
    user_id BINARY(16) NOT NULL,
    keycloak_id BINARY(16) NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NULL,
    email VARCHAR(150) NULL,
    phone_number VARCHAR(20) NULL UNIQUE,
    address VARCHAR(255) NULL,
    avatar_url VARCHAR(500) NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admins (
    id BINARY(16) NOT NULL,
    keycloak_id BINARY(16) NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NULL,
    email VARCHAR(150) NULL,
    phone_number VARCHAR(20) NULL,
    address VARCHAR(255) NULL,
    avatar_url VARCHAR(500) NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Salons
CREATE TABLE IF NOT EXISTS salons (
    salon_id BINARY(16) NOT NULL,
    salon_name VARCHAR(255) NOT NULL,
    salon_address VARCHAR(255) NOT NULL,
    open_time TIME NULL,
    close_time TIME NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (salon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS salon_images (
    salon_id BINARY(16) NOT NULL,
    images VARCHAR(500) NOT NULL,
    CONSTRAINT fk_salon_images_salon FOREIGN KEY (salon_id) REFERENCES salons (salon_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Stylists
CREATE TABLE IF NOT EXISTS stylists (
    stylist_id BINARY(16) NOT NULL,
    keycloak_id BINARY(16) NULL,
    username VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(255) NULL,
    email VARCHAR(150) NULL,
    phone_number VARCHAR(20) NULL,
    address VARCHAR(255) NULL,
    avatar_url VARCHAR(500) NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    salary DECIMAL(15, 2) NULL,
    rating DOUBLE DEFAULT 5.0,
    join_date DATE NULL,
    leave_date DATE NULL,
    salon_id BINARY(16) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (stylist_id),
    CONSTRAINT fk_stylists_salon FOREIGN KEY (salon_id) REFERENCES salons (salon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Service Categories & Offerings
CREATE TABLE IF NOT EXISTS categories (
    category_id BINARY(16) NOT NULL,
    category_name VARCHAR(255) NOT NULL,
    image VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS service_offerings (
    service_offering_id BINARY(16) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(15, 2) NOT NULL,
    duration INT NOT NULL,
    image VARCHAR(500) NOT NULL,
    usage_count INT DEFAULT 0,
    rating DOUBLE DEFAULT 5.0,
    deleted_at DATETIME NULL,
    category_id BINARY(16) NOT NULL,
    salon_id BINARY(16) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (service_offering_id),
    CONSTRAINT fk_service_category FOREIGN KEY (category_id) REFERENCES categories (category_id),
    CONSTRAINT fk_service_salon FOREIGN KEY (salon_id) REFERENCES salons (salon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS stylist_services (
    id BINARY(16) NOT NULL,
    stylist_id BINARY(16) NOT NULL,
    service_offering_id BINARY(16) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_stylist_service (stylist_id, service_offering_id),
    CONSTRAINT fk_stylist_services_stylist FOREIGN KEY (stylist_id) REFERENCES stylists (stylist_id) ON DELETE CASCADE,
    CONSTRAINT fk_stylist_services_offering FOREIGN KEY (service_offering_id) REFERENCES service_offerings (service_offering_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bookings & Booking Details
CREATE TABLE IF NOT EXISTS bookings (
    booking_id BINARY(16) NOT NULL,
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    salon_id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    stylist_id BINARY(16) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    total_amount DECIMAL(15, 2) NULL,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (booking_id),
    CONSTRAINT fk_bookings_salon FOREIGN KEY (salon_id) REFERENCES salons (salon_id),
    CONSTRAINT fk_bookings_user FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT fk_bookings_stylist FOREIGN KEY (stylist_id) REFERENCES stylists (stylist_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS booking_details (
    booking_detail_id BINARY(16) NOT NULL,
    booking_id BINARY(16) NOT NULL,
    service_offering_id BINARY(16) NOT NULL,
    current_price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (booking_detail_id),
    CONSTRAINT fk_booking_details_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id) ON DELETE CASCADE,
    CONSTRAINT fk_booking_details_offering FOREIGN KEY (service_offering_id) REFERENCES service_offerings (service_offering_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. E-Commerce (Product Categories, Products, Orders, Carts)
CREATE TABLE IF NOT EXISTS product_categories (
    category_id BINARY(16) NOT NULL,
    name VARCHAR(255) NOT NULL UNIQUE,
    slug VARCHAR(255) UNIQUE,
    description TEXT NULL,
    image_url VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS products (
    product_id BINARY(16) NOT NULL,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NULL,
    price DECIMAL(15, 2) NOT NULL,
    original_price DECIMAL(15, 2) NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    image_url VARCHAR(500) NULL,
    rating DOUBLE DEFAULT 5.0,
    review_count INT DEFAULT 0,
    sold_count INT DEFAULT 0,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    category_id BINARY(16) NOT NULL,
    deleted_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (product_id),
    CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES product_categories (category_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_images (
    product_id BINARY(16) NOT NULL,
    image VARCHAR(500) NOT NULL,
    CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products (product_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS orders (
    order_id BINARY(16) NOT NULL,
    order_code VARCHAR(100) NOT NULL UNIQUE,
    user_id BINARY(16) NOT NULL,
    total_amount DECIMAL(15, 2) NOT NULL,
    shipping_fee DECIMAL(15, 2) DEFAULT 0.00,
    discount_amount DECIMAL(15, 2) DEFAULT 0.00,
    final_amount DECIMAL(15, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    receiver_name VARCHAR(255) NOT NULL,
    receiver_phone VARCHAR(20) NOT NULL,
    shipping_address VARCHAR(500) NOT NULL,
    note TEXT NULL,
    version BIGINT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (order_id),
    CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS order_details (
    order_detail_id BINARY(16) NOT NULL,
    order_id BINARY(16) NOT NULL,
    product_id BINARY(16) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    total_price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (order_detail_id),
    CONSTRAINT fk_order_details_order FOREIGN KEY (order_id) REFERENCES orders (order_id) ON DELETE CASCADE,
    CONSTRAINT fk_order_details_product FOREIGN KEY (product_id) REFERENCES products (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS carts (
    cart_id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (cart_id),
    CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cart_items (
    cart_item_id BINARY(16) NOT NULL,
    cart_id BINARY(16) NOT NULL,
    product_id BINARY(16) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (cart_item_id),
    UNIQUE KEY uk_cart_product (cart_id, product_id),
    CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts (cart_id) ON DELETE CASCADE,
    CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 7. Reviews (Product Reviews)
CREATE TABLE IF NOT EXISTS reviews (
    review_id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    product_id BINARY(16) NULL,
    rating INT DEFAULT 5,
    review_content TEXT NULL,
    type VARCHAR(50) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (review_id),
    CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 8. Payments & Payment Transactions
CREATE TABLE IF NOT EXISTS payments (
    payment_id BINARY(16) NOT NULL,
    payment_code VARCHAR(100) NULL,
    amount DECIMAL(15, 2) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    payment_method VARCHAR(50) NOT NULL,
    user_id BINARY(16) NOT NULL,
    booking_id BINARY(16) NULL,
    salon_id BINARY(16) NULL,
    version INT DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_id),
    CONSTRAINT fk_payments_user FOREIGN KEY (user_id) REFERENCES users (user_id),
    CONSTRAINT fk_payments_booking FOREIGN KEY (booking_id) REFERENCES bookings (booking_id),
    CONSTRAINT fk_payments_salon FOREIGN KEY (salon_id) REFERENCES salons (salon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_transactions (
    payment_transaction_id BINARY(16) NOT NULL,
    transaction_ref VARCHAR(255) NOT NULL UNIQUE,
    gateway_transaction_no VARCHAR(255) NULL,
    method VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL,
    amount DECIMAL(15, 2) NULL,
    bank_code VARCHAR(50) NULL,
    gateway_payload TEXT NULL,
    payment_id BINARY(16) NOT NULL,
    version INT DEFAULT 0,
    expired_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (payment_transaction_id),
    CONSTRAINT fk_transactions_payment FOREIGN KEY (payment_id) REFERENCES payments (payment_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 9. Notifications, Media, Bank Info, ShedLock
CREATE TABLE IF NOT EXISTS notifications (
    id BINARY(16) NOT NULL,
    salon_id BINARY(16) NULL,
    user_id BINARY(16) NOT NULL,
    booking_id BINARY(16) NULL,
    title VARCHAR(255) NULL,
    message TEXT NULL,
    type VARCHAR(50) NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    expired_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS media (
    id BINARY(16) NOT NULL,
    owner_type VARCHAR(30) NOT NULL,
    owner_id BINARY(16) NOT NULL,
    public_id VARCHAR(500) NOT NULL UNIQUE,
    secure_url VARCHAR(1000) NOT NULL,
    resource_type VARCHAR(30) NOT NULL,
    format VARCHAR(30) NULL,
    original_filename VARCHAR(500) NULL,
    file_size BIGINT NULL,
    width INT NULL,
    height INT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INT NOT NULL DEFAULT 0,
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_media_owner (owner_type, owner_id),
    INDEX idx_media_public_id (public_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS bank_transfer_info (
    bank_transfer_infor_id BINARY(16) NOT NULL,
    bank_name VARCHAR(100) NULL,
    account_name VARCHAR(100) NULL,
    account_number VARCHAR(50) NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (bank_transfer_infor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS shedlock (
    name VARCHAR(64) NOT NULL,
    lock_until TIMESTAMP(3) NOT NULL,
    locked_at TIMESTAMP(3) NOT NULL,
    locked_by VARCHAR(255) NOT NULL,
    PRIMARY KEY (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

