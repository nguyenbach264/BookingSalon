package demo.bookingsalon.Security.RateLimit;

public enum RateLimitType {
    /**
     * Giới hạn theo địa chỉ IP của Client
     */
    IP,

    /**
     * Giới hạn theo ID của người dùng đã đăng nhập (User ID / Keycloak ID)
     */
    USER,

    /**
     * Ưu tiên giới hạn theo User ID nếu đã đăng nhập; nếu là khách vãng lai thì giới hạn theo IP
     */
    IP_OR_USER
}

