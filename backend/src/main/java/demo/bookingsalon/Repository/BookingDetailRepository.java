package demo.bookingsalon.repository;

import demo.bookingsalon.entity.BookingDetail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface BookingDetailRepository extends JpaRepository<BookingDetail, UUID> {
}
