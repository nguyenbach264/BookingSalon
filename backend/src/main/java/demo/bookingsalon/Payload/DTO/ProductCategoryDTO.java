package demo.bookingsalon.Payload.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductCategoryDTO {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String imageUrl;
    private long productCount;
}

