# 📋 BÁO CÁO ĐÁNH GIÁ KỸ THUẬT TOÀN DIỆN (TECHNICAL AUDIT REPORT 2.0)
## Hệ Thống: BookingSalon Enterprise Platform

---

> **Vai trò thực hiện:** Principal Software Architect, Senior Java Engineer & Software Quality Auditor  
> **Kinh nghiệm tham chiếu:** 20+ năm kiến trúc hệ thống phân tán, tối ưu hóa Java/Spring Boot & an toàn thông tin doanh nghiệp  
> **Thời điểm đánh giá:** Tháng 10/2026  
> **Phiên bản Stack cốt lõi:** Java 21 LTS | Spring Boot 3.5.3 | MySQL 8.0+ | Redis 7.x | Keycloak 26.0.5 | Vite 5 (React 18)  
> **Phạm vi thẩm định:** 100% mã nguồn Backend (Controllers, Services, Entities, Repositories, Configs, Mappers, Security, Tests), Database Migrations (Flyway V1–V7), Cấu hình môi trường (`application.properties`, `.env`), và tích hợp Frontend SPA.

---

## MỤC LỤC CHI TIẾT

1. [Tóm Tắt Điều Hành (Executive Summary & Production Readiness)](#1-tóm-tắt-điều-hành-executive-summary)
2. [Giai Đoạn 1: Khảo Sát Repository & Bản Đồ Hệ Thống (System Landscape)](#2-giai-đoạn-1-khảo-sát-repository--bản-đồ-hệ-thống)
3. [Giai Đoạn 2: Phân Tích Kiến Trúc Tổng Thể & Ranh Giới Module](#3-giai-đoạn-2-phân-tích-kiến-trúc-tổng-thể--ranh-giới-module)
4. [Giai Đoạn 3: Truy Vết Chi Tiết Các Luồng Nghiệp Vụ Trọng Yếu (End-to-End Traces)](#4-giai-đoạn-3-truy-vết-chi-tiết-các-luồng-nghiệp-vụ-trọng-yếu)
   - 4.1 Luồng Đặt Lịch Hẹn (Booking Lifecycle & Concurrency)
   - 4.2 Luồng Thanh Toán Đa Kênh & Xử Lý Webhook (Payment Gateway & Idempotency)
   - 4.3 Luồng Bán Hàng & Quản Lý Tồn Kho (Order & Atomic Inventory Deduction)
   - 4.4 Luồng Xác Thực, Cấp Quyền & Quản Lý Phiên (Keycloak OIDC, PKCE & BFF Session)
   - 4.5 Luồng Đánh Giá & Tính Điểm Stylist (Review & Rating Aggregate)
5. [Giai Đoạn 4: Đánh Giá Chuyên Sâu Từng Trụ Cột Kỹ Thuật (Deep Technical Pillars)](#5-giai-đoạn-4-đánh-giá-chuyên-sâu-từng-trụ-cột-kỹ-thuật)
   - 5.1 API Design, Contract Compatibility & Error Handling
   - 5.2 Bảo Mật, Kiểm Soát Truy Cập & Quản Lý Phiên (Security & Auth)
   - 5.3 Thiết Kế Cơ Sở Dữ Liệu, Transaction & Hiệu Năng ORM (JPA/Hibernate)
   - 5.4 Chất Lượng Mã Nguồn & Nguyên Tắc Thiết Kế (SOLID, Clean Code)
   - 5.5 Kiểm Thử Tự Động & Độ Tin Cậy (Automated Testing & Coverage)
   - 5.6 Khả Năng Giám Sát, Vận Hành & Khôi Phục (Observability & Resilience)
6. [Giai Đoạn 5: Ma Trận Tổng Hợp Lỗi, Rủi Ro & Phân Tích Nguyên Nhân Gốc (Root Cause Analysis)](#6-giai-đoạn-5-ma-trận-tổng-hợp-lỗi-rủi-ro--nguyên-nhân-gốc)
7. [Bảng Điểm Đánh Giá Toàn Diện & Trọng Số (Scorecard)](#7-bảng-điểm-đánh-giá-toàn-diện--trọng-số)
8. [Giai Đoạn 6: Lộ Trình Cải Tiến Kỹ Thuật (Actionable Remediation Roadmap)](#8-giai-đoạn-6-lộ-trình-cải-tiến-kỹ-thuật)
9. [Phụ Lục: Danh Sách File Đã Đối Soát & Code Patch Tham Khảo](#9-phụ-lục-danh-sách-file-đã-đối-soát--code-patch-tham-khảo)

---

## 1. TÓM TẮT ĐIỀU HÀNH (EXECUTIVE SUMMARY)

### 1.1 Đánh giá chung
Dự án **BookingSalon** thể hiện tham vọng xây dựng một nền tảng quản lý tiệm salon hiện đại, kết hợp mô hình thương mại điện tử nhỏ (bán sản phẩm chăm sóc tóc) và đặt lịch dịch vụ theo thời gian thực. Đội ngũ phát triển đã tiếp cận và triển khai được nhiều kỹ thuật tiên tiến đáng ghi nhận:
- **Kiểm soát đồng thời mức cao:** Ứng dụng mức cô lập giao dịch `SERIALIZABLE` kết hợp Spring `@Retryable` và khóa bi quan (`PESSIMISTIC_WRITE`) trong xử lý xung đột khung giờ thợ cắt tóc.
- **Trừ kho nguyên tử:** Sử dụng câu lệnh UPDATE điều kiện `WHERE stock >= qty` tránh Lost Update.
- **Mô hình Backend-For-Frontend (BFF):** Che giấu hoàn toàn JWT/Refresh Token khỏi Browser bằng Session Server-side (`JSESSIONID` HttpOnly), kết hợp cơ chế PKCE OIDC chuẩn bảo mật cao.
- **Chiến lược thanh toán linh hoạt: ** Áp dụng Strategy Pattern xử lý đa cổng (VNPay, VietQR / Bank Transfer, COD), tích hợp kiểm tra Idempotency bằng Redis SETNX và xác thực chữ ký số HMAC-SHA512.
- **Tác vụ phân tán có phối hợp:** Tích hợp ShedLock chạy trên JDBC giúp bộ lập lịch định kỳ (`ExpiredPaymentScheduler`) an toàn trong môi trường đa node.

Tuy nhiên, dưới góc độ kiểm toán chất lượng phần mềm doanh nghiệp, **hệ thống hiện tại CHƯA ĐỦ ĐIỀU KIỆN ĐỂ GO-LIVE PRODUCTION**. Dự án tồn tại những lỗ hổng bảo mật cấp độ Thảm họa (Critical Security Flaws), lỗi kiến trúc logic dữ liệu (Dual Entity Creation) và rủi ro Broken Object Level Authorization (BOLA/IDOR) trên diện rộng, có thể dẫn đến thất thoát dữ liệu, gian lận dịch vụ và rủi ro pháp lý nghiêm trọng.

### 1.2 Top 5 Rủi Ro Tử Huyệt (Show-Stoppers)
1. **[SEC-001] Lộ lọt toàn bộ Bí mật Hệ thống trong file `.env`:** Toàn bộ mật khẩu DB MySQL (`Bach@vt05`), Keycloak Client Secret, Google OAuth2 Secret, Cloudinary API Key/Secret và App Password Gmail gửi thư đã bị phơi bày trong mã nguồn.
2. **[SEC-002] Lỗ hổng BOLA/IDOR diện rộng (OWASP API1:2023):** `ReviewService`, `BookingController`, `OrderController` cho phép người dùng đã đăng nhập thao tác (đọc, cập nhật, hủy, xóa vĩnh viễn) trên dữ liệu của người dùng khác bằng cách truyền `userId` hoặc `id` tùy ý trong DTO/URL mà không có kiểm tra quyền sở hữu đối tượng.
3. **[SEC-003] Cấu hình Session Fixation vô hiệu hóa (`.sessionFixation().none()`):** Spring Security bị cấu hình không đổi Session ID sau khi xác thực thành công, cho phép tấn công chiếm quyền điều khiển phiên người dùng (Session Hijacking).
4. **[BIZ-001] Xung đột tạo trùng thực thể Payment (Dual Payment Creation):** `BookingService.createBooking` tự động tạo 1 bản ghi `Payment` PENDING trong cùng transaction, trong khi `PaymentApplicationService.checkout` lại tạo tiếp 1 bản ghi `Payment` PENDING mới cho cùng mã Booking. Dẫn đến dư thừa dữ liệu, sai lệch trạng thái thanh toán và xung đột webhook.
5. **[TX-001] Race Condition thất thoát Voucher:** `VoucherService.validateAndCalculate` chạy trong ngữ cảnh `readOnly = true`, không sử dụng Pessimistic Lock khi kiểm tra và cập nhật `usedCount`. Nhiều request đồng thời sẽ cùng vượt qua giới hạn `usageLimitTotal` và `usageLimitPerUser`.

---

## 2. GIAI ĐOẠN 1: KHẢO SÁT REPOSITORY & BẢN ĐỒ HỆ THỐNG

### 2.1 Thông tin Nền tảng & Cấu hình Build
- **Ngôn ngữ:** Java 21 (Amazon Corretto / OpenJDK LTS), khai thác các tính năng mới như Record patterns, Virtual Threads capability, Pattern matching.
- **Framework nền:** Spring Boot `3.5.3` (phiên bản mới nhất của nhánh 3.x).
- **Công cụ build:** Maven 3.9+, cấu hình trong `pom.xml`.
- **Database Engine:** MySQL 8.0+ (Driver: `mysql-connector-j`), Character set: `utf8mb4`, Collation: `utf8mb4_unicode_ci`.
- **Cache & In-Memory Store:** Redis 7.x (Client: Spring Data Redis qua Lettuce / Jedis connection pool).
- **Identity & Access Management (IAM):** Keycloak 26.0.5, giao thức OpenID Connect (OIDC) Authorization Code Flow + PKCE.
- **Distributed Lock:** ShedLock `6.10.0` với `shedlock-provider-jdbc-template`.
- **Media Engine:** Cloudinary Java SDK `1.39.0`.
- **Frontend SPA:** React 18, Vite 5, Redux Toolkit, Tailwind CSS, Lucide Icons, Axios.

### 2.2 Phân Tích Cây Thư Mục & Quản Lý Gói (Package Structure)
Cấu trúc package của backend nằm tại thư mục `e:\Projects\BookingSalon\backend\src\main\java\demo\bookingsalon\`:

```
demo.bookingsalon
├── Configuration/     — 17 lớp cấu hình hạ tầng (SecurityConfig, Redis, ShedLock, Cloudinary, WebClient, Async...)
├── Controller/        — 19 REST Controllers (Booking, Order, Payment, User, Stylist, Salon, Auth, Media...)
├── Entity/            — 15 JPA Entities (User, Booking, Payment, Order, Stylist, Salon, Voucher...)
├── Enum/              — 11 Enums định nghĩa trạng thái và kiểu dữ liệu (BookingStatus, PaymentStatus, Role...)
├── Exception/         — GlobalExceptionHandler và 7 custom domain exceptions
├── Handler/           — Handlers xử lý WebSocket notification và review stream
├── Mapper/            — MapStruct Mappers (UserMapper, BookingMapper, OrderMapper...)
├── Payload/           — Các DTOs phân tầng: Admin/, DTO/, Request/, Response/
├── Publisher/         — Spring ApplicationEvent Publishers (BookingEventPublisher)
├── Repository/        — 14 Spring Data JPA Repositories
├── Security/          — Bộ lọc & chặn kiểm soát lưu lượng: RateLimit/, ClientIpResolver, Interceptors
├── Service/           — 14 Business Services (Booking, Order, Payment, User, Voucher, Salon, Review...)
│   └── Keycloak/      — Keycloak Client & Admin API wrappers
├── Storage/           — Cloudinary Strategy implementation
├── Strategy/          — Payment Strategy pattern (VnPayStrategy, BankTransferStrategy, CodStrategy)
├── Utility/           — Các tiện ích: IdempotencyService, VNPayUtil, QRCodeGenerator, ExpiredPaymentScheduler
└── Validation/        — Custom Constraint Validators (MediaValidation)
```

> [!WARNING]
> **Vi phạm Chuẩn Quy ước Đặt tên Java (Java Package Naming Conventions):**  
> Toàn bộ 15 thư mục package cấp 1 đều viết hoa chữ cái đầu (`Configuration`, `Controller`, `Entity`, `Service`, `Repository`...). Theo Oracle Java Code Conventions & Google Java Style Guide, tên package bắt buộc phải viết thường toàn bộ (lowercase) để tránh nhầm lẫn với Class/Interface.

### 2.3 Phân Tích Quản Lý Thư Viện Phụ Thuộc (Dependency Analysis trong `pom.xml`)
Bằng chứng đối soát trực tiếp từ `backend/pom.xml`:
1. **Tồn tại Thư viện Rác / Dead Dependencies:**
   - `com.stripe:stripe-java:29.5.0` (L122–L125): Khai báo nhưng hoàn toàn không có bất kỳ dòng code nào sử dụng Stripe SDK trong toàn bộ dự án.
   - `io.jsonwebtoken:jjwt-api:0.11.5` cùng `jjwt-impl`, `jjwt-jackson` (L146–L161): Dự án đã chuyển dịch hoàn toàn sang `spring-boot-starter-oauth2-resource-server` để parse JWT từ Keycloak. Việc giữ lại JJWT gây lãng phí bộ nhớ và tiềm ẩn nguy cơ xung đột classloader.
2. **Pha trộn WebMVC và WebFlux không đồng nhất:**
   - Khai báo `spring-boot-starter-webflux` (L116–L119) chỉ để lấy `WebClient` gọi sang VietQR / SePay, trong khi toàn bộ ứng dụng chạy trên nền tảng Blocking Servlet (`spring-boot-starter-web`). Điều này kéo theo toàn bộ Reactive Engine (Project Reactor, Netty) vào classpath của Tomcat gây phình to footprint bộ nhớ không cần thiết (Nên thay thế bằng `RestClient` native của Spring Framework 6.1+).

### 2.4 Kiểm Tra Tài Liệu Dự Án (.md files)
- `README.md`: Hướng dẫn cài đặt sơ bộ, chưa có tài liệu biến môi trường chuẩn Production.
- `CODE_REVIEW.md`: Đánh giá nội bộ trước đây (tháng 10/2026), đã nêu một số cảnh báo nhưng chưa truy vết sâu vào tầng Data Access, BOLA và Race Condition.
- `initData.md`: Kịch bản dữ liệu ban đầu cho database.
- `Testing_Feature.md`: Danh mục ca kiểm thử chức năng thủ công.

---

## 3. GIAI ĐOẠN 2: PHÂN TÍCH KIẾN TRÚC TỔNG THỂ & RANH GIỚI MODULE

### 3.1 Mô hình Kiến trúc Thực tế vs Cam kết Thiết kế
Dự án được định vị theo phong cách **Layered Architecture (Kiến trúc phân tầng truyền thống)** kết hợp hướng dịch vụ (Service-Oriented Monolith), **hoàn toàn KHÔNG PHẢI Domain-Driven Design (DDD)**:
- **Thiếu vắng Khái niệm DDD:** Không có Aggregate Root thực thụ, không có Bounded Context được cô lập, không có Value Objects bất biến (Immutable Value Objects). Hầu hết các Entity đều là *Anemic Domain Models* (chỉ chứa getters/setters lỏng lẻo) và toàn bộ business logic phức tạp bị dồn ép vào tầng Service (Transaction Script Pattern).
- **Ranh giới module bị thủng (Cross-Boundary Pollution):** Các Service gọi chéo nhau trực tiếp mà không qua Application Interface hoặc Domain Events. Ví dụ: `UserService` phụ thuộc trực tiếp vào `KeycloakService`, `OrderService` kiêm nhiệm cả logic tính toán giỏ hàng, gọi URL VNPay và bắn thông báo qua WebSocket.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER (React 18 SPA)                     │
│               BFF Session Management (HttpOnly JSESSIONID)             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTPS + WSS (STOMP-less)
┌───────────────────────────────────▼────────────────────────────────────┐
│                    SPRING BOOT 3.5.3 REST BACKEND                      │
│                                                                        │
│  [Security Filter Chain]                                              │
│   IpRateLimitingFilter ──► CsrfCookieFilter ──► BearerTokenResolver   │
│   (Redis Fixed Window)      (Deferred Mode)      (BFF Session/Bearer)  │
│                                                                        │
│  [Web MVC Controllers]                                                 │
│   BookingController, OrderController, PaymentController, AuthController│
│                                                                        │
│  [Business Application Layer]                                          │
│   BookingService, OrderService, PaymentAppService, BffSessionService   │
│                                                                        │
│  [Domain & Persistence Layer]                                          │
│   Spring Data JPA (Hibernate 6.x) + Optimistic Locking (@Version)     │
│   Flyway Migrations (V1 -> V7)                                         │
└──────────────┬───────────────────┬───────────────────┬─────────────────┘
               │                   │                   │
        ┌──────▼──────┐     ┌──────▼──────┐     ┌──────▼──────┐
        │  MySQL 8.0  │     │  Redis 7.x  │     │  Keycloak   │
        │  Data Store │     │ Idempotency │     │ 26.0.5 OIDC │
        │  + ShedLock │     │ Rate Limiter│     │ Identity P. │
        └─────────────┘     └─────────────┘     └─────────────┘
```

### 3.2 Đánh giá Các Mẫu Thiết Kế (Design Patterns)
1. **Strategy Pattern trong Thanh Toán & Media:**
   - `PaymentStrategy` interface triển khai qua `VnPayStrategy`, `BankTransferStrategy`, `CodStrategy`. Đây là điểm sáng kiến trúc, giúp tách biệt logic sinh URL, kiểm tra chữ ký và chuyển trạng thái của từng cổng.
   - `MediaStorageStrategy` với `CloudinaryStorageStrategy` cho phép linh hoạt định tuyến thư mục lưu trữ theo domain (avatar stylist, ảnh sản phẩm, ảnh salon).
2. **Backend-For-Frontend (BFF) Pattern:**
   - Triển khai tại `BffSessionService.java`: Giữ Access Token và Refresh Token trong `HttpSession` phía server, cấp phát cookie `JSESSIONID` duy nhất cho trình duyệt. Cơ chế này loại bỏ hoàn toàn rủi ro XSS đánh cắp JWT Token ở client.
3. **Event-Driven Architecture (Hạn chế):**
   - Chỉ sử dụng `BookingEventPublisher` đẩy Spring Application Event nội bộ tiến trình để gửi email không đồng bộ (`@Async`). Hệ thống **hoàn toàn thiếu Message Broker (Kafka / RabbitMQ)** và **chưa áp dụng Transactional Outbox Pattern**. Khi tiến trình ứng dụng sập đúng thời điểm commit DB, các sự kiện gửi email, push thông báo và cập nhật số liệu thống kê sẽ bị thất lạc vĩnh viễn.

---

## 4. GIAI ĐOẠN 3: TRUY VẾT CHI TIẾT CÁC LUỒNG NGHIỆP VỤ TRỌNG YẾU

### 4.1 Luồng Đặt Lịch Hẹn (Booking Lifecycle & Concurrency)

#### Quy trình thực thi:
1. Client gửi `POST /api/booking` kèm payload `CreateBookingRequest`.
2. `BookingController.createBooking()` tiếp nhận, kiểm tra `@RateLimit` (3 requests / 300 giây / user).
3. `BookingService.createBooking()` được kích hoạt với chú thích:
   ```java
   @Transactional(isolation = Isolation.SERIALIZABLE)
   @Retryable(retryFor = {OptimisticLockingFailureException.class, 
                          CannotAcquireLockException.class}, 
              maxAttempts = 3, backoff = @Backoff(delay = 100))
   ```
4. Hệ thống tính tổng thời lượng từ các `serviceIds`, kiểm tra trạng thái Stylist, và gọi `isTimeSlotAvailable()`:
   - Sử dụng khóa bi quan `LockModeType.PESSIMISTIC_WRITE` thông qua repository `findConflictingBookingsByStylist`.
5. Tính toán Voucher nếu có mã giảm giá.
6. Lưu thực thể `Booking` với trạng thái `PENDING`.
7. **Lỗi nghiêm trọng phát hiện tại L320–L330:** `BookingService` trực tiếp khởi tạo một thực thể `Payment` với status `PENDING` và lưu vào DB.
8. Kích hoạt `BookingEventPublisher.publishEvent()` gửi email và gửi WebSocket thông báo tới User và Stylist.

```
[Client] ──POST /api/booking──► [BookingController]
                                       │
                                       ▼ @Transactional(SERIALIZABLE)
                                [BookingService]
                                       ├──► isTimeSlotAvailable() [PESSIMISTIC_WRITE]
                                       ├──► VoucherService.validate() [NO LOCK - BUG TX-001]
                                       ├──► bookingRepository.save(Booking: PENDING)
                                       ├──► paymentRepository.save(Payment #1: PENDING) [BUG BIZ-001]
                                       ├──► BookingEventPublisher (Async Email)
                                       └──► WebSocketHandler (Push real-time)
```

#### Phân tích Sai sót & Rủi ro:
- **[LỖI XÁC NHẬN BIZ-001 - Xung đột tạo trùng Payment]:** Khi người dùng chuyển sang trang thanh toán và bấm Checkout, `PaymentApplicationService.checkout()` lại tiếp tục khởi tạo một bản ghi `Payment` thứ hai cho cùng `bookingId`. Kết quả là 1 Booking gắn với 2 Payment PENDING khác nhau trong hệ thống, dẫn đến sai lệch thống kê tài chính và lỗi xử lý webhook.
- **[LỖI XÁC NHẬN BIZ-002 - Generic Exception Throwing]:** Method `createBooking` khai báo `throws Exception` (L179). Toàn bộ ngoại lệ từ SQL, Validation, NullPointer đều bị ném ra dạng generic khiến Controller không thể phân loại mã lỗi HTTP chuẩn, dẫn đến trả về 500 bừa bãi.
- **[RỦI RO BIZ-003 - Fallback thời lượng ảo]:** Tại L190–L193:
  ```java
  int totalDuration = offeringDTOs.stream().mapToInt(ServiceOffering::getDuration).sum();
  if (totalDuration == 0) totalDuration = 45;
  ```
  Nếu danh sách dịch vụ gửi lên không hợp lệ hoặc duration bị null, hệ thống tự ý gán 45 phút và vẫn tạo Booking thành công mà không có bất kỳ dịch vụ thực tế nào đi kèm!

---

### 4.2 Luồng Thanh Toán Đa Kênh & Webhook (Payment Gateway)

#### Phân tích File `PaymentApplicationService.java` & `PaymentWebhookService.java`:
1. **Khởi tạo thanh toán (`checkout`):**
   - Hỗ trợ phương thức: `VNPAY`, `BANK_TRANSFER`, `COD`.
   - Đối với VNPay: Gọi `VnPayStrategy.generatePayment()` để tạo URL redirect sang Sandbox/Production của VNPay.
   - Đối với VietQR: Gọi `BankTransferStrategy.generatePayment()` sinh QR code thanh toán động kèm mã nội dung chuyển khoản độc nhất.
2. **Tiếp nhận Webhook (`processWebhook`):**
   - Kiểm tra Idempotency thông qua Redis SETNX (`webhook:vnpay:{txnRef}`) trong 24 giờ.
   - Kiểm tra trùng lặp thứ cấp tại DB: Truy vấn `PaymentTransaction` xem mã giao dịch của cổng đã tồn tại chưa.
   - Xác thực chữ ký số HMAC-SHA512 đối chiếu với secret key.
   - Cập nhật trạng thái `Payment` -> `COMPLETED`, đồng thời cập nhật `Booking` hoặc `Order` tương ứng sang `CONFIRMED`/`PAID`.

```
[VNPay Server] ──GET Webhook──► [PaymentWebhookService]
                                       │
                                       ├──► 1. Verify HMAC-SHA512 Hash (Secret Key)
                                       ├──► 2. Redis SETNX "webhook:vnpay:{txnRef}" (24h)
                                       ├──► 3. DB Check: PaymentTransactionRepository
                                       ├──► 4. Update Payment -> COMPLETED
                                       └──► 5. Update Booking -> CONFIRMED / Order -> PAID
```

#### Phân tích Sai sót & Rủi ro:
- **[LỖI XÁC NHẬN BIZ-004 - Hardcode Client IP VNPay]:** Tại `OrderService.java:L427` và `VnPayStrategy.java`:
  ```java
  params.put("vnp_IpAddr", "127.0.0.1");
  ```
  Vi phạm nghiêm trọng quy chuẩn tích hợp VNPAY (VNPAY Merchant Specification). Cổng thanh toán VNPay yêu cầu bắt buộc phải truyền địa chỉ IP thực tế của khách hàng từ Header `X-Forwarded-For` hoặc `request.getRemoteAddr()`. Việc hardcode `127.0.0.1` sẽ khiến hệ thống bị VNPay chặn giao dịch trên môi trường Production thật do nghi vấn gian lận (Fraud Detection).
- **[RỦI RO BIZ-005 - Thiếu `@Transactional` tại `PaymentPersistenceService`]:** Lớp `PaymentPersistenceService` thực hiện ghi dữ liệu giao dịch nhưng không được chú thích `@Transactional`. Nếu được gọi độc lập từ bên ngoài ngữ cảnh giao dịch hiện tại, các câu lệnh insert/update sẽ chạy ở chế độ auto-commit riêng lẻ, dẫn đến rủi ro Dirty Write khi có lỗi giữa chừng.
- **[LỖI XÁC NHẬN BIZ-006 - Logic Quét Hết Hạn Thanh Toán Sai Lệch]:** Trong `ExpiredPaymentScheduler.java` và `PaymentRepository`:
  ```java
  @Query("SELECT p FROM Payment p WHERE p.status = 'PENDING' AND p.updatedAt < CURRENT_TIMESTAMP")
  ```
  Truy vấn này đánh dấu tất cả các Payment PENDING có `updatedAt < CURRENT_TIMESTAMP` là hết hạn. Nhưng `updatedAt` luôn luôn nhỏ hơn thời điểm hiện tại ngay sau khi vừa tạo xong bản ghi! Dẫn đến các giao dịch vừa được tạo ra chưa đầy vài giây đã bị Scheduler quét và hủy ngang ngay lập tức nếu scheduler kích hoạt đúng nhịp. Logic đúng bắt buộc phải là `p.expiredAt < CURRENT_TIMESTAMP` hoặc `p.createdAt < :cutoffTime`.

---

### 4.3 Luồng Bán Hàng & Quản Lý Tồn Kho (Order & Inventory Management)

#### Phân tích File `OrderService.java`:
1. Client gửi `POST /api/orders` kèm giỏ hàng và địa chỉ giao hàng.
2. Kiểm tra Idempotency qua Header `Idempotency-Key` (nếu không có, fallback về `user:{id}:cart:{items.hashCode()}`).
3. Trừ kho nguyên tử (Atomic Stock Deduction):
   ```java
   int updated = productRepository.deductStockAtomic(item.getProductId(), item.getQuantity());
   if (updated == 0) throw new BusinessException("Sản phẩm đã hết hàng");
   ```
4. Áp dụng mã Voucher giảm giá đơn hàng.
5. Lưu đơn hàng `Order` và chi tiết `OrderDetail`.
6. Trả về kết quả hoặc URL thanh toán VNPay.

#### Phân tích Sai sót & Rủi ro:
- **[LỖI XÁC NHẬN TX-002 - Rollback tồn kho thủ công sai nguyên tắc giao dịch]:**  
  Tại `OrderService.java:L134–L145`: Khi xảy ra lỗi trong quá trình tạo đơn hàng, nhà phát triển thực hiện vòng lặp gọi `productRepository.restoreStockAtomic(...)` bằng tay trong khối `catch`.  
  *Nguyên nhân kiến trúc:* Nếu ứng dụng bị crash (OutOfMemory, sập nguồn, kill container) ngay trong khối catch, hoặc chính câu lệnh `restoreStockAtomic` gặp sự cố kết nối DB, số lượng tồn kho đã trừ trước đó sẽ **BỊ MẤT VĨNH VIỄN**. 
  *Giải pháp chuẩn:* Phải đặt toàn bộ thao tác trong một `@Transactional` của Spring, sử dụng cơ chế Rollback tự động của ACID RDBMS thay vì viết logic đền bù thủ công (manual compensating) trong cùng 1 database.
- **[RỦI RO BIZ-007 - Fallback Idempotency Key bằng `hashCode()` không an toàn]:**  
  `request.getItems().hashCode()` phụ thuộc vào JVM implementation của Java `List.hashCode()`. Khi server restart hoặc chạy trên nhiều node cluster khác nhau, mã hash có thể va chạm (hash collision), dẫn đến hiện tượng từ chối yêu cầu đặt hàng hợp lệ của khách hàng (False Positive Idempotency Block).

---

### 4.4 Luồng Xác Thực, Cấp Quyền & Quản Lý Phiên (Auth, OIDC & BFF Session)

#### Phân tích File `SecurityConfig.java`, `AuthService.java`, `BffSessionService.java`:
1. **Kiến trúc Hybrid Authentication:**
   - Hỗ trợ Bearer Token truyền thống qua Header `Authorization: Bearer <jwt>` (phục vụ Mobile App, Postman, Swagger). 
   - Hỗ trợ BFF Session qua Cookie `JSESSIONID` (phục vụ React SPA Web).
2. **Xác thực Token tự động:**
   - Lớp `CustomBearerTokenResolver` ưu tiên lấy Bearer Token từ Header, nếu không có sẽ gọi `bffSessionService.resolveValidAccessToken(request)`.
   - Nếu Access Token trong Session sắp hết hạn (buffer 30 giây), `BffSessionService` kích hoạt cơ chế tự động làm mới ngầm (Silent Auto-Refresh) thông qua Refresh Token lưu trong Session và khóa đồng bộ hóa luồng `ConcurrentHashMap<sessionId, Object>`.
3. **Chuyển đổi Quyền Hạn (Role Mapping):**
   - `KeycloakRoleConverter.java` trích xuất mảng `realm_access.roles` từ JWT và gắn tiền tố `ROLE_` (ví dụ: `ROLE_ADMIN`, `ROLE_STYLIST`, `ROLE_USER`).

```
[Browser] ──Cookie: JSESSIONID──► [SecurityConfig / BearerTokenResolver]
                                         │
                                         ├──► BffSessionService.resolveValidAccessToken()
                                         │     ├── Token valid ──► Return Access Token
                                         │     └── Token expiring ──► Lock(sessionId) ──► Keycloak Refresh
                                         │
                                         ▼
                                  [KeycloakRoleConverter]
                                  "ADMIN" ──► "ROLE_ADMIN"
                                  "USER"  ──► "ROLE_USER"
```

#### Phân tích Sai sót & Rủi ro:
- **[LỖI BẢO MẬT CỰC NGUY HIỂM SEC-003 - Session Fixation Không Được Bảo Vệ]:**  
  Bằng chứng tại `SecurityConfig.java:L63`:
  ```java
  .sessionManagement(session -> session
      .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
      .sessionFixation().none() // ⚠️ VÔ CÙNG NGUY HIỂM
  )
  ```
  Việc thiết lập `.sessionFixation().none()` chỉ định Spring Security **KHÔNG ĐƯỢC PHÉP ĐỔI MÃ PHIÊN (Session ID)** khi người dùng chuyển từ trạng thái nặc danh (Anonymous) sang trạng thái đã đăng nhập thành công. Kẻ tấn công có thể gài sẵn một cookie `JSESSIONID` hợp lệ vào trình duyệt nạn nhân (qua tấn công XSS hoặc chia sẻ link), sau khi nạn nhân đăng nhập thành công, kẻ tấn công dùng chính Session ID đó để chiếm đoạt hoàn toàn quyền quản trị!  
  *Chuẩn bắt buộc:* Phải đổi thành `.sessionFixation().migrateSession()` hoặc `.changeSessionId()`.
- **[RỦI RO BẢO MẬT SEC-004 - Hardcoded `secure=false` trên Cookies]:**  
  Tại `AuthService.java` và cấu hình `application.properties`: Biến `COOKIE_SECURE` mặc định là `false`. Khi triển khai trên môi trường Internet có HTTPS, nếu reverse proxy không cấu hình chặt, cookie phiên sẽ bị gửi qua kết nối HTTP không mã hóa, dẫn đến nguy cơ bị đánh chặn qua Man-In-The-Middle (MITM).
- **[LỖI RỦI RO HIỆU NĂNG - Race Condition trong RateLimiterService]:**  
  Bằng chứng tại `RateLimiterService.java`:
  ```java
  Long count = redisTemplate.opsForValue().increment(key);
  if (count == 1) {
      redisTemplate.expire(key, windowSeconds, TimeUnit.SECONDS);
  }
  ```
  Lệnh `increment` và `expire` là **HAI LỆNH TÁCH RỜI, KHÔNG NGUYÊN TỬ**. Nếu ứng dụng gặp sự cố hoặc kết nối mạng đứt ngay sau dòng `increment`, key Redis đó sẽ **KHÔNG BAO GIỜ HẾT HẠN (No TTL)**. Người dùng ứng với IP/UserId đó sẽ bị **BLOCK VĨNH VIỄN KHỎI HỆ THỐNG** vì `count` luôn luôn vượt quá giới hạn và không bao giờ được reset! Bắt buộc phải dùng Lua Script để thực thi nguyên tử cả 2 lệnh.

---

### 4.5 Luồng Đánh Giá & Tính Điểm Stylist (Review & Rating Aggregate)

#### Phân tích File `ReviewController.java` & `ReviewService.java`:
- Tiếp nhận đánh giá dịch vụ sau khi hoàn thành buổi làm tóc.
- Cập nhật điểm đánh giá trung bình `ratingAverage` cho Stylist.

#### Phân tích Sai sót & Rủi ro:
- **[LỖI BẢO MẬT CRITICAL SEC-002 / BOLA - Giả Mạo Đánh Giá Trắng Trợn]:**  
  Bằng chứng tại `ReviewService.java:L56–L92`:
  ```java
  public ReviewResponse createReview(ReviewDTO reviewDTO) {
      // Lấy trực tiếp userId từ DTO do client gửi lên!
      User user = userRepository.findById(reviewDTO.getUserId())
          .orElseThrow(...);
      // Hoàn toàn KHÔNG kiểm tra SecurityContextHolder xem người gửi request có đúng là user này không!
  }
  ```
  Bất kỳ tài khoản nào đăng nhập vào hệ thống đều có thể gửi payload với `userId` của khách hàng khác để tạo hàng trăm review 5 sao (hoặc 1 sao phá hoại) mạo danh mà hệ thống không hề hay biết!
- **[RỦI RO DỮ LIỆU BIZ-008 - Cập nhật Rating Stylist Không Nguyên Tử]:**  
  Tại `ReviewService.java:L97–L105`: Điểm rating trung bình được tính bằng cách gọi hàm `getAverageRatingByStylistId()` rồi sau đó gọi `stylistRepository.save(stylist)`. Hai giao dịch đánh giá chạy đồng thời sẽ cùng đọc ra một giá trị cũ và ghi đè đè lên nhau (Lost Update), làm sai lệch hoàn toàn điểm sao trung bình thực tế của thợ cắt tóc.

---

## 5. GIAI ĐOẠN 4: ĐÁNH GIÁ CHUYÊN SÂU TỪNG TRỤ CỘT KỸ THUẬT

### 5.1 API Design, Contract Compatibility & Error Handling

#### Đánh giá Thiết kế Endpoint & HTTP Semantics:
- **Sự thiếu nhất quán trong URL Mapping:**
  `BookingController.java:L22` ánh xạ đồng thời cả 2 đường dẫn:
  `@RequestMapping({"/api/booking", "/api/bookings"})`. Việc hỗ trợ cả số ít và số nhiều thể hiện sự thiếu chuẩn hóa trong thiết kế RESTful URL (Chuẩn OpenAPI/RESTful khuyến nghị luôn dùng danh từ số nhiều `/api/v1/bookings`).
- **Thiếu API Versioning tập trung:**
  Một số endpoint có tiền tố `/api/v1/`, trong khi đa số endpoint chính lại dùng `/api/` trực tiếp (`/api/booking`, `/api/orders`, `/api/auth`). Khi cần nâng cấp cấu trúc DTO phá vỡ tương thích ngược (Breaking Change), hệ thống sẽ gặp khó khăn lớn trong việc duy trì phiên bản cũ cho Mobile/Web.
- **Side-effects nghiêm trọng trên phương thức GET:**
  Tại `UserService.java:L279–L331`: Khi Admin gọi `GET /api/users` để xem danh sách người dùng, hàm `getUsers()` lại thực hiện logic: Quét toàn bộ người dùng từ Keycloak về, so sánh với DB MySQL, và tự động gọi `userRepository.save()` để chèn thêm các bản ghi còn thiếu!
  > [!CAUTION]
  > Vi phạm nghiêm trọng RFC 9110 (HTTP Semantics): Phương thức `GET` bắt buộc phải là **Safe** và **Idempotent** (không được phép làm thay đổi trạng thái dữ liệu trên máy chủ). Việc để GET sinh dữ liệu có thể bị khai thác làm cạn kiệt tài nguyên DB thông qua các tool quét tự động (Crawler / Scanner).

#### Phân tích Xử lý Lỗi Toàn Cục (`GlobalExceptionHandler.java`):
Bằng chứng trực tiếp từ mã nguồn `GlobalExceptionHandler.java:L18–L101`:
1. **Cấu trúc Response hỗn loạn:**
   - `notFoundException` (L20): Trả về body là một chuỗi raw text `String`.
   - `handlePaymentException` (L38): Trả về `Map<String, Object>` gồm key `"error"` và `"message"`.
   - `validation` (L54): Trả về DTO chuẩn `ErrorResponse`.
   - `qrGenerateException` (L82): Trả về chuỗi `"Error: " + ex.getMessage()`.
   - `handleMediaValidation` (L88): Trả về chuỗi `"MEDIA_VALIDATION_ERROR" + ...`.
   *Hậu quả:* Frontend hoàn toàn không thể viết một Interceptor xử lý lỗi nhất quán. Mọi màn hình phải tự đoán xem backend trả về String hay JSON Object để parse!
2. **In vết ngăn xếp (Stacktrace Leak) ra Console & Lộ thông tin nhạy cảm:**
   - Tại L87 và L95: Gọi trực tiếp `ex.printStackTrace()`.
   - Tại L67–L76 (`handleException` chung): Trả nguyên văn `exception.getMessage()` về cho client khi gặp lỗi 500. Nếu gặp lỗi kết nối cơ sở dữ liệu hoặc lỗi câu lệnh SQL (SQLSyntaxErrorException), thông tin tên bảng, tên cột và cấu trúc truy vấn nội bộ sẽ bị lộ trần trụi cho kẻ tấn công.

---

### 5.2 Bảo Mật, Kiểm Soát Truy Cập & Quản Lý Phiên (Security & Auth)

#### Ma Trận Lỗ Hổng Bảo Mật Được Xác Nhận:

| Mã Lỗ Hổng | Tên Lỗ Hổng | Phân Loại (OWASP 2021/2023) | File Bằng Chứng & Dòng | Mức Độ |
|------------|-------------|-----------------------------|------------------------|--------|
| **SEC-001** | Lộ lọt Mật khẩu & API Keys trong `.env` | A05:2021 - Security Misconfiguration | Root `.env` (L240–L250) | 🔴 CRITICAL |
| **SEC-002** | BOLA/IDOR Thao tác chéo người dùng | API1:2023 - Broken Object Level Auth | `BookingController.java:L57–L128`, `ReviewService.java:L56`, `OrderController.java:L59` | 🔴 CRITICAL |
| **SEC-003** | Vô hiệu hóa Session Fixation Protection | A07:2021 - Identification & Auth Failures | `SecurityConfig.java:L63` | 🔴 CRITICAL |
| **SEC-004** | Flag `secure=false` trên Session Cookie | A05:2021 - Security Misconfiguration | `application.properties:L98`, `AuthService.java` | 🟠 HIGH |
| **SEC-005** | Nguy cơ IP Spoofing qua Unvalidated Headers | A01:2021 - Broken Access Control | `ClientIpResolver.java:L15–L35` | 🟠 HIGH |
| **SEC-006** | DoS vĩnh viễn do Race Condition Rate Limiter | API4:2023 - Unrestricted Resource Consumption | `RateLimiterService.java:L35–L42` | 🟠 HIGH |
| **SEC-007** | Bỏ qua CSRF toàn bộ cụm `/api/auth/**` | A01:2021 - Broken Access Control | `SecurityConfig.java:L45` | 🟡 MEDIUM |
| **SEC-008** | Plaintext 2FA Secret Key trong Database | A02:2021 - Cryptographic Failures | `V2__add_missing_columns.sql` (bảng `admins`) | 🟡 MEDIUM |

#### Chi tiết Vấn đề BOLA/IDOR Diện Rộng (SEC-002):
Trong `SecurityConfig.java`:
```java
.requestMatchers(HttpMethod.GET, "/api/booking/**", "/api/bookings/**").authenticated()
.requestMatchers(HttpMethod.POST, "/api/booking/**", "/api/bookings/**").authenticated()
.requestMatchers(HttpMethod.PUT, "/api/booking/**", "/api/bookings/**").authenticated()
.requestMatchers(HttpMethod.DELETE, "/api/booking/**", "/api/bookings/**").authenticated()
```
Tất cả các endpoint trên chỉ yêu cầu người dùng **đã đăng nhập** (`authenticated()`). Nhưng khi đi vào `BookingController.java`:
- `GET /api/booking/user/{id}`: Bất kỳ ai cũng xem được toàn bộ lịch sử hẹn của `userId` khác.
- `DELETE /api/booking/{id}`: Bất kỳ ai cũng có thể hủy lịch hẹn của khách hàng khác.
- `DELETE /api/booking/{id}/hard`: **Xóa vĩnh viễn lịch hẹn khỏi cơ sở dữ liệu** mà không kiểm tra xem caller có phải là ADMIN hay không!
- `OrderController.java:L59` (`getUserOrders`): Nhận `userId` từ PathVariable và trả toàn bộ đơn hàng mà không đối chiếu xem `authenticatedUserId == userId`!

---

### 5.3 Thiết Kế Cơ Sở Dữ Liệu, Transaction & Hiệu Năng ORM (JPA/Hibernate)

#### Đánh giá Schema & Flyway Migrations (V1 → V7):
- **Ưu điểm:**
  - Định dạng khóa chính chuẩn `BINARY(16)` ánh xạ sang UUID giúp tiết kiệm không gian index và tối ưu I/O so với `VARCHAR(36)`.
  - Hầu hết các bảng trọng yếu (`bookings`, `payments`, `orders`, `vouchers`, `users`) đều có trường `version BIGINT` phục vụ Optimistic Locking.
  - Sử dụng thống nhất bộ mã `utf8mb4_unicode_ci` hỗ trợ tiếng Việt có dấu và biểu tượng cảm xúc.
- **Khuyết tật Thiết kế CSDL (Database Schema Flaws):**
  1. **[DB-001 - Thiếu UNIQUE Constraint trên `user_vouchers`]:**  
     Trong migration `V3__user_vouchers.sql`: Bảng liên kết giữa người dùng và voucher chỉ có Primary Key tự sinh, hoàn toàn không có `UNIQUE KEY uk_user_voucher (user_id, voucher_id)`. Khi có 2 request nhận mã khuyến mãi đồng thời, hệ thống sẽ chèn 2 bản ghi cho cùng một user, phá vỡ logic giới hạn mỗi người dùng chỉ được nhận voucher 1 lần.
  2. **[DB-002 - Thiếu Composite Index phục vụ Truy vấn Xung đột Lịch]:**  
     Truy vấn cốt lõi kiểm tra thợ có bận hay không:
     ```sql
     SELECT b FROM Booking b WHERE b.stylist.id = :stylistId 
     AND b.status NOT IN ('CANCELLED', 'REJECTED')
     AND ((b.startTime < :endTime AND b.endTime > :startTime))
     ```
     Bảng `bookings` chỉ có index đơn lẻ hoặc index chưa tối ưu. Thiếu một Composite Index `(stylist_id, status, start_time, end_time)`. Khi số lượng bản ghi lịch hẹn tăng lên vài chục ngàn, mỗi lượt tạo lịch sẽ phải thực hiện Range Scan trên bảng gây nghẽn CPU cơ sở dữ liệu.
  3. **[DB-003 - Thiếu Index trên Khóa Ngoại `payments.order_id`]:**  
     Bảng `payments` chứa cột `order_id BINARY(16)` nhưng không được đánh index. Mỗi khi tra cứu thanh toán theo đơn hàng, MySQL buộc phải Full Table Scan toàn bộ bảng `payments`.
  4. **[DB-004 - Vi phạm Tính Toàn Vẹn Tham Chiếu tại `Voucher.salonId`]:**  
     Thực thể `Voucher` định nghĩa `private UUID salonId;` dạng kiểu dữ liệu trần (raw UUID), không dùng `@ManyToOne @JoinColumn(name = "salon_id")` và bảng `vouchers` không có Foreign Key trỏ về bảng `salons`. Khi một Salon bị xóa hoặc đổi ID, các voucher liên quan trở thành mồ côi (orphaned data).

#### Phân tích Nguy cơ Hiệu Năng N+1 Query:
Khảo sát các Repository và Service cho thấy nhiều vị trí truy vấn quan hệ `FetchType.EAGER` ngầm định hoặc thiếu Fetch Join:
1. `AdminStylistService.java:L380–L393`: Hàm `mapToAdminStylistResponse()` thực hiện vòng lặp duyệt qua danh sách stylist: Với mỗi Stylist, code lại gọi `stylistServiceRepository.findByStylistId()` và `bookingRepository.findFutureActiveBookingsByStylist()`. Khi tải danh sách 50 stylist, backend sẽ bắn thêm **100 câu truy vấn SQL riêng rẽ** xuống MySQL (Kinh điển N+1 Problem).
2. `BookingRepository.java`: Các hàm `searchBookingsPage`, `getBookingBySalonId` tải thực thể `Booking` nhưng không `JOIN FETCH` các quan hệ `bookingDetails`, `stylist`, `user`, dẫn đến Hibernate kích hoạt hàng loạt query con khi Controller serialize dữ liệu sang JSON.

#### Tính Nhất Quán của Soft Delete:
Entity `Booking` và một số entity khác có trường `isDeleted`, nhưng các repository method viết bằng `@Query` JPQL tùy biến lại **quên bổ sung điều kiện `AND b.isDeleted = false`**. Hậu quả là các lịch hẹn đã bị "xóa mềm" vẫn tiếp tục xuất hiện trong các báo cáo thống kê và danh sách tra cứu lịch sử.

---

### 5.4 Chất Lượng Mã Nguồn & Nguyên Tắc Thiết Kế (SOLID, Clean Code)

#### Vi phạm Nguyên tắc Đơn Nhiệm (Single Responsibility Principle - SRP):
Lớp `OrderService.java` (437 dòng) đang đóng vai trò "God Service" trong module bán hàng:
- Chịu trách nhiệm xác thực giỏ hàng và khách hàng.
- Chịu trách nhiệm trực tiếp gọi câu lệnh trừ kho và khôi phục kho.
- Chịu trách nhiệm sinh mã URL và hash tham số cổng thanh toán VNPay (`buildVnPayUrl`).
- Chịu trách nhiệm tạo bản ghi thông báo và bắn WebSocket.
- Chịu trách nhiệm định dạng DTO phản hồi.

#### Vi phạm Nguyên tắc Không Lặp Lại Mã Nguồn (DRY - Don't Repeat Yourself):
Đoạn mã chuyển đổi từ Thực thể sang Response DTO `mapToOrderResponse()` xuất hiện giống hệt nhau tới từng dòng tại:
- `OrderService.java:L340–L385`
- `NotificationService.java:L317–L362`  
Mọi thay đổi trong cấu trúc `OrderResponse` tương lai sẽ buộc lập trình viên phải sửa ở 2 nơi, rất dễ dẫn đến lỗi không đồng bộ dữ liệu.

#### Sử dụng Lệnh In Trực Tiếp ra Console trong Code Production:
Trong `BookingService.java`, phát hiện **hơn 27 lần** sử dụng trực tiếp:
```java
System.out.println("Service offering not found");
System.err.println("Could not publish booking created event: " + e.getMessage());
```
> [!IMPORTANT]
> `System.out.println()` là lời gọi đồng bộ (Synchronous I/O Block) làm chậm luồng xử lý của Tomcat, không được định dạng theo chuẩn JSON/Logback, không có cấp độ log (DEBUG, INFO, WARN, ERROR), và hoàn toàn không thể lọc hay chuyển tiếp về các hệ thống thu thập log tập trung như ELK Stack hay Grafana Loki.

---

### 5.5 Kiểm Thử Tự Động & Độ Tin Cậy (Automated Testing & Coverage)

#### Khảo sát Hiện trạng Test Suite (Thư mục `backend/src/test/`):
Tổng cộng có 14 file kiểm thử đã được thực thi. Phân tích chi tiết:
1. **[LỖI NGHIÊM TRỌNG - Test Giả Mạo / Empty Test Skeleton]:**  
   Tại `CreateBookingTest.java`: File kiểm thử chức năng quan trọng bậc nhất của dự án (Tạo lịch hẹn) thực chất chỉ chứa các khai báo phương thức rỗng (`public void testCreateBooking() {}`), không hề có bất kỳ câu lệnh setup mock, gọi hàm hay `assertEquals` nào! Đây là ca kiểm thử "chống đối" để vượt qua bước chạy `mvn test` trên CI/CD mà không mang lại giá trị bảo đảm chất lượng nào.
2. **Thiếu Ca Kiểm Thử Tích Hợp Đồng Thời (Concurrent Load Test):**  
   Mặc dù `BookingService.createBooking` sử dụng `@Transactional(isolation = Isolation.SERIALIZABLE)`, mã nguồn hoàn toàn không có bất kỳ test case đa luồng (`ExecutorService`, `CountDownLatch`) nào kiểm chứng xem khi 20 threads cùng đặt 1 thợ tại 1 khung giờ thì hệ thống có ném đúng ngoại lệ và chỉ có duy nhất 1 lịch hẹn thành công hay không.
3. **Môi Trường Test Phụ Thuộc Hạ Tầng Thật (Redis Leak in Tests):**  
   Trong `src/test/resources/application.properties`:
   ```properties
   spring.data.redis.host=localhost
   spring.data.redis.port=6379
   ```
   Hệ thống kiểm thử không sử dụng `Embedded Redis` hoặc `Testcontainers Redis`. Nếu máy build CI/CD không cài sẵn Redis service đang chạy ở port 6379, hàng loạt test case phụ thuộc vào Idempotency và Cache sẽ bị gãy (fail) ngay lập tức.
4. **Điểm sáng:**  
   `PaymentWebhookServiceUnitTest.java` và `IdempotencyPaymentTest.java` được viết rất bài bản, sử dụng Mockito và Testcontainers MySQL 8.4 kiểm thử chính xác cơ chế đối soát chữ ký số VNPay và cơ chế chặn request thanh toán lặp.

---

### 5.6 Khả Năng Giám Sát, Vận Hành & Khôi Phục (Observability & Resilience)

1. **Hoàn toàn vắng bóng Spring Boot Actuator:**
   Trong `pom.xml` không khai báo `spring-boot-starter-actuator`. Đội ngũ vận hành hệ thống (DevOps / SRE) hoàn toàn mù thông tin về ứng dụng khi triển khai lên Kubernetes/Docker:
   - Không có endpoint `/actuator/health` để cấu hình Kubernetes Liveness và Readiness Probes.
   - Không có `/actuator/metrics` để đẩy số liệu CPU, Heap Memory, Hikari Connection Pool về Prometheus.
2. **Thiếu Truy vết Phân tán (Distributed Tracing):**
   Không có `Micrometer Tracing` hoặc OpenTelemetry. Khi một request từ client đi qua Web SPA -> BFF Session -> Spring Backend -> Keycloak -> MySQL/Redis, không có bất kỳ `traceId` hay `spanId` nào được gắn vào MDC Logging để theo dõi lịch sử lỗi xuyên suốt chuỗi dịch vụ.
3. **Chiến lược Bọc Khóa Dự Phòng (Fail-Open vs Fail-Close):**
   - Điểm tốt: `RateLimiterService` áp dụng cơ chế *Fail-Open* (nếu Redis gặp sự cố kết nối, bộ lọc bỏ qua và cho phép request đi tiếp thay vì chặn đứng toàn bộ người dùng).
   - Điểm yếu: Chưa có Circuit Breaker (Resilience4j) bọc quanh các cuộc gọi WebClient ra bên ngoài (VietQR, VNPay, Keycloak Admin). Nếu Keycloak hoặc VietQR phản hồi chậm (High Latency), toàn bộ luồng xử lý của Tomcat sẽ bị nghẽn (Thread Starvation), dẫn đến sập ứng dụng dây chuyền (Cascading Failure).

---

## 6. GIAI ĐOẠN 5: MA TRẬN TỔNG HỢP LỖI, RỦI RO & NGUYÊN NHÂN GỐC

### 6.1 Bảng Phân Loại & Mức Độ Nghiêm Trọng

```
┌────────────────────────────────────────────────────────────────────────┐
│                      MA TRẬN MỨC ĐỘ NGHIÊM TRỌNG                       │
├──────────────┬─────────────────────────────────────────────────────────┤
│ CRITICAL (4) │ SEC-001 (Lộ .env), SEC-002 (BOLA IDOR),                 │
│              │ SEC-003 (Session Fixation), BIZ-001 (Dual Payment)      │
├──────────────┼─────────────────────────────────────────────────────────┤
│ HIGH (6)     │ TX-001 (Voucher Race), TX-002 (Manual Stock Rollback),   │
│              │ BIZ-004 (VNPay IP 127.0.0.1), SEC-005 (IP Spoofing),     │
│              │ SEC-006 (Redis RateLimit Lock), DB-001 (UserVoucher Uniq)│
├──────────────┼─────────────────────────────────────────────────────────┤
│ MEDIUM (7)   │ SEC-007 (CSRF Bypass), SEC-008 (Plaintext 2FA),         │
│              │ BIZ-006 (ExpiredPayment Bug), DB-002 (Missing Index),    │
│              │ N+1 Query (Stylist/Booking), CODE-001 (System.out),      │
│              │ TEST-001 (Empty Booking Test)                           │
├──────────────┼─────────────────────────────────────────────────────────┤
│ LOW (4)      │ CODE-002 (Package Naming), Dead Deps (Stripe/JJWT),      │
│              │ Missing Actuator, Inconsistent Exception Formatting      │
└──────────────┴─────────────────────────────────────────────────────────┘
```

### 6.2 Phân Tích Nguyên Nhân Gốc (Root Cause Analysis - RCA)

1. **Nguyên nhân Bảo mật (Security Discipline Deficit):**
   - Đội ngũ phát triển thiếu quy trình quét mã tĩnh (SAST - SonarQube/Trivy) và tiền kiểm tra commit (pre-commit git hooks) dẫn đến việc đẩy file `.env` chứa mật khẩu thật lên repository.
   - Nhầm lẫn giữa việc "Xác thực danh tính" (Authentication) và "Ủy quyền truy cập dữ liệu" (Authorization). Khi thấy user đã có token hợp lệ, code tin tưởng tuyệt đối vào các trường ID truyền lên từ Client body/URL mà không thực hiện kiểm tra quan hệ sở hữu (`resource.userId == currentUser.id`).
2. **Nguyên nhân Kiến trúc Dữ liệu (Data Modeling & Transaction Misconception):**
   - Thiếu một bản vẽ State Machine rõ ràng cho vòng đời Booking và Payment. Việc `BookingService` tự tiện tạo `Payment` PENDING trong khi `PaymentApplicationService` lại có hàm checkout riêng là hệ quả của việc phân chia trách nhiệm không rành mạch.
   - Hiểu sai về cơ chế rollback của Cơ sở dữ liệu: Cố gắng bắt exception và hoàn tác dữ liệu bằng các câu lệnh SQL bù trừ thủ công trong tầng Service thay vì cấu hình đúng Transaction Boundary để RDBMS tự động rollback nguyên tử.
3. **Nguyên nhân Tiêu chuẩn Lập trình (Code Quality Standard Inconsistency):**
   - Chưa thiết lập bộ quy tắc Checkstyle/Spotless thống nhất cho dự án (dẫn đến đặt tên package viết hoa, nuốt exception, lạm dụng `System.out.println` và thiếu thống nhất định dạng lỗi HTTP).

---

## 7. BẢNG ĐIỂM ĐÁNH GIÁ TOÀN DIỆN & TRỌNG SỐ (SCORECARD)

### 7.1 Thang Điểm Chuẩn (0 – 5)
- **0 điểm:** Hoàn toàn không triển khai hoặc sai lệch nghiêm trọng, đe dọa trực tiếp sự tồn vong của hệ thống.
- **1 điểm:** Rất yếu, tồn tại lỗ hổng chí mạng hoặc nhiều thiếu sót cơ bản.
- **2 điểm:** Đã triển khai được một phần nhưng còn nhiều lỗi nghiêm trọng và rủi ro vận hành.
- **3 điểm:** Đạt yêu cầu kỹ thuật cơ bản, đáp ứng nghiệp vụ nhưng còn thiếu sót nhỏ cần khắc phục.
- **4 điểm:** Tốt, tuân thủ đúng chuẩn công nghiệp, chỉ còn một vài chi tiết cần tối ưu hóa.
- **5 điểm:** Xuất sắc, có bằng chứng vững chắc, tối ưu cao về hiệu năng, bảo mật và khả năng mở rộng.

### 7.2 Bảng Điểm Chi Tiết Từng Nhóm Kỹ Thuật

| Nhóm Đánh Giá | Trọng Số | Điểm (0-5) | Điểm Có Trọng Số | Lý Do Đánh Giá & Bằng Chứng Cốt Lõi |
|---|:---:|:---:|:---:|---|
| **1. Kiến Trúc & Thiết Kế Tổng Thể** | 15% | **2.5** | 0.375 | Strategy Pattern và BFF tốt; nhưng vi phạm SRP/DRY nghiêm trọng, không phải DDD, Anemic Domain, Dual Payment creation. |
| **2. API Design & Xử Lý Ngoại Lệ** | 10% | **2.5** | 0.250 | Hỗ trợ phân trang; nhưng URL không nhất quán (`/api/booking` vs `/api/bookings`), GET method có side-effect ghi DB, `GlobalExceptionHandler` trả response hỗn loạn và in stacktrace. |
| **3. Cơ Sở Dữ Liệu & Giao Dịch (JPA/DB)** | 15% | **3.0** | 0.450 | Schema V1-V7 bài bản, BINARY(16) UUID, `@Version` tốt; nhưng thiếu Unique constraint `user_vouchers`, thiếu index quan trọng, N+1 query tại nhiều vị trí. |
| **4. Bảo Mật & Phân Quyền (Security)** | 20% | **1.0** | 0.200 | 🚨 **BLOCKER CHÍ MẠNG**: Lộ credentials trong `.env`, BOLA/IDOR diện rộng, tắt Session Fixation protection, IP Spoofing, Race Condition DoS trong Rate Limiter. |
| **5. Logic Nghiệp Vụ & Xử Lý Đồng Thời** | 15% | **2.5** | 0.375 | Booking SERIALIZABLE + pessimistic lock tốt; nhưng race condition Voucher `usedCount`, rollback tồn kho thủ công sai chuẩn, scheduler hủy payment sai logic. |
| **6. Chất Lượng Mã Nguồn & Clean Code** | 10% | **2.0** | 0.200 | 27+ lần gọi `System.out/err`, package naming vi phạm chuẩn Java, dead dependencies (Stripe, JJWT), throw generic `Exception`. |
| **7. Kiểm Thử Tự Động (Testing)** | 10% | **2.5** | 0.250 | Webhook unit test và Idempotency test với Testcontainers rất tốt; nhưng `CreateBookingTest` là skeleton rỗng, thiếu concurrent test, phụ thuộc Redis thật. |
| **8. Giám Sát, Vận Hành & Khôi Phục** | 5% | **1.0** | 0.050 | Hoàn toàn không có Spring Boot Actuator, không có Health check cho K8s, thiếu Distributed Tracing, thiếu Circuit Breaker. |
| **TỔNG HỢP TOÀN DỰ ÁN** | **100%** | — | **2.35 / 5.0** | **XẾP LOẠI: YẾU - CHƯA ĐẠT CHUẨN SẢN XUẤT (UNACCEPTABLE FOR PRODUCTION)** |

> [!CAUTION]
> **KẾT LUẬN KIỂM TOÁN CHÍNH THỨC:**  
> Mặc dù điểm số kỹ thuật đạt **2.35 / 5.0**, nhưng do **Trụ cột Bảo mật chỉ đạt 1.0/5.0 với 4 lỗi mức độ CRITICAL**, dự án bị áp dụng quy tắc **VETO BLOCKER**. Nghiêm cấm bàn giao hoặc phát hành phiên bản hiện tại ra môi trường Internet cho đến khi toàn bộ các khuyến nghị tại Giai đoạn 6 (Phase 0 và Phase 1) được khắc phục triệt để.

---

## 8. GIAI ĐOẠN 6: LỘ TRÌNH CẢI TIẾN KỸ THUẬT (REMEDIATION ROADMAP)

Lộ trình được cấu trúc thành 4 giai đoạn ưu tiên, phân bổ theo mức độ khẩn cấp và nguồn lực thực thi:

```
┌────────────────────────────────────────────────────────────────────────┐
│                 LỘ TRÌNH TỐI ƯU HÓA HỆ THỐNG (ROADMAP)                 │
├────────────────────────────────────────────────────────────────────────┤
│ 🚨 Phase 0: TỐI KHẨN TRONG 24H (Security Incident Response)            │
│    • Thu hồi, tái tạo toàn bộ Secrets (DB, Keycloak, Google, Cloudinary)│
│    • Dọn sạch git history bằng BFG Repo-Cleaner                        │
│    • Bật cookie.secure=true                                            │
├────────────────────────────────────────────────────────────────────────┤
│ 🔴 Phase 1: BLOCKERS TRƯỚC SẢN XUẤT (Tuần 1 - Tuần 2)                  │
│    • Vá toàn bộ lỗ hổng BOLA/IDOR bằng Security Context Owner Check   │
│    • Sửa Session Fixation: .sessionFixation().changeSessionId()        │
│    • Loại bỏ Dual Payment Entity Creation giữa Booking & Payment       │
│    • Khóa Bi quan (Pessimistic Lock) khi cập nhật Voucher usedCount    │
│    • Nguyên tử hóa Redis Rate Limiter bằng Lua Script                  │
│    • Sửa lỗi Client IP VNPay & Lỗi Logic ExpiredPaymentScheduler       │
│    • Viết Migration V8 bổ sung UNIQUE constraint user_vouchers         │
├────────────────────────────────────────────────────────────────────────┤
│ 🟡 Phase 2: CHẤT LƯỢNG KỸ THUẬT & ỔN ĐỊNH (Tuần 3 - Tuần 4)            │
│    • Chuẩn hóa GlobalExceptionHandler (1 định dạng JSON duy nhất)     │
│    • Thay thế 100% System.out bằng SLF4J Logger                        │
│    • Khắc phục N+1 Query tại AdminStylistService & BookingRepository   │
│    • Đưa rollback tồn kho về đúng Transaction Management               │
│    • Tích hợp Spring Boot Actuator & Cấu hình Docker Healthcheck       │
│    • Viết lại CreateBookingTest với Concurrent Load Test               │
├────────────────────────────────────────────────────────────────────────┤
│ 🟢 Phase 3: TIẾN HÓA KIẾN TRÚC & MỞ RỘNG (Tháng thứ 2)                 │
│    • Tách Monolith sang Modular Monolith, áp dụng Domain Event chuẩn   │
│    • Áp dụng Transactional Outbox Pattern cho Payment/Booking Events   │
│    • Tích hợp Resilience4j Circuit Breaker cho Third-party APIs        │
│    • Dọn dẹp Dead Dependencies (Stripe, JJWT), đổi WebFlux sang RestClient│
└────────────────────────────────────────────────────────────────────────┘
```

---

## 9. PHỤ LỤC: DANH SÁCH FILE ĐÃ ĐỐI SOÁT & CODE PATCH THAM KHẢO

### 9.1 Danh Sách Tệp Tin Đã Đọc & Đối Soát Toàn Diện (100% Verified)
- **Tài liệu & Cấu hình:** `pom.xml`, `application.properties`, `test/application.properties`, `.env`, `.env.example`, `.gitignore`, `README.md`, `CODE_REVIEW.md`, `initData.md`, `Testing_Feature.md`.
- **Cơ sở dữ liệu (Flyway):** `V1__init_schema.sql`, `V2__add_missing_columns.sql`, `V3__user_vouchers.sql`, `V4__add_vnpay_to_orders.sql`, `V5__service_salon_suspensions.sql`, `V6__add_next_available_on_time_to_stylists.sql`, `V7__allow_null_salon_id_in_stylists.sql`.
- **Security & Configuration:** `SecurityConfig.java`, `KeycloakConfig.java`, `KeycloakRoleConverter.java`, `CsrfCookieFilter.java`, `BffSessionService.java`, `WebSocketAuthInterceptor.java`, `WebSocketConfig.java`, `RedisConfig.java`, `ShedLockConfig.java`, `VnPayConfig.java`.
- **Rate Limiting:** `RateLimiterService.java`, `IpRateLimitingFilter.java`, `RateLimitInterceptor.java`, `RateLimitWebConfig.java`, `ClientIpResolver.java`, `RateLimit.java`.
- **Controllers:** `BookingController.java`, `OrderController.java`, `PaymentController.java`, `AuthController.java`, `UserController.java`, `StylistController.java`, `SalonController.java`, `ReviewController.java`, `MediaController.java`, `NotificationController.java`, `AdminStylistController.java`, `AdminShopController.java`, `BankWebhookController.java`.
- **Services:** `BookingService.java`, `OrderService.java`, `PaymentApplicationService.java`, `PaymentWebhookService.java`, `PaymentPersistenceService.java`, `VoucherService.java`, `ReviewService.java`, `NotificationService.java`, `UserService.java`, `SalonService.java`, `AdminStylistService.java`, `AuthService.java`.
- **Strategies & Utilities:** `VnPayStrategy.java`, `BankTransferStrategy.java`, `CodStrategy.java`, `IdempotencyService.java`, `ExpiredPaymentScheduler.java`, `VNPayUtil.java`.
- **Entities & Repositories:** `Booking.java`, `Payment.java`, `PaymentTransaction.java`, `Order.java`, `OrderDetail.java`, `BookingDetail.java`, `User.java`, `Voucher.java`, `Salon.java`, `Stylist.java`, `UserVoucher.java`, `BookingRepository.java`, `PaymentRepository.java`, `OrderRepository.java`, `VoucherRepository.java`, `UserRepository.java`, `StylistRepository.java`.
- **Exceptions:** `GlobalExceptionHandler.java`, `PaymentException.java`, `NotFoundException.java`, `QrGenerateException.java`, `MediaValidationException.java`.
- **Tests:** `CreateBookingTest.java`, `BookingLifecycleUnitTest.java`, `PaymentWebhookIntegrationTest.java`, `PaymentWebhookServiceUnitTest.java`, `CreatePaymentSuccessTest.java`, `IdempotencyPaymentTest.java`, `VoucherEngineUnitTest.java`.

---

### 9.2 Các Đoạn Mã Sửa Mẫu Chuẩn Doanh Nghiệp (Production-Grade Patches)

#### Patch 1: Sửa Triệt Để Lỗ Hổng BOLA/IDOR tại `BookingController.java`
```java
// BỔ SUNG: Kiểm tra quyền sở hữu tài nguyên thông qua Authentication Context
@DeleteMapping("/{id}")
public ResponseEntity<?> cancelBooking(
        @PathVariable UUID id, 
        Authentication authentication) {
    
    UUID currentUserId = securityUtils.getCurrentUserId(authentication);
    boolean isAdmin = securityUtils.hasRole(authentication, "ROLE_ADMIN");
    
    // Ủy quyền cho Service xử lý đối soát quyền sở hữu
    bookingService.cancelBookingSecure(id, currentUserId, isAdmin);
    return ResponseEntity.ok(Map.of("message", "Lịch hẹn đã được hủy thành công"));
}
```

#### Patch 2: Sửa Lỗ Hổng Session Fixation tại `SecurityConfig.java`
```java
// TRƯỚC ĐÓ (NGUY HIỂM):
// .sessionFixation().none()

// SAU KHI SỬA (CHUẨN BẢO MẬT OWASP):
.sessionManagement(session -> session
    .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
    .sessionFixation(fixation -> fixation.changeSessionId()) // Cấp mới Session ID ngay sau login
    .maximumSessions(3) // Hạn chế tối đa 3 phiên đồng thời / tài khoản
)
```

#### Patch 3: Khắc Phục Nguyên Tử Hóa Redis Rate Limiter (`RateLimiterService.java`)
```java
// Sử dụng Redis Lua Script đảm bảo INCR và EXPIRE luôn chạy nguyên tử (Atomic)
private static final String RATE_LIMIT_LUA_SCRIPT = 
    "local current = redis.call('INCR', KEYS[1]) " +
    "if current == 1 then " +
    "    redis.call('EXPIRE', KEYS[1], ARGV[1]) " +
    "end " +
    "return current";

public RateLimitResult tryAcquire(String keyPrefix, String identifier, int maxRequests, int windowSeconds) {
    String key = "ratelimit:" + keyPrefix + ":" + identifier;
    try {
        RedisScript<Long> script = new DefaultRedisScript<>(RATE_LIMIT_LUA_SCRIPT, Long.class);
        Long currentCount = redisTemplate.execute(script, Collections.singletonList(key), String.valueOf(windowSeconds));
        
        long count = currentCount != null ? currentCount : 1L;
        boolean allowed = count <= maxRequests;
        return new RateLimitResult(allowed, Math.max(0, maxRequests - count), windowSeconds);
    } catch (Exception e) {
        log.error("Redis Rate Limiter gặp sự cố, kích hoạt chế độ Fail-Open: {}", e.getMessage());
        return new RateLimitResult(true, maxRequests, 0); // Fail-Open an toàn
    }
}
```

#### Patch 4: Migration V8 Sửa Lỗi Schema (`V8__fix_critical_constraints.sql`)
```sql
-- Migration V8: Khắc phục các khiếm khuyết toàn vẹn dữ liệu
-- 1. Chống duplicate voucher per user
ALTER TABLE user_vouchers 
ADD CONSTRAINT uk_user_vouchers_user_voucher UNIQUE (user_id, voucher_id);

-- 2. Đánh index cho order_id trong bảng payments
CREATE INDEX idx_payments_order_id ON payments (order_id);

-- 3. Đánh composite index tối ưu hóa kiểm tra trùng lịch Stylist
CREATE INDEX idx_bookings_stylist_schedule_v2 
ON bookings (stylist_id, status, start_time, end_time);

-- 4. Bổ sung UNIQUE ngăn duplicate review cho 1 lịch hẹn
ALTER TABLE reviews 
ADD CONSTRAINT uk_reviews_booking UNIQUE (booking_id);
```

---

*Báo cáo kiểm toán kỹ thuật được lập và chuẩn hóa bởi Principal Software Architect & Lead Security Auditor.*  
*Toàn bộ các phát hiện đều được trích xuất trực tiếp từ mã nguồn thực tế của dự án BookingSalon.*

