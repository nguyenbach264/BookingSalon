package demo.bookingsalon.storage;


import demo.bookingsalon.dto.response.business.MediaUploadResponse;
import org.springframework.web.multipart.MultipartFile;

public interface MediaStorageService {

    MediaUploadResponse upload(MultipartFile file, String folder);

    void delete(String publicId, String resourceType);
}