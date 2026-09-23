package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Stylist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface StylistRepository extends JpaRepository<Stylist, UUID> {
    Optional<Stylist> findByUsername(String username);
    Optional<Stylist> findByKeycloakId(UUID keycloakId);
}
