package demo.bookingsalon.Controller;

import demo.bookingsalon.Entity.Notification;
import demo.bookingsalon.Payload.Request.Business.CreateNotificationRequest;
import demo.bookingsalon.Service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping("/user/{id}")
    public ResponseEntity<?> getAllNotificationsByUserId(@PathVariable("id") UUID userId) {
        return ResponseEntity.status(HttpStatus.OK).body(notificationService.getAllNotificationsByUser(userId));
    }

    @GetMapping("/salon/{id}")
    public ResponseEntity<?> getAllNotificationsBySalonId(@PathVariable("id") UUID salonId) {
        return ResponseEntity.status(HttpStatus.OK).body(notificationService.getAllNotificationsBySalon(salonId));
    }

    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody CreateNotificationRequest request) {
        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .salonId(request.getSalonId())
                .bookingId(request.getBookingId())
                .title(request.getTitle())
                .message(request.getMessage())
                .type(request.getType() != null ? request.getType() : "INFO")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .expiredAt(LocalDateTime.now().plusDays(14))
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.createNotification(notification));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<?> markNotificationAsRead(@PathVariable("id") UUID notificationId) {
        return ResponseEntity.status(HttpStatus.OK).body(notificationService.markNotificationAsRead(notificationId));
    }

    @PutMapping("/user/{userId}/read-all")
    public ResponseEntity<?> markAllNotificationsAsRead(@PathVariable("userId") UUID userId) {
        notificationService.markAllNotificationsAsRead(userId);
        return ResponseEntity.status(HttpStatus.OK).body(Map.of("message", "Đã đánh dấu tất cả thông báo là đã đọc"));
    }

    @PostMapping("/trigger-order-delivered")
    public ResponseEntity<?> triggerOrderDelivered(@RequestBody Map<String, String> body) {
        String userIdStr = body.get("userId");
        String orderCode = body.get("orderCode");
        if (userIdStr == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "userId không được để trống"));
        }
        UUID userId = UUID.fromString(userIdStr);
        return ResponseEntity.ok(notificationService.notifyOrderDelivered(userId, orderCode));
    }
}
