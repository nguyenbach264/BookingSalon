package demo.bookingsalon.BookingTest;

import demo.bookingsalon.Entity.*;
import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Mapper.BookingMapper;
import demo.bookingsalon.Mapper.SalonMapper;
import demo.bookingsalon.Payload.DTO.SalonDTO;
import demo.bookingsalon.Payload.Request.Business.ApplyVoucherRequest;
import demo.bookingsalon.Payload.Request.Business.CreateBookingRequest;
import demo.bookingsalon.Payload.Response.Business.ApplyVoucherResponse;
import demo.bookingsalon.Payload.Response.Business.BookingResponse;
import demo.bookingsalon.Publisher.BookingEventPublisher;
import demo.bookingsalon.Repository.*;
import demo.bookingsalon.Service.BookingService;
import demo.bookingsalon.Service.NotificationService;
import demo.bookingsalon.Service.VoucherService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CreateBookingTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private BookingMapper bookingMapper;

    @Mock
    private SalonMapper salonMapper;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ServiceOfferingRepository offeringRepository;

    @Mock
    private SalonRepository salonRepository;

    @Mock
    private StylistRepository stylistRepository;

    @Mock
    private BookingDetailRepository bookingDetailRepository;

    @Mock
    private BookingEventPublisher bookingEventPublisher;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private UserVoucherRepository userVoucherRepository;

    @Mock
    private VoucherService voucherService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private demo.bookingsalon.Handler.NotificationWebSocketHandler notificationWebSocketHandler;

    @InjectMocks
    private BookingService bookingService;

    private UUID userId;
    private UUID stylistId;
    private UUID salonId;
    private UUID serviceId;
    private User testUser;
    private Stylist testStylist;
    private Salon testSalon;
    private SalonDTO testSalonDTO;
    private ServiceOffering testServiceOffering;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        stylistId = UUID.randomUUID();
        salonId = UUID.randomUUID();
        serviceId = UUID.randomUUID();

        testUser = User.builder()
                .id(userId)
                .username("customer")
                .fullName("Nguyen Van A")
                .email("customer@example.com")
                .phoneNumber("0912345678")
                .build();

        testStylist = Stylist.builder()
                .id(stylistId)
                .fullName("Stylist Pro")
                .status("ACTIVE")
                .build();

        testSalon = Salon.builder()
                .id(salonId)
                .salonName("BachBarber Cau Giay")
                .openTime(LocalTime.of(8, 0))
                .closeTime(LocalTime.of(21, 0))
                .build();

        testSalonDTO = new SalonDTO();
        testSalonDTO.setId(salonId);
        testSalonDTO.setOpenTime(LocalTime.of(8, 0));
        testSalonDTO.setCloseTime(LocalTime.of(21, 0));

        testServiceOffering = ServiceOffering.builder()
                .id(serviceId)
                .name("Cat toc Barber")
                .price(BigDecimal.valueOf(100000))
                .duration(45)
                .build();
    }

    @Test
    @DisplayName("UT-Booking-01: createBooking thành công khi đủ điều kiện và không trùng lịch")
    void testCreateBooking_Success() throws Exception {
        LocalDateTime startTime = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0);
        CreateBookingRequest request = CreateBookingRequest.builder()
                .userId(userId)
                .stylistId(stylistId)
                .salonId(salonId)
                .serviceIds(List.of(serviceId))
                .startTime(startTime)
                .customerName("Nguyen Van A")
                .customerPhone("0912345678")
                .build();

        when(offeringRepository.findAllById(request.getServiceIds())).thenReturn(List.of(testServiceOffering));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(stylistRepository.findById(stylistId)).thenReturn(Optional.of(testStylist));
        when(salonRepository.findById(salonId)).thenReturn(Optional.of(testSalon));
        when(salonMapper.toSalonDTO(testSalon)).thenReturn(testSalonDTO);
        when(bookingRepository.findConflictingBookingsByStylist(eq(stylistId), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(Collections.emptyList());

        Booking savedBooking = Booking.builder()
                .id(UUID.randomUUID())
                .bookingCode("BB-2026-TEST")
                .totalAmount(BigDecimal.valueOf(100000))
                .status(BookingStatus.PENDING)
                .build();

        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);

        BookingResponse response = BookingResponse.builder()
                .id(savedBooking.getId())
                .bookingCode("BB-2026-TEST")
                .status(BookingStatus.PENDING)
                .totalAmount(BigDecimal.valueOf(100000))
                .build();

        when(bookingMapper.toBookingResponse(any(Booking.class))).thenReturn(response);

        BookingResponse result = bookingService.createBooking(request);

        assertNotNull(result);
        assertEquals("BB-2026-TEST", result.getBookingCode());
        assertEquals(BookingStatus.PENDING, result.getStatus());
        verify(bookingRepository, times(1)).save(any(Booking.class));
    }

    @Test
    @DisplayName("UT-Booking-02: createBooking ném NotFoundException khi không tìm thấy User")
    void testCreateBooking_UserNotFound_ThrowsException() {
        CreateBookingRequest request = CreateBookingRequest.builder()
                .userId(userId)
                .stylistId(stylistId)
                .salonId(salonId)
                .serviceIds(List.of(serviceId))
                .startTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0))
                .build();

        when(offeringRepository.findAllById(anyList())).thenReturn(List.of(testServiceOffering));
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> bookingService.createBooking(request));
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    @DisplayName("UT-Booking-03: createBooking ném Exception khi Stylist tạm nghỉ (status = OFF)")
    void testCreateBooking_StylistOff_ThrowsException() {
        testStylist.setStatus("OFF");
        CreateBookingRequest request = CreateBookingRequest.builder()
                .userId(userId)
                .stylistId(stylistId)
                .salonId(salonId)
                .serviceIds(List.of(serviceId))
                .startTime(LocalDateTime.now().plusDays(1).withHour(10).withMinute(0))
                .build();

        when(offeringRepository.findAllById(anyList())).thenReturn(List.of(testServiceOffering));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(stylistRepository.findById(stylistId)).thenReturn(Optional.of(testStylist));

        Exception ex = assertThrows(Exception.class, () -> bookingService.createBooking(request));
        assertTrue(ex.getMessage().contains("Stylist hiện đang tạm nghỉ"));
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    @DisplayName("UT-Booking-04: createBooking ném Exception khi Stylist đã có lịch hẹn trùng khung giờ")
    void testCreateBooking_ConflictTimeSlot_ThrowsException() {
        LocalDateTime startTime = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0);
        CreateBookingRequest request = CreateBookingRequest.builder()
                .userId(userId)
                .stylistId(stylistId)
                .salonId(salonId)
                .serviceIds(List.of(serviceId))
                .startTime(startTime)
                .build();

        when(offeringRepository.findAllById(anyList())).thenReturn(List.of(testServiceOffering));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(stylistRepository.findById(stylistId)).thenReturn(Optional.of(testStylist));
        when(salonRepository.findById(salonId)).thenReturn(Optional.of(testSalon));
        when(salonMapper.toSalonDTO(testSalon)).thenReturn(testSalonDTO);

        Booking existingConflict = Booking.builder().id(UUID.randomUUID()).build();
        when(bookingRepository.findConflictingBookingsByStylist(eq(stylistId), any(LocalDateTime.class), any(LocalDateTime.class)))
                .thenReturn(List.of(existingConflict));

        Exception ex = assertThrows(Exception.class, () -> bookingService.createBooking(request));
        assertTrue(ex.getMessage().contains("Stylist đã có lịch hẹn trong khung giờ này"));
        verify(bookingRepository, never()).save(any(Booking.class));
    }

    @Test
    @DisplayName("UT-Booking-05: createBooking với mã Voucher hợp lệ áp dụng giảm giá thành công")
    void testCreateBooking_WithVoucher_AppliesDiscount() throws Exception {
        LocalDateTime startTime = LocalDateTime.now().plusDays(1).withHour(10).withMinute(0);
        CreateBookingRequest request = CreateBookingRequest.builder()
                .userId(userId)
                .stylistId(stylistId)
                .salonId(salonId)
                .serviceIds(List.of(serviceId))
                .startTime(startTime)
                .voucherCode("SALE20")
                .build();

        when(offeringRepository.findAllById(anyList())).thenReturn(List.of(testServiceOffering));
        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(stylistRepository.findById(stylistId)).thenReturn(Optional.of(testStylist));
        when(salonRepository.findById(salonId)).thenReturn(Optional.of(testSalon));
        when(salonMapper.toSalonDTO(testSalon)).thenReturn(testSalonDTO);
        when(bookingRepository.findConflictingBookingsByStylist(any(), any(), any())).thenReturn(Collections.emptyList());

        Voucher voucher = Voucher.builder()
                .id(UUID.randomUUID())
                .voucherCode("SALE20")
                .discountType("PERCENT")
                .discountValue(BigDecimal.valueOf(20))
                .build();

        when(voucherRepository.findByVoucherCodeAndIsDeletedFalse("SALE20")).thenReturn(Optional.of(voucher));
        when(voucherService.validateAndCalculate(any(ApplyVoucherRequest.class))).thenReturn(
                ApplyVoucherResponse.builder()
                        .valid(true)
                        .discountAmount(BigDecimal.valueOf(20000))
                        .build()
        );
        when(voucherRepository.incrementUsedCountAtomic(voucher.getId())).thenReturn(1);

        Booking savedBooking = Booking.builder()
                .id(UUID.randomUUID())
                .bookingCode("BB-2026-VOUCHER")
                .totalAmount(BigDecimal.valueOf(80000))
                .status(BookingStatus.PENDING)
                .build();

        when(bookingRepository.save(any(Booking.class))).thenReturn(savedBooking);
        when(bookingMapper.toBookingResponse(any(Booking.class))).thenReturn(
                BookingResponse.builder()
                        .bookingCode("BB-2026-VOUCHER")
                        .totalAmount(BigDecimal.valueOf(80000))
                        .build()
        );

        BookingResponse result = bookingService.createBooking(request);

        assertNotNull(result);
        assertEquals(BigDecimal.valueOf(80000), result.getTotalAmount());
        verify(voucherRepository, times(1)).incrementUsedCountAtomic(voucher.getId());
    }
}
