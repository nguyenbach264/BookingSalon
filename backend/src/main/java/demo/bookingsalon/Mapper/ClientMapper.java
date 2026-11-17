package demo.bookingsalon.mapper;

import demo.bookingsalon.dto.response.keycloak.ClientResponse;
import org.keycloak.representations.idm.ClientRepresentation;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface ClientMapper {
    ClientResponse toClientResponse(ClientRepresentation clientRepresentation);
}
