package demo.bookingsalon.Repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import demo.bookingsalon.Entity.StylistService;

public interface StylistServiceRepository extends JpaRepository<StylistService, UUID> {
    List<StylistService> findByStylistId(UUID stylistId);
}

