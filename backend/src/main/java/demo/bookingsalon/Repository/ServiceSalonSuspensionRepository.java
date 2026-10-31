package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.ServiceSalonSuspension;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface ServiceSalonSuspensionRepository extends JpaRepository<ServiceSalonSuspension, UUID> {

    @Query("SELECT s FROM ServiceSalonSuspension s WHERE s.serviceOffering.id = :serviceId " +
           "AND s.salon.id = :salonId AND s.isActive = true " +
           "AND s.startTime <= :checkTime AND s.endTime >= :checkTime")
    List<ServiceSalonSuspension> findActiveSuspensionsAt(
            @Param("serviceId") UUID serviceId,
            @Param("salonId") UUID salonId,
            @Param("checkTime") LocalDateTime checkTime);

    @Query("SELECT s FROM ServiceSalonSuspension s WHERE s.salon.id = :salonId " +
           "AND s.isActive = true AND s.startTime <= :checkTime AND s.endTime >= :checkTime")
    List<ServiceSalonSuspension> findActiveSuspensionsForSalon(
            @Param("salonId") UUID salonId,
            @Param("checkTime") LocalDateTime checkTime);

    List<ServiceSalonSuspension> findByServiceOfferingId(UUID serviceOfferingId);

    List<ServiceSalonSuspension> findBySalonId(UUID salonId);
}
