package demo.bookingsalon.Security.RateLimit;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RateLimit {

    /**
     * Tiền tố định danh nghiệp vụ cho Rate Limit Key trong Redis (vd: "booking", "order", "voucher", "upload")
     */
    String keyPrefix() default "api";

    /**
     * Phân loại đối tượng áp dụng giới hạn
     */
    RateLimitType type() default RateLimitType.IP_OR_USER;

    /**
     * Số lượng request tối đa cho phép trong một khung thời gian
     */
    int capacity() default 10;

    /**
     * Thời lượng của khung thời gian (tính bằng giây). Mặc định 60 giây (1 phút)
     */
    int durationSeconds() default 60;

    /**
     * Thông báo trả về cho Client khi bị chặn bởi Rate Limiter
     */
    String message() default "Bạn đang thực hiện thao tác quá nhanh. Vui lòng chờ giây lát rồi thử lại!";
}

