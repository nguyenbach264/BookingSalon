package demo.bookingsalon.mapper;

import demo.bookingsalon.entity.Category;
import demo.bookingsalon.dto.CategoryDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    CategoryDTO toCategoryDTO(Category category);
}
