package demo.bookingsalon.mapper;

import demo.bookingsalon.entity.User;
import demo.bookingsalon.dto.UserDTO;
import demo.bookingsalon.dto.request.business.CreateUserRequest;
import demo.bookingsalon.dto.response.business.UserResponse;
import org.keycloak.representations.idm.UserRepresentation;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UserMapper {
    User toUserByUserDTO(UserDTO userDTO);

    User toUserByUserResponse(UserResponse userResponse);

    User toUserByCreateUserRequest(CreateUserRequest userRequest);

    User toUserByUserReponse(UserResponse userResponse);

    UserResponse toUserResponseByUser(User user);

    UserResponse toUserResponseByUserRep(UserRepresentation user);
}
