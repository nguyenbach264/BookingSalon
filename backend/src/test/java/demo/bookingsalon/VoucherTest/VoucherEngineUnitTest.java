package demo.bookingsalon.VoucherTest;

import demo.bookingsalon.Entity.Voucher;
import demo.bookingsalon.Payload.Request.Business.ApplyVoucherRequest;
import demo.bookingsalon.Payload.Response.Business.ApplyVoucherResponse;
import demo.bookingsalon.Repository.UserVoucherRepository;
import demo.bookingsalon.Repository.VoucherRepository;
import demo.bookingsalon.Service.VoucherService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VoucherEngineUnitTest {

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private UserVoucherRepository userVoucherRepository;

    @InjectMocks
    private VoucherService voucherService;

    private Voucher percentVoucher;
    private Voucher fixedVoucher;

    @BeforeEach
    void setUp() {
        // Voucher 20% giảm tối đa 100k, áp dụng đơn từ 50k
        percentVoucher = Voucher.builder()
                .id(UUID.randomUUID())
                .voucherCode("CHAOBANMOI")
                .voucherName("Ưu đãi Bạn mới trải nghiệm")
                .discountType("PERCENT")
                .discountValue(new BigDecimal("20.00"))
                .maxDiscountAmount(new BigDecimal("100000.00"))
                .minOrderAmount(new BigDecimal("50000.00"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(30))
                .isActive(true)
                .usageLimitTotal(1000)
                .usedCount(5)
                .build();

        // Voucher giảm 50k cố định, đơn tối thiểu 150k
        fixedVoucher = Voucher.builder()
                .id(UUID.randomUUID())
                .voucherCode("SALON50K")
                .voucherName("Giảm 50K")
                .discountType("FIXED_AMOUNT")
                .discountValue(new BigDecimal("50000.00"))
                .minOrderAmount(new BigDecimal("150000.00"))
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(30))
                .isActive(true)
                .usageLimitTotal(500)
                .usedCount(10)
                .build();
    }

    @Test
    @DisplayName("TC-Voucher-01: Áp dụng voucher phần trăm (PERCENT) có giới hạn mức giảm tối đa (Cap)")
    void testApplyPercentVoucher_WithMaxDiscountCap() {
        when(voucherRepository.findByVoucherCodeAndIsDeletedFalse("CHAOBANMOI"))
                .thenReturn(Optional.of(percentVoucher));

        // Đơn 800.000đ -> 20% = 160.000đ, nhưng vượt maxDiscountAmount (100.000đ) -> chỉ giảm 100.000đ
        ApplyVoucherRequest request = new ApplyVoucherRequest();
        request.setVoucherCode("CHAOBANMOI");
        request.setOrderAmount(new BigDecimal("800000.00"));

        ApplyVoucherResponse response = voucherService.validateAndCalculate(request);

        assertNotNull(response);
        assertTrue(response.isValid(), "Voucher phải hợp lệ");
        assertEquals(new BigDecimal("100000.00"), response.getDiscountAmount(), "Mức giảm phải bị chặn ở 100.000đ");
        assertEquals(new BigDecimal("700000.00"), response.getFinalAmount(), "Số tiền sau giảm phải là 700.000đ");
    }

    @Test
    @DisplayName("TC-Voucher-02: Đơn hàng chưa đạt giá trị tối thiểu (minOrderAmount) -> Báo lỗi không hợp lệ")
    void testApplyVoucher_BelowMinOrderAmount_ShouldFail() {
        when(voucherRepository.findByVoucherCodeAndIsDeletedFalse("SALON50K"))
                .thenReturn(Optional.of(fixedVoucher));

        // Đơn 100.000đ (dưới mức tối thiểu 150.000đ)
        ApplyVoucherRequest request = new ApplyVoucherRequest();
        request.setVoucherCode("SALON50K");
        request.setOrderAmount(new BigDecimal("100000.00"));

        ApplyVoucherResponse response = voucherService.validateAndCalculate(request);

        assertNotNull(response);
        assertFalse(response.isValid(), "Voucher không được áp dụng vì chưa đạt giá trị tối thiểu");
        assertEquals(BigDecimal.ZERO, response.getDiscountAmount());
        assertTrue(response.getMessage().contains("chưa đạt giá trị tối thiểu"));
    }

    @Test
    @DisplayName("TC-Voucher-03: Voucher đã hết hạn sử dụng (Expired) -> Báo lỗi hết hạn")
    void testApplyVoucher_Expired_ShouldFail() {
        percentVoucher.setEndDate(LocalDateTime.now().minusDays(1)); // Đã hết hạn hôm qua
        when(voucherRepository.findByVoucherCodeAndIsDeletedFalse("CHAOBANMOI"))
                .thenReturn(Optional.of(percentVoucher));

        ApplyVoucherRequest request = new ApplyVoucherRequest();
        request.setVoucherCode("CHAOBANMOI");
        request.setOrderAmount(new BigDecimal("200000.00"));

        ApplyVoucherResponse response = voucherService.validateAndCalculate(request);

        assertNotNull(response);
        assertFalse(response.isValid());
        assertTrue(response.getMessage().contains("đã hết hạn"));
    }

    @Test
    @DisplayName("TC-Voucher-04: Voucher đã đạt giới hạn lượt sử dụng tối đa (Limit Reached) -> Báo lỗi")
    void testApplyVoucher_UsageLimitReached_ShouldFail() {
        fixedVoucher.setUsageLimitTotal(100);
        fixedVoucher.setUsedCount(100); // Đã hết lượt dùng
        when(voucherRepository.findByVoucherCodeAndIsDeletedFalse("SALON50K"))
                .thenReturn(Optional.of(fixedVoucher));

        ApplyVoucherRequest request = new ApplyVoucherRequest();
        request.setVoucherCode("SALON50K");
        request.setOrderAmount(new BigDecimal("300000.00"));

        ApplyVoucherResponse response = voucherService.validateAndCalculate(request);

        assertNotNull(response);
        assertFalse(response.isValid());
        assertTrue(response.getMessage().contains("giới hạn"));
    }
}

