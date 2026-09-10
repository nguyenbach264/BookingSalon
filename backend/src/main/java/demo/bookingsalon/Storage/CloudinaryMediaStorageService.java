package demo.bookingsalon.Storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import demo.bookingsalon.Payload.Response.Business.MediaUploadResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CloudinaryMediaStorageService implements MediaStorageService {

    private final Cloudinary cloudinary;

    @Override
    public MediaUploadResponse upload(MultipartFile file, String folder) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                            "folder", folder,
                            "resource_type", "auto"
                    )
            );

            return new MediaUploadResponse(
                    (String) result.get("public_id"),
                    (String) result.get("secure_url"),
                    (String) result.get("resource_type"),
                    (String) result.get("format"),
                    getLong(result.get("bytes")),
                    getInteger(result.get("width")),
                    getInteger(result.get("height"))
            );

        } catch (IOException e) {
            throw new RuntimeException("Failed to upload media to Cloudinary", e);
        }
    }

    @Override
    public void delete(String publicId, String resourceType) {
        try {
            cloudinary.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", resourceType));
        } catch (Exception e) {
            throw new RuntimeException("Failed to delete media from Cloudinary", e);
        }
    }

    private Long getLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }

        return null;
    }

    private Integer getInteger(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }

        return null;
    }
}
