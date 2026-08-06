package com.chinbiz.api.partner;

import com.chinbiz.api.category.Category;
import com.chinbiz.api.category.CategoryRepository;
import com.chinbiz.api.product.Product;
import com.chinbiz.api.product.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 파트너사 본인 위탁 상품 관리 API (PARTNER 전용).
 * partnerId 는 로그인 계정으로 강제 고정하며, 본인 상품만 조회/수정한다.
 */
@RestController
@RequestMapping("/api/partner")
public class PartnerProductController {

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;
    private final PartnerRepository partnerRepo;

    public PartnerProductController(ProductRepository productRepo, CategoryRepository categoryRepo, PartnerRepository partnerRepo) {
        this.productRepo = productRepo;
        this.categoryRepo = categoryRepo;
        this.partnerRepo = partnerRepo;
    }

    private Partner me(Authentication auth) {
        if (auth == null) return null;
        return partnerRepo.findByPartnerId(auth.getName()).orElse(null);
    }

    /** 카테고리 목록 (대→중→소 cascade 용) */
    @GetMapping("/categories")
    public List<Map<String, Object>> categories() {
        return categoryRepo.findAllByOrderByLevelAscIdAsc().stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId());
            m.put("level", c.getLevel().name());
            m.put("name", c.getName());
            m.put("parentId", c.getParentId());
            m.put("status", c.getStatus().name());
            return m;
        }).toList();
    }

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
        // 파트너 전용 상품설명(docs/18) — 미등록 시 레거시 description 폴백
        m.put("description", (p.getDescPartner() != null && !p.getDescPartner().isBlank()) ? p.getDescPartner() : p.getDescription());
        m.put("installPolicy", p.getInstallPolicy());
        m.put("returnPolicy", p.getReturnPolicy());
        m.put("onSale", p.isOnSale());
        m.put("contractEndDate", p.getContractEndDate() == null ? null : p.getContractEndDate().toString());
        m.put("installProduct", p.isInstallProduct());
        m.put("simpleDelivery", p.isSimpleDelivery());
        m.put("cancelFeeFlag", p.isCancelFeeFlag());
        m.put("cancelAmount", p.getCancelAmount());
        m.put("popular", p.isPopular());
        m.put("recommended", p.isRecommended());
        m.put("createdAt", p.getCreatedAt() == null ? null : p.getCreatedAt().toString());
        return m;
    }

    public record ProductRequest(
            String name, String rewardType, Long salePrice, Long totalAllowance,
            Long categoryId,
            String image1, String image2, String image3, String image4, String image5,
            Long buzzReward, Long chinkuReward, Long managerReward, Long salesCenterReward,
            Long mgmtCenterReward, Long divisionReward, Long hqReward,
            String description, String installPolicy, String returnPolicy, Boolean onSale,
            String contractEndDate, Boolean installProduct,
            Boolean simpleDelivery, Boolean cancelFeeFlag, Long cancelAmount,
            Boolean popular, Boolean recommended
    ) {}

    /** 본인 위탁 상품 목록 (필터 + 페이징) */
    @GetMapping("/products")
    public ResponseEntity<?> list(
            Authentication auth,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Boolean onSale,
            @RequestParam(required = false) String keyword) {
        Partner p = me(auth);
        if (p == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        final Long myId = p.getId();

        List<Specification<Product>> specs = new ArrayList<>();
        specs.add((r, q, cb) -> cb.equal(r.get("partnerId"), myId));
        if (categoryId != null) specs.add((r, q, cb) -> cb.equal(r.get("categoryId"), categoryId));
        if (onSale != null) specs.add((r, q, cb) -> cb.equal(r.get("onSale"), onSale));
        if (keyword != null && !keyword.isBlank())
            specs.add((r, q, cb) -> cb.like(r.get("name"), "%" + keyword.trim() + "%"));
        Specification<Product> spec = specs.stream().reduce(Specification::and).orElse(null);

        Page<Product> pg = productRepo.findAll(spec, PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id")));
        return ResponseEntity.ok(Map.of(
                "content", pg.getContent().stream().map(this::dto).toList(),
                "page", pg.getNumber(), "size", pg.getSize(),
                "totalElements", pg.getTotalElements(), "totalPages", pg.getTotalPages()
        ));
    }

    @GetMapping("/products/{id}")
    public ResponseEntity<?> get(Authentication auth, @PathVariable Long id) {
        Partner me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Product p = productRepo.findById(id).orElse(null);
        if (p == null || !me.getId().equals(p.getPartnerId()))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "상품을 찾을 수 없습니다."));
        return ResponseEntity.ok(dto(p));
    }

    @PostMapping("/products")
    public ResponseEntity<?> create(Authentication auth, @RequestBody ProductRequest req) {
        Partner me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        if (req.name() == null || req.name().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "상품명을 입력해 주세요."));
        Product p = new Product();
        apply(p, req);
        p.setPartnerId(me.getId()); // 소유자 강제
        productRepo.save(p);
        return ResponseEntity.status(HttpStatus.CREATED).body(dto(p));
    }

    @PutMapping("/products/{id}")
    public ResponseEntity<?> update(Authentication auth, @PathVariable Long id, @RequestBody ProductRequest req) {
        Partner me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Product p = productRepo.findById(id).orElse(null);
        if (p == null || !me.getId().equals(p.getPartnerId()))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "상품을 찾을 수 없습니다."));
        apply(p, req);
        p.setPartnerId(me.getId()); // 소유자 유지
        productRepo.save(p);
        return ResponseEntity.ok(dto(p));
    }

    private long n(Long v) { return v == null ? 0L : v; }

    private void apply(Product p, ProductRequest req) {
        if (req.name() != null) p.setName(req.name().trim());
        p.setRewardType("FIXED".equals(req.rewardType()) ? Product.RewardType.FIXED : Product.RewardType.RATE);
        p.setSalePrice(n(req.salePrice()));
        p.setTotalAllowance(n(req.totalAllowance()));
        p.setCategoryId(req.categoryId());
        p.setImage1(req.image1()); p.setImage2(req.image2()); p.setImage3(req.image3());
        p.setImage4(req.image4()); p.setImage5(req.image5());
        p.setBuzzReward(n(req.buzzReward()));
        p.setChinkuReward(n(req.chinkuReward()));
        p.setManagerReward(n(req.managerReward()));
        p.setSalesCenterReward(n(req.salesCenterReward()));
        p.setMgmtCenterReward(n(req.mgmtCenterReward()));
        p.setDivisionReward(n(req.divisionReward()));
        p.setHqReward(n(req.hqReward()));
        p.setDescPartner(req.description()); // 파트너 전용 상품설명(docs/18)
        p.setInstallPolicy(req.installPolicy());
        p.setReturnPolicy(req.returnPolicy());
        p.setOnSale(req.onSale() == null ? true : req.onSale());
        p.setContractEndDate(parseDate(req.contractEndDate()));
        p.setInstallProduct(req.installProduct() != null && req.installProduct());
        p.setSimpleDelivery(req.simpleDelivery() != null && req.simpleDelivery());
        p.setCancelFeeFlag(req.cancelFeeFlag() != null && req.cancelFeeFlag());
        p.setCancelAmount(req.cancelAmount() == null ? 0L : req.cancelAmount());
        p.setPopular(req.popular() != null && req.popular());
        p.setRecommended(req.recommended() != null && req.recommended());
    }

    /** "YYYY-MM-DD" 문자열 → LocalDate (빈값/파싱실패 → null) */
    private java.time.LocalDate parseDate(String s) {
        if (s == null || s.isBlank()) return null;
        try { return java.time.LocalDate.parse(s.trim()); } catch (Exception e) { return null; }
    }
}
