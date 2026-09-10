package demo.bookingsalon.Payload.Response.Business;

import lombok.Data;

import java.util.UUID;

@Data
public class CategoryResponse {

    private UUID id;

    private String categoryName;

    private String image;

    private UUID salonId;

}
