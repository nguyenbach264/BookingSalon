# Microservices Architecture
## Lý thuyết nền tảng, Kiến thức liên quan & Lộ trình chuyển đổi BookingSalon

> **Hiện tại**: Spring Boot Monolith (1 JAR) + React SPA + Keycloak + MySQL + Redis  
> **Mục tiêu**: Microservices Architecture — Độc lập, scale riêng biệt, fault-tolerant  
> **Đối tượng**: Developer đã có nền tảng Spring Boot, muốn hiểu và thực hành Microservices

---

## MỤC LỤC

1. [Monolith vs Microservices — Hiểu đúng trước khi chuyển](#1-monolith-vs-microservices--hiểu-đúng-trước-khi-chuyển)
2. [Nền tảng lý thuyết Microservices](#2-nền-tảng-lý-thuyết-microservices)
3. [Service Communication — Cách các service nói chuyện với nhau](#3-service-communication--cách-các-service-nói-chuyện-với-nhau)
4. [API Gateway — Cổng vào duy nhất](#4-api-gateway--cổng-vào-duy-nhất)
5. [Service Discovery — Cách service tìm nhau](#5-service-discovery--cách-service-tìm-nhau)
6. [Message Broker — Giao tiếp bất đồng bộ](#6-message-broker--giao-tiếp-bất-đồng-bộ)
7. [Distributed Data Management — Mỗi service có DB riêng](#7-distributed-data-management--mỗi-service-có-db-riêng)
8. [Saga Pattern — Quản lý transaction phân tán](#8-saga-pattern--quản-lý-transaction-phân-tán)
9. [Resilience Patterns — Chịu lỗi trong hệ thống phân tán](#9-resilience-patterns--chịu-lỗi-trong-hệ-thống-phân-tán)
10. [Observability — Giám sát hệ thống phân tán](#10-observability--giám-sát-hệ-thống-phân-tán)
11. [Containerization — Docker & Kubernetes](#11-containerization--docker--kubernetes)
12. [CI/CD cho Microservices](#12-cicd-cho-microservices)
13. [Phân tích hệ thống BookingSalon hiện tại](#13-phân-tích-hệ-thống-bookingsalon-hiện-tại)
14. [Lộ trình chuyển đổi chi tiết từng bước](#14-lộ-trình-chuyển-đổi-chi-tiết-từng-bước)
15. [Stack công nghệ đề xuất](#15-stack-công-nghệ-đề-xuất)

---

## 1. Monolith vs Microservices — Hiểu đúng trước khi chuyển

### 1.1 Monolithic Architecture — Kiến trúc Monolith

```
BookingSalon hiện tại (Monolith):

┌────────────────────────────────────────────────────────────┐
│                   BookingSalon.jar                          │
│                                                             │
│  [Auth] [Booking] [Order] [Payment] [Review] [Notification] │
│  [User] [Salon]   [Stylist][Product][Voucher][Media]        │
│                                                             │
│              Shared MySQL Database                          │
│              Shared Redis Cache                             │
└────────────────────────────────────────────────────────────┘
           Deploy một lần, chạy một tiến trình
```

**Đặc điểm Monolith:**

| Tiêu chí | Monolith | Nhận xét cho BookingSalon |
|---------|----------|--------------------------|
| **Deploy** | 1 JAR duy nhất | ✅ Đơn giản |
| **Debug** | IDE trace toàn bộ | ✅ Dễ debug |
| **Transaction** | ACID local | ✅ Booking + Payment nhất quán |
| **Latency** | In-process call | ✅ Gọi hàm = nano giây |
| **Scale** | Scale cả ứng dụng | ❌ Booking tốn CPU → scale cả Payment |
| **Fault isolation** | Một bug crash toàn bộ | ❌ OOM trong Payment → Booking chết |
| **Team** | Khó làm việc song song | ❌ Conflict code thường xuyên |
| **Technology** | Một ngôn ngữ/framework | ❌ Không thể dùng Python cho ML |
| **Deployment risk** | Release = rủi ro cao | ❌ Fix 1 bug → redeploy toàn bộ |

### 1.2 Microservices Architecture

```
BookingSalon (Microservices):

┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  Auth    │  │ Booking  │  │  Order   │  │ Payment  │
│ Service  │  │ Service  │  │ Service  │  │ Service  │
│  :8081   │  │  :8082   │  │  :8083   │  │  :8084   │
│  MySQL   │  │  MySQL   │  │  MySQL   │  │  MySQL   │
└──────────┘  └──────────┘  └──────────┘  └──────────┘
     ▲              ▲              ▲              ▲
     └──────────────┴──────────────┴──────────────┘
                        │
               ┌────────▼────────┐
               │   API Gateway   │
               │   :8080         │
               └────────┬────────┘
                        │
                    Clients
                 (Web, Mobile)
```

**Đặc điểm Microservices:**

| Tiêu chí | Microservices | Nhận xét |
|---------|---------------|---------|
| **Deploy** | Mỗi service độc lập | ✅ Fix Booking → không ảnh hưởng Payment |
| **Scale** | Scale từng service | ✅ Booking peak → chỉ scale Booking |
| **Fault isolation** | Service lỗi → không lan rộng | ✅ (với circuit breaker) |
| **Team** | Team độc lập per service | ✅ Conway's Law |
| **Technology** | Mỗi service stack riêng | ✅ Linh hoạt |
| **Debug** | Distributed tracing cần thiết | ❌ Phức tạp hơn |
| **Transaction** | Distributed transaction khó | ❌ Saga pattern phức tạp |
| **Latency** | Network call (ms) | ❌ Chậm hơn in-process |
| **Operational overhead** | Nhiều service = nhiều thứ quản lý | ❌ Cần DevOps mạnh |

### 1.3 Khi nào NÊN và KHÔNG NÊN dùng Microservices?

```
NÊN dùng Microservices khi:
  ✅ Team > 5-10 developers (nhiều team làm song song)
  ✅ Có nhu cầu scale khác nhau giữa các module
  ✅ Cần independence trong deployment
  ✅ Các domain business thực sự tách biệt
  ✅ Cần fault isolation (1 service lỗi không ảnh hưởng toàn bộ)
  ✅ Long-term maintainability quan trọng hơn short-term velocity

KHÔNG nên dùng Microservices khi:
  ❌ Team nhỏ (< 5 người) — overhead quản lý > lợi ích
  ❌ Dự án mới, domain chưa ổn định (premature decomposition)
  ❌ Không có DevOps/infrastructure expertise
  ❌ Không cần scale độc lập
  ❌ Deadline gấp (Microservices chậm hơn để setup)

Martin Fowler's advice: "Don't start with Microservices.
  Monolith first → extract services when you feel the pain."
```

---

## 2. Nền tảng lý thuyết Microservices

### 2.1 Bounded Context — Ranh giới Domain

Khái niệm từ **Domain-Driven Design (DDD)** — cốt lõi của việc phân chia service:

```
Bounded Context = Ranh giới trong đó một Domain Model có ý nghĩa nhất quán

Ví dụ trong BookingSalon:

Booking Context:
  "Customer" = người đặt lịch, có booking_id, preferred_stylist
  "Stylist"  = người thực hiện dịch vụ
  "Slot"     = khung giờ trống/đã đặt

Order Context:
  "Customer" = người mua hàng, có shipping_address, loyalty_points
  "Product"  = sản phẩm trong giỏ, có inventory_count
  "Price"    = giá sau discount, VAT

→ "Customer" trong Booking Context ≠ "Customer" trong Order Context
  Dù cùng là User, nhưng attributes và behavior khác nhau
  → Mỗi context có model riêng, DB schema riêng
```

### 2.2 The Twelve-Factor App

12 nguyên tắc cho ứng dụng microservice cloud-native:

```
1. Codebase:       1 codebase per service, track bằng Git
2. Dependencies:   Declare rõ ràng (pom.xml, package.json), không system-install
3. Config:         Config trong environment variables (không hardcode, không commit)
4. Backing Services: DB, Redis, Mail là "attached resources" — có thể swap
5. Build/Release/Run: Tách biệt 3 giai đoạn
6. Processes:      Stateless — không lưu state trong memory process
7. Port binding:   Service tự expose port, không cần web server bên ngoài
8. Concurrency:    Scale bằng nhiều process (horizontal)
9. Disposability:  Fast startup, graceful shutdown
10. Dev/Prod parity: Dev giống Production nhất có thể (Docker)
11. Logs:          Xử lý log như event streams (stdout → ELK/Loki)
12. Admin processes: Chạy migration, scripts như one-off processes
```

### 2.3 Single Responsibility Principle ở cấp Service

```
Mỗi microservice chỉ làm 1 việc và làm thật tốt:

❌ Sai: "UserService" xử lý user profile + authentication + notifications + orders

✅ Đúng:
  auth-service:         Xác thực, cấp token, SSO
  user-service:         User profile, preferences
  notification-service: Gửi thông báo (email, push, WS)
  order-service:        Tạo và quản lý đơn hàng
```

### 2.4 Database per Service Pattern

```
NGUYÊN TẮC VÀNG: Mỗi service có database riêng, không service nào
được truy cập trực tiếp vào database của service khác.

Tại sao?
  - Decoupling: Booking Service có thể đổi từ MySQL sang MongoDB
    mà không ảnh hưởng Order Service
  - Independence: Schema của service A không bị ảnh hưởng bởi service B
  - Scalability: Mỗi DB có thể được scale/optimize riêng

Thực tế:
  booking_db:      Bảng bookings, booking_details, stylist_schedules
  order_db:        Bảng orders, order_details, carts
  payment_db:      Bảng payments, payment_transactions, bank_transfers
  user_db:         Bảng users, admins, roles
  catalog_db:      Bảng salons, stylists, services, products, categories
  notification_db: Bảng notifications, email_logs
  review_db:       Bảng reviews
  voucher_db:      Bảng vouchers, user_vouchers
```

---

## 3. Service Communication — Cách các service nói chuyện với nhau

### 3.1 Synchronous Communication (Đồng bộ)

**REST over HTTP — Đơn giản, phổ biến nhất:**

```
Booking Service cần kiểm tra Stylist availability:

Booking Service ──[GET /stylists/{id}/availability]──► Stylist Service
Booking Service ◄──[200 OK, {available: true}]──────── Stylist Service

Ưu điểm:
  ✅ Đơn giản, dễ debug
  ✅ HTTP là universal protocol
  ✅ Browser có thể gọi trực tiếp

Nhược điểm:
  ❌ Tight coupling về thời gian — cả hai phải online
  ❌ Nếu Stylist Service down → Booking Service fail
  ❌ Latency cộng dồn (N service calls = N * latency)
```

**gRPC — Hiệu suất cao, typed contract:**

```
Booking Service ──[gRPC CheckAvailability(stylistId, time)]──► Stylist Service
Booking Service ◄──[gRPC AvailabilityResponse(available)]────── Stylist Service

Ưu điểm:
  ✅ Nhanh hơn REST (binary protobuf thay vì JSON text)
  ✅ Strongly typed (protobuf schema)
  ✅ Streaming support (server-side, client-side, bidirectional)
  ✅ Code generation tự động

Nhược điểm:
  ❌ Phức tạp hơn REST
  ❌ Không thể gọi từ browser nếu không có gRPC-Web
  ❌ Khó debug hơn (binary format)

Dùng gRPC cho:
  - Service-to-service internal calls (không phải client-facing)
  - High-throughput, low-latency requirements
  - Streaming data
```

### 3.2 Asynchronous Communication (Bất đồng bộ)

**Message Broker (Kafka/RabbitMQ) — Decoupled, reliable:**

```
Booking Service:
  1. Tạo booking thành công
  2. Publish event: BookingCreated { bookingId, userId, stylistId, time }
  3. Trả về response ngay cho client (không chờ downstream)

Notification Service (subscribe):
  → Nhận BookingCreated event
  → Gửi email/push notification cho user

Payment Service (subscribe):
  → Nhận BookingCreated event
  → Khởi tạo payment record

Stylist Service (subscribe):
  → Nhận BookingCreated event
  → Update stylist schedule, block time slot

Ưu điểm:
  ✅ Loose coupling — Publisher không biết Subscriber
  ✅ Fault tolerance — Subscriber down → message được queue
  ✅ Scalability — Nhiều consumer xử lý song song
  ✅ Temporal decoupling — Không cần online cùng lúc

Nhược điểm:
  ❌ Eventual consistency — Không nhất quán ngay lập tức
  ❌ Khó debug hơn (message flow không rõ)
  ❌ At-least-once delivery → phải idempotent
  ❌ Thêm infrastructure (Kafka cluster, ZooKeeper)
```

### 3.3 Chọn Sync hay Async?

```
Dùng Synchronous (REST/gRPC) khi:
  ✅ Cần response ngay để tiếp tục xử lý
  ✅ Đọc dữ liệu (query)
  ✅ Validation cần kết quả từ service khác
  Ví dụ: Check inventory trước khi confirm order

Dùng Asynchronous (Message Broker) khi:
  ✅ Có thể xử lý sau (fire and forget)
  ✅ Nhiều service cần react với cùng event
  ✅ Cần reliability (guarantee delivery)
  ✅ Cần decouple hoàn toàn
  Ví dụ: Gửi email sau khi booking, update analytics
```

---

## 4. API Gateway — Cổng vào duy nhất

### 4.1 API Gateway là gì?

```
Không có API Gateway (Bad):
  Client phải biết địa chỉ của từng service
  Browser → Booking Service :8082
  Browser → Order Service :8083
  Browser → Payment Service :8084
  → N services = N CORS configs, N auth checks, N domains

Có API Gateway (Good):
  Browser → API Gateway :8080 (điểm duy nhất)
  API Gateway → Route đến service phù hợp

┌─────────────────────────────────────┐
│           API GATEWAY               │
│                                     │
│  /api/bookings/* → Booking Service  │
│  /api/orders/*   → Order Service    │
│  /api/payments/* → Payment Service  │
│  /api/users/*    → User Service     │
│                                     │
│  Cross-cutting concerns:            │
│  • Authentication / Authorization   │
│  • Rate Limiting                    │
│  • Load Balancing                   │
│  • SSL Termination                  │
│  • Request/Response Logging         │
│  • Circuit Breaking                 │
│  • Request Transformation           │
└─────────────────────────────────────┘
```

### 4.2 API Gateway Patterns

**Pattern 1: Backend for Frontend (BFF) — Đang dùng!**

```
BookingSalon đã có BFF pattern (Spring Boot là BFF):
  Frontend → BFF → Keycloak + Backend Services

Trong Microservices:
  Web BFF → cho React frontend (optimize response cho web)
  Mobile BFF → cho iOS/Android (response nhỏ hơn, format khác)
```

**Pattern 2: Gateway Aggregation**

```
Một request của client cần data từ nhiều service:
  GET /api/booking-summary/{bookingId}
  
API Gateway gọi song song:
  → Booking Service: GET /bookings/{id}      → booking data
  → User Service:    GET /users/{userId}     → user info
  → Stylist Service: GET /stylists/{id}      → stylist info
  → Payment Service: GET /payments/{bookingId} → payment status

Gộp kết quả → Trả về cho client trong 1 response

Lợi ích: Client gọi 1 request thay vì 4 → giảm network roundtrips
```

### 4.3 Lựa chọn API Gateway

| Công nghệ | Type | Phù hợp khi |
|---------|------|------------|
| **Spring Cloud Gateway** | Code-based (Java) | Team Java, cần custom logic |
| **Kong** | Declarative | Enterprise, plugin ecosystem |
| **Nginx** | Reverse proxy | Đơn giản, đã quen (đang dùng) |
| **AWS API Gateway** | Managed | Dùng AWS ecosystem |
| **Traefik** | Auto-discovery | Docker/K8s environment |

**Khuyến nghị cho BookingSalon**: Spring Cloud Gateway (cùng ecosystem với Spring Boot)

---

## 5. Service Discovery — Cách service tìm nhau

### 5.1 Vấn đề

```
Trong Microservices, service instances có thể:
  - Chạy trên nhiều server khác nhau
  - Scale up/down dynamically
  - Có IP thay đổi liên tục (Docker/K8s)

Booking Service muốn gọi Payment Service:
  → Gọi IP nào? Port nào?
  → Nếu Payment Service scale thành 3 instances → gọi instance nào?
  → Nếu 1 instance chết → biết để không gọi vào đó?
```

### 5.2 Client-side Discovery (Eureka)

```
1. Mỗi service khi start → đăng ký với Service Registry (Eureka)
   Payment Service A: "Tôi là payment-service, chạy ở 10.0.0.1:8084"
   Payment Service B: "Tôi là payment-service, chạy ở 10.0.0.2:8084"

2. Booking Service muốn gọi Payment:
   → Hỏi Eureka: "payment-service đang ở đâu?"
   → Eureka trả về: [10.0.0.1:8084, 10.0.0.2:8084]
   → Client-side load balancing (Ribbon/Spring LoadBalancer): chọn instance

Spring Cloud Eureka:
  @EnableEurekaServer  ← Eureka Server
  @EnableDiscoveryClient ← Mỗi service client

  // Gọi service theo tên, không cần hardcode IP
  @FeignClient(name = "payment-service")
  public interface PaymentClient {
      @GetMapping("/payments/{bookingId}")
      PaymentResponse getPayment(@PathVariable UUID bookingId);
  }
```

### 5.3 Server-side Discovery (Kubernetes/Load Balancer)

```
Kubernetes tự động handle service discovery:
  booking-service → payment-service:8084
  (K8s DNS tự resolve đến đúng pod)
  
Đây là approach hiện đại hơn, không cần Eureka nếu dùng K8s.
```

---

## 6. Message Broker — Giao tiếp bất đồng bộ

### 6.1 Apache Kafka vs RabbitMQ

| Tiêu chí | Kafka | RabbitMQ |
|---------|-------|---------|
| **Model** | Log-based (commit log) | Queue-based (push) |
| **Message retention** | Giữ lại theo thời gian (days/weeks) | Xóa sau khi consumer ack |
| **Throughput** | Cực cao (millions/sec) | Cao (tens of thousands/sec) |
| **Consumer model** | Pull (consumer tự lấy) | Push (broker đẩy cho consumer) |
| **Ordering** | Per-partition ordering | Per-queue ordering |
| **Replay** | ✅ Có thể replay từ offset bất kỳ | ❌ Không thể |
| **Routing** | Topic-based (simple) | Exchange/binding (complex) |
| **Complexity** | Cao (ZooKeeper/KRaft) | Trung bình |
| **Use case** | Event streaming, audit log, analytics | Task queue, RPC, complex routing |

**Khuyến nghị cho BookingSalon**: **RabbitMQ** cho bắt đầu (đơn giản hơn, đủ tải), **Kafka** khi cần event sourcing hoặc analytics.

### 6.2 Event-Driven Architecture (EDA)

```
Domain Events — Events quan trọng trong business:

BookingDomain:
  BookingCreated   { bookingId, userId, stylistId, serviceId, scheduledAt }
  BookingConfirmed { bookingId, confirmedAt }
  BookingCancelled { bookingId, reason, cancelledAt }
  BookingCompleted { bookingId, completedAt }

OrderDomain:
  OrderCreated  { orderId, userId, items, totalAmount }
  OrderShipped  { orderId, trackingCode }
  OrderDelivered{ orderId, deliveredAt }

PaymentDomain:
  PaymentInitiated   { paymentId, bookingId/orderId, amount, method }
  PaymentSucceeded   { paymentId, transactionId, paidAt }
  PaymentFailed      { paymentId, reason }
  RefundRequested    { paymentId, amount, reason }

Subscribers và reactions:
  BookingCreated →
    notification-service: Gửi email/push xác nhận cho User và Stylist
    calendar-service: Block time slot của Stylist
    analytics-service: Record booking event

  PaymentSucceeded →
    booking-service: Confirm booking status
    notification-service: Gửi receipt
    loyalty-service: Cộng điểm
```

### 6.3 Message Patterns

**Publish-Subscribe (Pub/Sub):**

```
Publisher → Topic/Exchange → [Subscriber A, Subscriber B, Subscriber C]
                              (Tất cả subscriber đều nhận)
Dùng cho: Domain events (BookingCreated → nhiều service cần biết)
```

**Point-to-Point (Queue):**

```
Sender → Queue → [Consumer A | Consumer B]
                  (Chỉ 1 consumer nhận mỗi message)
Dùng cho: Task queue, chỉ 1 worker xử lý (gửi email, resize image)
```

**Request-Reply:**

```
Service A → Request Queue → Service B (xử lý)
Service A ← Reply Queue   ← Service B (trả kết quả)
Dùng cho: Async RPC khi cần kết quả nhưng không muốn blocking HTTP
```

---

## 7. Distributed Data Management — Mỗi service có DB riêng

### 7.1 Database per Service Challenges

```
Vấn đề 1: Query JOIN giữa các DB không còn được

Monolith:
  SELECT b.*, u.name, s.name
  FROM bookings b
  JOIN users u ON b.user_id = u.id
  JOIN stylists s ON b.stylist_id = s.id

Microservices — KHÔNG thể JOIN:
  booking_db và user_db là 2 database riêng biệt!

Giải pháp:
  Option A: API Composition — Gọi từng service, gộp kết quả tại API Gateway
  Option B: CQRS + Read Model — Tạo read-only view DB tổng hợp từ events
```

### 7.2 CQRS — Command Query Responsibility Segregation

```
Tách biệt luồng GHI (Command) và ĐỌC (Query):

WRITE side (Commands):
  POST /bookings → BookingService → booking_db
  (Mỗi service chỉ ghi vào DB của mình)

READ side (Queries):
  Có thể dùng denormalized read model tổng hợp data từ nhiều service
  
  Khi BookingCreated event xảy ra:
    → booking-query-service nhận event
    → Cập nhật booking_view_db (chứa booking + user info + stylist info)
  
  GET /admin/bookings/details:
    → Query booking_view_db (đã có đủ data, không cần JOIN)
    
Lợi ích:
  ✅ Mỗi side có thể optimize riêng (index khác nhau)
  ✅ Read model có thể là Elasticsearch, Redis, DynamoDB
  ✅ Horizontal scale read side độc lập với write side

Nhược điểm:
  ❌ Eventual consistency giữa write và read
  ❌ Phức tạp hơn CRUD đơn giản
```

### 7.3 Event Sourcing

```
Thay vì lưu current state, lưu toàn bộ lịch sử events:

Traditional (lưu state):
  Booking: { id: 1, status: "COMPLETED", updatedAt: ... }
  → Mất lịch sử — không biết quá trình

Event Sourcing (lưu events):
  Event 1: BookingCreated    { bookingId:1, at: 10:00 }
  Event 2: BookingConfirmed  { bookingId:1, at: 10:05 }
  Event 3: PaymentSucceeded  { bookingId:1, at: 10:10 }
  Event 4: BookingCompleted  { bookingId:1, at: 14:00 }
  
  Current state = Replay tất cả events

Lợi ích:
  ✅ Audit log hoàn chỉnh
  ✅ Time travel debugging
  ✅ Event replay để rebuild read models
  ✅ Tự nhiên kết hợp với CQRS

Nhược điểm:
  ❌ Phức tạp để implement
  ❌ Query current state cần rebuild
  ❌ Event schema evolution khó
```

---

## 8. Saga Pattern — Quản lý transaction phân tán

### 8.1 Vấn đề Distributed Transaction

```
Trong Monolith — ACID Transaction đơn giản:
  BEGIN TRANSACTION
    1. Create Booking
    2. Update Stylist Schedule
    3. Create Payment Record
    4. Send Notification
  COMMIT  ← Tất cả commit hoặc tất cả rollback

Trong Microservices — Không thể ACID across services:
  Booking DB và Payment DB là 2 database riêng biệt
  → Không có distributed ACID transaction

Vấn đề:
  1. Booking Service: Create booking ✅
  2. Payment Service: Create payment ✅
  3. Notification Service: Send email ✅
  4. Stylist Service: Update schedule ❌ FAIL!
  
  → Hệ thống inconsistent: Booking tồn tại nhưng schedule chưa update
```

### 8.2 Saga Pattern — Giải pháp cho Distributed Transaction

**Choreography-based Saga (Event-driven):**

```
Mỗi service lắng nghe events và publish events tiếp theo:

1. BookingService: CreateBooking → Publish BookingCreated
2. PaymentService: Nhận BookingCreated → ProcessPayment → Publish PaymentProcessed
3. StylistService: Nhận PaymentProcessed → UpdateSchedule → Publish ScheduleUpdated
4. NotificationService: Nhận ScheduleUpdated → SendConfirmation

Nếu bước 3 fail (UpdateSchedule):
1. StylistService: Publish ScheduleUpdateFailed
2. PaymentService: Nhận ScheduleUpdateFailed → ReversePayment → Publish PaymentReversed
3. BookingService: Nhận PaymentReversed → CancelBooking → Publish BookingCancelled

┌─────────────────────────────────────────────────────────────────┐
│  Happy Path                                                      │
│                                                                  │
│  Booking → BookingCreated → Payment → PaymentProcessed          │
│                                        → Stylist → ScheduleUpdated │
│                                                    → Notification │
├─────────────────────────────────────────────────────────────────┤
│  Compensating Transactions (Rollback)                            │
│                                                                  │
│  ScheduleUpdateFailed → ReversePayment → CancelBooking          │
└─────────────────────────────────────────────────────────────────┘

Ưu điểm: Loose coupling, không cần orchestrator
Nhược điểm: Khó theo dõi flow, cyclic dependencies có thể xảy ra
```

**Orchestration-based Saga (Explicit coordinator):**

```
Một Saga Orchestrator điều phối toàn bộ:

BookingOrchestrator:
  1. Gọi BookingService.createBooking() → Success
  2. Gọi PaymentService.processPayment() → Success
  3. Gọi StylistService.updateSchedule() → FAIL!
  4. Compensation:
     Gọi PaymentService.reversePayment()
     Gọi BookingService.cancelBooking()

Dùng Spring State Machine hoặc Temporal.io

Ưu điểm: Luồng rõ ràng, dễ debug, centralized logic
Nhược điểm: Orchestrator là single point of failure, coupling cao hơn
```

---

## 9. Resilience Patterns — Chịu lỗi trong hệ thống phân tán

### 9.1 Circuit Breaker

```
Trong Monolith: Method A gọi B → B chậm → A chờ → OK

Trong Microservices: Service A gọi Service B qua mạng:
  → B bị overload, response mất 30 giây
  → A giữ thread 30 giây
  → Nhiều request → A hết thread → A cũng bị overload → Cascade failure!

Circuit Breaker giải quyết:

CLOSED (Normal):
  Request → Service B → OK
  Theo dõi failure rate

OPEN (Service B đang lỗi):
  Request → Circuit Breaker → Fail Fast (trả về error ngay, không gọi B)
  Sau timeout → chuyển sang HALF-OPEN

HALF-OPEN (Kiểm tra phục hồi):
  Cho 1 request thử → B OK → chuyển về CLOSED
                    → B fail → giữ nguyên OPEN

Spring Cloud với Resilience4j:
  @CircuitBreaker(name = "payment-service", fallbackMethod = "fallbackPayment")
  public PaymentResponse processPayment(PaymentRequest request) {
      return paymentClient.process(request);
  }

  public PaymentResponse fallbackPayment(PaymentRequest request, Exception ex) {
      // Trả về response mặc định khi payment service down
      return PaymentResponse.deferred(request.getBookingId());
  }
```

### 9.2 Retry Pattern

```
Transient failures (mạng chập chờn, timeout ngắn) — nên retry:

@Retry(name = "stylist-service", fallbackMethod = "fallback")
public StylistSchedule updateSchedule(UUID stylistId, TimeSlot slot) {
    return stylistClient.updateSchedule(stylistId, slot);
}

Cấu hình (application.yml):
resilience4j:
  retry:
    instances:
      stylist-service:
        maxAttempts: 3
        waitDuration: 1s
        enableExponentialBackoff: true
        exponentialBackoffMultiplier: 2
        # Retry: 1s, 2s, 4s → tổng 7s trước khi fail

LƯU Ý: Chỉ retry idempotent operations (GET, PUT, DELETE)
Không retry POST (có thể tạo duplicate)
```

### 9.3 Bulkhead Pattern

```
Ngăn chặn một service bị overload làm chết toàn bộ:

Không có Bulkhead:
  100 threads trong service pool
  80 request đến Stylist Service (đang chậm) → chiếm 80 threads
  Order Service, Booking Service → chỉ còn 20 threads → bị ảnh hưởng!

Có Bulkhead:
  Thread pool riêng cho từng service:
  Stylist Client: 20 threads max
  Payment Client: 20 threads max
  Order Client: 20 threads max
  
  → Stylist chậm → chỉ chiếm pool của nó, không ảnh hưởng Pool khác
```

### 9.4 Timeout Pattern

```
Mọi service call đều phải có timeout:

// Không có timeout = Thread bị giữ vô thời hạn!
paymentClient.processPayment(request);  // ← NGUY HIỂM

// Có timeout:
@TimeLimiter(name = "payment-service")  // 5 giây max
public CompletableFuture<PaymentResponse> processPayment(PaymentRequest request) {
    return CompletableFuture.supplyAsync(() -> paymentClient.process(request));
}

Quy tắc: Timeout của upstream phải < Timeout của downstream
  API Gateway timeout: 30s
  → Booking Service timeout cho Payment: 10s
  → Payment Service timeout cho Bank: 5s
```

---

## 10. Observability — Giám sát hệ thống phân tán

### 10.1 Ba trụ cột của Observability

```
Trong Monolith: 1 service, 1 log file, debug = easy

Trong Microservices: 10 services, 10 log streams, 1 request đi qua 4 services
  → Làm sao biết request nào lỗi ở đâu?
  → Observability = Khả năng hiểu trạng thái hệ thống từ output của nó

3 trụ cột:
  1. Metrics:   Số lượng, tỷ lệ, thống kê (Prometheus + Grafana)
  2. Logs:      Chi tiết events, errors (ELK Stack / Grafana Loki)
  3. Traces:    Hành trình của 1 request qua nhiều services (Jaeger / Zipkin)
```

### 10.2 Distributed Tracing

```
1 request từ client đi qua: API Gateway → Booking → Payment → Notification

Mỗi service thêm trace header:
  X-Trace-Id: abc123       ← ID chung cho toàn bộ request
  X-Span-Id: span-001      ← ID riêng cho từng hop

Jaeger/Zipkin thu thập → Visualize timeline:

abc123 ─────────────────────────────────── 350ms
  API Gateway     ████░░░░░░░░░░░░░░░░  50ms
    Booking Svc       ██████░░░░░░░░░  180ms
      Payment Svc          ████████░  100ms
    Notification Svc              ██  40ms

→ Thấy ngay Payment Service chiếm 100ms → bottleneck

Spring Boot:
  dependency: spring-cloud-starter-sleuth
  dependency: zipkin-reporter-brave
  
  Tự động inject trace/span ID vào log và propagate qua HTTP headers
```

### 10.3 Centralized Logging (ELK Stack)

```
Elasticsearch + Logstash + Kibana:

Booking Service  → stdout → Filebeat → Logstash → Elasticsearch → Kibana
Payment Service  → stdout ↗
Notification Svc → stdout ↗

Kibana query tìm lỗi:
  traceId:"abc123" AND level:"ERROR"
  → Thấy toàn bộ logs của 1 request qua tất cả services

Alternative: Grafana Loki (nhẹ hơn, dễ setup hơn)
```

### 10.4 Health Checks và Readiness/Liveness Probes

```
Kubernetes cần biết service có healthy không:

Liveness Probe: "Service còn sống không?"
  → Nếu fail → K8s restart container
  GET /actuator/health/liveness

Readiness Probe: "Service có sẵn sàng nhận traffic không?"
  → Nếu fail → K8s không route traffic đến instance này
  GET /actuator/health/readiness

Spring Boot Actuator:
  management.endpoint.health.probes.enabled=true
  → Tự động expose /liveness và /readiness
```

---

## 11. Containerization — Docker & Kubernetes

### 11.1 Docker — Đóng gói service thành container

```
Vấn đề "Works on my machine":
  Dev: Windows + Java 21 + MySQL 8 → Works
  Server: Ubuntu + Java 17 + MySQL 5.7 → Fails!

Docker giải quyết:
  Mỗi service được đóng gói kèm tất cả dependencies
  Container chạy giống hệt nhau trên mọi môi trường

Dockerfile cho BookingSalon Backend:
  # Multi-stage build (image nhỏ hơn)
  FROM eclipse-temurin:21-jdk-alpine AS build
  WORKDIR /app
  COPY pom.xml .
  COPY src ./src
  RUN mvn clean package -DskipTests

  FROM eclipse-temurin:21-jre-alpine
  WORKDIR /app
  COPY --from=build /app/target/BookingSalon-*.jar app.jar
  EXPOSE 8080
  ENTRYPOINT ["java", "-jar", "app.jar"]
```

**docker-compose.yml cho local development:**

```yaml
version: '3.8'
services:
  booking-service:
    build: ./services/booking-service
    ports: ["8082:8080"]
    environment:
      DB_HOST: booking-mysql
      KAFKA_BOOTSTRAP: kafka:9092
    depends_on: [booking-mysql, kafka]

  booking-mysql:
    image: mysql:8.0
    environment:
      MYSQL_DATABASE: booking_db
      MYSQL_PASSWORD: password
    volumes:
      - booking-mysql-data:/var/lib/mysql

  kafka:
    image: confluentinc/cp-kafka:7.6.0
    environment:
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181

volumes:
  booking-mysql-data:
```

### 11.2 Kubernetes — Orchestration cho Production

```
Kubernetes (K8s) giải quyết:
  ✅ Auto-scaling: Booking tăng traffic → tự scale thêm pod
  ✅ Self-healing: Pod crash → K8s tự restart
  ✅ Service discovery: Built-in DNS
  ✅ Load balancing: Tự động giữa các pod
  ✅ Rolling deployment: Zero-downtime deploy
  ✅ Config/Secret management

Deployment YAML cho Booking Service:
  apiVersion: apps/v1
  kind: Deployment
  metadata:
    name: booking-service
  spec:
    replicas: 3                  # 3 instances
    selector:
      matchLabels:
        app: booking-service
    template:
      spec:
        containers:
        - name: booking-service
          image: booking-service:v1.2.0
          resources:
            requests:
              memory: "256Mi"
              cpu: "100m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /actuator/health/liveness
              port: 8080
          readinessProbe:
            httpGet:
              path: /actuator/health/readiness
              port: 8080
```

---

## 12. CI/CD cho Microservices

### 12.1 Pipeline cho mỗi service

```
Git Push → GitHub Actions / GitLab CI:

1. Build:    mvn package / npm build
2. Test:     Unit tests, Integration tests
3. Scan:     Code quality (SonarQube), Dependency vulnerabilities
4. Docker:   docker build → Push to Registry (Docker Hub / ECR)
5. Deploy:   kubectl set image / Helm upgrade
6. Verify:   Health check, Smoke tests
7. Notify:   Slack/Email kết quả

Mỗi service có pipeline riêng → Deploy độc lập!
```

### 12.2 GitOps

```
Infrastructure as Code với ArgoCD / Flux:

Developer push code → Pipeline build image → Push image tag
→ Update Helm values.yaml (image tag mới)
→ ArgoCD detect thay đổi trong Git
→ Tự động sync vào K8s cluster

Git là "source of truth" cho infrastructure state
```

---

## 13. Phân tích hệ thống BookingSalon hiện tại

### 13.1 Inventory các module hiện có

Từ source code, BookingSalon hiện có **18 Controllers** và **26 Service classes**:

```
DOMAIN GROUPS (nhóm theo business domain):

┌─────────────────────────────────────────────────────────────────┐
│ 1. IDENTITY & AUTH DOMAIN                                       │
│    AuthController, UserController, AdminController (một phần)  │
│    Entities: User, Admin, BaseUser                              │
│    Services: AuthService, BffSessionService, UserService        │
│    External: Keycloak IAM                                       │
├─────────────────────────────────────────────────────────────────┤
│ 2. CATALOG DOMAIN                                               │
│    SalonController, ServiceOfferingController, CategoryController│
│    StylistController, AdminServiceController, AdminStylistController│
│    Entities: Salon, ServiceOffering, Category, Stylist, StylistService│
│    Services: SalonService, ServiceOfferingService, CategoryService│
│              AdminServiceOfferingService, AdminStylistService   │
├─────────────────────────────────────────────────────────────────┤
│ 3. BOOKING DOMAIN                                               │
│    BookingController                                            │
│    Entities: Booking, BookingDetail, ServiceSalonSuspension     │
│    Services: BookingService                                     │
├─────────────────────────────────────────────────────────────────┤
│ 4. ORDER & PRODUCT DOMAIN                                       │
│    OrderController, ProductController, AdminShopController      │
│    Entities: Order, OrderDetail, Product, ProductCategory, Cart, CartItem│
│    Services: OrderService, ProductService                       │
├─────────────────────────────────────────────────────────────────┤
│ 5. PAYMENT DOMAIN                                               │
│    PaymentController, BankWebhookController                     │
│    Entities: Payment, PaymentTransaction, BankTransferInfo      │
│    Services: PaymentApplicationService, PaymentPersistenceService│
│              PaymentWebhookService                              │
│    Strategy: BankTransferStrategy, VNPayStrategy                │
├─────────────────────────────────────────────────────────────────┤
│ 6. NOTIFICATION DOMAIN                                          │
│    NotificationController                                       │
│    Entities: Notification                                       │
│    Services: NotificationService, EmailOtpService              │
│    Handler: NotificationWebSocketHandler                        │
├─────────────────────────────────────────────────────────────────┤
│ 7. REVIEW DOMAIN                                                │
│    ReviewController                                             │
│    Entities: Review                                             │
│    Services: ReviewService                                      │
├─────────────────────────────────────────────────────────────────┤
│ 8. VOUCHER DOMAIN                                               │
│    VoucherController                                            │
│    Entities: Voucher, UserVoucher                               │
│    Services: VoucherService                                     │
├─────────────────────────────────────────────────────────────────┤
│ 9. MEDIA DOMAIN (Cross-cutting)                                 │
│    MediaController                                              │
│    Entities: Media                                              │
│    Services: MediaApplicationService                            │
│    Storage: CloudinaryStorageService                            │
└─────────────────────────────────────────────────────────────────┘
```

### 13.2 Dependency Map — Ai phụ thuộc vào ai?

```
Các service cross-domain dependencies hiện tại (phải giải quyết):

BookingService
  → NotificationService (gửi thông báo)
  → NotificationWebSocketHandler (real-time push)
  → StylistService (check availability? implicit qua DB)

OrderService
  → NotificationWebSocketHandler (real-time push)
  → VoucherService (apply voucher)

PaymentWebhookService
  → NotificationWebSocketHandler (real-time push)
  → BookingService (update booking status)
  → OrderService (update order status)

NotificationService
  → NotificationWebSocketHandler
  → BookingRepository (lấy booking để attach vào notification)
  → OrderRepository (lấy order để attach)

BankTransferStrategy
  → NotificationWebSocketHandler
  → PaymentPersistenceService

→ Kết luận: Notification và WebSocket là "glue code" kết nối nhiều domain
→ Cần tách thành Notification Service độc lập nhận events
```

### 13.3 Shared Dependencies cần xử lý

```
Hiện tại dùng chung (phải tách trong Microservices):

1. MySQL Database: 1 schema cho tất cả
   → Cần chia thành N database schemas riêng biệt

2. Redis: 1 Redis cho IdempotencyService, Session
   → Vẫn có thể dùng chung (prefix key per service)
   → Hoặc tách instance riêng cho critical services

3. Keycloak: IAM chung
   → Giữ nguyên làm centralized IAM ✅

4. Cloudinary: Lưu trữ media
   → Giữ làm shared external service ✅
   → Media Service làm abstraction layer

5. SMTP (Gmail): Gửi email
   → Centralize vào Notification Service ✅
```

---

## 14. Lộ trình chuyển đổi chi tiết từng bước

### Chiến lược: Strangler Fig Pattern

```
Không rewrite toàn bộ (quá rủi ro)
Thay vào đó: Tách từng phần ra ngoài dần dần

Monolith vẫn chạy → Từng domain được "strangled" ra ngoài
→ Monolith nhỏ dần → Cuối cùng bị thay thế hoàn toàn

                        NOW
[Monolith: tất cả]

                       PHASE 1
[Monolith: 8 domains] ← [Notification Service]

                       PHASE 2
[Monolith: 7 domains] ← [Notification Service]
                      ← [Media Service]

                       ...

                       PHASE N
[API Gateway] ← [Auth] ← [Catalog] ← [Booking] ← [Order]
              ← [Payment] ← [Notification] ← [Review] ← [Voucher]
```

---

### PHASE 1 — Foundation (1-2 tháng)

**Mục tiêu**: Chuẩn bị infrastructure, không thay đổi code business logic

#### Bước 1.1: Containerize Monolith hiện tại

```dockerfile
# backend/Dockerfile
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn clean package -DskipTests -q

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser
COPY --from=build /app/target/BookingSalon-*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-jar", "app.jar"]
```

```yaml
# docker-compose.yml cho development
version: '3.8'
services:
  backend:
    build: ./backend
    ports: ["8080:8080"]
    env_file: .env
    depends_on: [mysql, redis, keycloak]

  frontend:
    build: ./frontend
    ports: ["5173:80"]

  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: ${DB_PASSWORD}
      MYSQL_DATABASE: ${DB_NAME}
    volumes:
      - mysql-data:/var/lib/mysql

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass ${REDIS_PASSWORD}

  keycloak:
    image: quay.io/keycloak/keycloak:26.0.5
    command: start-dev
    environment:
      KC_DB: mysql
      KC_DB_URL: jdbc:mysql://mysql:3306/keycloakdb

volumes:
  mysql-data:
```

#### Bước 1.2: Cài đặt API Gateway (Spring Cloud Gateway)

Tạo project mới `api-gateway`:

```xml
<!-- pom.xml của api-gateway -->
<dependencies>
  <dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-gateway</artifactId>
  </dependency>
  <dependency>
    <groupId>org.springframework.cloud</groupId>
    <artifactId>spring-cloud-starter-circuitbreaker-reactor-resilience4j</artifactId>
  </dependency>
</dependencies>
```

```yaml
# api-gateway/src/main/resources/application.yml
spring:
  cloud:
    gateway:
      routes:
        # Trong Phase 1: Tất cả route về monolith
        - id: monolith
          uri: http://backend:8080
          predicates:
            - Path=/api/**,/ws/**
          filters:
            - name: CircuitBreaker
              args:
                name: monolithCB
                fallbackUri: forward:/fallback
```

#### Bước 1.3: Cài đặt Message Broker

```yaml
# Thêm vào docker-compose.yml
  kafka:
    image: confluentinc/cp-kafka:7.6.0
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092

  zookeeper:
    image: confluentinc/cp-zookeeper:7.6.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
```

**Hoặc dùng KRaft mode (Kafka không cần ZooKeeper — phiên bản mới):**

```yaml
  kafka:
    image: confluentinc/cp-kafka:7.6.0
    environment:
      KAFKA_NODE_ID: 1
      KAFKA_PROCESS_ROLES: broker,controller
      KAFKA_LISTENERS: PLAINTEXT://:9092,CONTROLLER://:9093
      KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9093
```

#### Bước 1.4: Thêm Event Publishing vào Monolith (không break gì)

```java
// Thêm vào pom.xml của backend (monolith)
// spring-kafka

// Tạo Event classes (sẽ dùng chung với các services sau)
@Value
public class BookingCreatedEvent {
    UUID bookingId;
    UUID userId;
    UUID stylistId;
    UUID serviceId;
    LocalDateTime scheduledAt;
    String eventType = "BOOKING_CREATED";
    Instant occurredAt = Instant.now();
}

// Publish event SONG SONG với logic hiện tại (không thay thế)
// BookingService.java — thêm vào sau khi tạo booking thành công
@Autowired
private ApplicationEventPublisher localEventPublisher;

// Hoặc trực tiếp KafkaTemplate:
@Autowired
private KafkaTemplate<String, Object> kafkaTemplate;

// Trong createBooking():
Booking savedBooking = bookingRepository.save(booking);
// ... logic hiện tại ...

// Publish event (fire-and-forget, không ảnh hưởng flow chính)
try {
    kafkaTemplate.send("booking.events",
        savedBooking.getId().toString(),
        new BookingCreatedEvent(savedBooking));
} catch (Exception e) {
    log.warn("Failed to publish BookingCreated event", e);
    // Không throw — event loss acceptable ở phase này
}
```

#### Bước 1.5: Cài đặt Observability Stack

```yaml
# docker-compose.yml — thêm observability
  prometheus:
    image: prom/prometheus:v2.50.0
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports: ["9090:9090"]

  grafana:
    image: grafana/grafana:10.3.0
    ports: ["3000:3000"]
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin

  zipkin:
    image: openzipkin/zipkin:3
    ports: ["9411:9411"]

  loki:
    image: grafana/loki:2.9.0
    ports: ["3100:3100"]
```

```xml
<!-- Thêm vào backend pom.xml -->
<dependency>
  <groupId>io.micrometer</groupId>
  <artifactId>micrometer-tracing-bridge-brave</artifactId>
</dependency>
<dependency>
  <groupId>io.zipkin.reporter2</groupId>
  <artifactId>zipkin-reporter-brave</artifactId>
</dependency>
```

---

### PHASE 2 — Tách Notification Service (2-3 tháng)

**Lý do chọn Notification trước**: Ít nghiệp vụ nhất, ít dependency nhất, dễ tách nhất. Đây là "low-hanging fruit" để học làm quen với microservices workflow.

#### Bước 2.1: Tạo project notification-service

```
bookingsalon/
├── monolith/              ← Code hiện tại
├── api-gateway/           ← Phase 1
├── notification-service/  ← Phase 2 MỚI
│   ├── src/main/java/
│   │   ├── consumer/      ← Kafka consumers
│   │   ├── service/       ← Business logic
│   │   ├── repository/    ← JPA repositories
│   │   ├── entity/        ← Notification entity
│   │   └── websocket/     ← WebSocket handler
│   └── pom.xml
└── docker-compose.yml
```

#### Bước 2.2: Move Notification code sang service mới

```java
// notification-service: Consume Kafka events thay vì direct call

@Service
@RequiredArgsConstructor
public class BookingEventConsumer {

    private final NotificationService notificationService;
    private final WebSocketHandler wsHandler;

    @KafkaListener(topics = "booking.events", groupId = "notification-service")
    public void handleBookingEvent(BookingCreatedEvent event) {
        // Logic từ NotificationService.createNotification() cũ
        Notification notification = Notification.builder()
            .userId(event.getUserId())
            .type(NotificationType.BOOKING_CREATED)
            .title("Đặt lịch thành công")
            .message("Lịch hẹn của bạn đã được xác nhận")
            .bookingId(event.getBookingId())
            .build();

        notificationService.save(notification);
        wsHandler.sendToUser(event.getUserId(), notification);
    }
}
```

#### Bước 2.3: Update Monolith — Xóa direct call, dùng event

```java
// BookingService.java trong monolith
// TRƯỚC: 
notificationService.createNotification(notification); // Direct call

// SAU:
kafkaTemplate.send("booking.events", bookingId.toString(),
    new BookingCreatedEvent(booking)); // Publish event, notification-service tự xử lý
```

#### Bước 2.4: Update API Gateway routing

```yaml
spring:
  cloud:
    gateway:
      routes:
        # Notification API → notification-service
        - id: notification-service
          uri: http://notification-service:8085
          predicates:
            - Path=/api/notifications/**

        # WebSocket → notification-service
        - id: ws-notifications
          uri: ws://notification-service:8085
          predicates:
            - Path=/ws/**

        # Everything else → monolith
        - id: monolith
          uri: http://backend:8080
          predicates:
            - Path=/api/**
```

---

### PHASE 3 — Tách Media Service (1-2 tháng)

Media Service đơn giản vì: Không có business logic phức tạp, chủ yếu là upload/delete tại Cloudinary.

```java
// media-service: Standalone service
@RestController
@RequestMapping("/api/media")
public class MediaController {
    
    @PostMapping("/upload")
    public MediaResponse upload(@RequestPart MultipartFile file,
                                @RequestParam String entityType,
                                @RequestParam UUID entityId) {
        // Cloudinary upload logic
        // Save Media entity to media_db
    }
}
```

---

### PHASE 4 — Tách Auth Service (2-3 tháng)

**Lưu ý**: Keycloak đã là external IAM. Auth Service chủ yếu là BFF wrapper.

```
auth-service:
  - /api/auth/login          → Keycloak password grant
  - /api/auth/register       → Keycloak user creation
  - /api/auth/oauth2/callback → PKCE token exchange
  - /api/auth/logout         → Keycloak session revoke
  - /api/auth/me             → User info từ session

Thực ra đây là BFF layer — có thể là một phần của API Gateway thay vì service riêng.
Dùng Spring Cloud Gateway + Security filter thay vì service riêng.
```

---

### PHASE 5 — Tách Catalog Service (2-3 tháng)

Catalog bao gồm: Salon, Stylist, ServiceOffering, Category, Product, ProductCategory

```
catalog-service:
  GET /api/salons/**         → Public, heavily cached
  GET /api/stylists/**       → Public
  GET /api/service-offerings/** → Public
  GET /api/categories/**     → Public
  GET /api/products/**       → Public
  POST/PUT/DELETE /api/*     → Admin only

catalog_db:
  salons, stylists, stylist_services, service_offerings
  categories, products, product_categories, media (reference)
  
Cache strategy:
  Redis cache với TTL ngắn (5-10 phút)
  Catalog data ít thay đổi → cache-friendly
  Cache invalidation khi admin update
```

---

### PHASE 6 — Tách Booking Service (3-4 tháng)

Booking là domain phức tạp nhất — cần giải quyết distributed transaction:

```
Khi User tạo Booking:
  1. booking-service: Validate stylist available
     → Gọi catalog-service: GET /stylists/{id}/availability (sync REST)
  
  2. booking-service: Create booking (PENDING)
  
  3. Publish BookingInitiated event

  4. payment-service (subscribe): Initiate payment record

  5. catalog-service (subscribe): Block stylist time slot (optimistic)

  6. notification-service (subscribe): Notify user + stylist

Saga Compensation nếu payment fail:
  PaymentFailed event →
    booking-service: Set status = PAYMENT_FAILED
    catalog-service: Release stylist time slot
    notification-service: Notify user payment failed

booking_db:
  bookings, booking_details, service_salon_suspensions
```

---

### PHASE 7 — Tách Order & Payment Service (3-4 tháng)

```
order-service:
  order_db: orders, order_details, carts, cart_items
  Saga với payment-service khi checkout

payment-service:
  payment_db: payments, payment_transactions, bank_transfer_info, vouchers, user_vouchers
  Handle VNPay webhook, SePay webhook
  Publish PaymentSucceeded / PaymentFailed events
```

---

### PHASE 8 — Tách Review & Voucher Service (1-2 tháng mỗi cái)

```
review-service:
  review_db: reviews
  Subscribe BookingCompleted → Enable review for that booking
  Subscribe OrderDelivered → Enable product review

voucher-service:
  voucher_db: vouchers, user_vouchers
  API để validate và apply voucher
  Rate limiting chặt (tránh voucher abuse)
```

---

### PHASE 9 — Kubernetes Deployment (1-2 tháng)

```
Kubernetes cluster setup:
  Control Plane: 1 node (hoặc managed: GKE, EKS, AKS)
  Worker Nodes: 2-3 nodes (có thể autoscale)

Helm Charts cho mỗi service:
  helm/
    api-gateway/
    booking-service/
    order-service/
    payment-service/
    notification-service/
    catalog-service/
    auth-service/

Horizontal Pod Autoscaler:
  Booking Service: min 2, max 10 pods (scale dựa trên CPU/requests)
  Notification Service: min 1, max 5 pods
  Catalog Service: min 2, max 8 pods (nhiều read traffic)
```

---

### Timeline tổng thể

```
Phase 1: Foundation          Tháng 1-2     [API Gateway, Docker, Kafka, Observability]
Phase 2: Notification Svc    Tháng 3-5     [Dễ nhất, học workflow]
Phase 3: Media Service       Tháng 4-5     [Đơn giản, standalone]
Phase 4: Auth Service        Tháng 5-7     [BFF refactor]
Phase 5: Catalog Service     Tháng 7-9     [Read-heavy, cache]
Phase 6: Booking Service     Tháng 9-12    [Phức tạp nhất, Saga]
Phase 7: Order & Payment     Tháng 12-15   [Financial domain]
Phase 8: Review & Voucher    Tháng 15-17   [Đơn giản]
Phase 9: Kubernetes          Tháng 17-19   [Infrastructure]

Tổng: ~18-20 tháng (song song với development bình thường)
```

---

## 15. Stack công nghệ đề xuất

### Backend Services

```
Ngôn ngữ & Framework:
  Java 21 + Spring Boot 3.5.x
  Spring Cloud 2024.x (Gateway, OpenFeign, Eureka hoặc K8s Discovery)

Communication:
  REST (OpenFeign client) — Sync calls
  Apache Kafka 3.6 / RabbitMQ 3.12 — Async events

Data:
  MySQL 8 — Mỗi service có schema riêng
  Redis 7 — Shared cache (prefix per service) + Session
  Elasticsearch 8 — Full-text search (catalog, products) [tương lai]

Resilience:
  Resilience4j — Circuit breaker, retry, bulkhead, rate limiter
  Spring Retry — Simple retry

Security:
  Keycloak 26 — Centralized IAM
  Spring Security OAuth2 Resource Server — JWT validation
```

### Infrastructure

```
Container:
  Docker + Docker Compose (Development)
  Kubernetes (Production)

CI/CD:
  GitHub Actions / GitLab CI
  ArgoCD (GitOps)

Observability:
  Prometheus + Grafana — Metrics & Dashboards
  Grafana Loki — Centralized logs
  Jaeger / Zipkin — Distributed tracing
  Grafana Tempo — Traces (nếu dùng Grafana stack)
  Uptime Kuma — Uptime monitoring

Registry:
  Docker Hub (Free)
  hoặc GitHub Container Registry (ghcr.io)
  hoặc AWS ECR / GCP Artifact Registry
```

### Frontend

```
React 19 + Vite — Không cần thay đổi nhiều
Chỉ cần update API_BASE_URL → API Gateway URL
WebSocket URL → Notification Service qua API Gateway
```

### Roadmap học tập song song

```
Tháng 1-2:   Docker, Docker Compose, Linux CLI, Nginx
Tháng 3-4:   Kafka/RabbitMQ, Event-Driven Architecture
Tháng 5-6:   Spring Cloud Gateway, Resilience4j, OpenFeign
Tháng 7-8:   DDD, Bounded Context, Saga Pattern, CQRS
Tháng 9-10:  Kubernetes basics (kubectl, Pods, Services, Deployments)
Tháng 11-12: Observability (Prometheus, Grafana, Distributed Tracing)
Tháng 13+:   Helm Charts, GitOps, ArgoCD, Service Mesh (Istio)
```

---

## Lời khuyên cuối cùng

```
1. ĐỪNG microservice hóa quá sớm và quá nhiều
   → "Macro-services" (3-5 services lớn) tốt hơn 20 nano-services

2. Dữ liệu là thách thức lớn nhất, không phải code
   → Thiết kế DB boundaries cẩn thận trước khi code

3. Monolith không phải kẻ thù
   → BookingSalon hiện tại hoàn toàn tốt cho quy mô < 10k user/ngày
   → Microservices khi cảm thấy "đau" với monolith

4. Thứ tự ưu tiên khi học:
   Docker → Kafka → Spring Cloud Gateway → Circuit Breaker → K8s → Service Mesh

5. Bắt đầu nhỏ
   → 1 service đầu tiên → học hết lessons → áp dụng cho service tiếp theo
   → Tốt hơn nhiều so với migrate tất cả cùng lúc
```

---

*Tài liệu tham khảo thêm: `Production_Deployment_Guide.md` (deploy cơ bản), `BookingSalon_Production_Review.md` (review kiến trúc hiện tại)* 

<!-- 
1. Fill hết ảnh lên trên Cloudinary sau đó code kéo ảnh và cấu hình thêm chức năng tải ảnh.
2. Đồng bộ dữ liệu, lấy toàn bộ dữ liệu và tạo thành 1 file .sql mới để có thể làm mới đồng thời thêm url của cloudinary.
3. Chỉnh sửa lại các chức năng nhỏ còn bị lỗi như thêm stylist từ user, cấu hình lại phần review sản phẩm, ...
4. Hoàn thiện chức năng thanh toán đơn hàng với api ngân hàng chuẩn.
 -->