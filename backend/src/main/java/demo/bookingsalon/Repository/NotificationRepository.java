package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findBySalonId(UUID salonId);
    List<Notification> findByUserId(UUID userId);

}
