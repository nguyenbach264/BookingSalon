# Phân Tích & Giải Đáp: Cơ Chế Seeder và Dọn Dẹp File Thừa Trong Dự Án BookingSalon

> **Mục tiêu tài liệu**:
> 1. Trả lời chi tiết và toàn diện về **nguyên lý hoạt động của Seeder** trong dự án BookingSalon (MySQL + Keycloak), liệu sau khi nạp data xong có thể xóa/tắt seeder được không?
> 2. Phân loại và lập danh sách chi tiết các **file lạ/dư thừa** trong toàn bộ repository (gốc, backend, frontend) có thể xóa an toàn mà không ảnh hưởng đến hoạt động của ứng dụng.

---

## PHẦN 1: TẤT TẦN TẬT VỀ SEEDER TRONG DỰ ÁN BOOKINGSALON

### 1. Seeder là gì? Tại sao lại có Seeder trong dự án?

Trong phát triển phần mềm, **Database Seeder (hoặc Data Seeder)** là đoạn code/kịch bản có nhiệm vụ **bơm trước một lượng dữ liệu mẫu ban đầu (Dummy/Initial/Seed Data)** vào cơ sở dữ liệu ngay khi ứng dụng khởi động.

Mục đích của Seeder:
- Giúp lập trình viên có ngay dữ liệu để test tính năng (danh sách salon, thợ cắt tóc, dịch vụ, sản phẩm, voucher, các lịch hẹn mẫu) mà không phải ngồi bấm tay tạo từng dòng trên giao diện.
- Đảm bảo môi trường phát triển (Dev/Test) có sẵn các tài khoản phân quyền: `ADMIN`, `STYLIST`, `USER`.

---

### 2. Nguyên lý Hoạt động của Seeder trong Spring Boot

Trong Spring Boot, Seeder thường được triển khai thông qua interface:
- `ApplicationRunner` hoặc `CommandLineRunner`: Spring Boot tự động tìm tất cả các Bean implement interface này và gọi hàm `run(...)` **ngay sau khi toàn bộ Spring Context đã khởi động xong**.
- `@Order(n)`: Định nghĩa thứ tự ưu tiên chạy. Số nhỏ hơn chạy trước.

#### Sơ đồ Vòng đời của Seeder khi Khởi động Spring Boot:

```
[Khởi động Spring Boot]
         │
         ▼
[Kết nối Database & Chạy Flyway Migration (V1 -> V6: Tạo bảng DDL)]
         │
         ▼
[Spring Beans & Repositories được khởi tạo xong]
         │
         ▼
[Spring kích hoạt ApplicationRunner]
         │
         ├─► Bước 1: DataSeeder (@Order(1))
         │     │
         │     ├─► Kiểm tra salonRepository.count() > 0 ?
         │     │     ├─ [ĐÃ CÓ DATA] ──► Bỏ qua tạo mới (Skip), chỉ bổ sung nếu thiếu.
         │     │     └─ [CHƯA CÓ DATA] ─► Bơm Salons, Stylists, Services, Products, Bookings, Orders...
         │     ▼
         └─► Bước 2: KeycloakSeeder (@Order(2))
               │
               ├─► Gọi Keycloak Admin Client REST API sang Keycloak Server
               ├─► Tạo Role: ROLE_ADMIN, ROLE_STYLIST, ROLE_USER
               ├─► Tạo Tài khoản: admin, các stylist, test users (Pass: BachBarber@2026)
               └─► Lấy Keycloak Sub UUID ghi ngược lại bảng `users`, `stylists`, `admins` trong MySQL!
```

---

### 3. Phân Tích Chi Tiết 2 Seeder Trong Dự Án Của Bạn

Trong dự án `BookingSalon`, bạn có đúng **2 file Seeder** nằm tại `backend/src/main/java/demo/bookingsalon/Configuration/`:

#### A. File 1: `DataSeeder.java` (~1.527 dòng code)
- **Nhiệm vụ**: Bơm toàn bộ dữ liệu nghiệp vụ vào MySQL (`bookingsalondb`).
- **Dữ liệu nó tạo**:
  - 2 Salons (Chi nhánh Hà Nội & TP.HCM).
  - Danh mục dịch vụ, các gói cắt tóc, uốn nhuộm.
  - Danh sách Stylist (Hoàng Nam, Tuấn Anh, Minh Trí, v.v.).
  - 210+ Sản phẩm sáp vuốt tóc, gôm xịt, dầu gội, máy sấy.
  - Hàng chục đơn hàng (Orders) và lịch hẹn (Bookings) mẫu trải dài theo ngày/tuần/tháng/năm để test biểu đồ thống kê Dashboard.
