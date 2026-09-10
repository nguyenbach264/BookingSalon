package demo.bookingsalon.Service;

import demo.bookingsalon.Entity.Media;
import demo.bookingsalon.Enum.MediaOwnerType;
import demo.bookingsalon.Enum.MediaStatus;
import demo.bookingsalon.Payload.Response.Business.MediaResponse;
import demo.bookingsalon.Payload.Response.Business.MediaUploadResponse;
import demo.bookingsalon.Repository.MediaRepository;
import demo.bookingsalon.Storage.MediaFolderResolver;
import demo.bookingsalon.Storage.MediaStorageService;
import demo.bookingsalon.Utility.SlugGenerator;
import demo.bookingsalon.Validation.MediaValidation;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MediaApplicationService {

    private final MediaRepository mediaRepository;

    private final MediaStorageService mediaStorageService;

    private final MediaOwnerResolver mediaOwnerResolver;

    private final MediaFolderResolver mediaFolderResolver;

    private final MediaValidation mediaValidation;

    // UPLOAD
    @Transactional
    public MediaResponse upload(MediaOwnerType ownerType, UUID ownerId, MultipartFile file) {
        mediaValidation.validate(file);
        /*
         * 1. Kiểm tra owner tồn tại
         */
        MediaOwner owner = mediaOwnerResolver.resolve(ownerType, ownerId);

        /*
         * 2. Xác định Cloudinary folder
         * booking-salon/services/massage-body-uuid
         */
        String folder = mediaFolderResolver.resolve(ownerType, owner.slug(), ownerId);

        // 3. Upload Cloudinary
        MediaUploadResponse uploadResult = mediaStorageService.upload(file, folder);

        try {
            // 4. Lấy số thứ tự hiện tại.
            long currentCount = mediaRepository.countByOwnerTypeAndOwnerIdAndStatus(
                    ownerType, ownerId, MediaStatus.ACTIVE);

            // 5. Nếu owner chưa có ảnh thì ảnh đầu tiên sẽ là primary.
            boolean primary = currentCount == 0;

            // 6. Tạo entity.
            Media media = Media.builder()
                    .ownerType(ownerType)
                    .ownerId(ownerId)
                    .publicId(uploadResult.publicId())
                    .secureUrl(uploadResult.secureUrl())
                    .resourceType(uploadResult.resourceType())
                    .format(uploadResult.format())
                    .originalFilename(file.getOriginalFilename())
                    .fileSize(uploadResult.fileSize())
                    .width(uploadResult.width())
                    .height(uploadResult.height())
                    .primary(primary)
                    .sortOrder((int) currentCount)
                    .status(MediaStatus.ACTIVE)
                    .build();

            // 7. Save DB.
            Media saved = mediaRepository.save(media);

            return MediaResponse.from(saved);
        } catch (Exception exception) {
            // Cloudinary upload thành công nhưng DB thất bại → Xóa Cloudinary để tránh orphan file.
            try {
                mediaStorageService.delete(uploadResult.publicId(), uploadResult.resourceType());
            } catch (Exception cleanupException) {
                // Production: log.error(...) Sau này có thể dùng cleanup job để xử lý.
            }

            throw exception;
        }
    }


    // UPLOAD MULTIPLE
    @Transactional
    public List<MediaResponse> uploadMultiple(MediaOwnerType ownerType, UUID ownerId, List<MultipartFile> files) {

        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("Files must not be empty");
        }

        // Kiểm tra owner một lần trước.
        mediaOwnerResolver.resolve(ownerType, ownerId);

        return files.stream()
                .map(file -> upload(ownerType, ownerId, file))
                .toList();
    }


    // GET ALL
    @Transactional(readOnly = true)
    public List<MediaResponse> getMedias(MediaOwnerType ownerType, UUID ownerId) {

        // Đảm bảo owner tồn tại.

        mediaOwnerResolver.resolve(ownerType, ownerId);

        return mediaRepository.findByOwnerTypeAndOwnerIdAndStatusOrderBySortOrderAscCreatedAtAsc(
                        ownerType, ownerId, MediaStatus.ACTIVE)
                .stream()
                .map(MediaResponse::from)
                .toList();
    }

    // GET ONE
    @Transactional(readOnly = true)
    public MediaResponse getMedia(MediaOwnerType ownerType, UUID ownerId, UUID mediaId) {

        Media media = mediaRepository.findByIdAndOwnerTypeAndOwnerIdAndStatus(
                        mediaId, ownerType, ownerId, MediaStatus.ACTIVE)
                        .orElseThrow(() -> new RuntimeException("Media not found"));

        return MediaResponse.from(media);
    }


    // SET PRIMARY
    @Transactional
    public void setPrimary(MediaOwnerType ownerType, UUID ownerId, UUID mediaId) {

        Media media = mediaRepository.findByIdAndOwnerTypeAndOwnerIdAndStatus(
                                mediaId, ownerType, ownerId, MediaStatus.ACTIVE)
                        .orElseThrow(() -> new RuntimeException("Media not found"));

        // Tất cả media của owner → primary = false.
        mediaRepository.clearPrimary(ownerType, ownerId);

        // Media được chọn → primary = true.
        media.setPrimary(true);
        mediaRepository.save(media);
    }


    // DELETE
    @Transactional
    public void delete(MediaOwnerType ownerType, UUID ownerId, UUID mediaId) {

        Media media = mediaRepository.findByIdAndOwnerTypeAndOwnerIdAndStatus(
                mediaId, ownerType, ownerId, MediaStatus.ACTIVE
                ).orElseThrow(() -> new RuntimeException("Media not found"));

        //Delete Cloudinary. Nếu Cloudinary fail → không update DB.
        mediaStorageService.delete(media.getPublicId(), media.getResourceType());

        // soft delete metadata.
        media.setStatus(MediaStatus.DELETED);

        mediaRepository.save(media);
    }

}
