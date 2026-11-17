package demo.bookingsalon.dto.request.business;

import lombok.Data;

import java.math.BigDecimal;
import java.util.UUID;

@Data
public class CreateServiceOfferingRequest {

    private String name;

    private String description;

    private BigDecimal price;

    private int duration;

    private String image;

    private UUID categoryId;
}
