package demo.bookingsalon.Controller;

import demo.bookingsalon.Entity.Stylist;
import demo.bookingsalon.Entity.StylistService;
import demo.bookingsalon.Repository.StylistRepository;
import demo.bookingsalon.Repository.StylistServiceRepository;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/stylists")
@RequiredArgsConstructor
public class StylistController {

    private final StylistRepository stylistRepository;
    private final StylistServiceRepository stylistServiceRepository;
    private final demo.bookingsalon.Repository.ReviewRepository reviewRepository;

    @Data
    @Builder
    public static class StylistDetailDTO {
        private UUID id;
        private UUID keycloakId;
        private String username;
        private String fullName;
        private String nickname;
        private String email;
        private String phoneNumber;
        private String avatarUrl;
        private String bio;
        private BigDecimal experienceYears;
        private String specialties;
        private String levelRank;
        private BigDecimal ratingAverage;
        private Integer totalReviewsCount;
        private Integer totalServedBookings;
        private BigDecimal baseSalary;
        private BigDecimal commissionRate;
        private BigDecimal tipBalance;
        private String workShiftType;
        private Boolean isFeatured;
        private String status;
        private Boolean isDutyActive;
        private java.time.LocalDateTime nextAvailableOnTime;
        private Long cooldownRemainingSeconds;
        private UUID salonId;
        private String salonName;
        private String salonAddress;
        private LocalDate joinDate;
    }

    @Data
    @Builder
    public static class StylistServiceDTO {
        private UUID id;
        private UUID serviceId;
        private String serviceName;
        private BigDecimal price;
        private Integer duration;
        private String proficiencyLevel;
    }

