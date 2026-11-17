package demo.bookingsalon.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class CategoryDTO {

    private UUID id;

    private String categoryName;

    private String image;

    private UUID salonId;
}
