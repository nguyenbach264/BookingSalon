package demo.bookingsalon.PaymentTest;

import demo.bookingsalon.Entity.*;
import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Repository.*;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@DataJpaTest
@Testcontainers
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
public class PaymentRepositoryTest {
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private SalonRepository salonRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private StylistRepository stylistRepository;
    @Autowired private BookingRepository bookingRepository;

    @Container
    @ServiceConnection
    private static MySQLContainer<?> mySQLContainer = new MySQLContainer<>("mysql:8.4")
            .withDatabaseName("testdb");

    private Booking booking;
    private Payment payment;

    @BeforeEach
    void setup() {
        Set<UUID> serviceIds = new HashSet<>();
        serviceIds.add(UUID.fromString("50000000-0000-0000-0000-000000000001"));
        serviceIds.add(UUID.fromString("50000000-0000-0000-0000-000000000002"));
        serviceIds.add(UUID.fromString("50000000-0000-0000-0000-000000000005"));

        Salon salon = salonRepository.save(Salon.builder()
                .salonName("Test Salon")
                .address("123 Test Street")
                .phoneNumber("0901234567")
                .email("salon@test.com")
                .city("Ho Chi Minh")
                .openTime(java.time.LocalTime.of(8, 0))
                .closeTime(java.time.LocalTime.of(20, 0))
                .build());

        User user = userRepository.save(User.builder()
                .username("testuser")
                .fullName("Test User")
                .email("user@test.com")
                .phoneNumber("0912345678")
                .enabled(true)
                .build());

        Stylist stylist = stylistRepository.save(Stylist.builder()
                .keycloakId(UUID.randomUUID())
                .username("teststylist")
                .fullName("Test Stylist")
                .email("stylist@test.com")
                .phoneNumber("0923456789")
                .enabled(true)
                .salon(salon)
                .build());

        booking = bookingRepository.save(Booking.builder()
                .user(user)
                .stylist(stylist)
                .salon(salon)
                .status(BookingStatus.PENDING)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusMinutes(5))
                .totalAmount(BigDecimal.valueOf(205000))
                .build());

        payment = Payment.builder()
                .booking(booking)
                .salon(booking.getSalon())
                .user(booking.getUser())
                .amount(booking.getTotalAmount())
                .paymentMethod(PaymentMethod.COD)
                .transactions(new ArrayList<>())
                .status(PaymentStatus.PENDING)
                .paymentCode("PAY30070942")
                .build();
    }

    @Test
    public void savePayment() {
        Payment paymentSaved = paymentRepository.save(payment);

        log.info("payment_response: {}", paymentSaved);
        log.info("database_name: {}", mySQLContainer.getDatabaseName());
        log.info("username: {}", mySQLContainer.getUsername());
        log.info("password: {}", mySQLContainer.getPassword());
        log.info("jdbc_url: {}", mySQLContainer.getJdbcUrl());

        assertThat(paymentSaved.getId()).isNotNull();
        assertThat(paymentSaved.getPaymentCode()).isEqualTo("PAY30070942");
    }

    @Test
    public void testFindByPaymentCode() {
        paymentRepository.save(payment);

        Optional<Payment> paymentOptional = paymentRepository.findByPaymentCode("PAY30070942");

        assertThat(paymentOptional).isPresent();
        assertThat(paymentOptional.get().getPaymentCode()).isEqualTo("PAY30070942");
    }
}
