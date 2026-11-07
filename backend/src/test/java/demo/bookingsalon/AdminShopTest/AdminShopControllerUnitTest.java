package demo.bookingsalon.AdminShopTest;

import demo.bookingsalon.Controller.AdminShopController;
import demo.bookingsalon.Entity.Order;
import demo.bookingsalon.Entity.OrderDetail;
import demo.bookingsalon.Entity.Product;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Enum.OrderStatus;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Payload.Response.Business.OrderResponse;
import demo.bookingsalon.Repository.OrderDetailRepository;
import demo.bookingsalon.Repository.OrderRepository;
import demo.bookingsalon.Repository.ProductCategoryRepository;
import demo.bookingsalon.Repository.ProductRepository;
import demo.bookingsalon.Service.NotificationService;
import demo.bookingsalon.Service.OrderService;
import demo.bookingsalon.Service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;

import java.math.BigDecimal;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class AdminShopControllerUnitTest {

    @Mock
    private ProductRepository productRepository;
    @Mock
    private ProductCategoryRepository productCategoryRepository;
    @Mock
    private ProductService productService;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private OrderDetailRepository orderDetailRepository;
    @Mock
    private OrderService orderService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private NotificationWebSocketHandler notificationWebSocketHandler;

    @InjectMocks
    private AdminShopController adminShopController;

    private UUID orderId;
    private Order testOrder;
    private User testUser;
    private OrderResponse mockOrderResponse;

    @BeforeEach
    void setUp() {
        orderId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        testUser = new User();
        testUser.setId(userId);
        testUser.setFullName("Nguyen Van Test");

        testOrder = new Order();
        testOrder.setId(orderId);
        testOrder.setOrderCode("BB-ORD-20261010-001");
        testOrder.setUser(testUser);
        testOrder.setStatus(OrderStatus.SHIPPING);
        testOrder.setPaymentStatus(PaymentStatus.PENDING);
        testOrder.setTotalAmount(new BigDecimal("500000"));
        testOrder.setFinalAmount(new BigDecimal("450000"));

        mockOrderResponse = OrderResponse.builder()
                .id(orderId)
                .orderCode("BB-ORD-20261010-001")
                .status(OrderStatus.DELIVERED)
                .paymentStatus(PaymentStatus.SUCCESS)
                .totalAmount(new BigDecimal("500000"))
                .finalAmount(new BigDecimal("450000"))
                .build();
    }

    @Test
    @DisplayName("TC-01: Admin xác nhận Đã giao (DELIVERED) -> Trạng thái cập nhật DELIVERED và thanh toán SUCCESS")
    void testUpdateOrderStatus_ToDelivered_ShouldSetPaymentStatusSuccessAndSendNotifications() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        when(orderService.mapToOrderResponse(any(Order.class))).thenReturn(mockOrderResponse);

        ResponseEntity<OrderResponse> response = adminShopController.updateOrderStatus(orderId, "DELIVERED", null);

        assertNotNull(response);
        assertEquals(200, response.getStatusCode().value());
        assertEquals(OrderStatus.DELIVERED, testOrder.getStatus());
        assertEquals(PaymentStatus.SUCCESS, testOrder.getPaymentStatus());

        verify(orderRepository).save(testOrder);
        verify(notificationService).notifyOrderDelivered(eq(testUser.getId()), eq("BB-ORD-20261010-001"));
        verify(notificationWebSocketHandler, atLeastOnce()).sendToUser(eq(testUser.getId()), any());
    }

    @Test
    @DisplayName("TC-02: Cập nhật đơn hàng sang Đang giao (SHIPPING) -> Trạng thái đổi thành SHIPPING")
    void testUpdateOrderStatus_ToShipping_ShouldUpdateStatus() {
        testOrder.setStatus(OrderStatus.CONFIRMED);
        when(orderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse shippingResponse = OrderResponse.builder()
                .id(orderId)
                .status(OrderStatus.SHIPPING)
                .build();
        when(orderService.mapToOrderResponse(any(Order.class))).thenReturn(shippingResponse);

        ResponseEntity<OrderResponse> response = adminShopController.updateOrderStatus(orderId, "SHIPPING", null);

        assertNotNull(response);
        assertEquals(OrderStatus.SHIPPING, testOrder.getStatus());
        verify(orderRepository).save(testOrder);
    }

    @Test
    @DisplayName("TC-03: Admin Hủy đơn hàng (CANCELLED) -> Hoàn lại tồn kho cho sản phẩm atomic")
    void testUpdateOrderStatus_ToCancelled_ShouldRestoreInventory() {
        testOrder.setStatus(OrderStatus.CONFIRMED);

        UUID prodId = UUID.randomUUID();
        Product product = new Product();
        product.setId(prodId);

        OrderDetail detail = new OrderDetail();
        detail.setProduct(product);
        detail.setQuantity(2);
        testOrder.setOrderDetails(List.of(detail));

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        OrderResponse cancelledResponse = OrderResponse.builder()
                .id(orderId)
                .status(OrderStatus.CANCELLED)
                .build();
        when(orderService.mapToOrderResponse(any(Order.class))).thenReturn(cancelledResponse);

        ResponseEntity<OrderResponse> response = adminShopController.updateOrderStatus(orderId, "CANCELLED", null);

        assertEquals(OrderStatus.CANCELLED, testOrder.getStatus());
        verify(productRepository).restoreStockAtomic(prodId, 2);
        verify(notificationWebSocketHandler).sendToUser(eq(testUser.getId()), argThat((Object payload) -> {
            if (payload instanceof Map<?, ?> map) {
                return "ORDER_CANCELLED".equals(map.get("type"));
            }
            return false;
        }));
    }

    @Test
    @DisplayName("TC-04: Thống kê shop getProductStats tính đúng doanh thu từ các đơn DELIVERED hoặc đã thanh toán")
    void testGetProductStats_ShouldIncludeDeliveredAndPaidOrders() {
        Product p1 = new Product();
        p1.setId(UUID.randomUUID());
        p1.setName("Sáp vuốt tóc");
        p1.setPrice(new BigDecimal("150000"));
        p1.setStockQuantity(20);
        p1.setActive(true);
        p1.setSoldCount(10);

        Product p2 = new Product();
        p2.setId(UUID.randomUUID());
        p2.setName("Dầu gội");
        p2.setPrice(new BigDecimal("200000"));
        p2.setStockQuantity(0);
        p2.setActive(true);
        p2.setSoldCount(5);

        when(productRepository.findAll()).thenReturn(List.of(p1, p2));

        Order deliveredOrder = new Order();
        deliveredOrder.setStatus(OrderStatus.DELIVERED);
        deliveredOrder.setPaymentStatus(PaymentStatus.SUCCESS);
        deliveredOrder.setFinalAmount(new BigDecimal("300000"));

        Order paidShippingOrder = new Order();
        paidShippingOrder.setStatus(OrderStatus.SHIPPING);
        paidShippingOrder.setPaymentStatus(PaymentStatus.SUCCESS);
        paidShippingOrder.setFinalAmount(new BigDecimal("200000"));

        Order pendingCodOrder = new Order();
        pendingCodOrder.setStatus(OrderStatus.PENDING);
        pendingCodOrder.setPaymentStatus(PaymentStatus.PENDING);
        pendingCodOrder.setFinalAmount(new BigDecimal("400000"));

        when(orderRepository.findAll()).thenReturn(List.of(deliveredOrder, paidShippingOrder, pendingCodOrder));

        ResponseEntity<Map<String, Object>> response = adminShopController.getProductStats();

        assertNotNull(response.getBody());
        Map<String, Object> stats = response.getBody();
        assertEquals(2L, stats.get("total"));
        assertEquals(2L, stats.get("active"));
        assertEquals(1L, stats.get("outOfStock"));
        // Tổng doanh thu tính từ đơn DELIVERED (300k) + đơn PAID SHIPPING (200k) = 500k
        assertEquals(new BigDecimal("500000"), stats.get("totalRevenue"));
    }

    @Test
    @DisplayName("TC-05: Cập nhật đơn không tồn tại -> Ném NotFoundException")
    void testUpdateOrderStatus_OrderNotFound_ShouldThrowException() {
        when(orderRepository.findById(orderId)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () ->
                adminShopController.updateOrderStatus(orderId, "DELIVERED", null)
        );
    }
}

