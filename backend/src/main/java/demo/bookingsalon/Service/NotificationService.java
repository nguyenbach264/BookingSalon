package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.Booking;
import demo.bookingsalon.Entity.Notification;
import demo.bookingsalon.Entity.Order;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Mapper.BookingMapper;
import demo.bookingsalon.Mapper.NotificationMapper;
import demo.bookingsalon.Payload.DTO.NotificationDTO;
import demo.bookingsalon.Payload.Response.Business.BookingResponse;
import demo.bookingsalon.Payload.Response.Business.OrderResponse;
import demo.bookingsalon.Repository.BookingRepository;
import demo.bookingsalon.Repository.NotificationRepository;
import demo.bookingsalon.Repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationRepository notificationRepository;
    private final BookingRepository bookingRepository;
    private final OrderRepository orderRepository;
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

        OrderResponse orderResponse = null;
        if (savedNotification.getOrderId() != null) {
            try {
                Order order = orderRepository.findById(savedNotification.getOrderId()).orElse(null);
                if (order != null) {
                    orderResponse = mapToOrderResponse(order);
                }
            } catch (Exception e) {
                log.warn("Could not attach order response to notification: {}", e.getMessage());
            }
        }

        NotificationDTO notificationDTO = notificationMapper.toNotificationDTO(savedNotification);
        notificationDTO.setRead(savedNotification.isRead());
        notificationDTO.setBookingResponse(bookingResponse);
        notificationDTO.setOrderResponse(orderResponse);

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
                    dto.setRead(item.isRead());
                    return dto;
                })
                .toList();
    }

    @Transactional(readOnly = true)
    public List<NotificationDTO> getAllNotificationsBySalon(UUID salonId) {
        return notificationRepository.findBySalonId(salonId).stream()
                .sorted(Comparator.comparing(Notification::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(item -> {
                    NotificationDTO dto = notificationMapper.toNotificationDTO(item);
                    dto.setRead(item.isRead());
                    return dto;
                })
                .toList();
    }

    @Transactional
    public NotificationDTO getNotificationById(UUID notificationId) {
        // Cập nhật trạng thái trực tiếp bằng SQL trong DB
        notificationRepository.markAsRead(notificationId);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông báo với ID: " + notificationId));

        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        notification = notificationRepository.save(notification);

        NotificationDTO dto = notificationMapper.toNotificationDTO(notification);
        dto.setRead(true);

        // Nạp chi tiết Booking nếu có
        if (notification.getBookingId() != null) {
            try {
                bookingRepository.findById(notification.getBookingId())
                        .ifPresent(b -> dto.setBookingResponse(bookingMapper.toBookingResponse(b)));
            } catch (Exception ignored) {}
        }

        // Nạp chi tiết Order nếu có
        if (notification.getOrderId() != null) {
            try {
                orderRepository.findById(notification.getOrderId())
                        .ifPresent(o -> dto.setOrderResponse(mapToOrderResponse(o)));
            } catch (Exception ignored) {}
        } else {
            // Tra cứu fallback theo orderCode nếu có trong text
            try {
                findOrderFromText(notification.getTitle() + " " + notification.getMessage())
                        .ifPresent(o -> dto.setOrderResponse(mapToOrderResponse(o)));
            } catch (Exception ignored) {}
        }

        return dto;
    }

    @Transactional
    public NotificationDTO markNotificationAsRead(UUID notificationId) {
        notificationRepository.markAsRead(notificationId);

        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new NotFoundException("Not found notification to mark as read"));

        notification.setRead(true);
        notification.setReadAt(LocalDateTime.now());
        Notification saved = notificationRepository.save(notification);

        NotificationDTO dto = notificationMapper.toNotificationDTO(saved);
        dto.setRead(true);

        if (saved.getBookingId() != null) {
            try {
                bookingRepository.findById(saved.getBookingId())
                        .ifPresent(b -> dto.setBookingResponse(bookingMapper.toBookingResponse(b)));
            } catch (Exception ignored) {}
        }
        if (saved.getOrderId() != null) {
            try {
                orderRepository.findById(saved.getOrderId())
                        .ifPresent(o -> dto.setOrderResponse(mapToOrderResponse(o)));
            } catch (Exception ignored) {}
        }
        return dto;
    }

    @Transactional
    public void markAllNotificationsAsRead(UUID userId) {
        notificationRepository.markAllAsReadByUserId(userId);
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
        UUID orderId = null;
        if (orderCode != null) {
            orderId = orderRepository.findByOrderCode(orderCode).map(Order::getId).orElse(null);
        }
        Notification notification = Notification.builder()
                .userId(userId)
                .orderId(orderId)
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
        UUID orderId = null;
        if (orderCode != null) {
            orderId = orderRepository.findByOrderCode(orderCode).map(Order::getId).orElse(null);
        }
        Notification notification = Notification.builder()
                .userId(userId)
                .orderId(orderId)
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
        UUID orderId = null;
        if (orderCode != null) {
            orderId = orderRepository.findByOrderCode(orderCode).map(Order::getId).orElse(null);
        }
        Notification notification = Notification.builder()
                .userId(userId)
                .orderId(orderId)
                .title("Thanh toán thành công!")
                .message("Đơn hàng " + orderCode + " đã được xác nhận thanh toán thành công qua chuyển khoản ngân hàng.")
                .type("ORDER_CONFIRMED")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .expiredAt(LocalDateTime.now().plusDays(30))
                .build();
        return createNotification(notification);
    }

    // ── Helper mapping Order -> OrderResponse ─────────────────────────────────

    public OrderResponse mapToOrderResponse(Order order) {
        if (order == null) return null;
        List<OrderResponse.OrderItemResponse> items = order.getOrderDetails() != null
                ? order.getOrderDetails().stream().map(d -> OrderResponse.OrderItemResponse.builder()
                .orderDetailId(d.getId())
                .productId(d.getProduct() != null ? d.getProduct().getId() : null)
                .productName(d.getProduct() != null ? d.getProduct().getName() : "Sản phẩm")
                .productImage(d.getProduct() != null ? d.getProduct().getImageUrl() : null)
                .quantity(d.getQuantity())
                .unitPrice(d.getUnitPrice())
                .totalPrice(d.getTotalPrice())
                .build()).toList()
                : Collections.emptyList();

        return OrderResponse.builder()
                .id(order.getId())
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser() != null ? order.getUser().getId() : null)
                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .shippingAddress(order.getShippingAddress())
                .note(order.getNote())
                .totalAmount(order.getTotalAmount())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .items(items)
                .vnpayUrl(order.getVnpayUrl())
                .build();
    }

    private Optional<Order> findOrderFromText(String text) {
        if (text == null) return Optional.empty();
        Matcher m = Pattern.compile("ORD-[A-Za-z0-9-]+").matcher(text);
        if (m.find()) {
            return orderRepository.findByOrderCode(m.group(0));
        }
        return Optional.empty();
    }
}
