package demo.bookingsalon.ProductTest;

import demo.bookingsalon.Entity.Product;
import demo.bookingsalon.Entity.ProductCategory;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Payload.DTO.ProductCategoryDTO;
import demo.bookingsalon.Payload.DTO.ProductDTO;
import demo.bookingsalon.Repository.ProductCategoryRepository;
import demo.bookingsalon.Repository.ProductRepository;
import demo.bookingsalon.Service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class ProductServiceUnitTest {

    @Mock
    private ProductRepository productRepository;

    @Mock
    private ProductCategoryRepository productCategoryRepository;

    @InjectMocks
    private ProductService productService;

    private UUID productId;
    private UUID categoryId;
    private Product testProduct;
    private ProductCategory testCategory;

    @BeforeEach
    void setUp() {
        productId = UUID.randomUUID();
        categoryId = UUID.randomUUID();

        testCategory = ProductCategory.builder()
                .id(categoryId)
                .name("Cham soc toc")
                .slug("cham-soc-toc")
                .description("Cac san pham cham soc toc cao cap")
                .build();

        testProduct = Product.builder()
                .id(productId)
                .name("Sap vuot toc Clay")
                .slug("sap-vuot-toc-clay")
                .price(BigDecimal.valueOf(300000))
                .originalPrice(BigDecimal.valueOf(350000))
                .stockQuantity(15)
                .rating(4.8)
                .category(testCategory)
                .active(true)
                .build();
    }

    @Test
    @DisplayName("UT-Product-01: getProducts lọc danh sách sản phẩm trả về phân trang")
    void testGetProducts_Success() {
        Page<Product> page = new PageImpl<>(List.of(testProduct));
        when(productRepository.findAll(any(Specification.class), any(Pageable.class))).thenReturn(page);

        Page<ProductDTO> result = productService.getProducts(
                categoryId, "cham-soc-toc", "Sap", BigDecimal.valueOf(100000), BigDecimal.valueOf(500000),
                4.0, "price_asc", 0, 10
        );

        assertNotNull(result);
        assertEquals(1, result.getTotalElements());
        assertEquals("Sap vuot toc Clay", result.getContent().get(0).getName());
        assertEquals("cham-soc-toc", result.getContent().get(0).getCategorySlug());
    }

    @Test
    @DisplayName("UT-Product-02: getProductById thành công khi sản phẩm tồn tại")
    void testGetProductById_Success() {
        when(productRepository.findById(productId)).thenReturn(Optional.of(testProduct));

        ProductDTO result = productService.getProductById(productId);

        assertNotNull(result);
        assertEquals(productId, result.getId());
        assertEquals("Sap vuot toc Clay", result.getName());
        assertEquals(BigDecimal.valueOf(300000), result.getPrice());
    }

    @Test
    @DisplayName("UT-Product-03: getProductById ném NotFoundException khi không tìm thấy id")
    void testGetProductById_NotFound_ThrowsException() {
        when(productRepository.findById(productId)).thenReturn(Optional.empty());

        assertThrows(NotFoundException.class, () -> productService.getProductById(productId));
    }

    @Test
    @DisplayName("UT-Product-04: getAllCategories trả về danh sách kèm số lượng sản phẩm")
    void testGetAllCategories_Success() {
        when(productCategoryRepository.findAll()).thenReturn(List.of(testCategory));
        when(productRepository.countByCategoryId(categoryId)).thenReturn(5L);

        List<ProductCategoryDTO> result = productService.getAllCategories();

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Cham soc toc", result.get(0).getName());
        assertEquals(5L, result.get(0).getProductCount());
    }
}

