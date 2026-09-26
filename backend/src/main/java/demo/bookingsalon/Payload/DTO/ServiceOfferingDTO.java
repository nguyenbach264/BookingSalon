package demo.bookingsalon.Payload.DTO;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
@Builder
public class ServiceOfferingDTO {
    private UUID id;

    private String name;

    private String description;

    @Min(value = 1)
    private BigDecimal price;

    @Min(value = 1)
    private int duration;

    private String image;

    private String salonId;

    private String categoryId;
}
