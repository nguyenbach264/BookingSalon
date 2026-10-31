package demo.bookingsalon.Payload.DTO;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProductDTO {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer stockQuantity;
    private String imageUrl;
    private List<String> images;
    private Double rating;
    private Integer reviewCount;
    private Integer soldCount;
    private boolean active;
    private UUID categoryId;
    private String categoryName;
    private String categorySlug;
    private LocalDateTime createdAt;
}

