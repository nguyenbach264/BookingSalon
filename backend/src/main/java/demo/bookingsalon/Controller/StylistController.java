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
    public ResponseEntity<List<StylistDetailDTO>> getAllStylists() {
        List<StylistDetailDTO> list = stylistRepository.findAll().stream()
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
    public ResponseEntity<List<StylistDetailDTO>> getStylistsBySalon(@PathVariable UUID salonId) {
        List<StylistDetailDTO> list = stylistRepository.findAll().stream()
                .filter(s -> s.getSalon() != null && salonId.equals(s.getSalon().getId()))
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

    private StylistDetailDTO toDTO(Stylist s) {
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
                .ratingAverage(s.getRatingAverage())
                .totalReviewsCount(s.getTotalReviewsCount())
                .totalServedBookings(s.getTotalServedBookings())
                .baseSalary(s.getBaseSalary())
                .commissionRate(s.getCommissionRate())
                .tipBalance(s.getTipBalance())
                .workShiftType(s.getWorkShiftType())
                .isFeatured(s.isFeatured())
                .status(s.getStatus())
                .salonId(s.getSalon() != null ? s.getSalon().getId() : null)
                .salonName(s.getSalon() != null ? s.getSalon().getSalonName() : "")
                .salonAddress(s.getSalon() != null ? s.getSalon().getAddress() : "")
                .joinDate(s.getJoinDate())
                .build();
    }
}
