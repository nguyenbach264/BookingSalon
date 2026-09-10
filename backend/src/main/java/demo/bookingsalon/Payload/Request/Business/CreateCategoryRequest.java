package demo.bookingsalon.Payload.Request.Business;

import lombok.Data;

import java.util.UUID;

@Data
public class CreateCategoryRequest {

    private String categoryName;

    private String image;

    private UUID salonId;
}
