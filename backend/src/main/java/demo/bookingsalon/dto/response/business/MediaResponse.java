package demo.bookingsalon.dto.response.business;

import demo.bookingsalon.entity.Media;
import demo.bookingsalon.enums.MediaOwnerType;
import demo.bookingsalon.enums.MediaStatus;

import java.time.LocalDateTime;
import java.util.UUID;

public record MediaResponse(

        UUID id,

        MediaOwnerType ownerType,

        UUID ownerId,

        String url,

        String resourceType,

        String format,

        String originalFilename,

        Long fileSize,

        Integer width,

        Integer height,

        boolean primary,

        Integer sortOrder,

        MediaStatus status,

        LocalDateTime createdAt
) {

    public static MediaResponse from(Media media) {

        return new MediaResponse(
                media.getId(),
                media.getOwnerType(),
                media.getOwnerId(),
                media.getSecureUrl(),
                media.getResourceType(),
                media.getFormat(),
                media.getOriginalFilename(),
                media.getFileSize(),
                media.getWidth(),
                media.getHeight(),
                media.isPrimary(),
                media.getSortOrder(),
                media.getStatus(),
                media.getCreatedAt()
        );
    }
}
