package demo.bookingsalon.Payload.Request.Business;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
public class SepayPaymentRequest {
    @JsonProperty("merchant")
    private String merchantId;

    @JsonProperty("currency")
    private String currency;

    @JsonProperty("order_amount")
    private String orderAmount;

    @JsonProperty("order_description")
    private String orderDescription;

    @JsonProperty("order_invoice_number")
    private String orderInvoiceNumber;

    @JsonProperty("success_url")
    private String successUrl;

    @JsonProperty("error_url")
    private String errorUrl;

    @JsonProperty("cancel_url")
    private String cancelUrl;
}