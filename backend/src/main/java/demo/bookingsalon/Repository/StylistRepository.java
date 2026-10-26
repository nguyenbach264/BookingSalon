package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Stylist;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
public interface StylistRepository extends JpaRepository<Stylist, UUID> {
    Optional<Stylist> findFirstByUsername(String username);
    Optional<Stylist> findFirstByKeycloakId(UUID keycloakId);

    default Optional<Stylist> findByUsername(String username) {
        return findFirstByUsername(username);
    }

    default Optional<Stylist> findByKeycloakId(UUID keycloakId) {
        return findFirstByKeycloakId(keycloakId);
    }
    List<Stylist> findBySalonId(UUID salonId);
    List<Stylist> findByStatus(String status);
    List<Stylist> findBySalonIdAndStatus(UUID salonId, String status);

    @Query("SELECT s FROM Stylist s LEFT JOIN s.salon sal WHERE " +
           "(:salonId IS NULL OR sal.id = :salonId) AND " +
           "(:status IS NULL OR s.status = :status) AND " +
           "(:search IS NULL OR LOWER(s.fullName) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.phoneNumber) LIKE LOWER(CONCAT('%', :search, '%')) " +
           "OR LOWER(s.nickname) LIKE LOWER(CONCAT('%', :search, '%')))")
    List<Stylist> searchStylists(
            @Param("salonId") UUID salonId,
            @Param("status") String status,
            @Param("search") String search);
}
