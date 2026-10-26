package demo.bookingsalon.VoucherTest;

import com.fasterxml.jackson.databind.ObjectMapper;
import demo.bookingsalon.Controller.VoucherController;
import demo.bookingsalon.Payload.DTO.VoucherDTO;
import demo.bookingsalon.Payload.Request.Business.ApplyVoucherRequest;
import demo.bookingsalon.Payload.Response.Business.ApplyVoucherResponse;
import demo.bookingsalon.Service.BffSessionService;
import demo.bookingsalon.Service.VoucherService;
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
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(VoucherController.class)
@AutoConfigureMockMvc(addFilters = false)
public class VoucherControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private VoucherService voucherService;

    @MockitoBean
    private BffSessionService bffSessionService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    @DisplayName("IT-Voucher-01: GET /api/vouchers/available trả về danh sách voucher khả dụng")
    void testGetAvailableVouchers_Success() throws Exception {
        VoucherDTO voucher = VoucherDTO.builder()
                .id(UUID.randomUUID())
                .voucherCode("DISCOUNT10")
                .voucherName("Giảm 10%")
                .discountType("PERCENT")
                .discountValue(BigDecimal.valueOf(10))
                .build();

        when(voucherService.getAvailableVouchers(any())).thenReturn(List.of(voucher));

        mockMvc.perform(get("/api/vouchers/available"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].voucherCode").value("DISCOUNT10"));
    }

    @Test
    @DisplayName("IT-Voucher-02: POST /api/vouchers/apply áp dụng voucher thành công trả về số tiền giảm")
    void testApplyVoucher_Success() throws Exception {
        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .voucherCode("DISCOUNT10")
                .orderAmount(BigDecimal.valueOf(200000))
                .build();

        ApplyVoucherResponse response = ApplyVoucherResponse.builder()
                .valid(true)
                .voucherCode("DISCOUNT10")
                .originalAmount(BigDecimal.valueOf(200000))
                .discountAmount(BigDecimal.valueOf(20000))
                .finalAmount(BigDecimal.valueOf(180000))
                .message("Áp dụng mã thành công!")
                .build();

        when(voucherService.validateAndCalculate(any(ApplyVoucherRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/vouchers/apply")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valid").value(true))
                .andExpect(jsonPath("$.discountAmount").value(20000))
                .andExpect(jsonPath("$.finalAmount").value(180000));
    }
}

