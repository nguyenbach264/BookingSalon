package demo.bookingsalon.Security.RateLimit;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
public class RateLimiterService {

    private static final String GLOBAL_PREFIX = "ratelimit:";

    private static final String RATE_LIMIT_LUA_SCRIPT =
            "local current = redis.call('INCR', KEYS[1])\n" +
            "if current == 1 then\n" +
            "    redis.call('EXPIRE', KEYS[1], ARGV[1])\n" +
            "end\n" +
            "local ttl = redis.call('TTL', KEYS[1])\n" +
            "if ttl < 0 then\n" +
            "    redis.call('EXPIRE', KEYS[1], ARGV[1])\n" +
            "    ttl = tonumber(ARGV[1])\n" +
            "end\n" +
            "return {current, ttl}";

    @SuppressWarnings("rawtypes")
    private static final org.springframework.data.redis.core.script.RedisScript<java.util.List> LUA_SCRIPT =
            new org.springframework.data.redis.core.script.DefaultRedisScript<>(RATE_LIMIT_LUA_SCRIPT, java.util.List.class);

    private final StringRedisTemplate redisTemplate;

    @Value("${app.ratelimit.enabled:true}")
    private boolean rateLimitEnabled;

    /**
     * Kiểm tra và trừ lượt gọi API theo Rate Limiting (Fixed Window Counter with Atomic Lua Script)
     *
     * @param keyPrefix     Tiền tố nghiệp vụ (vd: "otp", "login", "booking")
     * @param identifier    Định danh đối tượng (IP hoặc User ID)
     * @param maxRequests   Số lượng yêu cầu tối đa cho phép
     * @param windowSeconds Thời lượng khung thời gian (tính bằng giây)
     * @return RateLimitResult chứa trạng thái được phép hay bị chặn cùng thời gian chờ
     */
    public RateLimitResult tryAcquire(String keyPrefix, String identifier, int maxRequests, int windowSeconds) {
        if (!rateLimitEnabled) {
            return RateLimitResult.builder()
                    .allowed(true)
                    .limit(maxRequests)
                    .remaining(maxRequests)
                    .retryAfterSeconds(0)
                    .build();
        }

        String redisKey = GLOBAL_PREFIX + keyPrefix + ":" + identifier;

        try {
            java.util.List<?> result = redisTemplate.execute(
                    LUA_SCRIPT,
                    java.util.Collections.singletonList(redisKey),
                    String.valueOf(windowSeconds)
            );

            Long currentCount = (result != null && !result.isEmpty() && result.get(0) instanceof Number n)
                    ? n.longValue() : 1L;
            Long ttl = (result != null && result.size() > 1 && result.get(1) instanceof Number n)
                    ? n.longValue() : (long) windowSeconds;

            if (currentCount != null && currentCount > maxRequests) {
                log.warn("Rate limit EXCEEDED for key {}: count={}, limit={}, ttl={}s",
                        redisKey, currentCount, maxRequests, ttl);

                return RateLimitResult.builder()
                        .allowed(false)
                        .limit(maxRequests)
                        .remaining(0)
                        .retryAfterSeconds(Math.max(1, ttl))
                        .build();
            }

            long remaining = Math.max(0, maxRequests - (currentCount != null ? currentCount : 0));
            return RateLimitResult.builder()
                    .allowed(true)
                    .limit(maxRequests)
                    .remaining(remaining)
                    .retryAfterSeconds(0)
                    .build();

        } catch (Exception ex) {
            // Chiến lược Fail-Open: Nếu Redis gặp sự cố mạng, cho phép request đi tiếp để không gián đoạn dịch vụ
            log.warn("RateLimiterService error checking key {}: {}. Allowing request as fail-open.",
                    redisKey, ex.getMessage());

            return RateLimitResult.builder()
                    .allowed(true)
                    .limit(maxRequests)
                    .remaining(maxRequests)
                    .retryAfterSeconds(0)
                    .build();
        }
    }
}

