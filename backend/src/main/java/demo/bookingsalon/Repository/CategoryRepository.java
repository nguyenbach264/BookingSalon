package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, String> {

//    Category findBySalonId(UUID salonId);
}
