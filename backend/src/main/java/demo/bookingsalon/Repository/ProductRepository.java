package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID> {
    Optional<Product> findBySlug(String slug);
    List<Product> findByCategoryIdAndActiveTrue(UUID categoryId);
    Page<Product> findByActiveTrue(Pageable pageable);
}

