package demo.bookingsalon.Controller;

import demo.bookingsalon.Enum.MediaOwnerType;
import demo.bookingsalon.Payload.Response.Business.MediaResponse;
import demo.bookingsalon.Service.MediaApplicationService;
import jakarta.validation.constraints.NotNull;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaApplicationService mediaApplicationService;

    // UPLOAD ONE
    @PostMapping(
            value = "/{ownerType}/{ownerId}",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<MediaResponse> upload(
            @PathVariable MediaOwnerType ownerType,
            @PathVariable UUID ownerId,
            @RequestPart("file") @NotNull MultipartFile file
    ) {
        MediaResponse response = mediaApplicationService.upload(ownerType, ownerId, file);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }


    // UPLOAD MULTIPLE
    @PostMapping(
            value = "/{ownerType}/{ownerId}/batch",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<List<MediaResponse>> uploadMultiple(
            @PathVariable MediaOwnerType ownerType,
            @PathVariable UUID ownerId,
            @RequestPart("files") List<MultipartFile> files
    ) {

        List<MediaResponse> response = mediaApplicationService.uploadMultiple(ownerType, ownerId, files);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // GET ALL
    @GetMapping("/{ownerType}/{ownerId}")
    public ResponseEntity<List<MediaResponse>> getMedias(
            @PathVariable MediaOwnerType ownerType,
            @PathVariable UUID ownerId
    ) {

        return ResponseEntity.ok(mediaApplicationService.getMedias(ownerType, ownerId));
    }


    // GET ONE
    @GetMapping("/{ownerType}/{ownerId}/{mediaId}")
    public ResponseEntity<MediaResponse> getMedia(
            @PathVariable MediaOwnerType ownerType,
            @PathVariable UUID ownerId,
            @PathVariable UUID mediaId
    ) {

        return ResponseEntity.ok(mediaApplicationService.getMedia(ownerType, ownerId, mediaId));
    }


    // SET PRIMARY
    @PatchMapping("/{ownerType}/{ownerId}/{mediaId}/primary")
    public ResponseEntity<Void> setPrimary(
            @PathVariable MediaOwnerType ownerType,
            @PathVariable UUID ownerId,
            @PathVariable UUID mediaId
    ) {
        mediaApplicationService.setPrimary(ownerType, ownerId, mediaId);
        return ResponseEntity.noContent().build();
    }


    // DELETE
    @DeleteMapping("/{ownerType}/{ownerId}/{mediaId}")
    public ResponseEntity<Void> delete(
            @PathVariable MediaOwnerType ownerType,
            @PathVariable UUID ownerId,
            @PathVariable UUID mediaId
    ) {
        mediaApplicationService.delete(ownerType, ownerId, mediaId);
        return ResponseEntity.noContent().build();
    }
}
