package demo.bookingsalon.PaymentTest;

import com.fasterxml.jackson.databind.ObjectMapper;
import demo.bookingsalon.Configuration.VnPayConfig;
import demo.bookingsalon.Controller.PaymentController;
import demo.bookingsalon.Repository.OrderRepository;
import demo.bookingsalon.Service.PaymentApplicationService;
import demo.bookingsalon.Service.PaymentWebhookService;
import demo.bookingsalon.Utility.VNPayUtil;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.TreeMap;

import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrlPattern;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(PaymentController.class)
@AutoConfigureMockMvc(addFilters = false)
public class PaymentWebhookIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PaymentApplicationService paymentService;

    @MockitoBean
    private PaymentWebhookService paymentWebhookService;

    @MockitoBean
    private VnPayConfig vnPayConfig;

    @MockitoBean
    private OrderRepository orderRepository;

    @MockitoBean
    private demo.bookingsalon.Configuration.WebSocketAuthInterceptor webSocketAuthInterceptor;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @MockitoBean
    private org.springframework.transaction.PlatformTransactionManager transactionManager;

    @Test
    @DisplayName("IT-VNPay-01: POST /api/v1/payments/webhook/vnpay - IPN callback hợp lệ trả về RspCode 00")
    void testVNPayWebhook_ValidIPN_Endpoint() throws Exception {
        Map<String, Object> webhookResult = Map.of(
                "RspCode", "00",
                "Message", "Order payment successful - Order set to SHIPPING"
        );
        when(paymentWebhookService.handleVNPayWebhook(anyMap())).thenReturn(webhookResult);

        mockMvc.perform(post("/api/v1/payments/webhook/vnpay")
                        .param("vnp_TxnRef", "ORD-123456")
                        .param("vnp_ResponseCode", "00")
                        .param("vnp_Amount", "25000000")
                        .contentType(MediaType.APPLICATION_FORM_URLENCODED))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.RspCode").value("00"))
                .andExpect(jsonPath("$.Message").value("Order payment successful - Order set to SHIPPING"));
    }

    @Test
    @DisplayName("IT-VNPay-02: POST /api/v1/payments/simulator/process - Giả lập thanh toán Sandbox tạo chữ ký hợp lệ và gọi webhook")
    void testSimulatorProcess_Endpoint() throws Exception {
        when(vnPayConfig.getSecretKey()).thenReturn("SANDBOX_TEST_SECRET_KEY");
        when(vnPayConfig.getTmnCode()).thenReturn("TEST_TMN");

        Map<String, Object> webhookResult = Map.of(
                "RspCode", "00",
                "Message", "Order payment successful - Order set to SHIPPING"
        );
        when(paymentWebhookService.handleVNPayWebhook(anyMap())).thenReturn(webhookResult);

        Map<String, String> payload = Map.of(
                "vnp_TxnRef", "ORD-SIMULATOR-001",
                "vnp_Amount", "50000000",
                "vnp_ResponseCode", "00",
                "vnp_BankCode", "NCB"
        );

        mockMvc.perform(post("/api/v1/payments/simulator/process")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(payload)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.responseCode").value("00"))
                .andExpect(jsonPath("$.redirectUrl").exists());
    }

    @Test
    @DisplayName("IT-VNPay-03: GET /api/v1/payments/webhook/vnpay/return - Chữ ký không hợp lệ redirect về trang kết quả với mã 97")
    void testVNPayReturn_InvalidSignature_ShouldRedirectWithError97() throws Exception {
        when(vnPayConfig.getSecretKey()).thenReturn("REAL_SECRET_KEY");

        mockMvc.perform(get("/api/v1/payments/webhook/vnpay/return")
                        .param("vnp_TxnRef", "ORD-FAKE")
                        .param("vnp_ResponseCode", "00")
                        .param("vnp_SecureHash", "invalid_tampered_hash"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrlPattern("**/payment/result?responseCode=97&error=invalid_signature"));
    }
}

