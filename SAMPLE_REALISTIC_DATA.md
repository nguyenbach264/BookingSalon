# BỘ DỮ LIỆU MẪU THỰC TẾ HỆ THỐNG BOOKINGSALON (SAMPLE REALISTIC DATA)
> **Trạng thái tài liệu**: `DRAFT FOR REVIEW` (Chờ khách hàng kiểm tra và xác nhận trước khi import vào Database)  
> **Mục đích**: Cung cấp bộ dữ liệu mẫu chuẩn hóa, sát với thực tế vận hành của chuỗi salon tóc cao cấp & cửa hàng mỹ phẩm nam tại Việt Nam.

---

## 1. DANH SÁCH CHI NHÁNH SALON (`salons`)

| Salon Code | Tên Chi Nhánh | Địa Chỉ Chi Tiết | Phường / Quận / TP | Giờ Mở Cửa | Sức Chứa | Hotline | Quản Lý Phụ Trách |
| :--- | :--- | :--- | :--- | :---: | :---: | :--- | :--- |
| `SL-HN-CAUGIAY` | **BachBarber Cầu Giấy (Flagship)** | 82 Duy Tân, Dịch Vọng Hậu | Cầu Giấy, Hà Nội | 08:30 - 21:30 | 12 Ghế | 0988.123.456 | Nguyễn Hoàng Long (0912.333.444) |
| `SL-HN-HOANKIEM` | **BachBarber Phố Cổ** | 45 Hàng Bài, Tràng Tiền | Hoàn Kiếm, Hà Nội | 09:00 - 22:00 | 8 Ghế | 0988.234.567 | Trần Hải Yến (0913.444.555) |
| `SL-HCM-QUAN1` | **BachBarber Sài Gòn Central** | 128 Nguyễn Trãi, Bến Thành | Quận 1, TP. Hồ Chí Minh | 08:30 - 22:00 | 14 Ghế | 0988.345.678 | Lê Quốc Tuấn (0914.555.666) |

---

## 2. DANH SÁCH CHUYÊN GIA TẠO MẪU TÓC (`stylists`)
*(Đã lược bỏ `username`, `password_hash` do Keycloak SSO quản lý)*

| Họ Tên | Nghệ Danh | SĐT Liên Hệ | Email Nội Bộ | Chi Nhánh | Bậc Thợ | Kinh Nghiệm | Sở Trường | Lương Cơ Bản | Hoa Hồng |
| :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- | :---: | :---: |
| **Bạch Quang Minh** | *Alex Bach* | 0901.888.111 | alex.bach@salon.vn | Cầu Giấy | **MASTER** | 8.5 năm | Uốn Textured, Layer Châu Âu, Fade sắc nét | 15,000,000₫ | 15% |
| **Trần Đình Trọng** | *Tony Tran* | 0902.888.222 | tony.tran@salon.vn | Cầu Giấy | **SENIOR** | 5.0 năm | Uốn Rủ Hàn Quốc, Cắt Undercut hiện đại | 10,000,000₫ | 12% |
| **Nguyễn Văn Khánh** | *Ken Nguyen* | 0903.888.333 | ken.nguyen@salon.vn | Hoàn Kiếm | **SENIOR** | 4.5 năm | Nhuộm Tẩy Xám Khói, Nâu Lạnh, Mullet nam | 10,000,000₫ | 12% |
| **Lê Hoàng Huy** | *Leo Huy* | 0904.888.444 | leo.huy@salon.vn | Sài Gòn Q1 | **MASTER** | 7.0 năm | Uốn Con Sâu (Fly Perm), Pompadour cổ điển | 14,000,000₫ | 15% |
| **Phạm Văn Hưng** | *Harry Pham* | 0905.888.555 | harry.pham@salon.vn | Sài Gòn Q1 | **JUNIOR** | 2.0 năm | Cắt bấm cạo sạch sẽ, Gội dưỡng sinh, Chăm sóc da | 7,000,000₫ | 8% |

---

## 3. DANH SÁCH KHÁCH HÀNG TIÊU BIỂU (`users`)
*(Đã lược bỏ `username`, `password_hash`, `date_of_birth`, điểm thưởng, `total_spent`)*

