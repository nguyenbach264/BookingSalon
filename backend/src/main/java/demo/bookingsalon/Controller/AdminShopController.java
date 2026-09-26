package demo.bookingsalon.Controller;

import demo.bookingsalon.Entity.Order;
import demo.bookingsalon.Entity.Product;
import demo.bookingsalon.Entity.ProductCategory;
import demo.bookingsalon.Enum.OrderStatus;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Payload.DTO.ProductDTO;
import demo.bookingsalon.Payload.Response.Business.OrderResponse;
import demo.bookingsalon.Repository.OrderDetailRepository;
import demo.bookingsalon.Repository.OrderRepository;
import demo.bookingsalon.Repository.ProductCategoryRepository;
import demo.bookingsalon.Repository.ProductRepository;
import demo.bookingsalon.Service.NotificationService;
import demo.bookingsalon.Service.OrderService;
import demo.bookingsalon.Service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.*;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminShopController {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository productCategoryRepository;
    private final ProductService productService;
    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final OrderService orderService;
    private final NotificationService notificationService;
    private final NotificationWebSocketHandler notificationWebSocketHandler;

    // ─────────────────────────────────────────────────────────────
    // 1. PRODUCTS MANAGEMENT (CRUD & STATS)
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/products")
    public ResponseEntity<Page<ProductDTO>> getAdminProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "200") int size
    ) {
        PageRequest pageRequest = PageRequest.of(Math.max(0, page), Math.min(250, Math.max(1, size)),
                Sort.by(Sort.Direction.DESC, "createdAt"));

        Page<Product> productPage;
        if (search != null && !search.trim().isEmpty()) {
            productPage = productRepository.findAll((root, query, cb) -> {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                var nameLike = cb.like(cb.lower(root.get("name")), pattern);
                var descLike = cb.like(cb.lower(root.get("description")), pattern);
                return cb.or(nameLike, descLike);
            }, pageRequest);
        } else if (categoryId != null) {
            productPage = productRepository.findAll((root, query, cb) ->
                    cb.equal(root.get("category").get("id"), categoryId), pageRequest);
        } else {
            productPage = productRepository.findAll(pageRequest);
        }

        return ResponseEntity.ok(productPage.map(productService::mapToDTO));
    }

    @PostMapping("/products")
    @Transactional
    public ResponseEntity<ProductDTO> createProduct(@RequestBody Map<String, Object> body) {
        String name = (String) body.get("name");
        String description = (String) body.get("description");
        BigDecimal price = body.get("price") != null ? new BigDecimal(String.valueOf(body.get("price"))) : BigDecimal.ZERO;
        BigDecimal originalPrice = body.get("originalPrice") != null
                ? new BigDecimal(String.valueOf(body.get("originalPrice")))
                : price;
        int stockQuantity = body.get("stockQuantity") != null
                ? Integer.parseInt(String.valueOf(body.get("stockQuantity")))
                : 0;
        String imageUrl = (String) body.get("imageUrl");
        boolean active = body.get("active") != null ? Boolean.parseBoolean(String.valueOf(body.get("active"))) : true;

        UUID categoryId = null;
        if (body.get("categoryId") != null) {
            categoryId = UUID.fromString(String.valueOf(body.get("categoryId")));
        }

        ProductCategory category = null;
        if (categoryId != null) {
            category = productCategoryRepository.findById(categoryId).orElse(null);
        }
        if (category == null) {
            category = productCategoryRepository.findAll().stream().findFirst().orElse(null);
        }

        String baseSlug = toSlug(name);
        String slug = baseSlug;
        int suffix = 1;
        while (productRepository.findBySlug(slug).isPresent()) {
            slug = baseSlug + "-" + suffix++;
        }

        Product product = Product.builder()
                .name(name)
                .slug(slug)
                .description(description)
                .price(price)
                .originalPrice(originalPrice)
                .stockQuantity(stockQuantity)
                .imageUrl(imageUrl != null && !imageUrl.isBlank()
                        ? imageUrl
                        : "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=400&auto=format&fit=crop")
                .rating(5.0)
                .reviewCount(0)
                .soldCount(0)
                .active(active)
                .category(category)
                .build();

        Product saved = productRepository.save(product);
        log.info("Admin created new product: {} (ID: {})", saved.getName(), saved.getId());
        return ResponseEntity.ok(productService.mapToDTO(saved));
    }

    @PutMapping("/products/{id}")
    @Transactional
    public ResponseEntity<ProductDTO> updateProduct(@PathVariable UUID id, @RequestBody Map<String, Object> body) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm id: " + id));

        if (body.containsKey("name")) product.setName((String) body.get("name"));
        if (body.containsKey("description")) product.setDescription((String) body.get("description"));
        if (body.containsKey("price")) product.setPrice(new BigDecimal(String.valueOf(body.get("price"))));
        if (body.containsKey("originalPrice")) product.setOriginalPrice(new BigDecimal(String.valueOf(body.get("originalPrice"))));
        if (body.containsKey("stockQuantity")) product.setStockQuantity(Integer.parseInt(String.valueOf(body.get("stockQuantity"))));
        if (body.containsKey("imageUrl")) product.setImageUrl((String) body.get("imageUrl"));
        if (body.containsKey("active")) product.setActive(Boolean.parseBoolean(String.valueOf(body.get("active"))));

        if (body.containsKey("categoryId") && body.get("categoryId") != null) {
            UUID catId = UUID.fromString(String.valueOf(body.get("categoryId")));
            productCategoryRepository.findById(catId).ifPresent(product::setCategory);
        }

        Product updated = productRepository.save(product);
        log.info("Admin updated product: {} (ID: {})", updated.getName(), updated.getId());
        return ResponseEntity.ok(productService.mapToDTO(updated));
    }

    @DeleteMapping("/products/{id}")
    @Transactional
    public ResponseEntity<Void> deleteProduct(@PathVariable UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm id: " + id));

        product.setActive(false);
        product.setDeletedAt(LocalDateTime.now());
        productRepository.save(product);
        log.info("Admin deactivated/deleted product: {} (ID: {})", product.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/products/stats")
    @Transactional(readOnly = true)
    public ResponseEntity<Map<String, Object>> getProductStats() {
        List<Product> allProducts = productRepository.findAll();
        long total = allProducts.stream().filter(p -> p.getDeletedAt() == null).count();
        long active = allProducts.stream().filter(p -> p.isActive() && p.getDeletedAt() == null).count();
        long outOfStock = allProducts.stream().filter(p -> p.getDeletedAt() == null && (p.getStockQuantity() == null || p.getStockQuantity() <= 0)).count();

        List<Order> deliveredOrders = orderRepository.findByStatusOrderByCreatedAtDesc(OrderStatus.DELIVERED);
        BigDecimal totalRevenue = deliveredOrders.stream()
                .map(Order::getFinalAmount)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Top 5 sellers
        List<Map<String, Object>> topSellers = allProducts.stream()
                .filter(p -> p.getDeletedAt() == null && p.getSoldCount() != null && p.getSoldCount() > 0)
                .sorted((a, b) -> Integer.compare(b.getSoldCount(), a.getSoldCount()))
                .limit(5)
                .map(p -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", p.getId());
                    map.put("name", p.getName());
                    map.put("imageUrl", p.getImageUrl());
                    map.put("soldCount", p.getSoldCount());
                    map.put("revenue", p.getPrice().multiply(BigDecimal.valueOf(p.getSoldCount())));
                    map.put("rating", p.getRating() != null ? p.getRating() : 5.0);
                    return map;
                })
                .toList();

        Map<String, Object> stats = new HashMap<>();
        stats.put("total", total);
        stats.put("active", active);
        stats.put("outOfStock", outOfStock);
        stats.put("totalRevenue", totalRevenue);
        stats.put("topSellers", topSellers);

        return ResponseEntity.ok(stats);
    }

    // ─────────────────────────────────────────────────────────────
    // 2. ORDER MANAGEMENT
    // ─────────────────────────────────────────────────────────────

    @GetMapping("/orders")
    @Transactional(readOnly = true)
    public ResponseEntity<List<OrderResponse>> getAdminOrders(@RequestParam(required = false) String status) {
        List<Order> orders;
        if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
            OrderStatus orderStatus = parseOrderStatus(status);
            orders = orderRepository.findByStatusOrderByCreatedAtDesc(orderStatus);
        } else {
            orders = orderRepository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"));
        }

        List<OrderResponse> responses = orders.stream()
                .map(orderService::mapToOrderResponse)
                .toList();
        return ResponseEntity.ok(responses);
    }

    @PutMapping("/orders/{id}/status")
    @Transactional
    public ResponseEntity<OrderResponse> updateOrderStatus(
            @PathVariable UUID id,
            @RequestParam(required = false) String status,
            @RequestBody(required = false) Map<String, String> body
    ) {
        String targetStatusStr = status != null ? status : (body != null ? body.get("status") : null);
        if (targetStatusStr == null || targetStatusStr.isBlank()) {
            throw new IllegalArgumentException("Trạng thái không được để trống!");
        }

        OrderStatus targetStatus = parseOrderStatus(targetStatusStr);
        Order order = orderRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn hàng: " + id));

        OrderStatus oldStatus = order.getStatus();
        order.setStatus(targetStatus);

        // If delivered and was COD, mark payment as SUCCESS
        if (targetStatus == OrderStatus.DELIVERED) {
            order.setPaymentStatus(PaymentStatus.SUCCESS);
            try {
                if (order.getUser() != null) {
                    notificationService.notifyOrderDelivered(order.getUser().getId(), order.getOrderCode());
                    notificationWebSocketHandler.sendToUser(order.getUser().getId(), Map.of(
                            "type", "ORDER_DELIVERED",
                            "orderCode", order.getOrderCode(),
                            "title", "Đơn hàng đã giao thành công!",
                            "content", "Đơn hàng #" + order.getOrderCode() + " đã được giao thành công. Vui lòng để lại đánh giá!"
                    ));
                    notificationWebSocketHandler.sendToUser(order.getUser().getId(), Map.of(
                            "type", "REVIEW_REQUEST",
                            "orderCode", order.getOrderCode(),
                            "title", "Đánh giá sản phẩm",
                            "content", "Hãy chia sẻ cảm nhận của bạn về các sản phẩm trong đơn hàng #" + order.getOrderCode()
                    ));
                }
            } catch (Exception e) {
                log.warn("Failed to dispatch delivery notifications: {}", e.getMessage());
            }
        } else if (targetStatus == OrderStatus.CANCELLED && oldStatus != OrderStatus.CANCELLED) {
            // Restore inventory
            try {
                if (order.getOrderDetails() != null) {
                    for (var detail : order.getOrderDetails()) {
                        if (detail.getProduct() != null && detail.getQuantity() != null) {
                            productRepository.restoreStockAtomic(detail.getProduct().getId(), detail.getQuantity());
                        }
                    }
                }
                if (order.getUser() != null) {
                    notificationWebSocketHandler.sendToUser(order.getUser().getId(), Map.of(
                            "type", "ORDER_CANCELLED",
                            "orderCode", order.getOrderCode(),
                            "title", "Đơn hàng đã bị hủy",
                            "content", "Đơn hàng #" + order.getOrderCode() + " đã được chuyển sang trạng thái đã hủy."
                    ));
                }
            } catch (Exception e) {
                log.warn("Failed to restore stock on cancel: {}", e.getMessage());
            }
        }

        Order saved = orderRepository.save(order);
        log.info("Admin updated order {} status from {} to {}", id, oldStatus, targetStatus);
        return ResponseEntity.ok(orderService.mapToOrderResponse(saved));
    }

    private OrderStatus parseOrderStatus(String status) {
        String s = status.trim().toUpperCase();
        if ("SHIPPED".equals(s)) return OrderStatus.SHIPPING;
        return OrderStatus.valueOf(s);
    }

    private String toSlug(String input) {
        if (input == null) return UUID.randomUUID().toString();
        String nowhitespace = Pattern.compile("[\\s]").matcher(input).replaceAll("-");
        String normalized = Normalizer.normalize(nowhitespace, Normalizer.Form.NFD);
        String slug = Pattern.compile("[^\\w-]").matcher(normalized).replaceAll("").toLowerCase(Locale.ENGLISH);
        return slug.replaceAll("-+", "-");
    }
}

