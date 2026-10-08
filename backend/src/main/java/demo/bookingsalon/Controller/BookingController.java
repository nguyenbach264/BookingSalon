package demo.bookingsalon.Controller;

import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Payload.Request.Business.CreateBookingRequest;
import demo.bookingsalon.Payload.Response.Business.BookingStatisticsResponse;
import demo.bookingsalon.Service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping({"/api/booking", "/api/bookings"})
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;

    @GetMapping()
    public ResponseEntity<?> getBookings() {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookings());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookingById(id));
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<?> getBookingByUserId(@PathVariable("id") UUID userId) {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookingByUserId(userId));
    }

    @GetMapping("/user/{id}/status/{status}")
    public ResponseEntity<?> getBookingByUserIdAndStatus(@PathVariable("id") UUID userId, @PathVariable("status") BookingStatus status) {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookingByUserIdAndStatus(userId, status));
    }

    @GetMapping("/stylist/{id}")
    public ResponseEntity<?> getBookingByStylistId(@PathVariable("id") UUID stylistId) {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookingByStylistId(stylistId));
    }

    @GetMapping("/stylist/{id}/status/{status}")
    public ResponseEntity<?> getBookingByStylistIdAndStatus(@PathVariable("id") UUID stylistId, @PathVariable("status") BookingStatus status) {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookingByStylistIdAndStatus(stylistId, status));
    }

    @GetMapping("/stylist/{stylistId}/booked-slots")
    public ResponseEntity<List<String>> getBookedSlots(
            @PathVariable UUID stylistId,
            @RequestParam @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate date) {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookedTimeSlotsByStylistAndDate(stylistId, date));
    }

    @GetMapping("/salon/{id}")
    public ResponseEntity<?> getBookingBySalonId(@PathVariable("id") UUID salonId) {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookingBySalonId(salonId));
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody @Valid CreateBookingRequest createBookingRequest,
                                            org.springframework.security.core.Authentication authentication) throws Exception {
        // Security: authentication already validated via JWT at SecurityConfig level.
        // Log for audit trail.
        if (authentication != null && authentication.isAuthenticated()) {
            org.slf4j.LoggerFactory.getLogger(BookingController.class)
                    .info("createBooking called by principal={}", authentication.getName());
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.createBooking(createBookingRequest));
    }

    @RequestMapping(value = {"/{id}", "/{id}/status"}, method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> updateBooking(@PathVariable UUID id, @RequestParam BookingStatus status) {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(bookingService.updateBooking(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelBooking(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.cancelBooking(id));
    }

    @DeleteMapping("/{id}/hard")
    public ResponseEntity<?> deleteBooking(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.deleteBooking(id));
    }

    @GetMapping("/statistics")
    public ResponseEntity<BookingStatisticsResponse> getBookingStatistics() {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookingStatistics());
    }

    @GetMapping("/statistics/salon/{salonId}")
    public ResponseEntity<BookingStatisticsResponse> getBookingStatisticsBySalon(@PathVariable UUID salonId) {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookingStatisticsBySalon(salonId));
    }

    @GetMapping("/statistics/user/{userId}")
    public ResponseEntity<BookingStatisticsResponse> getBookingStatisticsByUser(@PathVariable UUID userId) {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookingStatisticsByUser(userId));
    }

    @GetMapping("/statistics/stylist/{stylistId}")
    public ResponseEntity<BookingStatisticsResponse> getBookingStatisticsByStylist(@PathVariable UUID stylistId) {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookingStatisticsByStylist(stylistId));
    }
}