| Họ Và Tên | Số Điện Thoại | Email Liên Hệ | Giới Tính | Tỉnh / Thành Phố | Hạng Thành Viên | Mã Voucher Cá Nhân | Trạng Thái |
| :--- | :--- | :--- | :---: | :--- | :---: | :---: | :---: |
| **Trần Quang Dũng** | 0912.777.888 | dung.tq@gmail.com | MALE | Hà Nội (Cầu Giấy) | **DIAMOND** | `VIP50K` | `ACTIVE` |
| **Nguyễn Minh Quân** | 0913.777.999 | quan.nm@gmail.com | MALE | Hà Nội (Hoàn Kiếm) | **GOLD** | `SUMMER2026` | `ACTIVE` |
| **Vũ Tuấn Kiệt** | 0914.888.000 | kiet.vt@gmail.com | MALE | TP. Hồ Chí Minh (Q1) | **SILVER** | `NEWBIE30K` | `ACTIVE` |
| **Hoàng Nhật Nam** | 0915.999.111 | nam.hn@gmail.com | MALE | Hà Nội (Ba Đình) | **STANDARD** | NULL | `ACTIVE` |

---

## 4. BẢN QUẢN TRỊ VIÊN & QUẢN LÝ (`admins`)

| Mã NV | Họ Và Tên | Tên Đăng Nhập | Email Quản Trị | Số Điện Thoại | Vai Trò | Chi Nhánh Phụ Trách | 2FA |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :---: |
| `NV-ADM-001` | **Nguyễn Văn Bách** | `admin_bach` | admin@salon.vn | 0909.000.999 | **SUPER_ADMIN** | Toàn hệ thống chuỗi | ĐÃ BẬT |
| `NV-MGR-002` | **Nguyễn Hoàng Long**| `mgr_caugiaay` | long.nh@salon.vn | 0912.333.444 | **SALON_MANAGER**| Cầu Giấy (Hà Nội) | ĐÃ BẬT |
| `NV-MGR-003` | **Lê Quốc Tuấn** | `mgr_saigon` | tuan.lq@salon.vn | 0914.555.666 | **SALON_MANAGER**| Sài Gòn Central (Q1) | ĐÃ BẬT |

---

## 5. MENU DỊCH VỤ SALON (`categories` & `service_offerings`)

### Danh mục: Cắt Tóc & Tạo Kiểu Nam (`CAT-HAIRCUT`)
| Mã Dịch Vụ | Tên Gói Dịch Vụ | Giá Niêm Yết | Thời Lượng | Mô Tả Quy Trình |
| :--- | :--- | :---: | :---: | :--- |
| `SRV-SHINE-COMBO` | **BachBarber Combo Đế Vương (7 Bước)** | **120,000₫** | 45 Phút | Rửa mặt sáng da -> Hút mụn kiềm dầu -> Cắt tóc tạo kiểu -> Gội đầu massage bấm huyệt -> Xả tóc mượt mà -> Sấy phồng tạo form -> Vuốt sáp cao cấp |
| `SRV-FADE-BASIC` | **Cắt Tóc Kiểu Skin Fade Chuyên Sâu** | **90,000₫** | 35 Phút | Cắt tông đơ cạo trắng chân tóc sát nét chuẩn Barber quốc tế |
| `SRV-CLEAN-SHAVE` | **Cạo Mặt Râu Nóng Bọt Mịn & Thư Giãn** | **50,000₫** | 20 Phút | Chườm khăn nóng thảo dược, bôi gel bọt cạo sạch êm dịu da |

### Danh mục: Uốn Tóc Định Hình Form (`CAT-PERM`)
| Mã Dịch Vụ | Tên Gói Dịch Vụ | Giá Niêm Yết | Thời Lượng | Mô Tả Quy Trình |
| :--- | :--- | :---: | :---: | :--- |
| `SRV-PERM-TEXTURED` | **Uốn Textured Layer Phồng Tự Nhiên** | **350,000₫** | 75 Phút | Sử dụng thuốc uốn Collagen hữu cơ Ý, tóc giữ nếp bồng bềnh 3-4 tháng |
| `SRV-PERM-FLY` | **Uốn Con Sâu Độc Lạ (Fly Perm)** | **450,000₫** | 90 Phút | Quấn giấy bạc sóng nhuyễn cá tính, tạo phong cách Streetwear đường phố |
| `SRV-PERM-DOWN` | **Ép Side Tóc Mai Cực Ôm (Down Perm)** | **150,000₫** | 30 Phút | Triệt tiêu hoàn toàn tóc mai chỉa 2 bên, giúp đầu nhỏ gọn gàng |

### Danh mục: Nhuộm Màu Xu Hướng (`CAT-COLOR`)
| Mã Dịch Vụ | Tên Gói Dịch Vụ | Giá Niêm Yết | Thời Lượng | Mô Tả Quy Trình |
| :--- | :--- | :---: | :---: | :--- |
| `SRV-COLOR-ASH` | **Nhuộm Xám Khói Thời Thượng (Kèm Tẩy)** | **550,000₫** | 120 Phút | Tẩy 2 nước nâng tông an toàn không xót da đầu + Phủ màu khói ánh kim |
| `SRV-COLOR-BROWN` | **Nhuộm Nâu Lạnh Lịch Lãm Công Sở** | **300,000₫** | 60 Phút | Tông màu trầm lịch lãm, đi làm đi học đều chuẩn chỉ, không cần tẩy |

