-- ==============================================================================
-- V8__fix_critical_constraints_and_indexes.sql
-- Khắc phục các khiếm khuyết toàn vẹn dữ liệu và tối ưu chỉ mục hiệu năng
-- ==============================================================================

-- 1. Bổ sung UNIQUE CONSTRAINT trên user_vouchers ngăn chặn duplicate assignment
ALTER TABLE user_vouchers 
ADD CONSTRAINT uk_user_vouchers_user_voucher UNIQUE (user_id, voucher_id);

-- 2. Đánh Index trên payments.order_id tối ưu truy vấn tra cứu giao dịch theo đơn hàng
CREATE INDEX idx_payments_order_id ON payments (order_id);

-- 3. Đánh Composite Index tối ưu truy vấn kiểm tra xung đột khung giờ thợ (isTimeSlotAvailable)
CREATE INDEX idx_bookings_stylist_schedule_v2 ON bookings (stylist_id, status, start_time, end_time);

