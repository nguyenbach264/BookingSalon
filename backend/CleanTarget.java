import java.nio.file.*;

public class CleanTarget {
    public static void main(String[] args) throws Exception {
        Path targetPath = Paths.get("target");
        if (Files.exists(targetPath)) {
            Files.walk(targetPath)
                    .sorted((a, b) -> b.compareTo(a))
                    .forEach(p -> {
                        try {
                            Files.delete(p);
                            System.out.println("Deleted: " + p);
                        } catch (Exception e) {
                            System.err.println("Failed to delete: " + p);
                        }
                    });
        }
        System.out.println("Target folder cleanup complete!");
    }
}
