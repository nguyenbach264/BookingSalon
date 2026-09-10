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
}
