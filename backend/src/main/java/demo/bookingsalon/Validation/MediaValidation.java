package demo.bookingsalon.Validation;

import demo.bookingsalon.Exception.MediaValidationException;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.util.Set;

@Component
public class MediaValidation {
    private static final Set<String> IMAGE_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    private static final Set<String> VIDEO_TYPES = Set.of("video/mp4", "video/webm", "video/quicktime");

    private static final long MAX_IMAGE_SIZE = 10 * 1024 * 1024;
    private static final long MAX_VIDEO_SIZE = 100 * 1024 * 1024;

    public void validate(MultipartFile file) {
        validateCommon(file);

        String contentType = file.getContentType();

        if (IMAGE_TYPES.contains(contentType)) {
            validateImage(file);
            return;
        }

        if (VIDEO_TYPES.contains(contentType)) {
            validateVideo(file);
            return;
        }

        throw new MediaValidationException("Unsupported media type: " + contentType);
    }

    private void validateCommon(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new MediaValidationException("File is required");
        }
    }

    private void validateImage(MultipartFile file) {
        if (file.getSize() > MAX_IMAGE_SIZE) {
            throw new MediaValidationException("Image size must not exceed 10MB");
        }
    }

    private void validateVideo(MultipartFile file) {
        if (file.getSize() > MAX_VIDEO_SIZE) {
            throw new MediaValidationException("Video size must not exceed 100MB");
        }
    }
}


//    public void validate(MultipartFile file, MediaType mediaType) {
//        validateCommon(file);
//
//        switch (mediaType) {
//            case IMAGE -> validateImage(file);
//            case VIDEO -> validateVideo(file);
//        }
//    }
//
//    private void validateCommon(MultipartFile file) {
//        if (file == null || file.isEmpty()) {
//            throw new MediaValidationException("File is required");
//        }
//    }
//
//    private void validateImage(MultipartFile file) {
//        validateContentType(file, Set.of("image/jpeg", "image/png", "image/webp"));
//
//        if (file.getSize() > 10 * 1024 * 1024) {
//            throw new MediaValidationException("Image size must not exceed 10MB");
//        }
//    }
//
//    private void validateVideo(MultipartFile file) {
//        validateContentType(file, Set.of("video/mp4", "video/webm", "video/quicktime"));
//
//        if (file.getSize() > 100 * 1024 * 1024) {
//            throw new MediaValidationException("Video size must not exceed 100MB");
//        }
//    }
//
//    private void validateContentType(MultipartFile file, Set<String> allowedTypes) {
//        String contentType = file.getContentType();
//
//        if (!allowedTypes.contains(contentType)) {
//            throw new MediaValidationException("Unsupported media type: " + contentType);
//        }
//    }
//}
