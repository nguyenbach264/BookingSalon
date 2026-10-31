SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ========================================================
-- 1. Remove duplicate stylist_services referencing obsolete duplicate stylist records
-- ========================================================
DELETE FROM stylist_services WHERE stylist_id IN (
    0x415CA15C05864E4B933D01767BB39579,
    0x80DCABF80ACA4BF0A3AF47D4231BF9D4,
    0xB5E400BE3E5542A6B79861489E0856BE,
    0xC12A02C2F04242288AE4F9F87FE345AE,
    0xF505507015954E87803E6F4F9815CEF1
);

-- ========================================================
-- 2. Remove obsolete duplicate stylist records (0 bookings)
-- ========================================================
DELETE FROM stylists WHERE stylist_id IN (
    0x415CA15C05864E4B933D01767BB39579,
    0x80DCABF80ACA4BF0A3AF47D4231BF9D4,
    0xB5E400BE3E5542A6B79861489E0856BE,
    0xC12A02C2F04242288AE4F9F87FE345AE,
    0xF505507015954E87803E6F4F9815CEF1
);

-- In case there are any other duplicate stylists by username, remove older ones without bookings
DELETE s1 FROM stylists s1
JOIN stylists s2 ON s1.username = s2.username AND s1.created_at < s2.created_at
WHERE NOT EXISTS (SELECT 1 FROM bookings b WHERE b.stylist_id = s1.stylist_id);

-- ========================================================
-- 3. Add UNIQUE constraint on stylists(username) if not exists
-- ========================================================
SET @dbname = DATABASE();
SET @tablename = 'stylists';
SET @constraintname = 'uq_stylists_username';
SET @preparedStatement = (SELECT IF(
    (
        SELECT COUNT(*) FROM INFORMATION_SCHEMA.STATISTICS
        WHERE TABLE_SCHEMA = @dbname
          AND TABLE_NAME = @tablename
          AND INDEX_NAME = @constraintname
    ) > 0,
    'SELECT 1',
    'ALTER TABLE stylists ADD CONSTRAINT uq_stylists_username UNIQUE (username)'
));
PREPARE addConstraint FROM @preparedStatement;
EXECUTE addConstraint;
DEALLOCATE PREPARE addConstraint;

-- ========================================================
-- 4. Re-enforce pristine UTF-8 Vietnamese names and bios
-- ========================================================
UPDATE stylists SET full_name = 'Alex Bach', bio = 'Master stylist với hơn 8 năm kinh nghiệm. Chuyên gia về cắt fade và undercut Hàn Quốc.', specialties = 'Fade, Undercut, Pompadour, Korean Style' WHERE username = 'alex.bach';
UPDATE stylists SET full_name = 'Tony Trần', bio = 'Senior stylist 5 năm kinh nghiệm. Thế mạnh: nhuộm highlight và ombre tóc nam.', specialties = 'Nhuộm tóc, Highlight, Ombre, Uốn xoăn' WHERE username = 'tony.tran';
UPDATE stylists SET full_name = 'Ken Nguyễn', bio = 'Senior stylist tại Hoàn Kiếm. Nổi tiếng với kỹ thuật tẩy nhuộm màu xám khói, nâu lạnh.', specialties = 'Tẩy tóc, Nhuộm khói, Layer nam' WHERE username = 'ken.nguyen';
UPDATE stylists SET full_name = 'Leo Huy', bio = 'Master stylist Sài Gòn. Chuyên gia về tóc tết, hai block và phong cách Street.', specialties = 'Two Block, Tóc tết, Street Style, Buzz Cut' WHERE username = 'leo.huy';
UPDATE stylists SET full_name = 'Harry Phạm', bio = 'Junior stylist năng động tại Sài Gòn. Học trò xuất sắc của Master Leo.', specialties = 'Fade, Basic Cut, Gội đầu massage' WHERE username = 'harry.pham';

