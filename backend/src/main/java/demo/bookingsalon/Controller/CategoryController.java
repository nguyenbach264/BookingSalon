package demo.bookingsalon.Controller;

import demo.bookingsalon.Payload.DTO.CategoryDTO;
import demo.bookingsalon.Payload.DTO.SalonDTO;
import demo.bookingsalon.Service.CategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Set;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {
    private final CategoryService categoryService;

    @GetMapping()
    public ResponseEntity<Set<CategoryDTO>> getCategories() {
        return ResponseEntity.status(HttpStatus.OK).body(categoryService.getCategories());
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getCategoryById(@PathVariable String id) {
        return  ResponseEntity.status(HttpStatus.OK).body(categoryService.getCategoryById(id));
    }

//    @GetMapping("/salon/{id}")
//    public ResponseEntity<?> getCategoryBySalonId(@PathVariable String id) {
//        return ResponseEntity.status(HttpStatus.OK).body(categoryService.getCategoryBySalonId(id));
//    }

    @PostMapping()
    public ResponseEntity<?> createCategory(@RequestBody CategoryDTO categoryDTO,
                                            @RequestBody SalonDTO salonDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(categoryDTO, salonDTO));
    }

    @PutMapping()
    public ResponseEntity<?> updateCategory(@RequestBody CategoryDTO categoryDTO,
                                            @RequestBody SalonDTO salonDTO) {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(categoryService.updateCategory(categoryDTO, salonDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteCategory(@PathVariable String id) {
        return ResponseEntity.status(HttpStatus.NO_CONTENT).body(categoryService.deleteCategory(id));
    }
}
