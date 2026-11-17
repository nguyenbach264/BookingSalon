package demo.bookingsalon.mapper;

import demo.bookingsalon.entity.Payment;
import demo.bookingsalon.entity.PaymentTransaction;
import demo.bookingsalon.dto.response.business.PaymentResponse;
import demo.bookingsalon.dto.response.business.PaymentTransactionResponse;
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
