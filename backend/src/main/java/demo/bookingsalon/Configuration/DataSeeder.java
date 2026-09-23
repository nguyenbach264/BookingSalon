package demo.bookingsalon.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import demo.bookingsalon.Entity.Admin;
import demo.bookingsalon.Entity.BankTransferInfo;
import demo.bookingsalon.Entity.Booking;
import demo.bookingsalon.Entity.BookingDetail;
import demo.bookingsalon.Entity.Cart;
import demo.bookingsalon.Entity.Category;
import demo.bookingsalon.Entity.Product;
import demo.bookingsalon.Entity.ProductCategory;
import demo.bookingsalon.Entity.Salon;
import demo.bookingsalon.Entity.ServiceOffering;
import demo.bookingsalon.Entity.Stylist;
import demo.bookingsalon.Entity.StylistService;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Repository.AdminRepository;
import demo.bookingsalon.Repository.BankTransferInfoRepository;
import demo.bookingsalon.Repository.BookingDetailRepository;
import demo.bookingsalon.Repository.BookingRepository;
import demo.bookingsalon.Repository.CartRepository;
import demo.bookingsalon.Repository.CategoryRepository;
import demo.bookingsalon.Repository.ProductCategoryRepository;
import demo.bookingsalon.Repository.ProductRepository;
import demo.bookingsalon.Repository.SalonRepository;
import demo.bookingsalon.Repository.ServiceOfferingRepository;
import demo.bookingsalon.Repository.StylistRepository;
import demo.bookingsalon.Repository.StylistServiceRepository;
import demo.bookingsalon.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final SalonRepository salonRepository;
    private final CategoryRepository categoryRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final UserRepository userRepository;
    private final StylistRepository stylistRepository;
    private final AdminRepository adminRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final StylistServiceRepository stylistServiceRepository;
    private final ProductRepository productRepository;
    private final CartRepository cartRepository;
    private final BookingRepository bookingRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final BankTransferInfoRepository bankTransferInfoRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        if (salonRepository.count() > 0) {
            log.info("✅ DataSeeder: Database already has salons.");
            if (bookingRepository.count() < 15) {
                log.info("🌱 DataSeeder: Expanding rich booking data for all stylists...");
                seedAdditionalBookings();
            } else {
                log.info("✅ DataSeeder: Database already has sufficient booking data — skipping seed.");
            }
            return;
        }

        log.info("🌱 DataSeeder: Starting data seeding...");

        // ── 1. SALONS ─────────────────────────────────────────────────────────
        Salon salonCauGiay = salonRepository.save(Salon.builder()
                .salonName("BachBarber - Cầu Giấy")
                .address("52 Trần Thái Tông, Cầu Giấy, Hà Nội")
                .openTime(LocalTime.of(8, 0))
                .closeTime(LocalTime.of(21, 0))
                .phoneNumber("0901234567")
                .email("caugiay@bachbarber.vn")
                .city("Hà Nội")
                .enabled(true)
                .build());

        Salon salonHoanKiem = salonRepository.save(Salon.builder()
                .salonName("BachBarber - Hoàn Kiếm")
                .address("18 Lý Thái Tổ, Hoàn Kiếm, Hà Nội")
                .openTime(LocalTime.of(8, 30))
                .closeTime(LocalTime.of(21, 30))
                .phoneNumber("0907654321")
                .email("hoankiem@bachbarber.vn")
                .city("Hà Nội")
                .enabled(true)
                .build());

        Salon salonSaigon = salonRepository.save(Salon.builder()
                .salonName("BachBarber - Sài Gòn Q1")
                .address("75 Nguyễn Huệ, Quận 1, TP.HCM")
                .openTime(LocalTime.of(7, 30))
                .closeTime(LocalTime.of(22, 0))
                .phoneNumber("0909876543")
                .email("saigon@bachbarber.vn")
                .city("TP.HCM")
                .enabled(true)
                .build());

        log.info("✅ Salons seeded: 3 salons");

        // ── 2. SERVICE CATEGORIES ─────────────────────────────────────────────
        Category catToc = categoryRepository.save(Category.builder()
                .categoryName("Dịch vụ tóc")
                .image("https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop")
                .build());

        Category catChamSoc = categoryRepository.save(Category.builder()
                .categoryName("Thư giãn & Chăm sóc")
                .image("https://images.unsplash.com/photo-1516975080661-46bfa33f93a1?w=400&auto=format&fit=crop")
                .build());

        Category catBeard = categoryRepository.save(Category.builder()
                .categoryName("Chăm sóc râu")
                .image("https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop")
                .build());

        log.info("✅ Service categories seeded: 3 categories");

        // ── 3. PRODUCT CATEGORIES ─────────────────────────────────────────────
        ProductCategory pcWax = productCategoryRepository.save(ProductCategory.builder()
                .name("Sáp tạo kiểu")
                .slug("sap-tao-kieu")
                .description("Các loại wax, pomade, clay tạo kiểu tóc chuyên nghiệp")
                .imageUrl("https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop")
                .build());

        ProductCategory pcCare = productCategoryRepository.save(ProductCategory.builder()
                .name("Chăm sóc tóc")
                .slug("cham-soc-toc")
                .description("Dầu gội, dầu xả, serum chăm sóc tóc cao cấp")
                .imageUrl("https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop")
                .build());

        log.info("✅ Product categories seeded: 2 categories");

        // ── 4. USERS (customers) ──────────────────────────────────────────────
        // Note: keycloak_id values are placeholder UUIDs. In production these
        // are set during the first OAuth2 login via Keycloak.
        User userMinh = userRepository.save(User.builder()
                .keycloakId(UUID.fromString("aaaaaaaa-0001-0001-0001-aaaaaaaaaaaa"))
                .username("nguyen.van.minh")
                .fullName("Nguyễn Văn Minh")
                .email("minh.nguyen@gmail.com")
                .phoneNumber("0912345678")
                .gender("MALE")
                .city("Hà Nội")
                .district("Cầu Giấy")
                .ward("Dịch Vọng")
                .membershipTier("GOLD")
                .status("ACTIVE")
                .emailVerified(true)
                .phoneVerified(true)
                .enabled(true)
                .build());

        User userLan = userRepository.save(User.builder()
                .keycloakId(UUID.fromString("bbbbbbbb-0002-0002-0002-bbbbbbbbbbbb"))
                .username("tran.thi.lan")
                .fullName("Trần Thị Lan")
                .email("lan.tran@gmail.com")
                .phoneNumber("0987654321")
                .gender("FEMALE")
                .city("Hà Nội")
                .district("Hoàn Kiếm")
                .ward("Hàng Bạc")
                .membershipTier("SILVER")
                .voucherCode("SUMMER2026")
                .status("ACTIVE")
                .emailVerified(true)
                .phoneVerified(false)
                .enabled(true)
                .build());

        User userHung = userRepository.save(User.builder()
                .keycloakId(UUID.fromString("cccccccc-0003-0003-0003-cccccccccccc"))
                .username("le.van.hung")
                .fullName("Lê Văn Hùng")
                .email("hung.le@hotmail.com")
                .phoneNumber("0908765432")
                .gender("MALE")
                .city("TP.HCM")
                .district("Quận 1")
                .ward("Bến Nghé")
                .membershipTier("STANDARD")
                .status("ACTIVE")
                .emailVerified(true)
                .phoneVerified(true)
                .enabled(true)
                .build());

        User userHoa = userRepository.save(User.builder()
                .keycloakId(UUID.fromString("dddddddd-0004-0004-0004-dddddddddddd"))
                .username("pham.thi.hoa")
                .fullName("Phạm Thị Hoa")
                .email("hoa.pham@yahoo.com")
                .phoneNumber("0931234567")
                .gender("FEMALE")
                .city("TP.HCM")
                .district("Quận 3")
                .ward("Võ Thị Sáu")
                .membershipTier("VIP")
                .voucherCode("VIP50K")
                .status("ACTIVE")
                .emailVerified(true)
                .phoneVerified(true)
                .enabled(true)
                .build());

        log.info("✅ Users seeded: 4 customers");

        // ── 5. STYLISTS ───────────────────────────────────────────────────────
        Stylist alexBach = stylistRepository.save(Stylist.builder()
                .keycloakId(UUID.fromString("11111111-aaaa-aaaa-aaaa-111111111111"))
                .username("alex.bach")
                .fullName("Alex Bach")
                .nickname("Alex")
                .email("alex.bach@bachbarber.vn")
                .phoneNumber("0901111111")
                .bio("Master stylist với hơn 8 năm kinh nghiệm. Chuyên gia về cắt fade và undercut Hàn Quốc.")
                .experienceYears(BigDecimal.valueOf(8.5))
                .specialties("Fade, Undercut, Pompadour, Korean Style")
                .levelRank("MASTER")
                .ratingAverage(BigDecimal.valueOf(4.95))
                .totalReviewsCount(312)
                .totalServedBookings(1840)
                .baseSalary(BigDecimal.valueOf(15_000_000))
                .commissionRate(BigDecimal.valueOf(25.00))
                .tipBalance(BigDecimal.valueOf(2_500_000))
                .joinDate(LocalDate.of(2018, 3, 15))
                .workShiftType("FULL_TIME")
                .maxParallelSlots(1)
                .isFeatured(true)
                .status("ACTIVE")
                .avatarUrl("https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop")
                .enabled(true)
                .salon(salonCauGiay)
                .build());

        Stylist tonyTran = stylistRepository.save(Stylist.builder()
                .keycloakId(UUID.fromString("22222222-bbbb-bbbb-bbbb-222222222222"))
                .username("tony.tran")
                .fullName("Tony Trần")
                .nickname("Tony")
                .email("tony.tran@bachbarber.vn")
                .phoneNumber("0902222222")
                .bio("Senior stylist 5 năm kinh nghiệm. Thế mạnh: nhuộm highlight và ombre tóc nam.")
                .experienceYears(BigDecimal.valueOf(5.0))
                .specialties("Nhuộm tóc, Highlight, Ombre, Uốn xoăn")
                .levelRank("SENIOR")
                .ratingAverage(BigDecimal.valueOf(4.80))
                .totalReviewsCount(198)
                .totalServedBookings(1120)
                .baseSalary(BigDecimal.valueOf(12_000_000))
                .commissionRate(BigDecimal.valueOf(20.00))
                .tipBalance(BigDecimal.valueOf(800_000))
                .joinDate(LocalDate.of(2020, 6, 1))
                .workShiftType("FULL_TIME")
                .maxParallelSlots(1)
                .isFeatured(true)
                .status("ACTIVE")
                .avatarUrl("https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop")
                .enabled(true)
                .salon(salonCauGiay)
                .build());

        Stylist kenNguyen = stylistRepository.save(Stylist.builder()
                .keycloakId(UUID.fromString("33333333-cccc-cccc-cccc-333333333333"))
                .username("ken.nguyen")
                .fullName("Ken Nguyễn")
                .nickname("Ken")
                .email("ken.nguyen@bachbarber.vn")
                .phoneNumber("0903333333")
                .bio("Senior stylist tại Hoàn Kiếm. Chuyên cắt tóc classic và cạo râu truyền thống.")
                .experienceYears(BigDecimal.valueOf(4.0))
                .specialties("Classic Cut, Beard Trim, Shaving")
                .levelRank("SENIOR")
                .ratingAverage(BigDecimal.valueOf(4.75))
                .totalReviewsCount(145)
                .totalServedBookings(890)
                .baseSalary(BigDecimal.valueOf(11_000_000))
                .commissionRate(BigDecimal.valueOf(18.00))
                .tipBalance(BigDecimal.valueOf(600_000))
                .joinDate(LocalDate.of(2021, 1, 10))
                .workShiftType("FULL_TIME")
                .maxParallelSlots(1)
                .isFeatured(false)
                .status("ACTIVE")
                .avatarUrl("https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop")
                .enabled(true)
                .salon(salonHoanKiem)
                .build());

        Stylist leoHuy = stylistRepository.save(Stylist.builder()
                .keycloakId(UUID.fromString("44444444-dddd-dddd-dddd-444444444444"))
                .username("leo.huy")
                .fullName("Leo Huy")
                .nickname("Leo")
                .email("leo.huy@bachbarber.vn")
                .phoneNumber("0904444444")
                .bio("Master stylist Sài Gòn. Chuyên gia về tóc tết, hai block và phong cách Street.")
                .experienceYears(BigDecimal.valueOf(7.0))
                .specialties("Two Block, Tóc tết, Street Style, Buzz Cut")
                .levelRank("MASTER")
                .ratingAverage(BigDecimal.valueOf(4.90))
                .totalReviewsCount(267)
                .totalServedBookings(1520)
                .baseSalary(BigDecimal.valueOf(14_000_000))
                .commissionRate(BigDecimal.valueOf(22.00))
                .tipBalance(BigDecimal.valueOf(1_800_000))
                .joinDate(LocalDate.of(2019, 9, 1))
                .workShiftType("FULL_TIME")
                .maxParallelSlots(1)
                .isFeatured(true)
                .status("ACTIVE")
                .avatarUrl("https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop")
                .enabled(true)
                .salon(salonSaigon)
                .build());

        Stylist harryPham = stylistRepository.save(Stylist.builder()
                .keycloakId(UUID.fromString("55555555-eeee-eeee-eeee-555555555555"))
                .username("harry.pham")
                .fullName("Harry Phạm")
                .nickname("Harry")
                .email("harry.pham@bachbarber.vn")
                .phoneNumber("0905555555")
                .bio("Junior stylist năng động tại Sài Gòn. Học trò xuất sắc của Master Leo.")
                .experienceYears(BigDecimal.valueOf(1.5))
                .specialties("Fade, Basic Cut, Gội đầu massage")
                .levelRank("JUNIOR")
                .ratingAverage(BigDecimal.valueOf(4.60))
                .totalReviewsCount(48)
                .totalServedBookings(210)
                .baseSalary(BigDecimal.valueOf(8_000_000))
                .commissionRate(BigDecimal.valueOf(12.00))
                .tipBalance(BigDecimal.valueOf(200_000))
                .joinDate(LocalDate.of(2025, 3, 1))
                .workShiftType("FULL_TIME")
                .maxParallelSlots(1)
                .isFeatured(false)
                .status("ACTIVE")
                .avatarUrl("https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&auto=format&fit=crop")
                .enabled(true)
                .salon(salonSaigon)
                .build());

        log.info("✅ Stylists seeded: 5 stylists");

        // ── 6. ADMINS ─────────────────────────────────────────────────────────
        adminRepository.save(Admin.builder()
                .keycloakId(UUID.fromString("99999999-0001-0001-0001-999999999999"))
                .username("admin.bach")
                .fullName("Nguyễn Bách (CEO)")
                .email("bach@bachbarber.vn")
                .phoneNumber("0901999888")
                .enabled(true)
                .build());

        adminRepository.save(Admin.builder()
                .keycloakId(UUID.fromString("99999999-0002-0002-0002-999999999999"))
                .username("admin.manager")
                .fullName("Trần Quản Lý")
                .email("manager@bachbarber.vn")
                .phoneNumber("0902999777")
                .enabled(true)
                .build());

        log.info("✅ Admins seeded: 2 admins");

        // ── 7. SERVICE OFFERINGS ──────────────────────────────────────────────
        ServiceOffering svcCatToc = serviceOfferingRepository.save(ServiceOffering.builder()
                .name("Cắt tóc nam chuẩn BachBarber")
                .description("Cắt tóc theo phong cách hiện đại, tư vấn kiểu phù hợp khuôn mặt, gội đầu massage thư giãn sau cắt.")
                .price(BigDecimal.valueOf(120_000))
                .duration(45)
                .image("https://images.unsplash.com/photo-1598524374912-628cbcddbc1f?w=500&auto=format&fit=crop")
                .usageCount(2450)
                .rating(4.9)
                .category(catToc)
                .salon(salonCauGiay)
                .build());

        ServiceOffering svcFade = serviceOfferingRepository.save(ServiceOffering.builder()
                .name("Cắt Fade + Undercut")
                .description("Kỹ thuật fade (low/mid/high) kết hợp undercut tạo độ sắc nét tối đa, phù hợp phong cách street và Hàn Quốc.")
                .price(BigDecimal.valueOf(180_000))
                .duration(60)
                .image("https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop")
                .usageCount(1820)
                .rating(4.95)
                .category(catToc)
                .salon(salonCauGiay)
                .build());

        ServiceOffering svcUon = serviceOfferingRepository.save(ServiceOffering.builder()
                .name("Uốn tóc Hàn Quốc")
                .description("Uốn xoăn nhẹ phong cách Hàn Quốc, tóc bồng bềnh tự nhiên không cứng. Bao gồm dưỡng ẩm sau uốn.")
                .price(BigDecimal.valueOf(350_000))
                .duration(120)
                .image("https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=500&auto=format&fit=crop")
                .usageCount(780)
                .rating(4.85)
                .category(catToc)
                .salon(salonHoanKiem)
                .build());

        ServiceOffering svcNhuom = serviceOfferingRepository.save(ServiceOffering.builder()
                .name("Nhuộm tóc thời trang")
                .description("Nhuộm màu highlight, ombre, balayage với thuốc nhuộm cao cấp Wella/L'Oreal. Tư vấn màu sắc cá nhân.")
                .price(BigDecimal.valueOf(480_000))
                .duration(150)
                .image("https://images.unsplash.com/photo-1519823551278-64ac92734fb1?w=500&auto=format&fit=crop")
                .usageCount(650)
                .rating(4.80)
                .category(catToc)
                .salon(salonCauGiay)
                .build());

        ServiceOffering svcGoiDau = serviceOfferingRepository.save(ServiceOffering.builder()
                .name("Gội đầu massage VIP")
                .description("Gội đầu thư giãn với tinh dầu thiên nhiên, massage đầu 30 phút, ủ tóc phục hồi chuyên sâu.")
                .price(BigDecimal.valueOf(150_000))
                .duration(60)
                .image("https://images.unsplash.com/photo-1516975080661-46bfa33f93a1?w=500&auto=format&fit=crop")
                .usageCount(1350)
                .rating(4.88)
                .category(catChamSoc)
                .salon(salonCauGiay)
                .build());

        ServiceOffering svcChamSocDa = serviceOfferingRepository.save(ServiceOffering.builder()
                .name("Chăm sóc da mặt cơ bản")
                .description("Làm sạch sâu lỗ chân lông, đắp mặt nạ dưỡng ẩm, tẩy da chết nhẹ nhàng phù hợp da nam.")
                .price(BigDecimal.valueOf(200_000))
                .duration(75)
                .image("https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=500&auto=format&fit=crop")
                .usageCount(420)
                .rating(4.75)
                .category(catChamSoc)
                .salon(salonSaigon)
                .build());

        ServiceOffering svcCaoRau = serviceOfferingRepository.save(ServiceOffering.builder()
                .name("Cạo râu cổ điển Straight Razor")
                .description("Cạo râu bằng dao cổ điển, kem cạo râu hảo hạng, khăn nóng thư giãn cơ mặt. Trải nghiệm barber đích thực.")
                .price(BigDecimal.valueOf(130_000))
                .duration(40)
                .image("https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=500&auto=format&fit=crop")
                .usageCount(560)
                .rating(4.92)
                .category(catBeard)
                .salon(salonHoanKiem)
                .build());

        ServiceOffering svcTrimRau = serviceOfferingRepository.save(ServiceOffering.builder()
                .name("Tỉa & tạo hình râu")
                .description("Tạo hình râu theo ý muốn, tỉa gọn, làm sạch đường viền. Bao gồm dưỡng beard oil sau tạo kiểu.")
                .price(BigDecimal.valueOf(100_000))
                .duration(30)
                .image("https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=500&auto=format&fit=crop")
                .usageCount(380)
                .rating(4.87)
                .category(catBeard)
                .salon(salonSaigon)
                .build());

        log.info("✅ Service offerings seeded: 8 services");

        // ── 8. STYLIST ↔ SERVICE MAPPINGS ─────────────────────────────────────
        stylistServiceRepository.save(StylistService.builder().stylist(alexBach).serviceOffering(svcCatToc).build());
        stylistServiceRepository.save(StylistService.builder().stylist(alexBach).serviceOffering(svcFade).build());
        stylistServiceRepository.save(StylistService.builder().stylist(alexBach).serviceOffering(svcGoiDau).build());
        stylistServiceRepository.save(StylistService.builder().stylist(tonyTran).serviceOffering(svcCatToc).build());
        stylistServiceRepository.save(StylistService.builder().stylist(tonyTran).serviceOffering(svcUon).build());
        stylistServiceRepository.save(StylistService.builder().stylist(tonyTran).serviceOffering(svcNhuom).build());
        stylistServiceRepository.save(StylistService.builder().stylist(kenNguyen).serviceOffering(svcCatToc).build());
        stylistServiceRepository.save(StylistService.builder().stylist(kenNguyen).serviceOffering(svcCaoRau).build());
        stylistServiceRepository.save(StylistService.builder().stylist(kenNguyen).serviceOffering(svcTrimRau).build());
        stylistServiceRepository.save(StylistService.builder().stylist(leoHuy).serviceOffering(svcCatToc).build());
        stylistServiceRepository.save(StylistService.builder().stylist(leoHuy).serviceOffering(svcFade).build());
        stylistServiceRepository.save(StylistService.builder().stylist(leoHuy).serviceOffering(svcChamSocDa).build());
        stylistServiceRepository.save(StylistService.builder().stylist(harryPham).serviceOffering(svcCatToc).build());
        stylistServiceRepository.save(StylistService.builder().stylist(harryPham).serviceOffering(svcGoiDau).build());

        log.info("✅ Stylist-service mappings seeded: 14 mappings");

        // ── 9. PRODUCTS ───────────────────────────────────────────────────────
        productRepository.save(Product.builder()
                .name("Hanz de Fuko Quicksand")
                .slug("hanz-de-fuko-quicksand")
                .description("Wax tạo kiểu siêu nhẹ, độ giữ nếp cao, kết thúc mờ tự nhiên. Thích hợp tóc mỏng và mái lỏng.")
                .price(BigDecimal.valueOf(420_000))
                .originalPrice(BigDecimal.valueOf(480_000))
                .stockQuantity(85)
                .imageUrl("https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop")
                .rating(4.9)
                .reviewCount(124)
                .soldCount(876)
                .active(true)
                .category(pcWax)
                .build());

        productRepository.save(Product.builder()
                .name("Blumaan Fifth Sample Clay")
                .slug("blumaan-fifth-sample-clay")
                .description("Clay tạo kiểu với độ giữ nếp trung bình cao, bề mặt mờ tự nhiên. Công thức gốc nước, dễ gội sạch.")
                .price(BigDecimal.valueOf(380_000))
                .originalPrice(BigDecimal.valueOf(420_000))
                .stockQuantity(62)
                .imageUrl("https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop")
                .rating(4.85)
                .reviewCount(89)
                .soldCount(543)
                .active(true)
                .category(pcWax)
                .build());

        productRepository.save(Product.builder()
                .name("Kevin Murphy Rough Rider")
                .slug("kevin-murphy-rough-rider")
                .description("Paste tạo kiểu với kết cấu thô, độ giữ nếp cực mạnh. Phù hợp cho kiểu tóc messy và quiff.")
                .price(BigDecimal.valueOf(520_000))
                .originalPrice(BigDecimal.valueOf(590_000))
                .stockQuantity(41)
                .imageUrl("https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop")
                .rating(4.88)
                .reviewCount(67)
                .soldCount(312)
                .active(true)
                .category(pcWax)
                .build());

        productRepository.save(Product.builder()
                .name("2Vee Beard Oil Premium")
                .slug("2vee-beard-oil-premium")
                .description("Dầu dưỡng râu cao cấp từ argan oil và jojoba, làm mềm râu, giảm ngứa, hương thơm tươi mát.")
                .price(BigDecimal.valueOf(280_000))
                .originalPrice(BigDecimal.valueOf(320_000))
                .stockQuantity(120)
                .imageUrl("https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&auto=format&fit=crop")
                .rating(4.80)
                .reviewCount(45)
                .soldCount(189)
                .active(true)
                .category(pcCare)
                .build());

        productRepository.save(Product.builder()
                .name("BachBarber Scalp Care Shampoo")
                .slug("bachbarber-scalp-care-shampoo")
                .description("Dầu gội chăm sóc da đầu thương hiệu BachBarber, công thức biotin + caffeine kích thích mọc tóc, giảm gàu.")
                .price(BigDecimal.valueOf(195_000))
                .originalPrice(BigDecimal.valueOf(220_000))
                .stockQuantity(200)
                .imageUrl("https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop")
                .rating(4.75)
                .reviewCount(156)
                .soldCount(734)
                .active(true)
                .category(pcCare)
                .build());

        log.info("✅ Products seeded: 5 products");

        // ── 10. CARTS ─────────────────────────────────────────────────────────
        cartRepository.save(Cart.builder().user(userMinh).build());
        cartRepository.save(Cart.builder().user(userLan).build());
        cartRepository.save(Cart.builder().user(userHung).build());
        cartRepository.save(Cart.builder().user(userHoa).build());

        log.info("✅ Carts seeded: 4 carts");

        // ── 11. BOOKINGS (4 statuses) ─────────────────────────────────────────
        // PENDING — Minh vừa đặt lịch, chưa thanh toán
        LocalDateTime pendingStart = LocalDateTime.now().plusDays(1).withHour(9).withMinute(0).withSecond(0).withNano(0);
        Booking bookingPending = bookingRepository.save(Booking.builder()
                .bookingCode("BB-2026-00001")
                .customerName(userMinh.getFullName())
                .customerPhone(userMinh.getPhoneNumber())
                .customerEmail(userMinh.getEmail())
                .startTime(pendingStart)
                .endTime(pendingStart.plusMinutes(60))
                .salon(salonCauGiay)
                .user(userMinh)
                .stylist(alexBach)
                .status(BookingStatus.PENDING)
                .subtotalAmount(BigDecimal.valueOf(300_000))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(300_000))
                .paymentStatus("UNPAID")
                .paymentMethod("BANK_TRANSFER")
                .customerNotes("Cắt fade + uốn nhẹ mái trước")
                .bookingSource("WEB")
                .build());

        // CONFIRMED — Lan đã thanh toán, đang chờ đến lịch
        LocalDateTime confirmedStart = LocalDateTime.now().plusDays(2).withHour(14).withMinute(0).withSecond(0).withNano(0);
        Booking bookingConfirmed = bookingRepository.save(Booking.builder()
                .bookingCode("BB-2026-00002")
                .customerName(userLan.getFullName())
                .customerPhone(userLan.getPhoneNumber())
                .customerEmail(userLan.getEmail())
                .startTime(confirmedStart)
                .endTime(confirmedStart.plusMinutes(150))
                .salon(salonHoanKiem)
                .user(userLan)
                .stylist(kenNguyen)
                .status(BookingStatus.CONFIRMED)
                .subtotalAmount(BigDecimal.valueOf(480_000))
                .discountAmount(BigDecimal.valueOf(48_000))
                .voucherCode("SUMMER2026")
                .totalAmount(BigDecimal.valueOf(432_000))
                .paymentStatus("PAID")
                .paymentMethod("BANK_TRANSFER")
                .customerNotes("Uốn tóc xoăn nhẹ kiểu Hàn Quốc")
                .bookingSource("WEB")
                .build());

        // COMPLETED — Hùng đã hoàn thành dịch vụ
        LocalDateTime completedStart = LocalDateTime.now().minusDays(3).withHour(10).withMinute(0).withSecond(0).withNano(0);
        Booking bookingCompleted = bookingRepository.save(Booking.builder()
                .bookingCode("BB-2026-00003")
                .customerName(userHung.getFullName())
                .customerPhone(userHung.getPhoneNumber())
                .customerEmail(userHung.getEmail())
                .startTime(completedStart)
                .endTime(completedStart.plusMinutes(45))
                .actualCheckinTime(completedStart.plusMinutes(5))
                .actualCheckoutTime(completedStart.plusMinutes(50))
                .salon(salonSaigon)
                .user(userHung)
                .stylist(leoHuy)
                .status(BookingStatus.COMPLETED)
                .subtotalAmount(BigDecimal.valueOf(120_000))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(120_000))
                .paymentStatus("PAID")
                .paymentMethod("CASH")
                .stylistNotes("Khách hài lòng với kiểu cắt fade mid. Đề xuất quay lại sau 3 tuần.")
                .isReviewed(true)
                .bookingSource("WEB")
                .build());

        // CANCELLED — Hoa đã hủy lịch
        LocalDateTime cancelledStart = LocalDateTime.now().minusDays(1).withHour(16).withMinute(0).withSecond(0).withNano(0);
        Booking bookingCancelled = bookingRepository.save(Booking.builder()
                .bookingCode("BB-2026-00004")
                .customerName(userHoa.getFullName())
                .customerPhone(userHoa.getPhoneNumber())
                .customerEmail(userHoa.getEmail())
                .startTime(cancelledStart)
                .endTime(cancelledStart.plusMinutes(75))
                .salon(salonSaigon)
                .user(userHoa)
                .stylist(harryPham)
                .status(BookingStatus.CANCELLED)
                .subtotalAmount(BigDecimal.valueOf(200_000))
                .discountAmount(BigDecimal.ZERO)
                .totalAmount(BigDecimal.valueOf(200_000))
                .paymentStatus("UNPAID")
                .paymentMethod("CASH")
                .cancellationReason("Khách bận việc đột xuất, hẹn lại tuần sau")
                .cancelledBy("USER")
                .cancelledAt(cancelledStart.minusHours(3))
                .bookingSource("WEB")
                .build());

        log.info("✅ Bookings seeded: 4 bookings (PENDING, CONFIRMED, COMPLETED, CANCELLED)");

        // ── 12. BOOKING DETAILS ───────────────────────────────────────────────
        bookingDetailRepository.save(BookingDetail.builder()
                .booking(bookingPending)
                .serviceOffering(svcFade)
                .currentPrice(svcFade.getPrice())
                .build());

        bookingDetailRepository.save(BookingDetail.builder()
                .booking(bookingConfirmed)
                .serviceOffering(svcUon)
                .currentPrice(svcUon.getPrice())
                .build());

        bookingDetailRepository.save(BookingDetail.builder()
                .booking(bookingCompleted)
                .serviceOffering(svcCatToc)
                .currentPrice(svcCatToc.getPrice())
                .build());

        bookingDetailRepository.save(BookingDetail.builder()
                .booking(bookingCancelled)
                .serviceOffering(svcChamSocDa)
                .currentPrice(svcChamSocDa.getPrice())
                .build());

        log.info("✅ Booking details seeded: 4 records");

        // ── 13. BANK TRANSFER INFO ────────────────────────────────────────────
        bankTransferInfoRepository.save(BankTransferInfo.builder()
                .bankName("Vietcombank")
                .accountName("CONG TY TNHH BACHBARBER")
                .accountNumber("1234567890")
                .active(true)
                .build());

        bankTransferInfoRepository.save(BankTransferInfo.builder()
                .bankName("MB Bank")
                .accountName("CONG TY TNHH BACHBARBER")
                .accountNumber("0987654321")
                .active(true)
                .build());

        log.info("✅ Bank transfer info seeded: 2 accounts");
        log.info("🎉 DataSeeder: All seed data inserted successfully!");
    }

    private void seedAdditionalBookings() {
        List<Stylist> stylists = stylistRepository.findAll();
        List<User> users = userRepository.findAll();
        List<ServiceOffering> services = serviceOfferingRepository.findAll();
        List<Salon> salons = salonRepository.findAll();

        if (stylists.isEmpty() || users.isEmpty() || services.isEmpty() || salons.isEmpty()) {
            log.warn("⚠️ Cannot expand bookings: essential entities missing.");
            return;
        }

        User u0 = users.get(0);
        User u1 = users.size() > 1 ? users.get(1) : u0;
        User u2 = users.size() > 2 ? users.get(2) : u0;
        User u3 = users.size() > 3 ? users.get(3) : u1;

        ServiceOffering sCut = services.get(0);
        ServiceOffering sFade = services.size() > 1 ? services.get(1) : sCut;
        ServiceOffering sPerm = services.size() > 2 ? services.get(2) : sCut;
        ServiceOffering sColor = services.size() > 3 ? services.get(3) : sCut;
        ServiceOffering sWash = services.size() > 4 ? services.get(4) : sCut;

        int bookingCounter = (int) bookingRepository.count() + 10;

        for (Stylist stylist : stylists) {
            Salon salon = stylist.getSalon() != null ? stylist.getSalon() : salons.get(0);

            // 1. PENDING booking
            LocalDateTime pStart = LocalDateTime.now().plusDays(1).withHour(10).withMinute(30).withSecond(0).withNano(0);
            Booking bPending = bookingRepository.save(Booking.builder()
                    .bookingCode(String.format("BB-2026-%05d", bookingCounter++))
                    .customerName(u1.getFullName())
                    .customerPhone(u1.getPhoneNumber())
                    .customerEmail(u1.getEmail())
                    .startTime(pStart)
                    .endTime(pStart.plusMinutes(60))
                    .salon(salon)
                    .user(u1)
                    .stylist(stylist)
                    .status(BookingStatus.PENDING)
                    .subtotalAmount(sFade.getPrice())
                    .discountAmount(BigDecimal.ZERO)
                    .totalAmount(sFade.getPrice())
                    .paymentStatus("UNPAID")
                    .paymentMethod("BANK_TRANSFER")
                    .customerNotes("Khách muốn tạo kiểu undercut gọn gàng")
                    .bookingSource("WEB")
                    .build());
            bookingDetailRepository.save(BookingDetail.builder().booking(bPending).serviceOffering(sFade).currentPrice(sFade.getPrice()).build());

            // 2. CONFIRMED booking 1
            LocalDateTime cStart1 = LocalDateTime.now().plusDays(1).withHour(14).withMinute(0).withSecond(0).withNano(0);
            Booking bConf1 = bookingRepository.save(Booking.builder()
                    .bookingCode(String.format("BB-2026-%05d", bookingCounter++))
                    .customerName(u2.getFullName())
                    .customerPhone(u2.getPhoneNumber())
                    .customerEmail(u2.getEmail())
                    .startTime(cStart1)
                    .endTime(cStart1.plusMinutes(90))
                    .salon(salon)
                    .user(u2)
                    .stylist(stylist)
                    .status(BookingStatus.CONFIRMED)
                    .subtotalAmount(sPerm.getPrice())
                    .discountAmount(BigDecimal.valueOf(20000))
                    .totalAmount(sPerm.getPrice().subtract(BigDecimal.valueOf(20000)))
                    .paymentStatus("PAID")
                    .paymentMethod("BANK_TRANSFER")
                    .customerNotes("Uốn nhẹ bồng bềnh chuẩn phong cách")
                    .bookingSource("WEB")
                    .build());
            bookingDetailRepository.save(BookingDetail.builder().booking(bConf1).serviceOffering(sPerm).currentPrice(sPerm.getPrice()).build());

            // 3. CONFIRMED booking 2 (lịch hôm nay hoặc ngày mai)
            LocalDateTime cStart2 = LocalDateTime.now().plusHours(3).withMinute(0).withSecond(0).withNano(0);
            Booking bConf2 = bookingRepository.save(Booking.builder()
                    .bookingCode(String.format("BB-2026-%05d", bookingCounter++))
                    .customerName(u0.getFullName())
                    .customerPhone(u0.getPhoneNumber())
                    .customerEmail(u0.getEmail())
                    .startTime(cStart2)
                    .endTime(cStart2.plusMinutes(45))
                    .salon(salon)
                    .user(u0)
                    .stylist(stylist)
                    .status(BookingStatus.CONFIRMED)
                    .subtotalAmount(sCut.getPrice())
                    .discountAmount(BigDecimal.ZERO)
                    .totalAmount(sCut.getPrice())
                    .paymentStatus("PAID")
                    .paymentMethod("CASH")
                    .customerNotes("Cắt tóc định kỳ 3 tuần/lần")
                    .bookingSource("WEB")
                    .build());
            bookingDetailRepository.save(BookingDetail.builder().booking(bConf2).serviceOffering(sCut).currentPrice(sCut.getPrice()).build());

            // 4. COMPLETED booking 1
            LocalDateTime compStart1 = LocalDateTime.now().minusDays(1).withHour(11).withMinute(0).withSecond(0).withNano(0);
            Booking bComp1 = bookingRepository.save(Booking.builder()
                    .bookingCode(String.format("BB-2026-%05d", bookingCounter++))
                    .customerName(u3.getFullName())
                    .customerPhone(u3.getPhoneNumber())
                    .customerEmail(u3.getEmail())
                    .startTime(compStart1)
                    .endTime(compStart1.plusMinutes(120))
                    .actualCheckinTime(compStart1.plusMinutes(2))
                    .actualCheckoutTime(compStart1.plusMinutes(115))
                    .salon(salon)
                    .user(u3)
                    .stylist(stylist)
                    .status(BookingStatus.COMPLETED)
                    .subtotalAmount(sColor.getPrice())
                    .discountAmount(BigDecimal.valueOf(30000))
                    .totalAmount(sColor.getPrice().subtract(BigDecimal.valueOf(30000)))
                    .paymentStatus("PAID")
                    .paymentMethod("CASH")
                    .stylistNotes("Màu nhuộm lên đều, khách rất ưng ý")
                    .isReviewed(true)
                    .bookingSource("WEB")
                    .build());
            bookingDetailRepository.save(BookingDetail.builder().booking(bComp1).serviceOffering(sColor).currentPrice(sColor.getPrice()).build());

            // 5. COMPLETED booking 2
            LocalDateTime compStart2 = LocalDateTime.now().minusDays(2).withHour(15).withMinute(30).withSecond(0).withNano(0);
            Booking bComp2 = bookingRepository.save(Booking.builder()
                    .bookingCode(String.format("BB-2026-%05d", bookingCounter++))
                    .customerName(u0.getFullName())
                    .customerPhone(u0.getPhoneNumber())
                    .customerEmail(u0.getEmail())
                    .startTime(compStart2)
                    .endTime(compStart2.plusMinutes(60))
                    .actualCheckinTime(compStart2)
                    .actualCheckoutTime(compStart2.plusMinutes(55))
                    .salon(salon)
                    .user(u0)
                    .stylist(stylist)
                    .status(BookingStatus.COMPLETED)
                    .subtotalAmount(sWash.getPrice())
                    .discountAmount(BigDecimal.ZERO)
                    .totalAmount(sWash.getPrice())
                    .paymentStatus("PAID")
                    .paymentMethod("BANK_TRANSFER")
                    .stylistNotes("Gội đầu massage thư giãn hoàn tất")
                    .isReviewed(true)
                    .bookingSource("WEB")
                    .build());
            bookingDetailRepository.save(BookingDetail.builder().booking(bComp2).serviceOffering(sWash).currentPrice(sWash.getPrice()).build());

            // 6. CANCELLED booking
            LocalDateTime cancStart = LocalDateTime.now().minusDays(3).withHour(16).withMinute(0).withSecond(0).withNano(0);
            Booking bCanc = bookingRepository.save(Booking.builder()
                    .bookingCode(String.format("BB-2026-%05d", bookingCounter++))
                    .customerName(u2.getFullName())
                    .customerPhone(u2.getPhoneNumber())
                    .customerEmail(u2.getEmail())
                    .startTime(cancStart)
                    .endTime(cancStart.plusMinutes(45))
                    .salon(salon)
                    .user(u2)
                    .stylist(stylist)
                    .status(BookingStatus.CANCELLED)
                    .subtotalAmount(sCut.getPrice())
                    .discountAmount(BigDecimal.ZERO)
                    .totalAmount(sCut.getPrice())
                    .paymentStatus("UNPAID")
                    .paymentMethod("CASH")
                    .cancellationReason("Khách bận việc đột xuất")
                    .cancelledBy("USER")
                    .cancelledAt(cancStart.minusHours(2))
                    .bookingSource("WEB")
                    .build());
            bookingDetailRepository.save(BookingDetail.builder().booking(bCanc).serviceOffering(sCut).currentPrice(sCut.getPrice()).build());
        }

        log.info("🎉 Seeded {} diverse bookings across all stylists!", bookingCounter);
    }
}

