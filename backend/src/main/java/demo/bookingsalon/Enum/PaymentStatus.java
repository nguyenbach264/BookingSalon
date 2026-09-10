package demo.bookingsalon.Enum;

public enum PaymentStatus {
    SUCCESS, // ĐÃ THANH TOÁN
    FAILED, // THẤT BẠI
    CANCELLED, // HỦY
    PENDING, // VỪA TẠO
    PROCESSING, // ĐANG GỌI BÊN THỨ 3
    REFUNDING, // ĐANG HOÀN TIỀN
    REFUNDED, // ĐÃ HOÀN TIỀN
    EXPIRED; // HẾT HẠN

    public boolean canTransitionTo(PaymentStatus target) {
        return switch (this) {
            case PENDING -> target == PROCESSING || target == EXPIRED || target == FAILED;
            case PROCESSING -> target == SUCCESS || target == FAILED || target == EXPIRED;
            case SUCCESS -> target == REFUNDING;
            case REFUNDING -> target == REFUNDED || target == FAILED;
            default -> false;
        };
    }
}
