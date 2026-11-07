package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.Product;
import demo.bookingsalon.Entity.ProductCategory;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Payload.DTO.ProductCategoryDTO;
import demo.bookingsalon.Payload.DTO.ProductDTO;
import demo.bookingsalon.Repository.ProductCategoryRepository;
import demo.bookingsalon.Repository.ProductRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final ProductCategoryRepository productCategoryRepository;

    @Transactional(readOnly = true)
    public Page<ProductDTO> getProducts(
            UUID categoryId,
            String categorySlug,
            String search,
            BigDecimal minPrice,
            BigDecimal maxPrice,
            Double minRating,
            String sortBy,
            int page,
            int size
    ) {
        Sort sort = buildSort(sortBy);
        Pageable pageable = PageRequest.of(Math.max(0, page), Math.min(100, Math.max(1, size)), sort);

        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            predicates.add(cb.isTrue(root.get("active")));
            predicates.add(cb.isNull(root.get("deletedAt")));

            if (categoryId != null) {
                predicates.add(cb.equal(root.get("category").get("id"), categoryId));
            } else if (categorySlug != null && !categorySlug.isBlank() && !"ALL".equalsIgnoreCase(categorySlug) && !"tat-ca".equalsIgnoreCase(categorySlug)) {
                predicates.add(cb.equal(root.get("category").get("slug"), categorySlug));
            }

            if (search != null && !search.trim().isEmpty()) {
                String pattern = "%" + search.trim().toLowerCase() + "%";
                Predicate nameLike = cb.like(cb.lower(root.get("name")), pattern);
                Predicate descLike = cb.like(cb.lower(root.get("description")), pattern);
                predicates.add(cb.or(nameLike, descLike));
            }

            if (minPrice != null && minPrice.compareTo(BigDecimal.ZERO) >= 0) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), minPrice));
            }

            if (maxPrice != null && maxPrice.compareTo(BigDecimal.ZERO) > 0) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), maxPrice));
            }

            if (minRating != null && minRating > 0) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("rating"), minRating));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        Page<Product> productPage = productRepository.findAll(spec, pageable);
        return productPage.map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public ProductDTO getProductById(UUID id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy sản phẩm với id: " + id));
        return mapToDTO(product);
    }

    @Transactional(readOnly = true)
    public List<ProductCategoryDTO> getAllCategories() {
        List<ProductCategory> categories = productCategoryRepository.findAll();
        return categories.stream().map(cat -> {
            long count = productRepository.countByCategoryId(cat.getId());
            return ProductCategoryDTO.builder()
                    .id(cat.getId())
                    .name(cat.getName())
                    .slug(cat.getSlug())
                    .description(cat.getDescription())
                    .imageUrl(cat.getImageUrl())
                    .productCount(count)
                    .build();
        }).toList();
    }

    private Sort buildSort(String sortBy) {
        if (sortBy == null) return Sort.by(Sort.Direction.DESC, "createdAt");
        return switch (sortBy.toLowerCase()) {
            case "price_asc", "price-asc" -> Sort.by(Sort.Direction.ASC, "price");
            case "price_desc", "price-desc" -> Sort.by(Sort.Direction.DESC, "price");
            case "popular", "best_seller" -> Sort.by(Sort.Direction.DESC, "soldCount");
            case "rating", "rating_desc" -> Sort.by(Sort.Direction.DESC, "rating");
            case "name_asc" -> Sort.by(Sort.Direction.ASC, "name");
            default -> Sort.by(Sort.Direction.DESC, "createdAt");
        };
    }

    public ProductDTO mapToDTO(Product p) {
        return ProductDTO.builder()
                .id(p.getId())
                .name(p.getName())
                .slug(p.getSlug())
                .description(p.getDescription())
                .price(p.getPrice())
                .originalPrice(p.getOriginalPrice())
                .stockQuantity(p.getStockQuantity())
                .imageUrl(p.getImageUrl())
                .images(p.getImages() != null ? new ArrayList<>(p.getImages()) : new ArrayList<>())
                .rating(p.getRating() != null ? p.getRating() : 5.0)
                .reviewCount(p.getReviewCount() != null ? p.getReviewCount() : 0)
                .soldCount(p.getSoldCount() != null ? p.getSoldCount() : 0)
                .active(p.isActive())
                .categoryId(p.getCategory() != null ? p.getCategory().getId() : null)
                .categoryName(p.getCategory() != null ? p.getCategory().getName() : null)
                .categorySlug(p.getCategory() != null ? p.getCategory().getSlug() : null)
                .createdAt(p.getCreatedAt())
                .build();
    }
}