---

## 6. DANH SÁCH LỊCH HẸN THEO PHÂN LOẠI TRẠNG THÁI (`bookings`)

### Nhóm 1: "ĐANG XÁC NHẬN" / "CHỜ XÁC NHẬN" (`PENDING`)
*(Khách vừa đặt lịch qua Web/App, đang chờ thanh toán qua SePay VietQR hoặc phiên thanh toán bị ngắt quãng, lưu tạm tại đây)*
- **Vé hẹn**: `BK-20260915-001`
  + **Khách hàng**: Trần Quang Dũng (0912.777.888)
  + **Chi nhánh**: Cầu Giấy | **Stylist**: Alex Bach
  + **Dịch vụ**: BachBarber Combo (120,000₫) + Uốn Textured Layer (350,000₫)
  + **Khung giờ**: 14:00 - 15:30 (Hôm nay)
  + **Tổng tiền**: 470,000₫ | Giảm voucher `VIP50K`: -50,000₫ | **Cần thanh toán**: **420,000₫**
  + **Tình trạng thanh toán**: `UNPAID` (Đang mở mã VietQR SePay chờ quét app ngân hàng)
  + **Ghi chú khách**: "Mình vào trễ 5 phút nhé, giữ chỗ giúp mình"

### Nhóm 2: "ĐÃ XÁC NHẬN" / "LỊCH CẮT TÓC" (`CONFIRMED` & `IN_PROGRESS`)
*(Đã thanh toán thành công hoặc salon đã duyệt tiếp nhận ca, sắp tới giờ cắt hoặc đang làm tại ghế)*
- **Vé hẹn 1**: `BK-20260915-002` (Trạng thái: `CONFIRMED`)
  + **Khách hàng**: Nguyễn Minh Quân (0913.777.999)
  + **Chi nhánh**: Hoàn Kiếm | **Stylist**: Ken Nguyen
  + **Dịch vụ**: Cắt Fade (90,000₫) + Nhuộm Nâu Lạnh (300,000₫)
  + **Khung giờ**: 16:00 - 17:30 (Chiều nay)
  + **Tổng thanh toán**: 390,000₫ | **Tình trạng**: `PAID` (Đã thanh toán VNPay lúc 10:15)
  + **Ghế phục vụ**: Ghế số 02
- **Vé hẹn 2**: `BK-20260915-003` (Trạng thái: `IN_PROGRESS` - Đang thực hiện)
  + **Khách hàng**: Vũ Tuấn Kiệt (0914.888.000)
  + **Chi nhánh**: Sài Gòn Q1 | **Stylist**: Leo Huy
  + **Dịch vụ**: Combo Đế Vương (120,000₫) + Uốn Con Sâu (450,000₫)
  + **Khung giờ**: 10:30 - 12:30 (Đang cuốn giấy bạc vào thuốc uốn)
  + **Tổng tiền**: 570,000₫ | **Tình trạng**: `PAID` (Chuyển khoản SePay VietQR)

### Nhóm 3: "ĐƠN HÀNG ĐÃ ĐẶT" / "ĐÃ HOÀN THÀNH" (`COMPLETED`)
*(Dịch vụ đã xong hoàn toàn, khách hài lòng ra về, được tính vào doanh số & hoa hồng thợ)*
- **Vé hẹn**: `BK-20260914-089` (Thực hiện hôm qua)
  + **Khách hàng**: Hoàng Nhật Nam (0915.999.111)
  + **Chi nhánh**: Cầu Giấy | **Stylist**: Tony Tran
  + **Dịch vụ**: BachBarber Combo 7 Bước (120,000₫)
  + **Giờ check-in thực tế**: 15:05 | **Check-out**: 15:50
  + **Đánh giá khách hàng**: ⭐⭐⭐⭐⭐ (5/5 sao - "Thợ Tony cắt tỉ mỉ, gội đầu rất thư giãn!")
  + **Hoa hồng Stylist Tony**: 14,400₫ (12%)

### Nhóm 4: "ĐÃ HỦY" (`CANCELLED`)
*(Lịch hẹn bị hủy bỏ bởi khách hoặc salon)*
- **Vé hẹn**: `BK-20260914-045`
  + **Khách hàng**: Khách vãng lai (0977.111.222)
  + **Lý do hủy**: Khách có lịch họp công ty đột xuất, hẹn dời sang tuần sau.

---

## 7. DANH MỤC SẢN PHẨM MỸ PHẨM SHOP (`products`)

