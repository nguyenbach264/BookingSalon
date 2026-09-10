package demo.bookingsalon.Payload.Response.Business;

import lombok.Data;

import java.util.UUID;

@Data
public class ServiceOfferingResponse {

    private UUID id;

    private String name;

    private String description;

    private Double price;

    private int duration;

    private String image;

    private UUID salonId;

    private UUID categoryId;

}
