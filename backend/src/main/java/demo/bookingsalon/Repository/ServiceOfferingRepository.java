package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.ServiceOffering;
import demo.bookingsalon.Payload.DTO.ServiceOfferingDTO;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Set;
import java.util.UUID;

public interface ServiceOfferingRepository extends JpaRepository<ServiceOffering, UUID> {

//    Set<ServiceOfferingDTO> findBySalonId(UUID salonId);
}
