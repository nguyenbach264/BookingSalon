package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.Booking;
import demo.bookingsalon.Entity.Notification;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Mapper.BookingMapper;
import demo.bookingsalon.Mapper.NotificationMapper;
import demo.bookingsalon.Payload.DTO.NotificationDTO;
import demo.bookingsalon.Payload.Response.Business.BookingResponse;
import demo.bookingsalon.Repository.BookingRepository;
import demo.bookingsalon.Repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final BookingRepository bookingRepository;
    private final BookingMapper bookingMapper;
    private final NotificationMapper notificationMapper;
    private final NotificationWebSocketHandler notificationWebSocketHandler;

    @Transactional
    public NotificationDTO createNotification(Notification notification) {
        if (notification.getCreatedAt() == null) {
            notification.setCreatedAt(LocalDateTime.now());
        }
        if (notification.getExpiredAt() == null) {
            notification.setExpiredAt(LocalDateTime.now().plusDays(14));
        }

        Notification savedNotification = notificationRepository.save(notification);

        BookingResponse bookingResponse = null;
        if (savedNotification.getBookingId() != null) {
            try {
                Booking booking = bookingRepository.findById(savedNotification.getBookingId()).orElse(null);
                if (booking != null) {
                    bookingResponse = bookingMapper.toBookingResponse(booking);
                }
            } catch (Exception e) {
                log.warn("Could not attach booking response to notification: {}", e.getMessage());
            }
        }

        NotificationDTO notificationDTO = notificationMapper.toNotificationDTO(savedNotification);
        notificationDTO.setBookingResponse(bookingResponse);

        // Real-time dispatch to User via WebSocket
        try {
            if (savedNotification.getUserId() != null) {
                notificationWebSocketHandler.sendToUser(savedNotification.getUserId(), notificationDTO);
                log.info("Dispatched real-time notification [{}] to user {}", savedNotification.getType(), savedNotification.getUserId());
            }
        } catch (Exception e) {
            log.error("Failed to push notification via WebSocket: {}", e.getMessage());
        }

        return notificationDTO;
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getAllNotificationsByUser(UUID userId) {
        return notificationRepository.findByUserId(userId).stream()
                .sorted(Comparator.comparing(Notification::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(item -> {
                    NotificationDTO dto = notificationMapper.toNotificationDTO(item);
                    if (item.getBookingId() != null) {
                        try {
                            bookingRepository.findById(item.getBookingId())
                                    .ifPresent(b -> dto.setBookingResponse(bookingMapper.toBookingResponse(b)));
                        } catch (Exception ignored) {}
                    }
                    return dto;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getAllNotificationsBySalon(UUID salonId) {
        return notificationRepository.findBySalonId(salonId).stream()
                .sorted(Comparator.comparing(Notification::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(notificationMapper::toNotificationDTO)
                .toList();
    }

    @Transactional
    public Notification markNotificationAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("Not found notification to mark as read"));

        notification.setRead(true);
        return notificationRepository.save(notification);
    }

    @Transactional
    public void markAllNotificationsAsRead(UUID userId) {
        List<Notification> list = notificationRepository.findByUserId(userId);
        for (Notification n : list) {
            n.setRead(true);
        }
        notificationRepository.saveAll(list);
    }

    // ── Helper methods for 4 distinct notification events ─────────────────────

    @Transactional
    public NotificationDTO notifyBookingCreated(Booking booking) {
        if (booking == null || booking.getUser() == null) return null;
        Notification notification = Notification.builder()
                .userId(booking.getUser().getId())
                .salonId(booking.getSalon() != null ? booking.getSalon().getId() : null)
                .bookingId(booking.getId())
                .title("Đặt lịch thành công!")
                .message("Lịch hẹn " + booking.getBookingCode() + " đã được gửi tới Stylist. Vui lòng theo dõi trạng thái tiếp nhận.")
                .type("BOOKING_CREATED")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .expiredAt(LocalDateTime.now().plusDays(14))
                .build();
        return createNotification(notification);
    }

    @Transactional
    public NotificationDTO notifyBookingConfirmed(Booking booking) {
        if (booking == null || booking.getUser() == null) return null;
        String stylistName = booking.getStylist() != null ? booking.getStylist().getFullName() : "Stylist";
        Notification notification = Notification.builder()
                .userId(booking.getUser().getId())
                .salonId(booking.getSalon() != null ? booking.getSalon().getId() : null)
                .bookingId(booking.getId())
                .title("Lịch hẹn đã được xác nhận!")
                .message(stylistName + " đã chấp nhận lịch hẹn " + booking.getBookingCode() + ". Hẹn gặp bạn lúc " + booking.getStartTime() + "!")
                .type("BOOKING_CONFIRMED")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .expiredAt(LocalDateTime.now().plusDays(14))
                .build();
        return createNotification(notification);
    }

    @Transactional
    public NotificationDTO notifyBookingCancelled(Booking booking) {
        if (booking == null || booking.getUser() == null) return null;
        Notification notification = Notification.builder()
                .userId(booking.getUser().getId())
                .salonId(booking.getSalon() != null ? booking.getSalon().getId() : null)
                .bookingId(booking.getId())
                .title("Lịch hẹn đã bị hủy")
                .message("Lịch hẹn " + booking.getBookingCode() + " đã bị hủy thành công.")
                .type("BOOKING_CANCELLED")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .expiredAt(LocalDateTime.now().plusDays(14))
                .build();
        return createNotification(notification);
    }

    @Transactional
    public NotificationDTO notifyReviewRequest(Booking booking) {
        if (booking == null || booking.getUser() == null) return null;
        Notification notification = Notification.builder()
                .userId(booking.getUser().getId())
                .salonId(booking.getSalon() != null ? booking.getSalon().getId() : null)
                .bookingId(booking.getId())
                .title("Mời bạn đánh giá dịch vụ!")
                .message("Lịch hẹn " + booking.getBookingCode() + " đã hoàn tất phục vụ. Hãy chia sẻ đánh giá trải nghiệm của bạn nhé!")
                .type("REVIEW_REQUEST")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .expiredAt(LocalDateTime.now().plusDays(14))
                .build();
        return createNotification(notification);
    }

    @Transactional
    public NotificationDTO notifyOrderDelivered(UUID userId, String orderCode) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title("Đơn hàng đã giao thành công!")
                .message("Đơn hàng " + (orderCode != null ? orderCode : "") + " đã được giao đến bạn. Cảm ơn bạn đã mua sắm tại BachBarber!")
                .type("ORDER_DELIVERED")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .expiredAt(LocalDateTime.now().plusDays(30))
                .build();
        return createNotification(notification);
    }

    @Transactional
    public NotificationDTO notifyOrderCreated(UUID userId, String orderCode, BigDecimal amount) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title("Đặt hàng thành công!")
                .message("Đơn hàng " + orderCode + " trị giá " + String.format("%,d", amount != null ? amount.longValue() : 0) + "₫ đã được ghi nhận thành công.")
                .type("ORDER_CREATED")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .expiredAt(LocalDateTime.now().plusDays(30))
                .build();
        return createNotification(notification);
    }

    @Transactional
    public NotificationDTO notifyOrderPaid(UUID userId, String orderCode, BigDecimal amount) {
        Notification notification = Notification.builder()
                .userId(userId)
                .title("Thanh toán thành công!")
                .message("Đơn hàng " + orderCode + " đã được xác nhận thanh toán thành công qua chuyển khoản ngân hàng.")
                .type("ORDER_CONFIRMED")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .expiredAt(LocalDateTime.now().plusDays(30))
                .build();
        return createNotification(notification);
    }
}
