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

    // Kiểm tra time slot có sẵn (sử dụng PESSIMISTIC lock)
    private boolean isTimeSlotAvailable(SalonDTO salonDTO,
                                        LocalDateTime bookingStartTime,
                                        LocalDateTime bookingEndTime) throws Exception {

        if (bookingStartTime.isBefore(salonDTO.getOpenTime()))
        if (salonDTO.getOpenTime() != null && bookingStartTime.toLocalTime().isBefore(salonDTO.getOpenTime()))
            throw new Exception("Booking start time is earlier than Salon open time");
        if (bookingEndTime.isAfter(salonDTO.getCloseTime()))
        if (salonDTO.getCloseTime() != null && bookingEndTime.toLocalTime().isAfter(salonDTO.getCloseTime()))
            throw new Exception("Booking end time is later than Salon close time");

        // Sử dụng query với PESSIMISTIC_WRITE lock để tránh race condition
        List<Booking> conflictingBookings = bookingRepository.findConflictingBookings(
                salonDTO.getId(), bookingStartTime, bookingEndTime);

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
            offeringDTOs = offeringRepository.findAllById(bookingRequest.getServiceIds());
        } catch (Exception e) {
            System.out.println("Service offering not found");
            e.printStackTrace();
        }
        int totalDuration = offeringDTOs.stream().mapToInt(ServiceOffering::getDuration).sum();

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

        // Kiểm tra time slot availability với pessimistic lock
        boolean isAvailable = isTimeSlotAvailable(salonDTO, bookingStartTime, bookingEndTime);

        if (!isAvailable)
            throw new Exception("Booking time existed another booking time. Please make sure time is suitable.");

        BigDecimal totalPrice = offeringDTOs.stream().map(ServiceOffering::getPrice)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Set<UUID> idList = offeringDTOs.stream().map(ServiceOffering::getId).collect(Collectors.toSet());

        User user = userRepository.findById(bookingRequest.getUserId()).orElseThrow(() ->
                new NotFoundException("User not found"));

        Stylist stylist = stylistRepository.findById(bookingRequest.getStylistId()).orElseThrow(() ->
                new NotFoundException("Stylist not found"));

        Booking booking = Booking.builder()
                .startTime(bookingStartTime)
                .endTime(bookingEndTime)
                .status(BookingStatus.PENDING)
                .serviceIds(idList)
                .salon(salon)
                .totalServices(idList.size())
                .totalAmount(totalPrice)
                .user(user)
                .stylist(stylist)
                .build();
        bookingRepository.save(booking);

        // Bất đồng bộ gửi email xác nhận đơn hàng
        bookingEventPublisher.publishBookingCreatedEvent(booking, user, salon);

        List<BookingDetail> bookingDetails = offeringDTOs.stream()
                .map(service -> BookingDetail.builder()
                        .booking(booking)
                        .serviceOffering(service)
                        .currentPrice(service.getPrice())
                        .build())
                .toList();

        bookingDetailRepository.saveAll(bookingDetails);

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
}