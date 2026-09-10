package demo.bookingsalon.Mapper;

import demo.bookingsalon.Entity.Media;
import demo.bookingsalon.Payload.Response.Business.MediaResponse;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface MediaMapper {
    MediaResponse toMediaResponse(Media media);
}
