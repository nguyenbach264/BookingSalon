package demo.bookingsalon.Payload.Admin;

import demo.bookingsalon.Payload.DTO.ServiceOfferingDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminStylistResponse {
    private UUID id;
    private UUID keycloakId;
    private String username;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String address;
    private String avatarUrl;
    private String nickname;
    private String bio;
    private String specialties;
    private String levelRank;
    private Double rating;
    private BigDecimal baseSalary;
    private BigDecimal commissionRate;
    private BigDecimal tipBalance;
    private UUID salonId;
    private String salonName;
    private String status;
    private LocalDate joinDate;
    private LocalDate leaveDate;
    private String workShiftType;
    private List<ServiceOfferingDTO> services;
    private long activeBookingsCount;
}
