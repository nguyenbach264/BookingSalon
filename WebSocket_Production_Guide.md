# WebSocket — Nền tảng lý thuyết, Phân tích dự án & Hướng dẫn Production

> **Liên quan đến**: `BookingSalon_Production_Review.md` — Mục C3 (Critical: WebSocket không có Authentication)  
> **Áp dụng cho**: Spring Boot 3.5.3 (Raw WebSocket) + React 19 (WebSocket API)  
> **Mục tiêu**: Nắm vững WebSocket từ lý thuyết đến chuẩn production

---

## MỤC LỤC

1. [Nền tảng lý thuyết WebSocket](#1-nền-tảng-lý-thuyết-websocket)
2. [WebSocket vs các công nghệ Real-time khác](#2-websocket-vs-các-công-nghệ-real-time-khác)
3. [Phân tích triển khai WebSocket trong BookingSalon](#3-phân-tích-triển-khai-websocket-trong-bookingsalon)
4. [Điểm yếu nghiêm trọng — Vấn đề Security](#4-điểm-yếu-nghiêm-trọng--vấn-đề-security)
5. [Cách sửa đổi đạt chuẩn Production](#5-cách-sửa-đổi-đạt-chuẩn-production)
6. [Vấn đề Scale — Horizontal Scaling](#6-vấn-đề-scale--horizontal-scaling)
7. [STOMP vs Raw WebSocket — Khi nào chọn gì?](#7-stomp-vs-raw-websocket--khi-nào-chọn-gì)
8. [WebSocket trong Production — Những điều phải nắm](#8-websocket-trong-production--những-điều-phải-nắm)
9. [Monitoring & Observability cho WebSocket](#9-monitoring--observability-cho-websocket)
10. [Checklist Production WebSocket](#10-checklist-production-websocket)

---

## 1. Nền tảng lý thuyết WebSocket

### 1.1 HTTP và bài toán Real-time

Trước khi WebSocket ra đời, lập trình viên dùng các cách "giả lập" real-time trên HTTP:

```
Polling (Thăm dò định kỳ):
  Client  ──[GET /notifications]──► Server   (mỗi 3 giây)
  Client  ◄──[200 OK, data: []]──  Server   (không có gì mới)
  Client  ──[GET /notifications]──► Server   (3 giây sau)
  Client  ◄──[200 OK, data: []]──  Server   (vẫn không có gì)
  ...

  Nhược điểm: Tốn bandwidth, tạo load server vô ích, độ trễ = interval time

Long Polling:
  Client  ──[GET /notifications]──► Server   (giữ kết nối chờ)
  Server giữ kết nối mở... (30s, 60s...)
  Server  ◄──[200 OK, data: [...]]─ Server   (khi có dữ liệu)
  Client kết nối lại ngay lập tức
  
  Nhược điểm: Server phải giữ thread cho mỗi client, khó scale

SSE (Server-Sent Events):
  Client  ──[GET /events]──►       Server   (một lần)
  Server  ──────[stream]──────►    Client   (server push liên tục)
  
  Chỉ one-way (server → client), client không thể gửi
```

### 1.2 WebSocket ra đời — Full-duplex trên một kết nối duy nhất

```
Bước 1: HTTP Upgrade Handshake
  Client ──[HTTP GET, Upgrade: websocket]──► Server
  Server ◄──[HTTP 101 Switching Protocols]─  Server
  
Bước 2: WebSocket Frame Protocol (sau khi upgrade)  
  Client ◄──────────────────────────────────► Server
          (kết nối TCP duy nhất, hai chiều)
  
  Client có thể gửi bất cứ lúc nào
  Server có thể push bất cứ lúc nào
  Không cần request-response cycle
```

**WebSocket Header trong HTTP Upgrade Request:**

```http
GET /ws/notifications?userId=abc HTTP/1.1
Host: localhost:8080
Connection: Upgrade
Upgrade: websocket
Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==
Sec-WebSocket-Version: 13
Origin: http://localhost:5173
```

**Server Response (101 Switching Protocols):**

```http
HTTP/1.1 101 Switching Protocols
Upgrade: websocket
Connection: Upgrade
Sec-WebSocket-Accept: s3pPLMBiTxaQ9kYGzzhZRbK+xOo=
```

### 1.3 WebSocket Frame Structure (Định dạng gói tin)

```
 0                   1                   2                   3
 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
+-+-+-+-+-------+-+-------------+-------------------------------+
|F|R|R|R| opcode|M| Payload len |    Extended payload length    |
|I|S|S|S|  (4)  |A|     (7)    |             (16/64)           |
|N|V|V|V|       |S|             |   (if payload len==126/127)   |
| |1|2|3|       |K|             |                               |
+-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - -+
|     Extended payload length continued, if payload len == 127  |
+ - - - - - - - - - - - - - - -+-------------------------------+
|                               |Masking-key, if MASK set to 1  |
+-------------------------------+-------------------------------+
| Masking-key (continued)       |          Payload Data         |
+-------------------------------- - - - - - - - - - - - - - - -+
:                     Payload Data continued ...                :
+ - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
|                     Payload Data continued ...                |
+---------------------------------------------------------------+

Opcodes quan trọng:
  0x1 = Text frame     (UTF-8 text, dùng cho JSON)
  0x2 = Binary frame   (binary data)
  0x8 = Connection Close
  0x9 = Ping           (heartbeat check)
  0xA = Pong           (response to ping)
```

**Điểm quan trọng**: Client → Server phải mask dữ liệu (MASK=1). Server → Client không cần mask.

### 1.4 Close Codes — Ý nghĩa khi kết nối đóng

| Code | Ý nghĩa | Hành động client |
|------|---------|-----------------|
| 1000 | Normal Closure (đóng bình thường) | Không reconnect |
| 1001 | Going Away (server shutdown / navigate) | Có thể reconnect |
| 1006 | Abnormal Closure (mạng bị ngắt) | Nên reconnect |
| 1008 | Policy Violation (auth fail, ban...) | **Không reconnect** |
| 1011 | Server Error | Reconnect sau delay |
| 4000-4999 | Application-defined codes | Tùy logic ứng dụng |

---

## 2. WebSocket vs các công nghệ Real-time khác

### So sánh toàn diện

| Tiêu chí | Polling | SSE | WebSocket | WebRTC |
|---------|---------|-----|-----------|--------|
| **Hướng dữ liệu** | Client pull | Server push | Hai chiều | Peer-to-peer |
| **Protocol** | HTTP | HTTP | TCP (after upgrade) | UDP/RTP |
| **Overhead** | Cao (HTTP header mỗi request) | Thấp | Rất thấp (frame header nhỏ) | Rất thấp |
| **Độ trễ** | = interval | ~50-100ms | ~10-50ms | <50ms |
| **Complexity** | Thấp | Thấp | Trung bình | Cao |
| **Reconnect tự động** | Có (retry request) | Tự động (EventSource API) | Phải tự implement | Phức tạp |
| **Browser support** | 100% | 98% | 98% | 95% |
| **Proxy/Firewall** | Tốt | Tốt | Đôi khi bị block | Khó khăn |
| **Scale** | Dễ (stateless) | Vừa | Khó (stateful) | Phức tạp |
| **Use case** | Background sync | Dashboard, Feed | Chat, Gaming, Notification | Video call, Screen share |

### Khi nào dùng WebSocket?

```
Phù hợp (dùng WebSocket):
  ✓ Thông báo real-time cần độ trễ thấp (< 100ms)
  ✓ Chat, messaging
  ✓ Collaborative editing (Google Docs-style)
  ✓ Live dashboard với nhiều update/giây
  ✓ Gaming, live scoring
  ✓ Cần client → server communication thường xuyên

Không cần WebSocket (dùng SSE hoặc Polling):
  ✗ Chỉ cần server push đơn giản, client không cần gửi
  ✗ Update frequency thấp (mỗi 30-60 giây)
  ✗ Cần proxy/CDN cache-friendly
  ✗ Cần SEO-friendly streaming content
```

---

## 3. Phân tích triển khai WebSocket trong BookingSalon

### 3.1 Tổng quan kiến trúc WebSocket hiện tại

```
Backend (Spring Boot):
  WebSocketConfig.java               → Đăng ký handler cho endpoints
  NotificationWebSocketHandler.java  → Handler xử lý kết nối, message, disconnect

Frontend (React):
  notificationWebSocket.js           → Client singleton cho /ws/notifications
  reviewWebSocket.js                 → Client cho /ws/reviews (đơn giản hơn)
  NotificationContext.jsx            → React Context tích hợp WS + API
  hooks/useNotificationWebSocket.js  → Hook tiêu dùng context
```

### 3.2 Các endpoints WebSocket

```
ws://localhost:8080/ws/notifications   → Thông báo cho User VÀ Stylist
ws://localhost:8080/ws/reviews         → Thông báo review mới (Real-time review stream)
```

**Nhận xét**: Hai endpoint nhưng chỉ 1 handler (`NotificationWebSocketHandler`). Đây là pattern ổn — 1 handler có thể serve nhiều path.

### 3.3 Bản đồ sử dụng WebSocket trong dự án

Có **13 call site** gọi WebSocket handler trực tiếp trong backend:

```
BookingService.java (3 chỗ):
  ├─ Dòng 310: sendToStylist()  → Khi booking được tạo, notify stylist có lịch mới
  ├─ Dòng 364: sendToStylist()  → Khi booking bị cancel, notify stylist
  └─ Dòng 392: sendToStylist()  → Khi booking status thay đổi

NotificationService.java (1 chỗ):
  └─ Dòng  81: sendToUser()    → Khi notification mới được tạo (entry point chính)

OrderService.java (2 chỗ):
  ├─ Dòng 210: broadcast()     → Khi order status thay đổi (broadcast tất cả admin)
  └─ Dòng 296: sendToUser()    → Khi order được xác nhận, notify user

PaymentWebhookService.java (2 chỗ):
  ├─ Dòng 157: sendToUser()    → Khi thanh toán VNPay thành công
  └─ Dòng 174: sendToUser()    → Khi thanh toán VNPay thất bại

BankTransferStrategy.java (2 chỗ):
  ├─ Dòng 172: sendToUser()    → Khi SePay webhook confirm chuyển khoản
  └─ Dòng 178: broadcast()     → Khi có giao dịch chuyển khoản mới

AdminShopController.java (3 chỗ):
  ├─ Dòng 262: sendToUser()    → Khi admin cập nhật order status → SHIPPED
  ├─ Dòng 268: sendToUser()    → Khi admin cập nhật → DELIVERED
  └─ Dòng 289: sendToUser()    → Khi admin hủy order
```

### 3.4 Luồng sự kiện đầy đủ (Happy Path — Booking)

```
User đặt lịch
  │
  ├─► POST /api/bookings
  │       │
  │       ├─► BookingService.createBooking()
  │       │       ├─► Save Booking to MySQL
  │       │       ├─► NotificationService.createNotification()
  │       │       │       ├─► Save Notification to MySQL
  │       │       │       └─► sendToUser(userId, notificationDTO)
  │       │       │               └─► WebSocket push → User Browser
  │       │       │                   Toast: "Đặt lịch thành công! ✅"
  │       │       └─► sendToStylist(stylistId, wsPayload)
  │       │               └─► WebSocket push → Stylist Dashboard
  │       │                   Badge cập nhật, danh sách lịch hẹn refresh
  │       └─► Return 201 Created
  │
  └─ Kết quả: < 50ms user nhận được thông báo real-time
```

### 3.5 Điểm mạnh của implementation hiện tại

**1. Pattern Singleton WebSocket Client (Frontend)**

```javascript
// notificationWebSocket.js — Export singleton instance
const notificationWs = new NotificationWebSocket();
export default notificationWs;
```

Đây là thiết kế đúng. Một ứng dụng chỉ cần 1 kết nối WebSocket với mỗi endpoint. Nếu tạo nhiều instance → nhiều kết nối → tốn tài nguyên server.

**2. Heartbeat Ping/Pong (25 giây)**

```javascript
// Client gửi PING mỗi 25 giây
this.pingTimer = setInterval(() => {
  if (this.socket && this.socket.readyState === WebSocket.OPEN) {
    this.socket.send(JSON.stringify({ type: "PING" }));
  }
}, 25000);
```

```java
// Server trả lời PONG ngay lập tức
} else if ("PING".equalsIgnoreCase(type)) {
    session.sendMessage(new TextMessage("{\"type\":\"PONG\"}"));
}
```

Tại sao cần heartbeat? NAT (Network Address Translation) và các proxy trung gian thường **đóng kết nối TCP không hoạt động** sau 30-60 giây. Heartbeat 25 giây đảm bảo kết nối luôn có traffic → không bị NAT prune.

**3. Auto-reconnect với exponential backoff**

```javascript
// Reconnect sau 4 giây nếu không phải close code 1000 (normal)
if (event.code !== 1000 && (this.options.userId || this.options.stylistId)) {
  this.reconnectTimer = setTimeout(() => this.connect(), 4000);
}
```

**4. Thread-safe Session Registry**

```java
// ConcurrentHashMap + CopyOnWriteArraySet — Thread-safe cho concurrent access
private final Map<UUID, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
private final Map<UUID, Set<WebSocketSession>> stylistSessions = new ConcurrentHashMap<>();
```

**5. Observer Pattern với Listener Set (Frontend)**

```javascript
// Subscriber pattern — nhiều component có thể lắng nghe cùng lúc
subscribe(callback) {
  this.listeners.add(callback);
  return () => { this.listeners.delete(callback); }; // Unsubscribe pattern
}
```

**6. Cleanup khi component unmount**

```javascript
// NotificationContext.jsx — cleanup đúng cách
return () => {
  unsubscribe();           // Bỏ listener
  notificationWs.disconnect(); // Đóng kết nối
};
```

---

## 4. Điểm yếu nghiêm trọng — Vấn đề Security

### 4.1 CRITICAL: Không có Authentication khi kết nối

**Code hiện tại (`WebSocketConfig.java`):**

```java
@Override
public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
    registry.addHandler(
            notificationWebSocketHandler,
            "/ws/reviews",
            "/ws/notifications"
    ).setAllowedOriginPatterns("*");  // ← Wildcard: mọi origin đều được
}
```

**Code hiện tại (`NotificationWebSocketHandler.java`):**

```java
@Override
public void afterConnectionEstablished(WebSocketSession session) {
    allSessions.add(session);
    URI uri = session.getUri();
    if (uri != null && uri.getQuery() != null) {
        Map<String, String> queryParams = parseQueryParams(uri.getQuery());

        if (queryParams.containsKey("userId")) {
            // ← Tin tưởng hoàn toàn vào userId do CLIENT tự truyền vào URL
            UUID userId = UUID.fromString(queryParams.get("userId"));
            userSessions.computeIfAbsent(userId, k -> new CopyOnWriteArraySet<>()).add(session);
        }
    }
}
```

**Lỗ hổng nghiêm trọng:**

```
Kịch bản tấn công 1 — Session Hijacking:
  Attacker biết UUID của User A (UUID không phải secret - có thể leak qua nhiều kênh)
  Attacker kết nối: ws://yourserver.com/ws/notifications?userId=<UUID-của-User-A>
  Server chấp nhận vô điều kiện
  Attacker nhận được TOÀN BỘ thông báo của User A:
    ✗ Thông tin booking (ngày giờ, stylist, salon)
    ✗ Thông tin payment (đã thanh toán bao nhiêu)
    ✗ Thông tin order (địa chỉ giao hàng)
    ✗ Các thông báo cá nhân khác

Kịch bản tấn công 2 — Resource Exhaustion (DoS):
  Bot tạo 10,000 WebSocket connections đến /ws/notifications
  Không có auth → Server chấp nhận tất cả
  Mỗi connection giữ 1 TCP socket + memory trong JVM
  Server bị OOM (Out of Memory) hoặc Thread starvation

Kịch bản tấn công 3 — Information Gathering:
  Attacker kết nối broadcast channel /ws/notifications
  Lắng nghe broadcast() call (OrderService.java:210)
  Thu thập thông tin về đơn hàng, thống kê hệ thống

Kịch bản tấn công 4 — UUID Enumeration:
  Script tự động thử hàng loạt UUID
  ws://server/ws/notifications?userId=00000000-0000-0000-0000-000000000001
  ws://server/ws/notifications?userId=00000000-0000-0000-0000-000000000002
  ...
  Khi có notification được push → UUID đó tồn tại trong hệ thống
```

### 4.2 HIGH: Origin Wildcard

```java
.setAllowedOriginPatterns("*")  // ← Cho phép mọi domain kết nối
```

Điều này nghĩa là `http://malicious-site.com` cũng có thể khởi tạo WebSocket đến server của bạn. Kết hợp với thiếu auth → nguy hiểm kép.

### 4.3 MEDIUM: reviewWebSocket.js thiếu hoàn toàn mọi cơ chế bảo vệ

```javascript
// reviewWebSocket.js — Không có:
// 1. Authentication header/token
// 2. Reconnect logic
// 3. Heartbeat
// 4. Error handling chi tiết
// 5. Connection state management

class ReviewWebSocket {
  connect(url, onMessage, onError, onClose) {
    this.socket = new WebSocket(url);  // ← url truyền thẳng từ ngoài vào
    // ...
  }
}
```

### 4.4 MEDIUM: hardcode localhost URL trong production code

```javascript
// notificationWebSocket.js dòng 24
const wsUrl = `ws://localhost:8080/ws/notifications?${queryParts.join("&")}`;
//              ↑ Hardcode localhost — chạy trên production sẽ kết nối về localhost của server, không phải backend thật
```

---

## 5. Cách sửa đổi đạt chuẩn Production

### 5.1 Backend — Implement WebSocket Handshake Interceptor

**Bước 1: Tạo `WebSocketAuthInterceptor.java`**

```java
package demo.bookingsalon.Configuration;

import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Slf4j
@RequiredArgsConstructor
public class WebSocketAuthInterceptor implements HandshakeInterceptor {

    private final JwtDecoder jwtDecoder;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) throws Exception {

        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            log.warn("WS Handshake rejected: not a servlet request");
            return false;
        }

        // Cách 1: Lấy token từ BFF HttpSession (phù hợp với kiến trúc hiện tại)
        HttpSession session = servletRequest.getServletRequest().getSession(false);
        if (session != null) {
            String accessToken = (String) session.getAttribute("access_token");
            if (accessToken != null) {
                try {
                    Jwt jwt = jwtDecoder.decode(accessToken);
                    String subject = jwt.getSubject(); // Keycloak sub (keycloak_id)
                    attributes.put("keycloak_id", subject);
                    attributes.put("jwt", jwt);
                    log.info("WS Handshake authorized for subject: {}", subject);
                    return true;
                } catch (Exception e) {
                    log.warn("WS Handshake rejected: invalid token - {}", e.getMessage());
                    return false;
                }
            }
        }

        // Cách 2: Lấy token từ Authorization header (cho Postman/testing)
        String authHeader = servletRequest.getServletRequest().getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            try {
                String token = authHeader.substring(7);
                Jwt jwt = jwtDecoder.decode(token);
                attributes.put("keycloak_id", jwt.getSubject());
                attributes.put("jwt", jwt);
                return true;
            } catch (Exception e) {
                log.warn("WS Handshake rejected: invalid Bearer token");
                return false;
            }
        }

        log.warn("WS Handshake rejected: no valid authentication found");
        return false; // Từ chối kết nối nếu không có auth
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
            WebSocketHandler wsHandler, Exception exception) {
        // Log sau handshake nếu cần
    }
}
```

**Bước 2: Cập nhật `WebSocketConfig.java`**

```java
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final JwtDecoder jwtDecoder;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(
                notificationWebSocketHandler,
                "/ws/reviews",
                "/ws/notifications"
        )
        // Thay wildcard bằng origin cụ thể
        .setAllowedOrigins(
            "http://localhost:5173",
            "https://yourdomain.com",
            "${app.cors.allowed-origins}" // Đọc từ config
        )
        // Thêm interceptor xác thực
        .addInterceptors(new WebSocketAuthInterceptor(jwtDecoder));
    }
}
```

**Bước 3: Cập nhật `NotificationWebSocketHandler.java` — Xác thực userId từ JWT, không tin client**

```java
@Override
public void afterConnectionEstablished(WebSocketSession session) throws Exception {
    // Lấy thông tin đã xác thực từ Interceptor (không tin query param nữa)
    String keycloakId = (String) session.getAttributes().get("keycloak_id");

    if (keycloakId == null) {
        // Interceptor đã fail nhưng vẫn vào đây → đóng kết nối
        log.warn("WS: Unauthenticated connection attempt, closing session {}", session.getId());
        session.close(CloseStatus.NOT_ACCEPTABLE.withReason("Authentication required"));
        return;
    }

    allSessions.add(session);
    log.info("WS: Authenticated connection for keycloak_id={}, session={}", keycloakId, session.getId());

    // Tra cứu UUID nội bộ từ DB dựa trên keycloakId (an toàn hơn dùng query param)
    // (Inject UserRepository hoặc dùng UserService)
    URI uri = session.getUri();
    if (uri != null && uri.getQuery() != null) {
        Map<String, String> queryParams = parseQueryParams(uri.getQuery());

        if (queryParams.containsKey("userId")) {
            UUID claimedUserId = UUID.fromString(queryParams.get("userId"));
            // QUAN TRỌNG: Verify rằng userId trong query param thuộc về keycloakId đã auth
            // Nếu không verify, attacker có thể truyền userId của người khác
            if (isUserOwner(keycloakId, claimedUserId)) {
                userSessions.computeIfAbsent(claimedUserId, k -> new CopyOnWriteArraySet<>()).add(session);
                session.getAttributes().put("userId", claimedUserId);
            } else {
                log.warn("WS: userId {} does not match keycloak_id {}", claimedUserId, keycloakId);
                session.close(new CloseStatus(1008, "Identity mismatch"));
            }
        }

        if (queryParams.containsKey("stylistId")) {
            UUID claimedStylistId = UUID.fromString(queryParams.get("stylistId"));
            if (isStylistOwner(keycloakId, claimedStylistId)) {
                stylistSessions.computeIfAbsent(claimedStylistId, k -> new CopyOnWriteArraySet<>()).add(session);
                session.getAttributes().put("stylistId", claimedStylistId);
            } else {
                log.warn("WS: stylistId {} does not match keycloak_id {}", claimedStylistId, keycloakId);
                session.close(new CloseStatus(1008, "Identity mismatch"));
            }
        }
    }
}
```

### 5.2 Frontend — Fix hardcode URL và thêm auth token

```javascript
// notificationWebSocket.js — PHIÊN BẢN SỬA ĐỔI

import { getConfig } from "../../config/api";

class NotificationWebSocket {
  socket = null;
  listeners = new Set();
  reconnectTimer = null;
  pingTimer = null;
  isConnected = false;
  reconnectDelay = 1000;     // Bắt đầu 1 giây
  maxReconnectDelay = 30000; // Tối đa 30 giây
  options = { userId: null, stylistId: null };

  connect(params = {}) {
    if (params.userId) this.options.userId = params.userId;
    if (params.stylistId) this.options.stylistId = params.stylistId;

    if (!this.options.userId && !this.options.stylistId) return;

    if (this.socket && (
      this.socket.readyState === WebSocket.OPEN ||
      this.socket.readyState === WebSocket.CONNECTING
    )) return;

    const queryParts = [];
    if (this.options.userId) queryParts.push(`userId=${encodeURIComponent(this.options.userId)}`);
    if (this.options.stylistId) queryParts.push(`stylistId=${encodeURIComponent(this.options.stylistId)}`);

    // Đọc từ config, không hardcode
    const wsBaseUrl = getConfig().WS_BASE_URL || "ws://localhost:8080";
    const wsUrl = `${wsBaseUrl}/ws/notifications?${queryParts.join("&")}`;

    try {
      // WebSocket API không hỗ trợ custom headers trực tiếp
      // Auth được xử lý qua session cookie (BFF pattern) hoặc subprotocol
      this.socket = new WebSocket(wsUrl);
      // Nếu cần gửi token, dùng subprotocol:
      // this.socket = new WebSocket(wsUrl, ["v1", `bearer.${token}`]);
      // Và parse lại ở server trong interceptor

      this.socket.onopen = () => {
        this.isConnected = true;
        this.reconnectDelay = 1000; // Reset delay khi kết nối thành công
        console.log("🟢 Notification WebSocket connected");
        this.startHeartbeat();
      };

      // ... rest of handlers

      this.socket.onclose = (event) => {
        this.isConnected = false;
        this.stopHeartbeat();

        // Close code 1008 = Policy Violation (auth fail) → KHÔNG reconnect
        if (event.code === 1008) {
          console.error("WS closed due to auth failure, not reconnecting");
          return;
        }

        // Exponential backoff reconnect
        if (event.code !== 1000 && (this.options.userId || this.options.stylistId)) {
          clearTimeout(this.reconnectTimer);
          const delay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
          this.reconnectDelay = delay;
          console.log(`🔄 Reconnecting in ${delay}ms...`);
          this.reconnectTimer = setTimeout(() => this.connect(), delay);
        }
      };
    } catch (err) {
      console.warn("Cannot instantiate WebSocket:", err);
    }
  }

  // ... rest của class
}
```

### 5.3 Cấu hình environment-aware URL

```javascript
// src/config/api.js
const configs = {
  development: {
    API_BASE_URL: "http://localhost:8080",
    WS_BASE_URL: "ws://localhost:8080",
  },
  production: {
    API_BASE_URL: import.meta.env.VITE_API_URL,
    WS_BASE_URL: import.meta.env.VITE_WS_URL,  // wss://yourserver.com
  },
};

export const getConfig = () =>
  configs[import.meta.env.MODE] || configs.development;
```

```
# .env.production
VITE_API_URL=https://api.bachbarber.vn
VITE_WS_URL=wss://api.bachbarber.vn   # Lưu ý: wss:// cho HTTPS (TLS encrypted)
```

---

## 6. Vấn đề Scale — Horizontal Scaling

### 6.1 Vấn đề với ConcurrentHashMap in-memory

Hệ thống hiện tại lưu WebSocket sessions trong memory JVM:

```java
// NotificationWebSocketHandler.java
private final Map<UUID, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
```

Khi bạn chạy **nhiều instance** (horizontal scaling):

```
Load Balancer
    ├─► Instance A  (userSessions: {userId_1: session_A1})
    ├─► Instance B  (userSessions: {userId_2: session_B1})
    └─► Instance C  (userSessions: {})

Tình huống:
  User 1 kết nối WebSocket → Load Balancer → Instance A ✓
  User 1 tạo booking → HTTP request → Load Balancer → Instance B (!)
  Instance B gọi notificationWebSocketHandler.sendToUser(userId_1)
  Instance B tìm trong userSessions của NÓ → Không thấy userId_1
  → Notification THẤT LẠC, User 1 không nhận được gì
```

### 6.2 Giải pháp 1: Redis Pub/Sub (Ít thay đổi nhất)

```java
// Khi cần gửi notification → publish lên Redis channel
public void sendToUser(UUID userId, Object payload) {
    String json = toJson(payload);

    // 1. Gửi đến local sessions (nếu user kết nối vào instance này)
    forwardToLocalSession(userId, json);

    // 2. Publish lên Redis để các instance khác cũng nhận
    redisTemplate.convertAndSend("ws:notify:user:" + userId, json);
}

// Mỗi instance subscribe Redis channel và forward đến local WS session
@Bean
public RedisMessageListenerContainer redisListenerContainer(
        RedisConnectionFactory factory,
        NotificationWebSocketHandler handler) {

    RedisMessageListenerContainer container = new RedisMessageListenerContainer();
    container.setConnectionFactory(factory);

    // Subscribe pattern: tất cả user channels
    container.addMessageListener(
        (message, pattern) -> {
            String channel = new String(message.getChannel());
            String userId = channel.replace("ws:notify:user:", "");
            String body = new String(message.getBody());
            handler.forwardToLocalSessionById(UUID.fromString(userId), body);
        },
        new PatternTopic("ws:notify:user:*")
    );

    return container;
}
```

**Trade-off của Redis Pub/Sub:**

```
✓ Ít thay đổi code nhất
✓ Redis đã có sẵn trong dự án (dùng cho IdempotencyService)
✓ Hiệu suất tốt (Redis < 1ms latency)
✗ Mỗi message được forward đến TẤT CẢ instances (dù user chỉ kết nối 1 instance)
✗ Nếu Redis fail → WebSocket notification fail
```

### 6.3 Giải pháp 2: STOMP + Message Broker (Kiến trúc chuẩn hơn)

```java
@Configuration
@EnableWebSocketMessageBroker
public class StompWebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Dùng Redis/RabbitMQ làm relay broker
        config.enableStompBrokerRelay("/topic", "/queue")
            .setRelayHost("localhost")
            .setRelayPort(61613)  // STOMP port của RabbitMQ/ActiveMQ
            .setClientLogin("guest")
            .setClientPasscode("guest");

        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");  // /user/{username}/queue/...
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();  // Fallback khi WebSocket bị block
    }
}

// Gửi thông báo đến specific user (tự động route qua broker đến đúng instance)
@Autowired
private SimpMessagingTemplate messagingTemplate;

public void sendToUser(String username, Object payload) {
    messagingTemplate.convertAndSendToUser(username, "/queue/notifications", payload);
    // STOMP broker tự động forward đến instance đang giữ session của username
}
```

### 6.4 Giải pháp 3: Sticky Sessions (Đơn giản nhất)

Cấu hình Load Balancer để **cùng user luôn đến cùng instance**:

```nginx
# nginx.conf — IP hash sticky session
upstream backend {
    ip_hash;  # Cùng IP → cùng server
    server backend1:8080;
    server backend2:8080;
    server backend3:8080;
}
```

**Hoặc cookie-based sticky session:**

```nginx
upstream backend {
    server backend1:8080;
    server backend2:8080;
    sticky cookie srv_id expires=1h;
}
```

**Trade-off:**

```
✓ Không cần thay đổi code
✗ Không thực sự "stateless" horizontal scaling
✗ Nếu instance A crash → tất cả user đang kết nối mất session
✗ Load không được phân phối đều nếu 1 user có nhiều request
```

---

## 7. STOMP vs Raw WebSocket — Khi nào chọn gì?

### So sánh chi tiết

| Tiêu chí | Raw WebSocket | STOMP over WebSocket |
|---------|--------------|---------------------|
| **Protocol** | Thuần TCP frames | Subprotocol trên WebSocket |
| **Message routing** | Tự implement | Built-in topic/queue routing |
| **Authentication** | Tự implement | Interceptors + Spring Security |
| **Pub/Sub pattern** | Tự implement | `@MessageMapping`, `@SubscribeMapping` |
| **Error handling** | Tự implement | Spring exception handlers |
| **Client libraries** | WebSocket API thuần | stomp.js, @stomp/stompjs |
| **Message format** | Tự do (JSON, binary...) | STOMP frame format |
| **Testing** | Khó | Dễ hơn (Spring Test support) |
| **Horizontal scale** | Khó (in-memory) | Tốt (External broker) |
| **Code complexity** | Thấp ban đầu, tăng nhanh | Cao ban đầu, ổn định |
| **Spring support** | Cơ bản | Đầy đủ |

### Khi nào chọn Raw WebSocket?

```
✓ Use case đơn giản, ít concurrent users (< 100)
✓ Không cần horizontal scaling
✓ Team nhỏ, muốn kiểm soát tuyệt đối protocol
✓ Bandwidth sensitive (STOMP có overhead header lớn hơn)
✓ Custom binary protocol
```

### Khi nào chọn STOMP?

```
✓ Enterprise application với nhiều loại message
✓ Cần horizontal scaling với external message broker
✓ Muốn dùng @MessageMapping, @SendToUser annotations
✓ Cần SockJS fallback (cho môi trường block WebSocket)
✓ Team quen với message queue pattern (RabbitMQ, Kafka...)
```

**Khuyến nghị cho BookingSalon**: Với quy mô hiện tại (1-10 chi nhánh, < 500 concurrent users), **Raw WebSocket với Redis Pub/Sub** là đủ và hợp lý. STOMP chỉ cần khi scale lớn hơn.

---

## 8. WebSocket trong Production — Những điều phải nắm

### 8.1 TLS/WSS — Bắt buộc trong Production

```
ws://  → Dữ liệu truyền plain text, dễ bị man-in-the-middle
wss:// → Dữ liệu được mã hóa TLS, giống HTTPS
```

**Cấu hình Nginx làm WebSocket reverse proxy:**

```nginx
server {
    listen 443 ssl;
    server_name api.bachbarber.vn;

    ssl_certificate     /etc/ssl/certs/bachbarber.crt;
    ssl_certificate_key /etc/ssl/private/bachbarber.key;

    location /ws/ {
        proxy_pass http://backend:8080;

        # Headers bắt buộc để proxy WebSocket
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeout cho WebSocket (mặc định proxy_read_timeout=60s là quá ngắn)
        proxy_read_timeout 3600s;   # 1 giờ
        proxy_send_timeout 3600s;
        proxy_connect_timeout 10s;
    }
}
```

**Frontend đổi từ ws:// sang wss:// trong production:**

```javascript
// Tự động detect protocol
const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
const wsUrl = `${protocol}//${window.location.host}/ws/notifications`;
```

### 8.2 Connection Limits & Resource Management

Mỗi WebSocket connection tiêu tốn tài nguyên:
- 1 TCP socket file descriptor
- ~4-8KB memory cho Spring `WebSocketSession`
- JVM object overhead cho handler state

**Giới hạn OS file descriptors:**

```bash
# Xem giới hạn hiện tại
ulimit -n
# Thường là 1024 mặc định — KHÔNG đủ cho production

# Tăng giới hạn (Linux)
ulimit -n 65536

# Hoặc vĩnh viễn trong /etc/security/limits.conf
* soft nofile 65536
* hard nofile 65536
```

**Cấu hình JVM cho nhiều connections:**

```bash
# JVM args khi start Spring Boot
-Xmx2g                    # Heap tối đa 2GB
-Xms512m                  # Heap ban đầu
-Djava.net.preferIPv4Stack=true
```

**Giới hạn connections per IP để chống DoS:**

```nginx
# nginx.conf — Rate limit WebSocket connections
limit_conn_zone $binary_remote_addr zone=ws_conn:10m;

location /ws/ {
    limit_conn ws_conn 10;  # Tối đa 10 WS connections từ 1 IP
    # ...
}
```

### 8.3 Message Size Limits

```java
// application.properties — Giới hạn kích thước message
spring.websocket.message.buffer-size=65536  # 64KB per message
spring.websocket.message.text-message-size-limit=65536
spring.websocket.message.binary-message-size-limit=65536

// Hoặc trong Config:
@Override
public void configureWebSocketTransport(WebSocketTransportRegistration registry) {
    registry.setMessageSizeLimit(64 * 1024);     // 64KB
    registry.setSendBufferSizeLimit(512 * 1024); // 512KB send buffer
    registry.setSendTimeLimit(20000);             // 20 giây timeout
}
```

### 8.4 Graceful Shutdown

Khi deploy phiên bản mới, server cần đóng WebSocket kết nối có kiểm soát:

```java
@Component
@RequiredArgsConstructor
public class WebSocketShutdownHook implements ApplicationListener<ContextClosedEvent> {

    private final NotificationWebSocketHandler notificationWebSocketHandler;

    @Override
    public void onApplicationEvent(ContextClosedEvent event) {
        log.info("Application shutting down — closing all WebSocket connections gracefully");
        notificationWebSocketHandler.closeAllSessions(
            new CloseStatus(1001, "Server restarting, please reconnect")
        );
    }
}

// Trong NotificationWebSocketHandler thêm method:
public void closeAllSessions(CloseStatus status) {
    allSessions.forEach(session -> {
        try {
            if (session.isOpen()) {
                session.close(status);
            }
        } catch (IOException e) {
            log.warn("Could not close session {}: {}", session.getId(), e.getMessage());
        }
    });
    allSessions.clear();
    userSessions.clear();
    stylistSessions.clear();
}
```

**Frontend — Handle server restart gracefully:**

```javascript
this.socket.onclose = (event) => {
    if (event.code === 1001) {
        // Server đang restart → reconnect sau delay dài hơn
        console.log("Server restarting, will reconnect in 10s");
        setTimeout(() => this.connect(), 10000);
    } else if (event.code === 1008) {
        // Auth fail → không reconnect, redirect login
        console.error("Session expired");
        window.location.href = "/login";
    }
    // ...
};
```

### 8.5 Message Queue cho Offline Users

**Vấn đề**: User offline → có booking mới → WebSocket push thất bại → User không bao giờ biết.

**Giải pháp hiện tại của dự án**: Lưu `Notification` vào MySQL. Khi user online lại → fetch `/api/notifications` → hiển thị. **Đây là thiết kế đúng** — WebSocket chỉ là "fast path", database là "reliable path".

```
FAST PATH (WebSocket - real-time):
  Booking created → sendToUser() → WebSocket push → Toast notification (< 50ms)
  Nếu user offline → push thất bại → SILENT FAIL (OK)

RELIABLE PATH (Database + REST):
  Booking created → Save Notification to DB → Persist (100% reliable)
  User online lại → fetchNotifications() → Load từ DB → Hiển thị
```

**Cải thiện**: Thêm "unread count badge" refresh khi tab được focus lại:

```javascript
// Refresh notifications khi user quay lại tab
document.addEventListener("visibilitychange", () => {
  if (!document.hidden && authenticated) {
    fetchNotifications(); // Sync với DB để bắt missed notifications
  }
});
```

### 8.6 WebSocket Events nên Log ở Backend

```java
// Các event quan trọng cần log để debug production:

// 1. Connection established (với user info)
log.info("WS:CONNECT | sessionId={} | userId={} | ip={} | userAgent={}",
    session.getId(),
    session.getAttributes().get("userId"),
    getClientIp(session),
    getUserAgent(session));

// 2. Connection rejected (để phát hiện tấn công)
log.warn("WS:REJECTED | sessionId={} | reason={} | ip={}",
    session.getId(), reason, getClientIp(session));

// 3. Message sent (để trace delivery)
log.info("WS:SEND | to=USER:{} | type={} | sessionId={}",
    userId, notificationType, session.getId());

// 4. Connection closed (để monitor churn rate)
log.info("WS:CLOSE | sessionId={} | closeCode={} | reason={} | duration={}ms",
    session.getId(), status.getCode(), status.getReason(), connectionDuration);

// 5. Error (để phát hiện bug)
log.error("WS:ERROR | sessionId={} | error={}", session.getId(), e.getMessage());
```

### 8.7 Client-side Best Practices

```javascript
// 1. Backoff Strategy (Exponential Backoff)
class RobustWebSocket {
  baseDelay = 1000;    // 1s
  maxDelay = 30000;    // 30s tối đa
  currentDelay = 1000;
  jitter = true;       // Thêm random để tránh thundering herd

  getNextDelay() {
    const delay = Math.min(this.currentDelay * 2, this.maxDelay);
    this.currentDelay = delay;
    if (this.jitter) {
      // ±20% jitter để tránh tất cả client reconnect cùng lúc
      return delay * (0.8 + Math.random() * 0.4);
    }
    return delay;
  }
}

// 2. Tránh message storm khi reconnect
// Khi reconnect, không gửi tất cả pending messages ngay
// Thay vào đó: fetch lại state từ API sau khi kết nối lại

// 3. Visibility API — Pause khi tab ẩn
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    this.stopHeartbeat(); // Dừng ping khi tab ẩn
  } else {
    this.startHeartbeat(); // Restart khi tab hiện
    this.syncWithApi();    // Fetch missed messages
  }
});

