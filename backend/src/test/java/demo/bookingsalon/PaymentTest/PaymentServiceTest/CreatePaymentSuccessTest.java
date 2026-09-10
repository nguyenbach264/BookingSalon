package demo.bookingsalon.PaymentTest.PaymentServiceTest;

import demo.bookingsalon.Entity.*;
import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Factory.PaymentFactory;
import demo.bookingsalon.Mapper.BookingMapper;
import demo.bookingsalon.Mapper.PaymentMapper;
import demo.bookingsalon.Mapper.SalonMapper;
import demo.bookingsalon.Mapper.UserMapper;
import demo.bookingsalon.Payload.DTO.SalonDTO;
import demo.bookingsalon.Payload.Request.Business.CreatePaymentRequest;
import demo.bookingsalon.Payload.Response.Business.BookingResponse;
import demo.bookingsalon.Payload.Response.Business.PaymentResponse;
import demo.bookingsalon.Payload.Response.Business.UserResponse;
import demo.bookingsalon.Repository.PaymentRepository;
import demo.bookingsalon.Service.*;
import demo.bookingsalon.Strategy.CodPaymentStrategy;
import demo.bookingsalon.Utility.IdempotencyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CreatePaymentSuccessTest {
    @Mock
    private PaymentPersistenceService paymentPersistenceService;
    @Mock
    private BookingService bookingService;
    @Mock
    private BookingMapper bookingMapper;
    @Mock
    private PaymentFactory paymentFactory;
    @Mock
    private UserService userService;
    @Mock
    private UserMapper userMapper;
    @Mock
    private SalonService salonService;
    @Mock
    private SalonMapper salonMapper;
    @Mock
    private IdempotencyService idempotencyService;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private PaymentMapper paymentMapper;
    @Mock
    private ApplicationEventPublisher applicationEventPublisher;
    @Mock
    private CodPaymentStrategy codPaymentStrategy;

    @InjectMocks
    private PaymentApplicationService paymentApplicationService;

    private BookingResponse bookingResponse;
    private CreatePaymentRequest createPaymentRequest;
    private UserResponse userResponse;
    private SalonDTO salonDTO;
    private Payment payment;
    private Booking booking;
    private Salon salon;
    private User user;
    private PaymentResponse paymentResponse;
    private PaymentTransaction paymentTransaction;


    @BeforeEach
    void setup() throws Exception {
        Set<UUID> serviceIds = new HashSet<>();
        serviceIds.add(UUID.fromString("50000000-0000-0000-0000-000000000001"));
        serviceIds.add(UUID.fromString("50000000-0000-0000-0000-000000000002"));
        serviceIds.add(UUID.fromString("50000000-0000-0000-0000-000000000005"));

        UUID bookingId = UUID.fromString("60000000-0000-0000-0000-000000000000");
        UUID userId = UUID.fromString("10000000-0000-0000-0000-000000000006");
        UUID salonId = UUID.fromString("20000000-0000-0000-0000-000000000008");
        UUID stylistId = UUID.fromString("30000000-0000-0000-0000-000000000005");

        createPaymentRequest = CreatePaymentRequest.builder()
                .bookingId(bookingId)
                .amount(BigDecimal.valueOf(2005000))
                .paymentMethod(PaymentMethod.COD)
                .build();

        bookingResponse = BookingResponse.builder()
                .id(bookingId)
                .startTime(LocalDateTime.now())
                .endTime(LocalDateTime.now().plusMinutes(60))
                .salonId(salonId)
                .userId(userId)
                .stylistId(stylistId)
                .paymentMethod(createPaymentRequest.getPaymentMethod())
                .serviceIds(serviceIds)
                .status(BookingStatus.PENDING)
                .totalServices(3)
                .totalAmount(createPaymentRequest.getAmount())
                .build();

        userResponse = UserResponse.builder()
                .id(userId)
                .build();

        salonDTO = SalonDTO.builder()
                .id(salonId)
                .build();

        booking = new Booking();
        salon = new Salon();
        user = new User();

        payment = Payment.builder()
                .booking(bookingMapper.toBooking(bookingResponse))
                .salon(salonMapper.toSalon(salonDTO))
                .user(userMapper.toUserByUserReponse(userResponse))
                .amount(bookingResponse.getTotalAmount())
                .paymentMethod(createPaymentRequest.getPaymentMethod())
                .transactions(new ArrayList<>())
                .version(1)
                .status(PaymentStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        paymentResponse = PaymentResponse.builder()
                .paymentCode("PAY25071109")
                .status(PaymentStatus.PROCESSING)
                .build();

        paymentTransaction = new PaymentTransaction();
    }

    // Test 1: Tạo payment thành công, chuyển method sang
    @Test
    void testCreatePayment_Cod_Success() {
        when(bookingService.getBookingById(createPaymentRequest.getBookingId())).thenReturn(bookingResponse);

        when(idempotencyService.tryLock(anyString(), anyLong())).thenReturn(true);

        when(userService.getUserInDbById(bookingResponse.getUserId())).thenReturn(userResponse);

        when(salonService.getSalonById(bookingResponse.getSalonId())).thenReturn(salonDTO);

        when(bookingMapper.toBooking(bookingResponse)).thenReturn(booking);

        when(salonMapper.toSalon(salonDTO)).thenReturn(salon);

        when(userMapper.toUserByUserReponse(userResponse)).thenReturn(user);

        when(paymentPersistenceService.createPayment(any(Payment.class))).thenAnswer(
                invocation -> invocation.getArgument(0)
        );

        when(paymentFactory.getStrategy(PaymentMethod.COD)).thenReturn(codPaymentStrategy);

        when(codPaymentStrategy.generatePayment(any(), any())).thenReturn(paymentTransaction);

        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> {
            Payment p = invocation.getArgument(0);
            p.setPaymentCode("PAY25071109");
            return p;
        });

        when(paymentMapper.toPaymentResponse(any(Payment.class))).thenReturn(paymentResponse);

        PaymentResponse response = paymentApplicationService.checkout(createPaymentRequest);

        assertNotNull(response);

        assertEquals("PAY25071109", response.getPaymentCode());

        assertEquals(PaymentStatus.PROCESSING, response.getStatus());

        verify(paymentPersistenceService).createPayment(any());
        verify(paymentFactory).getStrategy(PaymentMethod.COD);
        verify(codPaymentStrategy).generatePayment(any(), any());
        verify(paymentRepository).save(any());
        verify(applicationEventPublisher, never()).publishEvent(any());
    }

    // Test 2: Idempotency Failed - request bị trùng lặp
    @Test
    void testIdempotency() {
        when(bookingService.getBookingById(createPaymentRequest.getBookingId())).thenReturn(bookingResponse);

        when(idempotencyService.tryLock(anyString(), anyLong())).thenReturn(false);

        when(paymentRepository.findByBookingId(any(UUID.class))).thenReturn(Optional.of(payment));

        when(paymentMapper.toPaymentResponse(payment)).thenReturn(paymentResponse);

        PaymentResponse response = paymentApplicationService.checkout(createPaymentRequest);

        assertEquals("PAY25071109", response.getPaymentCode());

        verify(idempotencyService).tryLock(anyString(), anyLong());
        verify(userService, never()).getUserInDbById(any(UUID.class));

    }
}
