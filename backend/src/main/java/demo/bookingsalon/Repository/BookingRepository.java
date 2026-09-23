package demo.bookingsalon.Repository;

import demo.bookingsalon.Entity.Booking;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import demo.bookingsalon.Enum.BookingStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public interface BookingRepository extends JpaRepository<Booking, UUID> {

    List<Booking> getBookingByUserId(UUID userId);

    List<Booking> findByUserIdAndStatus(UUID userId, BookingStatus status);

    List<Booking> getBookingBySalonId(UUID salonId);

    List<Booking> findByStylistId(UUID stylistId);

    List<Booking> findByStylistIdAndStatus(UUID stylistId, BookingStatus status);

    // Thống kê booking theo status
    long countByStatus(BookingStatus status);

    long countByStatusAndSalonId(BookingStatus status, UUID salonId);

    long countByStatusAndUserId(BookingStatus status, UUID userId);

    long countByStatusAndStylistId(BookingStatus status, UUID stylistId);

    // Query để kiểm tra booking trùng time slot với PESSIMISTIC WRITE lock
    @Query("SELECT b FROM Booking b WHERE b.salon.id = :salonId " +
           "AND b.status != 'CANCELLED' " +
           "AND ((b.startTime < :endTime AND b.endTime > :startTime))")
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<Booking> findConflictingBookings(@Param("salonId") UUID salonId,
                                          @Param("startTime") LocalDateTime startTime,
                                          @Param("endTime") LocalDateTime endTime);

    // Query để kiểm tra stylist trùng time slot với PESSIMISTIC WRITE lock
    @Query("SELECT b FROM Booking b WHERE b.stylist.id = :stylistId " +
           "AND b.status != 'CANCELLED' " +
           "AND ((b.startTime < :endTime AND b.endTime > :startTime))")
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<Booking> findConflictingBookingsByStylist(@Param("stylistId") UUID stylistId,
                                                   @Param("startTime") LocalDateTime startTime,
                                                   @Param("endTime") LocalDateTime endTime);

    // Query lấy danh sách booking của stylist trong ngày để lọc time slot bận
    @Query("SELECT b FROM Booking b WHERE b.stylist.id = :stylistId " +
           "AND b.status != 'CANCELLED' " +
           "AND b.startTime >= :dayStart AND b.startTime < :dayEnd")
    List<Booking> findActiveBookingsByStylistAndDate(@Param("stylistId") UUID stylistId,
                                                    @Param("dayStart") LocalDateTime dayStart,
                                                    @Param("dayEnd") LocalDateTime dayEnd);

    // Query để lấy booking với lock để update
    @Query("SELECT b FROM Booking b WHERE b.id = :id")
    @Lock(LockModeType.OPTIMISTIC)
    Booking findByIdWithOptimisticLock(@Param("id") UUID id);
}

