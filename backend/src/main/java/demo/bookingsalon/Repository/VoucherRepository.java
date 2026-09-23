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
}

