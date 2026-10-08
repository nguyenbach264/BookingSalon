package demo.bookingsalon.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import demo.bookingsalon.Entity.Booking;
import demo.bookingsalon.Entity.Salon;
import demo.bookingsalon.Entity.ServiceOffering;
import demo.bookingsalon.Entity.Stylist;
import demo.bookingsalon.Entity.StylistService;
import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Enum.BookingStatus;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Payload.Admin.AdminStylistResponse;
import demo.bookingsalon.Payload.Admin.PayrollBookingDetailDTO;
import demo.bookingsalon.Payload.Admin.PromoteUserToStylistRequest;
import demo.bookingsalon.Payload.Admin.StylistPayrollDTO;
import demo.bookingsalon.Payload.Admin.StylistSalaryConfigDTO;
import demo.bookingsalon.Payload.Admin.TerminateStylistRequest;
import demo.bookingsalon.Payload.DTO.ServiceOfferingDTO;
import demo.bookingsalon.Repository.BookingRepository;
import demo.bookingsalon.Repository.SalonRepository;
import demo.bookingsalon.Repository.ServiceOfferingRepository;
import demo.bookingsalon.Repository.StylistRepository;
import demo.bookingsalon.Repository.StylistServiceRepository;
import demo.bookingsalon.Repository.UserRepository;
import demo.bookingsalon.Service.Keycloak.RoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminStylistService {

    private final StylistRepository stylistRepository;
    private final UserRepository userRepository;
    private final SalonRepository salonRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final StylistServiceRepository stylistServiceRepository;
    private final BookingRepository bookingRepository;
    private final RoleService roleService;

    @Transactional(readOnly = true)
    public List<AdminStylistResponse> getAllStylists(UUID salonId, String status, String search) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        String cleanStatus = (status != null && !status.trim().isEmpty()) ? status.trim().toUpperCase() : null;

        List<Stylist> stylists = stylistRepository.searchStylists(salonId, cleanStatus, cleanSearch);

        return stylists.stream().map(this::mapToAdminStylistResponse).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public AdminStylistResponse getStylistDetail(UUID stylistId) {
        Stylist stylist = stylistRepository.findById(stylistId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy stylist với ID: " + stylistId));
        return mapToAdminStylistResponse(stylist);
    }

    @Transactional
    public AdminStylistResponse promoteUserToStylist(PromoteUserToStylistRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy người dùng với ID: " + request.getUserId()));

        if (user.getKeycloakId() != null && stylistRepository.findByKeycloakId(user.getKeycloakId()).isPresent()) {
            throw new IllegalArgumentException("Người dùng này đã là Stylist trong hệ thống.");
        }
        if (user.getUsername() != null && stylistRepository.findByUsername(user.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Tài khoản username " + user.getUsername() + " đã tồn tại trong danh sách Stylist.");
        }

        Salon salon = salonRepository.findById(request.getSalonId())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy Salon với ID: " + request.getSalonId()));

        BigDecimal commissionRate = request.getCommissionRate() != null ? request.getCommissionRate() : BigDecimal.valueOf(30.00);
        BigDecimal baseSalary = request.getBaseSalary() != null ? request.getBaseSalary() : BigDecimal.ZERO;
        String levelRank = (request.getLevelRank() != null && !request.getLevelRank().isBlank()) ? request.getLevelRank() : "SENIOR";
        String workShift = (request.getWorkShiftType() != null && !request.getWorkShiftType().isBlank()) ? request.getWorkShiftType() : "FULL_TIME";

        Stylist stylist = Stylist.builder()
                .keycloakId(user.getKeycloakId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .address(user.getAddress())
                .avatarUrl(user.getAvatarUrl())
                .enabled(true)
                .isDeleted(false)
                .status("ACTIVE")
                .salon(salon)
                .nickname(request.getNickname() != null ? request.getNickname() : user.getFullName())
                .bio(request.getBio())
                .specialties(request.getSpecialties())
                .experienceYears(request.getExperienceYears() != null ? request.getExperienceYears() : BigDecimal.valueOf(1.0))
                .levelRank(levelRank)
                .baseSalary(baseSalary)
                .commissionRate(commissionRate)
                .salary(baseSalary)
                .tipBalance(BigDecimal.ZERO)
                .joinDate(LocalDate.now())
                .workShiftType(workShift)
                .rating(5.0)
                .ratingAverage(BigDecimal.valueOf(5.00))
                .totalReviewsCount(0)
                .totalServedBookings(0)
                .build();

        Stylist savedStylist = stylistRepository.save(stylist);

        if (request.getServiceIds() != null && !request.getServiceIds().isEmpty()) {
            for (UUID sId : request.getServiceIds()) {
                serviceOfferingRepository.findByIdAndDeletedAtIsNull(sId).ifPresent(so -> {
                    StylistService ss = StylistService.builder()
                            .stylist(savedStylist)
                            .serviceOffering(so)
                            .build();
                    stylistServiceRepository.save(ss);
                });
            }
        }

        if (user.getKeycloakId() != null) {
            try {
                roleService.assignRealmRole(user.getKeycloakId(), "STYLIST");
                log.info("Keycloak role 'STYLIST' assigned to user {}", user.getKeycloakId());
            } catch (Exception e) {
                log.warn("Không thể cập nhật role Keycloak cho user {}: {}", user.getKeycloakId(), e.getMessage());
            }
        }

        return mapToAdminStylistResponse(savedStylist);
    }

    @Transactional
    public void terminateStylist(UUID stylistId, TerminateStylistRequest request) {
        Stylist stylist = stylistRepository.findById(stylistId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy stylist với ID: " + stylistId));

        stylist.setStatus("INACTIVE");
        stylist.setEnabled(false);
        stylist.setLeaveDate(request.getLeaveDate() != null ? request.getLeaveDate() : LocalDate.now());

        if (stylist.getKeycloakId() != null) {
            try {
                roleService.removeRealmRole(stylist.getKeycloakId(), "STYLIST");
                log.info("Removed Keycloak role 'STYLIST' for user {}", stylist.getKeycloakId());
            } catch (Exception e) {
                log.warn("Lỗi khi xóa role Keycloak của stylist {}: {}", stylist.getKeycloakId(), e.getMessage());
            }
        }

        List<Booking> futureBookings = bookingRepository.findFutureActiveBookingsByStylist(stylistId, LocalDateTime.now());

        if (request.getReassignToStylistId() != null) {
            Stylist replacement = stylistRepository.findById(request.getReassignToStylistId())
                    .orElseThrow(() -> new NotFoundException("Stylist thay thế không tồn tại"));

            if (!"ACTIVE".equalsIgnoreCase(replacement.getStatus())) {
                throw new IllegalArgumentException("Stylist thay thế hiện không ở trạng thái ACTIVE");
            }

            for (Booking b : futureBookings) {
                b.setStylist(replacement);
                b.setStylistNotes("Chuyển lịch từ stylist " + stylist.getFullName() + " do nghỉ việc.");
                bookingRepository.save(b);
            }
            log.info("Reassigned {} active bookings to stylist {}", futureBookings.size(), replacement.getId());
        } else {
            for (Booking b : futureBookings) {
                b.setStatus(BookingStatus.CANCELLED);
                b.setCancellationReason(request.getReason() != null ? request.getReason() : "Stylist phụ trách đã nghỉ việc");
                b.setCancelledBy("ADMIN");
                b.setCancelledAt(LocalDateTime.now());
                bookingRepository.save(b);
            }
            log.info("Cancelled {} active bookings due to stylist termination", futureBookings.size());
        }

        stylistRepository.save(stylist);
    }

    @Transactional
    public List<ServiceOfferingDTO> assignServicesToStylist(UUID stylistId, List<UUID> serviceIds) {
        Stylist stylist = stylistRepository.findById(stylistId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy stylist với ID: " + stylistId));

        stylistServiceRepository.deleteByStylistId(stylistId);

        List<ServiceOfferingDTO> assigned = new ArrayList<>();
        if (serviceIds != null && !serviceIds.isEmpty()) {
            for (UUID sId : serviceIds) {
                serviceOfferingRepository.findByIdAndDeletedAtIsNull(sId).ifPresent(so -> {
                    StylistService ss = StylistService.builder()
                            .stylist(stylist)
                            .serviceOffering(so)
                            .build();
                    stylistServiceRepository.save(ss);
                    assigned.add(mapToServiceOfferingDTO(so));
                });
            }
        }
        return assigned;
    }

    @Transactional
    public void removeServiceFromStylist(UUID stylistId, UUID serviceOfferingId) {
        stylistServiceRepository.deleteByStylistIdAndServiceOfferingId(stylistId, serviceOfferingId);
    }

    @Transactional
    public AdminStylistResponse updateSalaryConfig(UUID stylistId, StylistSalaryConfigDTO dto) {
        Stylist stylist = stylistRepository.findById(stylistId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy stylist với ID: " + stylistId));

        stylist.setBaseSalary(dto.getBaseSalary());
        stylist.setSalary(dto.getBaseSalary());
        stylist.setCommissionRate(dto.getCommissionRate());
        if (dto.getWorkShiftType() != null && !dto.getWorkShiftType().isBlank()) {
            stylist.setWorkShiftType(dto.getWorkShiftType());
        }

        Stylist updated = stylistRepository.save(stylist);
        return mapToAdminStylistResponse(updated);
    }

    @Transactional(readOnly = true)
    public StylistPayrollDTO calculatePayroll(UUID stylistId, LocalDate startDate, LocalDate endDate) {
        Stylist stylist = stylistRepository.findById(stylistId)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy stylist với ID: " + stylistId));

        LocalDate periodStart = (startDate != null) ? startDate : LocalDate.now().withDayOfMonth(1);
        LocalDate periodEnd = (endDate != null) ? endDate : LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth());

        LocalDateTime startDateTime = periodStart.atStartOfDay();
        LocalDateTime endDateTime = periodEnd.atTime(LocalTime.MAX);

        List<Booking> completedBookings = bookingRepository.findCompletedPaidBookingsByStylistAndPeriod(
                stylistId, startDateTime, endDateTime);

        BigDecimal commissionRate = stylist.getCommissionRate() != null ? stylist.getCommissionRate() : BigDecimal.valueOf(30.00);
        BigDecimal baseSalary = stylist.getBaseSalary() != null ? stylist.getBaseSalary() : BigDecimal.ZERO;
        BigDecimal tipBalance = stylist.getTipBalance() != null ? stylist.getTipBalance() : BigDecimal.ZERO;

        BigDecimal totalRevenue = BigDecimal.ZERO;
        List<PayrollBookingDetailDTO> bookingDetails = new ArrayList<>();

        for (Booking b : completedBookings) {
            BigDecimal bookingTotal = (b.getTotalAmount() != null) ? b.getTotalAmount() : BigDecimal.ZERO;
            totalRevenue = totalRevenue.add(bookingTotal);

            BigDecimal bookingCommission = bookingTotal.multiply(commissionRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

            List<String> serviceNames = (b.getBookingDetails() != null)
                    ? b.getBookingDetails().stream()
                    .map(d -> d.getServiceOffering() != null ? d.getServiceOffering().getName() : "")
                    .filter(s -> !s.isBlank())
                    .toList()
                    : Collections.emptyList();

            bookingDetails.add(PayrollBookingDetailDTO.builder()
                    .bookingId(b.getId())
                    .bookingCode(b.getBookingCode())
                    .customerName(b.getCustomerName())
                    .customerPhone(b.getCustomerPhone())
                    .startTime(b.getStartTime())
                    .endTime(b.getEndTime())
                    .serviceNames(serviceNames)
                    .totalAmount(bookingTotal)
                    .bookingCommission(bookingCommission)
                    .build());
        }

        BigDecimal commissionBonus = totalRevenue.multiply(commissionRate)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal totalSalary = baseSalary.add(commissionBonus).add(tipBalance);

        return StylistPayrollDTO.builder()
                .stylistId(stylist.getId())
                .stylistName(stylist.getFullName())
                .stylistPhone(stylist.getPhoneNumber())
                .salonName(stylist.getSalon() != null ? stylist.getSalon().getSalonName() : "")
                .periodStart(periodStart)
                .periodEnd(periodEnd)
                .baseSalary(baseSalary)
                .commissionRate(commissionRate)
                .completedBookingsCount(completedBookings.size())
                .totalCompletedBookingRevenue(totalRevenue)
                .commissionBonus(commissionBonus)
                .tipBalance(tipBalance)
                .totalSalary(totalSalary)
                .bookingDetails(bookingDetails)
                .build();
    }

    @Transactional(readOnly = true)
    public List<User> getEligibleUsersForPromotion(String search) {
        String cleanSearch = (search != null && !search.trim().isEmpty()) ? search.trim().toLowerCase() : "";
        List<User> users = userRepository.findAll();
        Set<UUID> existingStylistKeycloakIds = stylistRepository.findAll().stream()
                .map(Stylist::getKeycloakId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        return users.stream()
                .filter(u -> !u.isDeleted() && u.isEnabled())
                .filter(u -> u.getKeycloakId() == null || !existingStylistKeycloakIds.contains(u.getKeycloakId()))
                .filter(u -> cleanSearch.isEmpty() ||
                        (u.getFullName() != null && u.getFullName().toLowerCase().contains(cleanSearch)) ||
                        (u.getPhoneNumber() != null && u.getPhoneNumber().contains(cleanSearch)) ||
                        (u.getEmail() != null && u.getEmail().toLowerCase().contains(cleanSearch)))
                .limit(50)
                .collect(Collectors.toList());
    }

    private AdminStylistResponse mapToAdminStylistResponse(Stylist s) {
        List<ServiceOfferingDTO> services = Collections.emptyList();
        if (s.getId() != null) {
            List<StylistService> ssList = stylistServiceRepository.findByStylistId(s.getId());
            services = ssList.stream()
                    .map(StylistService::getServiceOffering)
                    .filter(so -> so != null && so.getDeletedAt() == null)
                    .map(this::mapToServiceOfferingDTO)
                    .collect(Collectors.toList());
        }

        long activeBookings = 0;
        if (s.getId() != null) {
            activeBookings = bookingRepository.findFutureActiveBookingsByStylist(s.getId(), LocalDateTime.now()).size();
        }

        return AdminStylistResponse.builder()
                .id(s.getId())
                .keycloakId(s.getKeycloakId())
                .username(s.getUsername())
                .fullName(s.getFullName())
                .email(s.getEmail())
                .phoneNumber(s.getPhoneNumber())
                .address(s.getAddress())
                .avatarUrl(s.getAvatarUrl())
                .nickname(s.getNickname())
                .bio(s.getBio())
                .specialties(s.getSpecialties())
                .levelRank(s.getLevelRank())
                .rating(s.getRating() != null ? s.getRating() : 5.0)
                .baseSalary(s.getBaseSalary() != null ? s.getBaseSalary() : BigDecimal.ZERO)
                .commissionRate(s.getCommissionRate() != null ? s.getCommissionRate() : BigDecimal.valueOf(30.00))
                .tipBalance(s.getTipBalance() != null ? s.getTipBalance() : BigDecimal.ZERO)
                .salonId(s.getSalon() != null ? s.getSalon().getId() : null)
                .salonName(s.getSalon() != null ? s.getSalon().getSalonName() : "")
                .status(s.getStatus() != null ? s.getStatus() : "ACTIVE")
                .joinDate(s.getJoinDate())
                .leaveDate(s.getLeaveDate())
                .workShiftType(s.getWorkShiftType() != null ? s.getWorkShiftType() : "FULL_TIME")
                .services(services)
                .activeBookingsCount(activeBookings)
                .build();
    }

    private ServiceOfferingDTO mapToServiceOfferingDTO(ServiceOffering so) {
        return ServiceOfferingDTO.builder()
                .id(so.getId())
                .name(so.getName())
                .description(so.getDescription())
                .price(so.getPrice())
                .duration(so.getDuration())
                .image(so.getImage())
                .salonId(so.getSalon() != null && so.getSalon().getId() != null ? so.getSalon().getId().toString() : null)
                .categoryId(so.getCategory() != null && so.getCategory().getId() != null ? so.getCategory().getId().toString() : null)
                .build();
    }
}
