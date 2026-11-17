package demo.bookingsalon.dto.response.business;

import lombok.Data;

@Data
public class PaymentLinkResponse {

    private String paymentLinkUrl;

    private String paymentLinkId;

}
