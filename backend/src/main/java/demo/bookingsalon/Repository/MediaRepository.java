package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Media;
import demo.bookingsalon.Enum.MediaOwnerType;
import demo.bookingsalon.Enum.MediaStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.*;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MediaRepository extends JpaRepository<Media, UUID> {

    List<Media> findByOwnerTypeAndOwnerIdAndStatusOrderBySortOrderAscCreatedAtAsc(
            MediaOwnerType ownerType, UUID ownerId, MediaStatus status
    );

    Optional<Media> findByIdAndOwnerTypeAndOwnerIdAndStatus(
            UUID mediaId, MediaOwnerType ownerType, UUID ownerId, MediaStatus status
    );

    @Modifying
    @Query("""
        UPDATE Media m
        SET m.primary = false
        WHERE m.ownerType = :ownerType
          AND m.ownerId = :ownerId
          AND m.status = 'ACTIVE'
    """)
    void clearPrimary(
            @Param("ownerType") MediaOwnerType ownerType,
            @Param("ownerId") UUID ownerId
    );

    long countByOwnerTypeAndOwnerIdAndStatus(MediaOwnerType ownerType, UUID ownerId, MediaStatus status);
}
