package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.User;
import demo.bookingsalon.Entity.UserVoucher;
import demo.bookingsalon.Entity.Voucher;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Payload.DTO.VoucherDTO;
import demo.bookingsalon.Payload.Request.Business.ApplyVoucherRequest;
import demo.bookingsalon.Payload.Request.Business.CreateVoucherRequest;
import demo.bookingsalon.Payload.Response.Business.ApplyVoucherResponse;
import demo.bookingsalon.Repository.UserRepository;
import demo.bookingsalon.Repository.UserVoucherRepository;
import demo.bookingsalon.Repository.VoucherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class VoucherService {

    private final VoucherRepository voucherRepository;
    private final UserVoucherRepository userVoucherRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public List<VoucherDTO> getAllVouchers() {
        return voucherRepository.findAllByIsDeletedFalseOrderByCreatedAtDesc().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public VoucherDTO createVoucher(CreateVoucherRequest request) {
        String code = request.getVoucherCode().trim().toUpperCase();
        Optional<Voucher> existing = voucherRepository.findByVoucherCodeAndIsDeletedFalse(code);
        if (existing.isPresent()) {
            throw new IllegalArgumentException("Mã voucher '" + code + "' đã tồn tại trên hệ thống!");
        }

        LocalDateTime start = request.getStartDate() != null ? request.getStartDate() : LocalDateTime.now();
        LocalDateTime end = request.getEndDate() != null ? request.getEndDate() : start.plusMonths(3);

        Voucher voucher = Voucher.builder()
                .voucherCode(code)
                .voucherName(request.getVoucherName().trim())
                .description(request.getDescription())
                .discountType(request.getDiscountType().toUpperCase())
                .discountValue(request.getDiscountValue())
                .maxDiscountAmount(request.getMaxDiscountAmount())
                .minOrderAmount(request.getMinOrderAmount() != null ? request.getMinOrderAmount() : BigDecimal.ZERO)
                .usageLimitTotal(request.getUsageLimitTotal() != null ? request.getUsageLimitTotal() : 1000)
                .usageLimitPerUser(request.getUsageLimitPerUser() != null ? request.getUsageLimitPerUser() : 1)
                .usedCount(0)
                .startDate(start)
                .endDate(end)
                .isActive(true)
                .isPublic(request.getIsPublic() != null ? request.getIsPublic() : true)
                .termsAndConditions(request.getTermsAndConditions())
                .isDeleted(false)
                .build();

        voucher = voucherRepository.save(voucher);
        return toDTO(voucher);
    }

    @Transactional
    public void deleteVoucher(UUID id) {
        Voucher voucher = voucherRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy voucher với id: " + id));
        voucher.setIsDeleted(true);
        voucher.setIsActive(false);
        voucherRepository.save(voucher);
    }

    @Transactional(readOnly = true)
    public List<VoucherDTO> getAvailableVouchers(UUID userId) {
        LocalDateTime now = LocalDateTime.now();
        Map<String, VoucherDTO> resultMap = new LinkedHashMap<>();

        // 1. Lấy tất cả voucher công khai còn hiệu lực
        List<Voucher> publicVouchers = voucherRepository.findActivePublicVouchers(now);
        for (Voucher v : publicVouchers) {
            resultMap.put(v.getVoucherCode(), toDTO(v));
        }

        // 2. Lấy voucher riêng của user nếu có
        if (userId != null) {
            List<UserVoucher> userVouchers = userVoucherRepository.findAvailableUserVouchers(userId, now);
            for (UserVoucher uv : userVouchers) {
                Voucher v = uv.getVoucher();
                if (v != null && !resultMap.containsKey(v.getVoucherCode())) {
                    resultMap.put(v.getVoucherCode(), toDTO(v));
                }
            }
        }

        return new ArrayList<>(resultMap.values());
    }

    @Transactional(readOnly = true)
    public ApplyVoucherResponse validateAndCalculate(ApplyVoucherRequest request) {
        String code = request.getVoucherCode() != null ? request.getVoucherCode().trim().toUpperCase() : "";
        BigDecimal orderAmount = request.getOrderAmount() != null ? request.getOrderAmount() : BigDecimal.ZERO;

        Optional<Voucher> voucherOpt = voucherRepository.findByVoucherCodeAndIsDeletedFalse(code);
        if (voucherOpt.isEmpty()) {
            return ApplyVoucherResponse.builder()
                    .valid(false)
                    .message("Mã voucher '" + code + "' không tồn tại hoặc đã hết hạn!")
                    .originalAmount(orderAmount)
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(orderAmount)
                    .build();
        }

        Voucher voucher = voucherOpt.get();
        LocalDateTime now = LocalDateTime.now();

        if (!Boolean.TRUE.equals(voucher.getIsActive())) {
            return ApplyVoucherResponse.builder()
                    .valid(false)
                    .message("Mã voucher hiện đang bị tạm khóa!")
                    .originalAmount(orderAmount)
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(orderAmount)
                    .build();
        }

        if (voucher.getStartDate() != null && now.isBefore(voucher.getStartDate())) {
            return ApplyVoucherResponse.builder()
                    .valid(false)
                    .message("Chương trình ưu đãi chưa đến ngày áp dụng!")
                    .originalAmount(orderAmount)
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(orderAmount)
                    .build();
        }

        if (voucher.getEndDate() != null && now.isAfter(voucher.getEndDate())) {
            return ApplyVoucherResponse.builder()
                    .valid(false)
                    .message("Mã voucher đã hết hạn sử dụng!")
                    .originalAmount(orderAmount)
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(orderAmount)
                    .build();
        }

        if (voucher.getUsedCount() != null && voucher.getUsageLimitTotal() != null 
                && voucher.getUsedCount() >= voucher.getUsageLimitTotal()) {
            return ApplyVoucherResponse.builder()
                    .valid(false)
                    .message("Mã voucher đã đạt giới hạn lượt sử dụng tối đa!")
                    .originalAmount(orderAmount)
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(orderAmount)
                    .build();
        }

        if (voucher.getMinOrderAmount() != null && orderAmount.compareTo(voucher.getMinOrderAmount()) < 0) {
            return ApplyVoucherResponse.builder()
                    .valid(false)
                    .message("Đơn hàng chưa đạt giá trị tối thiểu " + voucher.getMinOrderAmount() + "đ để áp dụng voucher này!")
                    .originalAmount(orderAmount)
                    .discountAmount(BigDecimal.ZERO)
                    .finalAmount(orderAmount)
                    .build();
        }

        // Tính số tiền giảm
        BigDecimal discount = calculateDiscountAmount(voucher, orderAmount);
        BigDecimal finalAmount = orderAmount.subtract(discount).max(BigDecimal.ZERO);

        return ApplyVoucherResponse.builder()
                .valid(true)
                .message("Áp dụng mã voucher thành công!")
                .voucherCode(voucher.getVoucherCode())
                .voucherName(voucher.getVoucherName())
                .discountType(voucher.getDiscountType())
                .discountValue(voucher.getDiscountValue())
                .discountAmount(discount)
                .originalAmount(orderAmount)
                .finalAmount(finalAmount)
                .build();
    }

    public BigDecimal calculateDiscountAmount(Voucher voucher, BigDecimal orderAmount) {
        BigDecimal discount = BigDecimal.ZERO;
        if ("PERCENT".equalsIgnoreCase(voucher.getDiscountType())) {
            discount = orderAmount.multiply(voucher.getDiscountValue())
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (voucher.getMaxDiscountAmount() != null && voucher.getMaxDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
                discount = discount.min(voucher.getMaxDiscountAmount());
            }
        } else {
            // FIXED_AMOUNT
            discount = voucher.getDiscountValue();
        }
        return discount.min(orderAmount);
    }

    private VoucherDTO toDTO(Voucher v) {
        return VoucherDTO.builder()
                .id(v.getId())
                .voucherCode(v.getVoucherCode())
                .voucherName(v.getVoucherName())
                .description(v.getDescription())
                .discountType(v.getDiscountType())
                .discountValue(v.getDiscountValue())
                .maxDiscountAmount(v.getMaxDiscountAmount())
                .minOrderAmount(v.getMinOrderAmount())
                .usageLimitTotal(v.getUsageLimitTotal())
                .usageLimitPerUser(v.getUsageLimitPerUser())
                .usedCount(v.getUsedCount())
                .startDate(v.getStartDate())
                .endDate(v.getEndDate())
                .isActive(v.getIsActive())
                .isPublic(v.getIsPublic())
                .bannerImageUrl(v.getBannerImageUrl())
                .termsAndConditions(v.getTermsAndConditions())
                .build();
    }
}
