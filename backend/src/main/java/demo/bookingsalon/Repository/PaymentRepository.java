package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Payment;
import demo.bookingsalon.Enum.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentRepository extends JpaRepository<Payment, UUID> {

    Optional<Payment> findByBookingId(UUID bookingId);

    Optional<List<Payment>> findByStatusAndCreatedAt(PaymentStatus status, LocalDateTime createdAt);

    Optional<Payment> findByPaymentCode(String paymentCode);

    @Query("""
        SELECT p
        FROM Payment p
        WHERE p.status = :status
            AND p.createdAt < :cutoffTime
            AND p.paymentMethod <> demo.bookingsalon.Enum.PaymentMethod.COD
    """)
    Optional<List<Payment>> findByStatusAndCreatedBefore(
            @Param("status") PaymentStatus status,
            @Param("cutoffTime") LocalDateTime cutoffTime);
}
