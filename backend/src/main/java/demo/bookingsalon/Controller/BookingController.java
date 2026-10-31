package demo.bookingsalon.Controller;

import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Payload.Request.Business.CreateBookingRequest;
import demo.bookingsalon.Payload.Response.Business.BookingResponse;
import demo.bookingsalon.Payload.Response.Business.BookingStatisticsResponse;
import demo.bookingsalon.Payload.Response.Common.PageResponse;
import demo.bookingsalon.Service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import demo.bookingsalon.Security.RateLimit.RateLimit;
import demo.bookingsalon.Security.RateLimit.RateLimitType;

@RestController
@RequestMapping({"/api/booking", "/api/bookings"})
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;
    private final demo.bookingsalon.Utility.SecurityUtils securityUtils;

    @GetMapping()
    public ResponseEntity<?> getBookings(
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) UUID salonId,
            @RequestParam(required = false) UUID stylistId,
            @RequestParam(required = false) String search
    ) {
        if (page != null || size != null) {
            int p = page != null ? page : 0;
            int s = size != null ? size : 20;
            return ResponseEntity.ok(bookingService.getBookingsPage(status, salonId, stylistId, search, p, s));
        }
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookings());
    }

    @GetMapping("/page")
    public ResponseEntity<PageResponse<BookingResponse>> getBookingsPage(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(required = false) UUID salonId,
            @RequestParam(required = false) UUID stylistId,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ResponseEntity.ok(bookingService.getBookingsPage(status, salonId, stylistId, search, page, size));
    }


    @GetMapping("/{id}")
    public ResponseEntity<?> getBookingById(@PathVariable UUID id) {
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookingById(id));
    }

    @GetMapping("/user/{id}")
    public ResponseEntity<?> getBookingByUserId(
            @PathVariable("id") UUID userId,
            org.springframework.security.core.Authentication authentication) {
        securityUtils.validateUserAccess(authentication, userId);
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.getBookingByUserId(userId));
    }

    @GetMapping("/user/{id}/status/{status}")
    public ResponseEntity<?> getBookingByUserIdAndStatus(
            @PathVariable("id") UUID userId,
            @PathVariable("status") BookingStatus status,
            org.springframework.security.core.Authentication authentication) {
        securityUtils.validateUserAccess(authentication, userId);
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

    @RateLimit(
        keyPrefix = "booking",
        type = RateLimitType.USER,
        capacity = 3,
        durationSeconds = 300,
        message = "Quý khách chỉ có thể tạo tối đa 3 lịch hẹn trong vòng 5 phút. Vui lòng chờ trước khi tiếp tục!"
    )
    @PostMapping
    public ResponseEntity<?> createBooking(@RequestBody @Valid CreateBookingRequest createBookingRequest,
                                            org.springframework.security.core.Authentication authentication) throws Exception {
        UUID currentUserId = securityUtils.getCurrentUserId(authentication);
        if (currentUserId != null) {
            createBookingRequest.setUserId(currentUserId);
        }
        if (authentication != null && authentication.isAuthenticated()) {
            org.slf4j.LoggerFactory.getLogger(BookingController.class)
                    .info("createBooking called by principal={}, userId={}", authentication.getName(), createBookingRequest.getUserId());
        }
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(bookingService.createBooking(createBookingRequest));
    }

    @RequestMapping(value = {"/{id}", "/{id}/status"}, method = {RequestMethod.POST, RequestMethod.PUT})
    public ResponseEntity<?> updateBooking(
            @PathVariable UUID id,
            @RequestParam BookingStatus status,
            org.springframework.security.core.Authentication authentication) {
        BookingResponse booking = bookingService.getBookingById(id);
        boolean isAdmin = securityUtils.isAdmin(authentication);
        boolean isStylist = securityUtils.isStylist(authentication);
        UUID currentUserId = securityUtils.getCurrentUserId(authentication);

        if (!isAdmin && !isStylist && (currentUserId == null || !currentUserId.equals(booking.getUserId()))) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền cập nhật lịch hẹn này!");
        }
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(bookingService.updateBooking(id, status));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelBooking(
            @PathVariable UUID id,
            org.springframework.security.core.Authentication authentication) {
        BookingResponse booking = bookingService.getBookingById(id);
        securityUtils.validateUserAccess(authentication, booking.getUserId());
        return ResponseEntity.status(HttpStatus.OK).body(bookingService.cancelBooking(id));
    }

    @DeleteMapping("/{id}/hard")
    public ResponseEntity<?> deleteBooking(
            @PathVariable UUID id,
            org.springframework.security.core.Authentication authentication) {
        if (!securityUtils.isAdmin(authentication)) {
            throw new org.springframework.security.access.AccessDeniedException("Chỉ quản trị viên mới có quyền xóa vĩnh viễn lịch hẹn!");
        }
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
