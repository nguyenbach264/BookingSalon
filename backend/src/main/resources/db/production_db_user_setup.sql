-- ============================================================================
-- SCRIPT THIẾT LẬP TÀI KHOẢN DATABASE CHUẨN PRODUCTION (LEAST PRIVILEGE)
-- Thay thế hoàn toàn việc sử dụng tài khoản `root` cho ứng dụng BookingSalon
-- ============================================================================

-- BƯỚC 1: Đảm bảo database tồn tại với bảng mã UTF8MB4
CREATE DATABASE IF NOT EXISTS `bookingsalondb`
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

-- BƯỚC 2: Tạo User ứng dụng runtime (chỉ cho phép kết nối nội bộ hoặc dải IP VPC)
-- THAY THẾ '<STRONG_RANDOM_PASSWORD>' BẰNG MẬT KHẨU MẠNH (Tối thiểu 24 ký tự)
CREATE USER IF NOT EXISTS 'bookingsalon_app'@'%' IDENTIFIED BY '<STRONG_RANDOM_PASSWORD>';

-- BƯỚC 3: Phân quyền nghiệp vụ (DML + DDL cho Flyway migration nếu chạy cùng app)
-- Trong kiến trúc Spring Boot có kích hoạt Flyway:
GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES, DROP 
ON `bookingsalondb`.* TO 'bookingsalon_app'@'%';

-- Nếu tách biệt User Migration (Flyway CI/CD) và User Runtime thông thường:
-- 1. User Runtime (chỉ đọc & ghi dữ liệu):
-- GRANT SELECT, INSERT, UPDATE, DELETE ON `bookingsalondb`.* TO 'bookingsalon_app'@'%';
-- 2. User Migration (chạy script DDL khi deploy):
-- CREATE USER IF NOT EXISTS 'bookingsalon_migrator'@'%' IDENTIFIED BY '<MIGRATOR_STRONG_PASSWORD>';
-- GRANT ALL PRIVILEGES ON `bookingsalondb`.* TO 'bookingsalon_migrator'@'%';

-- BƯỚC 4: Vô hiệu hóa quyền truy cập từ xa của tài khoản root (Bảo mật tối đa)
-- Đảm bảo root chỉ có thể kết nối từ máy chủ nội bộ (localhost / 127.0.0.1)
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- BƯỚC 5: Nạp lại bảng đặc quyền
FLUSH PRIVILEGES;

-- ============================================================================
-- KIỂM TRA LẠI QUYỀN SAU KHI TẠO:
-- SHOW GRANTS FOR 'bookingsalon_app'@'%';
-- ============================================================================

