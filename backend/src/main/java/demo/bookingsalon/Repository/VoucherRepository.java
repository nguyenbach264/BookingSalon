package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Voucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VoucherRepository extends JpaRepository<Voucher, UUID> {

    Optional<Voucher> findByVoucherCodeAndIsDeletedFalse(String voucherCode);

    List<Voucher> findAllByIsDeletedFalseOrderByCreatedAtDesc();

    @Query("""
        SELECT v FROM Voucher v 
        WHERE v.isDeleted = false 
          AND v.isActive = true 
          AND v.isPublic = true 
          AND v.startDate <= :now 
          AND v.endDate >= :now 
          AND v.usedCount < v.usageLimitTotal
        ORDER BY v.createdAt DESC
    """)
    List<Voucher> findActivePublicVouchers(@Param("now") LocalDateTime now);

    @org.springframework.data.jpa.repository.Modifying
    @Query("""
        UPDATE Voucher v 
        SET v.usedCount = COALESCE(v.usedCount, 0) + 1 
        WHERE v.id = :id 
          AND (v.usageLimitTotal IS NULL OR COALESCE(v.usedCount, 0) < v.usageLimitTotal)
    """)
    int incrementUsedCountAtomic(@Param("id") UUID id);

    @org.springframework.data.jpa.repository.Modifying
    @Query("""
        UPDATE Voucher v 
        SET v.usedCount = CASE WHEN COALESCE(v.usedCount, 0) > 0 THEN v.usedCount - 1 ELSE 0 END 
        WHERE v.id = :id
    """)
    int decrementUsedCountAtomic(@Param("id") UUID id);
}

