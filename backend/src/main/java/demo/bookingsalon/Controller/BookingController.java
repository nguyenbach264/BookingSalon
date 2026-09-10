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

import java.util.UUID;

@RestController
@RequestMapping("/api/booking")
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
    public ResponseEntity<?> getBookingByUserId(@PathVariable UUID userId) {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookingByUserId(userId));
    }

    @GetMapping("/salon/{id}")
    public ResponseEntity<?> getBookingBySalonId(@PathVariable UUID salonId) {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookingBySalonId(salonId));
    }

    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody @Valid CreateBookingRequest createBookingRequest) throws Exception {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.createBooking(createBookingRequest));
    }

    @PostMapping("/{id}")
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
}
