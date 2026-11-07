package demo.bookingsalon.BookingTest;

import demo.bookingsalon.Entity.Booking;
import demo.bookingsalon.Entity.Stylist;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Publisher.BookingEventPublisher;
import demo.bookingsalon.Repository.BookingRepository;
import demo.bookingsalon.Service.BookingService;
import demo.bookingsalon.Service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BookingLifecycleUnitTest {

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private NotificationWebSocketHandler notificationWebSocketHandler;

    @Mock
    private BookingEventPublisher bookingEventPublisher;

    @InjectMocks
    private BookingService bookingService;

    private UUID bookingId;
    private Booking testBooking;
    private User testUser;
    private Stylist testStylist;

    @BeforeEach
    void setUp() {
        bookingId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        UUID stylistId = UUID.randomUUID();

        testUser = new User();
        testUser.setId(userId);
        testUser.setFullName("Khách hàng Test");

        testStylist = Stylist.builder()
                .id(stylistId)
                .fullName("Alex Bach")
                .build();

        testBooking = Booking.builder()
                .id(bookingId)
                .bookingCode("BB-2026-TEST01")
                .user(testUser)
                .stylist(testStylist)
                .status(BookingStatus.PENDING)
                .startTime(LocalDateTime.now().plusDays(1))
                .endTime(LocalDateTime.now().plusDays(1).plusMinutes(45))
                .build();
    }

    @Test
    @DisplayName("TC-Booking-01: Chuyển trạng thái lịch hẹn từ PENDING sang CONFIRMED và gửi thông báo xác nhận")
    void testUpdateBooking_ToConfirmed_ShouldSendNotification() {
        when(bookingRepository.findByIdWithOptimisticLock(bookingId)).thenReturn(testBooking);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        String result = bookingService.updateBooking(bookingId, BookingStatus.CONFIRMED);

        assertEquals("Update booking successfully", result);
        assertEquals(BookingStatus.CONFIRMED, testBooking.getStatus());

        verify(bookingRepository).save(testBooking);
        verify(notificationService).notifyBookingConfirmed(testBooking);
        verify(notificationWebSocketHandler).sendToStylist(eq(testStylist.getId()), any());
    }

    @Test
    @DisplayName("TC-Booking-02: Hoàn thành lịch hẹn (COMPLETED) -> Gửi yêu cầu đánh giá cho khách hàng")
    void testUpdateBooking_ToCompleted_ShouldSendReviewRequest() {
        testBooking.setStatus(BookingStatus.CONFIRMED);
        when(bookingRepository.findByIdWithOptimisticLock(bookingId)).thenReturn(testBooking);
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        String result = bookingService.updateBooking(bookingId, BookingStatus.COMPLETED);

        assertEquals("Update booking successfully", result);
        assertEquals(BookingStatus.COMPLETED, testBooking.getStatus());

        verify(bookingRepository).save(testBooking);
        verify(notificationService).notifyReviewRequest(testBooking);
        verify(notificationWebSocketHandler).sendToStylist(eq(testStylist.getId()), any());
    }

    @Test
    @DisplayName("TC-Booking-03: Hủy lịch hẹn (cancelBooking) -> Trạng thái CANCELLED và phát sự kiện hủy")
    void testCancelBooking_ShouldUpdateStatusAndPublishEvent() {
        when(bookingRepository.findById(bookingId)).thenReturn(Optional.of(testBooking));
        when(bookingRepository.save(any(Booking.class))).thenAnswer(i -> i.getArgument(0));

        String result = bookingService.cancelBooking(bookingId);

        assertEquals("Booking cancelled successfully", result);
        assertEquals(BookingStatus.CANCELLED, testBooking.getStatus());

        verify(bookingRepository).save(testBooking);
        verify(bookingEventPublisher).publishBookingCancelledEvent(testBooking);
        verify(notificationService).notifyBookingCancelled(testBooking);
        verify(notificationWebSocketHandler).sendToStylist(eq(testStylist.getId()), argThat((Object payload) -> {
            if (payload instanceof Map<?, ?> map) {
                return "CANCELLED".equals(map.get("status"));
            }
            return false;
        }));
    }
}

