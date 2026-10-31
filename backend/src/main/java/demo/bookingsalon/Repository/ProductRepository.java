package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Product;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProductRepository extends JpaRepository<Product, UUID>, JpaSpecificationExecutor<Product> {
    Optional<Product> findBySlug(String slug);
    List<Product> findByCategoryIdAndActiveTrue(UUID categoryId);
    Page<Product> findByActiveTrue(Pageable pageable);

    @Modifying
    @Query("UPDATE Product p SET p.stockQuantity = p.stockQuantity - :quantity, p.soldCount = p.soldCount + :quantity WHERE p.id = :productId AND p.stockQuantity >= :quantity")
    int deductStockAtomic(@Param("productId") UUID productId, @Param("quantity") Integer quantity);

    @Modifying
    @Query("UPDATE Product p SET p.stockQuantity = p.stockQuantity + :quantity, p.soldCount = p.soldCount - :quantity WHERE p.id = :productId")
    int restoreStockAtomic(@Param("productId") UUID productId, @Param("quantity") Integer quantity);

    long countByCategoryId(UUID categoryId);
}