// 4. Service Worker — Persistent notifications (advanced)
// Khi browser tab đóng, Service Worker có thể nhận Push Notifications
// thay thế WebSocket bằng Web Push API
```

---

## 9. Monitoring & Observability cho WebSocket

### 9.1 Metrics cần track

```java
// Dùng Micrometer (đi kèm Spring Boot Actuator)
@Component
@RequiredArgsConstructor
public class WebSocketMetrics {

    private final MeterRegistry meterRegistry;

    // Counter: Số kết nối mới theo giờ
    private final Counter connectionCounter = Counter.builder("ws.connections.total")
        .description("Total WebSocket connections established")
        .register(meterRegistry);

    // Gauge: Số kết nối active hiện tại
    private final AtomicInteger activeConnections = new AtomicInteger(0);
    private final Gauge activeConnectionsGauge = Gauge.builder("ws.connections.active",
        activeConnections, AtomicInteger::get)
        .description("Current active WebSocket connections")
        .register(meterRegistry);

    // Timer: Thời gian kết nối sống
    private final Timer messageDeliveryTimer = Timer.builder("ws.message.delivery.time")
        .description("Time to deliver WebSocket message")
        .register(meterRegistry);

    // Counter: Số message thất bại
    private final Counter failedMessageCounter = Counter.builder("ws.messages.failed")
        .description("WebSocket messages failed to deliver")
        .register(meterRegistry);
}
```

**Grafana Dashboard — Các metric quan trọng cần hiển thị:**

```
Panel 1: Active WebSocket Connections (Real-time gauge)
  Query: ws_connections_active

