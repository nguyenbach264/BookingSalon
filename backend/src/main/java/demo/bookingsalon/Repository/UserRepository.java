package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    User findFirstByKeycloakId(UUID keycloakId);
    Optional<User> findFirstByUsername(String username);
    Optional<User> findFirstByEmail(String email);

    default User findByKeycloakId(UUID keycloakId) {
        return findFirstByKeycloakId(keycloakId);
    }

    default Optional<User> findByUsername(String username) {
        return findFirstByUsername(username);
    }

    default Optional<User> findByEmail(String email) {
        return findFirstByEmail(email);
    }

    @Query("SELECT u FROM User u WHERE " +
           "(:search IS NULL OR :search = '' OR " +
           "LOWER(u.username) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "u.phoneNumber LIKE CONCAT('%', :search, '%'))")
    Page<User> searchUsers(@Param("search") String search, Pageable pageable);
}

