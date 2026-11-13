package demo.bookingsalon.Security.RateLimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;

@Component
@Slf4j
public class RateLimitInterceptor implements HandlerInterceptor {

    private final RateLimiterService rateLimiterService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public RateLimitInterceptor(@Autowired(required = false) RateLimiterService rateLimiterService) {
        this.rateLimiterService = rateLimiterService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws Exception {

        if (rateLimiterService == null) {
            return true;
        }

        if (!(handler instanceof HandlerMethod handlerMethod)) {
            return true;
        }

        // Tìm kiếm annotation @RateLimit trên method hoặc trên controller class
        RateLimit rateLimit = handlerMethod.getMethodAnnotation(RateLimit.class);
        if (rateLimit == null) {
            rateLimit = handlerMethod.getBeanType().getAnnotation(RateLimit.class);
        }

        if (rateLimit == null) {
            return true;
        }

        String identifier = resolveIdentifier(request, rateLimit.type());
        RateLimitResult result = rateLimiterService.tryAcquire(
                rateLimit.keyPrefix(),
                identifier,
                rateLimit.capacity(),
                rateLimit.durationSeconds()
        );

        // Đính kèm các Header Rate Limit vào response
        response.setHeader("X-RateLimit-Limit", String.valueOf(result.getLimit()));
        response.setHeader("X-RateLimit-Remaining", String.valueOf(result.getRemaining()));

        if (!result.isAllowed()) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.setHeader("Retry-After", String.valueOf(result.getRetryAfterSeconds()));

            Map<String, Object> body = new HashMap<>();
            body.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
            body.put("error", "TOO_MANY_REQUESTS");
            body.put("message", rateLimit.message() + " (Thử lại sau " + result.getRetryAfterSeconds() + " giây)");
            body.put("retryAfterSeconds", result.getRetryAfterSeconds());

            response.getWriter().write(objectMapper.writeValueAsString(body));
            response.getWriter().flush();
            return false;
        }

        return true;
    }

    private String resolveIdentifier(HttpServletRequest request, RateLimitType type) {
        String clientIp = ClientIpResolver.getClientIp(request);
        String userId = resolveUserId(request);

        switch (type) {
            case USER:
                return userId != null ? "user:" + userId : "ip:" + clientIp;
            case IP:
                return "ip:" + clientIp;
            case IP_OR_USER:
            default:
                return userId != null ? "user:" + userId : "ip:" + clientIp;
        }
    }

    private String resolveUserId(HttpServletRequest request) {
        // 1. Lấy từ Spring Security Authentication (sau khi filter xác thực chạy xong)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return auth.getName();
        }

        // 2. Fallback kiểm tra BFF HttpSession
        HttpSession session = request.getSession(false);
        if (session != null) {
            Object sessionKeycloakId = session.getAttribute("BFF_KEYCLOAK_ID");
            if (sessionKeycloakId != null) {
                return sessionKeycloakId.toString();
            }
        }

        return null;
    }
}

