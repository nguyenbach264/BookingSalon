package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Salon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface SalonRepository extends JpaRepository<Salon, UUID> {

//    Salon findByOwnerId(UUID ownerId);

    List<Salon> findByCityContainingOrderBySalonNameAsc(String city);

    @Query(value = """
        SELECT * FROM salon WHERE LOWER(city) LIKE LOWER(CONCAT('%' + :city + '%'))) AND open_time > :openTime
            """, nativeQuery = true)
    List<Salon> findByCityAndOpenTime(@Param("city") String city,
                                      @Param("openTime") LocalDateTime openTime);
}
