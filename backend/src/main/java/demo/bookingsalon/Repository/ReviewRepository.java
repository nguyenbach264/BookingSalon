package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, UUID> {
    List<Review> findByProductIdOrderByCreatedAtDesc(UUID productId);
    List<Review> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Review> findByStylistIdOrderByCreatedAtDesc(UUID stylistId);
    List<Review> findBySalonIdOrderByCreatedAtDesc(UUID salonId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(r) FROM Review r WHERE r.stylistId = :stylistId")
    Long countByStylistId(@org.springframework.data.repository.query.Param("stylistId") UUID stylistId);

    @org.springframework.data.jpa.repository.Query("SELECT AVG(r.rating) FROM Review r WHERE r.stylistId = :stylistId")
    Double getAverageRatingByStylistId(@org.springframework.data.repository.query.Param("stylistId") UUID stylistId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(r) FROM Review r WHERE r.salonId = :salonId")
    Long countBySalonId(@org.springframework.data.repository.query.Param("salonId") UUID salonId);

    @org.springframework.data.jpa.repository.Query("SELECT AVG(r.rating) FROM Review r WHERE r.salonId = :salonId")
    Double getAverageRatingBySalonId(@org.springframework.data.repository.query.Param("salonId") UUID salonId);
}
