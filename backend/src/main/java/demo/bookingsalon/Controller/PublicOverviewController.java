package demo.bookingsalon.Controller;

import demo.bookingsalon.Mapper.SalonMapper;
import demo.bookingsalon.Mapper.ServiceOfferingMapper;
import demo.bookingsalon.Payload.DTO.PublicSystemSummaryDTO;
import demo.bookingsalon.Payload.DTO.SalonDTO;
import demo.bookingsalon.Payload.DTO.ServiceOfferingDTO;
import demo.bookingsalon.Repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicOverviewController {

    private final SalonRepository salonRepository;
    private final StylistRepository stylistRepository;
    private final UserRepository userRepository;
    private final ServiceOfferingRepository serviceOfferingRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final SalonMapper salonMapper;
    private final ServiceOfferingMapper serviceOfferingMapper;

    @GetMapping({"/about-us", "/system-summary"})
    @Transactional(readOnly = true)
    public ResponseEntity<PublicSystemSummaryDTO> getPublicSystemSummary() {
        long totalSalons = salonRepository.count();
        long totalStylists = stylistRepository.count();
        long totalUsers = userRepository.count();
        long totalServices = serviceOfferingRepository.count();
        long totalBookings = bookingRepository.count();
        long totalReviews = reviewRepository.count();

        Double dbAvgRating = reviewRepository.getOverallAverageRating();
        double averageRating = (dbAvgRating != null && dbAvgRating > 0)
                ? Math.round(dbAvgRating * 100.0) / 100.0
                : 4.95;

        // 1. Salons
        List<SalonDTO> salons = salonRepository.findAll().stream()
                .map(salonMapper::toSalonDTO)
                .sorted(Comparator.comparing(SalonDTO::getSalonName))
                .toList();

        // 2. Stylists
        List<PublicSystemSummaryDTO.PublicStylistDTO> stylists = stylistRepository.findAll().stream()
                .filter(s -> "ACTIVE".equalsIgnoreCase(s.getStatus()))
                .sorted((a, b) -> {
                    int rankA = "MASTER".equalsIgnoreCase(a.getLevelRank()) ? 3 : ("SENIOR".equalsIgnoreCase(a.getLevelRank()) ? 2 : 1);
                    int rankB = "MASTER".equalsIgnoreCase(b.getLevelRank()) ? 3 : ("SENIOR".equalsIgnoreCase(b.getLevelRank()) ? 2 : 1);
                    return Integer.compare(rankB, rankA);
                })
                .map(s -> PublicSystemSummaryDTO.PublicStylistDTO.builder()
                        .id(s.getId() != null ? s.getId().toString() : "")
                        .fullName(s.getFullName() != null ? s.getFullName() : s.getUsername())
                        .nickname(s.getNickname())
                        .avatarUrl(s.getAvatarUrl())
                        .bio(s.getBio())
                        .experienceYears(s.getExperienceYears() != null ? s.getExperienceYears().doubleValue() : 3.0)
                        .specialties(s.getSpecialties())
                        .levelRank(s.getLevelRank() != null ? s.getLevelRank() : "SENIOR")
                        .ratingAverage(s.getRatingAverage() != null ? s.getRatingAverage().doubleValue() : 4.9)
                        .totalServedBookings(s.getTotalServedBookings() != null ? s.getTotalServedBookings() : 0)
                        .salonName(s.getSalon() != null ? s.getSalon().getSalonName() : "Toàn hệ thống")
                        .salonAddress(s.getSalon() != null ? s.getSalon().getAddress() : "")
                        .build())
                .toList();

        // 3. Services
        List<ServiceOfferingDTO> services = serviceOfferingRepository.findAll().stream()
                .filter(srv -> srv.getDeletedAt() == null)
                .map(serviceOfferingMapper::toServiceOfferingDTO)
                .toList();

        // 4. Recent Reviews
        List<PublicSystemSummaryDTO.PublicReviewDTO> recentReviews = reviewRepository.findAll().stream()
                .sorted((a, b) -> {
                    if (a.getCreatedAt() == null) return 1;
                    if (b.getCreatedAt() == null) return -1;
                    return b.getCreatedAt().compareTo(a.getCreatedAt());
                })
                .limit(10)
                .map(r -> PublicSystemSummaryDTO.PublicReviewDTO.builder()
                        .id(r.getId() != null ? r.getId().toString() : "")
                        .customerName(r.getUser() != null ? (r.getUser().getFullName() != null ? r.getUser().getFullName() : r.getUser().getUsername()) : "Khách hàng BachBarber")
                        .rating(r.getRating() != null ? r.getRating() : 5)
                        .reviewContent(r.getReviewContent())
                        .type(r.getType())
                        .createdAt(r.getCreatedAt() != null ? r.getCreatedAt().toString() : "")
                        .build())
                .toList();

        PublicSystemSummaryDTO summary = PublicSystemSummaryDTO.builder()
                .totalSalons(totalSalons)
                .totalStylists(totalStylists)
                .totalUsers(totalUsers)
                .totalServices(totalServices)
                .totalBookings(totalBookings)
                .totalReviews(totalReviews)
                .averageRating(averageRating)
                .salons(salons)
                .stylists(stylists)
                .services(services)
                .recentReviews(recentReviews)
                .build();

        return ResponseEntity.ok(summary);
    }
}
