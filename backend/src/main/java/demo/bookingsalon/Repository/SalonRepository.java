package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Salon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface SalonRepository extends JpaRepository<Salon, UUID> {

//    Salon findByOwnerId(UUID ownerId);

    List<Salon> findByCityContainingOrderBySalonNameAsc(String city);

    @Query(value = """
        SELECT * FROM salon WHERE LOWER(city) LIKE LOWER(CONCAT('%' + :city + '%'))) AND open_time > :openTime
            """, nativeQuery = true)
        SELECT s FROM Salon s WHERE LOWER(s.city) LIKE LOWER(CONCAT('%', :city, '%')) AND s.openTime <= :openTime
    """)
    List<Salon> findByCityAndOpenTime(@Param("city") String city,
                                      @Param("openTime") LocalDateTime openTime);
                                      @Param("openTime") LocalTime openTime);
}
