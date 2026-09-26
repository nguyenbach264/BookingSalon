package demo.bookingsalon.Controller;

import demo.bookingsalon.Payload.DTO.ProductCategoryDTO;
import demo.bookingsalon.Payload.DTO.ProductDTO;
import demo.bookingsalon.Service.ProductService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
@Slf4j
public class ProductController {

    private final ProductService productService;

    @GetMapping("/products")
    public ResponseEntity<Page<ProductDTO>> getProducts(
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(required = false) String categorySlug,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) BigDecimal minPrice,
            @RequestParam(required = false) BigDecimal maxPrice,
            @RequestParam(required = false) Double minRating,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        log.info("Fetching products with filters - cat: {}, slug: {}, search: {}, min: {}, max: {}, rating: {}, sort: {}",
                categoryId, categorySlug, search, minPrice, maxPrice, minRating, sortBy);
        Page<ProductDTO> products = productService.getProducts(
                categoryId, categorySlug, search, minPrice, maxPrice, minRating, sortBy, page, size
        );
        return ResponseEntity.ok(products);
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<ProductDTO> getProductById(@PathVariable UUID id) {
        return ResponseEntity.ok(productService.getProductById(id));
    }

    @GetMapping("/product-categories")
    public ResponseEntity<List<ProductCategoryDTO>> getProductCategories() {
        return ResponseEntity.ok(productService.getAllCategories());
    }
}

