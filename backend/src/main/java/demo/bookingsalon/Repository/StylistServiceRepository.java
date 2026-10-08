package demo.bookingsalon.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import demo.bookingsalon.Entity.StylistService;

public interface StylistServiceRepository extends JpaRepository<StylistService, UUID> {
    List<StylistService> findByStylistId(UUID stylistId);

    Optional<StylistService> findByStylistIdAndServiceOfferingId(UUID stylistId, UUID serviceOfferingId);

    @Modifying
    @Transactional
    @Query("DELETE FROM StylistService ss WHERE ss.stylist.id = :stylistId")
    void deleteByStylistId(@Param("stylistId") UUID stylistId);

    @Modifying
    @Transactional
    @Query("DELETE FROM StylistService ss WHERE ss.stylist.id = :stylistId AND ss.serviceOffering.id = :serviceOfferingId")
    void deleteByStylistIdAndServiceOfferingId(@Param("stylistId") UUID stylistId, @Param("serviceOfferingId") UUID serviceOfferingId);
}
