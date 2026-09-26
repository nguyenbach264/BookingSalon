package demo.bookingsalon.Service;

import demo.bookingsalon.Configuration.VnPayConfig;
import demo.bookingsalon.Utility.VnPaySignatureUtil;
import demo.bookingsalon.Entity.Order;
import demo.bookingsalon.Entity.OrderDetail;
import demo.bookingsalon.Entity.Product;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Enum.OrderStatus;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Exception.PaymentException;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Payload.Request.Business.CreateOrderRequest;
import demo.bookingsalon.Payload.Response.Business.OrderResponse;
import demo.bookingsalon.Repository.OrderDetailRepository;
import demo.bookingsalon.Repository.OrderRepository;
import demo.bookingsalon.Repository.ProductRepository;
import demo.bookingsalon.Repository.UserRepository;
import demo.bookingsalon.Utility.IdempotencyService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@Slf4j
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;
    private final IdempotencyService idempotencyService;
    private final NotificationService notificationService;
    private final NotificationWebSocketHandler notificationWebSocketHandler;
    private final VnPayConfig vnPayConfig;

    @Value("${payment.bank.bin:970422}")
    private String bankBin;

    @Value("${payment.bank.account:0901234567}")
    private String bankAccount;

    @Value("${payment.bank.name:MB Bank}")
    private String bankName;

    @Value("${payment.bank.account-name:BACHBARBER SALON}")
    private String bankAccountName;

    @Transactional
    public OrderResponse createOrder(CreateOrderRequest request, UUID authenticatedUserId) {
        UUID userId = authenticatedUserId != null ? authenticatedUserId : request.getUserId();
        if (userId == null) {
            throw new PaymentException("Vui lòng đăng nhập tài khoản để thực hiện đặt hàng!");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy thông tin tài khoản người dùng: " + userId));

        if (request.getItems() == null || request.getItems().isEmpty()) {
            throw new PaymentException("Giỏ hàng của bạn đang trống!");
        }

        // ── 1. IDEMPOTENCY LOCKING ───────────────────────────────────────────
        String idemKey = request.getIdempotencyKey();
        if (idemKey == null || idemKey.isBlank()) {
            idemKey = "user:" + userId + ":cart:" + request.getItems().hashCode();
        }
        String lockKey = "order:idempotent:" + idemKey;

        if (!idempotencyService.tryLock(lockKey, 15)) {
            log.warn("Duplicate order request detected for key: {}", lockKey);
            List<Order> recentOrders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
            if (!recentOrders.isEmpty()) {
                Order latest = recentOrders.get(0);
                if (latest.getStatus() != OrderStatus.CANCELLED && latest.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(30))) {
                    return mapToOrderResponse(latest);
                }
            }
            // Nếu đơn trước đó đã bị hủy hoặc đã quá thời gian, mở khóa để tạo đơn hàng mới
            idempotencyService.release(lockKey);
            if (!idempotencyService.tryLock(lockKey, 15)) {
                throw new PaymentException("Đơn hàng của bạn đang được hệ thống xử lý, vui lòng không gửi lại yêu cầu!");
            }
        }

        // ── 2. CONCURRENCY: ATOMIC STOCK DEDUCTION ────────────────────────────
        List<Product> productsList = new ArrayList<>();
        List<CreateOrderRequest.OrderItemRequest> deductedItems = new ArrayList<>();
        BigDecimal totalAmount = BigDecimal.ZERO;

        try {
            for (CreateOrderRequest.OrderItemRequest itemReq : request.getItems()) {
                Product product = productRepository.findById(itemReq.getProductId())
                        .orElseThrow(() -> new NotFoundException("Sản phẩm không tồn tại: " + itemReq.getProductId()));

                if (!product.isActive() || product.getDeletedAt() != null) {
                    throw new PaymentException("Sản phẩm '" + product.getName() + "' hiện đã tạm ngừng kinh doanh!");
                }

                int qty = itemReq.getQuantity();
                if (qty <= 0) {
                    throw new PaymentException("Số lượng đặt của sản phẩm '" + product.getName() + "' không hợp lệ!");
                }

                // Atomic stock decrement: WHERE product_id = :id AND stock_quantity >= :qty
                int updatedRows = productRepository.deductStockAtomic(product.getId(), qty);
                if (updatedRows == 0) {
                    log.error("Out of stock for product {}: requested {}, available in DB: {}",
                            product.getId(), qty, product.getStockQuantity());
                    throw new PaymentException("Sản phẩm '" + product.getName() + "' không đủ số lượng trong kho hoặc vừa có người khác đặt mua trước!");
                }

                deductedItems.add(itemReq);
                productsList.add(product);

                BigDecimal itemTotal = product.getPrice().multiply(BigDecimal.valueOf(qty));
                totalAmount = totalAmount.add(itemTotal);
            }
        } catch (RuntimeException ex) {
            // Roll back already deducted items for concurrency consistency
            for (CreateOrderRequest.OrderItemRequest prevDeducted : deductedItems) {
                try {
                    productRepository.restoreStockAtomic(prevDeducted.getProductId(), prevDeducted.getQuantity());
                } catch (Exception e) {
                    log.error("Failed to restore stock for product {}: {}", prevDeducted.getProductId(), e.getMessage());
                }
            }
            idempotencyService.release(lockKey);
            throw ex;
        }

        // ── 3. SHIPPING FEE & FINAL AMOUNT ────────────────────────────────────
        BigDecimal shippingFee = totalAmount.compareTo(BigDecimal.valueOf(500_000)) >= 0
                ? BigDecimal.ZERO
                : BigDecimal.valueOf(30_000);
        BigDecimal discountAmount = BigDecimal.ZERO;
        BigDecimal finalAmount = totalAmount.add(shippingFee).subtract(discountAmount);

        // ── 4. CREATE ORDER & ORDER DETAILS ───────────────────────────────────
        String orderCode = generateOrderCode();

        Order order = Order.builder()
                .orderCode(orderCode)
                .user(user)
                .totalAmount(totalAmount)
                .shippingFee(shippingFee)
                .discountAmount(discountAmount)
                .finalAmount(finalAmount)
                .paymentMethod(request.getPaymentMethod())
                .paymentStatus(PaymentStatus.PENDING)
                .status(OrderStatus.PENDING)
                .receiverName(request.getReceiverName().trim())
                .receiverPhone(request.getReceiverPhone().trim())
                .shippingAddress(request.getShippingAddress().trim())
                .note(request.getNote() != null ? request.getNote().trim() : null)
                .build();

        List<OrderDetail> details = new ArrayList<>();
        for (int i = 0; i < productsList.size(); i++) {
            Product prod = productsList.get(i);
            int qty = request.getItems().get(i).getQuantity();
            BigDecimal unitPrice = prod.getPrice();
            BigDecimal itemTotal = unitPrice.multiply(BigDecimal.valueOf(qty));

            OrderDetail detail = OrderDetail.builder()
                    .order(order)
                    .product(prod)
                    .quantity(qty)
                    .unitPrice(unitPrice)
                    .totalPrice(itemTotal)
                    .build();
            details.add(detail);
        }

        order.setOrderDetails(details);
        Order savedOrder = orderRepository.save(order);
        log.info("Order created successfully: {} - final amount: {}", orderCode, finalAmount);

        // ── 5. VNPAY URL GENERATION (nếu chọn thanh toán VNPay) ───────────────
        if (request.getPaymentMethod() == PaymentMethod.VNPAY) {
            try {
                String vnpayTxnRef = "ORD" + savedOrder.getId().toString().replace("-", "")
                        .substring(0, 14).toUpperCase();
                String vnpayUrl = buildVnPayUrl(savedOrder, vnpayTxnRef);
                savedOrder.setVnpayTxnRef(vnpayTxnRef);
                savedOrder.setVnpayUrl(vnpayUrl);
                savedOrder = orderRepository.save(savedOrder);
                log.info("VNPay URL generated for order: {}, txnRef: {}", orderCode, vnpayTxnRef);
            } catch (Exception e) {
                log.error("Failed to generate VNPay URL for order {}: {}", orderCode, e.getMessage());
                // Không block order creation nếu VNPay URL generation lỗi
            }
        }

        // ── 6. ASYNC NOTIFICATION & WEBSOCKET BROADCAST ───────────────────────
        try {
            notificationService.notifyOrderCreated(user.getId(), orderCode, finalAmount);
            notificationWebSocketHandler.broadcast(Map.of(
                    "type", "NEW_ORDER",
                    "orderCode", orderCode,
                    "userId", user.getId().toString(),
                    "totalAmount", finalAmount.toString()
            ));
        } catch (Exception e) {
            log.warn("Failed to dispatch order notification: {}", e.getMessage());
        }

        return mapToOrderResponse(savedOrder);
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> getUserOrders(UUID userId) {
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(userId);
        return orders.stream().map(this::mapToOrderResponse).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getOrderById(UUID orderId, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn hàng với id: " + orderId));

        if (userId != null && !order.getUser().getId().equals(userId)) {
            throw new PaymentException("Bạn không có quyền truy cập đơn hàng này!");
        }

        return mapToOrderResponse(order);
    }

    @Transactional
    public String getOrderVnPayUrl(UUID orderId, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn hàng với id: " + orderId));

        if (userId != null && !order.getUser().getId().equals(userId)) {
            throw new PaymentException("Bạn không có quyền thao tác trên đơn hàng này!");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new PaymentException("Đơn hàng không ở trạng thái Chờ xác nhận để thanh toán!");
        }

        String vnpayTxnRef = order.getVnpayTxnRef();
        if (vnpayTxnRef == null || vnpayTxnRef.isBlank()) {
            vnpayTxnRef = "ORD" + order.getId().toString().replace("-", "").substring(0, 14).toUpperCase();
            order.setVnpayTxnRef(vnpayTxnRef);
        }

        String freshUrl = buildVnPayUrl(order, vnpayTxnRef);
        order.setVnpayUrl(freshUrl);
        orderRepository.save(order);
        return freshUrl;
    }

    @Transactional
    public OrderResponse cancelOrder(UUID orderId, UUID userId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy đơn hàng với id: " + orderId));

        if (userId != null && !order.getUser().getId().equals(userId)) {
            throw new PaymentException("Bạn không có quyền thao tác trên đơn hàng này!");
        }

        if (order.getStatus() != OrderStatus.PENDING) {
            throw new PaymentException("Chỉ có thể hủy đơn hàng khi đang ở trạng thái Chờ xác nhận (PENDING)!");
        }

        // Atomic stock restore
        if (order.getOrderDetails() != null) {
            for (OrderDetail detail : order.getOrderDetails()) {
                if (detail.getProduct() != null) {
                    productRepository.restoreStockAtomic(detail.getProduct().getId(), detail.getQuantity());
                    log.info("Restored {} units of product {} upon order cancellation",
                            detail.getQuantity(), detail.getProduct().getId());
                }
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        order.setPaymentStatus(PaymentStatus.FAILED);
        Order updated = orderRepository.save(order);

        // Real-time notification
        try {
            notificationWebSocketHandler.sendToUser(order.getUser().getId(), Map.of(
                    "type", "ORDER_CANCELLED",
                    "orderCode", order.getOrderCode(),
                    "message", "Đơn hàng " + order.getOrderCode() + " đã được hủy thành công."
            ));
        } catch (Exception ignored) {}

        // Giải phóng lock idempotency để user có thể đặt đơn mới ngay lập tức
        try {
            if (order.getOrderDetails() != null) {
                idempotencyService.release("order:idempotent:user:" + order.getUser().getId() + ":cart:" + order.getOrderDetails().hashCode());
            }
        } catch (Exception ignored) {}

        return mapToOrderResponse(updated);
    }

    public OrderResponse mapToOrderResponse(Order order) {
        List<OrderResponse.OrderItemResponse> items = order.getOrderDetails() != null
                ? order.getOrderDetails().stream().map(d -> OrderResponse.OrderItemResponse.builder()
                .orderDetailId(d.getId())
                .productId(d.getProduct() != null ? d.getProduct().getId() : null)
                .productName(d.getProduct() != null ? d.getProduct().getName() : "Sản phẩm")
                .productImage(d.getProduct() != null ? d.getProduct().getImageUrl() : null)
                .quantity(d.getQuantity())
                .unitPrice(d.getUnitPrice())
                .totalPrice(d.getTotalPrice())
                .build()).toList()
                : Collections.emptyList();

        OrderResponse.BankTransferDetails bankDetails = null;
        if (order.getPaymentMethod() == PaymentMethod.BANK_TRANSFER) {
            String transferContent = order.getOrderCode();
            String qrUrl = String.format(
                    "https://img.vietqr.io/image/%s-%s-compact2.png?amount=%d&addInfo=%s&accountName=%s",
                    bankBin,
                    bankAccount,
                    order.getFinalAmount().longValue(),
                    transferContent,
                    URLEncoder.encode(bankAccountName, StandardCharsets.UTF_8)
            );

            bankDetails = OrderResponse.BankTransferDetails.builder()
                    .bankBin(bankBin)
                    .bankName(bankName)
                    .accountNo(bankAccount)
                    .accountName(bankAccountName)
                    .amount(order.getFinalAmount())
                    .transferContent(transferContent)
                    .qrCodeUrl(qrUrl)
                    .build();
        }

        return OrderResponse.builder()
                .id(order.getId())
                .orderId(order.getId())
                .orderCode(order.getOrderCode())
                .userId(order.getUser() != null ? order.getUser().getId() : null)
                .receiverName(order.getReceiverName())
                .receiverPhone(order.getReceiverPhone())
                .shippingAddress(order.getShippingAddress())
                .note(order.getNote())
                .totalAmount(order.getTotalAmount())
                .shippingFee(order.getShippingFee())
                .discountAmount(order.getDiscountAmount())
                .finalAmount(order.getFinalAmount())
                .paymentMethod(order.getPaymentMethod())
                .paymentStatus(order.getPaymentStatus())
                .status(order.getStatus())
                .createdAt(order.getCreatedAt())
                .items(items)
                .bankTransferDetails(bankDetails)
                .vnpayUrl(order.getVnpayUrl())
                .build();
    }

    private String generateOrderCode() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyMMdd"));
        String randPart = UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        return "DH" + datePart + randPart;
    }

    /**
     * Tạo VNPay payment URL cho shop order theo chuẩn VNPay 2.1.0
     * Sử dụng HMAC-SHA512 để ký request
     */
    private String buildVnPayUrl(Order order, String txnRef) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String createDate = LocalDateTime.now().format(formatter);
        String expireDate = LocalDateTime.now().plusMinutes(15).format(formatter);
        // VNPay yêu cầu amount * 100
        long amountInVnd = order.getFinalAmount().multiply(BigDecimal.valueOf(100)).longValue();

        Map<String, String> params = new TreeMap<>();
        params.put("vnp_Version", "2.1.0");
        params.put("vnp_Command", "pay");
        params.put("vnp_TmnCode", vnPayConfig.getTmnCode());
        params.put("vnp_Amount", String.valueOf(amountInVnd));
        params.put("vnp_CurrCode", "VND");
        params.put("vnp_TxnRef", txnRef);
        params.put("vnp_OrderInfo", "Thanh toan don hang " + order.getOrderCode());
        params.put("vnp_OrderType", "other");
        params.put("vnp_Locale", "vn");
        params.put("vnp_ReturnUrl", vnPayConfig.getReturnUrl());
        params.put("vnp_IpAddr", "127.0.0.1");
        params.put("vnp_CreateDate", createDate);
        params.put("vnp_ExpireDate", expireDate);

        String queryString = VnPaySignatureUtil.buildQueryString(params);
        String secureHash = VnPaySignatureUtil.hmacSHA512(vnPayConfig.getSecretKey(), queryString);
        return vnPayConfig.getPayUrl() + "?" + queryString + "&vnp_SecureHash=" + secureHash;
    }
}

