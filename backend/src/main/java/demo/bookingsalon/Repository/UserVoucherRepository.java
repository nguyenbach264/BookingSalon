package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.UserVoucher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserVoucherRepository extends JpaRepository<UserVoucher, UUID> {

    @Query("""
        SELECT uv FROM UserVoucher uv 
        JOIN FETCH uv.voucher v 
        WHERE uv.user.id = :userId 
          AND uv.isUsed = false 
          AND v.isDeleted = false 
          AND v.isActive = true 
          AND v.startDate <= :now 
          AND v.endDate >= :now
        ORDER BY uv.assignedAt DESC
    """)
    List<UserVoucher> findAvailableUserVouchers(@Param("userId") UUID userId, @Param("now") LocalDateTime now);

    Optional<UserVoucher> findByUser_IdAndVoucher_IdAndIsUsedFalse(UUID userId, UUID voucherId);

    Optional<UserVoucher> findByUser_IdAndVoucher_VoucherCodeAndIsUsedFalse(UUID userId, String voucherCode);
}

