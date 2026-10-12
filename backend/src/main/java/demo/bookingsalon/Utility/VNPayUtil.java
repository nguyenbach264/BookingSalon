package demo.bookingsalon.Utility;

import java.nio.charset.StandardCharsets;
import java.util.*;

public class VNPayUtil {
    
    /**
     * Tạo chữ ký SHA256 từ dữ liệu và secret key
     */
    public static String hmacSHA512(String key, String data) {
        try {
            byte[] hmacKey = key.getBytes(StandardCharsets.UTF_8);
            String algorithm = "HmacSHA512";
            javax.crypto.Mac hmac = javax.crypto.Mac.getInstance(algorithm);
            javax.crypto.spec.SecretKeySpec secretKey = new javax.crypto.spec.SecretKeySpec(
                    hmacKey,
                    0,
                    hmacKey.length,
                    algorithm);
            hmac.init(secretKey);
            
            byte[] dataBytes = data.getBytes(StandardCharsets.UTF_8);
            byte[] result = hmac.doFinal(dataBytes);
            
            StringBuilder sb = new StringBuilder(2 * result.length);
            for (byte b : result) {
                sb.append(String.format("%02x", b & 0xff));
            }
            return sb.toString();
        } catch (Exception e) {
            e.printStackTrace();
            return "";
        }
    }
    
    /**
     * Tạo chữ ký từ danh sách tham số (tương thích 100% với verifySignature)
     */
    public static String generateSignature(Map<String, String> params, String secretKey) {
        SortedMap<String, String> sortedParams = new TreeMap<>(params);
        sortedParams.remove("vnp_SecureHash");
        sortedParams.remove("vnp_SecureHashType");

        StringBuilder hashData = new StringBuilder();
        for (Map.Entry<String, String> entry : sortedParams.entrySet()) {
            if (entry.getValue() != null && !entry.getValue().isEmpty()) {
                hashData.append(entry.getKey()).append("=")
                        .append(entry.getValue()).append("&");
            }
        }

        if (hashData.length() > 0) {
            hashData.deleteCharAt(hashData.length() - 1);
        }

        return hmacSHA512(secretKey, hashData.toString());
    }

    /**
     * Verify chữ ký từ VNPay callback
     */
    public static boolean verifySignature(Map<String, String> params, String secretKey, String vnp_SecureHash) {
        if (vnp_SecureHash == null || vnp_SecureHash.isBlank()) {
            return false;
        }
        String computedHash = generateSignature(params, secretKey);
        return computedHash.equalsIgnoreCase(vnp_SecureHash);
    }
    
    /**
     * Parse số tiền từ VNPay (VNPay gửi số tiền x100)
     */
    public static long parseAmount(String vnpAmount) {
        try {
            return Long.parseLong(vnpAmount) / 100;
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
