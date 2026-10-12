package demo.bookingsalon.AdminShopTest;

import com.fasterxml.jackson.databind.ObjectMapper;
import demo.bookingsalon.Controller.AdminShopController;
import demo.bookingsalon.Entity.Order;
import demo.bookingsalon.Entity.Product;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Enum.OrderStatus;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Payload.Response.Business.OrderResponse;
import demo.bookingsalon.Repository.OrderDetailRepository;
import demo.bookingsalon.Repository.OrderRepository;
import demo.bookingsalon.Repository.ProductCategoryRepository;
import demo.bookingsalon.Repository.ProductRepository;
import demo.bookingsalon.Service.NotificationService;
import demo.bookingsalon.Service.OrderService;
import demo.bookingsalon.Service.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AdminShopController.class)
@AutoConfigureMockMvc(addFilters = false)
public class AdminShopIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ProductRepository productRepository;
    @MockitoBean
    private ProductCategoryRepository productCategoryRepository;
    @MockitoBean
    private ProductService productService;
    @MockitoBean
    private OrderRepository orderRepository;
    @MockitoBean
    private OrderDetailRepository orderDetailRepository;
    @MockitoBean
    private OrderService orderService;
    @MockitoBean
    private NotificationService notificationService;
    @MockitoBean
    private NotificationWebSocketHandler notificationWebSocketHandler;
    @MockitoBean
    private demo.bookingsalon.Configuration.WebSocketAuthInterceptor webSocketAuthInterceptor;
    @MockitoBean
    private JwtDecoder jwtDecoder;
    @MockitoBean
    private org.springframework.transaction.PlatformTransactionManager transactionManager;

    @Test
    @DisplayName("IT-Shop-01: PUT /api/admin/orders/{id}/status với status=DELIVERED -> Trả về 200 và OrderResponse")
    void testUpdateOrderStatus_Delivered_Endpoint() throws Exception {
        UUID orderId = UUID.randomUUID();
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setFullName("Nguyen Van A");

        Order order = new Order();
        order.setId(orderId);
        order.setOrderCode("BB-ORD-999");
        order.setUser(user);
        order.setStatus(OrderStatus.SHIPPING);
        order.setPaymentStatus(PaymentStatus.PENDING);

        OrderResponse responseDto = OrderResponse.builder()
                .id(orderId)
                .orderCode("BB-ORD-999")
                .status(OrderStatus.DELIVERED)
                .paymentStatus(PaymentStatus.SUCCESS)
                .totalAmount(new BigDecimal("350000"))
                .finalAmount(new BigDecimal("350000"))
                .build();

        when(orderRepository.findById(orderId)).thenReturn(Optional.of(order));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));
        when(orderService.mapToOrderResponse(any(Order.class))).thenReturn(responseDto);

        mockMvc.perform(put("/api/admin/orders/{id}/status", orderId)
                        .param("status", "DELIVERED")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderCode").value("BB-ORD-999"))
                .andExpect(jsonPath("$.status").value("DELIVERED"))
                .andExpect(jsonPath("$.paymentStatus").value("SUCCESS"));
    }

    @Test
    @DisplayName("IT-Shop-02: PUT /api/admin/orders/{id}/status với đơn hàng không tồn tại -> Trả về 404")
    void testUpdateOrderStatus_NotFound_Endpoint() throws Exception {
        UUID nonExistentId = UUID.randomUUID();
        when(orderRepository.findById(nonExistentId)).thenReturn(Optional.empty());

        mockMvc.perform(put("/api/admin/orders/{id}/status", nonExistentId)
                        .param("status", "DELIVERED")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("IT-Shop-03: GET /api/admin/products/stats -> Trả về 200 và thống kê đầy đủ KPI")
    void testGetProductStats_Endpoint() throws Exception {
        Product p = new Product();
        p.setId(UUID.randomUUID());
        p.setName("Sáp vuốt tóc cao cấp");
        p.setPrice(new BigDecimal("200000"));
        p.setActive(true);
        p.setStockQuantity(15);
        p.setSoldCount(10);

        Order delivered = new Order();
        delivered.setStatus(OrderStatus.DELIVERED);
        delivered.setPaymentStatus(PaymentStatus.SUCCESS);
        delivered.setFinalAmount(new BigDecimal("400000"));

        when(productRepository.findAll()).thenReturn(List.of(p));
        when(orderRepository.findAll()).thenReturn(List.of(delivered));

        mockMvc.perform(get("/api/admin/products/stats")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.active").value(1))
                .andExpect(jsonPath("$.outOfStock").value(0))
                .andExpect(jsonPath("$.totalRevenue").value(400000));
    }
}

