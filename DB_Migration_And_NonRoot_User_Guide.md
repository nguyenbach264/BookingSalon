# Database Migration & Non-Root User — Hướng dẫn Production

> **Liên quan đến**: `BookingSalon_Production_Review.md` — Mục C2 (Critical)
> **Áp dụng cho**: Spring Boot 3.5.3 + Flyway + MySQL 8.0
> **Mục tiêu**: Hiểu tư tưởng migration từ lý thuyết đến triển khai, và cách tạo
> DB user đúng chuẩn production thay thế `root`.

---

## MỤC LỤC

1. [Tại sao KHÔNG dùng root trong production?](#1-tại-sao-không-dùng-root-trong-production)
2. [Tư tưởng Database Migration là gì?](#2-tư-tưởng-database-migration-là-gì)
3. [Flyway hoạt động như thế nào?](#3-flyway-hoạt-động-như-thế-nào)
4. [Phân tích V1 → V6 trong dự án BookingSalon](#4-phân-tích-v1--v6-trong-dự-án-bookingsalon)
5. [Cấu hình Flyway trong application.properties — Vấn đề hiện tại](#5-cấu-hình-flyway-hiện-tại--vấn-đề)
6. [Cách tạo DB user đúng chuẩn production](#6-cách-tạo-db-user-đúng-chuẩn-production)
7. [Tích hợp tạo user vào Flyway Migration (V7)](#7-tích-hợp-vào-flyway-migration-v7)
8. [Cấu hình application.properties đúng cho production](#8-cấu-hình-applicationproperties-đúng-cho-production)
9. [Quy trình deploy production hoàn chỉnh](#9-quy-trình-deploy-production-hoàn-chỉnh)
10. [Checklist kiểm tra](#10-checklist-kiểm-tra)

---

## 1. Tại sao KHÔNG dùng root trong production?

### Vấn đề hiện tại trong dự án

```properties
# .env — NGUY HIỂM
DB_USERNAME=root
DB_PASSWORD=Bach@vt05
```

### Nguyên tắc Least Privilege (Đặc quyền tối thiểu)

Đây là nguyên tắc bảo mật nền tảng: **một thực thể chỉ được có đúng và đủ quyền cần
thiết để thực hiện công việc của nó, không hơn không kém.**

Tài khoản `root` trong MySQL có **toàn quyền** trên mọi thứ:

```
root có thể:
  ✗ DROP DATABASE bookingsalondb;          -- Xóa toàn bộ database
  ✗ DROP TABLE users;                      -- Xóa bảng người dùng
  ✗ GRANT ALL PRIVILEGES TO 'attacker'@'%' -- Tạo thêm backdoor
  ✗ SHOW MASTER LOGS;                      -- Đọc binary log (dữ liệu nhạy cảm)
  ✗ SHUTDOWN;                              -- Tắt MySQL server
  ✗ FILE privilege → đọc/ghi file OS       -- Truy cập file hệ thống
```

Ứng dụng Spring Boot của bạn **chỉ cần**:

```
bookingsalon_app chỉ cần:
  ✓ SELECT  — Đọc dữ liệu
  ✓ INSERT  — Ghi dữ liệu mới
  ✓ UPDATE  — Cập nhật dữ liệu
  ✓ DELETE  — Xóa dữ liệu (soft delete)
```

### Kịch bản tấn công thực tế

```
Kịch bản 1 — SQL Injection:
  Attacker inject: ' OR 1=1; DROP TABLE users; --
  Nếu dùng root  → Mất toàn bộ bảng users (ứng dụng sập hoàn toàn)
  Nếu dùng app user → Không có quyền DROP, lệnh bị từ chối

Kịch bản 2 — Credential bị lộ (đúng như dự án này):
  .env bị đưa lên GitHub (public hoặc private bị leak)
  Nếu dùng root  → Attacker có toàn quyền MySQL server
  Nếu dùng app user → Attacker chỉ có SELECT/INSERT/UPDATE/DELETE
                       trên 1 database cụ thể

Kịch bản 3 — RCE (Remote Code Execution) qua MySQL:
  Nếu dùng root  → Có FILE privilege, có thể đọc /etc/passwd,
                    ghi webshell vào thư mục web server
  Nếu dùng app user → Không có FILE privilege, tấn công thất bại
```

---

## 2. Tư tưởng Database Migration là gì?

### Vấn đề migration giải quyết

Hãy tưởng tượng bạn có 5 developer cùng làm việc trên dự án BookingSalon:
  
```
Dev A (backend) → thêm cột voucher_code vào bảng users
Dev B (backend) → thêm bảng user_vouchers
Dev C (DevOps)  → deploy lên staging
Dev D (backend) → thêm cột vnpay_txn_ref vào bảng orders
Dev E (QA)      → cần reset database về trạng thái sạch để test
```

**Không có migration** — mỗi người làm thủ công, không ai biết database đang ở trạng thái nào,
môi trường dev/staging/production khác nhau, không thể rollback, không thể trace lịch sử.

**Có migration** — mọi thay đổi schema đều được code hóa, version hóa, có thể chạy lại theo
thứ tự xác định, ai cũng biết database đang ở version mấy.

### Triết lý cốt lõi của migration

```
"Database schema là một phần của source code.
 Nó phải được version control, review, và deploy
 theo đúng quy trình như mọi file Java hay React khác."
```

Mỗi migration file phải tuân thủ:

```
1. IMMUTABLE   — Sau khi commit và chạy, KHÔNG BAO GIỜ sửa file cũ
2. INCREMENTAL — Mỗi file chỉ thêm thay đổi, không viết lại từ đầu
3. ORDERED     — Chạy theo thứ tự version tăng dần, không bao giờ bỏ qua
4. IDEMPOTENT  — Có thể chạy an toàn trên mọi môi trường (dev/staging/prod)
5. REVERSIBLE  — Nên cân nhắc viết rollback script tương ứng (best practice)
```

### So sánh Migration vs Schema thủ công

```
Cách cũ (schema.sql thủ công):               Cách đúng (Flyway migration):
  - Viết lại từ đầu mỗi lần thay đổi           - Chỉ viết phần thay đổi mới
  - Không biết ai thay đổi gì, khi nào          - Lịch sử đầy đủ trong flyway_schema_history
  - Dev/Staging/Prod dễ bị lệch nhau            - Đảm bảo mọi môi trường đều đồng nhất
  - Không thể tự động hóa                       - Chạy tự động khi Spring Boot khởi động
  - Không thể trace bug từ schema               - Biết chính xác version nào gây ra vấn đề
```

---

## 3. Flyway hoạt động như thế nào?

### Bảng kiểm soát flyway_schema_history

Khi Flyway chạy lần đầu, nó tự tạo một bảng đặc biệt trong database:

```sql
-- Flyway tự tạo và quản lý bảng này
CREATE TABLE flyway_schema_history (
    installed_rank INT          NOT NULL,    -- Thứ tự chạy
    version        VARCHAR(50)  NULL,        -- "1", "2", "3", ...
    description    VARCHAR(200) NOT NULL,    -- Tên migration (phần sau __)
    type           VARCHAR(20)  NOT NULL,    -- "SQL" hoặc "JAVA"
    script         VARCHAR(1000) NOT NULL,   -- Tên file đầy đủ
    checksum       INT          NULL,        -- Mã kiểm tra tính toàn vẹn
    installed_by   VARCHAR(100) NOT NULL,    -- User DB đã chạy migration
    installed_on   TIMESTAMP    NOT NULL,    -- Thời điểm chạy
    execution_time INT          NOT NULL,    -- Thời gian chạy (ms)
    success        BOOL         NOT NULL,    -- TRUE = thành công
    PRIMARY KEY (installed_rank)
);
```

### Quy trình Flyway chạy khi Spring Boot khởi động

```
Spring Boot start
     |
     v
Flyway khởi tạo
     |
     v
Scan thư mục db/migration
     |
     +-- Tìm thấy: V1__init_schema.sql
     +-- Tìm thấy: V2__extended_bookingsalondb_schema.sql
     +-- Tìm thấy: V3__user_vouchers.sql
     +-- Tìm thấy: V4__add_vnpay_fields_to_orders.sql
     +-- Tìm thấy: V5__create_service_salon_suspensions.sql
     +-- Tìm thấy: V6__add_stylist_cooldown.sql
     |
     v
Đọc flyway_schema_history (nếu chưa có → tạo mới)
     |
     v
So sánh: Migration nào chưa chạy?
     |
     +-- Nếu V1 chưa chạy → Chạy V1, ghi vào history (success=TRUE)
     +-- Nếu V2 chưa chạy → Chạy V2, ghi vào history
     +-- ... (theo thứ tự)
     +-- Nếu tất cả đã chạy → Không làm gì (idempotent)
     |
     v
validate-on-migrate = true → Kiểm tra checksum
     |
     +-- Nếu file V1 bị sửa sau khi đã chạy → FlywayException! (DỪNG khởi động)
     +-- Nếu checksum khớp → Tiếp tục
     |
     v
Spring Boot tiếp tục khởi động bình thường
```

### Quy tắc đặt tên file migration

```
V{version}__{description}.sql
|  |          |
|  |          +-- Tên mô tả, dùng dấu gạch dưới thay khoảng trắng
|  +-- Số version (1, 2, 3... hoặc 1.1, 1.2...)
+-- Chữ V in hoa (bắt buộc)

Ví dụ hợp lệ:
  V1__init_schema.sql
  V2__extended_bookingsalondb_schema.sql
  V7__create_app_db_user.sql
  V8__add_composite_indexes.sql

Ví dụ KHÔNG hợp lệ:
  v1__init.sql          (v thường)
  V1_init.sql           (thiếu __ kép)
  V01__init.sql         (số có 0 đứng đầu — có thể gây nhầm lẫn)
```

---

## 4. Phân tích V1 → V6 trong dự án BookingSalon

### Sơ đồ tiến hóa schema

```
V1 — Nền tảng                    V2 — Mở rộng nghiệp vụ
  users (cơ bản 8 cột)    ──>     users (thêm 14 cột: gender, city,
  admins                           membership_tier, status, version...)
  salons                          stylists (thêm nickname, bio, salary...)
  stylists (cơ bản)               bookings (thêm booking_code, voucher...)
  categories                      salons (thêm slug, rating, amenities...)
  service_offerings               payments (thêm expires_at, order_id...)
  bookings (cơ bản)               vouchers (bảng mới)
  booking_details                 + Indexes tổng thể
  products / orders / carts
  payments
  notifications / media
  shedlock

        |                                   |
        v                                   v
V3 — Voucher system             V4 — VNPay cho Shop Orders
  user_vouchers (bảng mới)        orders.vnpay_txn_ref (cột mới)
  Seed data 4 voucher mẫu         orders.vnpay_url (cột mới)
  (CHAOBANMOI, SALON50K...)       idx_orders_vnpay_txn_ref (index)

        |                                   |
        v                                   v
V5 — Service Suspension         V6 — Stylist Cooldown
  service_salon_suspensions       stylists.next_available_on_time
  (bảng mới — quản lý tạm         (cột mới — cooldown duty switch)
  ngừng dịch vụ theo salon)
```

### Phân tích chi tiết từng migration

---

#### V1 — init_schema.sql (Nền tảng ban đầu)

**Mục đích**: Tạo toàn bộ schema cơ bản khi dự án bắt đầu.

**Điểm tốt:**
- Dùng `CREATE TABLE IF NOT EXISTS` — an toàn khi chạy lại
- Dùng `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4` — đúng chuẩn cho tiếng Việt
- Có Foreign Key Constraints đầy đủ
- Tạo bảng `shedlock` cho distributed scheduler

**Điểm cần lưu ý:**
- Schema ở V1 còn rất cơ bản — bảng `users` chỉ có 8 cột, thiếu nhiều trường nghiệp vụ
- Đây là điều bình thường — V1 là điểm xuất phát, V2 sẽ mở rộng

**Bài học**: V1 nên tạo schema đủ để ứng dụng chạy được ngay, không cần hoàn hảo ngay từ đầu.

---

#### V2 — extended_bookingsalondb_schema.sql (Mở rộng lớn)

**Mục đích**: Nâng cấp toàn diện schema lên đúng với thiết kế nghiệp vụ đầy đủ.

**Kỹ thuật quan trọng trong V2:**

```sql
-- Pattern kiểm tra index tồn tại trước khi DROP
-- Dùng khi không chắc index có tên đó có tồn tại hay không
SET @drop_user_idx = (
    SELECT IF(
        EXISTS (
            SELECT 1 FROM information_schema.statistics
            WHERE table_schema = DATABASE()
            AND table_name = 'users'
            AND index_name = 'username'
        ),
        'ALTER TABLE users DROP INDEX username',
        'SELECT 1'  -- Câu lệnh no-op nếu index không tồn tại
    )
);
PREPARE stmt_user FROM @drop_user_idx;
EXECUTE stmt_user;
DEALLOCATE PREPARE stmt_user;
```

**Tại sao cần pattern này?**
Nếu chạy `ALTER TABLE users DROP INDEX username` mà index không tồn tại → MySQL báo lỗi
và migration thất bại. Pattern trên đảm bảo migration **idempotent** (an toàn khi chạy ở
mọi trạng thái database).

```sql
-- ADD COLUMN với vị trí tường minh (AFTER column_name)
ALTER TABLE users
    ADD COLUMN gender VARCHAR(10) NOT NULL DEFAULT 'OTHER' AFTER phone_number,
    ADD COLUMN city VARCHAR(100) NULL AFTER address,
    ADD COLUMN version BIGINT NOT NULL DEFAULT 0 AFTER last_login_ip,
    ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE AFTER version;
```

**Bài học quan trọng**: Khi `ADD COLUMN`, luôn chỉ định `AFTER column_name` để kiểm soát
thứ tự cột — giúp dễ đọc hơn khi `DESCRIBE table`.

**Điểm cần cải thiện trong V2:**
- File quá dài (546 dòng) — lý tưởng mỗi migration chỉ thay đổi 1 domain/concern
- Nếu V2 fail ở giữa, khó biết đã thay đổi được đến đâu
- Nên tách thành V2a, V2b, V2c... cho từng domain (users, stylists, salons...)

---

#### V3 — user_vouchers.sql (Tính năng mới + Seed data)

**Mục đích**: Thêm bảng liên kết `user_vouchers` và seed data voucher mẫu.

**Điểm tốt:**
- Tạo table và seed data trong cùng 1 migration — đúng khi data này là cấu hình hệ thống
- Dùng `ON DUPLICATE KEY UPDATE` để tránh lỗi khi chạy lại

**Điểm cần thận trọng:**

```sql
-- Seed data trong migration — CÓ hoặc KHÔNG?
-- NÊN seed: Data cấu hình hệ thống (roles, permissions, default settings, voucher mặc định)
-- KHÔNG SEED: Data business thực tế (booking, user data, orders)
```

**Quy tắc vàng về seed data trong migration:**

```
OK để seed:                          KHÔNG nên seed:
  - Default roles                      - Tài khoản admin cụ thể
  - Permission definitions             - Dữ liệu test
  - System configuration               - Dữ liệu demo/sample lớn
  - Voucher mặc định của hệ thống      - Dữ liệu phụ thuộc môi trường
  - Lookup tables (status codes...)
```

---

#### V4 — add_vnpay_fields_to_orders.sql (Thêm cột đơn giản)

**Mục đích**: Hỗ trợ luồng thanh toán VNPay cho đơn hàng shop.

```sql
ALTER TABLE orders
    ADD COLUMN vnpay_txn_ref VARCHAR(60) NULL
        COMMENT 'VNPay transaction reference for shop order',
    ADD COLUMN vnpay_url TEXT NULL
        COMMENT 'Generated VNPay payment URL for redirect';

CREATE INDEX idx_orders_vnpay_txn_ref ON orders (vnpay_txn_ref);
```

**Đây là mẫu migration lý tưởng nhất**:
- Ngắn gọn, chỉ làm 1 việc rõ ràng
- Có comment giải thích từng cột
- Tạo index ngay trong cùng migration (không để developer sau quên)
- Dễ review, dễ rollback

**Rollback tương ứng** (nếu cần):

```sql
-- Không có file này trong dự án, nhưng đây là cách tốt:
-- V4__rollback_vnpay_fields.sql (hoặc dùng Flyway Undo — bản Pro)
ALTER TABLE orders
    DROP INDEX idx_orders_vnpay_txn_ref,
    DROP COLUMN vnpay_txn_ref,
    DROP COLUMN vnpay_url;
```

---

#### V5 — create_service_salon_suspensions.sql (Bảng mới cho tính năng mới)

**Mục đích**: Quản lý việc tạm ngừng một dịch vụ cụ thể tại một salon cụ thể.

```sql
CREATE TABLE IF NOT EXISTS service_salon_suspensions (
    id                  BINARY(16)   NOT NULL,
    service_offering_id BINARY(16)   NOT NULL,
    salon_id            BINARY(16)   NOT NULL,
    start_time          DATETIME     NOT NULL,
    end_time            DATETIME     NOT NULL,
    reason              VARCHAR(500) NULL,
    is_active           BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    CONSTRAINT fk_sss_service FOREIGN KEY (service_offering_id)
        REFERENCES service_offerings (service_offering_id) ON DELETE CASCADE,
    CONSTRAINT fk_sss_salon   FOREIGN KEY (salon_id)
        REFERENCES salons (salon_id) ON DELETE CASCADE
);

-- Composite index cho query phổ biến nhất của tính năng này
CREATE INDEX idx_sss_lookup
    ON service_salon_suspensions (service_offering_id, salon_id, is_active, start_time, end_time);
```

**Điểm tốt**:
- Composite index được thiết kế theo đúng query pattern sẽ dùng:
  `WHERE service_offering_id = ? AND salon_id = ? AND is_active = TRUE AND start_time <= ? AND end_time >= ?`
- Tên constraint FK tường minh (`fk_sss_service`, `fk_sss_salon`)

---

#### V6 — add_stylist_cooldown.sql (Thay đổi nhỏ, đúng cách)

**Mục đích**: Thêm tính năng cooldown khi stylist chuyển trạng thái duty.

```sql
-- V6: Add next_available_on_time to stylists for duty switch cooldown
ALTER TABLE stylists ADD COLUMN next_available_on_time DATETIME NULL;
```

**Đây là migration tốt về sự tập trung**: chỉ 1 dòng SQL, 1 mục đích rõ ràng.

**Điểm có thể cải thiện**:

```sql
-- Tốt hơn nếu có đầy đủ header và comment
-- ====================================================================
-- V6: Add stylist duty-switch cooldown tracking
-- Purpose: Prevent stylists from toggling duty status too frequently
-- Column : next_available_on_time — datetime when stylist can go ON duty again
--          NULL means no cooldown restriction currently active
-- ====================================================================

ALTER TABLE stylists
    ADD COLUMN next_available_on_time DATETIME NULL
        COMMENT 'Earliest datetime stylist can switch back to ON_DUTY status';
```

---

### Tóm tắt tiến hóa schema theo version

| Version | File | Loại thay đổi | Số dòng SQL | Đánh giá |
|---------|------|---------------|-------------|----------|
| V1 | init_schema.sql | Tạo mới toàn bộ | 360 | Tốt — nền tảng vững |
| V2 | extended_schema.sql | ALTER nhiều bảng | 546 | Quá dài, nên tách nhỏ |
| V3 | user_vouchers.sql | Tạo mới + Seed | 44 | Tốt |
| V4 | add_vnpay_fields.sql | ADD COLUMN | 12 | Xuất sắc — mẫu lý tưởng |
| V5 | service_suspensions.sql | Tạo mới | 21 | Tốt |
| V6 | add_stylist_cooldown.sql | ADD COLUMN | 3 | Tốt về tập trung, thiếu comment |

---

## 5. Cấu hình Flyway hiện tại — Vấn đề

```properties
# application.properties — cấu hình HIỆN TẠI

spring.flyway.enabled=${FLYWAY_ENABLED:true}
spring.flyway.baseline-on-migrate=true      # OK
spring.flyway.baseline-version=0             # OK
spring.flyway.locations=classpath:db/migration
spring.flyway.validate-on-migrate=false     # ← VẤN ĐỀ NGHIÊM TRỌNG
spring.flyway.out-of-order=false             # OK
```

### Tại sao `validate-on-migrate=false` là nguy hiểm?

**Kịch bản 1 — Developer vô tình sửa migration cũ:**

```
Ngày 1: Dev A commit V3__user_vouchers.sql, chạy OK trên dev
Ngày 5: Dev A nghĩ là "sửa nhỏ" → chỉnh nội dung V3__user_vouchers.sql
Ngày 6: Staging deploy → Flyway thấy V3 đã chạy rồi, bỏ qua (validate=false)
         → Database staging và production KHÁC NHAU mà không ai biết
         → Bug xuất hiện nhưng không tìm được nguyên nhân

Nếu validate=true:
  → Flyway phát hiện checksum V3 thay đổi
  → Throw FlywayException: "Migration checksum mismatch"
  → Application KHÔNG KHỞI ĐỘNG ĐƯỢC
  → Developer biết ngay có vấn đề và fix trước khi lên production
```

**Kịch bản 2 — Script migration bị tấn công (supply chain attack):**

```
validate=false → Attacker sửa V1__init_schema.sql thêm backdoor user
                 Flyway không kiểm tra → Không phát hiện
validate=true  → Checksum thay đổi → Application từ chối khởi động
```

### Cấu hình đúng cho production

```properties
# application.properties — ĐÃ SỬA

spring.flyway.validate-on-migrate=true     # Luôn validate checksum
spring.flyway.clean-disabled=true          # QUAN TRỌNG: Ngăn flyway:clean xóa hết data
spring.flyway.out-of-order=false           # Không cho phép migration chạy lộn thứ tự
```

---

## 6. Cách tạo DB user đúng chuẩn production

### Bước 1 — Kết nối MySQL với root (chỉ lần đầu setup)

```bash
# Kết nối với root để thực hiện setup ban đầu
mysql -u root -p

# Hoặc từ Docker container
docker exec -it <mysql_container_name> mysql -u root -p
```

### Bước 2 — Tạo user và phân quyền

```sql
-- ============================================================
-- Script setup DB user cho production BookingSalon
-- Chạy 1 lần duy nhất với quyền root
-- Sau đó application KHÔNG BAO GIỜ cần root nữa
-- ============================================================

-- 1. Tạo database (nếu chưa có)
CREATE DATABASE IF NOT EXISTS bookingsalondb
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

-- 2. Tạo application user
--    '%' = cho phép kết nối từ bất kỳ IP (trong Docker network)
--    Thay '%' bằng IP cụ thể nếu biết (bảo mật hơn)
CREATE USER IF NOT EXISTS 'bookingsalon_app'@'%'
    IDENTIFIED BY 'StrongR@nd0mP@ssword!2026';  -- Thay bằng password mạnh thực tế

-- 3. Cấp quyền tối thiểu trên database của ứng dụng
GRANT SELECT, INSERT, UPDATE, DELETE ON bookingsalondb.* TO 'bookingsalon_app'@'%';

-- Flyway cần CREATE TABLE, ALTER TABLE để chạy migration
-- Nếu muốn Flyway dùng cùng user:
GRANT CREATE, ALTER, INDEX, DROP, REFERENCES ON bookingsalondb.* TO 'bookingsalon_app'@'%';

-- Áp dụng thay đổi ngay lập tức
FLUSH PRIVILEGES;

-- ============================================================
-- (Tùy chọn) Tạo user riêng cho Flyway với quyền cao hơn
-- Dùng khi muốn tách biệt migration user và runtime user
-- ============================================================

CREATE USER IF NOT EXISTS 'bookingsalon_migrate'@'%'
    IDENTIFIED BY 'AnotherStr0ngP@ss!Migrate';

GRANT SELECT, INSERT, UPDATE, DELETE,
      CREATE, ALTER, INDEX, DROP, REFERENCES,
      CREATE VIEW, SHOW VIEW
      ON bookingsalondb.* TO 'bookingsalon_migrate'@'%';

FLUSH PRIVILEGES;
```

### Bước 3 — Kiểm tra quyền đã cấp

```sql
-- Xem quyền của user vừa tạo
SHOW GRANTS FOR 'bookingsalon_app'@'%';

-- Kết quả mong đợi:
-- GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX,
--       DROP, REFERENCES ON `bookingsalondb`.* TO `bookingsalon_app`@`%`

-- Verify bằng cách thử kết nối
-- (Chạy từ terminal, không phải trong MySQL session)
-- mysql -u bookingsalon_app -p bookingsalondb
-- Nếu kết nối được → OK
```

### Bước 4 — Test quyền

```sql
-- Kết nối với bookingsalon_app, thử các lệnh
USE bookingsalondb;

-- Các lệnh này PHẢI thành công:
SELECT COUNT(*) FROM users;
INSERT INTO ... (test rồi rollback)
UPDATE users SET updated_at = NOW() WHERE 1=0;  -- WHERE false = không update gì

-- Các lệnh này PHẢI bị từ chối (Access denied):
DROP TABLE users;          -- ← Không có DROP quyền nếu chỉ grant SELECT/INSERT/UPDATE/DELETE
GRANT ALL TO 'hacker'@'%'; -- ← Không có GRANT OPTION
SHOW MASTER LOGS;          -- ← Không có REPLICATION CLIENT
```

---

## 7. Tích hợp vào Flyway Migration (V7)

Cách tốt nhất là tạo migration V7 để **tự động hóa** việc tạo user khi deploy lên môi
trường mới. Tuy nhiên, cần hiểu giới hạn:

> **Quan trọng**: Script dưới đây **chỉ hoạt động** khi Flyway chạy với user có
> đủ quyền (`root` hoặc user có `CREATE USER`, `GRANT`). Sau khi V7 chạy xong
> lần đầu, mới chuyển sang dùng `bookingsalon_app`.

```sql
-- =============================================================================
-- Flyway Migration V7: Create Application DB User (Non-Root)
-- =============================================================================
-- MỤC ĐÍCH : Tạo user MySQL với minimal privilege thay thế root
-- CHẠY VỚI : User có quyền CREATE USER và GRANT (ví dụ: root hoặc admin user)
-- SAU KHI CHẠY: Cập nhật .env: DB_USERNAME=bookingsalon_app
-- =============================================================================

-- Tạo user nếu chưa tồn tại
-- Dùng IF NOT EXISTS để migration idempotent (chạy lại không bị lỗi)
CREATE USER IF NOT EXISTS 'bookingsalon_app'@'%'
    IDENTIFIED BY '${APP_DB_PASSWORD}';
-- ^ Lưu ý: MySQL không hỗ trợ biến env trực tiếp trong SQL
--   Cần thay thế bằng password thực tế ở bước deploy
--   Hoặc dùng Flyway Callbacks / Java Migration để đọc từ env

-- Cấp quyền runtime (SELECT/INSERT/UPDATE/DELETE)
GRANT SELECT, INSERT, UPDATE, DELETE ON bookingsalondb.* TO 'bookingsalon_app'@'%';

-- Cấp quyền migration (CREATE/ALTER/INDEX)
-- Có thể tách riêng nếu muốn dùng 2 user khác nhau
GRANT CREATE, ALTER, INDEX, DROP, REFERENCES ON bookingsalondb.* TO 'bookingsalon_app'@'%';

FLUSH PRIVILEGES;

-- Ghi log để biết migration đã chạy (optional)
-- INSERT INTO migration_log (version, description, executed_at)
-- VALUES ('V7', 'Created non-root app user bookingsalon_app', NOW());
```

### Giới hạn của SQL Migration cho việc tạo user

Vì SQL migration không thể đọc biến môi trường, có 2 cách xử lý:

**Cách 1 — Java Migration (linh hoạt nhất):**

```java
// src/main/java/demo/bookingsalon/Migration/V7__CreateAppDbUser.java
package demo.bookingsalon.Migration;

import org.flywaydb.core.api.migration.BaseJavaMigration;
import org.flywaydb.core.api.migration.Context;
import org.springframework.beans.factory.annotation.Value;

import java.sql.PreparedStatement;

public class V7__CreateAppDbUser extends BaseJavaMigration {

    // Đọc từ environment variable
    private static final String APP_PASSWORD = System.getenv("APP_DB_PASSWORD");
    private static final String APP_USER = "bookingsalon_app";

    @Override
    public void migrate(Context context) throws Exception {
        if (APP_PASSWORD == null || APP_PASSWORD.isBlank()) {
            throw new RuntimeException(
                "APP_DB_PASSWORD environment variable is required for V7 migration"
            );
        }

        try (var conn = context.getConnection()) {
            // Tạo user
            try (PreparedStatement stmt = conn.prepareStatement(
                "CREATE USER IF NOT EXISTS ?@'%' IDENTIFIED BY ?")) {
                stmt.setString(1, APP_USER);
                stmt.setString(2, APP_PASSWORD);
                stmt.execute();
            }

            // Cấp quyền
            try (var stmt = conn.createStatement()) {
                stmt.execute(
                    "GRANT SELECT, INSERT, UPDATE, DELETE, " +
                    "CREATE, ALTER, INDEX, DROP, REFERENCES " +
                    "ON bookingsalondb.* TO '" + APP_USER + "'@'%'"
                );
                stmt.execute("FLUSH PRIVILEGES");
            }
        }
    }
}
```

**Cách 2 — Script shell trong CI/CD (thực tế và đơn giản hơn):**

```bash
#!/bin/bash
# scripts/setup-db-user.sh — Chạy 1 lần duy nhất khi setup server mới

set -e  # Dừng ngay nếu có lỗi

echo "=== Setting up BookingSalon DB user ==="

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<EOF
CREATE USER IF NOT EXISTS 'bookingsalon_app'@'%'
    IDENTIFIED BY '${APP_DB_PASSWORD}';

GRANT SELECT, INSERT, UPDATE, DELETE,
      CREATE, ALTER, INDEX, DROP, REFERENCES
      ON bookingsalondb.* TO 'bookingsalon_app'@'%';

FLUSH PRIVILEGES;

SELECT User, Host FROM mysql.user WHERE User = 'bookingsalon_app';
EOF

echo "=== DB user setup complete ==="
```

---

## 8. Cấu hình application.properties đúng cho production

### Tách profile dev và production

**Cách tổ chức file properties:**

```
backend/src/main/resources/
  application.properties             ← Shared config (mọi môi trường)
  application-dev.properties         ← Dev-specific overrides
  application-production.properties  ← Production-specific overrides
  application-test.properties        ← Test-specific overrides
```

**application.properties (shared):**

```properties
spring.application.name=BookingSalon

# Database — đọc từ environment variables
spring.datasource.url=jdbc:mysql://${DB_HOST}:${DB_PORT}/${DB_NAME}\
  ?createDatabaseIfNotExist=true\
  &useSSL=false\
  &allowPublicKeyRetrieval=true\
  &serverTimezone=Asia/Ho_Chi_Minh
spring.datasource.username=${DB_USERNAME}
spring.datasource.password=${DB_PASSWORD}
spring.jpa.hibernate.ddl-auto=${JPA_DDL_AUTO:validate}

# Flyway — cấu hình chung
spring.flyway.enabled=true
spring.flyway.locations=classpath:db/migration
spring.flyway.baseline-on-migrate=true
spring.flyway.baseline-version=0
spring.flyway.out-of-order=false

# QUAN TRỌNG: validate LUÔN BẬT ở mọi môi trường
spring.flyway.validate-on-migrate=true

# QUAN TRỌNG: Ngăn flyway:clean xóa toàn bộ data
spring.flyway.clean-disabled=true
```

**application-dev.properties:**

```properties
# Dev overrides — chỉ áp dụng khi SPRING_PROFILES_ACTIVE=dev

# Dev dùng root vì cần thường xuyên recreate schema
DB_USERNAME=root
DB_PASSWORD=your_local_root_password

# Hiển thị SQL để debug (KHÔNG dùng ở production)
spring.jpa.show-sql=true
spring.jpa.properties.hibernate.format_sql=true

# Log level chi tiết
logging.level.demo.bookingsalon=DEBUG
logging.level.org.flywaydb=DEBUG

# Swagger bật khi dev
springdoc.api-docs.enabled=true
springdoc.swagger-ui.enabled=true
```

**application-production.properties:**

```properties
# Production overrides — áp dụng khi SPRING_PROFILES_ACTIVE=production

# Application user thay thế root
# Giá trị thực được inject từ environment variables / secret manager

# Tắt SQL logging
spring.jpa.show-sql=false

# Log level tối thiểu
logging.level.root=WARN
logging.level.demo.bookingsalon=INFO
logging.level.demo.bookingsalon.payment=WARN

# Tắt Swagger ở production
springdoc.api-docs.enabled=false
springdoc.swagger-ui.enabled=false

# HikariCP connection pool cho production load
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.leak-detection-threshold=60000
```

**.env cho production (mẫu với giá trị thật được inject từ CI/CD):**

```bash
# .env.production — KHÔNG commit file này
# Giá trị được inject bởi CI/CD hoặc secret manager (Vault, K8s Secrets, etc.)

SPRING_PROFILES_ACTIVE=production

DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=3306
DB_NAME=bookingsalondb

# application user — KHÔNG phải root
DB_USERNAME=bookingsalon_app
DB_PASSWORD=<injected-by-secret-manager>

JPA_DDL_AUTO=validate
FLYWAY_ENABLED=true
```

---

## 9. Quy trình deploy production hoàn chỉnh

### Lần đầu tiên setup server mới

```
Bước 1: Provision MySQL server
  → MySQL 8.0 cài đặt
  → root password được set an toàn, chỉ admin biết

Bước 2: Tạo database và app user
  → Chạy scripts/setup-db-user.sh với root
  → Tạo: bookingsalondb, bookingsalon_app user
  → Xác nhận quyền bằng SHOW GRANTS

Bước 3: Cập nhật .env production
  → DB_USERNAME=bookingsalon_app
  → DB_PASSWORD=<password mạnh>
  → Lưu vào secret manager (AWS Secrets Manager / HashiCorp Vault / K8s Secret)

Bước 4: Deploy ứng dụng lần đầu
  → Spring Boot start với SPRING_PROFILES_ACTIVE=production
  → Flyway tự động chạy V1 → V6 (hoặc V7 nếu đã tạo)
  → Kiểm tra flyway_schema_history trong DB

Bước 5: Xác nhận
  → Chạy health check: curl http://server/actuator/health
  → Kiểm tra logs không có FlywayException
  → Smoke test các chức năng chính
```

### Mỗi lần deploy sau (update code + migration mới)

```
Bước 1: Review migration mới (ví dụ V7, V8)
  → Code review: migration có đúng không? Có rollback được không?
  → Test trên staging trước

Bước 2: Deploy lên staging
  → Flyway tự động detect V7 chưa chạy → chạy V7
  → Kiểm tra staging hoạt động bình thường

Bước 3: Deploy lên production
  → Zero-downtime nếu migration backward-compatible
  → Có downtime nếu migration thay đổi cấu trúc lớn

Bước 4: Rollback nếu cần
  → Nếu code lỗi: redeploy version cũ (Flyway không rollback tự động)
  → Nếu migration lỗi: chạy rollback script thủ công
```

### Kiểm tra flyway_schema_history sau deploy

```sql
-- Xem lịch sử migration — chạy sau mỗi deploy
SELECT
    installed_rank,
    version,
    description,
    script,
    installed_on,
    execution_time,
    success
FROM flyway_schema_history
ORDER BY installed_rank;

-- Kết quả mong đợi sau deploy thành công:
-- rank | version | description                              | success
-- -----|---------|------------------------------------------|--------
-- 1    | 1       | init schema                              | 1
-- 2    | 2       | extended bookingsalondb schema           | 1
-- 3    | 3       | user vouchers                            | 1
-- 4    | 4       | add vnpay fields to orders               | 1
-- 5    | 5       | create service salon suspensions         | 1
-- 6    | 6       | add stylist cooldown                     | 1
-- 7    | 7       | create app db user                       | 1  ← mới thêm
```

---

## 10. Checklist kiểm tra

### Security — DB User

```
[ ] Đã tạo user bookingsalon_app với password mạnh (>= 20 ký tự, mixed case + số + ký tự đặc biệt)
[ ] DB_USERNAME trong .env production là bookingsalon_app (KHÔNG phải root)
[ ] SHOW GRANTS xác nhận chỉ có SELECT/INSERT/UPDATE/DELETE/CREATE/ALTER/INDEX/DROP/REFERENCES
[ ] Thử kết nối bằng bookingsalon_app và xác nhận lệnh DROP TABLE bị từ chối
[ ] Root password của MySQL được lưu an toàn, không ai ngoài DBA biết
[ ] .env production KHÔNG được commit lên Git
[ ] Secret được lưu trong secret manager (không lưu trong file plain text)
```

### Flyway — Migration Hygiene

```
[ ] validate-on-migrate=true trong mọi môi trường
[ ] clean-disabled=true để ngăn xóa nhầm data
[ ] Không có file migration cũ nào bị chỉnh sửa sau khi đã commit
[ ] schema.sql đã được xóa (chỉ dùng Flyway)
[ ] Mỗi migration mới đều được test trên staging trước khi deploy production
[ ] flyway_schema_history được kiểm tra sau mỗi deploy (success=1 cho tất cả)
[ ] Mỗi migration có header comment rõ ràng (mục đích, author, date)
[ ] Migration file không chứa password hay credential thật
```

### Môi trường

```
[ ] SPRING_PROFILES_ACTIVE=production khi deploy
[ ] Dev: show-sql=true | Production: show-sql=false
[ ] Dev: logging DEBUG  | Production: logging WARN/INFO
[ ] Dev: Swagger bật    | Production: Swagger tắt
[ ] HikariCP connection pool được cấu hình phù hợp với load thực tế
```

---

## Tổng kết

| Vấn đề | Trạng thái hiện tại | Trạng thái mục tiêu |
|--------|---------------------|---------------------|
| DB User | `root` — toàn quyền | `bookingsalon_app` — minimal privilege |
| Flyway validate | `false` — bỏ qua checksum | `true` — detect mọi thay đổi |
| Flyway clean | Không được bảo vệ | `clean-disabled=true` |
| Schema files | schema.sql + Flyway song song | Chỉ Flyway |
| Profiles | Không có | dev / production / test tách biệt |
| Secrets | .env commit vào Git | Secret manager, inject lúc deploy |

**Thứ tự thực hiện khuyến nghị:**

```
1. Tạo bookingsalon_app user ngay hôm nay (30 phút)
2. Cập nhật .env: DB_USERNAME=bookingsalon_app (5 phút)
3. Bật validate-on-migrate=true + clean-disabled=true (5 phút)
4. Xóa schema.sql (sau khi confirm Flyway hoạt động ổn) (10 phút)
5. Tách application-dev.properties và application-production.properties (1 ngày)
6. Setup secret manager cho production (1-2 ngày)
```

---

*Tài liệu này là phần chi tiết hóa của mục C2 trong `BookingSalon_Production_Review.md`.
Xem thêm mục C1 (Credential Exposure) để xử lý vấn đề secrets bị lộ song song.*
