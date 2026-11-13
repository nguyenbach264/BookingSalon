package demo.bookingsalon.PaymentTest;

import demo.bookingsalon.Configuration.VnPayConfig;
import demo.bookingsalon.Entity.Order;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Enum.OrderStatus;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Handler.NotificationWebSocketHandler;
import demo.bookingsalon.Repository.BookingRepository;
import demo.bookingsalon.Repository.OrderRepository;
import demo.bookingsalon.Repository.PaymentRepository;
import demo.bookingsalon.Repository.PaymentTransactionRepository;
import demo.bookingsalon.Service.PaymentWebhookService;
import demo.bookingsalon.Utility.VNPayUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class PaymentWebhookServiceUnitTest {

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private BookingRepository bookingRepository;
    @Mock
    private OrderRepository orderRepository;
    @Mock
    private PaymentTransactionRepository paymentTransactionRepository;
    @Mock
    private VnPayConfig vnPayConfig;
    @Mock
    private NotificationWebSocketHandler notificationWebSocketHandler;

    @InjectMocks
    private PaymentWebhookService paymentWebhookService;

    private Order testOrder;
    private User testUser;
    private Map<String, String> validParams;
    private final String secretKey = "TEST_SECRET_KEY_1234567890";

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(UUID.randomUUID());

        testOrder = new Order();
        testOrder.setId(UUID.randomUUID());
        testOrder.setOrderCode("ORD123456");
        testOrder.setUser(testUser);
        testOrder.setStatus(OrderStatus.PENDING);
        testOrder.setPaymentStatus(PaymentStatus.PENDING);

        validParams = new HashMap<>();
        validParams.put("vnp_TxnRef", "ORD123456");
        validParams.put("vnp_ResponseCode", "00");
        validParams.put("vnp_Amount", "50000000");
        validParams.put("vnp_TransactionNo", "14000123");
        validParams.put("vnp_BankCode", "NCB");
        validParams.put("vnp_PayDate", "20261010110000");

        // Tự động tạo chữ ký hợp lệ thực tế bằng VNPayUtil không cần mock static
        String secureHash = VNPayUtil.generateSignature(validParams, secretKey);
        validParams.put("vnp_SecureHash", secureHash);
    }

    @Test
    @DisplayName("TC-VNPay-01: Callback Shop Order với mã 00 -> Đơn hàng chuyển sang SHIPPING và thanh toán SUCCESS")
    void testHandleVNPayWebhook_ShopOrder_SuccessCode00_ShouldSetShippingAndSuccess() {
        when(vnPayConfig.getSecretKey()).thenReturn(secretKey);
        when(orderRepository.findByVnpayTxnRef("ORD123456")).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> response = paymentWebhookService.handleVNPayWebhook(validParams);

        assertNotNull(response);
        assertEquals("00", response.get("RspCode"));
        assertEquals(OrderStatus.SHIPPING, testOrder.getStatus());
        assertEquals(PaymentStatus.SUCCESS, testOrder.getPaymentStatus());

        verify(orderRepository).save(testOrder);
        verify(notificationWebSocketHandler).sendToUser(eq(testUser.getId()), argThat((Object payload) -> {
            if (payload instanceof Map<?, ?> map) {
                return "ORDER_SHIPPING".equals(map.get("type"));
            }
            return false;
        }));
    }

    @Test
    @DisplayName("TC-VNPay-02: Callback Shop Order với mã lỗi (vd 24 hủy) -> Đơn hàng chuyển PaymentStatus = FAILED")
    void testHandleVNPayWebhook_ShopOrder_FailureCode_ShouldSetFailed() {
        validParams.put("vnp_ResponseCode", "24");
        // Re-generate signature cho params mới
        validParams.remove("vnp_SecureHash");
        validParams.put("vnp_SecureHash", VNPayUtil.generateSignature(validParams, secretKey));

        when(vnPayConfig.getSecretKey()).thenReturn(secretKey);
        when(orderRepository.findByVnpayTxnRef("ORD123456")).thenReturn(Optional.of(testOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(i -> i.getArgument(0));

        Map<String, Object> response = paymentWebhookService.handleVNPayWebhook(validParams);

        assertNotNull(response);
        assertEquals("01", response.get("RspCode"));
        assertEquals(OrderStatus.PENDING, testOrder.getStatus());
        assertEquals(PaymentStatus.FAILED, testOrder.getPaymentStatus());

        verify(orderRepository).save(testOrder);
        verify(notificationWebSocketHandler).sendToUser(eq(testUser.getId()), argThat((Object payload) -> {
            if (payload instanceof Map<?, ?> map) {
                return "ORDER_PAYMENT_FAILED".equals(map.get("type"));
            }
            return false;
        }));
    }

    @Test
    @DisplayName("TC-VNPay-03: Callback cho đơn đã thanh toán trước đó -> Trả về Idempotent Already processed")
    void testHandleVNPayWebhook_ShopOrder_AlreadyPaid_ShouldBeIdempotent() {
        testOrder.setPaymentStatus(PaymentStatus.SUCCESS);
        when(vnPayConfig.getSecretKey()).thenReturn(secretKey);
        when(orderRepository.findByVnpayTxnRef("ORD123456")).thenReturn(Optional.of(testOrder));

        Map<String, Object> response = paymentWebhookService.handleVNPayWebhook(validParams);

        assertNotNull(response);
        assertEquals("00", response.get("RspCode"));
        assertEquals("Already processed", response.get("Message"));

        verify(orderRepository, never()).save(any());
    }

    @Test
    @DisplayName("TC-VNPay-04: Callback chữ ký không hợp lệ -> Từ chối xử lý với RspCode = 01")
    void testHandleVNPayWebhook_InvalidSignature_ShouldReject() {
        validParams.put("vnp_SecureHash", "tampered_fake_signature_hash");
        when(vnPayConfig.getSecretKey()).thenReturn(secretKey);

        Map<String, Object> response = paymentWebhookService.handleVNPayWebhook(validParams);

        assertNotNull(response);
        assertEquals("01", response.get("RspCode"));
        assertEquals("Invalid signature", response.get("Message"));

        verify(orderRepository, never()).save(any());
    }
}

