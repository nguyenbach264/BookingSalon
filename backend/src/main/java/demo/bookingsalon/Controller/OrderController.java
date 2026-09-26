package demo.bookingsalon.Controller;

import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Exception.PaymentException;
import demo.bookingsalon.Payload.Request.Business.CreateOrderRequest;
import demo.bookingsalon.Payload.Response.Business.OrderResponse;
import demo.bookingsalon.Repository.UserRepository;
import demo.bookingsalon.Service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    @PostMapping
    public ResponseEntity<OrderResponse> createOrder(
            @Valid @RequestBody CreateOrderRequest request,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyHeader,
            Authentication authentication
    ) {
        UUID authenticatedUserId = resolveUserId(authentication);
        if (idempotencyHeader != null && !idempotencyHeader.isBlank()) {
            request.setIdempotencyKey(idempotencyHeader.trim());
        }

        log.info("Received order request from user: {} with payment: {}",
                authenticatedUserId != null ? authenticatedUserId : request.getUserId(),
                request.getPaymentMethod());

        OrderResponse response = orderService.createOrder(request, authenticatedUserId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<OrderResponse>> getUserOrders(
            @PathVariable UUID userId,
            Authentication authentication
    ) {
        log.info("Fetching orders for user: {}", userId);
        List<OrderResponse> orders = orderService.getUserOrders(userId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<OrderResponse> getOrderById(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        UUID authenticatedUserId = resolveUserId(authentication);
        OrderResponse order = orderService.getOrderById(id, authenticatedUserId);
        return ResponseEntity.ok(order);
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<OrderResponse> cancelOrder(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        UUID authenticatedUserId = resolveUserId(authentication);
        OrderResponse order = orderService.cancelOrder(id, authenticatedUserId);
        return ResponseEntity.ok(order);
    }

    @GetMapping("/{id}/vnpay-url")
    public ResponseEntity<java.util.Map<String, String>> getOrderVnPayUrl(
            @PathVariable UUID id,
            Authentication authentication
    ) {
        UUID authenticatedUserId = resolveUserId(authentication);
        String vnpayUrl = orderService.getOrderVnPayUrl(id, authenticatedUserId);
        return ResponseEntity.ok(java.util.Map.of("vnpayUrl", vnpayUrl));
    }

    private UUID resolveUserId(Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) return null;

        Object principal = authentication.getPrincipal();
        if (principal instanceof Jwt jwt) {
            String sub = jwt.getSubject();
            if (sub != null) {
                try {
                    UUID keycloakId = UUID.fromString(sub);
                    User user = userRepository.findByKeycloakId(keycloakId);
                    if (user != null) {
                        return user.getId();
                    }

                    // Fallback: Tìm theo preferred_username trong token claims và liên kết keycloakId
                    String username = jwt.getClaimAsString("preferred_username");
                    if (username != null && !username.isBlank()) {
                        user = userRepository.findByUsername(username).orElse(null);
                        if (user != null) {
                            user.setKeycloakId(keycloakId);
                            userRepository.save(user);
                            log.info("Auto-linked user {} with Keycloak ID {}", user.getUsername(), keycloakId);
                            return user.getId();
                        }
                    }

                    // Fallback: Tìm theo email trong token claims
                    String email = jwt.getClaimAsString("email");
                    if (email != null && !email.isBlank()) {
                        user = userRepository.findByEmail(email).orElse(null);
                        if (user != null) {
                            user.setKeycloakId(keycloakId);
                            userRepository.save(user);
                            log.info("Auto-linked user by email {} with Keycloak ID {}", user.getEmail(), keycloakId);
                            return user.getId();
                        }
                    }
                } catch (IllegalArgumentException ignored) {}
            }
        }
        return null;
    }
}

