package demo.bookingsalon.Payload.Request.Business;

import lombok.Data;

@Data
public class UpdateUserRequest {

    private String fullName;

    private String email;

    private String address;

    private String phoneNumber;

    private String avatarUrl;

    private String gender;

    private String city;

    private String district;

    private String ward;

    private Boolean enabled;
}
