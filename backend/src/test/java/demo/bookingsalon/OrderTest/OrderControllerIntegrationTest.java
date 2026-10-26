package demo.bookingsalon.OrderTest;

import com.fasterxml.jackson.databind.ObjectMapper;
import demo.bookingsalon.Controller.OrderController;
import demo.bookingsalon.Enum.OrderStatus;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Payload.Request.Business.CreateOrderRequest;
import demo.bookingsalon.Payload.Response.Business.OrderResponse;
import demo.bookingsalon.Repository.UserRepository;
import demo.bookingsalon.Service.BffSessionService;
import demo.bookingsalon.Service.OrderService;
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
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import org.junit.jupiter.api.AfterEach;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
@AutoConfigureMockMvc(addFilters = false)
public class OrderControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private OrderService orderService;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private BffSessionService bffSessionService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    @DisplayName("IT-Order-01: POST /api/orders tạo đơn hàng thành công trả về 200 OK")
    void testCreateOrder_Success() throws Exception {
        UUID userId = UUID.randomUUID();
        CreateOrderRequest request = CreateOrderRequest.builder()
                .userId(userId)
                .receiverName("Le Van C")
                .receiverPhone("0981122334")
                .shippingAddress("456 Kim Ma, Ba Dinh, Ha Noi")
                .paymentMethod(PaymentMethod.COD)
                .items(List.of(CreateOrderRequest.OrderItemRequest.builder()
                        .productId(UUID.randomUUID())
                        .quantity(1)
                        .build()))
                .build();

        OrderResponse response = OrderResponse.builder()
                .id(UUID.randomUUID())
                .orderCode("OD-2026-MOCK")
                .status(OrderStatus.PENDING)
                .paymentMethod(PaymentMethod.COD)
                .totalAmount(BigDecimal.valueOf(250000))
                .build();

        when(orderService.createOrder(any(CreateOrderRequest.class), any())).thenReturn(response);

        mockMvc.perform(post("/api/orders")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderCode").value("OD-2026-MOCK"))
                .andExpect(jsonPath("$.status").value("PENDING"));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("IT-Order-02: GET /api/orders/user/{userId} lấy lịch sử đơn hàng trả về 200 OK")
    void testGetUserOrders_Success() throws Exception {
        UUID userId = UUID.randomUUID();
        OrderResponse order = OrderResponse.builder()
                .id(UUID.randomUUID())
                .orderCode("OD-2026-HIST")
                .status(OrderStatus.DELIVERED)
                .build();

        when(orderService.getUserOrders(userId)).thenReturn(List.of(order));

        Authentication auth = new UsernamePasswordAuthenticationToken(
                "admin", null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);

        mockMvc.perform(get("/api/orders/user/{userId}", userId)
                        .principal(auth))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].orderCode").value("OD-2026-HIST"));
    }
}
