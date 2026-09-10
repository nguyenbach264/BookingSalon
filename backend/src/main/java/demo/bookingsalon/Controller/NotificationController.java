package demo.bookingsalon.Controller;

import demo.bookingsalon.Entity.Notification;
import demo.bookingsalon.Payload.Request.Business.CreateNotificationRequest;
import demo.bookingsalon.Service.NotificationService;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@AllArgsConstructor
@RequestMapping("/api/notifications")
public class NotificationController {
    private final NotificationService notificationService;

    @GetMapping("/user/{id}")
    public ResponseEntity<?> getAllNotificationsByUserId(@PathVariable UUID userId) {
        return ResponseEntity.status(HttpStatus.FOUND).body(notificationService.getAllNotificationsByUser(userId));
    }

    @GetMapping("/salon/{id}")
    public ResponseEntity<?> getAllNotificationsBySalonId(UUID salonId) {
        return ResponseEntity.status(HttpStatus.FOUND).body(notificationService.getAllNotificationsBySalon(salonId));
    }

    @PostMapping
    public ResponseEntity<?> createNotification(@RequestBody CreateNotificationRequest request) {
        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .salonId(request.getSalonId())
                .bookingId(request.getBookingId())
                .type(request.getType())
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .expiredAt(LocalDateTime.now().plusMinutes(360))
                .build();

        return ResponseEntity.status(HttpStatus.CREATED).body(notificationService.createNotification(notification));
    }

    @PutMapping
    public ResponseEntity<?> markNotificationAsRead(@PathVariable UUID noticationId) {
        return ResponseEntity.status(HttpStatus.OK).body(notificationService.markNotificationAsRead(noticationId));
    }
}
