package demo.bookingsalon.Payload.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PublicSystemSummaryDTO {
    // 1. Thống kê hệ thống thực tế từ DB
    private long totalSalons;
    private long totalStylists;
    private long totalUsers;
    private long totalServices;
    private long totalBookings;
    private long totalReviews;
    private double averageRating;

    // 2. Danh sách thực tế từ DB phục vụ hiển thị
    private List<SalonDTO> salons;
    private List<PublicStylistDTO> stylists;
    private List<ServiceOfferingDTO> services;
    private List<PublicReviewDTO> recentReviews;

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PublicStylistDTO {
        private String id;
        private String fullName;
        private String nickname;
        private String avatarUrl;
        private String bio;
        private Double experienceYears;
        private String specialties;
        private String levelRank;
        private Double ratingAverage;
        private Integer totalServedBookings;
        private String salonName;
        private String salonAddress;
    }

    @Data
    @Builder
    @AllArgsConstructor
    @NoArgsConstructor
    public static class PublicReviewDTO {
        private String id;
        private String customerName;
        private Integer rating;
        private String reviewContent;
        private String type;
        private String createdAt;
    }
}
