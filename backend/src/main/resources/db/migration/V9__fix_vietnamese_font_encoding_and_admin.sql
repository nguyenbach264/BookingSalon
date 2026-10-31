SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- 1. ADMINS
UPDATE admins SET full_name = 'Nguyễn Bách (CEO)' WHERE username = 'admin.bach';
UPDATE admins SET full_name = 'Trần Quản Lý' WHERE username = 'admin.manager';

-- 2. SALONS
UPDATE salons SET salon_name = 'BachBarber - Cầu Giấy', salon_address = '52 Trần Thái Tông, Cầu Giấy, Hà Nội', city = 'Hà Nội' WHERE email = 'caugiay@bachbarber.vn' OR salon_id = UNHEX('39D539432D1742718A2832505C5649C2');
UPDATE salons SET salon_name = 'BachBarber - Hoàn Kiếm', salon_address = '18 Lý Thái Tổ, Hoàn Kiếm, Hà Nội', city = 'Hà Nội' WHERE email = 'hoankiem@bachbarber.vn' OR salon_id = UNHEX('E15C4710FAAC4A75AC969C4B5F8854BF');
UPDATE salons SET salon_name = 'BachBarber - Sài Gòn Q1', salon_address = '75 Nguyễn Huệ, Quận 1, TP.HCM', city = 'TP.HCM' WHERE email = 'saigon@bachbarber.vn' OR salon_id = UNHEX('C01633C3C872408781212ABE77F8964C');

-- 3. CATEGORIES
UPDATE categories SET category_name = 'Dịch vụ tóc' WHERE category_id = UNHEX('12DFB23A3E054D5FB7D0E4CFDAD3B0F0') OR category_name LIKE '%t?c%' OR category_name LIKE '%DA%tA%';
UPDATE categories SET category_name = 'Thư giãn & Chăm sóc' WHERE category_id = UNHEX('E6186F3AF0FC4E44BE052496DE9AEB87') OR category_name LIKE '%gi?n%' OR category_name LIKE '%ThA%giA%';
UPDATE categories SET category_name = 'Chăm sóc râu' WHERE category_id = UNHEX('FDA6E21033B148B7BA328DFA6041E456') OR category_name LIKE '%r?u%' OR category_name LIKE '%ChA%rA%';

-- 4. PRODUCT CATEGORIES
UPDATE product_categories SET name = 'Sáp tạo kiểu', description = 'Các loại wax, pomade, clay tạo kiểu tóc chuyên nghiệp' WHERE slug = 'sap-tao-kieu';
UPDATE product_categories SET name = 'Chăm sóc tóc', description = 'Dầu gội, dầu xả, serum chăm sóc tóc cao cấp' WHERE slug = 'cham-soc-toc';
UPDATE product_categories SET name = 'Pre-styling & Xịt giữ nếp', description = 'Xịt tạo phồng bảo vệ nhiệt máy sấy, gôm xịt cố định form tóc bền đẹp' WHERE slug = 'pre-styling-xit-giu-nep';
UPDATE product_categories SET name = 'Dụng cụ & Máy tạo kiểu', description = 'Tông đơ fade pin cao cấp, máy sấy tạo kiểu ion ấm và lược tạo texture' WHERE slug = 'dung-cu-may-tao-kieu';
UPDATE product_categories SET name = 'Dưỡng râu & Cạo râu', description = 'Kem cạo râu bọt mịn, tinh dầu dưỡng mềm râu và dao cạo barber chuyên dụng' WHERE slug = 'duong-rau-cao-rau';
UPDATE product_categories SET name = 'Phụ kiện & Tóc giả', description = 'Băng đô, kẹp tóc, cuộn tóc, tóc giả cao cấp' WHERE slug = 'phu-kien-toc';
UPDATE product_categories SET name = 'Chăm sóc da & Mặt', description = 'Sữa rửa mặt, toner, serum dưỡng da cho nam' WHERE slug = 'cham-soc-da-mat';
UPDATE product_categories SET name = 'Chăm sóc da đầu', description = 'Serum mọc tóc, tinh dầu da đầu, kem trị gàu' WHERE slug = 'cham-soc-da-dau';

