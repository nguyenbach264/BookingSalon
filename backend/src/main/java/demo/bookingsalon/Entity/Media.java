package demo.bookingsalon.Entity;

import demo.bookingsalon.Enum.MediaOwnerType;
import demo.bookingsalon.Enum.MediaStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

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
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
public class Media extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(name = "owner_type", nullable = false, length = 30)
    private MediaOwnerType ownerType; // SERVICE / PRODUCT / SALON...

    @Column(name = "owner_id", nullable = false)
    private UUID ownerId; // ID của Service/Product/Salon...

    @Column(name = "public_id", nullable = false, unique = true, length = 500)
    private String publicId;

    @Column(name = "secure_url", nullable = false, length = 1000)
    private String secureUrl;

    @Column(name = "resource_type", nullable = false, length = 30)
    private String resourceType; // image / video / raw

    @Column(name = "format", length = 30)
    private String format; // png / jpg

    @Column(name = "original_filename", length = 500)
    private String originalFilename;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "width")
    private Integer width;

    @Column(name = "height")
    private Integer height;

    // Ảnh chính của owner
    @Builder.Default
    @Column(name = "is_primary", nullable = false)
    private boolean primary = false;

    // Dùng để sắp xếp gallery
    @Builder.Default
    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Enumerated(EnumType.STRING)
    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private MediaStatus status = MediaStatus.ACTIVE;
}