- **Cơ chế phòng ngừa trùng lặp (Idempotent)**:
  ```java
  if (salonRepository.count() > 0) {
      log.info("DataSeeder: Database already has salons. Skipping...");
      return;
  }
  ```
  Nếu bảng Salon đã có dữ liệu, nó sẽ **không bao giờ chèn lại từ đầu**, tránh bị duplicate dữ liệu khi bạn restart server nhiều lần.

#### B. File 2: `KeycloakSeeder.java` (~331 dòng code)
- **Nhiệm vụ**: Đồng bộ người dùng giữa MySQL và máy chủ phân quyền Keycloak.
- **Cách thức hoạt động**:
  1. Đọc danh sách tài khoản cần seed (ví dụ: `admin@gmail.com`, `nam.hoang@bachbarber.vn`, `bach.customer@gmail.com`).
  2. Kết nối tới Keycloak thông qua `Keycloak` admin client.
  3. Tạo người dùng trên Keycloak Realm `booking-salon-realm`.
  4. Đặt mật khẩu mặc định: `BachBarber@2026`.
  5. Gán Realm Role tương ứng (`ROLE_ADMIN`, `ROLE_STYLIST`, `ROLE_USER`).
  6. **Đặc biệt**: Keycloak sinh ra một `UUID` định danh cho tài khoản đó. `KeycloakSeeder` lấy UUID này **cập nhật ngược lại vào cột `keycloak_id` của bảng `users` / `stylists` / `admins` trong MySQL**.

---

### 4. Câu hỏi: "Sau khi đã fill data xong, tôi xóa file seeder đi có được không?"

#### 👉 CÂU TRẢ LỜI NGẮN GỌN:
**HOÀN TOÀN ĐƯỢC!** Dữ liệu một khi đã insert vào MySQL và Keycloak thì nó đã **nằm vĩnh viễn trên ổ cứng của Database và Keycloak**, không phụ thuộc gì vào file code java Seeder nữa.

Tuy nhiên:
- **KHÔNG NÊN xóa hẳn file `.java` trong source code**.
- **NÊN TẮT (DISABLE) nó qua cấu hình file cấu hình `application.properties` hoặc biến môi trường**.

#### 🔍 Tại sao KHÔNG NÊN xóa file code?
1. **Mất khả năng tái tạo môi trường**: Mai sau khi bạn mang code sang máy khác, deploy lên server mới hoặc reset lại database trống, nếu không có Seeder thì database sẽ trắng trơn, bạn lại phải mất công tạo lại từng salon, từng thợ, từng dịch vụ.
2. **Dự án của bạn ĐÃ CÓ SẴN công tắc bật/tắt (Toggle Flag)**:
   Tác giả viết code đã lường trước điều này và gắn `@ConditionalOnProperty`:
   - Ở `DataSeeder.java`:
     ```java
     @ConditionalOnProperty(name = "app.data-seeder.enabled", havingValue = "true", matchIfMissing = true)
     ```
   - Ở `KeycloakSeeder.java`:
     ```java
     @ConditionalOnProperty(name = "app.keycloak-seeder.enabled", havingValue = "true", matchIfMissing = true)
     ```

#### 🛠️ Cách TẮT Seeder Chuẩn Production (Không cần xóa code):
Chỉ cần thêm 2 dòng sau vào file `backend/src/main/resources/application.properties` (hoặc file `.env`):

```properties
# Tắt hoàn toàn việc chạy Seeder khi bật server
app.data-seeder.enabled=false
app.keycloak-seeder.enabled=false
```
Khi đặt `=false`, mỗi lần bạn khởi động Backend, Spring Boot sẽ **bỏ qua hoàn toàn 2 file này**, giúp server khởi động nhanh hơn 5 - 10 giây mà vẫn giữ được code phòng khi cần dùng lại!

---

## PHẦN 2: DANH SÁCH CÁC FILE LẠ CÓ THỂ XÓA TRONG REPOSITORY

Sau khi quét toàn bộ cây thư mục của dự án, dưới đây là danh sách chi tiết các file rác, file tạm, file thử nghiệm không thuộc về mã nguồn chính thức.

---

### 1. Thư mục gốc (`e:\Projects\BookingSalon\`)

| Tên File | Nguồn gốc & Mục đích | Trạng thái | Hành động khuyến nghị |
| :--- | :--- | :---: | :--- |
| `cookies.txt` | File sinh ra khi bạn hoặc curl test request đăng nhập (chứa cookie session cũ `JSESSIONID=DD0A...`). | **FILE RÁC** | **XÓA NGAY** (`Remove-Item cookies.txt`). |
| `fix-git-index.ps1` | Script Powershell dùng để fix lỗi hỏng file `.git/index` trên Windows trong quá khứ. | File tiện ích | Có thể **XÓA** nếu Git hiện tại đã hoạt động ổn định. |
| `.idea/` | Thư mục cấu hình riêng của IntelliJ IDEA. | File IDE | Nên giữ lại nếu bạn dùng IntelliJ, hoặc thêm vào `.gitignore`. |
| `.vscode/` | Thư mục cấu hình riêng của VS Code. | File IDE | Tương tự `.idea/`. |

