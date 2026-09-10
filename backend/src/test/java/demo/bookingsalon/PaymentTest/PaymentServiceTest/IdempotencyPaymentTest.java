package demo.bookingsalon.PaymentTest.PaymentServiceTest;

import demo.bookingsalon.Entity.Booking;
import demo.bookingsalon.Entity.Salon;
import demo.bookingsalon.Entity.Stylist;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Payload.Request.Business.CreatePaymentRequest;
import demo.bookingsalon.Payload.Response.Business.PaymentResponse;
import demo.bookingsalon.Repository.BookingRepository;
import demo.bookingsalon.Repository.PaymentRepository;
import demo.bookingsalon.Repository.SalonRepository;
import demo.bookingsalon.Repository.StylistRepository;
import demo.bookingsalon.Repository.UserRepository;
import demo.bookingsalon.Service.BookingService;
import demo.bookingsalon.Service.PaymentApplicationService;
import demo.bookingsalon.Utility.IdempotencyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.transaction.annotation.Transactional;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@Testcontainers
public class IdempotencyPaymentTest {

    @Container
    @ServiceConnection
    static MySQLContainer<?> mySQLContainer = new MySQLContainer<>("mysql:8.4");

    @Container
    @ServiceConnection
    static GenericContainer<?> redisContainer = new GenericContainer<>(DockerImageName.parse("redis:7-alpine"))
            .withExposedPorts(6379);

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Autowired private PaymentApplicationService paymentApplicationService;
    @Autowired private IdempotencyService idempotencyService;
    @Autowired private StringRedisTemplate redisTemplate;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private BookingRepository bookingRepository;
    @Autowired private SalonRepository salonRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private StylistRepository stylistRepository;
    @Autowired private BookingService bookingService;

    private Booking booking;
    private User user;
    private CreatePaymentRequest createPaymentRequest;
    private String businessKey;

    @BeforeEach
    void setup() {
        Objects.requireNonNull(redisTemplate.getConnectionFactory())
                .getConnection()
                .serverCommands()
                .flushAll();

        String suffix = UUID.randomUUID().toString().substring(0, 8);

        Set<UUID> serviceIds = new HashSet<>();
        serviceIds.add(UUID.fromString("50000000-0000-0000-0000-000000000001"));
        serviceIds.add(UUID.fromString("50000000-0000-0000-0000-000000000002"));
        serviceIds.add(UUID.fromString("50000000-0000-0000-0000-000000000005"));

        Salon salon = salonRepository.save(Salon.builder()
                .salonName("Test Salon " + suffix)
                .address("123 Test Street")
                .phoneNumber("090" + String.format("%07d", Math.abs(suffix.hashCode() % 10_000_000)))
                .email("salon-" + suffix + "@test.com")
                .city("Ho Chi Minh")
                .openTime(LocalDateTime.now().withHour(8).withMinute(0).withSecond(0).withNano(0))
                .closeTime(LocalDateTime.now().withHour(20).withMinute(0).withSecond(0).withNano(0))
                .openTime(java.time.LocalTime.of(8, 0))
                .closeTime(java.time.LocalTime.of(20, 0))
                .build());

        user = userRepository.save(User.builder()
                .username("user-" + suffix)
                .fullName("Test User")
                .email("user-" + suffix + "@test.com")
                .phoneNumber("091" + String.format("%07d", Math.abs((suffix + "u").hashCode() % 10_000_000)))
                .enabled(true)
                .build());

        Stylist stylist = stylistRepository.save(Stylist.builder()
                .keycloakId(UUID.randomUUID())
                .username("stylist-" + suffix)
                .fullName("Test Stylist")
                .email("stylist-" + suffix + "@test.com")
                .phoneNumber("092" + String.format("%07d", Math.abs((suffix + "s").hashCode() % 10_000_000)))
                .enabled(true)
                .salon(salon)
                .build());

        booking = bookingRepository.save(Booking.builder()
                .user(user)
                .stylist(stylist)
                .salon(salon)
                .status(BookingStatus.PENDING)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusMinutes(60))
                .totalAmount(BigDecimal.valueOf(264000))
                .totalServices(serviceIds.size())
                .serviceIds(serviceIds)
                .build());

        businessKey = user.getId() + "-" + booking.getId();

        createPaymentRequest = CreatePaymentRequest.builder()
                .bookingId(booking.getId())
                .amount(booking.getTotalAmount())
                .paymentMethod(PaymentMethod.COD)
                .build();
    }

    @Test
    @Transactional
    void checkout_FirstRequest_AcquiresRedisLockAndCreatesPayment() {
        PaymentResponse response = paymentApplicationService.checkout(createPaymentRequest);

        assertThat(response).isNotNull();
        assertThat(paymentRepository.findByBookingId(booking.getId())).isPresent();
        assertThat(idempotencyService.exists(businessKey)).isTrue();
        assertThat(idempotencyService.get(businessKey)).isEqualTo("PROCESSING");
        assertThat(redisTemplate.getExpire("idempotent:" + businessKey, TimeUnit.SECONDS)).isPositive();
    }

    @Test
    @Transactional
    void checkout_DuplicateRequest_ReturnsSamePayment_WithoutCreatingSecond() {
        PaymentResponse first = paymentApplicationService.checkout(createPaymentRequest);
        PaymentResponse second = paymentApplicationService.checkout(createPaymentRequest);

        assertThat(second.getPaymentCode()).isEqualTo(first.getPaymentCode());
        assertThat(paymentRepository.findAll()).hasSize(1);
        assertThat(idempotencyService.exists(businessKey)).isTrue();
    }

    @Test
    @Transactional
    void tryLock_SameKeyTwice_SecondCallFails() {
        assertThat(idempotencyService.tryLock(businessKey, 300)).isTrue();
        assertThat(idempotencyService.tryLock(businessKey, 300)).isFalse();
        assertThat(idempotencyService.get(businessKey)).isEqualTo("PROCESSING");
    }
}
