package demo.bookingsalon.Payload.Response.Business;

public record MediaUploadResponse(

            String publicId,

            String secureUrl,

            String resourceType,

            String format,

            Long fileSize,

            Integer width,

            Integer height
    ) {
    }
