package demo.bookingsalon.Configuration;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
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
import demo.bookingsalon.Entity.Order;
import demo.bookingsalon.Entity.OrderDetail;
import demo.bookingsalon.Entity.Review;
import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Enum.OrderStatus;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Repository.AdminRepository;
import demo.bookingsalon.Repository.BankTransferInfoRepository;
import demo.bookingsalon.Repository.BookingDetailRepository;
import demo.bookingsalon.Repository.BookingRepository;
import demo.bookingsalon.Repository.CartRepository;
import demo.bookingsalon.Repository.CategoryRepository;
import demo.bookingsalon.Repository.OrderDetailRepository;
import demo.bookingsalon.Repository.OrderRepository;
import demo.bookingsalon.Repository.ProductCategoryRepository;
import demo.bookingsalon.Repository.ProductRepository;
import demo.bookingsalon.Repository.ReviewRepository;
import demo.bookingsalon.Repository.SalonRepository;
import demo.bookingsalon.Repository.ServiceOfferingRepository;
import demo.bookingsalon.Repository.StylistRepository;
import demo.bookingsalon.Repository.StylistServiceRepository;
import demo.bookingsalon.Repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@org.springframework.boot.autoconfigure.condition.ConditionalOnProperty(name = "app.data-seeder.enabled", havingValue = "true", matchIfMissing = true)
@org.springframework.core.annotation.Order(1)
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
    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws Exception {
        if (salonRepository.count() > 0) {
            log.info("✅ DataSeeder: Database already has salons.");
            if (bookingRepository.count() < 30) {
                log.info("🌱 DataSeeder: Expanding rich booking data across Day/Week/Month/Year for all stylists...");
                seedPeriodBookings();
            } else {
                log.info("✅ DataSeeder: Database already has sufficient booking data — skipping seed.");
            }
            if (productRepository.count() < 210) {
                log.info("🌱 DataSeeder: Expanding realistic products and categories to 210+...");
                seedAdditionalProducts();
            }
            if (reviewRepository.count() < 30) {
                log.info("🌱 DataSeeder: Seeding authentic customer reviews for products...");
                seedProductReviews();
            }
            if (orderRepository.count() < 10) {
                log.info("🌱 DataSeeder: Seeding sample shop orders for Admin management...");
                seedSampleOrders();
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

    private void seedAdditionalProducts() {
        ProductCategory pcWax = productCategoryRepository.findBySlug("sap-tao-kieu").orElseGet(() ->
                productCategoryRepository.save(ProductCategory.builder()
                        .name("Sáp & Pomade tạo kiểu")
                        .slug("sap-tao-kieu")
                        .description("Các loại wax, clay, pomade tạo kiểu tóc chuyên nghiệp giữ nếp cả ngày")
                        .imageUrl("https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop")
                        .build()));

        ProductCategory pcCare = productCategoryRepository.findBySlug("cham-soc-toc").orElseGet(() ->
                productCategoryRepository.save(ProductCategory.builder()
                        .name("Chăm sóc tóc")
                        .slug("cham-soc-toc")
                        .description("Dầu gội, dầu xả, serum chăm sóc tóc cao cấp phục hồi hư tổn")
                        .imageUrl("https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop")
                        .build()));

        ProductCategory pcPre = productCategoryRepository.findBySlug("pre-styling-xit-giu-nep").orElseGet(() ->
                productCategoryRepository.save(ProductCategory.builder()
                        .name("Pre-styling & Xịt giữ nếp")
                        .slug("pre-styling-xit-giu-nep")
                        .description("Xịt tạo phồng bảo vệ nhiệt máy sấy, gôm xịt cố định form tóc bền đẹp")
                        .imageUrl("https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&auto=format&fit=crop")
                        .build()));

        ProductCategory pcBeard = productCategoryRepository.findBySlug("duong-rau-cao-rau").orElseGet(() ->
                productCategoryRepository.save(ProductCategory.builder()
                        .name("Dưỡng râu & Cạo râu")
                        .slug("duong-rau-cao-rau")
                        .description("Kem cạo râu bọt mịn, tinh dầu dưỡng mềm râu và dao cạo barber chuyên dụng")
                        .imageUrl("https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop")
                        .build()));

        ProductCategory pcTool = productCategoryRepository.findBySlug("dung-cu-may-tao-kieu").orElseGet(() ->
                productCategoryRepository.save(ProductCategory.builder()
                        .name("Dụng cụ & Máy tạo kiểu")
                        .slug("dung-cu-may-tao-kieu")
                        .description("Tông đơ fade pin cao cấp, máy sấy tạo kiểu ion âm và lược tạo texture")
                        .imageUrl("https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop")
                        .build()));

        ProductCategory pcSkin = productCategoryRepository.findBySlug("cham-soc-da-mat").orElseGet(() ->
                productCategoryRepository.save(ProductCategory.builder()
                        .name("Chăm sóc da & Mặt")
                        .slug("cham-soc-da-mat")
                        .description("Sữa rửa mặt, toner, serum dưỡng da cho nam")
                        .imageUrl("https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop")
                        .build()));

        ProductCategory pcScalp = productCategoryRepository.findBySlug("cham-soc-da-dau").orElseGet(() ->
                productCategoryRepository.save(ProductCategory.builder()
                        .name("Chăm sóc da đầu")
                        .slug("cham-soc-da-dau")
                        .description("Serum mọc tóc, tinh dầu da đầu, kem trị gàu")
                        .imageUrl("https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop")
                        .build()));

        ProductCategory pcAccessory = productCategoryRepository.findBySlug("phu-kien-toc").orElseGet(() ->
                productCategoryRepository.save(ProductCategory.builder()
                        .name("Phụ kiện & Tóc giả")
                        .slug("phu-kien-toc")
                        .description("Băng đô, kẹp tóc, cuộn tóc, tóc giả cao cấp")
                        .imageUrl("https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop")
                        .build()));

        // Seed products if not already existing by slug
        createProductIfAbsent("Hanz de Fuko Quicksand", "hanz-de-fuko-quicksand",
                "Wax tạo kiểu siêu nhẹ, độ giữ nếp cao, kết thúc mờ tự nhiên. Thích hợp tóc mỏng và mái lỏng.",
                420_000, 480_000, 85, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop",
                4.9, 124, 876, pcWax);

        createProductIfAbsent("Blumaan Fifth Sample Clay", "blumaan-fifth-sample-clay",
                "Clay tạo kiểu với độ giữ nếp trung bình cao, bề mặt mờ tự nhiên. Công thức gốc nước, dễ gội sạch.",
                380_000, 420_000, 62, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop",
                4.85, 89, 543, pcWax);

        createProductIfAbsent("Kevin Murphy Rough Rider", "kevin-murphy-rough-rider",
                "Paste tạo kiểu với kết cấu thô, độ giữ nếp cực mạnh. Phù hợp cho kiểu tóc messy và quiff hiện đại.",
                520_000, 590_000, 41, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop",
                4.88, 67, 312, pcWax);

        createProductIfAbsent("Reuzel Blue Strong Hold High Sheen Pomade", "reuzel-blue-pomade",
                "Pomade gốc nước giữ nếp siêu chắc, độ bóng cao sang trọng cổ điển, dễ gội sạch chỉ với nước ấm.",
                350_000, 390_000, 95, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop",
                4.80, 110, 620, pcWax);

        createProductIfAbsent("Dapper Dan Matt Paste", "dapper-dan-matt-paste",
                "Sáp vuốt tóc dạng paste mềm, tự nhiên, hương thơm vintage Cologne tinh tế lịch lãm.",
                410_000, 450_000, 50, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop",
                4.75, 43, 280, pcWax);

        createProductIfAbsent("BachBarber Scalp Care Shampoo", "bachbarber-scalp-care-shampoo",
                "Dầu gội chăm sóc da đầu thương hiệu BachBarber, công thức biotin + caffeine kích thích mọc tóc, sạch gàu.",
                195_000, 220_000, 200, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop",
                4.75, 156, 734, pcCare);

        createProductIfAbsent("Olaplex No.4 Bond Maintenance Shampoo", "olaplex-no4-shampoo",
                "Dầu gội phục hồi liên kết tóc đứt gãy do uốn nhuộm hóa chất, mang lại độ bồng bềnh và bóng khỏe vượt trội.",
                690_000, 750_000, 30, "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&auto=format&fit=crop",
                4.95, 88, 215, pcCare);

        createProductIfAbsent("Tinh dầu dưỡng tóc Moroccanoil Treatment Original", "moroccanoil-treatment",
                "Tinh chất argan oil nguyên chất từ Morocco, nuôi dưỡng sâu sợi tóc, chống xơ rối và bảo vệ nhiệt.",
                620_000, 680_000, 45, "https://images.unsplash.com/photo-1608248597359-00624a0d8e8b?w=400&auto=format&fit=crop",
                4.92, 142, 490, pcCare);

        createProductIfAbsent("Xịt tạo phồng Bona Fide Texture Spray", "bona-fide-texture-spray",
                "Chai xịt Pre-styling chứa muối khoáng biển giúp tăng độ phồng (volume), texture dày dặn và chống nhiệt sấy tóc.",
                320_000, 360_000, 75, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop",
                4.70, 52, 330, pcPre);

        createProductIfAbsent("Gôm xịt tóc Silhouette Schwarzkopf Super Hold", "silhouette-schwarzkopf-spray",
                "Gôm xịt cố định form tóc chuyên dụng của Đức, khô nhanh tức thì, không gây bết dính hay để lại bụi trắng.",
                210_000, 240_000, 110, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop",
                4.80, 95, 610, pcPre);

        createProductIfAbsent("2Vee Beard Oil Premium", "2vee-beard-oil-premium",
                "Dầu dưỡng râu cao cấp từ argan oil và jojoba, làm mềm râu, giảm ngứa da, hương thơm nam tính tươi mát.",
                280_000, 320_000, 120, "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&auto=format&fit=crop",
                4.80, 45, 189, pcBeard);

        createProductIfAbsent("Kem cạo râu Proraso Shaving Cream Eucalyptus", "proraso-shaving-cream",
                "Kem cạo râu truyền thống Ý với tinh chất bạch đàn và dầu menthol mát lạnh, làm mềm râu nhanh chóng.",
                260_000, 290_000, 80, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop",
                4.85, 63, 275, pcBeard);

        createProductIfAbsent("Tông đơ Wahl Magic Clip Cordless 5-Star", "wahl-magic-clip-cordless",
                "Tông đơ cắt tóc fade chuyên nghiệp lưỡi kép Stagger-Tooth, động cơ quay cực mạnh và pin Li-Ion hơn 90 phút.",
                2_450_000, 2_750_000, 18, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop",
                4.98, 76, 145, pcTool);

        createProductIfAbsent("Máy sấy tóc chuyên nghiệp Ga.Ma Professional IQ", "gama-iq-perfetto-dryer",
                "Máy sấy tóc công nghệ số ion âm siêu nhẹ chỉ 294g, động cơ 110.000 vòng/phút khô tóc siêu nhanh không hư tổn.",
                1_450_000, 1_650_000, 25, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop",
                4.86, 34, 98, pcTool);

        createProductIfAbsent("Lược tạo phồng bán nguyệt Chaoba Skeleton", "luoc-tao-phong-chaoba",
                "Lược tạo phồng chịu nhiệt sấy chuyên dụng cho barber, răng lược thiết kế tròn massage kích thích da đầu.",
                85_000, 100_000, 150, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop",
                4.65, 82, 520, pcTool);

        createProductIfAbsent("American Crew Fiber", "american-crew-fiber", "sáp giữ nếp mạnh, bề mặt mờ tự nhiên", 280000, 320000, 90, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.82, 201, 890, pcWax);
        createProductIfAbsent("Layrite Original Pomade", "layrite-original", "pomade gốc nước độ bóng vừa, mùi vani", 310000, 350000, 75, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.78, 156, 621, pcWax);
        createProductIfAbsent("Suavecito Original Hold", "suavecito-original", "pomade Mỹ classic hold, bóng cao, thơm nhẹ", 320000, 360000, 82, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.90, 234, 1020, pcWax);
        createProductIfAbsent("Gatsby Moving Rubber Spiky Edge", "gatsby-spiky-edge", "wax tạo gai Nhật", 95000, 120000, 200, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.65, 345, 2100, pcWax);
        createProductIfAbsent("Gatsby Moving Rubber Wild Shake", "gatsby-wild-shake", "wax bồng tự nhiên Nhật", 95000, 120000, 210, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.70, 412, 2350, pcWax);
        createProductIfAbsent("Murray's Superior Hair Dressing Pomade", "murrays-superior", "pomade gốc sáp truyền thống mạnh, bóng cao", 120000, 150000, 110, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.55, 178, 650, pcWax);
        createProductIfAbsent("Joico ICE Spiker", "joico-ice-spiker", "keo dán tóc siêu chắc dạng gel trong suốt", 290000, 330000, 55, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.73, 98, 310, pcWax);
        createProductIfAbsent("Schwarzkopf Osis+ Dust It Mattifying Powder", "osis-dust-it-powder", "bột tạo phồng rắc gốc tóc", 280000, 310000, 65, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.80, 134, 421, pcWax);
        createProductIfAbsent("Wax Số 5 Barber Academy", "wax-so-5-barber", "wax Việt Nam chuyên dụng", 95000, 110000, 300, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.55, 289, 1890, pcWax);
        createProductIfAbsent("Muk Hard Muk Styling Mud", "muk-hard-mud", "mud tạo kiểu siêu cứng Úc", 450000, 510000, 35, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.88, 67, 210, pcWax);
        createProductIfAbsent("O'Douds All Natural Pomade", "odouds-all-natural", "pomade tự nhiên không hóa chất, hương cedarwood", 380000, 420000, 40, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.85, 55, 178, pcWax);
        createProductIfAbsent("Baxter of California Hard Cream Pomade", "baxter-hard-cream", "pomade dạng kem độ giữ chắc", 490000, 550000, 28, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.92, 89, 245, pcWax);
        createProductIfAbsent("Got2b Glued Blasting Freeze Spray", "got2b-freeze-spray", "gôm xịt siêu cứng ultra strong", 185000, 210000, 150, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.60, 267, 1200, pcWax);
        createProductIfAbsent("TIGI Bed Head Superstar", "tigi-superstar-clay", "clay tạo phồng", 310000, 350000, 45, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.75, 76, 289, pcWax);
        createProductIfAbsent("Proraso Wood & Spice Pomade", "proraso-pomade-wood", "pomade dạng cream vintage Ý", 420000, 480000, 30, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.82, 44, 145, pcWax);
        createProductIfAbsent("Natural Sea Salt Spray DIY Barber Style", "sea-salt-spray-barber", "xịt muối biển tạo texture sóng", 175000, 200000, 120, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.68, 198, 780, pcWax);
        createProductIfAbsent("Patricks M2 Matte Paste", "patricks-m2-matte", "paste cao cấp Úc matte finish", 650000, 720000, 20, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.95, 43, 98, pcWax);
        createProductIfAbsent("Hawkins & Brimble Pomade", "hawkins-brimble-pomade", "pomade vị Anh, hương elemi", 380000, 430000, 35, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.78, 52, 165, pcWax);
        createProductIfAbsent("Uppercut Deluxe Pomade", "uppercut-deluxe-pomade", "pomade Úc bóng cao cổ điển", 390000, 440000, 48, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.87, 112, 456, pcWax);
        createProductIfAbsent("Firsthand Supply Styling Clay", "firsthand-styling-clay", "clay Mỹ thiên nhiên matte", 440000, 490000, 32, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.80, 67, 201, pcWax);
        createProductIfAbsent("Clay Pomade Combo Set BachBarber", "combo-clay-pomade-bach", "combo 3 sản phẩm tạo kiểu", 850000, 1000000, 25, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.90, 34, 89, pcWax);
        createProductIfAbsent("Reuzel Red Pomade", "reuzel-red-pomade", "pomade gốc dầu độ bóng cực cao", 360000, 400000, 68, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.72, 134, 534, pcWax);
        createProductIfAbsent("Reuzel Green Pomade", "reuzel-green-pomade", "pomade gốc nước độ bóng vừa", 350000, 390000, 72, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.76, 145, 589, pcWax);
        createProductIfAbsent("Rolda Classic Black Pomade", "rolda-classic-black", "pomade Thổ Nhĩ Kỳ giá tốt, bóng cao", 145000, 170000, 130, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.58, 267, 1100, pcWax);
        createProductIfAbsent("Brylcreem Original Hair Cream", "brylcreem-original", "kem tạo kiểu truyền thống Anh", 125000, 145000, 180, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.50, 312, 1456, pcWax);
        
        createProductIfAbsent("BachBarber Deep Conditioner", "bachbarber-deep-conditioner", "dầu xả phục hồi sâu", 185000, 210000, 150, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.72, 134, 589, pcCare);
        createProductIfAbsent("Kerastase Nutritive Bain Satin Shampoo", "kerastase-bain-satin", "dầu gội phục hồi cao cấp Pháp", 890000, 980000, 15, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.95, 78, 156, pcCare);
        createProductIfAbsent("Dove Men+Care Thickening Shampoo", "dove-men-thickening", "dầu gội nam dày tóc, caffeine", 145000, 165000, 250, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.62, 567, 3200, pcCare);
        createProductIfAbsent("Head & Shoulders Clinical Strength", "head-shoulders-clinical", "dầu gội chống gàu mạnh nhất", 195000, 215000, 200, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.65, 891, 5600, pcCare);
        createProductIfAbsent("L'Oreal Elvive Extraordinary Oil Shampoo", "loreal-elvive-oil", "dầu gội tinh dầu hoa quý", 185000, 210000, 180, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.60, 456, 2340, pcCare);
        createProductIfAbsent("Olaplex No.5 Bond Maintenance Conditioner", "olaplex-no5-conditioner", "dầu xả phục hồi Olaplex", 720000, 790000, 25, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.93, 67, 189, pcCare);
        createProductIfAbsent("Redken All Soft Shampoo", "redken-all-soft-shampoo", "dầu gội Mỹ cho tóc khô cứng", 590000, 650000, 20, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.88, 56, 145, pcCare);
        createProductIfAbsent("Pantene Pro-V Men 2-in-1", "pantene-men-2in1", "dầu gội xả 2in1 nam", 145000, 160000, 300, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.55, 789, 4500, pcCare);
        createProductIfAbsent("Nioxin System 2 Shampoo", "nioxin-system2", "dầu gội kích thích mọc tóc, giảm rụng", 650000, 720000, 18, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.85, 89, 234, pcCare);
        createProductIfAbsent("Moroccan Argan Oil Shampoo Luseta", "luseta-argan-shampoo", "dầu gội argan Morocco không sulfate", 320000, 360000, 75, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.78, 134, 567, pcCare);
        createProductIfAbsent("Schwarzkopf BC Bonacure Peptide Repair", "bonacure-peptide-repair", "dầu xả phục hồi peptide chuyên sâu", 480000, 540000, 30, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.82, 67, 198, pcCare);
        createProductIfAbsent("Wella Professionals Elements Shampoo", "wella-elements-shampoo", "dầu gội không sulfate nhẹ dịu", 490000, 550000, 25, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.80, 45, 167, pcCare);
        createProductIfAbsent("Biotin B-Complex Hair Growth Serum", "biotin-hair-growth-serum", "serum mọc tóc biotin B7 đậm đặc", 285000, 320000, 90, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.75, 178, 689, pcCare);
        createProductIfAbsent("Caffeine Hair Loss Scalp Serum", "caffeine-scalp-serum", "serum caffeine giảm rụng, kích mọc", 240000, 270000, 100, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.70, 156, 534, pcCare);
        createProductIfAbsent("Minoxidil 5% Kirkland Signature", "kirkland-minoxidil-5pct", "dung dịch mọc tóc Minoxidil chính hãng", 390000, 450000, 60, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.68, 234, 890, pcCare);
        createProductIfAbsent("Rice Water Hair Rinse Treatment", "rice-water-hair-rinse", "nước gạo lên men dưỡng tóc bóng khỏe", 165000, 190000, 120, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.65, 289, 1100, pcCare);
        createProductIfAbsent("Deep Sea Scalp Detox Shampoo", "deep-sea-scalp-detox", "dầu gội detox da đầu muối biển", 275000, 310000, 85, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.73, 112, 445, pcCare);
        createProductIfAbsent("Joico Moisture Recovery Shampoo", "joico-moisture-recovery", "dầu gội phục hồi độ ẩm dày tóc", 490000, 540000, 22, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.85, 67, 189, pcCare);
        createProductIfAbsent("Purple Toning Shampoo", "purple-toning-shampoo", "dầu gội tím khử vàng cho tóc bạch kim", 280000, 310000, 65, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.72, 98, 345, pcCare);
        createProductIfAbsent("Onion Black Seed Hair Oil", "onion-blackseed-oil", "dầu hành tây+hạt đen kích thích mọc tóc", 195000, 220000, 130, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.68, 234, 890, pcCare);
        createProductIfAbsent("Argan Rain Miracle Hair Mask", "argan-rain-hair-mask", "ủ tóc argan Morocco phục hồi", 340000, 380000, 60, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.77, 89, 312, pcCare);
        createProductIfAbsent("Coconut Oil 100% Pure Hair Treatment", "coconut-oil-hair-100pct", "dầu dừa nguyên chất dưỡng tóc", 125000, 145000, 200, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.60, 567, 2800, pcCare);
        createProductIfAbsent("BachBarber Protein Hair Spray", "bachbarber-protein-spray", "xịt dưỡng protein sợi keratin", 175000, 195000, 110, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.68, 145, 543, pcCare);
        createProductIfAbsent("Tea Tree Mint Shampoo Paul Mitchell", "paul-mitchell-tea-tree", "dầu gội mát lạnh bạc hà+tràm trà", 520000, 580000, 28, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.90, 112, 389, pcCare);
        createProductIfAbsent("Dry Shampoo Batiste Original", "batiste-dry-shampoo-original", "dầu gội khô không cần nước", 185000, 210000, 150, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.65, 456, 2100, pcCare);

        createProductIfAbsent("TRESemmé Heat Tamer Spray", "tresemme-heat-tamer", "xịt bảo vệ nhiệt máy sấy", 195000, 220000, 140, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.68, 234, 1100, pcPre);
        createProductIfAbsent("Kenra Platinum Silkening Mist", "kenra-silkening-mist", "xịt lụa tóc bóng mượt phản chiếu", 450000, 510000, 25, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.87, 56, 178, pcPre);
        createProductIfAbsent("BaByliss Pro Thermal Spray", "babyliss-thermal-spray", "xịt bảo vệ nhiệt chuyên nghiệp", 340000, 380000, 45, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.80, 89, 312, pcPre);
        createProductIfAbsent("Kenra Volume Spray 25", "kenra-volume-spray-25", "gôm xịt phồng volume tối đa", 420000, 470000, 35, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.83, 67, 234, pcPre);
        createProductIfAbsent("Got2b Phenomenal Thickening Spray", "got2b-thickening-spray", "xịt tạo phồng Got2b", 185000, 210000, 120, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.65, 289, 1200, pcPre);
        createProductIfAbsent("Wella EIMI Sugar Lift Spray", "wella-eimi-sugar-lift", "xịt đường tạo phồng sóng biển", 380000, 430000, 38, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.78, 56, 198, pcPre);
        createProductIfAbsent("Surface Hair Trinity Shampoo", "surface-trinity-shampoo", "dầu gội tẩy nhẹ làm sạch wax/pomade", 310000, 350000, 55, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.75, 78, 245, pcPre);
        createProductIfAbsent("Chi Silk Infusion Leave-In", "chi-silk-infusion", "dưỡng không xả silk protein", 420000, 470000, 30, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.85, 67, 189, pcPre);
        createProductIfAbsent("Joico K-Pak Reconstructor", "joico-kpak-reconstructor", "ủ protein phục hồi tóc hư tổn nặng", 540000, 600000, 20, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.88, 45, 134, pcPre);
        createProductIfAbsent("Elnett Satin Hairspray L'Oreal", "elnett-satin-hairspray", "gôm xịt Pháp mềm tự nhiên", 245000, 275000, 110, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.72, 345, 1560, pcPre);
        createProductIfAbsent("Fudge Professional Big Hair Shaper", "fudge-big-hair", "xịt tạo phồng big volume", 380000, 420000, 28, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.78, 45, 145, pcPre);
        createProductIfAbsent("Kerastase Nutritive Elixir Ultime", "kerastase-elixir-ultime", "tinh chất dưỡng trước khi sấy", 890000, 980000, 12, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.95, 34, 87, pcPre);
        createProductIfAbsent("Garnier Fructis Fiber Gum", "garnier-fiber-gum", "gel tạo kiểu Garnier siêu chắc", 165000, 185000, 180, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.58, 567, 2800, pcPre);
        createProductIfAbsent("L'Oreal Studio Line Invisi'Fix", "loreal-invisifix", "gel trong suốt siêu giữ nếp", 145000, 165000, 200, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.55, 678, 3100, pcPre);
        createProductIfAbsent("TIGI Bed Head Masterpiece", "tigi-masterpiece-spray", "gôm xịt chuyên nghiệp định hình bền", 390000, 440000, 32, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.80, 67, 212, pcPre);
        
        createProductIfAbsent("Gillette Fusion ProGlide Razor", "gillette-fusion-proglide", "dao cạo 5 lưỡi chuyên nghiệp", 380000, 430000, 80, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.82, 567, 2345, pcBeard);
        createProductIfAbsent("Wilkinson Sword Classic Double Edge", "wilkinson-double-edge", "dao cạo DE lưỡi kép truyền thống", 145000, 165000, 120, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.75, 234, 890, pcBeard);
        createProductIfAbsent("The Art of Shaving Shaving Cream", "art-of-shaving-cream", "kem cạo râu cao cấp Mỹ", 890000, 980000, 8, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.95, 34, 67, pcBeard);
        createProductIfAbsent("Gillette Mach3 Turbo Razor", "gillette-mach3-turbo", "dao cạo 3 lưỡi Turbo", 290000, 320000, 100, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.70, 789, 3400, pcBeard);
        createProductIfAbsent("Proraso Pre-Shave Cream", "proraso-pre-shave", "kem trước cạo râu Ý làm mềm", 245000, 275000, 70, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.83, 134, 456, pcBeard);
        createProductIfAbsent("Bulldog Original Moisturiser", "bulldog-moisturiser-men", "dưỡng ẩm nam sau cạo râu", 310000, 350000, 65, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.78, 89, 312, pcBeard);
        createProductIfAbsent("Murdock London Beard Wash", "murdock-beard-wash", "sữa tắm râu chuyên dụng London", 480000, 540000, 25, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.87, 45, 134, pcBeard);
        createProductIfAbsent("Blind Barber Beard Balm", "blind-barber-beard-balm", "sáp dưỡng râu mềm mượt tự nhiên", 380000, 430000, 40, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.82, 67, 198, pcBeard);
        createProductIfAbsent("Viking Revolution Beard Kit", "viking-beard-kit", "bộ chăm sóc râu gồm dầu + lược + kéo", 590000, 680000, 35, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.90, 112, 345, pcBeard);
        createProductIfAbsent("Jack Black Beard Lube Conditioning Shave", "jack-black-beard-lube", "kem cạo râu đa năng Jack Black", 490000, 550000, 20, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.88, 56, 165, pcBeard);
        createProductIfAbsent("Cremo Original Shave Cream", "cremo-original-shave", "kem cạo râu siêu mịn Cremo", 320000, 360000, 55, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.80, 178, 634, pcBeard);
        createProductIfAbsent("Beardbrand Utility Balm", "beardbrand-utility-balm", "balm dưỡng da+râu đa năng Mỹ", 480000, 540000, 30, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.85, 67, 201, pcBeard);
        createProductIfAbsent("Pacific Shaving Co. Caffeinated Shaving Cream", "pacific-shaving-caffeine", "kem cạo râu caffeine Pacific", 280000, 310000, 60, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.75, 89, 312, pcBeard);
        createProductIfAbsent("Every Man Jack Beard Oil", "every-man-jack-beard-oil", "dầu dưỡng râu tự nhiên sandalwood", 245000, 275000, 75, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.72, 134, 489, pcBeard);
        createProductIfAbsent("Burt's Bees Beard Oil", "burts-bees-beard-oil", "dầu dưỡng râu hữu cơ Burt's Bees", 310000, 350000, 45, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.78, 78, 245, pcBeard);
        createProductIfAbsent("Proraso Beard Balm Moisturizing", "proraso-beard-balm", "balm dưỡng mềm râu Ý eucalyptus", 310000, 350000, 50, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.80, 89, 278, pcBeard);
        createProductIfAbsent("Castle Forbes Lavender Shaving Cream", "castle-forbes-lavender", "kem cạo râu oải hương Scotland cao cấp", 1200000, 1350000, 5, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.97, 23, 45, pcBeard);
        createProductIfAbsent("Musgo Real Shaving Soap", "musgo-real-soap", "xà phòng cạo râu Bồ Đào Nha truyền thống", 580000, 650000, 15, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.92, 34, 89, pcBeard);
        createProductIfAbsent("Alum Block Crystal", "alum-block-crystal", "đá phèn cầm máu sau cạo râu", 95000, 110000, 200, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.70, 456, 1800, pcBeard);
        createProductIfAbsent("Taylor of Old Bond Street Sandalwood", "taylor-obs-sandalwood", "kem cạo râu đàn hương Anh Quốc cổ điển", 780000, 860000, 10, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.93, 45, 112, pcBeard);
        
        createProductIfAbsent("Wahl Senior Corded Professional", "wahl-senior-corded", "tông đơ cắm điện chuyên nghiệp Wahl", 2100000, 2350000, 12, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.90, 89, 234, pcTool);
        createProductIfAbsent("Andis Master Adjustable Blade", "andis-master-adjustable", "tông đơ Mỹ lưỡi điều chỉnh nổi tiếng", 3200000, 3600000, 8, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.95, 67, 145, pcTool);
        createProductIfAbsent("Oster Classic 76 Universal Motor", "oster-classic-76", "tông đơ Oster motor mạnh cổ điển", 2800000, 3200000, 6, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.92, 45, 98, pcTool);
        createProductIfAbsent("Philips HC3505 Hair Clipper", "philips-hc3505", "tông đơ Philips tự cắt tại nhà", 890000, 990000, 35, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.65, 678, 2340, pcTool);
        createProductIfAbsent("BaByliss Pro FX870 Nano Titanium", "babyliss-pro-fx870", "tông đơ titanium cao cấp BaByliss", 3500000, 3900000, 5, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.97, 34, 67, pcTool);
        createProductIfAbsent("Dyson Supersonic Hair Dryer", "dyson-supersonic-dryer", "máy sấy Dyson cao cấp nhất", 12000000, 13500000, 3, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.98, 23, 34, pcTool);
        createProductIfAbsent("Rowenta Powerline Extreme Dryer", "rowenta-powerline-extreme", "máy sấy 2400W Rowenta chuyên nghiệp", 1950000, 2200000, 15, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.87, 67, 189, pcTool);
        createProductIfAbsent("Parlux 3200 Compact Hair Dryer", "parlux-3200-compact", "máy sấy salon Parlux Italy", 3800000, 4300000, 8, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.93, 45, 98, pcTool);
        createProductIfAbsent("Hot Comb Electric Press", "hot-comb-electric-press", "lược điện là thẳng tóc", 380000, 430000, 35, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.68, 89, 312, pcTool);
        createProductIfAbsent("BaByliss Pro Nano Titanium Flat Iron", "babyliss-flat-iron-nano", "máy duỗi tóc titanium", 1850000, 2100000, 18, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.88, 67, 189, pcTool);
        createProductIfAbsent("Remington S9500 Keratin Straight", "remington-keratin-straightener", "máy duỗi tóc keratin", 1450000, 1650000, 22, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.82, 89, 245, pcTool);
        createProductIfAbsent("Barber's Best Professional Scissors", "barbers-best-scissors", "kéo tỉa tóc thép Nhật chuyên nghiệp", 890000, 1000000, 25, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.90, 89, 234, pcTool);
        createProductIfAbsent("Kamisori Shear Experience 3", "kamisori-shear-exp3", "kéo tỉa tóc cao cấp Nhật Bản", 2200000, 2500000, 10, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.95, 45, 89, pcTool);
        createProductIfAbsent("Kent Handmade Comb Set", "kent-handmade-comb-set", "bộ lược Kent Anh Quốc làm thủ công", 485000, 545000, 30, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.88, 56, 167, pcTool);
        createProductIfAbsent("Denman Classic Styling Brush D3", "denman-d3-brush", "cọ tạo kiểu Denman D3 tốt nhất", 385000, 430000, 40, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.85, 78, 245, pcTool);
        createProductIfAbsent("Vidal Sassoon Round Brush", "vidal-sassoon-round-brush", "cọ tròn tạo sóng Vidal Sassoon", 245000, 275000, 55, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.75, 89, 312, pcTool);
        createProductIfAbsent("Barber Cape Waterproof Professional", "barber-cape-waterproof", "áo choàng khách barber không thấm nước", 185000, 210000, 80, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.68, 156, 590, pcTool);
        createProductIfAbsent("Neck Brush Feather Soft", "neck-brush-feather-soft", "cọ quét tóc cổ lông mềm chuyên nghiệp", 95000, 110000, 150, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.72, 234, 890, pcTool);
        createProductIfAbsent("Barber Spray Bottle Professional", "barber-spray-bottle-pro", "bình xịt nước tóc áp suất barber", 125000, 145000, 200, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.65, 345, 1200, pcTool);
        createProductIfAbsent("Hot Towel Steamer Cabinet", "hot-towel-steamer-cabinet", "tủ hấp khăn nóng salon", 4500000, 5000000, 4, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.90, 23, 34, pcTool);
        
        createProductIfAbsent("Cetaphil Gentle Skin Cleanser", "cetaphil-gentle-cleanser", "sữa rửa mặt dịu nhẹ", 245000, 275000, 200, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.85, 789, 4500, pcSkin);
        createProductIfAbsent("La Roche-Posay Effaclar Gel", "laroche-effaclar-gel", "gel rửa mặt trị mụn La Roche", 395000, 445000, 80, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.90, 456, 2100, pcSkin);
        createProductIfAbsent("CeraVe Foaming Facial Cleanser", "cerave-foaming-cleanser", "sữa rửa mặt ceramide CeraVe", 295000, 325000, 150, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.87, 567, 2800, pcSkin);
        createProductIfAbsent("Kiehl's Facial Fuel Energizing", "kiehls-facial-fuel", "sữa rửa mặt nam Kiehl's", 690000, 760000, 25, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.88, 89, 234, pcSkin);
        createProductIfAbsent("Clinique For Men Wash", "clinique-men-wash", "gel rửa mặt nam Clinique", 590000, 650000, 20, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.85, 67, 178, pcSkin);
        createProductIfAbsent("Neutrogena Men Invigorating Face Wash", "neutrogena-men-face-wash", "sữa rửa mặt nam mát lạnh", 185000, 210000, 200, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.72, 567, 3200, pcSkin);
        createProductIfAbsent("Vichy Normaderm Phytosolution", "vichy-normaderm-phyto", "gel rửa mặt mụn Vichy", 425000, 475000, 65, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.82, 156, 689, pcSkin);
        createProductIfAbsent("Paula's Choice 2% BHA Liquid", "paulas-choice-2pct-bha", "toner BHA trị mụn đầu đen", 890000, 980000, 18, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.93, 112, 345, pcSkin);
        createProductIfAbsent("Thayers Witch Hazel Toner", "thayers-witch-hazel", "toner cồn làm se lỗ chân lông", 310000, 350000, 75, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.80, 234, 890, pcSkin);
        createProductIfAbsent("The Ordinary Niacinamide 10%", "ordinary-niacinamide-10", "serum niacinamide thu nhỏ lỗ chân lông", 395000, 445000, 90, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.92, 456, 2100, pcSkin);
        createProductIfAbsent("Retinol 0.5% in Squalane Ordinary", "ordinary-retinol-05", "serum retinol chống lão hóa", 390000, 440000, 45, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.88, 234, 789, pcSkin);
        createProductIfAbsent("Clinique Dramatically Different Moisturizing", "clinique-ddml-plus", "kem dưỡng ẩm vàng Clinique", 790000, 870000, 20, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.90, 89, 234, pcSkin);
        createProductIfAbsent("Kiehl's Ultra Facial Cream", "kiehls-ultra-facial-cream", "kem dưỡng ẩm sâu 24h Kiehl's", 850000, 940000, 15, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.92, 67, 178, pcSkin);
        createProductIfAbsent("Jack Black Double-Duty Face Moisturizer", "jack-black-double-duty", "kem dưỡng ẩm + SPF 20 Jack Black", 590000, 650000, 30, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.85, 89, 267, pcSkin);
        createProductIfAbsent("Lumene Nordic C Vitamin C Serum", "lumene-vitamin-c-serum", "serum vitamin C dưỡng sáng Bắc Âu", 680000, 750000, 25, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.88, 78, 212, pcSkin);
        createProductIfAbsent("Biore UV Aqua Rich Watery Essence", "biore-uv-aqua-rich", "kem chống nắng Nhật SPF 50+ lỏng nhẹ", 245000, 275000, 150, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.90, 678, 3400, pcSkin);
        createProductIfAbsent("Anessa Perfect UV Sunscreen", "anessa-perfect-uv", "kem chống nắng Anessa vàng SPF 50+", 485000, 545000, 80, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.95, 456, 2100, pcSkin);
        createProductIfAbsent("Round Lab Dokdo Toner", "roundlab-dokdo-toner", "toner khoáng Hàn Quốc cân bằng da", 345000, 385000, 60, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.82, 134, 512, pcSkin);
        createProductIfAbsent("COSRX Advanced Snail 96 Mucin Power", "cosrx-snail-96-mucin", "essence ốc sên COSRX dưỡng ẩm sâu", 490000, 545000, 55, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.90, 345, 1560, pcSkin);
        createProductIfAbsent("Innisfree Green Tea Seed Serum", "innisfree-green-tea-serum", "serum trà xanh Innisfree Hàn Quốc", 485000, 540000, 50, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.85, 234, 890, pcSkin);
        createProductIfAbsent("SKIN1004 Madagascar Centella", "skin1004-centella-ampoule", "ampoule rau má chữa lành da", 380000, 430000, 65, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.87, 156, 612, pcSkin);
        createProductIfAbsent("Some By Mi AHA BHA PHA 30 Days", "somebymi-aha-bha-30days", "toner tái tạo da AHA BHA PHA", 315000, 355000, 80, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.82, 234, 890, pcSkin);
        createProductIfAbsent("Klairs Rich Moist Soothing Cream", "klairs-rich-moist-cream", "kem dưỡng ẩm phục hồi Klairs", 445000, 500000, 45, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.85, 134, 489, pcSkin);
        createProductIfAbsent("Dear Klairs Midnight Blue Calming Cream", "klairs-midnight-blue", "kem phục hồi da ban đêm Klairs", 450000, 510000, 40, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.87, 112, 367, pcSkin);
        createProductIfAbsent("Needly Vita C-Tive Serum", "needly-vita-ctive", "serum vitamin C siêu ổn định Hàn", 380000, 430000, 55, "https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&auto=format&fit=crop", 4.82, 89, 289, pcSkin);
        
        createProductIfAbsent("Kérastase Initialiste Advanced Scalp", "kerastase-initialiste", "serum mọc tóc Kérastase cao cấp", 1500000, 1680000, 8, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.95, 45, 89, pcScalp);
        createProductIfAbsent("Aveda Invati Men Exfoliating Shampoo", "aveda-invati-men", "dầu gội tẩy tế bào chết da đầu", 890000, 980000, 12, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.88, 56, 134, pcScalp);
        createProductIfAbsent("Nioxin System 4 Cleanser", "nioxin-system4-cleanser", "dầu gội system 4 cho tóc rụng nhiều", 690000, 760000, 15, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.85, 67, 178, pcScalp);
        createProductIfAbsent("Plantur 39 Phyto-Caffeine Shampoo", "plantur39-phyto-caffeine", "dầu gội caffeine Đức chống rụng nữ", 390000, 440000, 45, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.80, 134, 512, pcScalp);
        createProductIfAbsent("Alpecin Double Effect Caffeine Shampoo", "alpecin-double-effect", "dầu gội caffeine Alpecin Đức gàu+rụng", 285000, 320000, 60, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.78, 234, 890, pcScalp);
        createProductIfAbsent("The Ordinary Multi-Peptide Serum Hair", "ordinary-hair-peptide-serum", "serum peptide mọc tóc Ordinary", 790000, 890000, 18, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.85, 56, 145, pcScalp);
        createProductIfAbsent("Revivogen Scalp Therapy", "revivogen-scalp-therapy", "liệu pháp da đầu chống DHT rụng tóc", 1200000, 1350000, 10, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.82, 34, 89, pcScalp);
        createProductIfAbsent("Nizoral Anti-Dandruff Shampoo", "nizoral-anti-dandruff", "dầu gội trị gàu Nizoral 2% ketoconazole", 195000, 220000, 150, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.75, 567, 2800, pcScalp);
        createProductIfAbsent("BachBarber Scalp Detox Mask", "bachbarber-scalp-detox-mask", "mặt nạ detox da đầu BachBarber", 195000, 220000, 100, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.70, 89, 312, pcScalp);
        createProductIfAbsent("Viviscal Man Hair Growth Supplement", "viviscal-man-supplement", "viên uống mọc tóc Viviscal cho nam", 890000, 990000, 20, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.78, 67, 178, pcScalp);

        createProductIfAbsent("Satin Sleep Cap for Men", "satin-sleep-cap-men", "mũ ngủ satin bảo vệ tóc ban đêm", 145000, 165000, 100, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 4.65, 89, 345, pcAccessory);
        createProductIfAbsent("Swim Cap Professional Latex", "swim-cap-latex-pro", "mũ bơi latex chuyên nghiệp chống hóa chất", 95000, 110000, 150, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 4.60, 234, 890, pcAccessory);
        createProductIfAbsent("Mini Travel Hairbrush Set", "mini-travel-hairbrush-set", "bộ lược mini du lịch gập lại", 125000, 145000, 120, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 4.68, 156, 612, pcAccessory);
        createProductIfAbsent("Microfiber Hair Towel Wrap", "microfiber-hair-towel", "khăn vi sợi cuộn tóc siêu thấm", 145000, 165000, 130, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 4.72, 234, 890, pcAccessory);
        createProductIfAbsent("Bamboo Hair Clips Set 12pcs", "bamboo-hair-clips-set", "bộ kẹp tóc tre 12 chiếc", 95000, 110000, 200, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 4.65, 345, 1200, pcAccessory);
        createProductIfAbsent("Metal Alligator Clips Professional", "metal-alligator-clips-pro", "kẹp tóc cá sấu kim loại chuyên nghiệp", 185000, 210000, 80, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 4.70, 89, 312, pcAccessory);
        createProductIfAbsent("Elastic Hair Bands No-Crease 100pcs", "elastic-hair-bands-100pcs", "chun buộc tóc không để lại vết 100 chiếc", 65000, 80000, 300, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 4.62, 456, 2100, pcAccessory);
        createProductIfAbsent("Wide Tooth Detangling Comb", "wide-tooth-detangle-comb", "lược răng thưa gỡ rối tóc ướt", 85000, 95000, 200, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 4.68, 312, 1200, pcAccessory);
        createProductIfAbsent("Hair Diffuser Universal Fit", "hair-diffuser-universal", "phễu khuếch tán khí sấy tóc xoăn", 185000, 210000, 65, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 4.73, 89, 289, pcAccessory);
        createProductIfAbsent("Boar Bristle Paddle Brush", "boar-bristle-paddle", "cọ lợn massage da đầu kích thích mọc", 385000, 430000, 45, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 4.82, 78, 234, pcAccessory);

        // ── 45 ADDITIONAL REALISTIC BARBER PRODUCTS (To reach > 210 products) ──
        // Premium Hair Clays & Pomades
        createProductIfAbsent("Suavecito Matte Clay Pomade 113g", "suavecito-matte-clay-113g", "Sáp vuốt tóc Matte Clay từ Suavecito USA, độ giữ nếp cao, kết thúc mờ tự nhiên", 390000, 440000, 75, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.88, 142, 620, pcWax);
        createProductIfAbsent("Lockhart's Nevermore Matte Paste 105g", "lockharts-nevermore-matte-paste", "Paste tạo kiểu siêu nhẹ, hương đào và khói độc đáo, độ giữ nếp vững chắc", 460000, 520000, 40, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.90, 88, 310, pcWax);
        createProductIfAbsent("Shear Revival Northern Lights Matte Paste", "shear-revival-northern-lights", "Sản phẩm thủ công tự nhiên cao cấp, giàu khoáng chất nuôi dưỡng sợi tóc", 480000, 540000, 35, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.92, 115, 410, pcWax);
        createProductIfAbsent("Grim Grease Heavy Hold Pomade", "grim-grease-heavy-hold", "Pomade gốc nước giữ nếp cực khủng, thích hợp mái tóc dày rễ tre và kiểu slick back", 450000, 500000, 50, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 4.85, 96, 380, pcWax);
        createProductIfAbsent("Firsthand Supply Clay Pomade 88ml", "firsthand-supply-clay-pomade", "Clay pomade hữu cơ từ Firsthand Supply USA, mềm mượt và dễ vuốt", 490000, 550000, 30, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.89, 72, 290, pcWax);
        createProductIfAbsent("Uppercut Deluxe Matt Pomade 100g", "uppercut-deluxe-matt-pomade", "Dòng sáp mờ huyền thoại của Úc, thơm hương caramel tinh tế, rửa trôi cực dễ", 410000, 460000, 85, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.84, 180, 890, pcWax);
        createProductIfAbsent("O'Douds Standard Pomade High Shine", "odouds-standard-pomade", "Pomade thuần chay độ bóng cổ điển, bổ sung sáp cám gạo bảo vệ tóc", 470000, 520000, 45, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.81, 64, 210, pcWax);
        createProductIfAbsent("Templeton Tonics Oasis Clay", "templeton-tonics-oasis-clay", "Clay tạo phồng cực đại volume, hương Trailhead thiên nhiên rừng tuyết tùng", 510000, 580000, 25, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.95, 52, 195, pcWax);

        // Shampoos & Conditioners
        createProductIfAbsent("Moroccanoil Moisture Repair Shampoo 500ml", "moroccanoil-moisture-repair-500ml", "Dầu gội phục hồi hư tổn với dầu argan nguyên chất và keratin thủy phân", 780000, 860000, 30, "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&auto=format&fit=crop", 4.94, 98, 340, pcCare);
        createProductIfAbsent("Aveda Men Pure-Formance Shampoo 300ml", "aveda-men-pure-formance-shampoo", "Dầu gội hữu cơ cho nam Aveda, làm dịu da đầu, kiềm dầu thừa 24h", 690000, 750000, 25, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.86, 75, 230, pcCare);
        createProductIfAbsent("Davines Energizing Shampoo Chống Rụng 250ml", "davines-energizing-shampoo-250ml", "Dầu gội kích thích mọc tóc và tăng cường vi tuần hoàn da đầu Davines Italy", 450000, 490000, 60, "https://images.unsplash.com/photo-1608248597359-00624a0d8e8b?w=400&auto=format&fit=crop", 4.91, 145, 520, pcCare);
        createProductIfAbsent("Nioxin System 2 Cleanser Shampoo", "nioxin-system-2-cleanser", "Dầu gội thanh lọc nang tóc, chuyên trị tóc mỏng xơ mảnh, tăng mật độ tóc", 520000, 580000, 40, "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&auto=format&fit=crop", 4.83, 62, 190, pcCare);
        createProductIfAbsent("Redken Brews Daily Shampoo For Men", "redken-brews-daily-shampoo", "Dầu gội chiết xuất mạch nha bổ sung protein cho sợi tóc chắc khỏe hàng ngày", 380000, 420000, 70, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.79, 84, 380, pcCare);
        createProductIfAbsent("Kérastase Genesis Homme Bain de Masse", "kerastase-genesis-homme-bain", "Dầu gội làm dày tóc tức thì với phức hợp creatine và rễ gừng quý hiếm", 820000, 920000, 20, "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&auto=format&fit=crop", 4.96, 54, 180, pcCare);
        createProductIfAbsent("Baxter of California Daily Fortifying Shampoo", "baxter-daily-fortifying-shampoo", "Dầu gội tăng cường độ bóng mượt với tinh dầu trà xanh và lúa mì", 590000, 650000, 35, "https://images.unsplash.com/photo-1608248597359-00624a0d8e8b?w=400&auto=format&fit=crop", 4.82, 48, 160, pcCare);

        // Pre-styling & Sprays
        createProductIfAbsent("By Vilain Sidekick Pre-styling Spray 155ml", "by-vilain-sidekick-spray", "Xịt phồng tóc Sidekick Đan Mạch bảo vệ nhiệt 150°C, giữ nếp dẻo dai", 440000, 490000, 55, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.87, 120, 560, pcPre);
        createProductIfAbsent("Reuzel Grooming Tonic Hair Spray 350ml", "reuzel-grooming-tonic-350ml", "Nước dưỡng phồng tóc cổ điển từ Schorem Barber Hà Lan, thơm hương táo ngọt", 390000, 430000, 65, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 4.84, 140, 670, pcPre);
        createProductIfAbsent("Hanz de Fuko Modify Pomade High Sheen", "hanz-de-fuko-modify-pomade", "Pomade dưỡng ẩm cao độ bóng mượt sang trọng cho kiểu Pompadour", 450000, 500000, 40, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.80, 55, 230, pcPre);
        createProductIfAbsent("TIGI Bed Head Hard Head Hairspray 385ml", "tigi-bed-head-hard-head-spray", "Gôm khóa form tóc siêu cứng cấp độ 5, chống ẩm mốc thời tiết nồm", 310000, 350000, 80, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 4.77, 95, 480, pcPre);
        createProductIfAbsent("Schwarzkopf Osis+ Session Extreme Hold Spray", "schwarzkopf-osis-session-spray", "Gôm xịt Osis+ số 3 giữ form bền bỉ 48h không làm khô gãy tóc", 360000, 400000, 90, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 4.85, 112, 590, pcPre);

        // Beard Care & Shaving
        createProductIfAbsent("Honest Amish Classic Beard Oil 60ml", "honest-amish-classic-beard-oil", "Tinh dầu dưỡng râu hữu cơ thuần khiết số 1 tại Mỹ, làm mềm râu cứng ráp", 420000, 480000, 50, "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&auto=format&fit=crop", 4.90, 86, 340, pcBeard);
        createProductIfAbsent("Viking Revolution Beard Balm Sandalwood", "viking-revolution-beard-balm", "Sáp dưỡng tạo hình râu hương gỗ đàn hương lịch lãm, nuôi dưỡng chân râu", 360000, 400000, 60, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.82, 70, 270, pcBeard);
        createProductIfAbsent("Truefitt & Hill 1805 Shaving Cream", "truefitt-hill-1805-shaving-cream", "Kem cạo râu Hoàng gia Anh Truefitt & Hill 1805, bọt mịn êm ái lướt dao", 650000, 720000, 25, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.97, 45, 150, pcBeard);
        createProductIfAbsent("Merkur 34C Heavy Duty Safety Razor", "merkur-34c-safety-razor", "Dao cạo hai lưỡi an toàn Merkur Solingen Đức, kim loại mạ crom sáng bóng", 1150000, 1300000, 20, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.98, 62, 190, pcBeard);
        createProductIfAbsent("Clubman Pinaud After Shave Lotion 177ml", "clubman-pinaud-aftershave-177ml", "Lotion làm dịu da sau cạo râu Clubman France, khử khuẩn se khít chân lông", 270000, 310000, 85, "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400&auto=format&fit=crop", 4.80, 105, 450, pcBeard);

        // Professional Barber Tools
        createProductIfAbsent("Andis Master Cordless Gold Edition", "andis-master-cordless-gold", "Tông đơ cắt tóc Andis Master vỏ kim loại mạ vàng, tốc độ 7200 vòng/phút", 3650000, 4100000, 12, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.99, 48, 85, pcTool);
        createProductIfAbsent("BabylissPRO GoldFX Outlining Trimmer", "babyliss-pro-goldfx-trimmer", "Tông đơ chấn viền lưỡi T-blade titan 360 độ siêu nét của Pháp", 2950000, 3300000, 15, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 4.97, 65, 130, pcTool);
        createProductIfAbsent("Gamma+ Wireless Prodigy Foil Shaver", "gamma-wireless-prodigy-shaver", "Máy cạo khô cạo trọc màng titan vàng chống kích ứng da, pin 120 phút", 1850000, 2100000, 18, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.91, 38, 92, pcTool);
        createProductIfAbsent("Dyson Supersonic Hair Dryer Pro Edition", "dyson-supersonic-pro-edition", "Máy sấy tóc thông minh kiểm soát nhiệt độ Dyson V9 chuyên nghiệp", 10990000, 12500000, 8, "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=400&auto=format&fit=crop", 5.00, 32, 45, pcTool);
        createProductIfAbsent("Y.S. Park 339 Professional Cutting Comb", "ys-park-339-comb", "Lược cắt tóc chuyên nghiệp Y.S. Park Nhật Bản chịu nhiệt 220°C", 290000, 340000, 95, "https://images.unsplash.com/photo-1590439471364-192aa70c0b53?w=400&auto=format&fit=crop", 4.93, 110, 520, pcTool);

        // Skincare & Scalp & Accessories
        createProductIfAbsent("The Ordinary Niacinamide 10% + Zinc 1%", "the-ordinary-niacinamide-zinc", "Serum thu nhỏ lỗ chân lông và kiềm dầu sáng da nam giới", 230000, 260000, 120, "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop", 4.88, 215, 980, pcSkin);
        createProductIfAbsent("CeraVe Foaming Cleanser For Men 473ml", "cerave-foaming-cleanser-men-473ml", "Sữa rửa mặt dạng gel tạo bọt kiểm soát bã nhờn dịu nhẹ cho nam", 390000, 440000, 85, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.92, 175, 730, pcSkin);
        createProductIfAbsent("Kiehl's Facial Fuel Energizing Moisture", "kiehls-facial-fuel-moisture-75ml", "Kem dưỡng ẩm hồi sinh da mệt mỏi với chiết xuất hạt dẻ và caffeine", 790000, 890000, 40, "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?w=400&auto=format&fit=crop", 4.95, 68, 240, pcSkin);
        createProductIfAbsent("Jack Black Double-Duty Face Moisturizer SPF 20", "jack-black-double-duty-moisturizer", "Kem dưỡng kiêm chống nắng bảo vệ da nam giới hàng ngày", 680000, 760000, 35, "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=400&auto=format&fit=crop", 4.86, 52, 180, pcSkin);
        createProductIfAbsent("Briogeo Scalp Revival Exfoliating Shampoo", "briogeo-scalp-revival-shampoo", "Dầu gội tẩy tế bào chết da đầu than hoạt tính và tràm trà hữu cơ", 850000, 950000, 25, "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=400&auto=format&fit=crop", 4.94, 60, 210, pcScalp);
        createProductIfAbsent("The Ordinary Multi-Peptide Serum for Hair Density", "the-ordinary-peptide-hair-density", "Serum peptide nồng độ cao kích thích nang tóc mọc dày và bồng bềnh", 450000, 520000, 90, "https://images.unsplash.com/photo-1608248597359-00624a0d8e8b?w=400&auto=format&fit=crop", 4.89, 140, 610, pcScalp);
        createProductIfAbsent("BachBarber Premium Leather Barber Apron", "bachbarber-leather-apron", "Tạp dề barber da bò cao cấp chống thấm nước, nhiều ngăn đựng dụng cụ", 650000, 750000, 30, "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop", 4.96, 42, 115, pcAccessory);
        createProductIfAbsent("Barber Cape Striped Waterproof", "barber-cape-striped-waterproof", "Khăn choàng cắt tóc kẻ sọc barber cổ điển chống dính tóc", 145000, 180000, 150, "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop", 4.75, 120, 540, pcAccessory);

        log.info("🎉 Seeded realistic barber products and categories successfully! Total products: {}", productRepository.count());
    }

    private void seedProductReviews() {
        List<Product> products = productRepository.findAll();
        List<User> users = userRepository.findAll();
        if (products.isEmpty() || users.isEmpty()) return;

        User u1 = users.get(0);
        User u2 = users.size() > 1 ? users.get(1) : u1;
        User u3 = users.size() > 2 ? users.get(2) : u1;
        User u4 = users.size() > 3 ? users.get(3) : u2;

        String[] reviewTexts = new String[]{
            "Sáp vuốt rất thơm, độ giữ nếp tự nhiên không bị bết rít. Đáng đồng tiền!",
            "Dầu gội phục hồi tốt, gội xong đầu nhẹ tênh sảng khoái cực kỳ.",
            "Giao hàng siêu nhanh trong 2 tiếng, đóng gói xịn xò 10/10.",
            "Dùng kết hợp với xịt pre-styling tạo phồng thì bao đẹp cả ngày.",
            "Chất sáp mềm, dễ restyle lại sau khi đội mũ bảo hiểm.",
            "Tinh dầu thơm sang trọng, râu mềm hẳn sau 3 ngày sử dụng.",
            "Tông đơ cắt ngọt lịm, lưỡi fade sát da đầu không bị cắn tóc.",
            "Máy sấy công suất mạnh, nhẹ tay, sấy nhanh khô mà không nóng rát da đầu.",
            "Dùng rất thích, da đầu sạch gàu hoàn toàn sau 1 tuần.",
            "Hàng chính hãng chuẩn barber, quét mã QR ra thông tin rõ ràng.",
            "Rất hài lòng, sẽ tiếp tục ủng hộ BachBarber Shop!",
            "Sản phẩm chất lượng vượt trội so với các loại mua trôi nổi ngoài thị trường."
        };

        int count = 0;
        for (int i = 0; i < Math.min(products.size(), 40); i++) {
            Product prod = products.get(i);
            if (reviewRepository.findByProductIdOrderByCreatedAtDesc(prod.getId()).isEmpty()) {
                reviewRepository.save(Review.builder()
                        .product(prod)
                        .user(u1)
                        .rating(5)
                        .reviewContent(reviewTexts[i % reviewTexts.length])
                        .type("PRODUCT")
                        .build());

                reviewRepository.save(Review.builder()
                        .product(prod)
                        .user(i % 2 == 0 ? u2 : u3)
                        .rating((i % 4 == 0) ? 4 : 5)
                        .reviewContent(reviewTexts[(i + 3) % reviewTexts.length])
                        .type("PRODUCT")
                        .build());

                if (i % 3 == 0) {
                    reviewRepository.save(Review.builder()
                            .product(prod)
                            .user(u4)
                            .rating(5)
                            .reviewContent(reviewTexts[(i + 7) % reviewTexts.length])
                            .type("PRODUCT")
                            .build());
                }
                count++;
            }
        }
        log.info("🎉 Seeded customer product reviews for {} products!", count);
    }

    private void seedPeriodBookings() {
        List<Stylist> stylists = stylistRepository.findAll();
        List<User> users = userRepository.findAll();
        List<Salon> salons = salonRepository.findAll();
        List<ServiceOffering> services = serviceOfferingRepository.findAll();

        if (stylists.isEmpty() || users.isEmpty() || salons.isEmpty() || services.isEmpty()) return;

        Salon salon = salons.get(0);
        User u0 = users.get(0);
        User u1 = users.size() > 1 ? users.get(1) : u0;
        User u2 = users.size() > 2 ? users.get(2) : u0;
        ServiceOffering sCut = services.get(0);
        ServiceOffering sWash = services.size() > 1 ? services.get(1) : sCut;

        LocalDateTime now = LocalDateTime.now();
        int counter = 200;

        for (Stylist stylist : stylists) {
            // 1. Today bookings (Hours 9, 11, 14, 16)
            int[] todayHours = new int[]{9, 11, 14, 16};
            for (int h : todayHours) {
                LocalDateTime startTime = now.withHour(h).withMinute(0).withSecond(0).withNano(0);
                Booking bToday = bookingRepository.save(Booking.builder()
                        .bookingCode(String.format("BB-TODAY-%04d", counter++))
                        .customerName(u0.getFullName())
                        .customerPhone(u0.getPhoneNumber())
                        .customerEmail(u0.getEmail())
                        .startTime(startTime)
                        .endTime(startTime.plusMinutes(45))
                        .actualCheckinTime(startTime)
                        .actualCheckoutTime(startTime.plusMinutes(45))
                        .salon(salon)
                        .user(u0)
                        .stylist(stylist)
                        .status(h < 14 ? BookingStatus.COMPLETED : BookingStatus.CONFIRMED)
                        .subtotalAmount(sCut.getPrice())
                        .discountAmount(BigDecimal.ZERO)
                        .totalAmount(sCut.getPrice())
                        .paymentStatus(h < 14 ? "PAID" : "UNPAID")
                        .paymentMethod("BANK_TRANSFER")
                        .bookingSource("WEB")
                        .build());
                bookingDetailRepository.save(BookingDetail.builder().booking(bToday).serviceOffering(sCut).currentPrice(sCut.getPrice()).build());
            }

            // 2. Past days of this week (Mon-Sun)
            for (int d = 1; d <= 6; d++) {
                LocalDateTime pastDay = now.minusDays(d).withHour(10).withMinute(30).withSecond(0).withNano(0);
                Booking bPastDay = bookingRepository.save(Booking.builder()
                        .bookingCode(String.format("BB-WEEK-%04d", counter++))
                        .customerName(u1.getFullName())
                        .customerPhone(u1.getPhoneNumber())
                        .customerEmail(u1.getEmail())
                        .startTime(pastDay)
                        .endTime(pastDay.plusMinutes(60))
                        .actualCheckinTime(pastDay)
                        .actualCheckoutTime(pastDay.plusMinutes(55))
                        .salon(salon)
                        .user(u1)
                        .stylist(stylist)
                        .status(BookingStatus.COMPLETED)
                        .subtotalAmount(sWash.getPrice())
                        .discountAmount(BigDecimal.ZERO)
                        .totalAmount(sWash.getPrice())
                        .paymentStatus("PAID")
                        .paymentMethod("BANK_TRANSFER")
                        .bookingSource("WEB")
                        .build());
                bookingDetailRepository.save(BookingDetail.builder().booking(bPastDay).serviceOffering(sWash).currentPrice(sWash.getPrice()).build());
            }

            // 3. Different months of this year
            for (int m = 1; m <= Math.min(8, now.getMonthValue() - 1); m++) {
                LocalDateTime pastMonth = now.withMonth(m).withDayOfMonth(15).withHour(14).withMinute(0).withSecond(0).withNano(0);
                Booking bMonth = bookingRepository.save(Booking.builder()
                        .bookingCode(String.format("BB-YEAR-%04d", counter++))
                        .customerName(u2.getFullName())
                        .customerPhone(u2.getPhoneNumber())
                        .customerEmail(u2.getEmail())
                        .startTime(pastMonth)
                        .endTime(pastMonth.plusMinutes(45))
                        .salon(salon)
                        .user(u2)
                        .stylist(stylist)
                        .status(BookingStatus.COMPLETED)
                        .subtotalAmount(sCut.getPrice())
                        .discountAmount(BigDecimal.ZERO)
                        .totalAmount(sCut.getPrice())
                        .paymentStatus("PAID")
                        .paymentMethod("CASH")
                        .bookingSource("WEB")
                        .build());
                bookingDetailRepository.save(BookingDetail.builder().booking(bMonth).serviceOffering(sCut).currentPrice(sCut.getPrice()).build());
            }
        }
        log.info("🎉 Seeded dynamic period bookings across Day/Week/Month/Year successfully!");
    }

    private void seedSampleOrders() {
        List<User> users = userRepository.findAll();
        List<Product> products = productRepository.findAll();
        if (users.isEmpty() || products.isEmpty()) return;

        User u0 = users.get(0);
        User u1 = users.size() > 1 ? users.get(1) : u0;
        User u2 = users.size() > 2 ? users.get(2) : u0;

        Product p1 = products.get(0);
        Product p2 = products.size() > 1 ? products.get(1) : p1;
        Product p3 = products.size() > 2 ? products.get(2) : p1;

        OrderStatus[] statuses = new OrderStatus[]{
            OrderStatus.PENDING, OrderStatus.CONFIRMED, OrderStatus.PROCESSING,
            OrderStatus.SHIPPING, OrderStatus.DELIVERED, OrderStatus.CANCELLED
        };

        for (int i = 0; i < 12; i++) {
            User u = (i % 3 == 0) ? u0 : ((i % 3 == 1) ? u1 : u2);
            Product p = (i % 3 == 0) ? p1 : ((i % 3 == 1) ? p2 : p3);
            OrderStatus status = statuses[i % statuses.length];
            PaymentMethod pm = (i % 2 == 0) ? PaymentMethod.BANK_TRANSFER : PaymentMethod.COD;
            PaymentStatus ps = (status == OrderStatus.DELIVERED || status == OrderStatus.CONFIRMED || status == OrderStatus.SHIPPING)
                    ? PaymentStatus.SUCCESS : PaymentStatus.PENDING;

            BigDecimal total = p.getPrice().multiply(BigDecimal.valueOf(1 + (i % 2)));
            BigDecimal shipping = total.compareTo(BigDecimal.valueOf(500000)) >= 0 ? BigDecimal.ZERO : BigDecimal.valueOf(30000);

            Order order = Order.builder()
                    .orderCode(String.format("DH2609%04d", 100 + i))
                    .user(u)
                    .receiverName(u.getFullName())
                    .receiverPhone(u.getPhoneNumber() != null ? u.getPhoneNumber() : "0901234567")
                    .shippingAddress("Số " + (10 + i * 2) + " Phố Cầu Giấy, Quận Cầu Giấy, Hà Nội")
                    .note("Giao giờ hành chính")
                    .totalAmount(total)
                    .shippingFee(shipping)
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(total.add(shipping))
                    .paymentMethod(pm)
                    .paymentStatus(ps)
                    .status(status)
                    .build();

            OrderDetail detail = OrderDetail.builder()
                    .order(order)
                    .product(p)
                    .quantity(1 + (i % 2))
                    .unitPrice(p.getPrice())
                    .totalPrice(total)
                    .build();

            order.setOrderDetails(List.of(detail));
            orderRepository.save(order);
        }
        log.info("🎉 Seeded 12 sample shop orders across all statuses for Admin management!");
    }

    private void createProductIfAbsent(String name, String slug, String description,
                                       long price, long origPrice, int stock, String imageUrl,
                                       double rating, int reviews, int sold, ProductCategory category) {
        if (productRepository.findBySlug(slug).isEmpty()) {
            productRepository.save(Product.builder()
                    .name(name)
                    .slug(slug)
                    .description(description)
                    .price(BigDecimal.valueOf(price))
                    .originalPrice(BigDecimal.valueOf(origPrice))
                    .stockQuantity(stock)
                    .imageUrl(imageUrl)
                    .rating(rating)
                    .reviewCount(reviews)
                    .soldCount(sold)
                    .active(true)
                    .category(category)
                    .build());
        }
    }
}

