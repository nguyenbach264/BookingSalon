package demo.bookingsalon.Utility;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import demo.bookingsalon.Configuration.SepayConfig;
import demo.bookingsalon.Exception.QrGenerateException;
import demo.bookingsalon.Payload.Request.Business.SepayPaymentRequest;
import demo.bookingsalon.Payload.Response.Business.SepayPaymentResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Base64;

@Component
@RequiredArgsConstructor
@Slf4j
public class QRCodeGenerator {
    private final SepayConfig sepayConfig;
    private final RestTemplate restTemplate;
    private static final int QR_WIDTH = 300;
    private static final int QR_HEIGHT = 300;


    //Generate QR Code as Base64 PNG String
    public String generateQRCodeAsBase64(String data) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, QR_WIDTH, QR_HEIGHT);
            
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            
            byte[] pngData = pngOutputStream.toByteArray();
            String base64Image = Base64.getEncoder().encodeToString(pngData);
            
            log.info("QR Code generated successfully");
//            Files.write( // Test tạo thử ảnh qr code vào local disk
//                    Paths.get("E:/qr-test.png"),
//                    pngData
//            );
            return "data:image/png;base64," + base64Image;
        } catch (WriterException e) {
            log.error("Error generating QR code", e);
            throw new RuntimeException("Failed to generate QR code", e);
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    // Generate QR Code with custom size
    public String generateQRCodeAsBase64(String data, int width, int height) {
        try {
            QRCodeWriter qrCodeWriter = new QRCodeWriter();
            BitMatrix bitMatrix = qrCodeWriter.encode(data, BarcodeFormat.QR_CODE, width, height);
            
            ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
            MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            
            byte[] pngData = pngOutputStream.toByteArray();
            String base64Image = Base64.getEncoder().encodeToString(pngData);
            
            log.info("QR Code generated with size {}x{}", width, height);
            return "data:image/png;base64," + base64Image;
        } catch (WriterException | IOException e) {
            log.error("Error generating QR code", e);
            throw new RuntimeException("Failed to generate QR code", e);
        }
    }

    // Generate VietQR code thành công thì có theer thực hiện những yếu tố khác có trong
    public SepayPaymentResponse createSepayPayment(SepayPaymentRequest qrRequest) {
        log.info("Creating Sepay payment for booking: {}", qrRequest.getOrderInvoiceNumber());

        try {
            String url = sepayConfig.getApiBaseUrl() + "/v1/checkout/init";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", sepayConfig.getBasicAuthHeader());

            HttpEntity<SepayPaymentRequest> httpEntity = new HttpEntity<>(qrRequest, headers);

            ResponseEntity<SepayPaymentResponse> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    httpEntity,
                    SepayPaymentResponse.class
            );

            if (response.getBody() == null) {
                throw new QrGenerateException("Empty payment response from Sepay");
            }

            log.info("Sepay payment created successfully for booking: {} with id: {}",
                    qrRequest.getOrderInvoiceNumber(), response.getBody().getOrderId());
            return response.getBody();
        } catch (Exception ex) {
            log.error("Failed to create Sepay payment", ex);
            throw new QrGenerateException("Generate QR code failed");
        }
    }

//    public byte[] generateVietQrCode(SepayPaymentRequest qrRequest, int width, int height) {
//        log.info("Creating Sepay payment for booking: {}", qrRequest.getOrderInvoiceNumber());
//
//        try {
//            String url = sepayConfig.getApiBaseUrl() + "/v1/checkout/init";
//
//            HttpHeaders headers = new HttpHeaders();
//            headers.setContentType(MediaType.APPLICATION_JSON);
//            headers.set("Authorization", sepayConfig.getBasicAuthHeader());
//
//            HttpEntity<SepayPaymentRequest> httpEntity = new HttpEntity<>(qrRequest, headers);
//
//            ResponseEntity<SepayPaymentResponse> response = restTemplate.exchange(
//                    url,
//                    HttpMethod.POST,
//                    httpEntity,
//                    SepayPaymentResponse.class
//            );
//
//            if (response.getBody() == null) {
//                throw new QrGenerateException("Empty payment response from Sepay");
//            }
//
//            log.info("Sepay payment created successfully for booking: {} with id: {}",
//                    qrRequest.getOrderInvoiceNumber(), response.getBody().getOrderId());
//            return response.getBody();
//        } catch (Exception ex) {
//            log.error("Failed to create Sepay payment", ex);
//            throw new QrGenerateException("Generate QR code failed");
//        }
//    }
}
