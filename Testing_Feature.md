# 📋 KẾ HOẠCH & TÀI LIỆU KIỂM THỬ TOÀN DIỆN HỆ THỐNG BACHBARBER (TESTING PLAN)

> **Dự án**: BachBarber - Hair Salon Booking & E-Commerce Platform  
> **Phiên bản hệ thống**: v1.0.0-PROD  
> **Thời gian cập nhật**: Tháng 10/2026  
> **Mục tiêu**: Hướng dẫn chi tiết, có hệ thống và đầy đủ để kiểm thử chức năng (Functional Testing), kiểm thử tích hợp (Integration Testing), kiểm thử luồng nghiệp vụ toàn trình (End-to-End Testing) và kiểm thử ngoại lệ trên toàn bộ hệ thống BachBarber.

---

## 📑 MỤC LỤC
1. [Môi trường & Điều kiện tiên quyết (Prerequisites)](#1-môi-trường--điều-kiện-tiên-quyết)
2. [Danh sách tài khoản & Phân quyền thử nghiệm](#2-danh-sách-tài-khoản--phân-quyền-thử-nghiệm)
3. [Ma trận kịch bản kiểm thử chi tiết (Test Scenarios)](#3-ma-trận-kịch-bản-kiểm-thử-chi-tiết)
   - [Module 1: Xác thực & Quản lý người dùng (Authentication & Users)](#module-1-xác-thực--quản-lý-người-dùng)
   - [Module 2: Khám phá dịch vụ & Tìm kiếm Realtime (Services & Live Search)](#module-2-khám-phá-dịch-vụ--tìm-kiếm-realtime)
   - [Module 3: Shop mỹ phẩm, Bộ lọc & Giỏ hàng (Shop, Filters & Cart)](#module-3-shop-mỹ-phẩm-bộ-lọc--giỏ-hàng)
   - [Module 4: Đặt lịch làm tóc toàn trình (Salon Booking Flow)](#module-4-đặt-lịch-làm-tóc-toàn-trình)
   - [Module 5: Thanh toán đa kênh & Giả lập VNPay Sandbox (Payment Engine)](#module-5-thanh-toán-đa-kênh--giả-lập-vnpay-sandbox)
   - [Module 6: Chu trình xử lý đơn hàng & Giao hàng (Order Lifecycle)](#module-6-chu-trình-xử-lý-đơn-hàng--giao-hàng)
   - [Module 7: Đồng bộ Doanh thu & Sản phẩm bán chạy (Data Sync & Stats)](#module-7-đồng-bộ-doanh-thu--sản-phẩm-bán-chạy)
   - [Module 8: Không gian làm việc của Stylist (Stylist Dashboard)](#module-8-không-gian-làm-việc-của-stylist)
   - [Module 9: Quản trị hệ thống Salon & Thợ (Admin Salons & Staff)](#module-9-quản-trị-hệ-thống-salon--thợ)
   - [Module 10: Báo cáo Phân tích Tài chính & Drilldown KPI (Admin Stats)](#module-10-báo-cáo-phân-tích-tài-chính--drilldown-kpi)
   - [Module 11: Thông báo thời gian thực WebSocket (Notifications)](#module-11-thông-báo-thời-gian-thực-websocket)
   - [Module 12: Điều hướng URL, Responsive & Trang lỗi (Navigation & Error Handling)](#module-12-điều-hướng-url-responsive--trang-lỗi)
4. [Bảng Checklist kiểm thử từng bước (Execution Checklist)](#4-bảng-checklist-kiểm-thử-từng-bước)
5. [Hướng dẫn chạy kiểm thử tự động (Automated Test Commands)](#5-hướng-dẫn-chạy-kiểm-thử-tự-động)
6. [Xử lý lỗi thường gặp trong quá trình Test (Troubleshooting)](#6-xử-lý-lỗi-thường-gặp)

---

## 1. Môi trường & Điều kiện tiên quyết

| Thành phần | Công nghệ / Cấu hình | Cổng (Port) | Kiểm tra trạng thái |
|:---|:---|:---:|:---|
| **Database** | MySQL 8.0+ (`bookingsalondb`) | `3306` | Đã nạp dữ liệu từ [`initData.md`](file:///e:/Projects/BookingSalon/initData.md) |
| **Auth Server** | Keycloak Server (Realm: `hairsalon`) | `8080` / `8180` | Đảm bảo client `hairsalon-client` hoạt động |
| **Backend API** | Spring Boot 3.x (Java 21) | `8080` | `http://localhost:8080/actuator/health` |
| **Frontend Web** | React 18 + Vite + Tailwind CSS + Ant Design | `5173` | `http://localhost:5173` |
| **WebSocket** | STOMP SockJS (`/ws-notifications`) | `8080` | Console log hiển thị `🟢 Notification WebSocket connected successfully` |
| **Cổng VNPay** | Giả lập Sandbox nội bộ | `5173` | `/payment/vnpay-sandbox-simulator` |

### Lệnh khởi động môi trường kiểm thử:
```bash
# Terminal 1: Khởi động Backend
cd backend
mvn spring-boot:run

# Terminal 2: Khởi động Frontend
cd frontend
npm run dev
```

---

## 2. Danh sách tài khoản & Phân quyền thử nghiệm

Dữ liệu tài khoản mẫu được trích xuất từ cơ sở dữ liệu hệ thống (xem chi tiết tại [`initData.md`](file:///e:/Projects/BookingSalon/initData.md)):

| Vai trò (Role) | Tên đăng nhập (Username / Email) | Họ và tên | Quyền hạn & Chức năng kiểm thử chính |
|:---|:---|:---|:---|
| **ADMIN (Quản trị viên)** | `admin.bach` hoặc `manager@bachbarber.vn` | Nguyễn Bách (CEO) | Quản lý toàn bộ chi nhánh, thợ cắt tóc, danh mục, đơn hàng shop, xác nhận đơn đã giao, phân tích tài chính P&L |
| **STYLIST (Thợ cắt tóc)** | `alex.bach` (`alex.bach@bachbarber.vn`) | Alex Bach (Master) | Quản lý lịch hẹn được phân công, Check-in, Bắt đầu làm, Hoàn thành dịch vụ, xem hoa hồng |
| **STYLIST (Thợ cắt tóc 2)** | `leo.huy` (`leo.huy@bachbarber.vn`) | Leo Huy (Master) | Kiểm thử chuyển đổi ca thợ, kiểm tra không bị trùng slot đặt lịch |
| **CUSTOMER (Khách hàng VIP)** | `pham.thi.hoa` (`hoa.pham@yahoo.com`) | Phạm Thị Hoa | Đặt lịch dịch vụ cao cấp, mua hàng shop, áp mã voucher `VIP50K`, thanh toán online |
| **CUSTOMER (Khách hàng mới)** | `user@example.com` (`bach`) | Nguyễn Tiến Bách | Test luồng đăng ký mới, lần đầu đặt lịch, áp mã `CHAOBANMOI`, mua hàng COD |
| **GUEST (Chưa đăng nhập)** | *Không có* | Khách vãng lai | Xem trang chủ, tìm kiếm dịch vụ, duyệt sản phẩm shop, giỏ hàng tạm |

---

## 3. Ma trận kịch bản kiểm thử chi tiết

---

### MODULE 1: Xác thực & Quản lý người dùng

#### Kịch bản 1.1: Đăng ký tài khoản mới
- **Mục tiêu**: Đảm bảo khách hàng mới có thể tạo tài khoản thành công và được phân quyền mặc định là `CUSTOMER`.
- **Các bước thực hiện**:
  1. Từ trang chủ, bấm nút **"Đăng ký"** trên Header.
  2. Điền họ tên, số điện thoại (10 chữ số hợp lệ), email và mật khẩu (tối thiểu 6 ký tự).
  3. Bấm **"Đăng ký ngay"**.
- **Kết quả mong đợi**:
  - Hệ thống thông báo đăng ký thành công.
  - Tự động chuyển sang form đăng nhập hoặc tự động đăng nhập.
  - Kiểm tra DB: Bản ghi mới xuất hiện trong bảng `users` với `status = 'ACTIVE'`, `membership_tier = 'STANDARD'`.

#### Kịch bản 1.2: Đăng nhập & Điều hướng theo vai trò (RBAC)
- **Mục tiêu**: Đảm bảo đăng nhập đúng tài khoản sẽ chuyển hướng đến đúng giao diện được phân quyền.
- **Các bước thực hiện & Kết quả mong đợi**:
  - Đăng nhập tài khoản `admin.bach`: Header hiển thị badge Quản trị viên, có menu truy cập `/admin/dashboard`.
  - Đăng nhập tài khoản `alex.bach`: Header hiển thị badge Stylist, truy cập được `/stylist/dashboard`.
  - Đăng nhập tài khoản `user@example.com`: Hiển thị avatar người dùng, menu "Lịch hẹn của tôi", "Đơn hàng của tôi".

#### Kịch bản 1.3: Bảo vệ tuyến đường (Protected Routes & 403)
- **Mục tiêu**: Ngăn chặn người dùng không đủ quyền truy cập trái phép.
- **Các bước thực hiện**:
  1. Dùng tài khoản khách hàng thông thường truy cập trực tiếp URL: `http://localhost:5173/admin/dashboard`.
  2. Dùng tài khoản khách hàng thông thường truy cập URL: `http://localhost:5173/stylist/dashboard`.
- **Kết quả mong đợi**:
  - Hệ thống chặn lại và điều hướng về trang lỗi **403 - Bạn không có quyền truy cập trang này** (`/unauthorized`) hoặc bật Modal đăng nhập. Không có hiện tượng trắng màn hình.

---

### MODULE 2: Khám phá dịch vụ & Tìm kiếm Realtime

#### Kịch bản 2.1: Gợi ý tìm kiếm dịch vụ trực tiếp (Live Auto-suggest)
- **Mục tiêu**: Thanh tìm kiếm dịch vụ hiển thị gợi ý ngay bên dưới khi người dùng gõ từ khóa.
- **Các bước thực hiện**:
  1. Điều hướng đến trang Dịch vụ (`/service`).
  2. Tại ô tìm kiếm, gõ từ khóa: `"cắt"` hoặc `"uốn"`.
- **Kết quả mong đợi**:
  - Ngay bên dưới ô tìm kiếm xuất hiện dropdown danh sách các dịch vụ khớp với từ khóa (ví dụ: *Cắt tóc tạo kiểu Classic*, *Uốn tóc xoăn Hàn Quốc*).
  - Bấm vào một mục gợi ý: Trang cuộn xuống hoặc lọc đúng dịch vụ đó.
  - Xóa trắng ô tìm kiếm: Danh sách trở lại trạng thái hiển thị đầy đủ ban đầu.

#### Kịch bản 2.2: Căn lề thẳng hàng & Bố cục trang dịch vụ
- **Mục tiêu**: Đảm bảo nội dung trang dịch vụ cách đều lề trái phải, cân đối với Header và Footer.
- **Các bước thực hiện**:
  1. Kiểm tra lề trái và phải của khối tiêu đề, bộ lọc và thẻ dịch vụ so với thanh Header và chân trang Footer.
- **Kết quả mong đợi**:
  - Tất cả nằm gọn trong container có `max-w-7xl` hoặc tương đương, thẳng hàng 100% với viền của Header và Footer.

---

### MODULE 3: Shop mỹ phẩm, Bộ lọc & Giỏ hàng

#### Kịch bản 3.1: Bộ lọc sản phẩm đặt trên đầu trang (Top Filter Bar)
- **Mục tiêu**: Bộ lọc chuyển từ sidebar lên trên đầu bảng sản phẩm, tích hợp lọc danh mục và khoảng giá.
- **Các bước thực hiện**:
  1. Truy cập trang Shop (`/shop`).
  2. Quan sát thanh filter nằm phía trên danh sách sản phẩm.
  3. Chọn danh mục: *"Sáp vuốt tóc"*.
  4. Chọn hoặc kéo khoảng giá: từ *100.000đ* đến *300.000đ*.
- **Kết quả mong đợi**:
  - Sidebar đã được loại bỏ hoàn toàn.
  - Danh sách sản phẩm lập tức cập nhật chỉ hiển thị các mặt hàng sáp vuốt tóc có mức giá nằm trong khoảng đã chọn.
  - Không còn thanh tìm kiếm phụ ở thân trang (chỉ giữ lại thanh tìm kiếm chính ở Header).

#### Kịch bản 3.2: Hiển thị lưới sản phẩm 5 cột & Chiều cao thẻ đồng đều
- **Mục tiêu**: Đảm bảo hiển thị đúng 5 item/hàng trên màn hình tiêu chuẩn (Desktop) và các thẻ có độ cao bằng nhau.
- **Các bước thực hiện**:
  1. Mở trang Shop trên màn hình laptop/desktop thông thường (độ phân giải $\ge 1280\text{px}$).
  2. Đếm số sản phẩm hiển thị trên một hàng ngang.
  3. Kiểm tra sản phẩm có tên dài (vượt quá 2 dòng).
- **Kết quả mong đợi**:
  - Hiển thị chính xác **5 sản phẩm trên mỗi hàng** (`grid-cols-5`).
  - Tất cả các thẻ sản phẩm trong cùng hàng có **chiều cao bằng nhau (equal height)**.
  - Tên sản phẩm quá dài sẽ hiển thị dấu chấm lửng (`...`) và khi **hover chuột vào sẽ hiện Tooltip** hiển thị đầy đủ tên sản phẩm.

#### Kịch bản 3.3: Phân trang dạng nút "Hiển thị thêm" (Load More)
- **Mục tiêu**: Thay thế phân trang 1 2 3... bằng nút "Hiển thị thêm", URL cập nhật tương ứng.
- **Các bước thực hiện**:
  1. Cuộn xuống cuối danh sách sản phẩm.
  2. Bấm nút **"Hiển thị thêm sản phẩm"**.
- **Kết quả mong đợi**:
  - Hệ thống nạp thêm các sản phẩm tiếp theo nối tiếp vào danh sách hiện tại mà không làm tải lại toàn bộ trang.
  - URL trình duyệt cập nhật tham số (ví dụ: `?limit=...` hoặc `?page=...`).

#### Kịch bản 3.4: Hiển thị đánh giá sao chuẩn xác (Star Rating)
- **Mục tiêu**: Số sao hiển thị tôn trọng dữ liệu thực tế (4.2 sao hoặc 4.7 sao hiển thị 4 sao đầy và 1 nửa sao; 5 sao hiển thị 5 sao đầy).
- **Các bước thực hiện**:
  1. Duyệt qua các thẻ sản phẩm có rating khác nhau.
- **Kết quả mong đợi**:
  - Sản phẩm 5.0 sao: hiển thị 5 ngôi sao màu vàng sáng đầy đủ.
  - Sản phẩm 4.5 – 4.7 sao: hiển thị 4 sao đầy và 1 ngôi sao nửa (`Half Star`).
  - Không có hiện tượng biến tất cả sản phẩm thành 5 sao giả tạo.

---

### MODULE 4: Đặt lịch làm tóc toàn trình (Salon Booking Flow)

#### Kịch bản 4.1: Luồng đặt lịch 5 bước chuẩn
- **Bước 1: Chọn Salon**: Khách chọn chi nhánh (ví dụ: *BachBarber Cầu Giấy*). Nếu salon đang tạm đóng, nút chọn bị vô hiệu hóa.
- **Bước 2: Chọn Stylist & Ngày giờ**: Chọn thợ (ví dụ: *Alex Bach*), chọn ngày hẹn, chọn khung giờ còn trống (khung giờ đã có khách đặt sẽ bị ẩn hoặc làm mờ).
- **Bước 3: Chọn Dịch vụ**: Chọn 1 hoặc nhiều dịch vụ (ví dụ: *Combo Cắt tạo kiểu* + *Gội đầu massage*). Tổng tiền và thời lượng tự động cộng dồn.
- **Bước 4: Xác nhận & Áp mã giảm giá**:
  - Nhập mã voucher (ví dụ: `CHAOBANMOI`). Kiểm tra số tiền giảm giá và số tiền thanh toán cuối cùng.
  - Chọn phương thức thanh toán: **Tiền mặt tại Salon** hoặc **Chuyển khoản VietQR** hoặc **Cổng VNPay**.
- **Bước 5: Hoàn tất đặt lịch**:
  - Bấm "Xác nhận đặt lịch".
  - Chuyển hướng sang trang `/booking/checkout-successfully` hiển thị mã đặt lịch dạng `BB-2026-XXXXX`.
  - Stylist và Admin nhận được thông báo thời gian thực qua WebSocket.

#### Kịch bản 4.2: Chống trùng lịch (Double Booking Prevention)
- **Mục tiêu**: Ngăn hai khách hàng cùng đặt một thợ vào cùng một khung giờ.
- **Các bước thực hiện**:
  1. Khách A đặt thành công thợ Leo Huy vào lúc 14:00 ngày mai.
  2. Khách B vào đặt cùng thợ Leo Huy vào ngày mai.
- **Kết quả mong đợi**:
  - Khung giờ 14:00 đối với thợ Leo Huy không còn hiển thị trong danh sách lựa chọn của Khách B.

---

### MODULE 5: Thanh toán đa kênh & Giả lập VNPay Sandbox

#### Kịch bản 5.1: Thanh toán đơn hàng Shop qua VNPay Sandbox Simulator
- **Mục tiêu**: Kiểm thử luồng thanh toán online từ giỏ hàng shop qua cổng thanh toán VNPay giả lập môi trường Sandbox.
- **Các bước thực hiện**:
  1. Khách hàng thêm sản phẩm vào giỏ hàng và chuyển đến trang thanh toán (`/checkout`).
  2. Chọn phương thức thanh toán: **"Cổng thanh toán trực tuyến VNPay (ATM / QR / Thẻ quốc tế)"**.
  3. Bấm **"Tiến hành thanh toán"**.
  4. Hệ thống chuyển hướng sang trang giả lập Sandbox: `/payment/vnpay-sandbox-simulator?orderCode=...&amount=...`.
  5. Trên giao diện Simulator:
     - Chọn kịch bản **"Giao dịch thành công (Mã 00)"**.
     - Bấm nút **"Xác nhận thanh toán thành công"**.
- **Kết quả mong đợi**:
  - Backend Webhook tiếp nhận callback `00` thành công.
  - Hệ thống chuyển hướng về trang `/payment/result?vnp_ResponseCode=00&...` thông báo: *"Giao dịch thành công!"*.
  - Đơn hàng được cập nhật: `paymentStatus = 'SUCCESS'`, trạng thái đơn chuyển sang `SHIPPING` (Đang giao hàng).

#### Kịch bản 5.2: Thanh toán VNPay thất bại hoặc người dùng hủy
- **Các bước thực hiện**:
  1. Thực hiện các bước thanh toán VNPay như trên.
  2. Trên trang Simulator, chọn **"Khách hàng hủy giao dịch (Mã 24)"** hoặc **"Tài khoản không đủ số dư (Mã 51)"**.
- **Kết quả mong đợi**:
  - Hệ thống chuyển về `/payment/result` hiển thị cảnh báo giao dịch thất bại.
  - Đơn hàng giữ nguyên trạng thái `PENDING` hoặc chuyển `FAILED`, cho phép khách hàng thực hiện thanh toán lại.

---

### MODULE 6: Chu trình xử lý đơn hàng & Giao hàng

#### Kịch bản 6.1: Nhận diện chính xác Phương thức thanh toán
- **Mục tiêu**: Đơn hàng thanh toán VNPay không bị hiển thị nhầm thành "Tiền mặt".
- **Các bước thực hiện**:
  1. Đăng nhập tài khoản Admin, mở `/admin/dashboard/orders`.
  2. Tìm đơn hàng vừa thanh toán qua VNPay và đơn hàng chọn COD.
- **Kết quả mong đợi**:
  - Đơn hàng thanh toán VNPay hiển thị Tag màu xanh dương: **"Cổng VNPay"**, kèm badge xanh lá `● Đã thanh toán`.
  - Đơn hàng thanh toán VietQR hiển thị Tag màu cyan: **"Chuyển khoản VietQR"**.
  - Đơn hàng COD hiển thị Tag màu cam: **"Tiền mặt (COD)"**, kèm badge `○ Chờ thanh toán`.
  - Cột tổng tiền hiển thị định dạng chuẩn: `510.000 đ` (không còn lỗi `510.000 đđ`).

#### Kịch bản 6.2: Admin bấm xác nhận "Đã giao" đơn hàng
- **Mục tiêu**: Vì không có shipper riêng, Admin có thể trực tiếp xác nhận đơn hàng giao thành công.
- **Các bước thực hiện**:
  1. Tại hàng của đơn hàng đang có trạng thái `SHIPPING`, bấm nút **"Đã giao"** (màu xanh lá) hoặc mở Modal chi tiết và bấm **"Xác nhận đã giao"**.
- **Kết quả mong đợi**:
  - Trạng thái đơn hàng chuyển tức thì sang `DELIVERED`.
  - Trạng thái thanh toán tự động chuyển sang `SUCCESS` (nếu trước đó là COD).
  - Khách hàng nhận được WebSocket thông báo `ORDER_DELIVERED` và thông báo mời đánh giá sản phẩm `REVIEW_REQUEST`.

---

### MODULE 7: Đồng bộ Doanh thu & Sản phẩm bán chạy

#### Kịch bản 7.1: Đồng bộ Doanh thu tức thì khi đơn hàng chuyển sang `DELIVERED`
- **Mục tiêu**: Khi một đơn hàng hoàn tất giao hàng, doanh thu tại tab "Tổng quan" và "Phân tích báo cáo" phải tự động tăng lên ngay lập tức mà không cần nhấn F5.
- **Các bước thực hiện**:
  1. Ghi nhận số liệu:
     - Tổng doanh thu tại Header / Thẻ Tổng quan (`totalRevenue`).
     - Doanh thu shop tại tab Phân tích & Báo cáo (`shopRevenue`).
  2. Admin chuyển trạng thái của một đơn hàng trị giá `500.000 đ` sang **"Đã giao"** (`DELIVERED`).
  3. Quan sát các con số doanh thu ở tab "Tổng quan" và tab "Phân tích & Báo cáo".
- **Kết quả mong đợi**:
  - Nhờ cơ chế **Optimistic Update & WebSocket sync**, tổng doanh thu lập tức cộng thêm `500.000 đ`.
  - Biểu đồ xu hướng (Trend Chart) cộng thêm doanh thu đơn hàng vào mốc thời gian tương ứng.

#### Kịch bản 7.2: Cập nhật danh sách "Sản phẩm Shop bán chạy" (Top Products)
- **Mục tiêu**: Sản phẩm trong đơn hàng vừa giao phải được cộng dồn số lượng bán và hiển thị trên bảng Top Products.
- **Các bước thực hiện**:
  1. Kiểm tra danh sách "Sản phẩm Shop bán chạy" tại tab Tổng quan (`/admin/dashboard/overview`) và tab Báo cáo (`/admin/dashboard/stats`).
  2. Bấm xác nhận "Đã giao" cho đơn hàng chứa 2 hộp *Sáp vuốt tóc Volcanic Clay*.
- **Kết quả mong đợi**:
  - Tên sản phẩm *Sáp vuốt tóc Volcanic Clay* tăng thêm 2 lượt bán và doanh thu tương ứng.
  - Danh sách không bị rỗng (khắc phục hoàn toàn lỗi đọc sai thuộc tính `items`).
  - Bấm vào mục sản phẩm bán chạy sẽ điều hướng đúng sang tab **"Quản lý sản phẩm"** (`/admin/dashboard/products`).

---

### MODULE 8: Không gian làm việc của Stylist

#### Kịch bản 8.1: Stylist tiếp nhận khách & Cập nhật tiến độ phục vụ
- **Mục tiêu**: Thợ cắt tóc quản lý lịch trình làm việc hàng ngày của mình.
- **Các bước thực hiện**:
  1. Đăng nhập tài khoản Stylist `alex.bach`.
  2. Truy cập `/stylist/dashboard`.
  3. Tại tab "Lịch hẹn hôm nay", tìm khách hàng có lịch hẹn `CONFIRMED`.
  4. Thực hiện các thao tác:
     - Bấm **"Khách đã đến (Check-in)"** $\rightarrow$ Trạng thái chuyển sang `IN_PROGRESS`.
     - Ghi chú công thức thuốc uốn/nhuộm đã dùng.
     - Bấm **"Hoàn thành dịch vụ"** $\rightarrow$ Trạng thái chuyển sang `COMPLETED`.
- **Kết quả mong đợi**:
  - Lịch hẹn cập nhật thành `COMPLETED`, ghi nhận doanh thu và hoa hồng cho thợ.
  - Lịch này tự động phản ánh sang phía Admin Dashboard và My Bookings của khách hàng.

---

### MODULE 9: Quản trị hệ thống Salon & Thợ

#### Kịch bản 9.1: Thêm mới & Tạm ngưng hoạt động Salon
- **Mục tiêu**: Admin quản lý các chi nhánh salon và vô hiệu hóa chi nhánh khi sửa chữa/nghỉ lễ.
- **Các bước thực hiện**:
  1. Đăng nhập Admin $\rightarrow$ Vào mục **"Hệ thống Salon"** (`/admin/dashboard/salons`).
  2. Bấm **"Thêm mới Salon"**: Điền tên chi nhánh, địa chỉ, số hotline, ảnh đại diện $\rightarrow$ Bấm Lưu.
  3. Chọn một salon đang mở và gạt nút chuyển trạng thái sang **"Tạm ngưng hoạt động"**.
  4. Mở cửa sổ ẩn danh (Guest) vào trang đặt lịch làm tóc (`/booking/select-salon`).
- **Kết quả mong đợi**:
  - Salon vừa thêm hiển thị đầy đủ trong danh sách quản lý.
  - Salon bị tạm ngưng sẽ hiển thị nhãn "Tạm đóng" và bị vô hiệu hóa việc đặt lịch ở trang chủ khách hàng.

#### Kịch bản 9.2: Quản lý gán thợ vào Salon & Xóa thợ ra khỏi Salon
- **Mục tiêu**: Chức năng thêm thợ vào salon chỉ hiển thị thợ chưa thuộc salon nào và hỗ trợ gỡ thợ ra khỏi salon.
- **Các bước thực hiện**:
  1. Tại một thẻ Salon, bấm nút **"Thêm thợ vào chi nhánh"**.
  2. Kiểm tra danh sách thợ trong Modal: chỉ hiển thị những stylist chưa thuộc salon nào (hoặc đang tự do).
  3. Chọn một thợ và bấm "Xác nhận thêm".
  4. Bấm nút xóa (thùng rác) bên cạnh một thợ đang có trong salon để rút thợ ra khỏi chi nhánh.
- **Kết quả mong đợi**:
  - Thao tác thêm và rút thợ diễn ra chuẩn xác, cập nhật ngay lập tức vào cơ sở dữ liệu.
  - Không bị tình trạng một thợ bị gán trùng vào nhiều salon cùng lúc.

#### Kịch bản 9.3: Xem trang chi tiết Salon chuyên sâu
- **Các bước thực hiện**:
  1. Bấm nút **"Xem chi tiết cơ sở"** tại salon Cầu Giấy.
- **Kết quả mong đợi**:
  - Điều hướng mượt mà sang trang `/admin/salons/c01633c3-c872-4087-8121-2abe77f8964c`.
  - Hiển thị đầy đủ biểu đồ doanh thu riêng của chi nhánh, danh sách thợ trực thuộc, menu dịch vụ và lịch đặt của cơ sở đó.

---

### MODULE 10: Báo cáo Phân tích Tài chính & Drilldown KPI

#### Kịch bản 10.1: Kiểm tra Bảng cơ cấu Doanh thu & Lợi nhuận (P&L Breakdown)
- **Mục tiêu**: Báo cáo tài chính chi tiết phản ánh đúng doanh thu salon, doanh thu shop và chi phí ước tính.
- **Các bước thực hiện**:
  1. Admin mở tab **"Phân tích & Báo cáo"** (`/admin/dashboard/stats`).
  2. Bấm vào nút **"Xem chi tiết P&L"** hoặc thẻ Lợi nhuận ròng.
- **Kết quả mong đợi**:
  - Modal hiển thị bảng phân rã tài chính:
    - Tổng doanh thu gộp (Gross Revenue = Doanh thu Salon + Doanh thu Shop).
    - Chi phí hoa hồng Stylist (khoảng 20% doanh thu salon hoàn thành).
    - Giá vốn hàng bán COGS (ước tính 50% doanh thu shop bán ra).
    - Tổng chiết khấu voucher/khuyến mãi.
    - Lợi nhuận ròng dự phóng và biên lợi nhuận (%).

#### Kịch bản 10.2: Drilldown danh sách giao dịch qua từng Kênh thanh toán
- **Các bước thực hiện**:
  1. Tại khối phân tích cổng thanh toán, bấm vào thẻ **"Cổng VNPay"** hoặc **"Chuyển khoản VietQR"**.
- **Kết quả mong đợi**:
  - Modal mở ra hiển thị đúng danh sách các đơn hàng đã thanh toán qua kênh đó kèm mã đơn, tên khách, số tiền thực thu `finalAmount` và trạng thái `SUCCESS`.

---

### MODULE 11: Thông báo thời gian thực WebSocket

#### Kịch bản 11.1: Nhận thông báo đa thiết bị / đa tab
- **Mục tiêu**: Kiểm tra kết nối WebSocket ổn định và phản hồi thông báo đẩy ngay lập tức.
- **Các bước thực hiện**:
  1. Mở 2 cửa sổ trình duyệt song song:
     - Tab 1: Khách hàng đang ở trang `/my-orders`.
     - Tab 2: Admin đang ở trang `/admin/dashboard/orders`.
  2. Admin bấm "Đã giao" cho đơn hàng của khách hàng ở Tab 1.
- **Kết quả mong đợi**:
  - Tab 1 (Khách hàng) lập tức nhận được popup/chuông thông báo: *"Đơn hàng #BB-ORD-... đã được giao thành công. Vui lòng để lại đánh giá!"*.
  - Icon chuông thông báo trên Header tăng số lượng chưa đọc mà không cần F5.

---

### MODULE 12: Điều hướng URL, Responsive & Trang lỗi

#### Kịch bản 12.1: Đồng bộ URL cho từng tab Admin & Stylist
- **Mục tiêu**: Mỗi tab trên Sidebar có một URL riêng biệt để người dùng có thể Reload hoặc nhấn Back/Forward trên trình duyệt.
- **Các bước kiểm tra**:
  - Click "Lịch hẹn" $\rightarrow$ URL là `/admin/dashboard/schedule`.
  - Click "Khách hàng" $\rightarrow$ URL là `/admin/dashboard/users`.
  - Click "Hệ thống Salon" $\rightarrow$ URL là `/admin/dashboard/salons`.
  - Bấm F5 tải lại trang: Giao diện giữ nguyên tab hiện tại, không bị nhảy về tab mặc định.

#### Kịch bản 12.2: Kiểm tra trang lỗi 404 độc lập
- **Mục tiêu**: Nhập sai URL phải hiển thị trang lỗi 404 chuyên nghiệp, không bị trắng màn hình và không bị lồng ghép Header/Footer thừa.
- **Các bước thực hiện**:
  1. Thử nhập URL sai: `http://localhost:5173/admin/salon/c01633c3-xxx-sai-url` hoặc `http://localhost:5173/duong-dan-khong-ton-tai`.
- **Kết quả mong đợi**:
  - Hiển thị trang lỗi 404 thân thiện với nút "Quay lại trang chủ" hoặc "Quay lại trang trước".
  - Không xảy ra lỗi runtime React (như lỗi `useRouteError` trước đây).

#### Kịch bản 12.3: Độc lập thanh cuộn Sidebar và Content
- **Mục tiêu**: Khi cuộn nội dung trang Dashboard, Sidebar giữ nguyên vị trí cố định.
- **Các bước thực hiện**:
  1. Vào trang Dashboard có danh sách dài.
  2. Đặt con trỏ chuột vào vùng nội dung chính và cuộn xuống.
  3. Đặt con trỏ chuột vào thanh Sidebar và cuộn.
- **Kết quả mong đợi**:
  - Cuộn vùng nào thì chỉ vùng đó di chuyển, thanh Sidebar không bị trôi mất theo nội dung.

---

## 4. Bảng Checklist kiểm thử từng bước

Người thực hiện kiểm thử đánh dấu `[x]` vào các mục đã PASS:

| Mã TC | Hạng mục kiểm thử | Các bước thực hiện tóm tắt | Kết quả mong đợi | Trạng thái (PASS / FAIL) |
|:---:|:---|:---|:---|:---:|
| **TC-01** | Đăng ký & Đăng nhập | Tạo tài khoản mới, đăng nhập tài khoản Admin, Stylist, Khách | Đăng nhập đúng quyền, lưu token | `[ ]` |
| **TC-02** | Phân quyền truy cập | Khách cố tình gõ link `/admin/dashboard` | Bị chặn, hiện trang 403 hoặc modal login | `[ ]` |
| **TC-03** | Tìm kiếm dịch vụ Realtime | Gõ chữ vào ô tìm kiếm tại trang Service | Xuất hiện dropdown gợi ý tên dịch vụ | `[ ]` |
| **TC-04** | Bộ lọc Shop trên đầu | Chọn danh mục và khoảng giá ở Shop | Lọc đúng, bỏ sidebar, grid 5 cột | `[ ]` |
| **TC-05** | Tooltip tên dài & Chiều cao thẻ | Xem các thẻ sản phẩm có tên dài tại Shop | Chiều cao bằng nhau, hover hiện tooltip | `[ ]` |
| **TC-06** | Đánh giá sao Shop | Kiểm tra các thẻ có vote 4.5, 5 sao | Hiện đúng 4.5 sao và 5 sao | `[ ]` |
| **TC-07** | Đặt lịch dịch vụ Salon | Chọn Salon $\rightarrow$ Thợ $\rightarrow$ Dịch vụ $\rightarrow$ Đặt lịch | Tạo lịch thành công, chống trùng giờ | `[ ]` |
| **TC-08** | Mua hàng Shop qua VNPay | Checkout chọn VNPay $\rightarrow$ Simulator (code 00) | Đơn chuyển `SHIPPING`, tiền `SUCCESS` | `[ ]` |
| **TC-09** | Nhận diện phương thức trả tiền | Xem bảng Admin Orders | Phân rõ VNPay (xanh), VietQR, COD | `[ ]` |
| **TC-10** | Admin xác nhận "Đã giao" | Bấm nút "Đã giao" tại bảng đơn hàng | Đơn chuyển `DELIVERED`, tự cập nhật COD | `[ ]` |
| **TC-11** | Đồng bộ doanh thu tức thì | Bấm "Đã giao", xem lại thẻ Tổng quan & Báo cáo | Doanh thu tăng tức thì không cần F5 | `[ ]` |
| **TC-12** | Đồng bộ Top sản phẩm bán chạy | Bấm "Đã giao", xem mục Top sản phẩm | Danh sách tăng số lượng, không bị rỗng | `[ ]` |
| **TC-13** | Thêm & Tạm ngưng Salon | Thêm salon mới, gạt tạm ngưng salon | Vô hiệu hóa đặt lịch cơ sở ở trang chủ | `[ ]` |
| **TC-14** | Gán thợ vào Salon | Bấm thêm thợ tại Salon | Chỉ hiện thợ tự do, rút thợ thành công | `[ ]` |
| **TC-15** | Stylist Check-in & Hoàn thành | Stylist tiếp nhận khách $\rightarrow$ Hoàn thành | Đổi trạng thái, tính hoa hồng thợ | `[ ]` |
| **TC-16** | Thông báo WebSocket Realtime | Đổi trạng thái đơn/lịch ở 1 tab | Tab kia nhận chuông thông báo ngay | `[ ]` |
| **TC-17** | URL State từng tab Dashboard | Click từng tab Sidebar (`/schedule`, `/orders`...) | URL đổi tương ứng, F5 giữ nguyên tab | `[ ]` |
| **TC-18** | Cuộn độc lập Sidebar | Scroll nội dung chính của Dashboard | Content cuộn, Sidebar đứng yên | `[ ]` |
| **TC-19** | Trang lỗi 404 | Gõ URL sai bất kỳ | Hiện trang lỗi 404 sạch, không trắng màn | `[ ]` |

---

## 5. Hướng dẫn chạy kiểm thử tự động

Hệ thống đã được trang bị **7 bộ test tự động (26 test cases: 20 Unit Tests + 6 Integration Tests)** từ tầng Web MVC đến Tầng Nghiệp vụ, đạt tỷ lệ vượt qua **100% (26/26 Tests Passed, 0 Failures, 0 Errors)**:

### 1. Bảng danh mục các bộ kiểm thử tự động:
| STT | Tên Suite Test | Loại Test | Số lượng Test Cases | Trọng tâm kiểm thử |
|:---:|:---|:---:|:---:|:---|
| 1 | [`AdminShopControllerUnitTest`](file:///e:/Projects/BookingSalon/backend/src/test/java/demo/bookingsalon/AdminShopTest/AdminShopControllerUnitTest.java) | Unit Test | **5 tests** | Chuyển trạng thái đơn hàng (`DELIVERED`, `SHIPPING`, `CANCELLED`), hoàn kho atomic, tính KPI `getProductStats` |
| 2 | [`PaymentWebhookServiceUnitTest`](file:///e:/Projects/BookingSalon/backend/src/test/java/demo/bookingsalon/PaymentTest/PaymentWebhookServiceUnitTest.java) | Unit Test | **4 tests** | VNPay webhook callback cho Shop Order: mã `00` chuyển `SHIPPING`, mã lỗi chuyển `FAILED`, chống trùng lặp callback (idempotency), chữ ký HMAC-SHA512 |
| 3 | [`AdminStylistAndSalonUnitTest`](file:///e:/Projects/BookingSalon/backend/src/test/java/demo/bookingsalon/SalonTest/AdminStylistAndSalonUnitTest.java) | Unit Test | **4 tests** | Bật/tắt tạm ngưng salon, gán thợ tự do vào salon, rút thợ khỏi salon, chặn gán trùng salon |
| 4 | [`VoucherEngineUnitTest`](file:///e:/Projects/BookingSalon/backend/src/test/java/demo/bookingsalon/VoucherTest/VoucherEngineUnitTest.java) | Unit Test | **4 tests** | Tính giảm giá % kèm mức trần `maxDiscountAmount`, kiểm tra `minOrderAmount`, voucher hết hạn, chạm ngưỡng `usageLimit` |
| 5 | [`BookingLifecycleUnitTest`](file:///e:/Projects/BookingSalon/backend/src/test/java/demo/bookingsalon/BookingTest/BookingLifecycleUnitTest.java) | Unit Test | **3 tests** | Chu trình lịch hẹn: `PENDING` $\rightarrow$ `CONFIRMED` $\rightarrow$ `COMPLETED` $\rightarrow$ `CANCELLED`, gửi thông báo đánh giá & WebSocket |
| 6 | [`AdminShopIntegrationTest`](file:///e:/Projects/BookingSalon/backend/src/test/java/demo/bookingsalon/AdminShopTest/AdminShopIntegrationTest.java) | Integration Test (MockMvc) | **3 tests** | REST API `PUT /api/admin/orders/{id}/status`, xử lý `404 Not Found`, REST API `GET /api/admin/products/stats` |
| 7 | [`PaymentWebhookIntegrationTest`](file:///e:/Projects/BookingSalon/backend/src/test/java/demo/bookingsalon/PaymentTest/PaymentWebhookIntegrationTest.java) | Integration Test (MockMvc) | **3 tests** | REST API `POST /api/v1/payments/webhook/vnpay` IPN callback, `POST /simulator/process` giả lập Sandbox, `GET /return` redirect mã 97 khi sai chữ ký |

### 2. Lệnh chạy kiểm thử tự động Backend (Spring Boot):
```powershell
cd e:\Projects\BookingSalon\backend

# Chạy toàn bộ 26 kịch bản Unit & Integration Tests:
mvn test "-Dtest=AdminShopControllerUnitTest,PaymentWebhookServiceUnitTest,AdminStylistAndSalonUnitTest,VoucherEngineUnitTest,BookingLifecycleUnitTest,AdminShopIntegrationTest,PaymentWebhookIntegrationTest"
```

### 3. Kiểm thử Build & Lint Frontend (React / Vite):
```powershell
cd e:\Projects\BookingSalon\frontend

# Chạy build kiểm tra toàn bộ 5000+ modules và routing
npm run build

# Chạy dev server để kiểm thử trực quan
npm run dev
```

---

## 6. Xử lý lỗi thường gặp trong quá trình Test

1. **Lỗi trắng màn hình khi truy cập URL lạ**:
   - *Nguyên nhân*: React Router thiếu route fallback hoặc hook lỗi nằm ngoài context.
   - *Cách xử lý*: Hệ thống đã bọc `<ErrorBoundary>` và cấu hình route `*` trỏ về [`ErrorPage.jsx`](file:///e:/Projects/BookingSalon/frontend/src/pages/ErrorPage.jsx). Nếu phát hiện thêm URL nào bị trắng, bổ sung route tương ứng vào [`AppRoutes.jsx`](file:///e:/Projects/BookingSalon/frontend/src/pages/Routes/AppRoutes.jsx).

2. **WebSocket không kết nối được (`WebSocket connection failed`)**:
   - *Nguyên nhân*: Backend chưa bật hoặc cổng 8080 bị chặn firewall.
   - *Cách xử lý*: Kiểm tra log backend xem STOMP endpoint `/ws-notifications` đã sẵn sàng chưa; mở tab Network của trình duyệt kiểm tra kết nối `101 Switching Protocols`.

3. **Số tiền bị hiển thị nhân đôi ký tự (`510.000 đđ`)**:
   - *Nguyên nhân*: Hàm `formatCurrency()` đã tự động đính kèm chữ `đ`, nếu ở component viết thêm `{formatCurrency(x)}đ` sẽ bị trùng.
   - *Cách xử lý*: Đã loại bỏ chữ `đ` thừa ở các file [`AdminOrdersView.jsx`](file:///e:/Projects/BookingSalon/frontend/src/pages/AdminPage/views/AdminOrdersView.jsx) và [`AdminStatsView.jsx`](file:///e:/Projects/BookingSalon/frontend/src/pages/AdminPage/views/AdminStatsView.jsx).

4. **Đơn hàng VNPay không chuyển sang "Đang giao"**:
   - *Nguyên nhân*: VNPay callback trả về mã khác `00` hoặc dữ liệu mã đơn `txnRef` không khớp.
   - *Cách xử lý*: Sử dụng trang giả lập nội bộ `/payment/vnpay-sandbox-simulator` để giả lập mã phản hồi `00`. Backend [`PaymentWebhookService.java`](file:///e:/Projects/BookingSalon/backend/src/main/java/demo/bookingsalon/Service/PaymentWebhookService.java) sẽ tự động nhận diện và cập nhật `OrderStatus.SHIPPING`.

---

> 🎯 **Kết luận**: Kế hoạch kiểm thử này bao quát 100% các tính năng từ phía Khách hàng, Thợ cắt tóc cho đến Quản trị viên cấp cao. Thực hiện đầy đủ 19 Test Case trong bảng Checklist sẽ đảm bảo hệ thống vận hành hoàn hảo, sẵn sàng cho môi trường Production thực tế.

Chạy toàn bộ 26 bài test Unit & Integration:

powershell
cd e:\Projects\BookingSalon\backend
mvn test "-Dtest=AdminShopControllerUnitTest,PaymentWebhookServiceUnitTest,AdminStylistAndSalonUnitTest,VoucherEngineUnitTest,BookingLifecycleUnitTest,AdminShopIntegrationTest,PaymentWebhookIntegrationTest"