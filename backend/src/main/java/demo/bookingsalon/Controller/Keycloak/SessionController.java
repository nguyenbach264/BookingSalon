package demo.bookingsalon.Controller.Keycloak;

import demo.bookingsalon.Payload.Response.Keycloak.SessionResponse;
import demo.bookingsalon.Payload.Response.Keycloak.SessionSummaryResponse;
import demo.bookingsalon.Service.Keycloak.SessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {
    private final SessionService sessionService;

    public SessionController(SessionService sessionService) {
        this.sessionService = sessionService;
    }

    // ---------- 1. Lấy sessions của một user ----------
    @GetMapping("/users/{userId}")
    public ResponseEntity<List<SessionResponse>> getUserSessions(@PathVariable String userId) {
        return ResponseEntity.ok(sessionService.getUserSessions(userId));
    }

    // ---------- 2. Lấy sessions của một client ----------
    @GetMapping("/clients/{clientId}")
    public ResponseEntity<List<SessionResponse>> getClientSessions(
            @PathVariable String clientId,
            @RequestParam(defaultValue = "0") int first,
            @RequestParam(defaultValue = "10") int max) {
        return ResponseEntity.ok(sessionService.getClientSessions(clientId, first ,max));
    }

    // ---------- 3. Lấy tóm tắt session của user ----------
    @GetMapping("/users/{userId}/summary")
    public ResponseEntity<SessionSummaryResponse> getUserSessionSummary(@PathVariable String userId) {
        return ResponseEntity.ok(sessionService.getUserSessionSummary(userId));
    }

    // ---------- 4. Logout (force logout) một user ----------
    @PostMapping("/users/{userId}/logout")
    public ResponseEntity<Void> logoutUser(@PathVariable String userId) {
        sessionService.logoutUserSessions(userId);
        return ResponseEntity.ok().build();
    }

    // ---------- 5. Logout tất cả session của một client ----------
    @PostMapping("/clients/{clientId}/logout")
    public ResponseEntity<Void> logoutClient(@PathVariable String clientId) {
        sessionService.logoutClientSessions(clientId);
        return ResponseEntity.ok().build();
    }

    // ---------- 6. (Optional) Lấy số lượng session của client ----------
    @GetMapping("/clients/{clientId}/count")
    public ResponseEntity<Integer> getClientSessionCount(@PathVariable String clientId) {
        return ResponseEntity.ok(sessionService.getClientSessionCount(clientId));
    }
}
