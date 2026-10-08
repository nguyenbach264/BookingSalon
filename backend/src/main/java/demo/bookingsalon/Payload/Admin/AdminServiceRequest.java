package demo.bookingsalon.Payload.Admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminServiceRequest {

    @NotBlank(message = "Tên dịch vụ không được để trống")
    private String name;

    private String description;

    @NotNull(message = "Giá dịch vụ không được để trống")
    @Min(value = 0, message = "Giá dịch vụ phải lớn hơn hoặc bằng 0")
    private BigDecimal price;

    @NotNull(message = "Thời gian thực hiện không được để trống")
    @Min(value = 5, message = "Thời gian thực hiện tối thiểu 5 phút")
    private Integer duration;

    private String image;

    @NotNull(message = "Vui lòng chọn Salon")
    private UUID salonId;

    @NotNull(message = "Vui lòng chọn Danh mục")
    private UUID categoryId;
}
