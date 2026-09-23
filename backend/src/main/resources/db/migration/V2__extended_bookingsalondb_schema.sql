-- ==============================================================================
-- Flyway Migration V2: Extended BookingSalon Enterprise Schema
-- Database: MySQL 8.0+
-- Tối ưu hóa: Mỗi bảng có ít nhất 20 trường dữ liệu (>= 20 fields)
-- Tích hợp Keycloak IAM: users & stylists không lưu username / password_hash
-- Hỗ trợ phân loại trạng thái Booking cho User & Stylist
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------------------------
-- 1. NÂNG CẤP BẢNG: users (Khách hàng - 23 trường)
-- ------------------------------------------------------------------------------
SET @drop_user_idx = (
    SELECT IF(
        EXISTS (
            SELECT 1 FROM information_schema.statistics 
            WHERE table_schema = DATABASE() AND table_name = 'users' AND index_name = 'username'
        ),
        'ALTER TABLE users DROP INDEX username',
        'SELECT 1'
    )
);
PREPARE stmt_user FROM @drop_user_idx;
EXECUTE stmt_user;
DEALLOCATE PREPARE stmt_user;

ALTER TABLE users MODIFY COLUMN username VARCHAR(100) NULL;

ALTER TABLE users
    ADD COLUMN gender VARCHAR(10) NOT NULL DEFAULT 'OTHER' AFTER phone_number,
    ADD COLUMN city VARCHAR(100) NULL AFTER address,
    ADD COLUMN district VARCHAR(100) NULL AFTER city,
    ADD COLUMN ward VARCHAR(100) NULL AFTER district,
    ADD COLUMN membership_tier VARCHAR(30) NOT NULL DEFAULT 'STANDARD' AFTER ward,
    ADD COLUMN voucher_code VARCHAR(50) NULL AFTER membership_tier,
    ADD COLUMN preferred_salon_id BINARY(16) NULL AFTER voucher_code,
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' AFTER preferred_salon_id,
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER status,
    ADD COLUMN phone_verified BOOLEAN NOT NULL DEFAULT FALSE AFTER email_verified,
    ADD COLUMN last_login_at DATETIME NULL AFTER phone_verified,
    ADD COLUMN last_login_ip VARCHAR(45) NULL AFTER last_login_at,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER last_login_ip,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

CREATE INDEX idx_users_keycloak_id ON users (keycloak_id);
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_phone ON users (phone_number);
CREATE INDEX idx_users_status ON users (status, is_deleted);

-- ------------------------------------------------------------------------------
-- 2. NÂNG CẤP BẢNG: stylists (Chuyên gia tạo mẫu tóc - 32 trường)
-- ------------------------------------------------------------------------------
SET @drop_stylist_idx = (
    SELECT IF(
        EXISTS (
            SELECT 1 FROM information_schema.statistics 
            WHERE table_schema = DATABASE() AND table_name = 'stylists' AND index_name = 'username'
        ),
        'ALTER TABLE stylists DROP INDEX username',
        'SELECT 1'
    )
);
PREPARE stmt_stylist FROM @drop_stylist_idx;
EXECUTE stmt_stylist;
DEALLOCATE PREPARE stmt_stylist;

ALTER TABLE stylists MODIFY COLUMN username VARCHAR(100) NULL;

ALTER TABLE stylists
    ADD COLUMN nickname VARCHAR(100) NULL AFTER full_name,
    ADD COLUMN bio TEXT NULL AFTER avatar_url,
    ADD COLUMN experience_years DECIMAL(3,1) NOT NULL DEFAULT 1.0 AFTER bio,
    ADD COLUMN specialties VARCHAR(255) NULL AFTER experience_years,
    ADD COLUMN level_rank VARCHAR(50) NOT NULL DEFAULT 'SENIOR' AFTER specialties,
    ADD COLUMN rating_average DECIMAL(3,2) NOT NULL DEFAULT 5.00 AFTER rating,
    ADD COLUMN total_reviews_count INT NOT NULL DEFAULT 0 AFTER rating_average,
    ADD COLUMN total_served_bookings INT NOT NULL DEFAULT 0 AFTER total_reviews_count,
    ADD COLUMN base_salary DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER salary,
    ADD COLUMN commission_rate DECIMAL(5,2) NOT NULL DEFAULT 10.00 AFTER base_salary,
    ADD COLUMN tip_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER commission_rate,
    ADD COLUMN work_shift_type VARCHAR(50) NOT NULL DEFAULT 'FULL_TIME' AFTER leave_date,
    ADD COLUMN max_parallel_slots INT NOT NULL DEFAULT 1 AFTER work_shift_type,
    ADD COLUMN citizen_id VARCHAR(20) NULL AFTER max_parallel_slots,
    ADD COLUMN bank_account_number VARCHAR(50) NULL AFTER citizen_id,
    ADD COLUMN bank_name VARCHAR(100) NULL AFTER bank_account_number,
    ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE AFTER bank_name,
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' AFTER is_featured,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER status,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

