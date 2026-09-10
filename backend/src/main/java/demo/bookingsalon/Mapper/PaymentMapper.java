package demo.bookingsalon.Mapper;

import demo.bookingsalon.Entity.Payment;
import demo.bookingsalon.Entity.PaymentTransaction;
import demo.bookingsalon.Payload.Response.Business.PaymentResponse;
import demo.bookingsalon.Payload.Response.Business.PaymentTransactionResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface PaymentMapper {

    @Mapping(target = "paymentId", source = "id")
    @Mapping(target = "bookingId", source = "booking.id")
    @Mapping(target = "salonId", source = "salon.id")
    @Mapping(target = "userId", source = "user.id")
    @Mapping(target = "paymentTransactions", source = "transactions")
    @Mapping(target = "method", source = "paymentMethod")
    @Mapping(target = "transactionRef", source = "paymentCode")
    @Mapping(target = "paymentContent", ignore = true)
    PaymentResponse toPaymentResponse(Payment payment);

    @Mapping(target = "transactionId", source = "id")
    PaymentTransactionResponse toPaymentTransactionResponse(PaymentTransaction transaction);

}
