package demo.bookingsalon.Utility;

import lombok.extern.slf4j.Slf4j;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileReader;
import java.io.IOException;

@Slf4j
public class DotenvLoader {

    public static void load() {
        File[] possibleFiles = new File[] {
                new File(".env"),
                new File("backend/.env"),
                new File("../.env"),
                new File("../backend/.env")
        };

        File envFile = null;
        for (File f : possibleFiles) {
            if (f.exists() && f.isFile()) {
                envFile = f;
                break;
            }
        }

        if (envFile == null) {
            log.info(">>> [DotenvLoader] No .env file found in default locations. Relying on system environment variables.");
            return;
        }

        int count = 0;
        try (BufferedReader reader = new BufferedReader(new FileReader(envFile))) {
            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                    continue;
                }
                int idx = line.indexOf('=');
                String key = line.substring(0, idx).trim();
                String value = line.substring(idx + 1).trim();

                // Loại bỏ dấu nháy đơn/kép bao quanh nếu có
                if ((value.startsWith("\"") && value.endsWith("\"") && value.length() >= 2) ||
                    (value.startsWith("'") && value.endsWith("'") && value.length() >= 2)) {
                    value = value.substring(1, value.length() - 1);
                }

                // Thiết lập vào System Properties nếu chưa tồn tại
                if (System.getProperty(key) == null && System.getenv(key) == null) {
                    System.setProperty(key, value);
                    count++;
                }
            }
            log.info(">>> [DotenvLoader] Successfully loaded {} environment variables from: {}", count, envFile.getAbsolutePath());
        } catch (IOException e) {
            log.error(">>> [DotenvLoader] Error reading .env file: {}", e.getMessage());
        }
    }
}