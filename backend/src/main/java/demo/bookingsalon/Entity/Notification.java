package demo.bookingsalon.Entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
@Builder
@Data
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "salon_id", nullable = false)
    @Column(name = "salon_id")
    private UUID salonId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "booking_id", nullable = false)
    @Column(name = "booking_id")
    private UUID bookingId;

    @Column(name = "is_read")
    private boolean isRead = false;
    @Column(name = "title")
    private String title;

    @Column(name = "message", columnDefinition = "TEXT")
    private String message;

    @Column(name = "type")
    private String type;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "expired_at")
    private LocalDateTime expiredAt;
}
