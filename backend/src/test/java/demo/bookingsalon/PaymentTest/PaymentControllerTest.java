package demo.bookingsalon.PaymentTest;

import com.fasterxml.jackson.databind.ObjectMapper;
import demo.bookingsalon.Controller.PaymentController;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Payload.Request.Business.CreatePaymentRequest;
import demo.bookingsalon.Payload.Response.Business.PaymentResponse;
import demo.bookingsalon.Service.PaymentApplicationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

@WebMvcTest(PaymentController.class)
@AutoConfigureMockMvc(addFilters = false)
public class PaymentControllerTest {
    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private PaymentApplicationService paymentApplicationService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    private CreatePaymentRequest createPaymentRequest;
    private PaymentResponse paymentResponse;

    @BeforeEach
    void setup() {
        createPaymentRequest = CreatePaymentRequest.builder()
                .bookingId(UUID.fromString("60000000-0000-0000-0000-000000000000"))
                .amount(BigDecimal.valueOf(2005000))
                .paymentMethod(PaymentMethod.COD)
                .build();

        paymentResponse = PaymentResponse.builder()
                .paymentCode("PAY30070119")
                .status(PaymentStatus.PROCESSING)
                .build();

    }

    @Test
    void testCheckout_Success() throws Exception {
        when(paymentApplicationService.checkout(createPaymentRequest)).thenReturn(paymentResponse);

        mockMvc.perform(post("/api/v1/payments")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createPaymentRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentCode").value("PAY30070119"))
                .andExpect(jsonPath("$.status").value(PaymentStatus.PROCESSING.name()));
    }

    @Test
    void testFindPaymentByPaymentCode_Success() throws Exception {
        String paymentCode = "PAY30070811";
        paymentResponse.setPaymentCode(paymentCode);

        when(paymentApplicationService.getStatus(paymentCode)).thenReturn(paymentResponse);

        mockMvc.perform(get("/api/v1/payments/{paymentCode}/status", paymentCode)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentCode").value("PAY30070811"))
                .andExpect(jsonPath("$.status").value(PaymentStatus.PROCESSING.name()));
    }
}
