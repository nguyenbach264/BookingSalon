package demo.bookingsalon.controller;

import demo.bookingsalon.entity.User;
import demo.bookingsalon.exception.PaymentException;
import demo.bookingsalon.dto.request.business.CreateOrderRequest;
import demo.bookingsalon.dto.response.business.OrderResponse;
import demo.bookingsalon.repository.UserRepository;
import demo.bookingsalon.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

import demo.bookingsalon.security.ratelimit.RateLimit;
import demo.bookingsalon.security.ratelimit.RateLimitType;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
@Slf4j
public class OrderController {

    private final OrderService orderService;
    private final UserRepository userRepository;

    @RateLimit(
        keyPrefix = "order",
        type = RateLimitType.USER,
        capacity = 5,
        durationSeconds = 300,
        message = "Quý khách chỉ có thể tạo tối đa 5 đơn hàng trong vòng 5 phút. Vui lòng thử lại sau!"
    )
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
        UUID authenticatedUserId = resolveUserId(authentication);
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equalsIgnoreCase("ROLE_ADMIN"));
        if (!isAdmin && (authenticatedUserId == null || !authenticatedUserId.equals(userId))) {
            throw new org.springframework.security.access.AccessDeniedException("Bạn không có quyền xem đơn hàng của người dùng khác!");
        }
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

