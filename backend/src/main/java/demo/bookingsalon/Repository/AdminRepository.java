package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Admin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AdminRepository extends JpaRepository<Admin, UUID> {
    Optional<Admin> findFirstByUsername(String username);
    Optional<Admin> findFirstByKeycloakId(UUID keycloakId);

    default Optional<Admin> findByUsername(String username) {
        return findFirstByUsername(username);
    }

    default Optional<Admin> findByKeycloakId(UUID keycloakId) {
        return findFirstByKeycloakId(keycloakId);
    }
}