---

### 2. Thư mục Backend (`backend/`)

| Tên File | Nguồn gốc & Mục đích | Trạng thái | Hành động khuyến nghị |
| :--- | :--- | :---: | :--- |
| `CleanTarget.java` | File java độc lập dùng để xóa thư mục `target`. Đây là file viết tay thừa vì Maven đã có sẵn lệnh `mvn clean`. | **FILE DƯ THỪA** | **XÓA NGAY** (`backend/CleanTarget.java`). |
| `clean_build.bat` | Script batch dùng để xóa target và chạy `mvnw.cmd clean package`. | File script lặp lại | **CÓ THỂ XÓA** (Giữ lại `rebuild.bat` là đủ). |
| `build.sh` | Script shell cho Linux làm điều tương tự như clean_build. | File script | Giữ lại nếu deploy Linux bằng script tay, nếu dùng Docker thì có thể xóa. |
| `rebuild.bat` | Script batch nâng cao cho Windows để clean & rebuild Maven đa luồng. | Tiện ích hữu ích | **NÊN GIỮ LẠI** để build nhanh trên Windows khi cần. |
| `target/` | Thư mục chứa các file `.class` và file `.jar` đã biên dịch. | Tự sinh (Build artifact) | Không cần commit lên Git (đã có trong `.gitignore`). Có thể xóa bằng `mvn clean`. |
| `HELP.md` | File markdown mặc định do Spring Initializr tự động sinh ra khi khởi tạo project. | Mặc định | Có thể xóa nếu không đọc. |

---

### 3. Thư mục Frontend (`frontend/`)

| Tên File | Nguồn gốc & Mục đích | Trạng thái | Hành động khuyến nghị |
| :--- | :--- | :---: | :--- |
| `dist/` | Thư mục chứa code HTML/CSS/JS sau khi chạy `npm run build`. | Tự sinh (Build output) | Có thể xóa bất kỳ lúc nào bằng lệnh `npm run build` lại. Không nên đưa vào Git. |
| `.oxlintrc.json` | File cấu hình của công cụ linter siêu nhanh Oxlint (được khai báo trong `package.json`). | Cấu hình linter | **GIỮ LẠI** (dự án đang dùng để check lỗi code). |

---

## PHẦN 3: TỔNG HỢP DANH SÁCH NÊN XÓA VÀ CÂU LỆNH THỰC HIỆN

Nếu bạn muốn dọn dẹp sạch sẽ repository ngay bây giờ, bạn có thể chạy đoạn lệnh PowerShell sau ở thư mục gốc:

```powershell
# 1. Xóa file cookie tạm
Remove-Item -Path ".\cookies.txt" -Force -ErrorAction SilentlyContinue

# 2. Xóa file java dọn dẹp target thừa thãi
Remove-Item -Path ".\backend\CleanTarget.java" -Force -ErrorAction SilentlyContinue

# 3. Xóa các script build trùng lặp (chỉ giữ lại rebuild.bat)
Remove-Item -Path ".\backend\clean_build.bat" -Force -ErrorAction SilentlyContinue

# 4. Xóa script sửa git index cũ (nếu git đã bình thường)
Remove-Item -Path ".\fix-git-index.ps1" -Force -ErrorAction SilentlyContinue

# 5. Dọn dẹp thư mục build target (giải phóng dung lượng ổ cứng)
cd backend
.\mvnw.cmd clean
cd ..
```

### Bảng Tóm Tắt Cuối Cùng

| Đối tượng | Kết luận |
| :--- | :--- |
| **`DataSeeder.java` & `KeycloakSeeder.java`** | **Không cần xóa file**. Hãy cấu hình `app.data-seeder.enabled=false` và `app.keycloak-seeder.enabled=false` trong `application.properties` để tắt vĩnh viễn khi đã có data. |
| **`cookies.txt`** | **Xóa ngay lập tức** (Chứa session cookie thử nghiệm cũ). |
| **`CleanTarget.java`** | **Xóa ngay lập tức** (Code thừa không theo chuẩn Maven). |
| **`clean_build.bat`** | **Xóa được** (Vì đã có `rebuild.bat` tốt hơn). |
| **`fix-git-index.ps1`** | **Xóa được** (Script chữa cháy tạm thời). |

