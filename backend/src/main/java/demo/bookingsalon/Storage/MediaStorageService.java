package demo.bookingsalon.Storage;


import demo.bookingsalon.Payload.Response.Business.MediaUploadResponse;
import org.springframework.web.multipart.MultipartFile;

public interface MediaStorageService {

    MediaUploadResponse upload(MultipartFile file, String folder);

    void delete(String publicId, String resourceType);
}