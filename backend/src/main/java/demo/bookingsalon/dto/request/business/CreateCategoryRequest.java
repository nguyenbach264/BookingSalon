package demo.bookingsalon.dto.request.business;

import lombok.Data;

import java.util.UUID;

@Data
public class CreateCategoryRequest {

    private String categoryName;

    private String image;

    private UUID salonId;
}
