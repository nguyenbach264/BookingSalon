package demo.bookingsalon.Payload.Response.Business;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class BankTransferResponse {
    private String bankName;

    private String accountName;

    private String accountNumber;

    private String branch;

    // Nội dung chuyển khoản
    private Object transferContent;
}
