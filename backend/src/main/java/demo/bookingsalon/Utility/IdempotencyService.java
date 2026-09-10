package demo.bookingsalon.Utility;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Service
@Primary
@ConditionalOnProperty(name = "app.redis.enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class IdempotencyService  {
    private static final String KEY_PREFIX = "idempotent:";

    private final StringRedisTemplate redisTemplate;

    private String buildKey(String key) {
        return KEY_PREFIX + key;
    }

    // Key format: idempotent:{businessKey}
    public boolean tryLock(String key, long ttlSeconds) {
        return Boolean.TRUE.equals(redisTemplate.opsForValue().setIfAbsent(
                buildKey(key),
                "PROCESSING",
                ttlSeconds,
                TimeUnit.SECONDS));
    }

    // Nếu failed request thì sẽ release lock để client retry
    public void release(String key) {
            redisTemplate.delete(buildKey(key));
    }

    public void save(String key, String value, long ttlSeconds) {
        redisTemplate.opsForValue().set(
                buildKey(key),
                value,
                ttlSeconds,
                TimeUnit.SECONDS);
    }

    public String get(String key) {
        return redisTemplate.opsForValue().get(buildKey(key));
    }

    public boolean exists(String key) {
        return Boolean.TRUE.equals(redisTemplate.hasKey(buildKey(key)));
    }

}
