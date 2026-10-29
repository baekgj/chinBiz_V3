package com.chinbiz.api.edu;

import com.chinbiz.api.product.Product;
import com.chinbiz.api.product.ProductRepository;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 본사 [교육관리]-[교육자료 등록] (docs/32, MASTER_ADMIN).
 *  - GET    /api/education/materials?productId=   : 등록 자료 목록(상품명·다운로드 수 포함)
 *  - POST   /api/education/materials (multipart)   : productId, title, description?, file
 *  - DELETE /api/education/materials/{id}          : 자료 삭제(파일 포함)
 *  - GET    /api/education/materials/{id}/download : 관리자 확인용 다운로드
 */
@RestController
@RequestMapping("/api/education/materials")
public class EduMaterialController {

    private final EduMaterialRepository repo;
    private final EduMaterialDownloadRepository downloadRepo;
    private final ProductRepository productRepo;
    private final EduMaterialStorage storage;

    public EduMaterialController(EduMaterialRepository repo, EduMaterialDownloadRepository downloadRepo,
                                 ProductRepository productRepo, EduMaterialStorage storage) {
        this.repo = repo; this.downloadRepo = downloadRepo; this.productRepo = productRepo; this.storage = storage;
    }

    @GetMapping
    public List<Map<String, Object>> list(@RequestParam(required = false) Long productId) {
        List<EduMaterial> rows = productId == null ? repo.findAllByOrderByIdDesc() : repo.findByProductIdOrderByIdAsc(productId);
        Map<Long, String> pn = productRepo.findAllById(rows.stream().map(EduMaterial::getProductId).distinct().toList())
                .stream().collect(Collectors.toMap(Product::getId, Product::getName, (a, b) -> a));
        return rows.stream().map(m -> {
            Map<String, Object> o = dto(m);
            o.put("productName", pn.get(m.getProductId()));
            o.put("downloadCount", downloadRepo.countByMaterialId(m.getId()));
            return o;
        }).toList();
    }

    @PostMapping(consumes = "multipart/form-data")
    public ResponseEntity<?> create(Authentication auth,
                                    @RequestParam Long productId,
                                    @RequestParam String title,
                                    @RequestParam(required = false) String description,
                                    @RequestParam("file") MultipartFile file) throws IOException {
        if (productRepo.findById(productId).isEmpty())
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "상품을 찾을 수 없습니다."));
        if (title == null || title.isBlank()) return ResponseEntity.badRequest().body(Map.of("message", "자료명을 입력해 주세요."));
        if (file == null || file.isEmpty()) return ResponseEntity.badRequest().body(Map.of("message", "업로드할 파일을 선택해 주세요."));

        EduMaterial m = new EduMaterial();
        m.setProductId(productId);
        m.setTitle(title.trim());
        m.setDescription(description == null || description.isBlank() ? null : description.trim());
        m.setStoredName(storage.save(file));
        String original = file.getOriginalFilename();
        m.setOriginalName(original == null || original.isBlank() ? m.getStoredName() : baseName(original));
        m.setContentType(file.getContentType());
        m.setFileSize(file.getSize());
        m.setCreatedBy(auth == null ? null : auth.getName());
        repo.save(m);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto(m));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        EduMaterial m = repo.findById(id).orElse(null);
        if (m == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "교육자료를 찾을 수 없습니다."));
        repo.delete(m);
        storage.delete(m.getStoredName());
        return ResponseEntity.ok(Map.of("message", "삭제되었습니다."));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id) throws IOException {
        EduMaterial m = repo.findById(id).orElse(null);
        ResponseEntity<Resource> res = m == null ? null : storage.download(m);
        return res != null ? res : ResponseEntity.notFound().build();
    }

    /** 경로 구분자 제거(브라우저별 전체경로 전송 대비) */
    private static String baseName(String name) {
        String n = name.replace('\\', '/');
        return n.substring(n.lastIndexOf('/') + 1);
    }

    static Map<String, Object> dto(EduMaterial m) {
        Map<String, Object> o = new LinkedHashMap<>();
        o.put("id", m.getId());
        o.put("productId", m.getProductId());
        o.put("title", m.getTitle());
        o.put("description", m.getDescription());
        o.put("fileName", m.getOriginalName());
        o.put("fileSize", m.getFileSize());
        o.put("createdAt", m.getCreatedAt() == null ? null : m.getCreatedAt().toString());
        return o;
    }
}
