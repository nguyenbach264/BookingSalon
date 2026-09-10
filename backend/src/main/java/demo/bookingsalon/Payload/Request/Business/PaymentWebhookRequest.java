package demo.bookingsalon.Payload.Request.Business;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PaymentWebhookRequest {
    // VNPay callback parameters
    private String vnp_Amount;           // Số tiền (đã nhân 100)
    private String vnp_BankCode;         // Mã ngân hàng
    private String vnp_BankTranNo;       // Mã giao dịch ngân hàng
    private String vnp_CardType;         // Loại thẻ
    private String vnp_OrderInfo;        // Thông tin đơn hàng
    private String vnp_PayDate;          // Ngày thanh toán (yyyyMMddHHmmss)
    private String vnp_ResponseCode;     // Mã phản hồi (00 = thành công)
    private String vnp_TmnCode;          // Mã website
    private String vnp_TransactionNo;    // Mã giao dịch VNPay
    private String vnp_TransactionStatus;// Trạng thái giao dịch
    private String vnp_TxnRef;           // Mã tham chiếu từ merchant
    private String vnp_SecureHash;       // Chữ ký bảo mật
    private String vnp_SecureHashType;   // Loại hash (SHA256)
}
