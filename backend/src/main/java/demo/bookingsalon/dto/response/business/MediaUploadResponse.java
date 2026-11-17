package demo.bookingsalon.dto.response.business;

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
