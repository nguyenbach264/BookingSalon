package demo.bookingsalon.ProductTest;

import demo.bookingsalon.Controller.ProductController;
import demo.bookingsalon.Payload.DTO.ProductCategoryDTO;
import demo.bookingsalon.Payload.DTO.ProductDTO;
import demo.bookingsalon.Service.BffSessionService;
import demo.bookingsalon.Service.ProductService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ProductController.class)
@AutoConfigureMockMvc(addFilters = false)
public class ProductControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private ProductService productService;

    @MockitoBean
    private BffSessionService bffSessionService;

    @MockitoBean
    private JwtDecoder jwtDecoder;

    @Test
    @DisplayName("IT-Product-01: GET /api/products trả về 200 OK và danh sách sản phẩm")
    void testGetProducts_Success() throws Exception {
        ProductDTO product = ProductDTO.builder()
                .id(UUID.randomUUID())
                .name("Gom Xit Toc")
                .price(BigDecimal.valueOf(180000))
                .stockQuantity(20)
                .build();

        when(productService.getProducts(any(), any(), any(), any(), any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(new PageImpl<>(List.of(product)));

        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].name").value("Gom Xit Toc"));
    }

    @Test
    @DisplayName("IT-Product-02: GET /api/products/{id} thành công trả về chi tiết sản phẩm")
    void testGetProductById_Success() throws Exception {
        UUID productId = UUID.randomUUID();
        ProductDTO product = ProductDTO.builder()
                .id(productId)
                .name("Dau Goi Tri Gau")
                .price(BigDecimal.valueOf(220000))
                .build();

        when(productService.getProductById(productId)).thenReturn(product);

        mockMvc.perform(get("/api/products/{id}", productId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(productId.toString()))
                .andExpect(jsonPath("$.name").value("Dau Goi Tri Gau"));
    }

    @Test
    @DisplayName("IT-Product-03: GET /api/product-categories trả về 200 OK và danh mục")
    void testGetProductCategories_Success() throws Exception {
        ProductCategoryDTO category = ProductCategoryDTO.builder()
                .id(UUID.randomUUID())
                .name("Duong Toc")
                .productCount(8)
                .build();

        when(productService.getAllCategories()).thenReturn(List.of(category));

        mockMvc.perform(get("/api/product-categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Duong Toc"))
                .andExpect(jsonPath("$[0].productCount").value(8));
    }
}

