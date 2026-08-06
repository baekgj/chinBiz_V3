package com.chinbiz.api.category;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 카테고리 관리 API (본사 마스터 어드민 전용).
 */
@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryRepository repo;

    public CategoryController(CategoryRepository repo) { this.repo = repo; }

    private Map<String, Object> dto(Category c) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", c.getId());
        m.put("level", c.getLevel().name());
        m.put("name", c.getName());
        m.put("parentId", c.getParentId());
        m.put("status", c.getStatus().name());
        return m;
    }

    /** 전체 목록 */
    @GetMapping
    public List<Map<String, Object>> list() {
        return repo.findAllByOrderByLevelAscIdAsc().stream().map(this::dto).toList();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return repo.findById(id).map(c -> ResponseEntity.ok((Object) dto(c)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "카테고리를 찾을 수 없습니다.")));
    }

    public record CategoryRequest(String level, String name, Long parentId) {}

    /** 등록 */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody CategoryRequest req) {
        if (req.name() == null || req.name().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "카테고리명을 입력해 주세요."));
        Category c = new Category();
        c.setLevel(parseLevel(req.level()));
        c.setName(req.name().trim());
        c.setParentId(req.parentId());
        repo.save(c);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto(c));
    }

    /** 수정 */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody CategoryRequest req) {
        Category c = repo.findById(id).orElse(null);
        if (c == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "카테고리를 찾을 수 없습니다."));
        if (req.level() != null) c.setLevel(parseLevel(req.level()));
        if (req.name() != null && !req.name().isBlank()) c.setName(req.name().trim());
        c.setParentId(req.parentId());
        repo.save(c);
        return ResponseEntity.ok(dto(c));
    }

    /** 게시/중지 토글 */
    @PostMapping("/{id}/toggle")
    public ResponseEntity<?> toggle(@PathVariable Long id) {
        Category c = repo.findById(id).orElse(null);
        if (c == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "카테고리를 찾을 수 없습니다."));
        c.setStatus(c.getStatus() == Category.Status.ACTIVE ? Category.Status.INACTIVE : Category.Status.ACTIVE);
        repo.save(c);
        return ResponseEntity.ok(dto(c));
    }

    private Category.Level parseLevel(String s) {
        try { return Category.Level.valueOf(s); } catch (Exception e) { return Category.Level.LARGE; }
    }
}
