package demo.bookingsalon.Entity;

import demo.bookingsalon.Enum.MediaOwnerType;
import demo.bookingsalon.Enum.MediaStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
        name = "media",
        indexes = {
                @Index(name = "idx_media_owner", columnList = "owner_type, owner_id"),
                @Index(name = "idx_media_public_id", columnList = "public_id")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Media {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Enumerated(EnumType.STRING)
    @Column(name = "owner_type", nullable = false, length = 30)
    private MediaOwnerType ownerType; // SERVICE / PRODUCT / SALON...

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId; // ID của Service/Product/Salon...

    @Column(name = "public_id", nullable = false, unique = true, length = 500)
    private String publicId; // booking-salon/services/massage-body-xxx/image_abc

    @Column(name = "secure_url", nullable = false, length = 1000)
    private String secureUrl;

    @Column(name = "resource_type", nullable = false, length = 30)
    private String resourceType; //image / video / raw

    @Column(name = "format", length = 30)
    private String format; // png/jgp

    @Column(name = "original_filename", length = 500)
    private String originalFilename;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    // Ảnh chính của owner.
    @Column(name = "is_primary", nullable = false)
    private boolean primary;

    // Dùng để sắp xếp gallery.
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    private MediaStatus status;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();

        createdAt = now;
        updatedAt = now;

        if (status == null) {
            status = MediaStatus.ACTIVE;
        }

        if (sortOrder == null) {
            sortOrder = 0;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}