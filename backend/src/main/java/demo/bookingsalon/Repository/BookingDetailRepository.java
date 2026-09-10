package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.BookingDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BookingDetailRepository extends JpaRepository<BookingDetail, UUID> {
}
