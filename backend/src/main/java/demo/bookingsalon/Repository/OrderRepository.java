package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Order;
import demo.bookingsalon.Enum.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrderRepository extends JpaRepository<Order, UUID> {
    Optional<Order> findByOrderCode(String orderCode);
    Optional<Order> findByVnpayTxnRef(String vnpayTxnRef);
    List<Order> findByUserIdOrderByCreatedAtDesc(UUID userId);
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);
    Page<Order> findByStatus(OrderStatus status, Pageable pageable);
    List<Order> findByReceiverPhone(String receiverPhone);
    long countByStatus(OrderStatus status);
}