    @GetMapping
    public ResponseEntity<List<StylistDetailDTO>> getAllStylists(@RequestParam(value = "onlyActive", defaultValue = "false") boolean onlyActive) {
        List<StylistDetailDTO> list = stylistRepository.findAll().stream()
                .filter(s -> !onlyActive || "ACTIVE".equalsIgnoreCase(s.getStatus()))
                .map(this::toDTO)
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}")
    public ResponseEntity<StylistDetailDTO> getStylistById(@PathVariable UUID id) {
        return stylistRepository.findById(id)
                .map(s -> ResponseEntity.ok(toDTO(s)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/salon/{salonId}")
    public ResponseEntity<List<StylistDetailDTO>> getStylistsBySalon(
            @PathVariable UUID salonId,
            @RequestParam(value = "onlyActive", defaultValue = "true") boolean onlyActive) {
        List<StylistDetailDTO> list = stylistRepository.findAll().stream()
                .filter(s -> s.getSalon() != null && salonId.equals(s.getSalon().getId()))
                .filter(s -> !onlyActive || "ACTIVE".equalsIgnoreCase(s.getStatus()))
                .map(this::toDTO)
                .toList();
        return ResponseEntity.ok(list);
    }

    @GetMapping("/{id}/services")
    public ResponseEntity<List<StylistServiceDTO>> getStylistServices(@PathVariable UUID id) {
        List<StylistService> mappings = stylistServiceRepository.findByStylistId(id);
        List<StylistServiceDTO> dtoList = mappings.stream()
                .map(m -> StylistServiceDTO.builder()
                        .id(m.getId())
                        .serviceId(m.getServiceOffering() != null ? m.getServiceOffering().getId() : null)
                        .serviceName(m.getServiceOffering() != null ? m.getServiceOffering().getName() : "")
                        .price(m.getServiceOffering() != null ? m.getServiceOffering().getPrice() : BigDecimal.ZERO)
                        .duration(m.getServiceOffering() != null ? m.getServiceOffering().getDuration() : 30)
                        .build())
                .toList();
        return ResponseEntity.ok(dtoList);
    }

    @PutMapping("/{id}/duty-status")
    public ResponseEntity<?> toggleDutyStatus(
            @PathVariable UUID id,
            @RequestBody java.util.Map<String, Boolean> body) {
        Boolean active = body.get("active");
        if (active == null) {
            return ResponseEntity.badRequest().body(java.util.Map.of("message", "Thiếu trường active"));
        }
        Stylist s = stylistRepository.findById(id)
                .orElseThrow(() -> new demo.bookingsalon.Exception.NotFoundException("Stylist không tồn tại"));
        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        if (Boolean.TRUE.equals(active)) {
            // Muốn bật lại ON: kiểm tra cooldown 2 tiếng
            if (s.getNextAvailableOnTime() != null && s.getNextAvailableOnTime().isAfter(now)) {
                long remainingSeconds = java.time.Duration.between(now, s.getNextAvailableOnTime()).getSeconds();
                long mins = remainingSeconds / 60;
                long secs = remainingSeconds % 60;
                return ResponseEntity.status(org.springframework.http.HttpStatus.TOO_MANY_REQUESTS)
                        .body(java.util.Map.of(
                                "message", "Bạn vừa tắt trạng thái hoạt động. Cần đợi hết 2 tiếng mới có thể bật lại (còn " + mins + " phút " + secs + " giây)!",
                                "cooldownRemainingSeconds", remainingSeconds
                        ));
            }
            s.setStatus("ACTIVE");
            s.setNextAvailableOnTime(null);
        } else {
            // Muốn tắt OFF: kích hoạt đếm ngược 2 tiếng trước khi được bật lại
            s.setStatus("OFF");
            s.setNextAvailableOnTime(now.plusHours(2));
        }

        Stylist updated = stylistRepository.save(s);
        return ResponseEntity.ok(toDTO(updated));
    }

    private StylistDetailDTO toDTO(Stylist s) {
        Long count = reviewRepository.countByStylistId(s.getId());
        Double avg = reviewRepository.getAverageRatingByStylistId(s.getId());
        BigDecimal ratingAvg = avg != null ? BigDecimal.valueOf(avg).setScale(1, java.math.RoundingMode.HALF_UP) : BigDecimal.ZERO;
        int reviewCount = count != null ? count.intValue() : 0;

        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        Long cooldownSec = null;
        if (s.getNextAvailableOnTime() != null && s.getNextAvailableOnTime().isAfter(now)) {
            cooldownSec = java.time.Duration.between(now, s.getNextAvailableOnTime()).getSeconds();
        }

        return StylistDetailDTO.builder()
                .id(s.getId())
                .keycloakId(s.getKeycloakId())
                .username(s.getUsername())
                .fullName(s.getFullName())
                .nickname(s.getNickname())
                .email(s.getEmail())
                .phoneNumber(s.getPhoneNumber())
                .avatarUrl(s.getAvatarUrl())
                .bio(s.getBio())
                .experienceYears(s.getExperienceYears())
                .specialties(s.getSpecialties())
                .levelRank(s.getLevelRank())
                .ratingAverage(reviewCount > 0 ? ratingAvg : (s.getRatingAverage() != null ? s.getRatingAverage() : BigDecimal.ZERO))
                .totalReviewsCount(reviewCount)
                .totalServedBookings(s.getTotalServedBookings())
                .baseSalary(s.getBaseSalary())
                .commissionRate(s.getCommissionRate())
                .tipBalance(s.getTipBalance())
                .workShiftType(s.getWorkShiftType())
                .isFeatured(s.isFeatured())
                .status(s.getStatus())
                .isDutyActive("ACTIVE".equalsIgnoreCase(s.getStatus()))
                .nextAvailableOnTime(s.getNextAvailableOnTime())
                .cooldownRemainingSeconds(cooldownSec)
                .salonId(s.getSalon() != null ? s.getSalon().getId() : null)
                .salonName(s.getSalon() != null ? s.getSalon().getSalonName() : "")
                .salonAddress(s.getSalon() != null ? s.getSalon().getAddress() : "")
                .joinDate(s.getJoinDate())
                .build();
    }
}