Panel 2: New Connections per Minute
  Query: rate(ws_connections_total[1m])

Panel 3: Message Delivery Latency (P50, P95, P99)
  Query: histogram_quantile(0.95, ws_message_delivery_time_bucket)

Panel 4: Failed Message Rate
  Query: rate(ws_messages_failed[5m])

Panel 5: Connections by User Type (User vs Stylist)
  Query: ws_connections_total{type="user"} / ws_connections_total{type="stylist"}
```

### 9.2 Alerting Rules

```yaml
# alertmanager.yml
rules:
  - alert: WebSocketConnectionsHigh
    expr: ws_connections_active > 400
    for: 5m
    annotations:
      summary: "WebSocket connections approaching limit"
      
  - alert: WebSocketMessageFailureHigh
    expr: rate(ws_messages_failed[5m]) > 10
    for: 2m
    annotations:
      summary: "High WebSocket message delivery failure rate"

  - alert: WebSocketConnectionDrops
    expr: rate(ws_connections_closed{reason="error"}[5m]) > 5
    for: 2m
    annotations:
      summary: "Abnormal WebSocket disconnection rate"
```

---

## 10. Checklist Production WebSocket

### Security

```
[ ] WebSocket handshake được xác thực (JWT / Session token)
[ ] UserId/StylistId được verify từ JWT, không tin client truyền vào
[ ] Origin được giới hạn whitelist (không dùng setAllowedOriginPatterns("*"))
[ ] Dùng WSS (wss://) trên production, không phải WS (ws://)
[ ] Close code 1008 khi auth fail (không 1000)
[ ] Rate limit connections per IP
[ ] Message size limit được cấu hình
[ ] Không log thông tin nhạy cảm (token, password) trong WS log
```

### Reliability

```
[ ] Client implement exponential backoff (không reconnect ngay lập tức)
[ ] Server implement graceful shutdown (CloseStatus 1001 trước khi tắt)
[ ] Heartbeat Ping/Pong để maintain NAT connections
[ ] Message delivery có "reliable path" backup (Database + REST API)
[ ] Frontend sync với API khi reconnect (bắt missed messages)
[ ] Tab visibility change handler (pause/resume heartbeat)
[ ] Frontend không reconnect khi close code 1008 (auth fail)
```

### Performance

```
[ ] Singleton WebSocket instance (không tạo nhiều connections)
[ ] Session cleanup khi disconnect (tránh memory leak)
[ ] Thread-safe session registry (ConcurrentHashMap, CopyOnWriteArraySet)
[ ] Message serialization không block (async serialize nếu payload lớn)
[ ] Không broadcast toàn bộ nếu chỉ cần send to user (dùng sendToUser thay broadcast)
```

### Scalability

```
[ ] Nếu cần horizontal scale: dùng Redis Pub/Sub hoặc STOMP + external broker
[ ] Nginx/Load Balancer có đúng WebSocket proxy headers (Upgrade, Connection)
[ ] proxy_read_timeout đủ lớn (≥ 3600s cho long-lived connections)
[ ] OS file descriptor limits được tăng (ulimit -n ≥ 65536)
```

### Observability

```
[ ] Log kết nối/ngắt kết nối với context (userId, IP, userAgent)
[ ] Log message delivery thành công/thất bại
[ ] Metric active connections (Gauge)
[ ] Metric message delivery latency (Timer)
[ ] Alert khi active connections tiệm cận giới hạn
[ ] Alert khi message failure rate tăng cao
```

### Code Quality

```
[ ] WS URL đọc từ config/env, không hardcode (đặc biệt localhost)
[ ] URL dùng wss:// cho HTTPS, ws:// cho HTTP (tự detect)
[ ] reviewWebSocket.js được nâng cấp ngang bằng notificationWebSocket.js
[ ] Xử lý tất cả close codes trong onclose handler
[ ] unsubscribe() được gọi đúng khi component unmount
```

---

## Tổng kết đánh giá

### Điểm mạnh của WebSocket trong BookingSalon

| Điểm mạnh | Mức độ |
|-----------|--------|
| Singleton pattern cho WS client | ✅ Tốt |
| Heartbeat Ping/Pong 25 giây | ✅ Tốt |
| Thread-safe session registry | ✅ Tốt |
| Observer pattern với listener set | ✅ Tốt |
| Cleanup khi component unmount | ✅ Tốt |
| Reliable path backup (DB + REST) | ✅ Tốt |
| Auto-reconnect sau disconnect | ✅ Tốt |
| Tích hợp sâu vào nghiệp vụ (13 call sites) | ✅ Tốt |

### Điểm cần sửa đổi để đạt production

| Vấn đề | Mức độ | Effort sửa |
|--------|--------|------------|
| Không có authentication khi kết nối | 🔴 Critical | 1-2 ngày |
| Origin wildcard `setAllowedOriginPatterns("*")` | 🔴 Critical | 30 phút |
| Hardcode `ws://localhost:8080` trong production code | 🔴 Critical | 30 phút |
| reviewWebSocket.js thiếu heartbeat & reconnect | 🟡 High | 2 giờ |
| Không có exponential backoff (linear 4s fixed) | 🟠 Medium | 1 giờ |
| Không có WebSocket metrics & monitoring | 🟠 Medium | 1 ngày |
| Thiếu graceful shutdown handler | 🟠 Medium | 2 giờ |
| Không scale được horizontally | 🟠 Medium | 2-3 ngày |
| Thiếu message size limit | 🔵 Low | 30 phút |
| Close code chưa đúng khi auth fail (nên 1008) | 🔵 Low | 30 phút |

**Kết luận**: Implementation WebSocket trong BookingSalon cho thấy tư duy thiết kế tốt (Singleton, heartbeat, Observer pattern, reliable path backup). Tuy nhiên **lỗ hổng bảo mật không có authentication là Critical** và phải được xử lý trước khi deploy production. Các vấn đề còn lại có thể fix tuần tự sau.

---

*Tài liệu là phần chi tiết hóa của mục C3 trong `BookingSalon_Production_Review.md`.*  
*Xem thêm `DB_Migration_And_NonRoot_User_Guide.md` cho mục C2 (Database non-root user).*
