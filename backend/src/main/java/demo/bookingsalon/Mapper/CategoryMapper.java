package demo.bookingsalon.Mapper;

import demo.bookingsalon.Entity.Category;
import demo.bookingsalon.Payload.DTO.CategoryDTO;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface CategoryMapper {
    CategoryDTO toCategoryDTO(Category category);
}
