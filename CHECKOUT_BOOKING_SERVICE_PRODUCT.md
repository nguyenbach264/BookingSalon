# TÀI LIỆU CHUẨN PRODUCTION: HỆ THỐNG ĐẶT HÀNG (SHOP CHECKOUT) & ĐẶT LỊCH HẸN (SALON BOOKING)

> **Dự án**: BookingSalon (Fullstack: React Vite + Spring Boot 3 + Keycloak + MySQL + Redis)  
> **Phiên bản**: Production-Ready 2026  
> **Tài liệu**: Quy trình Pipeline, Giải pháp chống Race Condition, Xử lý Webhook Thanh toán, Đồng bộ Dashboard Quản trị và Hướng dẫn Kiểm thử Tải cao (High Concurrency Load Testing).

---

## MỤC LỤC
1. [Kiến trúc Tổng thể Hệ thống](#1-kiến-trúc-tổng-thể-hệ-thống)
2. [Chi tiết Pipeline "Đặt Hàng Sản Phẩm" (Shop Checkout)](#2-chi-tiết-pipeline-đặt-hàng-sản-phẩm-shop-checkout)
3. [Chi tiết Pipeline "Đặt Lịch Cắt Tóc" (Salon Booking)](#3-chi-tiết-pipeline-đặt-lịch-cắt-tóc-salon-booking)
4. [Cơ chế Chống Race Condition & Đảm bảo Tính toàn vẹn Dữ liệu](#4-cơ-chế-chống-race-condition--đảm-bảo-tính-toàn-vẹn-dữ-liệu)
5. [Quy trình Xử lý Webhook & Cổng Thanh toán (VNPay / VietQR / Bank)](#5-quy-trình-xử-lý-webhook--cổng-thanh-toán-vnpay--vietqr--bank)
6. [Đồng bộ Dữ liệu với Admin Dashboard & Stylist Dashboard](#6-đồng-bộ-dữ-liệu-với-admin-dashboard--stylist-dashboard)
7. [Kế hoạch & Kịch bản Test Tải Thực tế (Hàng Nghìn Request)](#7-kế-hoạch--kịch-bản-test-tải-thực-tế-hàng-nghìn-request)
8. [Checklist Vận hành & Cấu hình Production](#8-checklist-vận-hành--cấu-hình-production)

---

## 1. KIẾN TRÚC TỔNG THỂ HỆ THỐNG

```
                          ┌──────────────────────────┐
                          │    Browser Client        │
                          │   (React / Vite 5173)    │
                          └─────────────┬────────────┘
                                        │ Cookie: JSESSIONID (HttpOnly, SameSite=Lax, 30 days)
                                        │ Header: Idempotency-Key
                                        ▼
                          ┌──────────────────────────┐
                          │  Backend BFF API Service │
                          │   (Spring Boot 3: 8080)  │
                          └─────────────┬────────────┘
                                        │
             ┌──────────────────────────┼─────────────────────────┐
             │                          │                         │
             ▼                          ▼                         ▼
┌─────────────────────────┐  ┌─────────────────────┐  ┌───────────────────────┐
│     Keycloak OIDC       │  │   MySQL 8 Database  │  │     Redis Cache       │
│      (Port 8081)        │  │     (Port 3306)     │  │     (Port 6379)       │
│  Session: 30 days SSO   │  │  Pessimistic Locks  │  │  Idempotency Locks    │
│  BFF Server-side Token  │  │  Atomic SQL Updates │  │  Rate Limit / TTL 15s │
└─────────────────────────┘  └─────────────────────┘  └───────────────────────┘
```

### Các nguyên tắc cốt lõi:
1. **BFF Pattern (Backend for Frontend)**: Trình duyệt không lưu trữ JWT Access Token hay Refresh Token trong `localStorage`/`sessionStorage` để triệt tiêu lỗ hổng XSS. Thay vào đó, phiên được neo bằng cookie `JSESSIONID` (HttpOnly, 30 ngày). Backend tự động làm mới access token ngầm với Keycloak.
2. **Session Fixation: None**: Trong `SecurityConfig.java`, cấu hình `.sessionFixation().none()` nhằm ngăn chặn việc Spring Security tự sinh `JSESSIONID` mới khi nhận request xác thực, bảo toàn cookie phiên cho client qua các chuyển hướng cổng thanh toán.
3. **Optimistic & Pessimistic Locks phối hợp**:
   - Trừ tồn kho sản phẩm: Dùng câu lệnh SQL nguyên tử (`UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?`).
   - Đặt lịch stylist: Dùng `@Lock(LockModeType.PESSIMISTIC_WRITE)` trên khoảng thời gian của stylist kết hợp transaction `SERIALIZABLE` và `@Retryable`.

---

## 2. CHI TIẾT PIPELINE "ĐẶT HÀNG SẢN PHẨM" (SHOP CHECKOUT)

### 2.1 Quy trình Pipeline Đặt hàng
1. **Khách hàng gửi yêu cầu đặt hàng**:
   - Gửi `POST /api/orders` kèm theo giỏ hàng và `Idempotency-Key` (sinh tự động dạng `order-{userId}-{timestamp}-{random}`).
2. **Khóa chống gửi trùng (Idempotency Lock)**:
   - Redis thực thi `SETNX` với TTL 15 giây. Nếu click đúp hoặc mạng chập chờn gửi 2 request cùng miligiây, request thứ 2 sẽ bị chặn hoặc trả về đơn hàng đã tạo trước đó.
3. **Trừ kho nguyên tử (Atomic Stock Deduction)**:
   - Hệ thống lặp qua các sản phẩm trong giỏ và chạy SQL trực tiếp dưới database.
   - Nếu bất kỳ sản phẩm nào không đủ tồn kho (`updatedRows == 0`), hệ thống kích hoạt rollback hoàn lại kho cho các sản phẩm đã trừ trước đó, đồng thời nhả khóa Redis và thông báo lỗi rõ ràng cho khách hàng.
4. **Tạo đơn hàng & Khởi tạo Cổng thanh toán**:
   - Lưu `Order` với trạng thái `PENDING`, `PaymentStatus: PENDING`.
   - **Nếu chọn VNPay**: Sinh mã giao dịch duy nhất `ORD...`, tính toán chữ ký HMAC-SHA512 đúng chuẩn VNPay 2.1.0 và trả về `vnpayUrl`.
   - **Nếu chọn VietQR / Ngân hàng**: Sinh thông tin chuyển khoản VietQR kèm mã QR Code theo chuẩn NAPAS để khách hàng quét app ngân hàng.
   - **Nếu chọn COD**: Hoàn tất ngay, xóa giỏ hàng và điều hướng sang `/my-orders`.

---

## 3. CHI TIẾT PIPELINE "ĐẶT LỊCH CẮT TÓC" (SALON BOOKING)

### 3.1 Quy trình Pipeline Đặt lịch
1. **Chọn Chi nhánh, Dịch vụ & Stylist**:
   - Client gọi `GET /api/booking/stylist/{stylistId}/booked-slots?date=YYYY-MM-DD` (endpoint công khai) để loại bỏ các khung giờ stylist đã có lịch.
2. **Khóa chống trùng lịch cấp Database**:
   - Khi khách hàng bấm "Xác nhận đặt lịch", `BookingService.createBooking` thực thi với mức cô lập `SERIALIZABLE`.
   - Chạy truy vấn khóa bi quan:
     ```sql
     SELECT b FROM Booking b WHERE b.stylist.id = :stylistId 
     AND b.status != 'CANCELLED' 
     AND (b.startTime < :endTime AND b.endTime > :startTime) 
     FOR UPDATE;
     ```
   - Nếu phát hiện trùng, giao dịch lập tức báo lỗi "Stylist đã có lịch hẹn trong khung giờ này. Vui lòng chọn khung giờ khác".
3. **Sinh mã an toàn & Trạng thái thanh toán chuẩn Production**:
   - Sinh mã lịch hẹn duy nhất `BB-YYYY-XXXXXXXX` (dùng UUID 8 ký tự, loại bỏ hoàn toàn nguy cơ trùng mã của `Random().nextInt()`).
   - **Chuẩn hóa BANK_TRANSFER**: Đơn đặt qua chuyển khoản ngân hàng ban đầu có trạng thái `UNPAID` / `PENDING`. Chỉ chuyển sang `PAID` khi có webhook ngân hàng gửi dữ liệu đối soát thực tế hoặc nhân viên salon xác nhận.
4. **Phát thông báo thời gian thực**:
   - Gửi WebSocket `NEW_BOOKING` tới Stylist Dashboard của thợ được chỉ định để hiển thị chuông và popup đón khách.

---

## 4. CƠ CHẾ CHỐNG RACE CONDITION

### 4.1 Bán Quá Số Lượng Tồn Kho (Overselling Stock)
- **Cơ chế**: Atomic SQL Predicate
  ```java
  @Modifying
  @Query("UPDATE Product p SET p.stockQuantity = p.stockQuantity - :quantity, " +
         "p.soldCount = p.soldCount + :quantity " +
         "WHERE p.id = :productId AND p.stockQuantity >= :quantity")
  int deductStockAtomic(@Param("productId") UUID productId, @Param("quantity") Integer quantity);
  ```
- **Ưu điểm**: Database MySQL tự quản lý hàng đợi ghi (row-level lock) ở tầng engine InnoDB, đảm bảo dù có 1.000 luồng đồng thời thì số lượng tồn kho vẫn luôn chính xác và không bao giờ âm.

### 4.2 Đặt Trùng Lịch Stylist (Overbooking Stylist Slot)
- **Cơ chế**: Pessimistic Lock kết hợp Serializable & Retryable.
- Khi Transaction A đang kiểm tra và ghi nhận lịch cho Stylist X lúc 14:00, Transaction B cố gắng truy vấn khoảng giờ đó của Stylist X sẽ bị giữ lại tại hàng đợi DB. Khi A commit, B đọc thấy lịch của A và ném lỗi từ chối hợp lệ.

---

## 5. QUY TRÌNH XỬ LÝ WEBHOOK & CỔNG THANH TOÁN

### 5.1 Xử lý VNPay 2.1.0 (Return URL & IPN)
1. **Return URL (`GET /api/v1/payments/webhook/vnpay/return`)**:
   - Khách hàng thanh toán xong trên VNPay sẽ được trình duyệt redirect về backend.
   - Backend dùng thuật toán xác thực chữ ký đa tầng tại `VNPayUtil.verifySignature` (URL-encode US-ASCII và UTF-8) để đối soát `vnp_SecureHash`.
   - Nếu hợp lệ: Cập nhật trạng thái đơn hàng sang `CONFIRMED` và `PaymentStatus.SUCCESS`, phát WebSocket thông báo và redirect người dùng về trang kết quả Frontend `/payment/result`.
   - Nếu chữ ký giả mạo: Chuyển hướng về `/payment/result?responseCode=97&error=invalid_signature`.
2. **IPN Webhook (`POST /api/v1/payments/webhook/vnpay`)**:
   - Kiểm tra Idempotency: Nếu đơn đã thanh toán (`order.getPaymentStatus().isPaid()`), trả về ngay `{ "RspCode": "00", "Message": "Already processed" }`.

---

## 6. ĐỒNG BỘ DỮ LIỆU DASHBOARD QUẢN TRỊ

1. **Admin Dashboard (`AdminDashboard.jsx`)**:
   - Tổng hợp doanh thu tự động từ cả 2 nguồn: Lịch hẹn dịch vụ hoàn tất (`Booking.status == 'COMPLETED'`) và Đơn hàng sản phẩm thành công (`Order.status in ['CONFIRMED', 'DELIVERED']`).
   - Bắt sự kiện WebSocket `NEW_ORDER` và `ORDER_STATUS_CHANGED` để cập nhật bảng quản lý đơn hàng ngay lập tức.
   - Khi Admin bấm "Hủy đơn hàng", hệ thống gọi `productRepository.restoreStockAtomic(...)` để hoàn lại số lượng tồn kho cho sản phẩm.
2. **Stylist Dashboard (`StylistDashboard.jsx`)**:
   - Đồng bộ tức thì lịch hẹn mới qua WebSocket `NEW_BOOKING` và cập nhật danh sách việc cần làm trong ngày.

---

## 7. KẾ HOẠCH & KỊCH BẢN TEST TẢI THỰC TẾ (HÀNG NGHÌN REQUEST)

### Test 1: Đua Tồn Kho (100 người cùng mua sản phẩm chỉ còn 1 cái)
- **Công cụ khuyến nghị**: **k6** (Grafana k6). Cài đặt bằng `winget install k6` hoặc tải từ k6.io.
- **Mục tiêu**: Tuyệt đối không bán quá số lượng (chỉ đúng 1 người mua được, 99 người còn lại nhận thông báo hết hàng).

#### File k6 script: `test_stock_race.js`
```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    stock_race: {
      executor: 'per-vu-iterations',
      vus: 100, // 100 người dùng đồng thời
      iterations: 1,
      maxDuration: '30s',
    },
  },
};

export default function () {
  const url = 'http://localhost:8080/api/orders';
  const payload = JSON.stringify({
    userId: 'USER_UUID_HERE',
    receiverName: 'Stress Test User',
    receiverPhone: '0987654321',
    shippingAddress: '123 Test Street, Hanoi',
    paymentMethod: 'COD',
    items: [{ productId: 'PRODUCT_WITH_STOCK_1_UUID', quantity: 1 }]
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Idempotency-Key': `race-${__VU}-${Date.now()}`,
      'Cookie': 'JSESSIONID=YOUR_LOGIN_SESSION_ID'
    },
  };

  const res = http.post(url, payload, params);
  check(res, {
    '200 (Mua thanh cong) hoac 400 (Het hang)': (r) => r.status === 200 || r.status === 400,
  });
}
```
- **Chạy lệnh**: `k6 run test_stock_race.js`
- **Kết quả nghiệm thu**: 1 request trả về HTTP 200, 99 request trả về HTTP 400. Tồn kho trong DB giảm từ 1 về đúng 0, không âm.

### Test 2: Đua Lịch Stylist (50 khách hàng cùng book 1 Stylist tại 1 giờ)
- **Công cụ khuyến nghị**: **Locust** (Python) hoặc **Apache JMeter**.
- **Kịch bản**: 50 thread đồng thời gọi `POST /api/booking` cùng `stylistId` và cùng `startTime = "2026-10-15T14:00:00"`.
- **Kết quả nghiệm thu**: Đúng 1 bản ghi được tạo, 49 bản ghi bị chặn bởi khóa bi quan với thông báo "Stylist đã có lịch hẹn trong khung giờ này".

---

## 8. CHECKLIST VẬN HÀNH & CẤU HÌNH PRODUCTION

| Hạng mục | Thuộc tính | Giá trị chuẩn Production |
|---|---|---|
| **BFF Cookie** | `server.servlet.session.cookie.max-age` | `30d` (30 ngày) |
| **BFF Fixation** | `sessionFixation().none()` | Đã kích hoạt trong SecurityConfig |
| **Frontend URL** | `app.frontend-url` | `https://yourdomain.com` |
| **VNPay Return** | `vnpay.return-url` | `https://yourdomain.com/api/v1/payments/webhook/vnpay/return` |
| **Hikari Pool** | `spring.datasource.hikari.maximum-pool-size` | `30 - 50` |
| **Redis Cache** | `app.redis.enabled` | `true` |
| **Bank Auto-Confirm** | `app.booking.bank-transfer.auto-confirm` | `false` |

---
*Tài liệu đã được kiểm chứng và đóng gói thành công cùng phiên bản mã nguồn.*
