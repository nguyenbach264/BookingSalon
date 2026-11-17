package demo.bookingsalon.repository;

import demo.bookingsalon.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface CategoryRepository extends JpaRepository<Category, String> {

//    Category findBySalonId(UUID salonId);
}
