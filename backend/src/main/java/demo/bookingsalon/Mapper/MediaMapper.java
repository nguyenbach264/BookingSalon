package demo.bookingsalon.mapper;

import demo.bookingsalon.entity.Media;
import demo.bookingsalon.dto.response.business.MediaResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MediaMapper {
    MediaResponse toMediaResponse(Media media);
}
