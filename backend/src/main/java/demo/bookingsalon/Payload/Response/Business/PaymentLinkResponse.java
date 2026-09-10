package demo.bookingsalon.Payload.Response.Business;

import lombok.Data;

@Data
public class PaymentLinkResponse {

    private String paymentLinkUrl;

    private String paymentLinkId;

}