-- 5. STYLISTS
UPDATE stylists SET full_name = 'Alex Bach', bio = 'Master stylist với hơn 8 năm kinh nghiệm. Chuyên gia về cắt fade và undercut Hàn Quốc.', specialties = 'Fade, Undercut, Pompadour, Korean Style' WHERE username = 'alex.bach';
UPDATE stylists SET full_name = 'Tony Trần', bio = 'Senior stylist 5 năm kinh nghiệm. Thế mạnh: nhuộm highlight và ombre tóc nam.', specialties = 'Nhuộm tóc, Highlight, Ombre, Uốn xoăn' WHERE username = 'tony.tran';
UPDATE stylists SET full_name = 'Ken Nguyễn', bio = 'Senior stylist tại Hoàn Kiếm. Nổi tiếng với kỹ thuật tẩy nhuộm màu xám khói, nâu lạnh.', specialties = 'Tẩy tóc, Nhuộm khói, Layer nam' WHERE username = 'ken.nguyen';
UPDATE stylists SET full_name = 'Leo Huy', bio = 'Master stylist Sài Gòn. Chuyên gia về tóc tết, hai block và phong cách Street.', specialties = 'Two Block, Tóc tết, Street Style, Buzz Cut' WHERE username = 'leo.huy';
UPDATE stylists SET full_name = 'Harry Phạm', bio = 'Junior stylist năng động tại Sài Gòn. Học trò xuất sắc của Master Leo.', specialties = 'Fade, Basic Cut, Gội đầu massage' WHERE username = 'harry.pham';

-- 6. USERS
UPDATE users SET full_name = 'Nguyễn Văn Minh', city = 'Hà Nội', district = 'Cầu Giấy', ward = 'Dịch Vọng' WHERE username = 'nguyen.van.minh';
UPDATE users SET full_name = 'Trần Thị Lan', city = 'Hà Nội', district = 'Hoàn Kiếm', ward = 'Hàng Bạc' WHERE username = 'tran.thi.lan';
UPDATE users SET full_name = 'Lê Văn Hùng', city = 'TP.HCM', district = 'Quận 1', ward = 'Bến Nghé' WHERE username = 'le.van.hung';
UPDATE users SET full_name = 'Phạm Thị Hoa', city = 'TP.HCM', district = 'Quận 3', ward = 'Võ Thị Sáu' WHERE username = 'pham.thi.hoa';
UPDATE users SET full_name = 'Nguyễn Thanh Tuấn' WHERE username = 'tuannt';
UPDATE users SET full_name = 'Bách Nguyễn Tiến' WHERE username = 'bachnt';
UPDATE users SET full_name = 'Nguyễn Tiến Bách' WHERE username = 'bach';
UPDATE users SET full_name = 'Hiếu Trần Quang' WHERE username = 'nguyenbach';

-- 7. SERVICE OFFERINGS
UPDATE service_offerings SET name = 'Cắt tóc nam chuẩn BachBarber', description = 'Cắt tóc theo phong cách hiện đại, tư vấn kiểu phù hợp khuôn mặt, gội đầu massage thư giãn sau cắt.' WHERE service_offering_id = UNHEX('415CA15C05864E4B933D01767BB39579') OR name LIKE '%chu?n%';
UPDATE service_offerings SET name = 'Cắt Fade + Undercut', description = 'Kỹ thuật fade (low/mid/high) kết hợp undercut tạo độ sắc nét tối đa, phù hợp phong cách street và Hàn Quốc.' WHERE service_offering_id = UNHEX('13BD8DDA68934C7EA9E69B1471BD36B2') OR name LIKE '%Fade + Undercut%';
UPDATE service_offerings SET name = 'Uốn tóc Hàn Quốc', description = 'Uốn xoăn nhẹ phong cách Hàn Quốc, tóc bồng bềnh tự nhiên không cứng. Bao gồm dưỡng ẩm sau uốn.' WHERE service_offering_id = UNHEX('837C0E494C05469CB70FD574A1CA5F6D') OR name LIKE '%Hn Qu?c%';
UPDATE service_offerings SET name = 'Gội đầu dưỡng sinh massage', description = 'Gội đầu thảo dược tự nhiên kết hợp massage bấm huyệt cổ vai gáy giải tỏa căng thẳng.' WHERE service_offering_id = UNHEX('9A934E27419A4DB98450148DDC5BCE37') OR name LIKE '%du?ng sinh%';
UPDATE service_offerings SET name = 'Chăm sóc & Cạo râu cổ điển', description = 'Khăn nóng xông mặt, tạo bọt kem cạo râu ấm, cạo sạch bằng dao bén và thoa tinh dầu dưỡng mềm da.' WHERE service_offering_id = UNHEX('D5FE8170DBCF43FF8850C758CE616999') OR name LIKE '%C?o ru%';
UPDATE service_offerings SET name = 'Combo Cắt + Gội + Massage VIP', description = 'Gói phục vụ trọn gói cao cấp nhất: Cắt tóc, gội dưỡng sinh 30 phút, đắp mặt nạ và sấy tạo kiểu bằng sáp xịn.' WHERE service_offering_id = UNHEX('BC1CD8611F364E3EBE474D547743CDE1') OR name LIKE '%Massage VIP%';