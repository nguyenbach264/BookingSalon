package demo.bookingsalon.OrderTest;

import demo.bookingsalon.Configuration.VnPayConfig;
import demo.bookingsalon.Entity.*;
import demo.bookingsalon.Enum.OrderStatus;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Exception.PaymentException;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Payload.Request.Business.CreateOrderRequest;
import demo.bookingsalon.Payload.Response.Business.OrderResponse;
import demo.bookingsalon.Repository.*;
import demo.bookingsalon.Service.NotificationService;
import demo.bookingsalon.Service.OrderService;
import demo.bookingsalon.Service.VoucherService;
import demo.bookingsalon.Utility.IdempotencyService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class OrderServiceUnitTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private OrderDetailRepository orderDetailRepository;

    @Mock
    private ProductRepository productRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private IdempotencyService idempotencyService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private NotificationWebSocketHandler notificationWebSocketHandler;

    @Mock
    private VnPayConfig vnPayConfig;

    @Mock
    private VoucherService voucherService;

    @Mock
    private VoucherRepository voucherRepository;

    @InjectMocks
    private OrderService orderService;

    private UUID userId;
    private UUID productId;
    private User testUser;
    private Product testProduct;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        productId = UUID.randomUUID();

        testUser = User.builder()
                .id(userId)
                .username("ordertester")
                .fullName("Order Tester")
                .email("order@example.com")
                .phoneNumber("0912345678")
                .build();

        testProduct = Product.builder()
                .id(productId)
                .name("Pomade Vuot Toc")
                .price(BigDecimal.valueOf(250000))
                .stockQuantity(10)
                .active(true)
                .build();

        ReflectionTestUtils.setField(orderService, "bankBin", "970422");
        ReflectionTestUtils.setField(orderService, "bankAccount", "0901234567");
        ReflectionTestUtils.setField(orderService, "bankName", "MB Bank");
        ReflectionTestUtils.setField(orderService, "bankAccountName", "BACHBARBER SALON");
    }

    @Test
    @DisplayName("UT-Order-01: createOrder thành công phương thức COD và trừ tồn kho atomic")
    void testCreateOrder_COD_Success() {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .userId(userId)
                .receiverName("Order Tester")
                .receiverPhone("0912345678")
                .shippingAddress("123 Cau Giay, Ha Noi")
                .paymentMethod(PaymentMethod.COD)
                .items(List.of(CreateOrderRequest.OrderItemRequest.builder()
                        .productId(productId)
                        .quantity(2)
                        .build()))
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(idempotencyService.tryLock(anyString(), anyLong())).thenReturn(true);
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
        when(productRepository.deductStockAtomic(productId, 2)).thenReturn(1);

        Order savedOrder = Order.builder()
                .id(UUID.randomUUID())
                .orderCode("OD-2026-TEST")
                .user(testUser)
                .receiverName("Order Tester")
                .totalAmount(BigDecimal.valueOf(500000))
                .finalAmount(BigDecimal.valueOf(500000))
                .status(OrderStatus.PENDING)
                .paymentMethod(PaymentMethod.COD)
                .paymentStatus(PaymentStatus.PENDING)
                .createdAt(LocalDateTime.now())
                .build();

        when(orderRepository.save(any(Order.class))).thenReturn(savedOrder);

        OrderResponse response = orderService.createOrder(request, userId);

        assertNotNull(response);
        assertEquals(OrderStatus.PENDING, response.getStatus());
        assertEquals(PaymentMethod.COD, response.getPaymentMethod());
        verify(productRepository, times(1)).deductStockAtomic(productId, 2);
        verify(orderRepository, times(1)).save(any(Order.class));
    }

    @Test
    @DisplayName("UT-Order-02: createOrder ném PaymentException khi giỏ hàng rỗng")
    void testCreateOrder_EmptyItems_ThrowsPaymentException() {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .userId(userId)
                .receiverName("Tester")
                .items(Collections.emptyList())
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        assertThrows(PaymentException.class, () -> orderService.createOrder(request, userId));
        verify(productRepository, never()).deductStockAtomic(any(), anyInt());
    }

    @Test
    @DisplayName("UT-Order-03: createOrder ném PaymentException và hoàn kho khi hết hàng")
    void testCreateOrder_OutOfStock_ThrowsException() {
        CreateOrderRequest request = CreateOrderRequest.builder()
                .userId(userId)
                .receiverName("Tester")
                .receiverPhone("0912345678")
                .shippingAddress("123 Cau Giay")
                .paymentMethod(PaymentMethod.COD)
                .items(List.of(CreateOrderRequest.OrderItemRequest.builder()
                        .productId(productId)
                        .quantity(5)
                        .build()))
                .build();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));
        when(idempotencyService.tryLock(anyString(), anyLong())).thenReturn(true);
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));
        when(productRepository.deductStockAtomic(productId, 5)).thenReturn(0);

        PaymentException ex = assertThrows(PaymentException.class, () -> orderService.createOrder(request, userId));
        assertTrue(ex.getMessage().contains("không đủ số lượng trong kho"));
        verify(orderRepository, never()).save(any(Order.class));
    }

    @Test
    @DisplayName("UT-Order-04: cancelOrder thành công khi đơn PENDING và hoàn trả số lượng kho")
    void testCancelOrder_Success() {
        UUID orderId = UUID.randomUUID();
        OrderDetail detail = OrderDetail.builder()
                .id(UUID.randomUUID())
                .product(testProduct)
                .quantity(3)
                .unitPrice(BigDecimal.valueOf(250000))
                .totalPrice(BigDecimal.valueOf(750000))
                .build();

        Order order = Order.builder()
                .id(orderId)
                .orderCode("OD-CANCEL")
                .user(testUser)
                .status(OrderStatus.PENDING)
                .orderDetails(List.of(detail))
                .paymentMethod(PaymentMethod.COD)
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenReturn(order);

        OrderResponse response = orderService.cancelOrder(orderId, userId);

        assertNotNull(response);
        assertEquals(OrderStatus.CANCELLED, order.getStatus());
        verify(productRepository, times(1)).restoreStockAtomic(productId, 3);
        verify(orderRepository, times(1)).save(order);
    }

    @Test
    @DisplayName("UT-Order-05: getUserOrders trả về danh sách đơn hàng của người dùng")
    void testGetUserOrders_Success() {
        Order order = Order.builder()
                .id(UUID.randomUUID())
                .orderCode("OD-HIST-01")
                .user(testUser)
                .status(OrderStatus.DELIVERED)
                .paymentMethod(PaymentMethod.COD)
                .build();

        when(orderRepository.findByUserIdOrderByCreatedAtDesc(userId)).thenReturn(List.of(order));

        List<OrderResponse> result = orderService.getUserOrders(userId);

        assertEquals(1, result.size());
        assertEquals("OD-HIST-01", result.get(0).getOrderCode());
    }
}

