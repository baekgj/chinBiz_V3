package com.chinbiz.api.terms;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 약관 조회/관리.
 *  - GET  /api/public/terms/{code} : 공개 조회 (home/회원가입/입점신청 노출용)
 *  - GET  /api/org/terms           : 약관 목록 (MASTER_ADMIN)
 *  - GET  /api/org/terms/{code}    : 단건
 *  - PUT  /api/org/terms/{code}    : 제목/내용 수정
 */
@RestController
public class TermController {

    private final TermRepository repo;

    public TermController(TermRepository repo) { this.repo = repo; }

    private Map<String, Object> dto(Term t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("code", t.getCode());
        m.put("title", t.getTitle());
        m.put("content", t.getContent());
        m.put("updatedAt", t.getUpdatedAt() == null ? null : t.getUpdatedAt().toString());
        return m;
    }

    @GetMapping("/api/public/terms/{code}")
    public ResponseEntity<?> publicGet(@PathVariable String code) {
        Term t = repo.findById(code).orElse(null);
        if (t == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "약관을 찾을 수 없습니다."));
        return ResponseEntity.ok(dto(t));
    }

    @GetMapping("/api/org/terms")
    public List<Map<String, Object>> list() {
        return repo.findAllByOrderBySortOrderAscCodeAsc().stream().map(this::dto).toList();
    }

    @GetMapping("/api/org/terms/{code}")
    public ResponseEntity<?> get(@PathVariable String code) {
        return repo.findById(code).map(t -> ResponseEntity.ok((Object) dto(t)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "약관을 찾을 수 없습니다.")));
    }

    public record TermRequest(String title, String content) {}

    @PutMapping("/api/org/terms/{code}")
    public ResponseEntity<?> update(@PathVariable String code, @RequestBody TermRequest req) {
        Term t = repo.findById(code).orElse(null);
        if (t == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "약관을 찾을 수 없습니다."));
        if (req.title() != null && !req.title().isBlank()) t.setTitle(req.title().trim());
        t.setContent(req.content());
        repo.save(t);
        return ResponseEntity.ok(Map.of("message", "저장되었습니다.", "code", code));
    }
}
