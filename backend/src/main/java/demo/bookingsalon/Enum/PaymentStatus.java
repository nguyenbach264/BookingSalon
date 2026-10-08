package demo.bookingsalon.Enum;

public enum PaymentStatus {
    PENDING,     // VỪA TẠO / CHỜ THANH TOÁN
    PROCESSING,  // ĐANG XỬ LÝ / ĐANG GỌI CỔNG THANH TOÁN
    SUCCESS,     // ĐÃ THANH TOÁN THÀNH CÔNG
    PAID,        // ĐÃ THANH TOÁN (dùng cho Orders/Bookings)
    UNPAID,      // CHƯA THANH TOÁN (dùng cho Bookings)
    FAILED,      // THẤT BẠI
    CANCELLED,   // ĐÃ HỦY
    EXPIRED,     // HẾT HẠN
    REFUNDING,   // ĐANG HOÀN TIỀN
    REFUNDED;    // ĐÃ HOÀN TIỀN

    /**
     * Kiểm tra trạng thái đã thanh toán thành công (hỗ trợ cả SUCCESS và PAID)
     */
    public boolean isPaid() {
        return this == SUCCESS || this == PAID;
    }

    /**
     * Kiểm tra tính hợp lệ của việc chuyển đổi trạng thái thanh toán.
     * Cho phép các chuyển đổi hợp lệ trong chu trình đặt lịch và đặt đơn hàng.
     */
    public boolean canTransitionTo(PaymentStatus target) {
        if (target == null) return false;
        if (this == target) return true; // Cho phép giữ nguyên (idempotent callback)

        return switch (this) {
            case PENDING, UNPAID ->
                target == PROCESSING || target == SUCCESS || target == PAID
                || target == FAILED || target == CANCELLED || target == EXPIRED;

            case PROCESSING ->
                target == SUCCESS || target == PAID || target == FAILED
                || target == CANCELLED || target == EXPIRED;

            case SUCCESS, PAID ->
                target == REFUNDING || target == REFUNDED;

            case REFUNDING ->
                target == REFUNDED || target == FAILED;

            case FAILED, CANCELLED, EXPIRED ->
                target == PENDING || target == PROCESSING;

            default -> false;
        };
    }
}