| Mã SKU | Tên Sản Phẩm | Thương Hiệu | Danh Mục | Giá Bán Lẻ | Giá Gốc | Tồn Kho | Đặc Tính Nổi Bật |
| :--- | :--- | :--- | :--- | :---: | :---: | :---: | :--- |
| `WAX-HANZ-CLAY` | **Sáp Hanz de Fuko Claymation (56g)** | Hanz de Fuko (USA) | Sáp vuốt tóc | **520,000₫** | 560,000₫ | 45 Hộp | Giữ nếp siêu cứng (Super High Hold), Hoàn thiện mờ tự nhiên |
| `WAX-BLUM-MERK` | **Sáp Blumaan Tê Giác Meraki (74ml)** | Blumaan (USA) | Sáp vuốt tóc | **540,000₫** | 580,000₫ | 30 Lọ | Chứa tinh dầu bảo vệ nhiệt sấy phồng Pre-styling |
| `WAX-KM-ROUGH` | **Sáp Kevin Murphy Rough Rider (100g)**| Kevin Murphy (Úc) | Sáp vuốt tóc | **690,000₫** | 750,000₫ | 25 Hộp | Hương kẹo toffee thơm lừng, hút dầu da đầu cực tốt |
| `SPRAY-2VEE-300` | **Gôm Xịt Tóc 2Vee Hair Spray (300ml)**| 2Vee (Hàn Quốc) | Gôm xịt giữ nếp | **210,000₫** | 250,000₫ | 80 Chai | Khóa form nếp tóc cả ngày, không gây bết trắng |
| `SHAM-FOR-MEN` | **Dầu Gội Bạc Hà Mát Lạnh Sạch Gàu (400ml)**| BachBarber Care | Dầu gội nam | **180,000₫** | 220,000₫ | 120 Chai | Tinh chất tràm trà kiềm dầu & bạc hà mát lạnh sảng khoái |

---

## 8. DANH SÁCH MÃ VOUCHER ƯU ĐÃI (`vouchers`)

| Mã Voucher | Tên Chương Trình | Loại Giảm Giá | Giá Trị Giảm | Đơn Tối Thiểu | Giảm Tối Đa | Lượt Dùng | Áp Dụng Cho |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :--- |
| `VIP50K` | Ưu đãi Khách Thân Thiết Diamond/Gold | Tiền mặt | **50,000₫** | 300,000₫ | 50,000₫ | 500 lần | Đặt Lịch Làm Tóc |
| `SUMMER2026` | Chào Hè Sôi Động 2026 | Phần trăm (%) | **15%** | 200,000₫ | 100,000₫ | 1,000 lần | Cả Booking & Shop |
| `NEWBIE30K` | Quà Tặng Đặt Lịch Lần Đầu | Tiền mặt | **30,000₫** | 100,000₫ | 30,000₫ | 2,000 lần | Chỉ Đặt Lịch |
| `FREESHIP` | Miễn Phí Vận Chuyển Đơn Mỹ Phẩm | Tiền mặt | **30,000₫** | 400,000₫ | 30,000₫ | 1,000 lần | Đơn Hàng Shop |

---

## 9. TÀI KHOẢN NGÂN HÀNG TIẾP NHẬN SEPAY VIETQR (`bank_transfer_info`)

| Tên Ngân Hàng | Số Tài Khoản | Chủ Tài Khoản | Mã BIN Napas | Chi Nhánh Ngân Hàng | Cú Pháp Nội Dung Tự Động |
| :--- | :--- | :--- | :---: | :--- | :--- |
| **Vietcombank (VCB)** | `99882648888` | **NGUYEN VAN BACH** | `970436` | VCB Chi nhánh Thăng Long, Hà Nội | `SALON BK [Mã_Booking]` |
| **MBBank (MB)** | `09092649999` | **NGUYEN VAN BACH** | `970422` | MBBank Chi nhánh Cầu Giấy, Hà Nội | `SALON ORD [Mã_Đơn_Hàng]` |

---

## 10. HƯỚNG DẪN XÁC NHẬN & BƯỚC TIẾP THEO

> [!IMPORTANT]
> **Gửi tới Bạn:**  
> Toàn bộ bảng dữ liệu trên đã được thiết kế sát 100% với mô hình CSDL mới (Users không có username/password/ngày sinh/điểm, Stylist không có username/password, Bookings chia thành 4 nhóm rõ ràng).  
> 
> **Vui lòng kiểm tra và phản hồi xác nhận:**
> - Nếu bạn **đồng ý với bộ data này**, tôi sẽ tiến hành tạo script nạp dữ liệu (Data Seeding) trực tiếp vào cơ sở dữ liệu.
> - Nếu có bất kỳ thông tin nào cần bổ sung hoặc sửa đổi (ví dụ: đổi tên salon, thêm dịch vụ, đổi giá tiền...), hãy phản hồi để tôi cập nhật ngay!

