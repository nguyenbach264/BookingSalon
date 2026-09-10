package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.Category;
import demo.bookingsalon.Exception.NotFoundException;
import demo.bookingsalon.Mapper.CategoryMapper;
import demo.bookingsalon.Payload.DTO.CategoryDTO;
import demo.bookingsalon.Payload.DTO.SalonDTO;
import demo.bookingsalon.Repository.CategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    public Category createCategory(CategoryDTO categoryDTO, SalonDTO salonDTO) {
        Category category = new Category();
        if (categoryDTO.getCategoryName() != null && !categoryDTO.getCategoryName().isEmpty())
            category.setCategoryName(categoryDTO.getCategoryName());
        if (categoryDTO.getImage() != null && !categoryDTO.getImage().isEmpty())
            category.setImage(categoryDTO.getImage());
        if (salonDTO.getId().toString() != null && !salonDTO.getId().toString().isEmpty())
            category.setId(UUID.fromString(categoryDTO.getSalonId().toString()));

        return categoryRepository.save(category);
    }

    public Set<CategoryDTO> getCategories() {
        Set<CategoryDTO> categoryDTOs = categoryRepository.findAll().stream()
                .map((category) -> {
                    CategoryDTO categoryDTO = categoryMapper.toCategoryDTO(category);
                    return categoryDTO;
                })
                .collect(Collectors.toSet());
        return categoryDTOs;
    }

    public CategoryDTO getCategoryById(String id) {
        Category category = categoryRepository.findById(id).orElseThrow(() ->
                new NotFoundException("Category not exist"));
        return categoryMapper.toCategoryDTO(category);
    }

//    public CategoryDTO getCategoryBySalonId(String salonId) {
//        Category category = categoryRepository.findBySalonId(UUID.fromString(salonId));
//        if (category == null) throw new NotFoundException("Category not exist");
//        return categoryMapper.toCategoryDTO(category);
//    }

    public Category updateCategory(CategoryDTO categoryDTO, SalonDTO salonDTO) {
        Category category = categoryRepository.findById(categoryDTO.getId().toString()).orElseThrow(() ->
                new NotFoundException("Category not exist"));

        if (categoryDTO.getCategoryName() != null && !categoryDTO.getCategoryName().isEmpty())
            category.setCategoryName(categoryDTO.getCategoryName());
        if (categoryDTO.getImage() != null && !categoryDTO.getImage().isEmpty())
            category.setImage(categoryDTO.getImage());
        if (salonDTO.getId().toString() != null && !salonDTO.getId().toString().isEmpty())
            category.setId(UUID.fromString(categoryDTO.getSalonId().toString()));
        return categoryRepository.save(category);
    }

    public String deleteCategory(String categoryId) {
        Category category = categoryRepository.findById(categoryId).orElseThrow(() ->
                new NotFoundException("Category not exist"));

        categoryRepository.delete(category);
        return "Delete category successfully";
    }

    public static class PaymentApplicationService {
    }
}
