package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.*;
import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Mapper.BookingMapper;
import demo.bookingsalon.Mapper.SalonMapper;
import demo.bookingsalon.Mapper.UserMapper;
import demo.bookingsalon.Payload.DTO.SalonDTO;
import demo.bookingsalon.Payload.Request.Business.CreateBookingRequest;
import demo.bookingsalon.Payload.Response.Business.BookingResponse;
import demo.bookingsalon.Payload.Response.Business.BookingStatisticsResponse;
import demo.bookingsalon.Publisher.BookingEventPublisher;
import demo.bookingsalon.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BookingService {
    private final BookingRepository bookingRepository;
    private final BookingMapper bookingMapper;
    private final SalonMapper salonMapper;
    private final UserRepository userRepository;
    private final UserMapper userMapper;
    private final ServiceOfferingRepository offeringRepository;
    private final SalonRepository salonRepository;
    private final StylistRepository stylistRepository;
    private final BookingDetailRepository bookingDetailRepository;
    private final BookingEventPublisher bookingEventPublisher;
    private final PaymentRepository paymentRepository;
    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final VoucherService voucherService;
    private final NotificationService notificationService;
    private final demo.bookingsalon.Handler.NotificationWebSocketHandler notificationWebSocketHandler;

    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public List<BookingResponse> getBookings() {
        return bookingRepository.findAll().stream()
                .map(booking -> bookingMapper.toBookingResponse(booking))
                .sorted(Comparator.comparing(BookingResponse::getStartTime))
                .toList();
    }

    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public BookingResponse getBookingById(UUID id) {
        Booking booking = bookingRepository.findById(id).orElseThrow(() ->
                new NotFoundException("Booking not exist"));
        return bookingMapper.toBookingResponse(booking);
    }

    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public List<BookingResponse> getBookingByUserId(UUID userId) {
        return bookingRepository.getBookingByUserId(userId).stream()
                .map(booking -> bookingMapper.toBookingResponse(booking))
                .sorted(Comparator.comparing(BookingResponse::getUserId))
                .toList();
    }

    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public List<BookingResponse> getBookingBySalonId(UUID salonId) {
        return bookingRepository.getBookingBySalonId(salonId).stream()
                .map(booking -> bookingMapper.toBookingResponse(booking))
                .sorted(Comparator.comparing(BookingResponse::getSalonId))
                .toList();
    }

    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public List<BookingResponse> getBookingByDate(LocalDate date, UUID salonId) {
        List<BookingResponse> bookings = getBookingBySalonId(salonId);
        if (date == null) return bookings;

        List<BookingResponse> result = bookings.stream()
                .filter(item -> item.getStartTime().toLocalDate().equals(date))
                .toList();
        return result;
    }

    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public List<String> getBookedTimeSlotsByStylistAndDate(UUID stylistId, LocalDate date) {
        if (stylistId == null || date == null) return Collections.emptyList();
        LocalDateTime dayStart = date.atStartOfDay();
        LocalDateTime dayEnd = date.plusDays(1).atStartOfDay();
        List<Booking> bookings = bookingRepository.findActiveBookingsByStylistAndDate(stylistId, dayStart, dayEnd);

        Set<String> bookedSlots = new TreeSet<>();
        for (Booking b : bookings) {
            LocalDateTime cur = b.getStartTime();
            LocalDateTime end = b.getEndTime();
            while (cur.isBefore(end)) {
                bookedSlots.add(String.format("%02d:%02d", cur.getHour(), cur.getMinute()));
                cur = cur.plusMinutes(30);
            }
        }
        return new ArrayList<>(bookedSlots);
    }

    // Kiểm tra time slot có sẵn theo Stylist (sử dụng PESSIMISTIC lock)
    private boolean isTimeSlotAvailable(SalonDTO salonDTO,
                                        UUID stylistId,
                                        LocalDateTime bookingStartTime,
                                        LocalDateTime bookingEndTime) throws Exception {

        if (salonDTO.getOpenTime() != null && bookingStartTime.toLocalTime().isBefore(salonDTO.getOpenTime()))
            throw new Exception("Booking start time is earlier than Salon open time");
        if (salonDTO.getCloseTime() != null && bookingEndTime.toLocalTime().isAfter(salonDTO.getCloseTime()))
            throw new Exception("Booking end time is later than Salon close time");

        // Sử dụng query với PESSIMISTIC_WRITE lock để tránh race condition trên cùng stylist
        List<Booking> conflictingBookings = bookingRepository.findConflictingBookingsByStylist(
                stylistId, bookingStartTime, bookingEndTime);

        return conflictingBookings.isEmpty();
    }

    @Transactional(isolation = Isolation.SERIALIZABLE)
    @Retryable(
            retryFor = ObjectOptimisticLockingFailureException.class,
            maxAttempts = 3,
            backoff = @Backoff(delay = 100, multiplier = 2.0)
    )
    public BookingResponse createBooking(CreateBookingRequest bookingRequest) throws Exception {

        List<ServiceOffering> offeringDTOs = new ArrayList<>();
        try {
            if (bookingRequest.getServiceIds() != null && !bookingRequest.getServiceIds().isEmpty()) {
                offeringDTOs = offeringRepository.findAllById(bookingRequest.getServiceIds());
            }
        } catch (Exception e) {
            System.out.println("Service offering not found");
            e.printStackTrace();
        }
        int totalDuration = offeringDTOs.stream().mapToInt(ServiceOffering::getDuration).sum();
        if (totalDuration == 0) {
            totalDuration = 45; // Default 45 mins if not specified
        }

        LocalDateTime bookingStartTime = bookingRequest.getStartTime();
        LocalDateTime bookingEndTime = bookingStartTime.plusMinutes(totalDuration);

        Salon salon = salonRepository.findById(bookingRequest.getSalonId()).orElseThrow(() ->
                new NotFoundException("Salon not found"));

        SalonDTO salonDTO = new SalonDTO();
        try {
            salonDTO = salonMapper.toSalonDTO(salon);
        } catch (Exception e) {
            e.printStackTrace();
        }

        // Kiểm tra time slot availability với pessimistic lock trên stylist
        boolean isAvailable = isTimeSlotAvailable(salonDTO, bookingRequest.getStylistId(), bookingStartTime, bookingEndTime);

        if (!isAvailable)
            throw new Exception("Stylist đã có lịch hẹn trong khung giờ này. Vui lòng chọn khung giờ khác.");

        BigDecimal totalPrice = offeringDTOs.stream().map(ServiceOffering::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Xử lý áp dụng Voucher nếu có
        BigDecimal discount = BigDecimal.ZERO;
        String appliedVoucherCode = null;
        if (bookingRequest.getVoucherCode() != null && !bookingRequest.getVoucherCode().trim().isEmpty()) {
            String code = bookingRequest.getVoucherCode().trim().toUpperCase();
            Optional<Voucher> voucherOpt = voucherRepository.findByVoucherCodeAndIsDeletedFalse(code);
            if (voucherOpt.isPresent()) {
                Voucher voucher = voucherOpt.get();
                if (Boolean.TRUE.equals(voucher.getIsActive())) {
                    discount = voucherService.calculateDiscountAmount(voucher, totalPrice);
                    appliedVoucherCode = voucher.getVoucherCode();
                    voucher.setUsedCount((voucher.getUsedCount() == null ? 0 : voucher.getUsedCount()) + 1);
                    voucherRepository.save(voucher);

                    // Đánh dấu đã dùng nếu voucher này nằm trong ví cá nhân của user
                    if (bookingRequest.getUserId() != null) {
                        userVoucherRepository.findByUser_IdAndVoucher_VoucherCodeAndIsUsedFalse(bookingRequest.getUserId(), code)
                                .ifPresent(uv -> {
                                    uv.setIsUsed(true);
                                    uv.setUsedAt(LocalDateTime.now());
                                    userVoucherRepository.save(uv);
                                });
                    }
                }
            }
        }
        BigDecimal finalTotal = totalPrice.subtract(discount).max(BigDecimal.ZERO);

        User user = userRepository.findById(bookingRequest.getUserId()).orElseThrow(() ->
                new NotFoundException("User not found"));

        Stylist stylist = stylistRepository.findById(bookingRequest.getStylistId()).orElseThrow(() ->
                new NotFoundException("Stylist not found"));

        String bookingCode = "BB-" + LocalDateTime.now().getYear() + "-" + UUID.randomUUID().toString().replace("-","").substring(0, 8).toUpperCase();
        String paymentMethodStr = bookingRequest.getPaymentMethod() != null ? bookingRequest.getPaymentMethod().toUpperCase() : "CASH";
        String paymentStatusStr = "BANK_TRANSFER".equals(paymentMethodStr) ? "PAID" : "UNPAID";

        Booking booking = Booking.builder()
                .bookingCode(bookingCode)
                .customerName(bookingRequest.getCustomerName() != null ? bookingRequest.getCustomerName() : (user.getFullName() != null ? user.getFullName() : user.getUsername()))
                .customerPhone(bookingRequest.getCustomerPhone() != null ? bookingRequest.getCustomerPhone() : user.getPhoneNumber())
                .customerEmail(bookingRequest.getCustomerEmail() != null ? bookingRequest.getCustomerEmail() : user.getEmail())
                .customerNotes(bookingRequest.getCustomerNotes())
                .startTime(bookingStartTime)
                .endTime(bookingEndTime)
                .status(BookingStatus.PENDING)
                .salon(salon)
                .subtotalAmount(totalPrice)
                .discountAmount(discount)
                .voucherCode(appliedVoucherCode)
                .totalAmount(finalTotal)
                .paymentMethod(paymentMethodStr)
                .paymentStatus(paymentStatusStr)
                .user(user)
                .stylist(stylist)
                .build();
        booking = bookingRepository.save(booking);

        final Booking savedBooking = booking;
        List<BookingDetail> bookingDetails = offeringDTOs.stream()
                .map(service -> (BookingDetail) BookingDetail.builder()
                        .booking(savedBooking)
                        .serviceOffering(service)
                        .currentPrice(service.getPrice())
                        .build())
                .toList();

        bookingDetailRepository.saveAll(bookingDetails);
        booking.setBookingDetails(bookingDetails);

        // Tạo bản ghi Payment giả lập
        demo.bookingsalon.Enum.PaymentMethod methodEnum = demo.bookingsalon.Enum.PaymentMethod.COD;
        if ("BANK_TRANSFER".equals(paymentMethodStr)) {
            methodEnum = demo.bookingsalon.Enum.PaymentMethod.BANK_TRANSFER;
        } else if ("VNPAY".equals(paymentMethodStr)) {
            methodEnum = demo.bookingsalon.Enum.PaymentMethod.VNPAY;
        }

        Payment payment = Payment.builder()
                .paymentCode("PAY-" + UUID.randomUUID().toString().replace("-","").substring(0, 10).toUpperCase())
                .amount(finalTotal)
                .status("PAID".equals(paymentStatusStr) ? demo.bookingsalon.Enum.PaymentStatus.SUCCESS : demo.bookingsalon.Enum.PaymentStatus.PENDING)
                .paymentMethod(methodEnum)
                .user(user)
                .booking(booking)
                .salon(salon)
                .build();
        paymentRepository.save(payment);
        booking.setPayment(payment);

        // Bất đồng bộ gửi email xác nhận đơn hàng
        try {
            bookingEventPublisher.publishBookingCreatedEvent(booking, user, salon);
        } catch (Exception e) {
            System.err.println("Could not publish booking created event: " + e.getMessage());
        }

        // Tạo thông báo cho User qua WebSocket
        try {
            notificationService.notifyBookingCreated(booking);
        } catch (Exception e) {
            System.err.println("Could not create booking created notification: " + e.getMessage());
        }

        // Thông báo tức thời tới Stylist Dashboard qua WebSocket
        try {
            if (stylist != null && stylist.getId() != null) {
                Map<String, Object> wsMsg = new HashMap<>();
                wsMsg.put("type", "NEW_BOOKING");
                wsMsg.put("bookingId", booking.getId().toString());
                wsMsg.put("bookingCode", booking.getBookingCode());
                wsMsg.put("customerName", booking.getCustomerName());
                wsMsg.put("startTime", booking.getStartTime() != null ? booking.getStartTime().toString() : "");
                notificationWebSocketHandler.sendToStylist(stylist.getId(), wsMsg);
            }
        } catch (Exception e) {
            System.err.println("Could not notify stylist via WebSocket: " + e.getMessage());
        }

        return bookingMapper.toBookingResponse(booking);
    }

    //Update booking với optimistic lock
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public String updateBooking(UUID id, BookingStatus status) {
        Booking booking = bookingRepository.findByIdWithOptimisticLock(id);
        if (booking == null) {
            throw new NotFoundException("Booking not exist");
        }
        booking.setStatus(status);
        bookingRepository.save(booking);

        try {
            if (booking.getUser() != null) {
                if (status == BookingStatus.CONFIRMED) {
                    notificationService.notifyBookingConfirmed(booking);
                } else if (status == BookingStatus.COMPLETED) {
                    notificationService.notifyReviewRequest(booking);
                } else if (status == BookingStatus.CANCELLED) {
                    notificationService.notifyBookingCancelled(booking);
                } else {
                    Notification notification = Notification.builder()
                            .userId(booking.getUser().getId())
                            .salonId(booking.getSalon() != null ? booking.getSalon().getId() : null)
                            .bookingId(booking.getId())
                            .title("Cập nhật lịch hẹn")
                            .message("Lịch hẹn " + booking.getBookingCode() + " đã cập nhật trạng thái sang: " + status)
                            .type("BOOKING_UPDATE")
                            .isRead(false)
                            .createdAt(LocalDateTime.now())
                            .expiredAt(LocalDateTime.now().plusDays(14))
                            .build();
                    notificationService.createNotification(notification);
                }
            }
        } catch (Exception e) {
            System.err.println("Could not create notification on status update: " + e.getMessage());
        }

        // Báo cho Stylist Dashboard qua WebSocket
        try {
            if (booking.getStylist() != null && booking.getStylist().getId() != null) {
                Map<String, Object> wsMsg = new HashMap<>();
                wsMsg.put("type", "BOOKING_STATUS_CHANGED");
                wsMsg.put("bookingId", booking.getId().toString());
                wsMsg.put("bookingCode", booking.getBookingCode());
                wsMsg.put("status", status.name());
                notificationWebSocketHandler.sendToStylist(booking.getStylist().getId(), wsMsg);
            }
        } catch (Exception e) {
            System.err.println("Could not push stylist status update: " + e.getMessage());
        }

        return "Update booking successfully";
    }

    // soft delete
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public String cancelBooking(UUID id) {
        Booking booking = bookingRepository.findById(id).orElseThrow(() ->
                new NotFoundException("Booking not exist"));
        booking.setStatus(BookingStatus.CANCELLED);
        bookingRepository.save(booking);

        bookingEventPublisher.publishBookingCancelledEvent(booking);

        // Gửi thông báo hủy tới User và Stylist
        try {
            notificationService.notifyBookingCancelled(booking);
            if (booking.getStylist() != null && booking.getStylist().getId() != null) {
                Map<String, Object> wsMsg = new HashMap<>();
                wsMsg.put("type", "BOOKING_STATUS_CHANGED");
                wsMsg.put("bookingId", booking.getId().toString());
                wsMsg.put("bookingCode", booking.getBookingCode());
                wsMsg.put("status", "CANCELLED");
                notificationWebSocketHandler.sendToStylist(booking.getStylist().getId(), wsMsg);
            }
        } catch (Exception e) {
            System.err.println("Could not notify cancellation: " + e.getMessage());
        }

        return "Booking cancelled successfully";
    }

    // hard delete
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public String deleteBooking(UUID id) {
        Booking booking = bookingRepository.findById(id).orElseThrow(() ->
                new NotFoundException("Booking not exist"));
        bookingRepository.delete(booking);
        return "Booking deleted successfully";
    }

    // Helper method để tính thống kê
    private BookingStatisticsResponse buildStatistics(long pending, long confirmed, long completed, long cancelled) {
        return BookingStatisticsResponse.builder()
                .pending(pending)
                .confirmed(confirmed)
                .completed(completed)
                .cancelled(cancelled)
                .total(pending + confirmed + completed + cancelled)
                .build();
    }

    // Thống kê booking toàn bộ
    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public BookingStatisticsResponse getBookingStatistics() {
        return buildStatistics(
                bookingRepository.countByStatus(BookingStatus.PENDING),
                bookingRepository.countByStatus(BookingStatus.CONFIRMED),
                bookingRepository.countByStatus(BookingStatus.COMPLETED),
                bookingRepository.countByStatus(BookingStatus.CANCELLED)
        );
    }

    // Thống kê booking theo salon
    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public BookingStatisticsResponse getBookingStatisticsBySalon(UUID salonId) {
        return buildStatistics(
                bookingRepository.countByStatusAndSalonId(BookingStatus.PENDING, salonId),
                bookingRepository.countByStatusAndSalonId(BookingStatus.CONFIRMED, salonId),
                bookingRepository.countByStatusAndSalonId(BookingStatus.COMPLETED, salonId),
                bookingRepository.countByStatusAndSalonId(BookingStatus.CANCELLED, salonId)
        );
    }

    // Thống kê booking theo user
    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public BookingStatisticsResponse getBookingStatisticsByUser(UUID userId) {
        return buildStatistics(
                bookingRepository.countByStatusAndUserId(BookingStatus.PENDING, userId),
                bookingRepository.countByStatusAndUserId(BookingStatus.CONFIRMED, userId),
                bookingRepository.countByStatusAndUserId(BookingStatus.COMPLETED, userId),
                bookingRepository.countByStatusAndUserId(BookingStatus.CANCELLED, userId)
        );
    }

    // Lấy booking của user theo trạng thái (Đang xác nhận, Đã xác nhận, Đơn hàng đã đặt)
    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public List<BookingResponse> getBookingByUserIdAndStatus(UUID userId, BookingStatus status) {
        return bookingRepository.findByUserIdAndStatus(userId, status).stream()
                .map(bookingMapper::toBookingResponse)
                .sorted(Comparator.comparing(BookingResponse::getStartTime).reversed())
                .toList();
    }

    // Lấy toàn bộ booking của stylist
    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public List<BookingResponse> getBookingByStylistId(UUID stylistId) {
        return bookingRepository.findByStylistId(stylistId).stream()
                .map(bookingMapper::toBookingResponse)
                .sorted(Comparator.comparing(BookingResponse::getStartTime))
                .toList();
    }

    // Lấy booking của stylist theo 4 nhóm trạng thái (Chờ xác nhận, Lịch cắt tóc, Đã hoàn thành, Đã hủy)
    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public List<BookingResponse> getBookingByStylistIdAndStatus(UUID stylistId, BookingStatus status) {
        return bookingRepository.findByStylistIdAndStatus(stylistId, status).stream()
                .map(bookingMapper::toBookingResponse)
                .sorted(Comparator.comparing(BookingResponse::getStartTime))
                .toList();
    }

    // Thống kê booking theo 4 nhóm trạng thái cho stylist
    @Transactional(readOnly = true, isolation = Isolation.READ_COMMITTED)
    public BookingStatisticsResponse getBookingStatisticsByStylist(UUID stylistId) {
        return buildStatistics(
                bookingRepository.countByStatusAndStylistId(BookingStatus.PENDING, stylistId),
                bookingRepository.countByStatusAndStylistId(BookingStatus.CONFIRMED, stylistId),
                bookingRepository.countByStatusAndStylistId(BookingStatus.COMPLETED, stylistId),
                bookingRepository.countByStatusAndStylistId(BookingStatus.CANCELLED, stylistId)
        );
    }
}
