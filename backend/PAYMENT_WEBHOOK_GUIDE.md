# Hướng dẫn: Webhook & QR Code Thanh toán VNPay

## 📋 Tổng quan

Hệ thống booking salon của bạn đã được tích hợp với **VNPay** để xử lý thanh toán thực tế.

Flow thanh toán:
1. **Client** → Gọi API tạo payment → Lấy VNPay URL + QR Code
2. **User** → Quét QR Code hoặc truy cập link → Thanh toán trên VNPay
3. **VNPay** → Gửi callback webhook đến server
4. **Server** → Verify signature + Update payment status → Update booking status

---

## 🔧 Setup VNPay Configuration

### Bước 1: Đăng ký tài khoản VNPay
- Truy cập: https://merchant.vnpayment.vn
- Đăng ký account merchant
- Lấy **TMN_CODE** và **SECRET_KEY**

### Bước 2: Cấu hình trong `application.properties`

```properties
# Staging
vnpay.tmn-code = YOUR_TMN_CODE (Sandbox)
vnpay.hash-secret = YOUR_SECRET_KEY
vnpay.pay-url = https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
vnpay.notify-url = https://your-production-domain.com/api/v1/payments/webhook/vnpay
vnpay.return-url = https://your-production-domain.com/payment-callback

# Production (khi live)
vnpay.pay-url = https://api.vnpayment.vn/paymentv2/vpcpay.html
```

### Bước 3: Thiết lập Webhook trên VNPay Dashboard
1. Login vào https://merchant.vnpayment.vn
2. Vào **Settings** → **IPN/Webhook**
3. Thêm URL webhook: `https://your-domain.com/api/v1/payments/webhook/vnpay`
4. Chọn **POST** method
5. Lưu lại

---

## 📡 API Endpoints

### 1. Tạo Payment (Generate QR Code + Payment Link)

**Request:**
```bash
POST /api/v1/payments
Content-Type: application/json

{
  "bookingId": "123e4567-e89b-12d3-a456-426614174000",
  "amount": 500000,
  "description": "Thanh toán booking salon"
}
```

**Response:**
```json
{
  "paymentCode": "PAY123456789",
  "amount": 500000,
  "status": "PENDING",
  "paymentLink": "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html?...",
  "qrCode": "data:image/png;base64,...",
  "message": "Payment URL generated successfully"
}
```

### 2. Kiểm tra Status Thanh toán

**Request:**
```bash
GET /api/v1/payments/{paymentCode}/status
```

**Response:**
```json
{
  "paymentCode": "PAY123456789",
  "status": "SUCCESS",
  "amount": 500000,
  "bookingId": "123e4567-e89b-12d3-a456-426614174000"
}
```

### 3. Webhook Callback (VNPay gửi tự động)

**VNPay POST → /api/v1/payments/webhook/vnpay**

Tham số VNPay gửi:
```
vnp_Amount=50000000                    // Số tiền x100
vnp_BankCode=NCB
vnp_BankTranNo=VNP13425361
vnp_CardType=ATM
vnp_OrderInfo=Booking%20123456
vnp_PayDate=20240804120000
vnp_ResponseCode=00                    // 00 = success
vnp_SecureHash=abc123def456...         // Chữ ký HMAC-SHA512
vnp_TmnCode=YOUR_TMN_CODE
vnp_TransactionNo=13425361
vnp_TxnRef=PAY123456789                // Payment Code
```

**Response (Server trả về):**
```json
{
  "RspCode": "00",           // 00 = success, 01 = fail
  "Message": "Payment processed successfully"
}
```

---

## 🔐 Bảo mật Webhook

### Signature Verification

Tất cả callback từ VNPay đều có **chữ ký HMAC-SHA512** để xác thực. 

Code xử lý:
```java
// File: PaymentWebhookService.java
boolean isValidSignature = VNPayUtil.verifySignature(params, vnPayConfig.getSecretKey(), vnp_SecureHash);
if (!isValidSignature) {
    log.error("Invalid VNPay signature - Reject callback");
    return buildResponse(0, "Invalid signature");
}
```

