package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.ServiceOffering;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, UUID> {

    List<ServiceOffering> findByDeletedAtIsNull();

    List<ServiceOffering> findByDeletedAtIsNullAndSalonId(UUID salonId);

    List<ServiceOffering> findByDeletedAtIsNullAndCategoryId(UUID categoryId);

    List<ServiceOffering> findByDeletedAtIsNullAndSalonIdAndCategoryId(UUID salonId, UUID categoryId);

    Optional<ServiceOffering> findByIdAndDeletedAtIsNull(UUID id);

    @Query("SELECT s FROM ServiceOffering s WHERE s.deletedAt IS NULL AND " +
           "(:salonId IS NULL OR s.salon.id = :salonId) AND " +
           "(:categoryId IS NULL OR s.category.id = :categoryId) AND " +
           "(:search IS NULL OR LOWER(s.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(s.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<ServiceOffering> searchAdminServices(
            @Param("salonId") UUID salonId,
            @Param("categoryId") UUID categoryId,
            @Param("search") String search);
}
