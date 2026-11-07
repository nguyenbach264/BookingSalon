package demo.bookingsalon.Security.RateLimit;

import jakarta.servlet.http.HttpServletRequest;

public class ClientIpResolver {

    /**
     * Trích xuất địa chỉ IP thực của Client, hỗ trợ chạy sau Reverse Proxy (Nginx, Cloudflare, AWS ALB)
     */
    public static String getClientIp(HttpServletRequest request) {
        if (request == null) {
            return "127.0.0.1";
        }

        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isBlank() && !"unknown".equalsIgnoreCase(xForwardedFor)) {
            // Header X-Forwarded-For có thể chứa chuỗi "clientIp, proxy1, proxy2..." -> lấy IP đầu tiên
            return xForwardedFor.split(",")[0].trim();
        }

        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isBlank() && !"unknown".equalsIgnoreCase(xRealIp)) {
            return xRealIp.trim();
        }

        String cfConnectingIp = request.getHeader("CF-Connecting-IP");
        if (cfConnectingIp != null && !cfConnectingIp.isBlank() && !"unknown".equalsIgnoreCase(cfConnectingIp)) {
            return cfConnectingIp.trim();
        }

        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "127.0.0.1";
    }
}

