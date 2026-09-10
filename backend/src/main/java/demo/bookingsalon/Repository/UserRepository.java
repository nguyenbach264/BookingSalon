package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    User findByKeycloakId(UUID keycloakId);

    Optional<User> findByUsername(String username);

}
