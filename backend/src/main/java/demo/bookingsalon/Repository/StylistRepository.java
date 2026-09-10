package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Stylist;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface StylistRepository extends JpaRepository<Stylist, UUID> {
}
