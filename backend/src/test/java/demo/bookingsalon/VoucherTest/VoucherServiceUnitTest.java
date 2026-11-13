package demo.bookingsalon.VoucherTest;

import demo.bookingsalon.Entity.Voucher;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Payload.DTO.VoucherDTO;
import demo.bookingsalon.Payload.Request.Business.ApplyVoucherRequest;
import demo.bookingsalon.Payload.Request.Business.CreateVoucherRequest;
import demo.bookingsalon.Payload.Response.Business.ApplyVoucherResponse;
import demo.bookingsalon.Repository.UserRepository;
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
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class VoucherServiceUnitTest {

    @Mock
    private VoucherRepository voucherRepository;

    @Mock
    private UserVoucherRepository userVoucherRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private VoucherService voucherService;

    private UUID voucherId;
    private Voucher testVoucher;

    @BeforeEach
    void setUp() {
        voucherId = UUID.randomUUID();
        testVoucher = Voucher.builder()
                .id(voucherId)
                .voucherCode("DISCOUNT20")
                .voucherName("Giam 20%")
                .discountType("PERCENT")
                .discountValue(BigDecimal.valueOf(20))
                .maxDiscountAmount(BigDecimal.valueOf(50000))
                .minOrderAmount(BigDecimal.valueOf(100000))
                .usageLimitTotal(100)
                .usedCount(5)
                .isActive(true)
                .isDeleted(false)
                .startDate(LocalDateTime.now().minusDays(1))
                .endDate(LocalDateTime.now().plusDays(10))
                .build();
    }

    @Test
    @DisplayName("UT-Voucher-01: createVoucher thành công khi mã voucher chưa tồn tại")
    void testCreateVoucher_Success() {
        CreateVoucherRequest request = CreateVoucherRequest.builder()
                .voucherCode("NEWVOUCHER")
                .voucherName("Voucher Mới")
                .discountType("FIXED_AMOUNT")
                .discountValue(BigDecimal.valueOf(50000))
                .minOrderAmount(BigDecimal.valueOf(200000))
                .build();

        when(voucherRepository.findByVoucherCodeAndIsDeletedFalse("NEWVOUCHER")).thenReturn(Optional.empty());
        when(voucherRepository.save(any(Voucher.class))).thenAnswer(invocation -> invocation.getArgument(0));

        VoucherDTO result = voucherService.createVoucher(request);

        assertNotNull(result);
        assertEquals("NEWVOUCHER", result.getVoucherCode());
        assertEquals("FIXED_AMOUNT", result.getDiscountType());
        verify(voucherRepository, times(1)).save(any(Voucher.class));
    }

    @Test
    @DisplayName("UT-Voucher-02: createVoucher ném IllegalArgumentException khi mã đã tồn tại")
    void testCreateVoucher_CodeExists_ThrowsException() {
        CreateVoucherRequest request = CreateVoucherRequest.builder()
                .voucherCode("DISCOUNT20")
                .voucherName("Trung lap")
                .discountType("PERCENT")
                .discountValue(BigDecimal.valueOf(10))
                .build();

        when(voucherRepository.findByVoucherCodeAndIsDeletedFalse("DISCOUNT20")).thenReturn(Optional.of(testVoucher));

        assertThrows(IllegalArgumentException.class, () -> voucherService.createVoucher(request));
        verify(voucherRepository, never()).save(any(Voucher.class));
    }

    @Test
    @DisplayName("UT-Voucher-03: deleteVoucher đánh dấu xóa mềm thành công")
    void testDeleteVoucher_Success() {
        when(voucherRepository.findById(voucherId)).thenReturn(Optional.of(testVoucher));

        voucherService.deleteVoucher(voucherId);

        assertTrue(testVoucher.getIsDeleted());
        assertFalse(testVoucher.getIsActive());
        verify(voucherRepository, times(1)).save(testVoucher);
    }

    @Test
    @DisplayName("UT-Voucher-04: validateAndCalculate tính giảm giá PERCENT có chặn maxDiscount")
    void testValidateAndCalculate_PercentWithMaxDiscount_Success() {
        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .voucherCode("DISCOUNT20")
                .orderAmount(BigDecimal.valueOf(500000)) // 20% = 100k > max 50k
                .build();

        when(voucherRepository.findByVoucherCodeAndIsDeletedFalse("DISCOUNT20")).thenReturn(Optional.of(testVoucher));

        ApplyVoucherResponse response = voucherService.validateAndCalculate(request);

        assertTrue(response.isValid());
        assertEquals(0, BigDecimal.valueOf(50000).compareTo(response.getDiscountAmount()));
        assertEquals(0, BigDecimal.valueOf(450000).compareTo(response.getFinalAmount()));
    }

    @Test
    @DisplayName("UT-Voucher-05: validateAndCalculate trả về không hợp lệ khi đơn hàng dưới minOrderAmount")
    void testValidateAndCalculate_BelowMinOrderAmount_ReturnsInvalid() {
        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .voucherCode("DISCOUNT20")
                .orderAmount(BigDecimal.valueOf(80000)) // minOrder = 100k
                .build();

        when(voucherRepository.findByVoucherCodeAndIsDeletedFalse("DISCOUNT20")).thenReturn(Optional.of(testVoucher));

        ApplyVoucherResponse response = voucherService.validateAndCalculate(request);

        assertFalse(response.isValid());
        assertTrue(response.getMessage().contains("tối thiểu"));
        assertEquals(BigDecimal.ZERO, response.getDiscountAmount());
    }

    @Test
    @DisplayName("UT-Voucher-06: validateAndCalculate trả về không hợp lệ khi voucher hết hạn")
    void testValidateAndCalculate_Expired_ReturnsInvalid() {
        testVoucher.setEndDate(LocalDateTime.now().minusDays(1));
        ApplyVoucherRequest request = ApplyVoucherRequest.builder()
                .voucherCode("DISCOUNT20")
                .orderAmount(BigDecimal.valueOf(200000))
                .build();

        when(voucherRepository.findByVoucherCodeAndIsDeletedFalse("DISCOUNT20")).thenReturn(Optional.of(testVoucher));

        ApplyVoucherResponse response = voucherService.validateAndCalculate(request);

        assertFalse(response.isValid());
        assertTrue(response.getMessage().contains("đã hết hạn"));
    }
}
