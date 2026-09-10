package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, UUID> {
    Optional<List<PaymentTransaction>> findByPayment_PaymentCode(String paymentCode);
}