**Các bước verify:**
1. Lấy `vnp_SecureHash` từ callback
2. Sắp xếp tất cả params alphabetically (loại trừ vnp_SecureHash, vnp_SecureHashType)
3. Ghép lại thành chuỗi: `key1=value1&key2=value2&...`
4. Tính HMAC-SHA512 với secret key
5. So sánh hash vừa tính với `vnp_SecureHash` từ callback

---

## 💳 Luồng Update Status

Khi VNPay gửi callback thành công (`vnp_ResponseCode=00`):

```
1. Verify signature ✓
2. Verify amount match ✓
3. Create PaymentTransaction record
4. Payment status: PENDING → SUCCESS
5. Booking status: PENDING → CONFIRMED
6. VNPay retry queue: Cancel (vì server trả RspCode=00)
```

Nếu thanh toán thất bại:
```
1. Verify signature ✓
2. Create PaymentTransaction record
3. Payment status: PENDING → FAILED
4. Booking status: Vẫn giữ PENDING (user có thể retry)
```

---

## 📊 Database Schema

### payment
```sql
CREATE TABLE payments (
    payment_id          UUID PRIMARY KEY,
    payment_code        VARCHAR(50) UNIQUE,
    amount              DECIMAL(10,2),
    status              ENUM('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'EXPIRED', 'CANCELLED'),
    payment_method      VARCHAR(50),
    user_id             UUID NOT NULL,
    booking_id          UUID NOT NULL UNIQUE,
    salon_id            UUID NOT NULL,
    version             INT (Optimistic Lock),
    created_at          TIMESTAMP,
    updated_at          TIMESTAMP
);
```

### payment_transactions
```sql
CREATE TABLE payment_transactions (
    transaction_id      UUID PRIMARY KEY,
    payment_id          UUID NOT NULL,
    transaction_no      VARCHAR(100),
    amount              DECIMAL(10,2),
    bank_code           VARCHAR(10),
    description         TEXT,
    created_at          TIMESTAMP
);
```

---

## 🧪 Test Webhook Locally

Để test webhook khi phát triển local:

### Option 1: Dùng Ngrok (Recommended)
```bash
# Install ngrok: https://ngrok.com/download

# Tạo public URL cho localhost:8080
ngrok http 8080

# Output: https://xxxxx-xx-xxxx-xxxx.ngrok.io
# Cập nhật VNPay: https://xxxxx-xx-xxxx-xxxx.ngrok.io/api/v1/payments/webhook/vnpay
```

### Option 2: Postman
```
1. Mở Postman
2. POST http://localhost:8080/api/v1/payments/webhook/vnpay
3. Params:
   - vnp_Amount: 50000000
   - vnp_ResponseCode: 00
   - vnp_TxnRef: (lấy từ payment code)
   - vnp_SecureHash: (lấy từ response tạo payment)
```

---

## ⚠️ Idempotency & Retry Logic

VNPay có thể gửi callback **nhiều lần** trong trường hợp:
- Network error
- Server không trả RspCode=00
- Timeout

**Cách bảo vệ:**

1. **Optimistic Lock** (Entity)
   ```java
   @Version
   private Integer version;  // Auto-increment each update
   ```

2. **Retry Logic** (Service)
   ```java
   @Retryable(
       retryFor = ObjectOptimisticLockingFailureException.class,
       maxAttempts = 3,
       backoff = @Backoff(delay = 100, multiplier = 2.0)
   )
   public Map<String, Object> handleVNPayWebhook(Map<String, String> params) { ... }
   ```

3. **Transaction Isolation**
   ```java
   @Transactional(isolation = Isolation.SERIALIZABLE)
   ```

---

## 🚀 Production Checklist

- [ ] Update VNPay TMN_CODE & SECRET_KEY (production keys)
- [ ] Update vnpay.pay-url → https://api.vnpayment.vn
- [ ] Cấu hình domain production trong VNPay Dashboard
- [ ] Enable HTTPS cho webhook URL
- [ ] Setup database backup
- [ ] Monitor logs (Payment service)
- [ ] Test end-to-end trước khi live
- [ ] Setup alert khi payment webhook fail

---

## 🔗 Tham khảo

- VNPay Docs: https://sandbox.vnpayment.vn/apis/docs/
- Webhook Setup: https://merchant.vnpayment.vn
- Test Card Numbers: https://sandbox.vnpayment.vn/apis/docs/testcard
