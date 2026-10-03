# PRODUCTION READINESS REVIEW — BookingSalon

**Ngay review**: 2026-09-30
**Phien ban he thong**: Spring Boot 3.5.3 - React 19 - MySQL 8 - Keycloak 26 - Redis - WebSocket

---

## MUC LUC

1. [Tong quan kien truc he thong](#1-tong-quan-kien-truc-he-thong)
2. [Diem manh (Strengths)](#2-diem-manh)
3. [Diem yeu & Rui ro (Weaknesses)](#3-diem-yeu--rui-ro)
4. [Phan tich chi tiet tung tang](#4-phan-tich-chi-tiet-tung-tang)
5. [Lo trinh de xuat (Production Roadmap)](#5-lo-trinh-de-xuat)
6. [Bang uu tien tong hop](#6-bang-uu-tien-tong-hop)

---

## 1. Tong quan kien truc he thong

```
+-----------------------------+       +-------------------------------+
|       Client Layer          |       |       Infrastructure           |
|  React 19 + Vite 8          |       |  Keycloak 26 (IAM / SSO)      |
|  Ant Design 6 + Tailwind    |       |  Redis  (Session + Idempotent)|
|  WebSocket Singleton        |       |  MySQL 8 (InnoDB + Flyway)    |
|  Redux (cart state)         |       |  Cloudinary (Media Storage)   |
+----------+------------------+       +----------+--------------------+
           |                                     |
           |  HTTP + BFF Session / ws://          |
           v                                     v
+-----------------------------------------------------+
|              Spring Boot 3.5.3                       |
|                                                     |
|  REST Controllers  ->  Spring Security (OAuth2)     |
|  Service Layer (Business Logic)                     |
|  WebSocket Handler  (Raw WS, khong STOMP)           |
|  ShedLock Scheduler (Expired Payments cleanup)      |
|  Async ThreadPool   (Payment + Booking executors)   |
|  Payment Gateway:   VNPay | SePay | COD             |
+-----------------------------------------------------+
```

**Dac diem kien truc**: Monolith modular, co tu duy huong microservice.
Package duoc tach ro: Controller / Service / Repository / Strategy / Storage / Handler.

---

## 2. Diem manh

### Stack cong nghe hien dai

| Thanh phan    | Phien ban | Nhan xet                                    |
|---------------|-----------|---------------------------------------------|
| Spring Boot   | 3.5.3     | Moi nhat, ho tro Java 21 Virtual Threads    |
| React         | 19.2      | Concurrent Mode, production-ready           |
| Keycloak      | 26.0      | Enterprise IAM chuan cong nghiep            |
| Flyway        | Bundled   | DB migration co version control             |
| ShedLock      | 6.10      | Distributed scheduler an toan multi-instance|
| MapStruct     | 1.6.3     | Compile-time mapper, hieu nang cao          |

### Thiet ke Database chuyen nghiep

- **22 bang** thiet ke theo **3NF/BCNF**
- `BINARY(16)` luu UUID — tiet kiem 55% dung luong index so voi `VARCHAR(36)`
- **Optimistic Locking** (cot `version`) tren tat ca bang nghiep vu quan trong => chong **Double Booking**
- **Soft Delete** (`is_deleted`) bao toan audit trail
- Audit fields chuan: `created_at`, `updated_at`
- **Flyway migrations V1 -> V6** kiem soat schema co the rollback

### Security duoc cau hinh tot

- **Keycloak** lam Identity Provider chuan OAuth2/OIDC — khong tu quan ly password
- **BFF (Backend For Frontend) Pattern**: Access token luu server-side HttpSession, khong lo ra localStorage
- Ham `purgeBrowserTokens()` xoa token khoi browser storage
- Fine-grained RBAC: `USER` / `STYLIST` / `ADMIN` ro rang tren tung endpoint
- CORS chi cho phep origin cu the, khong wildcard tren HTTP

### Idempotency & Distributed Locking

- `IdempotencyService` dung Redis `SETNX` voi TTL — ngan duplicate payment request
- `@Retryable` tren `BookingService` xu ly `OptimisticLockingFailureException` voi backoff
- `ShedLock` dam bao scheduler `ExpiredPaymentScheduler` chi chay tren 1 node

### Real-time WebSocket

- Push thong bao tuc thi (< 50ms latency) cho ca User va Stylist
- Stylist Dashboard tu dong cap nhat khi co booking moi — khong can reload thu cong
- Reconnect tu dong sau 4 giay + Heartbeat Ping moi 25 giay

### Thiet ke Service Layer tot

- **Strategy Pattern** cho Payment (`VnPayStrategy`, `BankTransferStrategy`, `CodPaymentStrategy`)
- **Strategy Pattern** cho Media Storage va Media Folder (Cloudinary)
- Tach biet ro rang: `PaymentApplicationService` / `PaymentPersistenceService` / `PaymentWebhookService`
- Async ThreadPool rieng biet cho Payment (max 20 threads) va Booking (max 10 threads)

---

## 3. Diem yeu & Rui ro

---

### CRITICAL — Rui ro cao nhat

---

#### C1. Secrets lo ra Git (Credential Exposure)

File `.env` (root va backend) chua **credential that** dang duoc track trong repository:

```
KEYCLOAK_CLIENT_SECRET = Nrys6AchVUk9UNP...
KEYCLOAK_IDP_GOOGLE_CLIENT_SECRET = GOCSPX-3Oxn1eGc...
MAIL_PASSWORD = ezimnjlvsc...
CLOUDINARY_API_SECRET = FbbjoMXTZ9Nq...
DB_PASSWORD = Bach@vt05  (username root!)
VNPAY_HASH_SECRET = UCPHPNWGQPJLWGD...
VNPAY_TMN_CODE = U8WZ0T3L
```

> **DAY LA LOI BAO MAT NGHIEM TRONG NHAT.**
> Neu repo nay da tung push len GitHub (du la private), tat ca secrets nay coi nhu da bi lo.
> Can ROTATE NGAY LAP TUC toan bo credentials va them `.env` vao `.gitignore`.

---

#### C2. Database root user trong production

`DB_USERNAME=root` — Production TUYET DOI KHONG duoc dung `root`.
Can tao user rieng voi minimal privilege (SELECT/INSERT/UPDATE/DELETE chi tren schema cu the).

```sql
CREATE USER 'bookingsalon_app'@'%' IDENTIFIED BY '<strong_random_password>';
GRANT SELECT, INSERT, UPDATE, DELETE ON bookingsalondb.* TO 'bookingsalon_app'@'%';
FLUSH PRIVILEGES;
```

---

#### C3. WebSocket khong co Authentication

```java
// WebSocketConfig.java
registry.addHandler(notificationWebSocketHandler, "/ws/reviews", "/ws/notifications")
        .setAllowedOriginPatterns("*");  // <- Wildcard, bat ky ai cung ket noi duoc!
```

WebSocket endpoint hoan toan public. Hien tai chi validate `userId` qua query param
(`?userId=...`) do client tu truyen — **khong co xac thuc thuc su**.
Bat ky ai cung co the subscribe va nhan event cua nguoi khac.

---

#### C4. CSRF disabled toan bo

```java
.csrf(csrf -> csrf.disable())
```

Du co BFF session pattern, viec disable CSRF hoan toan tao attack surface lon.
Session cookie `JSESSIONID` co the bi khai thac CSRF voi `SameSite=Lax` (khong phai `Strict`).

---

### HIGH — Anh huong lon den van hanh

---

#### H1. N+1 Query Problem tiem an

```java
// BookingService.java — NGUY HIEM
return bookingRepository.findAll().stream()
    .map(booking -> bookingMapper.toBookingResponse(booking))
    .sorted(...)
    .toList();
```

`findAll()` khong co pagination + lazy-load relations => N+1 queries khi du lieu tang.
Khong co `@EntityGraph` hay `JOIN FETCH` trong cac query phuc tap.

---

#### H2. Filter in-memory thay vi DB query

```java
public List<BookingResponse> getBookingByDate(LocalDate date, UUID salonId) {
    List<BookingResponse> bookings = getBookingBySalonId(salonId); // Load het du lieu
    return bookings.stream()
        .filter(item -> item.getStartTime().toLocalDate().equals(date)) // Filter trong Java
        .toList();
}
```

Day la full table scan trong ung dung. Can chuyen thanh DB query:
`WHERE start_time BETWEEN :dayStart AND :dayEnd`.

---

#### H3. Khong co API Rate Limiting

Khong co throttling tren cac endpoint nhay cam:
`/api/auth/login`, `/api/payments/**`, `/api/bookings`.
De bi brute-force va DDoS.

---

#### H4. Logging khong phu hop production

```properties
spring.jpa.show-sql=true                               # In SQL ra log production!
logging.level.demo.bookingsalon.payment=DEBUG          # DEBUG level production!
```

SQL logging va DEBUG level se gay log flood, tiet lo thong tin nhay cam va anh huong performance.

---

#### H5. Session timeout 30 ngay qua dai

```properties
server.servlet.session.cookie.max-age=30d
server.servlet.session.timeout=30d
```

30 ngay session voi `SameSite=Lax` la qua dai va rui ro bao mat.
Can ket hop sliding window refresh va revocation mechanism.

---

#### H6. Upload size 100MB khong co kiem soat

```properties
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=100MB
```

Khong co virus scan, file type validation dung chuan, hay rate limit =>
rui ro storage abuse va DoS.

---

#### H7. WebSocket dung ConcurrentHashMap in-memory — khong scale duoc

```java
// NotificationWebSocketHandler
ConcurrentHashMap<UUID, Set<WebSocketSession>> userSessions
```

Khi scale len nhieu instance (horizontal scaling), WebSocket sessions tren instance khac
nhau se khong thay nhau. User ket noi vao Instance A se **khong nhan** duoc notification
tu Instance B.

---

### MEDIUM — No ky thuat

---

#### M1. Test Coverage cuc thap

Chi co 3 domain duoc test:
- `BookingTest / CreateBookingTest.java`
- `PaymentTest / PaymentControllerTest.java`, `PaymentRepositoryTest.java`
- `SalonTest / CreateSalonTest.java`

**Hoan toan khong co test** cho: UserService, ReviewService, OrderService,
NotificationService, VoucherService, cac Mapper, cac Strategy.

---

#### M2. groupId la "demo" — chua duoc chuan hoa cho release

```xml
<groupId>demo</groupId>
<artifactId>BookingSalon</artifactId>
<version>0.0.1-SNAPSHOT</version>
```

SNAPSHOT version va groupId `demo` cho thay chua duoc chuan hoa cho production release.

---

#### M3. schema.sql ton tai song song voi Flyway

Ca `schema.sql` va Flyway migrations (`V1__init_schema.sql`) cung ton tai.
Day la xung dot tiem an. Can xoa `schema.sql` va de Flyway quan ly toan bo schema.

---

#### M4. flyway.validate-on-migrate=false

```properties
spring.flyway.validate-on-migrate=false
```

Tat validation => Flyway se khong phat hien khi migration script bi chinh sua sau khi
da chay. Nguy hiem trong moi truong nhieu developer.

---

#### M5. Frontend khong co Error Boundary toan cuc

React app khong co Error Boundary wrapper. Mot loi render trong bat ky component nao se
crash toan bo ung dung, nguoi dung thay trang trang.

---

#### M6. localStorage luu user profile khong duoc ky

```javascript
// authProvider.jsx
localStorage.setItem("bs_user_profile", JSON.stringify(user));
```

Profile user (bao gom roles, userId) luu localStorage khong duoc ky (signed).
Co the bi tamper neu khong validate lai o server.

---

#### M7. Thieu Global Exception Handler thong nhat

Khong thay `@RestControllerAdvice` hay `GlobalExceptionHandler` chung.
Loi unhandled co the tra ve stack trace cho client.

---

#### M8. Khong co Health Check / Actuator

Khong co Spring Boot Actuator — khong co `/health`, `/metrics` endpoint cho
load balancer va monitoring system.

---

#### M9. Redis khong co password trong cau hinh mau

```
REDIS_PASSWORD=   # trong
```

Redis khong password trong development co the vo tinh deploy len production ma khong co bao ve.

---

### LOW — Cai thien chat luong code

#### L1. URL pattern khong nhat quan trong SecurityConfig

```java
// Duplicate, de bo sot:
"/api/salons/**", "/api/salon/**", "/api/salon", "/api/salons"
```

#### L2. keycloak-js dependency thua

`keycloak-js ^26.2.4` trong dependencies nhung flow thuc te dung PKCE tu implement.
Dependency thua gay bundle size tang khong can thiet.

#### L3. API versioning khong nhat quan

Mot so route `/api/v1/payments/...`, mot so `/api/payments/...` — khong dong nhat.

#### L4. DataSeeder va KeycloakSeeder co the chay trong production

Khong ro seeder co guard chi chay trong dev khong — rui ro insert data thua hoac
override data production.

---

## 4. Phan tich chi tiet tung tang

---

### 4.1 Database & Data Layer

**Diem manh:**
- `BINARY(16)` UUID Primary Keys — tiet kiem index space
- Optimistic Locking (`version`) tren bookings, stylists, users
- Soft Delete (`is_deleted`) toan he thong
- Flyway migration V1 -> V6 co version control
- Day du Audit Trail (`created_at`, `updated_at`)

**Van de:**
- `schema.sql` + Flyway migration trung lap => confusing
- `flyway.validate-on-migrate=false` => nguy hiem
- Thieu composite indexes cho cac query phuc tap
- `rating_average`, `total_spent` la denormalized counter => co the drift theo thoi gian
- Thieu cau hinh HikariCP connection pool tuong minh

**De xuat them composite indexes:**

```sql
-- Indexes quan trong dang thieu
CREATE INDEX idx_bookings_stylist_date
    ON bookings(stylist_id, start_time);

CREATE INDEX idx_bookings_salon_status
    ON bookings(salon_id, status, start_time);

CREATE INDEX idx_orders_user_status
    ON orders(user_id, status, created_at);

CREATE INDEX idx_payments_status_expires
    ON payments(status, expires_at);

CREATE INDEX idx_notifications_user_unread
    ON notifications(user_id, is_read, created_at);
```

**De xuat cau hinh HikariCP:**

```properties
spring.datasource.hikari.maximum-pool-size=20
spring.datasource.hikari.minimum-idle=5
spring.datasource.hikari.connection-timeout=30000
spring.datasource.hikari.idle-timeout=600000
spring.datasource.hikari.max-lifetime=1800000
spring.datasource.hikari.leak-detection-threshold=60000
```

---

### 4.2 Backend — Spring Boot

**Kien truc package hien tai (tot):**

```
Configuration/   <- 15 config classes
Controller/      <- REST endpoints
Entity/          <- JPA entities
Enum/            <- Enumerations
Event/           <- Domain events
Factory/         <- Object factories
Handler/         <- WebSocket handlers
Listener/        <- Event listeners
Mapper/          <- MapStruct mappers
Payload/         <- DTOs (Request/Response)
Publisher/       <- Event publishers
Repository/      <- Spring Data JPA
Service/         <- Business logic
Storage/         <- Media strategies
Strategy/        <- Payment strategies
Utility/         <- Helper classes
Validation/      <- Custom validators
```

**Van de kien truc:**

1. **Service layer qua beo** — `BookingService` (492 lines, 15 bean phu thuoc).
   Can tach them:
   - `BookingQueryService` (read operations)
   - `BookingCommandService` (write operations)
   - `BookingScheduleValidator` (conflict check logic)

2. **In-memory sort/filter thay vi DB** — Nhieu service dung `.sorted()` Java stream
   sau khi da fetch toan bo data tu DB.

3. **Pagination thieu** — `bookingRepository.findAll()` khong co `Pageable`.
   Khi co 10.000+ bookings se gay OutOfMemoryError.

**De xuat refactor BookingService:**

```java
// BEFORE — Nguy hiem khi co nhieu du lieu
return bookingRepository.findAll().stream()
    .map(booking -> bookingMapper.toBookingResponse(booking))
    .sorted(...)
    .toList();

// AFTER — Production-ready voi pagination
Page<Booking> bookings = bookingRepository.findAll(
    PageRequest.of(page, size, Sort.by("startTime").descending())
);
return bookings.map(bookingMapper::toBookingResponse);
```

**Fix N+1 voi JOIN FETCH:**

```java
// BookingRepository.java
@Query("SELECT b FROM Booking b " +
       "JOIN FETCH b.user " +
       "JOIN FETCH b.stylist " +
       "JOIN FETCH b.salon " +
       "WHERE b.stylistId = :stylistId " +
       "AND DATE(b.startTime) = :date")
List<Booking> findByDateAndStylistWithRelations(
    @Param("stylistId") UUID stylistId,
    @Param("date") LocalDate date
);
```

---

### 4.3 Security & Authentication

**Luong xac thuc hien tai:**

```
User Login
  -> Keycloak PKCE flow (authProvider.jsx)
  -> Access Token nhan tu Keycloak
  -> Luu server-side HttpSession (BFF pattern)
  -> Request API -> Spring Security resolve token tu Session
  -> JWT validate voi Keycloak JWKS endpoint
  -> KeycloakRoleConverter extract roles
  -> RBAC: USER / STYLIST / ADMIN
```

**Danh gia**: BFF pattern la dung huong va tot. Tuy nhien:

| Van de                    | Rui ro                        | Fix de xuat                          |
|---------------------------|-------------------------------|--------------------------------------|
| `.csrf(disable())`        | CSRF attack                   | Enable CSRF, exception cho webhook   |
| WebSocket khong auth      | Bat ky ai nhan duoc event     | Validate JWT luc WebSocket handshake |
| `SameSite=Lax`            | CSRF qua cross-origin         | Doi sang `SameSite=Strict`           |
| Session 30 ngay           | Session hijacking window dai  | Giam 8h, sliding window refresh      |
| Swagger public production | Lo API schema                 | Guard bang `ADMIN` role              |

**Fix WebSocket authentication:**

```java
// WebSocketConfig.java — them interceptor
@Override
public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(notificationWebSocketHandler, "/ws/notifications", "/ws/reviews")
            .addInterceptors(new HttpSessionHandshakeInterceptor())
            .setAllowedOriginPatterns("*");
}

// NotificationWebSocketHandler.java — validate trong afterConnectionEstablished
@Override
public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    String token = extractTokenFromSession(session);
    if (token == null || !jwtValidator.isValid(token)) {
        session.close(CloseStatus.NOT_ACCEPTABLE);
        return;
    }
    // Tiep tuc register session binh thuong
}
```

---

### 4.4 Real-time & Event Flow

**Luong hien tai (hoat dong tot voi single-instance):**

```
User dat booking
  -> POST /api/bookings
  -> BookingService.createBooking()
  -> Luu Booking vao MySQL
  -> NotificationService.notifyBookingCreated()
  -> Luu Notification vao MySQL
  -> NotificationWebSocketHandler.sendToUser(userId, payload)
  -> ConcurrentHashMap lookup -> WebSocketSession
  -> Push JSON payload den React client (< 50ms)
  -> Toast notification + Badge update
```

**Van de khi scale horizontally:**

```
Instance A (User ket noi WS)          Instance B (xu ly booking)
  userSessions = {userX: sessionA}      userSessions = {userY: sessionB}

  Booking tao tren Instance B -> goi sendToUser(userX)
  -> Lookup userSessions cua Instance B -> KHONG TIM THAY userX
  -> Notification THAT LAC, User khong nhan duoc
```

**Giai phap — Redis Pub/Sub:**

```java
// Khi can notify user: publish qua Redis
public void sendToUser(UUID userId, Object payload) throws Exception {
    String json = objectMapper.writeValueAsString(payload);
    // Broadcast qua Redis channel (tat ca instance deu nhan)
    redisTemplate.convertAndSend("ws:notifications:user:" + userId, json);
    // Dong thoi forward neu user ket noi local
    forwardToLocalSession(userId, json);
}

// Subscribe Redis -> forward den local WebSocket session
@Bean
public RedisMessageListenerContainer container(RedisConnectionFactory factory) {
    RedisMessageListenerContainer container = new RedisMessageListenerContainer();
    container.setConnectionFactory(factory);
    container.addMessageListener(
        new MessageListenerAdapter(notificationWebSocketHandler, "handleRedisMessage"),
        new PatternTopic("ws:notifications:*")
    );
    return container;
}
```

---

### 4.5 Payment System

**Diem manh:**
- Strategy Pattern cho da gateway (VNPay, SePay, COD)
- Idempotency voi Redis SETNX lock
- ShedLock cho expired payment cleanup scheduler
- Tach biet PaymentApplicationService / PaymentPersistenceService / PaymentWebhookService
- `VnPaySignatureUtil` verify HMAC signature webhook

**Van de:**

```properties
# .env — VNPay webhook URL tro localhost => khong hoat dong khi deploy!
VNPAY_RETURN_URL=http://localhost:8080/api/v1/payments/webhook/vnpay/return
VNPAY_NOTIFY_URL=http://localhost:8080/api/v1/payments/webhook/vnpay
```

Can thay bang domain that khi deploy production.

**Can them:**
- Webhook retry handling voi dead letter queue
- Rate limit tren `/api/payments/webhook/**`
- Verify signature cho SePay webhook (can kiem tra hien da co chua)
- Centralized payment state machine (tranh trang thai khong nhat quan)

---

### 4.6 Frontend — React

**Kien truc frontend (tot):**

```
src/
  auth/           <- authProvider (PKCE flow), keycloak.js
  config/         <- api.js (base URL)
  hooks/          <- useNotificationWebSocket, useReviewWebSocket, useRoleRedirect
  pages/          <- AdminPage, BookingPage, CartPage, CheckoutPage, ...
  redux/          <- cartSlice, store
  service/
    api/          <- adminApi, bookingApi, orderApi, productApi, ...
    context/      <- BookingContext, NotificationContext
    websocket/    <- notificationWebSocket, reviewWebSocket (Singleton)
```

**Van de:**

| Van de                              | Muc do | Mo ta                                      |
|-------------------------------------|--------|--------------------------------------------|
| Khong co Error Boundary             | HIGH   | Crash ca app neu 1 component loi           |
| localStorage profile khong ky       | MEDIUM | Co the bi tamper phia client               |
| Khong co react-query / SWR          | MEDIUM | Khong co cache, stale-while-revalidate     |
| keycloak-js dependency thua         | LOW    | Tang bundle size khong can thiet           |
| Khong co lazy loading routes        | LOW    | Bundle size lon ngay tu dau                |
| Khong co SEO / SSR                  | LOW    | Client-side only                           |

**Them Error Boundary:**

```jsx
// src/components/ErrorBoundary.jsx
class ErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Gui len Sentry hoac log service
    console.error("App crashed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-2xl font-bold text-red-500">Da xay ra loi</h1>
          <p className="text-gray-500 mt-2">Xin loi vi su co nay.</p>
          <button
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
            onClick={() => window.location.reload()}
          >
            Tai lai trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// src/main.jsx — Boc toan bo App
root.render(
  <ErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
  </ErrorBoundary>
);
```

---

### 4.7 DevOps & Infrastructure

**Nhung gi dang thieu hoan toan:**

| Hang muc                                 | Trang thai   | Muc do can thiet |
|------------------------------------------|--------------|-----------------|
| Docker / docker-compose                  | Khong co     | CRITICAL        |
| CI/CD Pipeline (GitHub Actions)          | Khong co     | CRITICAL        |
| Environment profiles (dev/staging/prod)  | Khong co     | CRITICAL        |
| Spring Boot Actuator (health/metrics)    | Khong co     | CRITICAL        |
| Database backup strategy                 | Khong co     | CRITICAL        |
| Secret management (Vault / K8s Secrets)  | Khong co     | CRITICAL        |
| Distributed logging (ELK / Loki)         | Khong co     | HIGH            |
| Metrics (Prometheus / Grafana)           | Khong co     | HIGH            |
| Error tracking (Sentry)                  | Khong co     | HIGH            |
| Rate limiting (Resilience4j / Nginx)     | Khong co     | HIGH            |
| Load testing (k6 / JMeter)              | Khong co     | HIGH            |
| CDN cho static assets frontend           | Khong co     | MEDIUM          |
| Security scanning (SAST / DAST)          | Khong co     | MEDIUM          |

---

## 5. Lo trinh de xuat (Production Roadmap)

---

### Phase 1 — Security Hardening (Tuan 1-2, NGAY LAP TUC)

```
Checklist phai lam ngay:

[ ] Them .env vao .gitignore
[ ] Tao .env.example voi placeholder values (khong co gia tri that)
[ ] Rotate NGAY: Keycloak client secret, Google OAuth secret,
    Gmail App Password, Cloudinary API, VNPay credentials
[ ] Tao MySQL user non-root voi minimal privilege
[ ] Implement WebSocket JWT authentication trong handshake interceptor
[ ] Bat spring.flyway.validate-on-migrate=true
[ ] Xoa schema.sql (chi dung Flyway)
[ ] Tat Swagger UI trong production profile:
    springdoc.api-docs.enabled=${SWAGGER_ENABLED:false}
    springdoc.swagger-ui.enabled=${SWAGGER_ENABLED:false}
```

---

### Phase 2 — Containerization & CI/CD (Tuan 2-3)

**docker-compose.yml de xuat:**

```yaml
version: "3.8"

services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      SPRING_PROFILES_ACTIVE: production
      DB_HOST: mysql
      DB_PORT: 3306
      REDIS_HOST: redis
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/actuator/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build: ./frontend
    ports:
      - "80:80"

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: bookingsalondb
      MYSQL_USER: bookingsalon_app
      MYSQL_PASSWORD: ${DB_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      retries: 5

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data

  keycloak:
    image: quay.io/keycloak/keycloak:26.0
    environment:
      KC_DB: mysql
      KC_DB_URL: jdbc:mysql://mysql:3306/keycloak
      KEYCLOAK_ADMIN: admin
      KEYCLOAK_ADMIN_PASSWORD: ${KC_ADMIN_PASSWORD}
    command: start

volumes:
  mysql_data:
  redis_data:
```

**GitHub Actions CI/CD:**

```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          java-version: "21"
          distribution: "temurin"
      - name: Run backend tests
        run: |
          cd backend
          mvn test -Dspring.profiles.active=test

  test-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: "20"
      - name: Install dependencies & lint
        run: |
          cd frontend
          npm ci
          npm run lint

  build-and-deploy:
    needs: [test-backend, test-frontend]
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and push Docker images
        run: |
          docker build -t bookingsalon/backend ./backend
          docker build -t bookingsalon/frontend ./frontend
      - name: Deploy to production
        run: echo "Deploy steps here"
```

---

### Phase 3 — Observability & Performance (Tuan 3-4)

**Them Spring Boot Actuator:**

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
<dependency>
    <groupId>io.micrometer</groupId>
    <artifactId>micrometer-registry-prometheus</artifactId>
</dependency>
```

**application-production.properties:**

```properties
# Actuator
management.endpoints.web.exposure.include=health,metrics,info,prometheus
management.endpoint.health.show-details=when-authorized
management.endpoint.health.probes.enabled=true

# Logging — tat debug o production
spring.jpa.show-sql=false
logging.level.root=WARN
logging.level.demo.bookingsalon=INFO
logging.level.demo.bookingsalon.payment=WARN

# Rate limiting (can them Resilience4j dependency)
resilience4j.ratelimiter.instances.loginApi.limit-for-period=5
resilience4j.ratelimiter.instances.loginApi.limit-refresh-period=1m
resilience4j.ratelimiter.instances.loginApi.timeout-duration=0
```

---

### Phase 4 — Scalability & Performance (Tuan 4-6)

**Pagination cho tat ca list endpoints:**

```java
// Controller — them Pageable
@GetMapping("/bookings")
public ResponseEntity<Page<BookingResponse>> getBookings(
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size) {

    Pageable pageable = PageRequest.of(page, size, Sort.by("startTime").descending());
    return ResponseEntity.ok(bookingService.getBookings(pageable));
}
```

**Fix getBookingByDate — DB query thay vi in-memory filter:**

```java
// Repository
@Query("SELECT b FROM Booking b " +
       "WHERE b.salonId = :salonId " +
       "AND b.startTime >= :dayStart " +
       "AND b.startTime < :dayEnd " +
       "ORDER BY b.startTime ASC")
List<Booking> findBySalonIdAndDate(
    @Param("salonId") UUID salonId,
    @Param("dayStart") LocalDateTime dayStart,
    @Param("dayEnd") LocalDateTime dayEnd
);

// Service — goi truc tiep DB thay vi filter Java
public List<BookingResponse> getBookingByDate(LocalDate date, UUID salonId) {
    LocalDateTime start = date.atStartOfDay();
    LocalDateTime end = date.plusDays(1).atStartOfDay();
    return bookingRepository.findBySalonIdAndDate(salonId, start, end)
        .stream().map(bookingMapper::toBookingResponse).toList();
}
```

---

### Phase 5 — Test Coverage (Song song cac phase)

**Target coverage:**

| Layer              | Target    |
|--------------------|-----------|
| Service Layer      | >= 80%    |
| Controller Layer   | >= 70%    |
| Repository Layer   | >= 60%    |
| Utility / Strategy | >= 90%    |

**Uu tien viet test theo thu tu:**

1. `BookingService` — nghiep vu phuc tap nhat, nhieu edge case
2. `PaymentWebhookService` — security-critical, xu ly tien
3. `VoucherService` — tinh toan discount, validation
4. `NotificationService` — event handling, WebSocket push
5. `UserService` — CRUD + Keycloak sync
6. `ReviewService`, `OrderService`, cac Mapper, cac Strategy

**Vi du test can viet:**

```java
// BookingServiceTest.java
@Test
void createBooking_shouldThrow_whenTimeSlotConflict() {
    // Given: stylist da co booking luc 10:00-11:00
    // When: tao booking moi luc 10:30-11:30 (trung gio)
    // Then: throw BookingConflictException
}

@Test
void createBooking_shouldRetry_whenOptimisticLockingFails() {
    // Given: concurrent update gay OptimisticLockingFailureException
    // When: createBooking()
    // Then: retry toi da 3 lan voi backoff, cuoi cung thanh cong
}

@Test
void cancelBooking_shouldSendNotification_whenCancelledByAdmin() {
    // Given: booking CONFIRMED
    // When: admin cancel
    // Then: NotificationService.notifyBookingCancelled() duoc goi
    //       Booking status = CANCELLED
}
```

---

## 6. Bang uu tien tong hop

| #  | Hang muc                                   | Severity | Effort    | Phase |
|----|---------------------------------------------|----------|-----------|-------|
| 1  | Rotate credentials + .gitignore .env        | CRITICAL | 1 gio     | P1    |
| 2  | WebSocket JWT authentication                | CRITICAL | 1 ngay    | P1    |
| 3  | DB non-root user (minimal privilege)        | CRITICAL | 2 gio     | P1    |
| 4  | Flyway validate-on-migrate=true             | CRITICAL | 30 phut   | P1    |
| 5  | Xoa schema.sql — chi dung Flyway            | CRITICAL | 30 phut   | P1    |
| 6  | Docker + docker-compose                     | CRITICAL | 2 ngay    | P2    |
| 7  | Spring Boot Actuator (health/metrics)       | CRITICAL | 2 gio     | P3    |
| 8  | CI/CD GitHub Actions                        | HIGH     | 2 ngay    | P2    |
| 9  | Tat show-sql + debug log o production       | HIGH     | 30 phut   | P3    |
| 10 | Pagination cho tat ca list API              | HIGH     | 3 ngay    | P4    |
| 11 | Fix in-memory filter -> DB query            | HIGH     | 2 ngay    | P4    |
| 12 | Rate limiting (Resilience4j)                | HIGH     | 1 ngay    | P3    |
| 13 | Redis Pub/Sub cho WebSocket horizontal scale| HIGH     | 2 ngay    | P4    |
| 14 | Composite indexes DB                        | HIGH     | 1 ngay    | P3    |
| 15 | Global Exception Handler (@RestControllerAdvice)| MEDIUM | 1 ngay | P2    |
| 16 | Error Boundary frontend                     | MEDIUM   | 2 gio     | P2    |
| 17 | DataSeeder guard dev-only                   | MEDIUM   | 2 gio     | P2    |
| 18 | Test coverage >= 70%                        | MEDIUM   | 2 tuan    | P5    |
| 19 | HikariCP connection pool config             | MEDIUM   | 30 phut   | P3    |
| 20 | API versioning nhat quan (/api/v1/...)      | LOW      | 1 ngay    | P4    |
| 21 | Xoa keycloak-js dependency thua             | LOW      | 30 phut   | P2    |
| 22 | Lazy loading routes (React.lazy + Suspense) | LOW      | 1 ngay    | P4    |

---

## Ket luan

He thong **BookingSalon** duoc xay dung voi nen tang ky thuat **kha vung chac**:

- Lua chon tech stack hien dai, phu hop voi nghiep vu salon
- Thiet ke database chuyen nghiep (22 bang, UUID Binary, Optimistic Lock)
- Co tu duy ve idempotency, distributed locking, event-driven
- Kien truc package sach, dung huong Strategy Pattern

Tuy nhien, he thong **CHUA SAN SANG deploy production** vi 3 van de cot loi:

1. **CRITICAL — Credential exposure**: Phai giai quyet NGAY truoc bat ky buoc nao khac.
2. **CRITICAL — Thieu observability hoan toan**: Khong monitor duoc gi khi production co su co.
3. **CRITICAL — Khong co containerization**: Khong the deploy on dinh va reproducible.

Voi roadmap 5 phase tren (uoc tinh 6-8 tuan), he thong co the dat **production-ready level**
phu hop cho salon chain vua va nho (duoi 10 chi nhanh, duoi 500 concurrent users).

---

*Review duoc thuc hien dua tren phan tich static code, database design spec va cac tai lieu
thiet ke he thong. Mot so van de co the da duoc xu ly o runtime hoac moi truong deploy
thuc te.*
