package demo.bookingsalon.Controller.Keycloak;

import demo.bookingsalon.Payload.Request.Keycloak.FilterEventRequest;
import demo.bookingsalon.Payload.Response.Keycloak.AdminEventResponse;
import demo.bookingsalon.Payload.Response.Keycloak.EventResponse;
import demo.bookingsalon.Service.Keycloak.EventService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {
    private final EventService eventService;

    @GetMapping()
    public List<EventResponse> getAllEvents() {
        return eventService.getAllEvents();
    }

    // ---------- 1. Lấy user events (có lọc) ----------
    @GetMapping("/user")
    public ResponseEntity<List<EventResponse>> getUserEvents(
            @RequestParam(required = false) String clientId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String ipAddress,
            @RequestParam(required = false) Long fromDate,
            @RequestParam(required = false) Long toDate,
            @RequestParam(required = false) List<String> types,
            @RequestParam(defaultValue = "0") Integer first,
            @RequestParam(defaultValue = "50") Integer max) {

        FilterEventRequest filter = new FilterEventRequest();
        filter.setClientId(clientId);
        filter.setUserId(userId);
        filter.setIpAddress(ipAddress);
        filter.setFromDate(fromDate);
        filter.setToDate(toDate);
        filter.setTypes(types);
        filter.setFirst(first);
        filter.setMax(max);

        return ResponseEntity.ok(eventService.getUserEvents(filter));
    }

    // ---------- 2. Lấy admin events ----------
    @GetMapping("/admin")
    public ResponseEntity<List<AdminEventResponse>> getAdminEvents(
            @RequestParam(required = false) String clientId,
            @RequestParam(required = false) String userId,
            @RequestParam(required = false) String ipAddress,
            @RequestParam(required = false) Long fromDate,
            @RequestParam(required = false) Long toDate,
            @RequestParam(defaultValue = "0") Integer first,
            @RequestParam(defaultValue = "50") Integer max) {

        FilterEventRequest filter = new FilterEventRequest();
        filter.setClientId(clientId);
        filter.setUserId(userId);
        filter.setIpAddress(ipAddress);
        filter.setFromDate(fromDate);
        filter.setToDate(toDate);
        filter.setFirst(first);
        filter.setMax(max);

        return ResponseEntity.ok(eventService.getAdminEvents(filter));
    }

    // ---------- 3. Xóa tất cả user events ----------
    @DeleteMapping("/user")
    public ResponseEntity<Void> clearUserEvents() {
        eventService.clearUserEvents();
        return ResponseEntity.noContent().build();
    }

    // ---------- 4. Xóa tất cả admin events ----------
    @DeleteMapping("/admin")
    public ResponseEntity<Void> clearAdminEvents() {
        eventService.clearAdminEvents();
        return ResponseEntity.noContent().build();
    }
}
