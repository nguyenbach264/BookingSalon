package demo.bookingsalon.Utility;

import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

@Component
public class SlugGenerator {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");

    private static final Pattern NON_ALPHANUMERIC = Pattern.compile("[^a-zA-Z0-9]+");

    private static final Pattern MULTIPLE_HYPHENS = Pattern.compile("-+");

    public String generate(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("Cannot generate slug from empty value");
        }

        String slug = value.trim();

        /*
         * Ví dụ:
         *
         * "Massage Body 90 Phút"
         *
         * ↓ NFD
         *
         * "Massage Body 90 Phút"
         */
        slug = Normalizer.normalize(slug, Normalizer.Form.NFD);

        /*
         * Remove Unicode combining marks.
         */
        slug = DIACRITICS.matcher(slug).replaceAll("");

        /*
         * Vietnamese Đ / đ không phải combining character
         * nên phải xử lý riêng.
         */
        slug = slug.replace("Đ", "D")
                .replace("đ", "d");

        /*
         * Lowercase.
         */
        slug = slug.toLowerCase(Locale.ROOT);

        /*
         * Space và special character
         * chuyển thành "-".
         */
        slug = NON_ALPHANUMERIC.matcher(slug).replaceAll("-");

        /*
         * "massage---body"
         * ↓
         * "massage-body"
         */
        slug = MULTIPLE_HYPHENS.matcher(slug).replaceAll("-");

        /*
         * Xóa "-" ở đầu và cuối.
         */
        slug = slug
                .replaceAll("^-+", "")
                .replaceAll("-+$", "");

        if (slug.isBlank()) {
            throw new IllegalArgumentException("Cannot generate valid slug from value: " + value);
        }

        return slug;
    }
}
