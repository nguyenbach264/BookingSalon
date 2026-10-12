# 📋 BookingSalon — Báo Cáo Đánh Giá Mã Nguồn Toàn Diện

> **Ngày review:** 2026-10-12  
> **Reviewer:** AI Code Review  
> **Stack:** Spring Boot 3 · React 18 · MySQL 8 · Redis · Keycloak · VNPay · Cloudinary · WebSocket  
> **Phạm vi:** Toàn bộ backend + frontend source code

---

## Mục Lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Xác thực & Phân quyền (Auth / BFF)](#2-xác-thực--phân-quyền-auth--bff)
3. [Booking — Đặt lịch hẹn](#3-booking--đặt-lịch-hẹn)
4. [Payment — Thanh toán](#4-payment--thanh-toán)
5. [Order — Đặt hàng sản phẩm](#5-order--đặt-hàng-sản-phẩm)
6. [Voucher](#6-voucher)
7. [Review — Đánh giá](#7-review--đánh-giá)
8. [Notification & WebSocket](#8-notification--websocket)
9. [User Management](#9-user-management)
10. [Database & Schema](#10-database--schema)
11. [Cấu hình & Bảo mật hệ thống](#11-cấu-hình--bảo-mật-hệ-thống)
12. [Frontend](#12-frontend)
13. [Tổng hợp Bug theo mức độ](#13-tổng-hợp-bug-theo-mức-độ)
14. [So sánh với chuẩn Production](#14-so-sánh-với-chuẩn-production)
15. [Ưu điểm nổi bật](#15-ưu-điểm-nổi-bật)
16. [Roadmap fix trước khi Production](#16-roadmap-fix-trước-khi-production)

---

## 1. Tổng Quan Kiến Trúc

### Sơ đồ hệ thống

```
┌─────────────────────────────────────────────────────────────┐
│                    React SPA (Vite 5)                        │
│  Auth: BFF Pattern + PKCE OIDC + Direct Login Form          │
│  State: Redux Toolkit (cart) + Context (auth, notification) │
│  UI: TailwindCSS                                            │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS (JSESSIONID cookie)
                           │ WebSocket ws://
┌──────────────────────────▼──────────────────────────────────┐
│              Spring Boot 3.x Backend (Port 8080)             │
│  Security: Spring Security OAuth2 Resource Server           │
│  Auth Layer: BFF Session (HttpSession server-side)          │
│  DB Access: Spring Data JPA + Hibernate                     │
│  Migration: Flyway (V1 → V7)                               │
│  Cache/Lock: Redis (Lettuce)                                │
│  Scheduler: Spring @Scheduled + ShedLock                    │
│  WebSocket: Spring WebSocket (non-STOMP)                    │
│  Payment: VNPay + SePay + Bank Transfer                     │
│  Storage: Cloudinary                                        │
│  Email: Spring Mail (SMTP)                                  │
└──────┬──────────────────────┬───────────────────────────────┘
       │                      │
  MySQL 8.0              Redis 7.x
  (InnoDB, utf8mb4)      (Idempotency lock)
       │
  Keycloak 22+
  (Realm: booking-salon-realm)
  Google IDP
```

### Nhận định chung

| Khía cạnh | Đánh giá | Ghi chú |
|-----------|----------|---------|
| Kiến trúc tổng thể | ⭐⭐⭐⭐ | Layered architecture rõ ràng, phân tách Service/Repository/Controller |
| Bảo mật Auth | ⭐⭐⭐⭐ | BFF + PKCE đúng chuẩn, vài lỗi config nhỏ |
| Xử lý đồng thời | ⭐⭐⭐⭐ | SERIALIZABLE + Retryable + Pessimistic Lock + Atomic SQL |
| Payment Integration | ⭐⭐⭐ | Strategy Pattern tốt, vài bug logic |
| Performance | ⭐⭐ | findAll() khắp nơi, thiếu pagination, thiếu index |
| Production-readiness | ⭐⭐ | Secrets lộ, hardcode URL, thiếu rate limiting |
| Code Quality | ⭐⭐⭐ | Có DRY violations, System.out.println, e.printStackTrace() |
| Testing | ⭐⭐⭐ | Unit + Integration tests có, thiếu E2E |

---

## 2. Xác Thực & Phân Quyền (Auth / BFF)

### 2.1 Tổng quan luồng xác thực

```
Luồng 1 — Direct Login (Modal Form):
  User → POST /api/auth/login (username+password)
       → Backend → Keycloak (Direct Access Grant)
       → Backend lưu token vào HttpSession
       → Trả về JSESSIONID cookie (httpOnly)

Luồng 2 — OIDC PKCE (Redirect):
  User → Frontend generate code_verifier + code_challenge
       → Redirect → Keycloak /auth?code_challenge=S256
       → Keycloak → Callback /oauth2/callback?code=...
       → Backend exchange code → tokens
       → Lưu vào HttpSession → JSESSIONID

Luồng 3 — Google OAuth2:
  User → Frontend → Keycloak (Google IDP hint)
       → Google consent → Keycloak callback
       → Token exchange → Backend session
```

### 2.2 Phân tích BffSessionService

**File:** `backend/src/main/java/demo/bookingsalon/Service/BffSessionService.java`

#### ✅ Đúng và tốt

**Token không bao giờ ra browser:**
```java
// Access token + refresh token lưu server-side
session.setAttribute(SESSION_ACCESS_TOKEN, accessToken);
session.setAttribute(SESSION_REFRESH_TOKEN, refreshToken);

// Browser chỉ nhận JSESSIONID cookie
ResponseCookie sessionCookie = ResponseCookie.from("JSESSIONID", session.getId())
    .httpOnly(true)   // JavaScript không đọc được
    .path("/")
    .maxAge(cookieMaxAge)
    .sameSite("Lax")
    .build();
```
> Đây là BFF Pattern chuẩn — eliminates token theft từ browser.

**Double-checked locking cho token refresh:**
```java
Object lock = getSessionLock(session.getId());
synchronized (lock) {
    // Kiểm tra lại sau khi vào lock
    Instant currentExpiresAt = (Instant) session.getAttribute(SESSION_EXPIRES_AT);
    if (currentExpiresAt != null && Instant.now().isBefore(currentExpiresAt.minusSeconds(30))) {
        return currentAccessToken; // Thread khác đã refresh xong
    }
    // ... refresh token
}
```
> Đúng — tránh thundering herd khi nhiều request đồng thời cùng phiên session.

**Fallback client-id khi refresh:**
```java
// Thử refresh với stored client, nếu lỗi thử client khác
List<ClientAuthSpec> clientsToTry = new ArrayList<>();
// Danh sách fallback clients...
```
> Tốt cho compatibility giữa admin client và frontend client.

#### ❌ Bugs & Hạn chế

**🔴 BUG: Memory Leak `sessionLocks` Map**

```java
// Dòng 114 - BffSessionService.java
private final ConcurrentHashMap<String, Object> sessionLocks = new ConcurrentHashMap<>();
```

**Vấn đề:** Lock object chỉ được xóa khi `clearSession()` được gọi. Nếu session tự expire (server-side timeout sau 30 ngày), hoặc server crash rồi restart, lock object tồn tại mãi trong heap.

**Kịch bản xảy ra:** 1000 users mở app rồi đóng tab không logout → 1000 lock objects rò rỉ.

**Fix:**
```java
// Dùng Caffeine Cache với expiry
private final Cache<String, Object> sessionLocks = Caffeine.newBuilder()
    .expireAfterAccess(35, TimeUnit.DAYS)
    .maximumSize(100_000)
    .build();

private Object getSessionLock(String sessionId) {
    return sessionLocks.get(sessionId, k -> new Object());
}
```

---

**🔴 PRODUCTION-BREAKING: `secure=false` trên cookie**

```java
// Dòng 100 - BffSessionService.java
ResponseCookie sessionCookie = ResponseCookie.from("JSESSIONID", session.getId())
    .httpOnly(true)
    .secure(false)   // ← SAI cho production HTTPS!
    ...
```

**Vấn đề:** Cookie sẽ bị gửi qua HTTP plaintext. Attacker ở cùng network có thể sniff JSESSIONID → session hijacking.

**Fix:**
```java
// Dùng @Value để detect environment
@Value("${server.ssl.enabled:false}")
private boolean sslEnabled;

.secure(sslEnabled || "https".equals(scheme))
```

Hoặc đơn giản hơn, đặt trong `application.properties`:
```properties
server.servlet.session.cookie.secure=true
```

---

**🟡 Security Risk: `sessionFixation().none()`**

```java
// SecurityConfig.java
.sessionFixation().none()
```

**Vấn đề:** Tắt hoàn toàn session fixation protection. Attacker có thể pre-set session ID rồi chờ victim login vào session đó.

**Fix:**
```java
.sessionFixation().newSession()  // Tạo session ID mới sau khi login
```

---

**🟡 Session timeout 30 ngày bất kể rememberMe**

```java
// Dòng 81-82 - BffSessionService.java
int sessionTimeoutSeconds = 30 * 24 * 3600; // luôn 30 ngày
session.setMaxInactiveInterval(sessionTimeoutSeconds);
```

**Vấn đề:** `rememberMe` param được nhận nhưng không ảnh hưởng timeout. User không chọn "nhớ tôi" vẫn giữ session 30 ngày.

**Fix:**
```java
int sessionTimeoutSeconds = Boolean.TRUE.equals(rememberMe)
    ? 30 * 24 * 3600   // 30 ngày nếu remember me
    : 1 * 3600;         // 1 giờ nếu không
session.setMaxInactiveInterval(sessionTimeoutSeconds);
```

---

### 2.3 Phân tích SecurityConfig

**File:** `backend/src/main/java/demo/bookingsalon/Configuration/SecurityConfig.java`

#### ✅ Đúng và tốt

**BearerTokenResolver — dual auth support:**
```java
.bearerTokenResolver(request -> {
    // 1. Header Authorization (Swagger, Postman)
    String header = request.getHeader("Authorization");
    if (header != null && header.startsWith("Bearer ")) {
        return header.substring(7);
    }
    // 2. BFF Session (browser)
    String sessionToken = bffSessionService.resolveValidAccessToken(request);
    return sessionToken;
})
```
> Tốt — hỗ trợ cả browser (cookie) và API client (header).

**CSRF whitelist đúng cho webhooks:**
```java
.ignoringRequestMatchers(
    "/api/payments/webhook/**",
    "/api/v1/payments/webhook/**",
    "/ws/**"         // WebSocket handshake
)
```
> Đúng — webhook và WebSocket không cần CSRF token.

**KeycloakRoleConverter:**
```java
// Dòng 31 - KeycloakRoleConverter.java
.map(role -> "ROLE_" + role)  // "USER" → "ROLE_USER"
```
> Đúng chuẩn Spring Security role prefix.

#### ❌ Hạn chế

**🟠 Không có rate limiting trên auth endpoints:**
```java
// Không có giới hạn rate cho:
.requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
.requestMatchers(HttpMethod.POST, "/api/auth/register/send-otp").permitAll()
.requestMatchers(HttpMethod.POST, "/api/auth/forgot-password/send-otp").permitAll()
```
Brute-force attack trên login và OTP flooding dễ dàng.

**Fix — Thêm Bucket4j:**
```java
@Bean
public RateLimiter loginRateLimiter() {
    Bandwidth limit = Bandwidth.classic(5, Refill.greedy(5, Duration.ofMinutes(1)));
    return Bucket.builder().addLimit(limit).build();
}
```

---

## 3. Booking — Đặt Lịch Hẹn

### 3.1 Tổng quan luồng

```
User → POST /api/booking
     → BookingService.createBooking()
         1. Load ServiceOfferings → tính totalDuration, totalPrice
         2. isTimeSlotAvailable() → Pessimistic Lock → check conflict
         3. Validate Voucher → calculateDiscount
         4. Load User, Stylist → check Stylist OFF
         5. Tạo Booking (status=PENDING)
         6. Tạo BookingDetails
         7. Tạo Payment record
         8. Publish BookingCreatedEvent (async email)
         9. WebSocket notify User
        10. WebSocket notify Stylist
     ← BookingResponse
```

**File:** `backend/src/main/java/demo/bookingsalon/Service/BookingService.java`

### 3.2 ✅ Đúng và tốt

**SERIALIZABLE Isolation + Retryable:**
```java
@Transactional(isolation = Isolation.SERIALIZABLE)
@Retryable(
    retryFor = ObjectOptimisticLockingFailureException.class,
    maxAttempts = 3,
    backoff = @Backoff(delay = 100, multiplier = 2.0)
)
public BookingResponse createBooking(CreateBookingRequest bookingRequest) throws Exception {
```
> Đúng cho high-contention booking scenario. SERIALIZABLE đảm bảo không có phantom reads, Retryable với exponential backoff tránh thundering herd.

**Pessimistic Lock cho conflict check:**
```java
List<Booking> conflictingBookings = bookingRepository.findConflictingBookingsByStylist(
    stylistId, bookingStartTime, bookingEndTime);
```
> Giả sử query dùng `@Lock(LockModeType.PESSIMISTIC_WRITE)` — đúng để block concurrent booking cùng stylist.

**Interval overlap algorithm:**
```java
// Thuật toán Interval Intersection chuẩn
if (slotStart.isBefore(bEnd) && slotEnd.isAfter(bStart)) {
    bookedSlots.add(...);
}
```
> Đúng hoàn toàn — `A.start < B.end AND A.end > B.start`.

**Tổng hợp giá và thời lượng từ services:**
```java
int totalDuration = offeringDTOs.stream().mapToInt(ServiceOffering::getDuration).sum();
BigDecimal totalPrice = offeringDTOs.stream()
    .map(ServiceOffering::getPrice)
    .reduce(BigDecimal.ZERO, BigDecimal::add);
```
> Đúng — tính đúng tổng duration và price từ nhiều dịch vụ.

### 3.3 ❌ Bugs & Hạn chế

**🔴 BUG LOGIC: Kiểm tra Stylist OFF sau khi đã lock**

```java
// Dòng 186 - Conflict check CHẠY TRƯỚC (tốn lock, I/O)
boolean isAvailable = isTimeSlotAvailable(salonDTO, bookingRequest.getStylistId(), ...);

// ...

// Dòng 228 - Check stylist OFF CHẠY SAU (quá muộn!)
if (stylist.getStatus() != null && "OFF".equalsIgnoreCase(stylist.getStatus())) {
    throw new Exception("Stylist hiện đang tạm nghỉ...");
}
```

**Vấn đề:** Conflict check (pessimistic lock) xảy ra trước khi biết stylist có OFF không. Tốn DB I/O và lock vô ích.

**Fix — Đảo thứ tự validation:**
```java
// 1. Load stylist TRƯỚC
Stylist stylist = stylistRepository.findById(bookingRequest.getStylistId())
    .orElseThrow(() -> new NotFoundException("Stylist not found"));

// 2. Check trạng thái TRƯỚC khi lock
if ("OFF".equalsIgnoreCase(stylist.getStatus())) {
    throw new BookingException("Stylist hiện đang tạm nghỉ...");
}

// 3. Sau đó mới check time slot (tốn lock)
boolean isAvailable = isTimeSlotAvailable(salonDTO, stylist.getId(), ...);
```

---

**🔴 BUG BUSINESS: Bank Transfer tự động PAID**

```java
// Dòng 234 - BookingService.java
String paymentStatusStr = "BANK_TRANSFER".equals(paymentMethodStr) ? "PAID" : "UNPAID";
```

**Vấn đề nghiêm trọng:** Chuyển khoản ngân hàng không thể coi là PAID ngay khi booking! User chọn bank transfer → booking tự marked là PAID mà chưa chuyển tiền. Đây là lỗ hổng business logic nghiêm trọng nhất trong hệ thống.

**Fix:**
```java
// Tất cả đều bắt đầu UNPAID, chỉ PAID khi webhook xác nhận
String paymentStatusStr = "UNPAID";
```

---

**🔴 BUG BUSINESS: Voucher không kiểm tra per-user usage limit**

```java
// Dòng 197-218 - createBooking()
if (bookingRequest.getVoucherCode() != null) {
    Optional<Voucher> voucherOpt = voucherRepository.findByVoucherCodeAndIsDeletedFalse(code);
    if (voucherOpt.isPresent()) {
        Voucher voucher = voucherOpt.get();
        if (Boolean.TRUE.equals(voucher.getIsActive())) {
            // ← Không check usageLimitPerUser!
            discount = voucherService.calculateDiscountAmount(voucher, totalPrice);
            voucher.setUsedCount(voucher.getUsedCount() + 1);
        }
    }
}
```

**Vấn đề:** `usageLimitPerUser` field tồn tại trong DB nhưng không bao giờ được kiểm tra trong booking flow. User có thể dùng public voucher 100 lần.

**Fix:**
```java
// Kiểm tra số lần user đã dùng voucher này
if (bookingRequest.getUserId() != null && voucher.getUsageLimitPerUser() != null) {
    long userUsageCount = userVoucherRepository
        .countByUser_IdAndVoucher_VoucherCode(bookingRequest.getUserId(), code);
    if (userUsageCount >= voucher.getUsageLimitPerUser()) {
        throw new BookingException("Bạn đã sử dụng hết lượt dùng voucher này!");
    }
}
```

---

**🔴 BUG: Voucher usedCount race condition**

```java
// Không atomic — đọc từ Hibernate cache rồi +1
voucher.setUsedCount((voucher.getUsedCount() == null ? 0 : voucher.getUsedCount()) + 1);
voucherRepository.save(voucher);
```

**Kịch bản:** 2 user cùng dùng voucher lúc 10:00:00.000
- Thread A đọc usedCount = 99
- Thread B đọc usedCount = 99 (cache chưa update)
- Thread A save usedCount = 100
- Thread B save usedCount = 100 (lost update!)
- Voucher bị dùng 101 lần dù limit là 100.

**Fix — Atomic SQL update:**
```java
// Dùng @Modifying query
@Modifying
@Query("UPDATE Voucher v SET v.usedCount = v.usedCount + 1 " +
       "WHERE v.voucherCode = :code AND v.usedCount < v.usageLimitTotal")
int incrementUsedCountIfNotExceeded(@Param("code") String code);

// Return 0 nếu đã đạt limit → reject
if (voucherRepository.incrementUsedCountIfNotExceeded(code) == 0) {
    throw new BookingException("Voucher đã hết lượt sử dụng!");
}
```

---

**🔴 BUG: Double Payment Record**

```java
// BookingService.createBooking() — Tạo payment lần 1
Payment payment = Payment.builder()
    .paymentCode("PAY-" + ...)
    .amount(finalTotal)
    .build();
paymentRepository.save(payment);  // ← Save #1

// Sau đó, nếu user gọi POST /api/payments/checkout
// PaymentApplicationService.checkout() — Tạo payment lần 2
payment = Payment.builder()
    .paymentCode(generatePaymentCode())
    .amount(bookingResponse.getTotalAmount())
    .build();
payment = paymentPersistenceService.createPayment(payment);  // ← Save #2
```

**Vấn đề:** 2 Payment records cho cùng 1 booking. Idempotency check trong `checkout()` dùng key `userId-bookingId` nhưng booking đã có payment từ trước nên `paymentRepository.findByBookingId()` trả về payment cũ → return cũ, không tạo mới. Tuy nhiên logic này ngầm định và dễ vỡ.

**Fix:** Không tạo Payment record trong `createBooking()`. Chỉ tạo khi user gọi `/checkout`.

---

**🟠 Missing: Stylist cooldown không được áp dụng**

Migration V6 tạo `stylist_cooldown` field nhưng `BookingService` không đọc giá trị này. Stylist có thể có booking A kết thúc 10:00 và booking B bắt đầu 10:00 — không có thời gian nghỉ.

---

**🟡 PERFORMANCE: findAll() không phân trang**

```java
// Dòng 51 - getBookings()
return bookingRepository.findAll().stream()  // Load TẤT CẢ vào memory
    .map(booking -> bookingMapper.toBookingResponse(booking))
    .sorted(...)
    .toList();
```

**Fix:**
```java
public Page<BookingResponse> getBookings(Pageable pageable) {
    return bookingRepository.findAll(pageable)
        .map(bookingMapper::toBookingResponse);
}
```

---

**🟡 PERFORMANCE: Sort in-memory sau query**

Nhiều method như `getBookingBySalonId()` sort bằng Java Stream sau khi đã load từ DB:
```java
.sorted(Comparator.comparing(BookingResponse::getSalonId))
```
Nên dùng `ORDER BY` trong JPQL query thay vì sort sau.

---

## 4. Payment — Thanh Toán

### 4.1 Tổng quan luồng VNPay

```
User → POST /api/payments/checkout {bookingId, method: "VNPAY"}
     → PaymentApplicationService.checkout()
         1. Load booking
         2. Idempotency lock (Redis SETNX)
         3. Tạo Payment entity (status=PENDING)
         4. VnPayStrategy.generatePayment()
             → Build params (TreeMap sorted alphabetically)
             → HMAC-SHA512 sign
             → Generate QR code
             → return PaymentTransaction
         5. Payment.transitionTo(PROCESSING)
         6. Save payment
     ← PaymentResponse { paymentUrl, qrCodeData }

VNPay IPN callback → POST /api/v1/payments/webhook/vnpay
     → PaymentWebhookService.handleVNPayWebhook()
         1. Verify signature
         2. Validate amount
         3. Save PaymentTransaction
         4. Update Payment status
         5. Update Booking status (CONFIRMED nếu success)
         6. WebSocket notify user
```

**Files:**
- `backend/.../Service/PaymentApplicationService.java`
- `backend/.../Service/PaymentWebhookService.java`
- `backend/.../Strategy/VnPayStrategy.java`

### 4.2 ✅ Đúng và tốt

**Strategy Pattern mở rộng được:**
```java
// PaymentFactory
@Component
public class PaymentFactory {
    private final Map<PaymentMethod, PaymentStrategy> strategies;

    public PaymentStrategy getStrategy(PaymentMethod method) {
        return strategies.get(method);
    }
}
```
> Mở rộng thêm Momo, ZaloPay chỉ cần thêm class implement `PaymentStrategy` — đúng OCP.

**HMAC-SHA512 signature đúng chuẩn VNPay 2.1.0:**
```java
// TreeMap đảm bảo sort alphabetically theo key — VNPay yêu cầu
Map<String, String> params = new TreeMap<>();
params.put("vnp_Version", "2.1.0");
// ...
String queryString = VnPaySignatureUtil.buildQueryString(params);
String secureHash = VnPaySignatureUtil.hmacSHA512(config.getSecretKey(), queryString);
```
> Đúng chuẩn VNPay spec: params sort theo alphabet, sign bằng HMAC-SHA512.

**Idempotency với Redis SETNX:**
```java
public boolean tryLock(String key, long ttlSeconds) {
    return Boolean.TRUE.equals(redisTemplate.opsForValue().setIfAbsent(
        buildKey(key), "PROCESSING", ttlSeconds, TimeUnit.SECONDS));
}
```
> Đúng pattern distributed lock — atomic, tự expire.

**Webhook amount validation:**
```java
long callbackAmount = VNPayUtil.parseAmount(vnp_Amount);
if (callbackAmount != payment.getAmount().longValue()) {
    return buildResponse(0, "Amount mismatch");
}
```
> Đúng — verify amount trước khi xử lý, tránh manipulation.

**ShedLock cho scheduler:**
```java
@SchedulerLock(name = "expirePaymentLock", lockAtMostFor = "PT4M", lockAtLeastFor = "PT1M")
public void expirePendingPayments() {
```
> Đúng — trong multi-instance deployment, chỉ 1 instance chạy scheduler tại 1 thời điểm.

### 4.3 ❌ Bugs & Hạn chế

**🔴 SPRING AOP BUG: @Transactional trên private method**

```java
// PaymentWebhookService.java - Dòng 132
@Transactional(isolation = Isolation.SERIALIZABLE)
private Map<String, Object> handleShopOrderVnPayCallback(  // ← PRIVATE!
        String txnRef, String responseCode, ...) {

@Transactional(isolation = Isolation.SERIALIZABLE)
private Map<String, Object> handleBookingPaymentSuccess(Payment payment) { // ← PRIVATE!

@Transactional(isolation = Isolation.SERIALIZABLE)
private Map<String, Object> handleBookingPaymentFailure(...) { // ← PRIVATE!
```

**Vấn đề:** Spring AOP tạo proxy bằng cách extend class hoặc implement interface. Private methods **không thể override** bởi proxy → `@Transactional` annotation **hoàn toàn vô hiệu lực**. Các method này chạy trong transaction của caller (`handleVNPayWebhook`).

**Tác hại thực tế:**
- `handleShopOrderVnPayCallback` không có transaction isolation riêng → dễ dirty read
- Exception trong sub-method sẽ rollback toàn bộ webhook handler
- Khó control transaction boundary

**Fix:**
```java
// Option 1: Đổi thành package-private hoặc public, tách thành service riêng
// Tạo PaymentWebhookProcessor (package-private methods, Spring sẽ proxy được)

// Option 2: Extract ra bean riêng
@Service
public class BookingPaymentProcessor {
    @Transactional(isolation = Isolation.SERIALIZABLE)
    public Map<String, Object> handleSuccess(Payment payment) { ... }
}
```

---

**🔴 BUG: `orElseThrow` trong scheduler — logic sai**

```java
// ExpiredPaymentScheduler.java - Dòng 28
List<Payment> expiredList = paymentRepository.findByStatusAndExpiredAt(PaymentStatus.PENDING)
    .orElseThrow(() -> new NotFoundException("Payment not found")); // ← SAI!
```

**Vấn đề:** Khi không có payment nào hết hạn (bình thường), `Optional.empty()` → ném `NotFoundException`. Scheduler sẽ log error mỗi 5 phút dù không có gì sai!

**Fix:**
```java
List<Payment> expiredList = paymentRepository.findByStatusAndExpiredAt(PaymentStatus.PENDING)
    .orElse(Collections.emptyList());  // Empty list là bình thường

if (expiredList.isEmpty()) {
    return; // Không làm gì
}
```

---

**🟠 BUG: Amount comparison mất precision**

```java
// PaymentWebhookService.java
long callbackAmount = VNPayUtil.parseAmount(vnp_Amount); // VNPay gửi amount * 100
if (callbackAmount != payment.getAmount().longValue()) { // ← longValue() cắt phần thập phân!
```

**Ví dụ:**
- Payment amount = 150,000.50 VNĐ
- VNPay callback `vnp_Amount` = 15000050 (amount × 100)
- `callbackAmount` = 15000050
- `payment.getAmount().longValue()` = 150000 (mất .50!)
- Comparison: `15000050 != 150000` → reject sai

**Fix:**
```java
BigDecimal expectedAmount = payment.getAmount().multiply(BigDecimal.valueOf(100));
BigDecimal receivedAmount = BigDecimal.valueOf(callbackAmount);
if (expectedAmount.compareTo(receivedAmount) != 0) {
    return buildResponse(0, "Amount mismatch");
}
```

---

**🟡 VNPay IP hardcode `127.0.0.1`**

```java
// VnPayStrategy.java - Dòng 55
params.put("vnp_IpAddr", "127.0.0.1"); // Lấy IP thực tế từ HttpServletRequest nếu có
```

**Vấn đề:** VNPay yêu cầu IP thực của client để fraud detection. Dùng 127.0.0.1 trong production vi phạm VNPay policy và có thể bị reject.

**Fix — Inject HttpServletRequest:**
```java
public PaymentTransaction generatePayment(Payment payment, CreatePaymentRequest request) {
    String clientIp = request.getClientIp(); // Thêm field vào CreatePaymentRequest
    params.put("vnp_IpAddr", clientIp != null ? clientIp : "127.0.0.1");
}

// Controller:
String clientIp = Optional.ofNullable(httpRequest.getHeader("X-Forwarded-For"))
    .filter(s -> !s.isBlank())
    .map(s -> s.split(",")[0].trim())
    .orElse(httpRequest.getRemoteAddr());
```

---

**🟡 VNPay refund chưa implement**

```java
@Override
public PaymentResponse refund(Payment payment, BigDecimal amount) {
    log.warn("VNPay refund is not implemented yet");
    return null;  // ← null return từ refund!
}
```

Production cần có refund flow. Trả về `null` từ refund method dễ gây NPE ở caller.

---

## 5. Order — Đặt Hàng Sản Phẩm

### 5.1 Tổng quan luồng

```
User → POST /api/orders {items, paymentMethod, shippingAddress...}
     → OrderService.createOrder()
         1. Validate user auth
         2. Idempotency lock (Redis)
         3. Atomic stock deduction (UPDATE WHERE stock >= qty)
         4. Tính shipping fee (miễn phí ≥ 500k)
         5. Tạo Order + OrderDetails
         6. Nếu VNPay: buildVnPayUrl()
         7. Notify user (WebSocket + Notification)
     ← OrderResponse { orderCode, vnpayUrl, bankTransferDetails }
```

**File:** `backend/src/main/java/demo/bookingsalon/Service/OrderService.java`

### 5.2 ✅ Đúng và tốt

**Atomic stock deduction — đúng nhất dự án:**
```java
// productRepository.deductStockAtomic() - ví dụ implementation:
// UPDATE products SET stock_quantity = stock_quantity - :qty
// WHERE product_id = :id AND stock_quantity >= :qty
int updatedRows = productRepository.deductStockAtomic(product.getId(), qty);
if (updatedRows == 0) {
    throw new PaymentException("Sản phẩm không đủ số lượng...");
}
```
> Đây là cách đúng nhất để xử lý inventory concurrency. Tốt hơn nhiều so với SELECT rồi UPDATE riêng.

**Stock rollback khi fail:**
```java
} catch (RuntimeException ex) {
    // Rollback đã deduct
    for (CreateOrderRequest.OrderItemRequest prevDeducted : deductedItems) {
        productRepository.restoreStockAtomic(prevDeducted.getProductId(), prevDeducted.getQuantity());
    }
    idempotencyService.release(lockKey);
    throw ex;
}
```
> Đúng — manual compensation pattern khi không thể dùng 2PC.

**Authorization check:**
```java
if (userId != null && !order.getUser().getId().equals(userId)) {
    throw new PaymentException("Bạn không có quyền truy cập đơn hàng này!");
}
```
> Đúng — prevent IDOR (Insecure Direct Object Reference).

### 5.3 ❌ Bugs & Hạn chế

**🟠 Missing: Voucher không được áp dụng cho Order**

```java
// Dòng 148
BigDecimal discountAmount = BigDecimal.ZERO; // Luôn bằng 0!
BigDecimal finalAmount = totalAmount.add(shippingFee).subtract(discountAmount);
```

`VoucherService` đã có đầy đủ logic nhưng không được gọi trong Order flow. Feature này gần như đã có nhưng chưa wire vào.

**Fix:**
```java
BigDecimal discountAmount = BigDecimal.ZERO;
if (request.getVoucherCode() != null && !request.getVoucherCode().isBlank()) {
    ApplyVoucherResponse voucherResult = voucherService.validateAndCalculate(
        new ApplyVoucherRequest(request.getVoucherCode(), totalAmount.add(shippingFee)));
    if (voucherResult.isValid()) {
        discountAmount = voucherResult.getDiscountAmount();
    }
}
```

---

**🟡 Code Smell: `mapToOrderResponse()` duplicate**

Hàm này được định nghĩa lại hoàn toàn trong cả `OrderService.java` và `NotificationService.java` — vi phạm DRY principle nghiêm trọng. Khi business logic thay đổi phải sửa 2 nơi.

**Fix:** Extract thành `OrderMapper` class hoặc chỉ giữ trong `OrderService` rồi inject vào `NotificationService`.

---

**🟡 Order code collision risk**

```java
private String generateOrderCode() {
    String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
    String randPart = UUID.randomUUID().toString().substring(0, 4).toUpperCase(); // Chỉ 4 ký tự!
    return "DH" + datePart + randPart;
}
```

4 ký tự HEX = 16^4 = 65,536 combinations. Với traffic cao ngày Black Friday, collision probability tăng đáng kể.

**Fix:**
```java
// Dùng 8 ký tự hoặc sequence DB
String randPart = UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
```

---

**🟡 Không validate receiver phone format**

`receiverPhone` nhận bất kỳ String nào. Cần validate:
```java
@Pattern(regexp = "^(0[3|5|7|8|9])\\d{8}$", message = "Số điện thoại không hợp lệ!")
private String receiverPhone;
```

---

## 6. Voucher

**File:** `backend/src/main/java/demo/bookingsalon/Service/VoucherService.java`

### 6.1 ✅ Đúng và tốt

**Validate đầy đủ các trường hợp:**
```java
// Check isActive
if (!Boolean.TRUE.equals(voucher.getIsActive())) { ... }

// Check thời gian
if (now.isBefore(voucher.getStartDate())) { ... }
if (now.isAfter(voucher.getEndDate())) { ... }

// Check usage limit
if (voucher.getUsedCount() >= voucher.getUsageLimitTotal()) { ... }

// Check min order amount
if (orderAmount.compareTo(voucher.getMinOrderAmount()) < 0) { ... }
```
> Logic validate đúng và đầy đủ.

**Tính discount đúng:**
```java
public BigDecimal calculateDiscountAmount(Voucher voucher, BigDecimal orderAmount) {
    if ("PERCENT".equalsIgnoreCase(voucher.getDiscountType())) {
        discount = orderAmount.multiply(voucher.getDiscountValue())
            .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        // Cap bởi maxDiscountAmount
        if (voucher.getMaxDiscountAmount() != null) {
            discount = discount.min(voucher.getMaxDiscountAmount());
        }
    } else {
        discount = voucher.getDiscountValue(); // FIXED_AMOUNT
    }
    return discount.min(orderAmount); // Không bao giờ discount nhiều hơn order
}
```
> Đúng — có cap, có `min(orderAmount)` tránh final < 0.

### 6.2 ❌ Bugs & Hạn chế

**🔴 TOCTOU Race Condition: Validate và Apply là 2 transaction riêng**

```
Step 1: User gọi POST /api/vouchers/apply
        → validateAndCalculate() [read-only transaction]
        → Return: valid=true, discount=50,000đ

Step 2: [Khoảng thời gian này, người khác dùng hết voucher]

Step 3: User gọi POST /api/booking {voucherCode: "SALE50"}
        → createBooking() [SERIALIZABLE transaction]
        → Tìm lại voucher: usedCount=1000 >= usageLimitTotal=1000
        → Vẫn áp dụng! (code không re-validate đầy đủ)
```

Trong `createBooking()`, chỉ check `isActive` nhưng không re-check `usageLimitTotal` hay `endDate`.

**Fix:**
```java
// Trong createBooking(), validate lại đầy đủ trước khi apply
ApplyVoucherResponse validation = voucherService.validateAndCalculate(
    new ApplyVoucherRequest(code, totalPrice));
if (!validation.isValid()) {
    throw new BookingException("Voucher không còn hợp lệ: " + validation.getMessage());
}
discount = validation.getDiscountAmount();
```

---

**🟡 discountType nên là Enum**

```java
// Hiện tại: String
.discountType(request.getDiscountType().toUpperCase()) // "PERCENT" hoặc "FIXED_AMOUNT"

// Nên là:
public enum DiscountType { PERCENT, FIXED_AMOUNT }
```

Typo trong discountType ("PERCEN", "FIXED_AMT") sẽ gây silent bug — discount = 0 mà không báo lỗi.

---

## 7. Review — Đánh Giá

**File:** `backend/src/main/java/demo/bookingsalon/Service/ReviewService.java`

### 7.1 ✅ Đúng và tốt

**Cập nhật rating stylist sau mỗi review:**
```java
if (review.getStylistId() != null) {
    Double avg = reviewRepository.getAverageRatingByStylistId(review.getStylistId());
    Long count = reviewRepository.countByStylistId(review.getStylistId());
    stylistRepository.findById(review.getStylistId()).ifPresent(s -> {
        s.setRatingAverage(BigDecimal.valueOf(avg)...);
        s.setTotalReviewsCount(count.intValue());
        stylistRepository.save(s);
    });
}
```
> Đúng — denormalize rating vào Stylist entity để query nhanh.

**Chống review trùng lặp:**
```java
if (b.isReviewed()) {
    throw new IllegalStateException("Lịch hẹn này đã được gửi đánh giá trước đó!");
}
b.setReviewed(true);
```
> Đúng concept, nhưng thiếu `@Lock` → race condition nếu 2 request đồng thời.

### 7.2 ❌ Bugs & Hạn chế

**🔴 BUG: Không check booking status trước khi review**

```java
if (reviewDTO.getBookingId() != null) {
    Booking b = bookingRepository.findById(reviewDTO.getBookingId()).orElse(null);
    if (b != null) {
        if (b.isReviewed()) { ... } // Check reviewed
        // ← KHÔNG check b.getStatus() == COMPLETED!
        b.setReviewed(true);
    }
}
```

**Vấn đề:** User có thể submit review cho booking đang PENDING hoặc CONFIRMED (chưa hoàn thành dịch vụ). Thậm chí booking CANCELLED cũng có thể bị review.

**Fix:**
```java
if (b.getStatus() != BookingStatus.COMPLETED) {
    throw new IllegalStateException("Chỉ có thể đánh giá lịch hẹn đã hoàn tất!");
}
if (b.isReviewed()) {
    throw new IllegalStateException("Lịch hẹn này đã được đánh giá rồi!");
}
```

---

**🔴 BUG: Xóa review không cập nhật rating stylist**

```java
@Transactional
public void deleteReview(UUID id) {
    reviewRepository.deleteById(id);
    // ← Không recalculate stylist rating!
}
```

Nếu admin xóa review 1 sao của stylist, rating vẫn hiển thị thấp. Data inconsistency.

**Fix:**
```java
@Transactional
public void deleteReview(UUID id) {
    Review review = reviewRepository.findById(id)
        .orElseThrow(() -> new NotFoundException("Review not found"));
    UUID stylistId = review.getStylistId();
    
    reviewRepository.deleteById(id);
    
    // Recalculate sau khi xóa
    if (stylistId != null) {
        Double avg = reviewRepository.getAverageRatingByStylistId(stylistId);
        Long count = reviewRepository.countByStylistId(stylistId);
        stylistRepository.findById(stylistId).ifPresent(s -> {
            s.setRatingAverage(avg != null ? BigDecimal.valueOf(avg) : BigDecimal.ZERO);
            s.setTotalReviewsCount(count != null ? count.intValue() : 0);
            stylistRepository.save(s);
        });
    }
}
```

---

**🟡 BUG: `broadcastNewReview()` ném RuntimeException roll back transaction**

```java
private void broadcastNewReview(ReviewDTO response) {
    try {
        String json = objectMapper.writeValueAsString(message);
        webSocketHandler.broadcast(json);
    } catch (JsonProcessingException e) {
        throw new RuntimeException("Cannot create WebSocket message", e); // ← Roll back!
    }
}
```

Nếu Jackson serialize fail (rất hiếm nhưng có thể), review đã được save vào DB sẽ bị rollback. User mất review.

**Fix:**
```java
} catch (JsonProcessingException e) {
    log.error("Failed to serialize review for WebSocket broadcast", e);
    // Không throw — review đã save, chỉ broadcast thất bại là chấp nhận được
}
```

---

**🟡 Race condition trong `isReviewed` check**

```java
if (b.isReviewed()) {
    throw new IllegalStateException(...);
}
b.setReviewed(true);  // ← Giữa 2 dòng này có thể có concurrent request
bookingRepository.save(b);
```

**Fix — Dùng optimistic lock hoặc atomic update:**
```java
int updated = bookingRepository.markAsReviewed(bookingId); // UPDATE WHERE is_reviewed = false
if (updated == 0) {
    throw new IllegalStateException("Lịch hẹn đã được đánh giá!");
}
```

---

## 8. Notification & WebSocket

**Files:**
- `backend/.../Handler/NotificationWebSocketHandler.java`
- `backend/.../Service/NotificationService.java`

### 8.1 ✅ Đúng và tốt

**Identity verification qua session attributes:**
```java
// afterConnectionEstablished - Handler
UUID authUserId = (UUID) session.getAttributes().get("userId"); // Từ interceptor (authenticated)
UUID authStylistId = (UUID) session.getAttributes().get("stylistId");

// handleTextMessage - REGISTER event
if (authUserId.equals(claimedUserId)) { // Phải match identity từ handshake
    userSessions.computeIfAbsent(authUserId, ...).add(session);
} else {
    log.warn("Session {} attempted to spoof userId {}", ...); // Chống spoofing
}
```
> Đúng — client không thể tự claim userId của người khác.

**Thread-safe session storage:**
```java
private final Set<WebSocketSession> allSessions = new CopyOnWriteArraySet<>();
private final Map<UUID, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
```
> `CopyOnWriteArraySet` safe cho iterate+modify đồng thời. `ConcurrentHashMap` safe cho concurrent access.

**PING/PONG keepalive:**
```java
if ("PING".equalsIgnoreCase(type)) {
    session.sendMessage(new TextMessage("{\"type\":\"PONG\"}"));
}
```
> Giữ connection alive qua proxy/load balancer có timeout ngắn.

### 8.2 ❌ Bugs & Hạn chế

**🔴 ARCHITECTURE: WebSocket không scale ngang**

```java
// In-memory maps — chỉ hoạt động trên 1 instance!
private final Map<UUID, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
```

**Kịch bản fail:** Deploy 2 instances (A và B) trên Kubernetes:
- User connect WebSocket vào Instance A
- Admin tạo booking trên Instance B
- Instance B gọi `notificationWebSocketHandler.sendToUser(userId, ...)` → check `userSessions` của B → rỗng → không gửi được

**Fix — Redis Pub/Sub:**
```java
// Publish từ bất kỳ instance nào
@Service
public class NotificationPublisher {
    public void publish(UUID userId, Object payload) {
        redisTemplate.convertAndSend("notifications:" + userId, toJson(payload));
    }
}

// Subscribe trên từng instance
@RedisMessageListener(channel = "notifications:*")
public void onMessage(String message, String channel) {
    UUID userId = extractUserId(channel);
    // Gửi tới local WebSocket sessions của user này
    sendToLocalSessions(userId, message);
}
```

---

**🟡 Code Smell: `getNotificationById` gọi markAsRead 2 lần**

```java
// NotificationService.java
public NotificationDTO getNotificationById(UUID notificationId) {
    notificationRepository.markAsRead(notificationId);  // SQL UPDATE #1
    
    Notification notification = notificationRepository.findById(notificationId)...;
    notification.setRead(true);
    notification.setReadAt(LocalDateTime.now());
    notification = notificationRepository.save(notification);  // SQL UPDATE #2 (via JPA)
}
```

2 DB write cho cùng 1 thao tác. Chỉ cần 1.

---

**🟡 BUG: Regex trong `findOrderFromText` không match**

```java
// NotificationService.java - Dòng 357
Matcher m = Pattern.compile("ORD-[A-Za-z0-9-]+").matcher(text);
```

Nhưng order code format thực tế từ `generateOrderCode()`:
```java
return "DH" + datePart + randPart; // Ví dụ: "DH261012AB3F"
```

Pattern `ORD-...` sẽ không bao giờ match `DH261012AB3F`. Feature "load order từ notification text" hoàn toàn vô dụng.

**Fix:**
```java
// Match pattern "DH" + 6 digits + 4 chars
Matcher m = Pattern.compile("DH\\d{6}[A-Z0-9]{4}").matcher(text);
```

---

**🟡 Notification expired records không bao giờ được cleanup**

`expiredAt` field tồn tại nhưng không có scheduler xóa expired notifications. Table sẽ tăng trưởng vô hạn.

**Fix:**
```java
@Scheduled(cron = "0 0 2 * * *") // Mỗi ngày 2:00 AM
@SchedulerLock(name = "cleanupExpiredNotifications")
@Transactional
public void cleanupExpiredNotifications() {
    int deleted = notificationRepository.deleteByExpiredAtBefore(LocalDateTime.now());
    log.info("Cleaned up {} expired notifications", deleted);
}
```

---

## 9. User Management

**File:** `backend/src/main/java/demo/bookingsalon/Service/UserService.java`

### 9.1 ✅ Đúng và tốt

**Dual-ID lookup (DB ID và Keycloak ID):**
```java
public UserResponse getUserById(UUID id) {
    User user = userRepository.findById(id).orElse(null);
    if (user == null) {
        user = userRepository.findByKeycloakId(id); // Fallback
    }
    // ...
}
```
> Xử lý đúng trường hợp client gửi Keycloak ID thay vì DB ID.

**OAuth2 user sync khi đăng nhập Google:**
```java
public User syncOrProvisionOAuth2User(UUID keycloakId, String email, ...) {
    // 1. Tìm theo keycloakId
    // 2. Tìm theo email → link keycloakId
    // 3. Tạo mới nếu chưa có
}
```
> Đúng — tránh duplicate user khi user đã tồn tại từ direct registration.

**Email verification sync với Keycloak:**
```java
// Khi verify OTP thành công
user.setEmailVerified(true);
userRepository.save(user);

// Đồng bộ lên Keycloak
userRep.setEmailVerified(true);
keycloak.realm(realm).users().get(keycloakId.toString()).update(userRep);
```
> Đúng — giữ consistency giữa DB và Keycloak.

### 9.2 ❌ Bugs & Hạn chế

**🔴 CRITICAL PERFORMANCE: `getUsers()` làm Keycloak sync trên MỖII request**

```java
public List<UserResponse> getUsers() {
    List<User> dbUsers = userRepository.findAll(); // Load tất cả users

    // Mỗi lần gọi API, sync từ Keycloak!
    List<UserRepresentation> kcUsers = keycloak.realm(realm).users().list();
    // ... loop qua từng KC user, save vào DB nếu chưa có
    for (UserRepresentation kcUser : kcUsers) {
        userRepository.save(u); // N saves!
    }
}
```

**Vấn đề:** Mỗi lần Admin mở trang Users là:
1. Load tất cả DB users (N records)
2. Call Keycloak API lấy tất cả KC users
3. So sánh và save từng user mới

Với 1000 users, mỗi request tốn hàng giây. Admin dashboard sẽ rất chậm.

**Fix:** Tách sync ra cron job riêng, `getUsers()` chỉ query DB.

---

**🔴 CRITICAL: `getUserDetailSummary()` gọi `bookingRepository.findAll()`**

```java
// Dòng 173-181 - UserService.java
List<Booking> allBookings = bookingRepository.findAll(); // Load TẤT CẢ bookings!
for (Booking b : allBookings) {
    if (phone.equals(b.getCustomerPhone()) || ...) {
        rawBookings.add(b);
    }
}
```

**Vấn đề:** Load toàn bộ booking table (có thể hàng trăm nghìn records) vào memory để tìm booking theo phone number. Tương tự với `orderRepository.findAll()`.

**Fix:**
```java
// Thêm query trong repository
List<Booking> findByCustomerPhone(String phone);
List<Booking> findByCustomerEmail(String email);
```

---

**🟡 `getUsersByPagination()` load tất cả rồi sub-list**

```java
public List<UserResponse> getUsersByPagination(int first, int max, String search) {
    List<User> list = userRepository.findAll(); // Load tất cả!
    // ... filter trong memory
    return list.subList(fromIndex, toIndex)...; // Pagination in-memory
}
```

Đây là fake pagination — load full rồi cắt. Dùng `Pageable` thực sự:
```java
Page<User> page = userRepository.findBySearchQuery(search, PageRequest.of(first/max, max));
```

---

## 10. Database & Schema

**Files:** `backend/src/main/resources/db/migration/`

### 10.1 ✅ Đúng và tốt

| Điểm tốt | Chi tiết |
|----------|----------|
| **Flyway migration** | V1→V7, versioned và reproducible |
| **BINARY(16) cho UUID** | Tiết kiệm 50% space vs VARCHAR(36), index nhanh hơn |
| **utf8mb4_unicode_ci** | Hỗ trợ đầy đủ Unicode, emoji, tiếng Việt |
| **Optimistic lock `version`** | Trên bookings, orders, payments — đúng chuẩn JPA |
| **ON DELETE CASCADE** | booking_details → bookings, cart_items → carts |
| **validate mode** | `JPA_DDL_AUTO=validate` — không tự sửa schema production |
| **Soft delete** | `deleted_at`, `is_deleted` fields thay vì hard delete |

### 10.2 ❌ Hạn chế

**🔴 PERFORMANCE: Thiếu index quan trọng**

```sql
-- bookings không có index trên start_time, end_time
-- Query findConflictingBookingsByStylist sẽ full table scan!
CREATE INDEX idx_bookings_stylist_time ON bookings (stylist_id, start_time, end_time);
CREATE INDEX idx_bookings_user_id ON bookings (user_id);
CREATE INDEX idx_bookings_salon_id ON bookings (salon_id);
CREATE INDEX idx_bookings_status ON bookings (status);

-- notifications không index user_id
CREATE INDEX idx_notifications_user_id ON notifications (user_id);
CREATE INDEX idx_notifications_expired_at ON notifications (expired_at);

-- orders không index user_id và vnpay_txn_ref
CREATE INDEX idx_orders_user_id ON orders (user_id);
CREATE INDEX idx_orders_vnpay_txn_ref ON orders (vnpay_txn_ref);
```

---

**🟡 Design: `admins` table cô lập**

```sql
CREATE TABLE admins (...) -- Không có FK đến bất kỳ bảng nào
```

Admin không nhận được notification, không có booking history, không liên kết với payment. Nếu muốn gửi notification cho admin, hệ thống hiện tại không hỗ trợ.

**Đề xuất:** Merge Admin vào `users` với role-based approach, hoặc thêm FK.

---

**🟡 V7 migration nullable salon_id rủi ro**

```sql
-- V1: salon_id NOT NULL
-- V7: ALTER TABLE stylists MODIFY salon_id BINARY(16) NULL
```

Nếu server chạy với partial migration (V1 done, V7 pending), ứng dụng sẽ fail. Cần test migration path đầy đủ.

---

## 11. Cấu Hình & Bảo Mật Hệ Thống

**Files:** `.env`, `application.properties`

### 11.1 ❌ Các Vấn Đề Nghiêm Trọng

**🔴 CRITICAL: Secrets lộ trong `.env`**

```bash
# .env file — CÓ THỂ BỊ COMMIT LÊN GIT!
KEYCLOAK_CLIENT_SECRET=Nrys6AchVUk9UNPFGqUFkkLYZxhbURqg...
KEYCLOAK_IDP_GOOGLE_CLIENT_ID=856801661882-rl7186pg4goqf1r3...
KEYCLOAK_IDP_GOOGLE_CLIENT_SECRET=GOCSPX-3Oxn1eGc5NCA7ycw...
DB_PASSWORD=Bach@vt05
MAIL_PASSWORD=ezimnjlvschkhwri
CLOUDINARY_API_SECRET=FbbjoMXTZ9Nq0JUExp6XyRSpMWU
```

**Hành động ngay lập tức:**
1. Kiểm tra `.gitignore` — `.env` PHẢI có trong đó
2. Nếu đã commit lên repo: rotate tất cả credentials ngay
3. Dùng GitHub Secrets / Vault / K8s Secrets thay thế

```bash
# .gitignore phải có:
.env
.env.*
!.env.example
```

---

**🔴 DoS Risk: Upload limit 100MB**

```properties
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=100MB
```

100MB upload không có rate limiting = attacker gửi liên tục → disk full + OOM.

**Fix:**
```properties
spring.servlet.multipart.max-file-size=10MB
spring.servlet.multipart.max-request-size=10MB
```
Và thêm Nginx rate limiting ở tầng trên.

---

**🔴 Production: `spring.jpa.show-sql=true`**

```properties
spring.jpa.show-sql=true  # Log tất cả SQL → performance impact + security
```

SQL logs có thể chứa sensitive data (passwords, OTPs trong IN clauses). Log đầy disk.

**Fix:**
```properties
# application-production.properties
spring.jpa.show-sql=false
logging.level.org.hibernate.SQL=WARN
```

---

**🟡 Logging config sai prefix:**

```properties
# application.properties - Dòng 78
logging.org.springframework.web=INFO  # ← Thiếu "level."!
```

Đúng phải là:
```properties
logging.level.org.springframework.web=INFO
```

---

## 12. Frontend

### 12.1 ✅ Đúng và tốt

| Điểm tốt | Chi tiết |
|----------|----------|
| **BFF-aware Auth** | Không lưu token trong storage, dùng JSESSIONID cookie |
| **PKCE implementation** | `pkce.js` implement S256 code challenge đúng chuẩn |
| **ErrorBoundary** | Bắt render errors, hiển thị fallback UI |
| **useCallback cho auth methods** | Memoize để tránh re-render không cần thiết |
| **Session persistence** | Giữ trạng thái qua F5 bằng localStorage profile |
| **purgeBrowserTokens** | Xóa sạch token cũ khi logout |

### 12.2 ❌ Hạn chế

**🔴 Hardcode URL localhost — Production-breaking**

```javascript
// authProvider.jsx - Hardcode ở nhiều nơi
const response = await fetch("http://localhost:8080/api/auth/login", ...)
const oidcLogoutUrl = `http://localhost:8081/realms/...`
```

```javascript
// keycloak.js
authUrl: "http://localhost:8081/realms/..."
```

**Fix:**
```javascript
// .env.development
VITE_API_URL=http://localhost:8080
VITE_KEYCLOAK_URL=http://localhost:8081

// .env.production
VITE_API_URL=https://api.bookingsalon.vn
VITE_KEYCLOAK_URL=https://auth.bookingsalon.vn

// Sử dụng
const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, ...)
```

---

**🟡 Cart chỉ lưu local (Redux)**

```javascript
// cartSlice.js — local state only
const cartSlice = createSlice({
    initialState: { items: [] }
    // Không sync với server
})
```

User thêm sản phẩm vào cart → đóng tab → mở lại → giỏ hàng trống. Không đồng bộ giữa thiết bị.

**Fix:** Sync cart lên backend, dùng CartService đã có.

---

**🟡 `checkCurrentSession` poll mỗi 4 phút**

```javascript
const interval = setInterval(() => {
    checkCurrentSession(); // Gọi /api/auth/me mỗi 4 phút
}, 4 * 60 * 1000);
```

N users online × poll mỗi 4 phút = nhiều request lãng phí. BFF đã tự refresh token server-side, không cần frontend poll.

**Fix:** Chỉ check khi tab được focus lại hoặc khi có lỗi 401.

---

**🟡 User profile trong localStorage dễ đọc**

```javascript
localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
```

Dù không chứa token, thông tin user (email, phone, name) lưu trong localStorage dễ bị đọc qua XSS. Thay bằng sessionStorage hoặc tải từ server khi cần.

---

**🟡 WebSocket không auto-reconnect**

```javascript
// useNotificationWebSocket.js
const ws = new WebSocket(url);
ws.onclose = () => {
    // Không có reconnect logic!
};
```

Network glitch → WebSocket close → user không nhận notification cho đến khi refresh trang.

**Fix:**
```javascript
const reconnect = (attempt = 0) => {
    const delay = Math.min(1000 * 2 ** attempt, 30000); // Exponential backoff
    setTimeout(() => connect(attempt + 1), delay);
};
ws.onclose = (e) => {
    if (!e.wasClean) reconnect(attempt);
};
```

---

## 13. Tổng Hợp Bug Theo Mức Độ

### 🔴 CRITICAL — Ảnh hưởng trực tiếp đến tiền và data

| # | Bug | File | Mô tả |
|---|-----|------|-------|
| C1 | Secrets lộ trong `.env` | `.env` | DB password, API keys, OAuth secrets có thể bị commit lên Git |
| C2 | Bank Transfer = PAID ngay | `BookingService.java:234` | Booking bank transfer tự động PAID mà chưa nhận tiền |
| C3 | `@Transactional` private method | `PaymentWebhookService.java:132` | Spring AOP không wrap private method → transaction fail |
| C4 | Voucher không check per-user limit | `BookingService.java:197` | Public voucher dùng được vô hạn lần |
| C5 | Review không check booking COMPLETED | `ReviewService.java:67` | User review booking chưa hoàn thành |
| C6 | Xóa review không update rating | `ReviewService.java:140` | Rating stylist sai sau khi admin xóa review |
| C7 | Memory leak `sessionLocks` | `BffSessionService.java:114` | Heap tăng dần theo thời gian vận hành |

### 🟠 SERIOUS — Ảnh hưởng UX và data integrity

| # | Bug | File | Mô tả |
|---|-----|------|-------|
| S1 | `findAll()` không phân trang | Nhiều service | OOM với hàng chục nghìn records |
| S2 | WebSocket không scale ngang | `NotificationWebSocketHandler.java` | Multi-instance → user không nhận notification |
| S3 | `getUserDetailSummary` gọi `findAll()` | `UserService.java:173` | Load toàn bộ bookings/orders vào memory |
| S4 | Amount comparison mất precision | `PaymentWebhookService.java:91` | Có thể reject thanh toán hợp lệ |
| S5 | Voucher TOCTOU race condition | `VoucherService.java` | Validate và apply là 2 transaction riêng |
| S6 | Double payment record | `BookingService.java` + `PaymentApplicationService.java` | 2 payment cho 1 booking |
| S7 | Regex `findOrderFromText` sai pattern | `NotificationService.java:357` | Feature "order từ notification" không hoạt động |
| S8 | Order code collision risk | `OrderService.java:372` | 4 ký tự random với traffic cao |

### 🟡 MINOR — Code quality và cải thiện

| # | Bug | Mô tả |
|---|-----|-------|
| M1 | `secure=false` cookie | Production HTTPS cần `secure=true` |
| M2 | Hardcode URL localhost frontend | Cần `VITE_API_URL` env var |
| M3 | `show-sql=true` production | Performance + security risk |
| M4 | Sort in-memory sau query | Nên dùng `ORDER BY` SQL |
| M5 | `mapToOrderResponse()` duplicate | DRY violation |
| M6 | Notification không cleanup expired | Table tăng vô hạn |
| M7 | `logging.org.` thiếu `level.` | Config bị ignore |
| M8 | Cart không sync server | UX: mất cart khi đổi thiết bị |
| M9 | WebSocket không auto-reconnect | UX: mất notification sau network glitch |
| M10 | `sessionFixation().none()` | Session fixation vulnerability |
| M11 | VNPay IP hardcode `127.0.0.1` | VNPay policy violation |
| M12 | Stylist cooldown không áp dụng | Schema có nhưng code không dùng |

---

## 14. So Sánh Với Chuẩn Production

| Tiêu chí | Hiện tại | Chuẩn Production | Đánh giá |
|----------|---------|------------------|----------|
| Authentication | BFF + PKCE ✅ | Token không lộ browser | ✅ Đúng hướng |
| Authorization | Role-based ✅ | Fine-grained RBAC | 🟡 Đủ cho level này |
| CSRF Protection | CookieCsrfTokenRepository ✅ | SPA CSRF handling | ✅ Đúng |
| Input Validation | Thiếu nhiều | Bean Validation + Sanitize | 🟠 Cần bổ sung |
| Rate Limiting | ❌ Không có | Bucket4j / API Gateway | 🔴 Thiếu |
| Pagination | Thiếu nhiều API | Tất cả list endpoint | 🔴 Thiếu |
| Caching strategy | Redis (idempotency only) | Cache + CDN | 🟡 Partial |
| Structured Logging | SLF4J basic | JSON structured logs | 🟡 Cần nâng cấp |
| Distributed Tracing | ❌ Không | Micrometer + Zipkin | 🟠 Thiếu |
| Circuit Breaker | ❌ Không | Resilience4j | 🟡 Nice to have |
| Health Checks | Spring Actuator (mặc định) | Custom health indicators | 🟡 Basic |
| API Versioning | `/api/v1/` partial | Consistent across all | 🟡 Inconsistent |
| Error Response format | Không nhất quán | RFC 7807 Problem Details | 🟡 Cần chuẩn hóa |
| Secrets Management | `.env` file | Vault / K8s Secrets | 🔴 Phải đổi |
| DB Indexing | Partial (thiếu key indexes) | Full indexing | 🟠 Thiếu |
| Horizontal Scaling | ❌ WebSocket in-memory | Redis Pub/Sub / STOMP | 🔴 Không scale |
| DB Connection Pool | Default Hikari | Hikari tuned | 🟡 OK cho dev |
| Unit Testing | Có | >80% coverage | 🟡 Good start |
| Integration Testing | Có | Testcontainers | 🟡 Good |
| E2E Testing | ❌ Không | Playwright/Cypress | 🟠 Thiếu |
| CI/CD | Không rõ | GitHub Actions / GitLab CI | 🟠 Cần setup |
| Container | Không rõ | Docker + K8s | 🟠 Cần setup |

---

## 15. Ưu Điểm Nổi Bật

Dự án thể hiện nhiều kỹ thuật cao cấp hiếm gặp ở level junior/mid:

1. **🏆 BFF Pattern đúng chuẩn** — Token hoàn toàn server-side, browser chỉ nhận JSESSIONID
2. **🏆 PKCE OIDC Authorization Code Flow** — OAuth2 best practice 2024, thay thế Implicit Flow
3. **🏆 SERIALIZABLE + Retryable cho concurrent booking** — Giải quyết đúng bài toán double-booking
4. **🏆 Pessimistic Write Lock cho conflict check** — Đúng kỹ thuật cho high-contention resource
5. **🏆 Strategy Pattern cho Payment** — OCP compliant, dễ thêm Momo/ZaloPay
6. **🏆 ShedLock distributed scheduler** — Đúng cho multi-instance deployment
7. **🏆 Atomic stock deduction** — `UPDATE WHERE stock >= qty` thay vì SELECT+UPDATE
8. **🏆 Redis Idempotency** — Tránh duplicate payment với distributed lock
9. **🏆 Flyway migration** — Reproducible schema, safe deployment
10. **🏆 WebSocket identity verification** — Chống spoofing qua interceptor

---

## 16. Roadmap Fix Trước Khi Production

### 🔴 P0 — Phải fix trước khi deploy (1-2 ngày)

```
[ ] Thêm .env vào .gitignore, rotate tất cả credentials bị lộ
[ ] Đổi Bank Transfer paymentStatus PAID → PENDING (BookingService:234)
[ ] Fix secure=false → secure=true cho JSESSIONID cookie
[ ] Tắt spring.jpa.show-sql=true trong production
[ ] Fix logging.org. → logging.level.org.
[ ] Thêm index: bookings(stylist_id, start_time, end_time), notifications(user_id)
[ ] Fix orElseThrow trong ExpiredPaymentScheduler → orElse(emptyList)
```

### 🟠 P1 — Fix trong tuần đầu tiên (3-5 ngày)

```
[ ] Tách private @Transactional methods trong PaymentWebhookService → public beans
[ ] Thêm per-user voucher usage check trong createBooking()
[ ] Fix Review: check booking COMPLETED trước khi allow review
[ ] Fix Review: recalculate stylist rating khi deleteReview()
[ ] Fix getUserDetailSummary: thay findAll() bằng specific queries
[ ] Fix getUsers(): tách KC sync ra cron job riêng
[ ] Thêm Pagination cho tất cả list APIs
[ ] Fix memory leak sessionLocks → Caffeine cache với expiry
[ ] Thêm Rate Limiting cho /api/auth/login, /api/auth/register/send-otp
[ ] Frontend: thay hardcode URL → VITE_API_URL env var
```

### 🟡 P2 — Cải thiện trong Sprint 2-3 (1-2 tuần)

```
[ ] WebSocket scale: Redis Pub/Sub hoặc STOMP + ActiveMQ
[ ] Fix voucher race condition: atomic SQL increment
[ ] Thêm Voucher apply cho Order flow
[ ] Fix notification cleanup scheduler
[ ] Fix findOrderFromText regex pattern
[ ] Structured logging: Logback JSON encoder
[ ] Fix WebSocket auto-reconnect ở frontend
[ ] Sync cart lên server (CartService đã có)
[ ] Thêm sessionFixation().newSession()
[ ] Fix VNPay IP hardcode → lấy từ HttpServletRequest
[ ] Fix amount comparison precision trong webhook
[ ] Implement VNPay refund flow
[ ] Thêm Stylist cooldown trong booking conflict check
[ ] Fix mapToOrderResponse() duplicate → single OrderMapper
```

### 🟢 P3 — Nice to have (Backlog)

```
[ ] Distributed tracing: Micrometer + Zipkin
[ ] Circuit Breaker: Resilience4j cho Keycloak / VNPay calls
[ ] API Gateway với rate limiting
[ ] Chuẩn hóa error response theo RFC 7807
[ ] Consistent API versioning /api/v1/ cho tất cả
[ ] E2E Testing với Playwright
[ ] Docker Compose đầy đủ
[ ] CI/CD pipeline
[ ] Health check endpoints tùy chỉnh
[ ] Admin merge vào users table
```

---

> **Kết luận:** Dự án BookingSalon có nền tảng kiến trúc **tốt hơn mức trung bình** cho một dự án thực hành/startup. Nhiều quyết định kỹ thuật thể hiện tư duy production-ready. Tuy nhiên, có một số bug logic nghiêm trọng (Bank Transfer PAID, @Transactional private method, Secrets lộ) cần được fix trước khi bất kỳ user thực nào sử dụng hệ thống. Với roadmap P0 + P1 (~1 tuần), dự án có thể đạt mức production-ready cơ bản.

