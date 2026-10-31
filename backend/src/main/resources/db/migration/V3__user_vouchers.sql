-- ==============================================================================
-- V3__user_vouchers.sql
-- Bổ sung bảng user_vouchers và khởi tạo dữ liệu mẫu cho hệ thống Voucher
-- ==============================================================================

SET FOREIGN_KEY_CHECKS = 0;

CREATE TABLE IF NOT EXISTS user_vouchers (
    id BINARY(16) NOT NULL,
    user_id BINARY(16) NOT NULL,
    voucher_id BINARY(16) NOT NULL,
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at DATETIME NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_user_vouchers_user (user_id),
    INDEX idx_user_vouchers_voucher (voucher_id),
    CONSTRAINT fk_user_vouchers_user FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
    CONSTRAINT fk_user_vouchers_voucher FOREIGN KEY (voucher_id) REFERENCES vouchers (voucher_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Khởi tạo các Voucher công khai mẫu cho người dùng trải nghiệm
INSERT INTO vouchers (
    voucher_id, voucher_code, voucher_name, description, discount_type, discount_value, max_discount_amount, min_order_amount, start_date, end_date, is_active, is_public, used_count, usage_limit_total
) VALUES 
(
    UUID_TO_BIN(UUID()), 'CHAOBANMOI', 'Ưu đãi Bạn mới trải nghiệm', 'Giảm 20% tổng hóa đơn (tối đa 100.000đ) cho khách hàng lần đầu đặt lịch', 'PERCENT', 20.00, 100000.00, 50000.00, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE, TRUE, 0, 5000
),
(
    UUID_TO_BIN(UUID()), 'SALON50K', 'Giảm 50K dịch vụ Combo', 'Giảm ngay 50.000đ trực tiếp vào đơn đặt lịch từ 150.000đ', 'FIXED_AMOUNT', 50000.00, 50000.00, 150000.00, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE, TRUE, 0, 2000
),
(
    UUID_TO_BIN(UUID()), 'VIP100K', 'Tri ân khách hàng thân thiết VIP', 'Giảm 100.000đ trực tiếp cho hóa đơn dịch vụ cao cấp từ 300.000đ', 'FIXED_AMOUNT', 100000.00, 100000.00, 300000.00, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE, TRUE, 0, 1000
),
(
    UUID_TO_BIN(UUID()), 'WEEKEND10', 'Ưu đãi cuối tuần bùng nổ', 'Giảm 10% tối đa 50.000đ khi đặt lịch cắt gội cuối tuần', 'PERCENT', 10.00, 50000.00, 100000.00, NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR), TRUE, TRUE, 0, 3000
)
ON DUPLICATE KEY UPDATE updated_at = CURRENT_TIMESTAMP;

SET FOREIGN_KEY_CHECKS = 1;

