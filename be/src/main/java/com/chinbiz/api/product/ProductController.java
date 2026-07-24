package com.chinbiz.api.product;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 상품 관리 API (본사 마스터 어드민 전용). CRUD + 필터 페이징.
 */
@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductRepository repo;

    public ProductController(ProductRepository repo) { this.repo = repo; }

    public record ProductRequest(
            String name, String rewardType, Long salePrice, Long totalAllowance,
            Long categoryId, Long partnerId,
            String image1, String image2, String image3, String image4, String image5,
            Long buzzReward, Long chinkuReward, Long managerReward, Long salesCenterReward,
            Long mgmtCenterReward, Long divisionReward, Long hqReward,
            String description, String installPolicy, String returnPolicy, Boolean onSale,
            String contractEndDate, Boolean installProduct,
            Boolean popular, Boolean recommended
    ) {}

    private Map<String, Object> dto(Product p) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("name", p.getName());
        m.put("rewardType", p.getRewardType().name());
        m.put("salePrice", p.getSalePrice());
        m.put("totalAllowance", p.getTotalAllowance());
        m.put("categoryId", p.getCategoryId());
        m.put("partnerId", p.getPartnerId());
        m.put("image1", p.getImage1()); m.put("image2", p.getImage2()); m.put("image3", p.getImage3());
        m.put("image4", p.getImage4()); m.put("image5", p.getImage5());
        m.put("buzzReward", p.getBuzzReward());
        m.put("chinkuReward", p.getChinkuReward());
        m.put("managerReward", p.getManagerReward());
        m.put("salesCenterReward", p.getSalesCenterReward());
        m.put("mgmtCenterReward", p.getMgmtCenterReward());
        m.put("divisionReward", p.getDivisionReward());
        m.put("hqReward", p.getHqReward());
        m.put("description", p.getDescription());
        m.put("installPolicy", p.getInstallPolicy());
        m.put("returnPolicy", p.getReturnPolicy());
        m.put("onSale", p.isOnSale());
        m.put("contractEndDate", p.getContractEndDate() == null ? null : p.getContractEndDate().toString());
        m.put("installProduct", p.isInstallProduct());
        m.put("popular", p.isPopular());
        m.put("recommended", p.isRecommended());
        m.put("createdAt", p.getCreatedAt() == null ? null : p.getCreatedAt().toString());
        return m;
    }

    /** 목록 (필터 + 페이징) */
    @GetMapping
    public Map<String, Object> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long partnerId,
            @RequestParam(required = false) Boolean onSale,
            @RequestParam(required = false) String keyword) {

        List<Specification<Product>> specs = new ArrayList<>();
        if (categoryId != null) specs.add((r, q, cb) -> cb.equal(r.get("categoryId"), categoryId));
        if (partnerId != null) specs.add((r, q, cb) -> cb.equal(r.get("partnerId"), partnerId));
        if (onSale != null) specs.add((r, q, cb) -> cb.equal(r.get("onSale"), onSale));
        if (keyword != null && !keyword.isBlank())
            specs.add((r, q, cb) -> cb.like(r.get("name"), "%" + keyword.trim() + "%"));
        Specification<Product> spec = specs.stream().reduce(Specification::and).orElse(null);

        Page<Product> pg = repo.findAll(spec, PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id")));
        return Map.of(
                "content", pg.getContent().stream().map(this::dto).toList(),
                "page", pg.getNumber(), "size", pg.getSize(),
                "totalElements", pg.getTotalElements(), "totalPages", pg.getTotalPages()
        );
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return repo.findById(id).map(p -> ResponseEntity.ok((Object) dto(p)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "상품을 찾을 수 없습니다.")));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody ProductRequest req) {
        if (req.name() == null || req.name().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "상품명을 입력해 주세요."));
        Product p = new Product();
        apply(p, req);
        repo.save(p);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto(p));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody ProductRequest req) {
        Product p = repo.findById(id).orElse(null);
        if (p == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "상품을 찾을 수 없습니다."));
        apply(p, req);
        repo.save(p);
        return ResponseEntity.ok(dto(p));
    }

    private long n(Long v) { return v == null ? 0L : v; }

    private void apply(Product p, ProductRequest req) {
        if (req.name() != null) p.setName(req.name().trim());
        p.setRewardType("FIXED".equals(req.rewardType()) ? Product.RewardType.FIXED : Product.RewardType.RATE);
        p.setSalePrice(n(req.salePrice()));
        p.setTotalAllowance(n(req.totalAllowance()));
        p.setCategoryId(req.categoryId());
        p.setPartnerId(req.partnerId());
        p.setImage1(req.image1()); p.setImage2(req.image2()); p.setImage3(req.image3());
        p.setImage4(req.image4()); p.setImage5(req.image5());
        p.setBuzzReward(n(req.buzzReward()));
        p.setChinkuReward(n(req.chinkuReward()));
        p.setManagerReward(n(req.managerReward()));
        p.setSalesCenterReward(n(req.salesCenterReward()));
        p.setMgmtCenterReward(n(req.mgmtCenterReward()));
        p.setDivisionReward(n(req.divisionReward()));
        p.setHqReward(n(req.hqReward()));
        p.setDescription(req.description());
        p.setInstallPolicy(req.installPolicy());
        p.setReturnPolicy(req.returnPolicy());
        p.setOnSale(req.onSale() == null ? true : req.onSale());
        p.setContractEndDate(parseDate(req.contractEndDate()));
        p.setInstallProduct(req.installProduct() != null && req.installProduct());
        p.setPopular(req.popular() != null && req.popular());
        p.setRecommended(req.recommended() != null && req.recommended());
    }

    /** "YYYY-MM-DD" 문자열 → LocalDate (빈값/파싱실패 → null) */
    private java.time.LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try { return java.time.LocalDate.parse(s.trim()); } catch (Exception e) { return null; }
    }
}
