# Redis Connection Troubleshooting Guide

## 🔴 Vấn đề Phát hiện

### ❌ **Vấn đề 1: KHÔNG CÓ Redis Configuration Class**
- **Triệu chứng:** Connection timeout hoặc serialization error
- **Nguyên nhân:** Spring Boot auto-configure không đủ, cần explicit config
- **Fix:** Tạo `RedisConfig.java` class với `JedisConnectionFactory`

### ❌ **Vấn đề 2: Thiếu Jedis Dependency**
- **Triệu chứng:** `No suitable redis client library available`
- **Nguyên nhân:** pom.xml chỉ có `spring-boot-starter-data-redis` mà không có client implementation
- **Fix:** Thêm `redis.clients:jedis` dependency

### ❌ **Vấn đề 3: Connection Pool KHÔNG được configure**
- **Triệu chứng:** Connection timeout, max connection exceeded errors
- **Nguyên nhân:** Thiếu connection pool settings
- **Fix:** Thêm `spring.data.redis.jedis.pool.*` properties

### ❌ **Vấn đề 4: Serialization Issue**
- **Triệu chứng:** `Cannot deserialize`, `Unexpected token` error
- **Nguyên nhân:** RedisTemplate sử dụng default Java serialization
- **Fix:** Configure StringRedisSerializer để serialization consistency

---

## ✅ Những gì đã Fix

### 1️⃣ **Tạo RedisConfig.java**
```java
@Configuration
public class RedisConfig {
    @Bean
    public JedisPoolConfig jedisPoolConfig() { ... }
    
    @Bean
    public RedisConnectionFactory redisConnectionFactory() { ... }
    
    @Bean
    public StringRedisTemplate stringRedisTemplate() { ... }
}
```

### 2️⃣ **Cập nhật pom.xml**
```xml
<!-- Jedis Client for Redis -->
<dependency>
    <groupId>redis.clients</groupId>
    <artifactId>jedis</artifactId>
</dependency>
```

### 3️⃣ **Cập nhật application.properties**
```properties
# Redis Connection Pool
spring.data.redis.jedis.pool.max-active = 8
spring.data.redis.jedis.pool.max-idle = 8
spring.data.redis.jedis.pool.min-idle = 0
spring.data.redis.timeout = 2000ms
```

### 4️⃣ **Thêm RedisHealthCheckConfig**
- Automatic health check on startup
- Test serialization
- Log connection status

---

## 🧪 Test Redis Connection

### Option 1: Check Logs
```bash
# Run and look for:
# ✅ "Redis connection SUCCESSFUL"
# ✅ "StringRedisTemplate configured successfully"
```

### Option 2: Manual Test with Redis CLI
```bash
# On your local machine with Redis running:
redis-cli -h localhost -p 6379
> ping
PONG

# Check if app set the health-check key:
> get idempotent:*
```

### Option 3: Test IdempotencyService
```bash
# Send 2 payment requests in parallel with same bookingId
# Only 1 should succeed (due to Redis lock)
```

---

## 🚀 Production Checklist

- [ ] Redis server is running (docker, managed service, etc)
- [ ] `spring.data.redis.host` points to correct host
- [ ] `spring.data.redis.port` is accessible (no firewall blocking)
- [ ] If Redis has password: set `spring.data.redis.password`
- [ ] Connection pool settings tuned for your load
- [ ] Monitoring: Redis memory, connection count
- [ ] Backup: AOF or RDB snapshots configured

---

## 💡 Common Issues & Solutions

### Issue: `Connection refused`
```
Error: Unable to connect to Redis at localhost:6379
```
**Solution:**
```bash
# Check if Redis is running
redis-cli ping
# If not, start Redis
# Linux: sudo systemctl start redis-server
# Mac: brew services start redis
# Docker: docker run -d -p 6379:6379 redis
```

### Issue: `Unexpected character in payload`
```
com.fasterxml.jackson.core.JsonEOFException: Unexpected end-of-input in VALUE_STRING
```
**Solution:** 
- Using Java serialization vs JSON serialization mismatch
- RedisConfig already uses StringRedisSerializer (fixed)

### Issue: `Max pool connections exceeded`
```
Could not get a resource from the pool
```
**Solution:**
- Increase `max-active` in properties
- Check for connection leaks
- Reduce pool wait time

### Issue: `Timeout waiting for connection`
```
Error waiting for idle object
```
**Solution:**
- Increase `spring.data.redis.timeout`
- Reduce number of concurrent requests
- Check Redis server performance

---

## 📝 IdempotencyService Implementation

```java
@Service
public class IdempotencyService {
    private final StringRedisTemplate redisTemplate;
    
    // Set key only if NOT exists (idempotent)
    public boolean tryLock(String key, long ttlSeconds) {
        return Boolean.TRUE.equals(redisTemplate.opsForValue().setIfAbsent(
            "idempotent:" + key,
            "PROCESSING",
            ttlSeconds,
            TimeUnit.SECONDS
        ));
    }
}
```

**Flow:**
1. First payment request → `tryLock()` returns `true` → Process payment
2. Duplicate request (same bookingId) → `tryLock()` returns `false` → Return existing payment
3. After TTL expires → Key deleted → Can retry

---

## 🔗 Files Changed

- ✅ `RedisConfig.java` - New configuration class
- ✅ `RedisHealthCheckConfig.java` - Health check on startup
- ✅ `pom.xml` - Added Jedis dependency
- ✅ `application.properties` - Connection pool settings

---

**Last Updated:** 2026-08-04
**Status:** ✅ Ready to test
