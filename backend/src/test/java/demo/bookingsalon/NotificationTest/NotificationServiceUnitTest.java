package demo.bookingsalon.NotificationTest;

import demo.bookingsalon.Entity.Notification;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Mapper.BookingMapper;
import demo.bookingsalon.Mapper.NotificationMapper;
import demo.bookingsalon.Payload.DTO.NotificationDTO;
import demo.bookingsalon.Repository.BookingRepository;
import demo.bookingsalon.Repository.NotificationRepository;
import demo.bookingsalon.Repository.OrderRepository;
import demo.bookingsalon.Service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class NotificationServiceUnitTest {

    @Mock
    private NotificationRepository notificationRepository;

    @Mock
    private BookingRepository bookingRepository;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private BookingMapper bookingMapper;

    @Mock
    private NotificationMapper notificationMapper;

    @Mock
    private NotificationWebSocketHandler notificationWebSocketHandler;

    @InjectMocks
    private NotificationService notificationService;

    private UUID userId;
    private UUID notificationId;
    private Notification testNotification;
    private NotificationDTO testNotificationDTO;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        notificationId = UUID.randomUUID();

        testNotification = Notification.builder()
                .id(notificationId)
                .userId(userId)
                .title("Lịch hẹn sắp tới")
                .message("Bạn có lịch hẹn lúc 14:00")
                .type("BOOKING")
                .isRead(false)
                .build();

        testNotificationDTO = NotificationDTO.builder()
                .id(notificationId)
                .userId(userId)
                .title("Lịch hẹn sắp tới")
                .message("Bạn có lịch hẹn lúc 14:00")
                .type("BOOKING")
                .isRead(false)
                .build();
    }

    @Test
    @DisplayName("UT-Notification-01: createNotification lưu thông báo và đẩy qua WebSocket")
    void testCreateNotification_Success() {
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);
        when(notificationMapper.toNotificationDTO(any(Notification.class))).thenReturn(testNotificationDTO);

        NotificationDTO result = notificationService.createNotification(testNotification);

        assertNotNull(result);
        assertEquals("Lịch hẹn sắp tới", result.getTitle());
        verify(notificationRepository, times(1)).save(any(Notification.class));
        verify(notificationWebSocketHandler, times(1)).sendToUser(eq(userId), any(NotificationDTO.class));
    }

    @Test
    @DisplayName("UT-Notification-02: getAllNotificationsByUser trả về danh sách sắp xếp theo thời gian")
    void testGetAllNotificationsByUser_Success() {
        when(notificationRepository.findByUserId(userId)).thenReturn(List.of(testNotification));
        when(notificationMapper.toNotificationDTO(testNotification)).thenReturn(testNotificationDTO);

        List<NotificationDTO> result = notificationService.getAllNotificationsByUser(userId);

        assertEquals(1, result.size());
        assertEquals("Lịch hẹn sắp tới", result.get(0).getTitle());
    }

    @Test
    @DisplayName("UT-Notification-03: getNotificationById đánh dấu đã đọc khi xem chi tiết")
    void testGetNotificationById_MarksAsRead() {
        when(notificationRepository.findById(notificationId)).thenReturn(Optional.of(testNotification));
        when(notificationRepository.save(any(Notification.class))).thenReturn(testNotification);
        when(notificationMapper.toNotificationDTO(any(Notification.class))).thenReturn(testNotificationDTO);

        NotificationDTO result = notificationService.getNotificationById(notificationId);

        assertNotNull(result);
        assertTrue(testNotification.isRead());
        verify(notificationRepository, times(1)).save(testNotification);
    }
}