CREATE INDEX idx_stylists_salon ON stylists (salon_id, status, is_deleted);
CREATE INDEX idx_stylists_rating ON stylists (rating_average, total_reviews_count);

-- ------------------------------------------------------------------------------
-- 3. NÂNG CẤP BẢNG: admins (Quản trị viên & Quản lý - 26 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE admins
    ADD COLUMN admin_role VARCHAR(50) NOT NULL DEFAULT 'SALON_MANAGER' AFTER avatar_url,
    ADD COLUMN assigned_salon_id BINARY(16) NULL AFTER admin_role,
    ADD COLUMN department VARCHAR(100) NULL AFTER assigned_salon_id,
    ADD COLUMN employee_code VARCHAR(50) NULL AFTER department,
    ADD COLUMN citizen_id VARCHAR(20) NULL AFTER employee_code,
    ADD COLUMN emergency_contact_phone VARCHAR(20) NULL AFTER address,
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' AFTER emergency_contact_phone,
    ADD COLUMN is_two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE AFTER status,
    ADD COLUMN two_factor_secret VARCHAR(255) NULL AFTER is_two_factor_enabled,
    ADD COLUMN last_login_at DATETIME NULL AFTER two_factor_secret,
    ADD COLUMN last_login_ip VARCHAR(45) NULL AFTER last_login_at,
    ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0 AFTER last_login_ip,
    ADD COLUMN lockout_until DATETIME NULL AFTER failed_login_attempts,
    ADD COLUMN permissions_cache JSON NULL AFTER lockout_until,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER permissions_cache,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 4. NÂNG CẤP BẢNG: salons (Chi nhánh Salon - 31 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE salons
    ADD COLUMN salon_code VARCHAR(50) NULL AFTER salon_id,
    ADD COLUMN slug VARCHAR(255) NULL AFTER salon_name,
    ADD COLUMN hotline VARCHAR(20) NULL AFTER phone_number,
    ADD COLUMN address_line VARCHAR(255) NULL AFTER salon_address,
    ADD COLUMN ward VARCHAR(100) NULL AFTER address_line,
    ADD COLUMN district VARCHAR(100) NULL AFTER ward,
    ADD COLUMN latitude DECIMAL(10,8) NULL AFTER city,
    ADD COLUMN longitude DECIMAL(11,8) NULL AFTER latitude,
    ADD COLUMN google_map_embed_url TEXT NULL AFTER longitude,
    ADD COLUMN slot_interval_minutes INT NOT NULL DEFAULT 30 AFTER close_time,
    ADD COLUMN capacity_seats INT NOT NULL DEFAULT 10 AFTER slot_interval_minutes,
    ADD COLUMN rating_average DECIMAL(3,2) NOT NULL DEFAULT 5.00 AFTER capacity_seats,
    ADD COLUMN total_reviews_count INT NOT NULL DEFAULT 0 AFTER rating_average,
    ADD COLUMN amenities JSON NULL AFTER total_reviews_count,
    ADD COLUMN description TEXT NULL AFTER amenities,
    ADD COLUMN cover_image_url VARCHAR(500) NULL AFTER description,
    ADD COLUMN manager_name VARCHAR(150) NULL AFTER cover_image_url,
    ADD COLUMN manager_phone VARCHAR(20) NULL AFTER manager_name,
    ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE AFTER manager_phone,
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' AFTER is_featured,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER status,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 5. NÂNG CẤP BẢNG: categories (Danh mục dịch vụ - 23 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE categories
    ADD COLUMN category_code VARCHAR(50) NULL AFTER category_id,
    ADD COLUMN slug VARCHAR(255) NULL AFTER category_name,
    ADD COLUMN description TEXT NULL AFTER slug,
    ADD COLUMN parent_category_id BINARY(16) NULL AFTER description,
    ADD COLUMN image_url VARCHAR(500) NULL AFTER parent_category_id,
    ADD COLUMN banner_url VARCHAR(500) NULL AFTER image_url,
    ADD COLUMN icon_class VARCHAR(100) NULL AFTER banner_url,
    ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER icon_class,
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER sort_order,
    ADD COLUMN is_popular BOOLEAN NOT NULL DEFAULT FALSE AFTER is_active,
    ADD COLUMN target_gender VARCHAR(20) NOT NULL DEFAULT 'ALL' AFTER is_popular,
    ADD COLUMN meta_title VARCHAR(255) NULL AFTER target_gender,
    ADD COLUMN meta_description VARCHAR(500) NULL AFTER meta_title,
    ADD COLUMN meta_keywords VARCHAR(255) NULL AFTER meta_description,
    ADD COLUMN total_services_count INT NOT NULL DEFAULT 0 AFTER meta_keywords,
    ADD COLUMN applied_vat_percent DECIMAL(4,2) NOT NULL DEFAULT 8.00 AFTER total_services_count,
    ADD COLUMN highlight_badge VARCHAR(50) NULL AFTER applied_vat_percent,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER highlight_badge,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 6. NÂNG CẤP BẢNG: service_offerings (Dịch vụ Salon - 28 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE service_offerings
    ADD COLUMN service_code VARCHAR(50) NULL AFTER service_offering_id,
    ADD COLUMN slug VARCHAR(255) NULL AFTER name,
    ADD COLUMN short_description VARCHAR(500) NULL AFTER slug,
    ADD COLUMN base_price DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER description,
    ADD COLUMN promotional_price DECIMAL(15,2) NULL AFTER base_price,
    ADD COLUMN duration_minutes INT NOT NULL DEFAULT 45 AFTER duration,
    ADD COLUMN buffer_time_minutes INT NOT NULL DEFAULT 5 AFTER duration_minutes,
    ADD COLUMN image_url VARCHAR(500) NULL AFTER image,
    ADD COLUMN gallery_urls JSON NULL AFTER image_url,
    ADD COLUMN review_count INT NOT NULL DEFAULT 0 AFTER rating,
    ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE AFTER review_count,
    ADD COLUMN is_combo BOOLEAN NOT NULL DEFAULT FALSE AFTER is_featured,
    ADD COLUMN combo_steps JSON NULL AFTER is_combo,
    ADD COLUMN required_skill_level VARCHAR(50) NOT NULL DEFAULT 'JUNIOR' AFTER combo_steps,
    ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER required_skill_level,
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' AFTER sort_order,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER deleted_at,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 7. NÂNG CẤP BẢNG: stylist_services (Phân công kỹ năng Stylist - 21 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE stylist_services
    ADD COLUMN proficiency_level VARCHAR(50) NOT NULL DEFAULT 'PROFICIENT' AFTER service_offering_id,
    ADD COLUMN custom_duration_minutes INT NULL AFTER proficiency_level,
    ADD COLUMN custom_price_surcharge DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER custom_duration_minutes,
    ADD COLUMN is_enabled BOOLEAN NOT NULL DEFAULT TRUE AFTER custom_price_surcharge,
    ADD COLUMN times_performed INT NOT NULL DEFAULT 0 AFTER is_enabled,
    ADD COLUMN rating_score DECIMAL(3,2) NOT NULL DEFAULT 5.00 AFTER times_performed,
    ADD COLUMN feedback_positive_rate DECIMAL(5,2) NOT NULL DEFAULT 100.00 AFTER rating_score,
    ADD COLUMN certified_date DATE NULL AFTER feedback_positive_rate,
    ADD COLUMN trainer_evaluator_id BINARY(16) NULL AFTER certified_date,
    ADD COLUMN approval_status VARCHAR(30) NOT NULL DEFAULT 'APPROVED' AFTER trainer_evaluator_id,
    ADD COLUMN commission_percentage DECIMAL(5,2) NOT NULL DEFAULT 10.00 AFTER approval_status,
    ADD COLUMN fixed_bonus_per_service DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER commission_percentage,
    ADD COLUMN max_daily_capacity INT NOT NULL DEFAULT 15 AFTER fixed_bonus_per_service,
    ADD COLUMN notes VARCHAR(500) NULL AFTER max_daily_capacity,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER notes,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 8. NÂNG CẤP BẢNG: bookings (Phiếu đặt hẹn - 33 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE bookings
    ADD COLUMN booking_code VARCHAR(50) NULL AFTER booking_id,
    ADD COLUMN customer_name VARCHAR(255) NULL AFTER stylist_id,
    ADD COLUMN customer_phone VARCHAR(20) NULL AFTER customer_name,
    ADD COLUMN customer_email VARCHAR(150) NULL AFTER customer_phone,
    ADD COLUMN actual_checkin_time DATETIME NULL AFTER end_time,
    ADD COLUMN actual_checkout_time DATETIME NULL AFTER actual_checkin_time,
    ADD COLUMN subtotal_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER status,
    ADD COLUMN discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER subtotal_amount,
    ADD COLUMN voucher_code VARCHAR(50) NULL AFTER discount_amount,
    ADD COLUMN loyalty_points_used INT NOT NULL DEFAULT 0 AFTER voucher_code,
    ADD COLUMN loyalty_points_discount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER loyalty_points_used,
    ADD COLUMN payment_status VARCHAR(30) NOT NULL DEFAULT 'UNPAID' AFTER total_amount,
    ADD COLUMN payment_method VARCHAR(50) NOT NULL DEFAULT 'CASH' AFTER payment_status,
    ADD COLUMN seat_chair_number VARCHAR(20) NULL AFTER payment_method,
    ADD COLUMN cancellation_reason VARCHAR(500) NULL AFTER seat_chair_number,
    ADD COLUMN cancelled_by VARCHAR(50) NULL AFTER cancellation_reason,
    ADD COLUMN cancelled_at DATETIME NULL AFTER cancelled_by,
    ADD COLUMN customer_notes TEXT NULL AFTER cancelled_at,
    ADD COLUMN stylist_notes TEXT NULL AFTER customer_notes,
    ADD COLUMN is_reviewed BOOLEAN NOT NULL DEFAULT FALSE AFTER stylist_notes,
    ADD COLUMN booking_source VARCHAR(30) NOT NULL DEFAULT 'WEB' AFTER is_reviewed,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- Index quan trọng cho việc lọc theo Tab User & Tab Stylist
CREATE INDEX idx_bookings_user_status ON bookings (user_id, status, is_deleted);
CREATE INDEX idx_bookings_stylist_status ON bookings (stylist_id, status, is_deleted);
CREATE INDEX idx_bookings_stylist_schedule ON bookings (stylist_id, start_time, end_time, status, is_deleted);
CREATE INDEX idx_bookings_salon_timeline ON bookings (salon_id, start_time, status);

-- ------------------------------------------------------------------------------
-- 9. NÂNG CẤP BẢNG: booking_details (Chi tiết dịch vụ - 23 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE booking_details
    ADD COLUMN service_name_snapshot VARCHAR(255) NULL AFTER service_offering_id,
    ADD COLUMN discount_price DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER current_price,
    ADD COLUMN final_price DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER discount_price,
    ADD COLUMN duration_minutes INT NOT NULL DEFAULT 30 AFTER final_price,
    ADD COLUMN step_order INT NOT NULL DEFAULT 1 AFTER duration_minutes,
    ADD COLUMN assistant_stylist_id BINARY(16) NULL AFTER step_order,
    ADD COLUMN service_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' AFTER assistant_stylist_id,
    ADD COLUMN service_start_time DATETIME NULL AFTER service_status,
    ADD COLUMN service_end_time DATETIME NULL AFTER service_start_time,
    ADD COLUMN commission_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER service_end_time,
    ADD COLUMN assistant_commission_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER commission_amount,
    ADD COLUMN chemical_formula_used VARCHAR(500) NULL AFTER assistant_commission_amount,
    ADD COLUMN customer_feedback_snippet VARCHAR(255) NULL AFTER chemical_formula_used,
    ADD COLUMN extra_charges DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER customer_feedback_snippet,
    ADD COLUMN extra_charges_reason VARCHAR(255) NULL AFTER extra_charges,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER extra_charges_reason,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 10. NÂNG CẤP BẢNG: product_categories (Danh mục sản phẩm - 23 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE product_categories
    ADD COLUMN category_code VARCHAR(50) NULL AFTER category_id,
    ADD COLUMN parent_id BINARY(16) NULL AFTER slug,
    ADD COLUMN banner_url VARCHAR(500) NULL AFTER image_url,
    ADD COLUMN icon_class VARCHAR(100) NULL AFTER banner_url,
    ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER icon_class,
    ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER sort_order,
    ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE AFTER is_active,
    ADD COLUMN meta_title VARCHAR(255) NULL AFTER is_featured,
    ADD COLUMN meta_description VARCHAR(500) NULL AFTER meta_title,
    ADD COLUMN meta_keywords VARCHAR(255) NULL AFTER meta_description,
    ADD COLUMN total_products_count INT NOT NULL DEFAULT 0 AFTER meta_keywords,
    ADD COLUMN display_layout VARCHAR(50) NOT NULL DEFAULT 'GRID' AFTER total_products_count,
    ADD COLUMN badge_label VARCHAR(50) NULL AFTER display_layout,
    ADD COLUMN default_vat_rate DECIMAL(4,2) NOT NULL DEFAULT 10.00 AFTER badge_label,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER default_vat_rate,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 11. NÂNG CẤP BẢNG: products (Sản phẩm shop - 33 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE products
    ADD COLUMN sku VARCHAR(50) NULL AFTER product_id,
    ADD COLUMN barcode VARCHAR(50) NULL AFTER sku,
    ADD COLUMN brand VARCHAR(100) NULL AFTER slug,
    ADD COLUMN short_description VARCHAR(500) NULL AFTER brand,
    ADD COLUMN ingredients TEXT NULL AFTER description,
    ADD COLUMN usage_instructions TEXT NULL AFTER ingredients,
    ADD COLUMN cost_price DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER usage_instructions,
    ADD COLUMN low_stock_threshold INT NOT NULL DEFAULT 5 AFTER stock_quantity,
    ADD COLUMN weight_grams INT NOT NULL DEFAULT 100 AFTER image_url,
    ADD COLUMN volume_ml INT NULL AFTER weight_grams,
    ADD COLUMN origin_country VARCHAR(100) NOT NULL DEFAULT 'Vietnam' AFTER volume_ml,
    ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE AFTER active,
    ADD COLUMN is_bestseller BOOLEAN NOT NULL DEFAULT FALSE AFTER is_featured,
    ADD COLUMN meta_title VARCHAR(255) NULL AFTER is_bestseller,
    ADD COLUMN meta_description VARCHAR(500) NULL AFTER meta_title,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER meta_description,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER deleted_at;

-- ------------------------------------------------------------------------------
-- 12. NÂNG CẤP BẢNG: carts (Giỏ hàng - 23 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE carts
    ADD COLUMN session_token VARCHAR(255) NULL AFTER user_id,
    ADD COLUMN total_items_count INT NOT NULL DEFAULT 0 AFTER session_token,
    ADD COLUMN total_quantity INT NOT NULL DEFAULT 0 AFTER total_items_count,
    ADD COLUMN subtotal_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER total_quantity,
    ADD COLUMN applied_coupon_code VARCHAR(50) NULL AFTER subtotal_amount,
    ADD COLUMN coupon_discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER applied_coupon_code,
    ADD COLUMN estimated_shipping_fee DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER coupon_discount_amount,
    ADD COLUMN estimated_total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER estimated_shipping_fee,
    ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'VND' AFTER estimated_total_amount,
    ADD COLUMN cart_status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE' AFTER currency,
    ADD COLUMN last_item_added_at DATETIME NULL AFTER cart_status,
    ADD COLUMN abandoned_email_sent BOOLEAN NOT NULL DEFAULT FALSE AFTER last_item_added_at,
    ADD COLUMN abandoned_email_sent_at DATETIME NULL AFTER abandoned_email_sent,
    ADD COLUMN recovery_token VARCHAR(255) NULL AFTER abandoned_email_sent_at,
    ADD COLUMN notes VARCHAR(500) NULL AFTER recovery_token,
    ADD COLUMN ip_address VARCHAR(45) NULL AFTER notes,
    ADD COLUMN user_agent VARCHAR(500) NULL AFTER ip_address,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER user_agent,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 13. NÂNG CẤP BẢNG: cart_items (Mặt hàng trong giỏ - 22 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE cart_items
    ADD COLUMN sku_snapshot VARCHAR(50) NULL AFTER product_id,
    ADD COLUMN product_name_snapshot VARCHAR(255) NULL AFTER sku_snapshot,
    ADD COLUMN product_image_snapshot VARCHAR(500) NULL AFTER product_name_snapshot,
    ADD COLUMN original_unit_price DECIMAL(15,2) NULL AFTER unit_price,
    ADD COLUMN discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER original_unit_price,
    ADD COLUMN total_price DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER discount_amount,
    ADD COLUMN is_selected BOOLEAN NOT NULL DEFAULT TRUE AFTER total_price,
    ADD COLUMN is_available_in_stock BOOLEAN NOT NULL DEFAULT TRUE AFTER is_selected,
    ADD COLUMN available_stock_snapshot INT NOT NULL DEFAULT 0 AFTER is_available_in_stock,
    ADD COLUMN weight_grams_total INT NOT NULL DEFAULT 0 AFTER available_stock_snapshot,
    ADD COLUMN gift_note VARCHAR(255) NULL AFTER weight_grams_total,
    ADD COLUMN sort_order INT NOT NULL DEFAULT 0 AFTER gift_note,
    ADD COLUMN custom_attributes JSON NULL AFTER sort_order,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER custom_attributes,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 14. NÂNG CẤP BẢNG: orders (Đơn hàng sản phẩm - 34 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE orders
    ADD COLUMN receiver_email VARCHAR(150) NULL AFTER receiver_phone,
    ADD COLUMN shipping_city VARCHAR(100) NULL AFTER shipping_address,
    ADD COLUMN shipping_district VARCHAR(100) NULL AFTER shipping_city,
    ADD COLUMN shipping_ward VARCHAR(100) NULL AFTER shipping_district,
    ADD COLUMN coupon_code VARCHAR(50) NULL AFTER discount_amount,
    ADD COLUMN loyalty_points_used INT NOT NULL DEFAULT 0 AFTER coupon_code,
    ADD COLUMN loyalty_points_discount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER loyalty_points_used,
    ADD COLUMN tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER loyalty_points_discount,
    ADD COLUMN paid_at DATETIME NULL AFTER payment_status,
    ADD COLUMN shipping_carrier VARCHAR(100) NULL AFTER status,
    ADD COLUMN tracking_code VARCHAR(100) NULL AFTER shipping_carrier,
    ADD COLUMN shipped_at DATETIME NULL AFTER tracking_code,
    ADD COLUMN delivered_at DATETIME NULL AFTER shipped_at,
    ADD COLUMN cancelled_at DATETIME NULL AFTER delivered_at,
    ADD COLUMN cancellation_reason VARCHAR(500) NULL AFTER cancelled_at,
    ADD COLUMN customer_note TEXT NULL AFTER note,
    ADD COLUMN internal_admin_note TEXT NULL AFTER customer_note,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 15. NÂNG CẤP BẢNG: order_details (Chi tiết đơn hàng - 24 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE order_details
    ADD COLUMN sku_snapshot VARCHAR(50) NULL AFTER product_id,
    ADD COLUMN product_name_snapshot VARCHAR(255) NULL AFTER sku_snapshot,
    ADD COLUMN product_image_snapshot VARCHAR(500) NULL AFTER product_name_snapshot,
    ADD COLUMN category_name_snapshot VARCHAR(100) NULL AFTER product_image_snapshot,
    ADD COLUMN original_unit_price DECIMAL(15,2) NULL AFTER unit_price,
    ADD COLUMN cost_price_snapshot DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER original_unit_price,
    ADD COLUMN discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER cost_price_snapshot,
    ADD COLUMN vat_percent DECIMAL(4,2) NOT NULL DEFAULT 10.00 AFTER total_price,
    ADD COLUMN vat_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER vat_percent,
    ADD COLUMN is_gift BOOLEAN NOT NULL DEFAULT FALSE AFTER vat_amount,
    ADD COLUMN is_reviewed BOOLEAN NOT NULL DEFAULT FALSE AFTER is_gift,
    ADD COLUMN return_status VARCHAR(30) NOT NULL DEFAULT 'NONE' AFTER is_reviewed,
    ADD COLUMN return_quantity INT NOT NULL DEFAULT 0 AFTER return_status,
    ADD COLUMN return_reason VARCHAR(255) NULL AFTER return_quantity,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER return_reason,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 16. NÂNG CẤP BẢNG: payments (Quản lý thanh toán - 26 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE payments
    ADD COLUMN payment_target_type VARCHAR(30) NOT NULL DEFAULT 'BOOKING' AFTER user_id,
    ADD COLUMN order_id BINARY(16) NULL AFTER booking_id,
    ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'VND' AFTER amount,
    ADD COLUMN paid_at DATETIME NULL AFTER status,
    ADD COLUMN expired_at DATETIME NULL AFTER paid_at,
    ADD COLUMN cashier_admin_id BINARY(16) NULL AFTER expired_at,
    ADD COLUMN received_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER cashier_admin_id,
    ADD COLUMN change_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER received_amount,
    ADD COLUMN tax_invoice_requested BOOLEAN NOT NULL DEFAULT FALSE AFTER change_amount,
    ADD COLUMN tax_code VARCHAR(50) NULL AFTER tax_invoice_requested,
    ADD COLUMN company_name VARCHAR(255) NULL AFTER tax_code,
    ADD COLUMN company_address VARCHAR(500) NULL AFTER company_name,
    ADD COLUMN invoice_pdf_url VARCHAR(500) NULL AFTER company_address,
    ADD COLUMN notes TEXT NULL AFTER invoice_pdf_url,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 17. NÂNG CẤP BẢNG: payment_transactions (Giao dịch cổng - 25 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE payment_transactions
    ADD COLUMN gateway_provider VARCHAR(50) NOT NULL DEFAULT 'VNPAY' AFTER method,
    ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'VND' AFTER amount,
    ADD COLUMN bank_tran_no VARCHAR(100) NULL AFTER bank_code,
    ADD COLUMN card_type VARCHAR(50) NULL AFTER bank_tran_no,
    ADD COLUMN gateway_response_code VARCHAR(50) NULL AFTER card_type,
    ADD COLUMN gateway_response_message VARCHAR(255) NULL AFTER gateway_response_code,
    ADD COLUMN client_ip VARCHAR(45) NULL AFTER gateway_response_message,
    ADD COLUMN gateway_request_payload TEXT NULL AFTER client_ip,
    ADD COLUMN gateway_response_payload TEXT NULL AFTER gateway_request_payload,
    ADD COLUMN webhook_received_at DATETIME NULL AFTER gateway_response_payload,
    ADD COLUMN is_reconciled BOOLEAN NOT NULL DEFAULT FALSE AFTER webhook_received_at,
    ADD COLUMN reconciled_at DATETIME NULL AFTER is_reconciled,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 18. NÂNG CẤP BẢNG: bank_transfer_info (Tài khoản ngân hàng - 23 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE bank_transfer_info
    ADD COLUMN bank_code VARCHAR(50) NULL AFTER bank_transfer_infor_id,
    ADD COLUMN bank_short_name VARCHAR(50) NULL AFTER bank_name,
    ADD COLUMN bin_code VARCHAR(20) NULL AFTER bank_short_name,
    ADD COLUMN branch_name VARCHAR(150) NULL AFTER account_number,
    ADD COLUMN salon_id BINARY(16) NULL AFTER branch_name,
    ADD COLUMN qr_template VARCHAR(50) NOT NULL DEFAULT 'compact2' AFTER salon_id,
    ADD COLUMN currency VARCHAR(10) NOT NULL DEFAULT 'VND' AFTER qr_template,
    ADD COLUMN transfer_content_prefix VARCHAR(50) NOT NULL DEFAULT 'SALON' AFTER currency,
    ADD COLUMN daily_limit_amount DECIMAL(15,2) NOT NULL DEFAULT 500000000.00 AFTER transfer_content_prefix,
    ADD COLUMN current_balance DECIMAL(15,2) NOT NULL DEFAULT 0.00 AFTER daily_limit_amount,
    ADD COLUMN is_default BOOLEAN NOT NULL DEFAULT FALSE AFTER current_balance,
    ADD COLUMN webhook_url VARCHAR(500) NULL AFTER active,
    ADD COLUMN api_key_ref VARCHAR(255) NULL AFTER webhook_url,
    ADD COLUMN notes TEXT NULL AFTER api_key_ref,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER notes,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 19. NÂNG CẤP BẢNG: reviews (Đánh giá & Nhận xét - 26 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE reviews
    ADD COLUMN review_target_type VARCHAR(30) NOT NULL DEFAULT 'SERVICE' AFTER user_id,
    ADD COLUMN service_offering_id BINARY(16) NULL AFTER product_id,
    ADD COLUMN stylist_id BINARY(16) NULL AFTER service_offering_id,
    ADD COLUMN salon_id BINARY(16) NULL AFTER stylist_id,
    ADD COLUMN booking_id BINARY(16) NULL AFTER salon_id,
    ADD COLUMN order_id BINARY(16) NULL AFTER booking_id,
    ADD COLUMN title VARCHAR(255) NULL AFTER rating,
    ADD COLUMN media_gallery_urls JSON NULL AFTER review_content,
    ADD COLUMN is_verified_purchase BOOLEAN NOT NULL DEFAULT TRUE AFTER media_gallery_urls,
    ADD COLUMN helpful_count INT NOT NULL DEFAULT 0 AFTER is_verified_purchase,
    ADD COLUMN unhelpful_count INT NOT NULL DEFAULT 0 AFTER helpful_count,
    ADD COLUMN admin_reply_content TEXT NULL AFTER unhelpful_count,
    ADD COLUMN admin_replied_by BINARY(16) NULL AFTER admin_reply_content,
    ADD COLUMN admin_replied_at DATETIME NULL AFTER admin_replied_by,
    ADD COLUMN status VARCHAR(30) NOT NULL DEFAULT 'APPROVED' AFTER admin_replied_at,
    ADD COLUMN is_featured BOOLEAN NOT NULL DEFAULT FALSE AFTER status,
    ADD COLUMN sentiment_tag VARCHAR(50) NULL AFTER is_featured,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER sentiment_tag,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 20. NÂNG CẤP BẢNG: notifications (Thông báo hệ thống - 24 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE notifications
    ADD COLUMN notification_code VARCHAR(100) NULL AFTER id,
    ADD COLUMN order_id BINARY(16) NULL AFTER booking_id,
    ADD COLUMN category VARCHAR(50) NOT NULL DEFAULT 'TRANSACTIONAL' AFTER type,
    ADD COLUMN channel VARCHAR(50) NOT NULL DEFAULT 'IN_APP' AFTER category,
    ADD COLUMN priority VARCHAR(20) NOT NULL DEFAULT 'NORMAL' AFTER channel,
    ADD COLUMN action_url VARCHAR(500) NULL AFTER priority,
    ADD COLUMN icon_url VARCHAR(500) NULL AFTER action_url,
    ADD COLUMN read_at DATETIME NULL AFTER is_read,
    ADD COLUMN delivery_status VARCHAR(30) NOT NULL DEFAULT 'DELIVERED' AFTER read_at,
    ADD COLUMN retry_count INT NOT NULL DEFAULT 0 AFTER delivery_status,
    ADD COLUMN fcm_message_id VARCHAR(255) NULL AFTER retry_count,
    ADD COLUMN metadata_payload JSON NULL AFTER expired_at,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER metadata_payload;

-- ------------------------------------------------------------------------------
-- 21. NÂNG CẤP BẢNG: media (Quản lý đa phương tiện - 25 trường)
-- ------------------------------------------------------------------------------
ALTER TABLE media
    ADD COLUMN thumbnail_url VARCHAR(1000) NULL AFTER secure_url,
    ADD COLUMN mime_type VARCHAR(100) NULL AFTER format,
    ADD COLUMN aspect_ratio DECIMAL(5,2) NULL AFTER height,
    ADD COLUMN alt_text VARCHAR(255) NULL AFTER aspect_ratio,
    ADD COLUMN caption VARCHAR(500) NULL AFTER alt_text,
    ADD COLUMN storage_provider VARCHAR(50) NOT NULL DEFAULT 'CLOUDINARY' AFTER status,
    ADD COLUMN folder_path VARCHAR(255) NULL AFTER storage_provider,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER folder_path,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;

-- ------------------------------------------------------------------------------
-- 22. TẠO MỚI BẢNG: vouchers (Mã ưu đãi & Khuyến mãi - 24 trường)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vouchers (
    voucher_id BINARY(16) NOT NULL,
    voucher_code VARCHAR(50) NOT NULL,
    voucher_name VARCHAR(255) NOT NULL,
    description TEXT NULL,
    discount_type VARCHAR(30) NOT NULL,
    discount_value DECIMAL(15, 2) NOT NULL,
    max_discount_amount DECIMAL(15, 2) NULL,
    min_order_amount DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    applicable_scope VARCHAR(30) NOT NULL DEFAULT 'ALL',
    salon_id BINARY(16) NULL,
    usage_limit_total INT NOT NULL DEFAULT 1000,
    usage_limit_per_user INT NOT NULL DEFAULT 1,
    used_count INT NOT NULL DEFAULT 0,
    start_date DATETIME NOT NULL,
    end_date DATETIME NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    banner_image_url VARCHAR(500) NULL,
    min_membership_tier VARCHAR(30) NOT NULL DEFAULT 'STANDARD',
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    terms_and_conditions TEXT NULL,
    version BIGINT NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (voucher_id),
    UNIQUE KEY uk_vouchers_code (voucher_code),
    INDEX idx_vouchers_active (is_active, start_date, end_date, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
