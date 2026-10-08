package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.Payment;
import demo.bookingsalon.Entity.PaymentTransaction;
import demo.bookingsalon.Enum.PaymentMethod;
import demo.bookingsalon.Enum.PaymentStatus;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Exception.PaymentException;
import demo.bookingsalon.Factory.PaymentFactory;
import demo.bookingsalon.Mapper.PaymentMapper;
import demo.bookingsalon.Mapper.SalonMapper;
import demo.bookingsalon.Mapper.UserMapper;
import demo.bookingsalon.Payload.DTO.SalonDTO;
import demo.bookingsalon.Payload.Request.Business.CreatePaymentRequest;
import demo.bookingsalon.Payload.Response.Business.BookingResponse;
import demo.bookingsalon.Payload.Response.Business.PaymentResponse;
import demo.bookingsalon.Payload.Response.Business.UserResponse;
import demo.bookingsalon.Repository.PaymentRepository;
import demo.bookingsalon.Repository.BookingRepository;
import demo.bookingsalon.Strategy.PaymentStrategy;
import demo.bookingsalon.Utility.IdempotencyService;
import demo.bookingsalon.Utility.PaymentInitiatedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class PaymentApplicationService {
    private final PaymentPersistenceService paymentPersistenceService;
    private final BookingService bookingService;
    private final BookingRepository bookingRepository;
    private final PaymentFactory paymentFactory;
    private final UserService userService;
    private final UserMapper userMapper;
    private final SalonService salonService;
    private final SalonMapper salonMapper;
    private final IdempotencyService idempotencyService;
    private final PaymentRepository paymentRepository;
    private final PaymentMapper paymentMapper;
    private final ApplicationEventPublisher applicationEventPublisher;

    public List<PaymentResponse> getPayments() {
        return paymentRepository.findAll().stream().map(
                paymentMapper::toPaymentResponse
        ).toList();
    }

    @Transactional
    public PaymentResponse checkout(CreatePaymentRequest request) {
        log.info("Starting checkout process for appointment: {} via {}", request.getBookingId(), request.getPaymentMethod());

        BookingResponse bookingResponse = bookingService.getBookingById(request.getBookingId());
        if (bookingResponse == null) throw new NotFoundException("Booking not found. Fail to create Payment");
        // Do not map the DTO back to Booking: it omits the @Version field and creates a detached entity.
        Payment payment = null;
        var booking = bookingRepository.findById(bookingResponse.getId())
                .orElseThrow(() -> new NotFoundException("Booking not found. Fail to create Payment"));

        // Key: userId-bookingId — 1 booking chỉ tạo 1 payment
        String idemKey = bookingResponse.getUserId() + "-" + bookingResponse.getId();
        if (!idempotencyService.tryLock(idemKey, 300)) {
            log.warn("Duplicate payment request for booking: {}", bookingResponse.getId());
            Payment existingPayment = paymentRepository.findByBookingId(bookingResponse.getId())
                    .orElseThrow(() -> new NotFoundException("Idempotent conflict but payment not found"));
            return paymentMapper.toPaymentResponse(existingPayment);
        }

        try {
            UserResponse user = userService.getUserInDbById(bookingResponse.getUserId());
            if (user == null) throw new NotFoundException("User not found. Fail to create Payment");

            SalonDTO salonDTO = salonService.getSalonById(bookingResponse.getSalonId());
            if (salonDTO == null) throw new NotFoundException("Salon not found. Fail to create Payment");

            payment = Payment.builder()
                    .paymentCode(generatePaymentCode())
                    .booking(booking)
                    .salon(salonMapper.toSalon(salonDTO))
                    .user(userMapper.toUserByUserReponse(user))
                    .amount(bookingResponse.getTotalAmount())
                    .paymentMethod(request.getPaymentMethod())
                    .transactions(new ArrayList<>())
                    .version(1)
                    .status(PaymentStatus.PENDING)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
            payment = paymentPersistenceService.createPayment(payment);

            if (request.getPaymentMethod() == PaymentMethod.COD) {
                PaymentStrategy paymentStrategy = paymentFactory.getStrategy(PaymentMethod.COD);
                CreatePaymentRequest createPaymentRequest = new CreatePaymentRequest();
                createPaymentRequest.setBookingId(bookingResponse.getId());
                createPaymentRequest.setPaymentMethod(request.getPaymentMethod());
                PaymentTransaction paymentTransaction = paymentStrategy.generatePayment(payment, createPaymentRequest);
                payment.getTransactions().add(paymentTransaction);
                payment.transitionTo(PaymentStatus.PROCESSING);
                paymentRepository.save(payment);
                log.info("COD payment created and processed: {}", payment.getPaymentCode());
            } else if (request.getPaymentMethod() == PaymentMethod.VNPAY) {
                // The client needs the VNPay URL and QR code in this response, so generate them before returning.
                PaymentStrategy paymentStrategy = paymentFactory.getStrategy(PaymentMethod.VNPAY);
                PaymentTransaction paymentTransaction = paymentStrategy.generatePayment(payment, request);
                payment.getTransactions().add(paymentTransaction);
                payment.transitionTo(PaymentStatus.PROCESSING);
                payment = paymentRepository.save(payment);
                log.info("VNPay payment URL generated: {}", payment.getPaymentCode());
            } else if (request.getPaymentMethod() == PaymentMethod.BANK_TRANSFER) {
                PaymentStrategy paymentStrategy = paymentFactory.getStrategy(PaymentMethod.BANK_TRANSFER);
                PaymentTransaction paymentTransaction = paymentStrategy.generatePayment(payment, request);
                payment.getTransactions().add(paymentTransaction);
                payment.transitionTo(PaymentStatus.PROCESSING);
                paymentRepository.save(payment);
                log.info("Sepay payment URL generated: {}", payment.getPaymentCode());
            } else {
                applicationEventPublisher.publishEvent(new PaymentInitiatedEvent(payment.getId()));
                log.info("Payment created, async processing scheduled: {}", payment.getPaymentCode());
            }

            return paymentMapper.toPaymentResponse(payment);
        } catch (RuntimeException ex) {
            // Nếu persist payment failed thì release redis lock — cho phép retry
            if (paymentRepository.findByBookingId(bookingResponse.getId()).isEmpty()) {
                idempotencyService.release(idemKey);
                log.warn("Checkout failed before payment persisted, released idempotency lock: {}", idemKey);
            }
            throw ex;
        }
    }

    public String deletePayment(UUID id) {
        paymentRepository.deleteById(id);
        return "Delete payment successfully!!!";
    }

    public String deleteByBookingId(UUID bookingId) {
        Payment payment = paymentRepository.findByBookingId(bookingId).orElseThrow(() ->
                new NotFoundException("Delete payment failed! Booking not found!"));
        paymentRepository.delete(payment);
        return "Delete payment successfully!!!";
    }

    @Transactional(readOnly = true)
    public PaymentResponse getStatus(String paymentCode) {
        Payment payment = paymentRepository.findByPaymentCode(paymentCode)
                .orElseThrow(() -> new PaymentException("Payment not found"));
        return paymentMapper.toPaymentResponse(payment);
    }

    private String generatePaymentCode() {
        return "PAY" + System.currentTimeMillis() + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }
}
