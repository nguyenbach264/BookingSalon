package demo.bookingsalon.Security.RateLimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
@Slf4j
public class IpRateLimitingFilter extends OncePerRequestFilter {

    private final RateLimiterService rateLimiterService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.ratelimit.otp.limit:10}")
    private int otpLimit;

    @Value("${app.ratelimit.otp.duration:60}")
    private int otpDuration;

    @Value("${app.ratelimit.login.limit:20}")
    private int loginLimit;

    @Value("${app.ratelimit.login.duration:60}")
    private int loginDuration;

    @Value("${app.ratelimit.global-ip.limit:200}")
    private int globalIpLimit;

    @Value("${app.ratelimit.global-ip.duration:60}")
    private int globalIpDuration;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();
        String method = request.getMethod();

        // Bỏ qua các tệp tĩnh, Swagger docs, webhooks và WebSocket
        if (path.startsWith("/swagger-ui") ||
            path.startsWith("/v3/api-docs") ||
            path.startsWith("/ws") ||
            path.contains("/webhook")) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = ClientIpResolver.getClientIp(request);
        RateLimitResult result = null;
        String actionName = null;

        // 1. Kiểm tra Endpoint gửi OTP (Đăng ký & Quên mật khẩu)
        if ("POST".equalsIgnoreCase(method) &&
            (path.equals("/api/auth/register/send-otp") || path.equals("/api/auth/forgot-password/send-otp"))) {
            actionName = "Gửi mã OTP";
            result = rateLimiterService.tryAcquire("ip:otp", clientIp, otpLimit, otpDuration);

        // 2. Kiểm tra Endpoint Đăng nhập (Chống Brute-force mật khẩu)
        } else if ("POST".equalsIgnoreCase(method) && path.equals("/api/auth/login")) {
            actionName = "Đăng nhập";
            result = rateLimiterService.tryAcquire("ip:login", clientIp, loginLimit, loginDuration);

        // 3. Kiểm tra Endpoint Xác thực OTP
        } else if ("POST".equalsIgnoreCase(method) &&
                   (path.equals("/api/auth/register/verify-otp") || path.equals("/api/auth/forgot-password/verify-and-reset"))) {
            actionName = "Xác thực mã OTP";
            result = rateLimiterService.tryAcquire("ip:verify-otp", clientIp, 15, 60);

        // 4. Kiểm tra Tầng bảo vệ chung IP cho toàn bộ API Public
        } else if (path.startsWith("/api/")) {
            actionName = "Truy cập hệ thống";
            result = rateLimiterService.tryAcquire("ip:global", clientIp, globalIpLimit, globalIpDuration);
        }

        // Nếu vượt quá giới hạn -> Ngắt luồng và trả về HTTP 429 ngay lập tức
        if (result != null && !result.isAllowed()) {
            writeRateLimitResponse(response, result, actionName);
            return;
        }

        // Bổ sung các Header chuẩn RFC Rate Limiting vào phản hồi
        if (result != null) {
            response.setHeader("X-RateLimit-Limit", String.valueOf(result.getLimit()));
            response.setHeader("X-RateLimit-Remaining", String.valueOf(result.getRemaining()));
        }

        filterChain.doFilter(request, response);
    }

    private void writeRateLimitResponse(HttpServletResponse response,
                                        RateLimitResult result,
                                        String actionName) throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Retry-After", String.valueOf(result.getRetryAfterSeconds()));
        response.setHeader("X-RateLimit-Limit", String.valueOf(result.getLimit()));
        response.setHeader("X-RateLimit-Remaining", "0");

        Map<String, Object> body = new HashMap<>();
        body.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
        body.put("error", "TOO_MANY_REQUESTS");
        body.put("message", "Quý khách đang thao tác " + actionName + " quá nhanh. Vui lòng thử lại sau " +
                result.getRetryAfterSeconds() + " giây!");
        body.put("retryAfterSeconds", result.getRetryAfterSeconds());

        response.getWriter().write(objectMapper.writeValueAsString(body));
        response.getWriter().flush();
    }
}

