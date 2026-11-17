package demo.bookingsalon.dto.request.business;

import lombok.Builder;
import lombok.Data;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Data
@Builder
public class UploadMediaRequest {
    private String mediaFolder;
    private List<MultipartFile> fileList; 
}
