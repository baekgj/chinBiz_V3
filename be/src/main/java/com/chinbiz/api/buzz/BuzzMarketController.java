package com.chinbiz.api.buzz;

import com.chinbiz.api.category.Category;
import com.chinbiz.api.category.CategoryRepository;
import com.chinbiz.api.edu.Education;
import com.chinbiz.api.edu.EducationRepository;
import com.chinbiz.api.partner.Partner;
import com.chinbiz.api.partner.PartnerRepository;
import com.chinbiz.api.product.Product;
import com.chinbiz.api.product.ProductRepository;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 버즈 상품 마켓 (BUZZ/MANAGER 전용) — 상품 조회/검색/상세 + 필터용 카테고리·파트너 목록.
 * 판매중(onSale=true) 상품만 노출.
 */
@RestController
@RequestMapping("/api/buzz")
public class BuzzMarketController {

    private final ProductRepository productRepo;
    private final CategoryRepository categoryRepo;
    private final PartnerRepository partnerRepo;
    private final EducationRepository eduRepo;
    private final UserRepository userRepo;

    public BuzzMarketController(ProductRepository productRepo, CategoryRepository categoryRepo, PartnerRepository partnerRepo,
                                EducationRepository eduRepo, UserRepository userRepo) {
        this.productRepo = productRepo;
        this.categoryRepo = categoryRepo;
        this.partnerRepo = partnerRepo;
        this.eduRepo = eduRepo;
        this.userRepo = userRepo;
    }

    /** 필터용 카테고리 목록 */
    @GetMapping("/categories")
    public List<Map<String, Object>> categories() {
        return categoryRepo.findAllByOrderByLevelAscIdAsc().stream().map(c -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", c.getId()); m.put("level", c.getLevel().name()); m.put("name", c.getName()); m.put("parentId", c.getParentId());
            return m;
        }).toList();
    }

    /** 필터용 파트너사 목록 (id + 상호명) */
    @GetMapping("/partners")
    public List<Map<String, Object>> partners() {
        return partnerRepo.findAll().stream().map(p -> {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId()); m.put("companyName", p.getCompanyName());
            return m;
        }).toList();
    }

    private Map<Long, String> partnerNames() {
        return partnerRepo.findAll().stream().collect(Collectors.toMap(Partner::getId, Partner::getCompanyName, (a, b) -> a));
    }
    private Map<Long, String> categoryNames() {
        return categoryRepo.findAll().stream().collect(Collectors.toMap(Category::getId, Category::getName, (a, b) -> a));
    }

    private Map<String, Object> card(Product p, Map<Long, String> pn, Map<Long, String> cn) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", p.getId());
        m.put("name", p.getName());
        m.put("salePrice", p.getSalePrice());
        m.put("totalAllowance", p.getTotalAllowance());
        m.put("rewardType", p.getRewardType().name());
        m.put("buzzReward", p.getBuzzReward());
        m.put("chinkuReward", p.getChinkuReward());
        m.put("managerReward", p.getManagerReward());
        m.put("image1", p.getImage1());
        m.put("categoryId", p.getCategoryId());
        m.put("categoryName", p.getCategoryId() == null ? null : cn.get(p.getCategoryId()));
        m.put("partnerId", p.getPartnerId());
        m.put("partnerName", p.getPartnerId() == null ? null : pn.get(p.getPartnerId()));
        m.put("contractEndDate", p.getContractEndDate() == null ? null : p.getContractEndDate().toString());
        m.put("installProduct", p.isInstallProduct());
        m.put("simpleDelivery", p.isSimpleDelivery());
        m.put("cancelFeeFlag", p.isCancelFeeFlag());
        m.put("cancelAmount", p.getCancelAmount());
        m.put("popular", p.isPopular());
        m.put("recommended", p.isRecommended());
        return m;
    }

    /** 상품 목록 (검색: 상품명/파트너/카테고리, 페이징 기본 9개)
     *  as=manager → 로그인 매니저가 교육이수 완료(completed)한 상품만 노출 + autoAssign(자동배정 동의) 포함 */
    @GetMapping("/products")
    public Map<String, Object> products(
            Authentication auth,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Long partnerId,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String as,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {

        // 관리마켓(매니저 뷰): 교육이수 완료 상품만 + autoAssign 맵
        boolean managerMode = "manager".equals(as);
        Set<Long> completedIds = null;
        Map<Long, Boolean> autoAssignByProduct = new HashMap<>();
        if (managerMode) {
            User me = auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null);
            List<Education> edus = me == null ? List.of() : eduRepo.findByManagerId(me.getId());
            completedIds = edus.stream().filter(Education::isCompleted).map(Education::getProductId).collect(Collectors.toSet());
            edus.forEach(e -> autoAssignByProduct.put(e.getProductId(), e.isAutoAssign()));
        }

        List<Specification<Product>> specs = new ArrayList<>();
        specs.add((r, q, cb) -> cb.isTrue(r.get("onSale")));
        if (keyword != null && !keyword.isBlank())
            specs.add((r, q, cb) -> cb.like(r.get("name"), "%" + keyword.trim() + "%"));
        if (partnerId != null) specs.add((r, q, cb) -> cb.equal(r.get("partnerId"), partnerId));
        if (categoryId != null) specs.add((r, q, cb) -> cb.equal(r.get("categoryId"), categoryId));
        if (managerMode) {
            Set<Long> ids = completedIds.isEmpty() ? Set.of(-1L) : completedIds; // 빈 목록 → 매칭 없음
            specs.add((r, q, cb) -> r.get("id").in(ids));
            specs.add((r, q, cb) -> cb.isFalse(r.get("simpleDelivery"))); // 단순배송상품 제외(docs/11)
        }
        Specification<Product> spec = specs.stream().reduce(Specification::and).orElse(null);

        Page<Product> pg = productRepo.findAll(spec, PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id")));
        Map<Long, String> pn = partnerNames(), cn = categoryNames();
        List<Map<String, Object>> content = pg.getContent().stream().map(p -> {
            Map<String, Object> m = card(p, pn, cn);
            if (managerMode) m.put("autoAssign", autoAssignByProduct.getOrDefault(p.getId(), false));
            return m;
        }).toList();
        return Map.of(
                "content", content,
                "page", pg.getNumber(), "size", pg.getSize(),
                "totalElements", pg.getTotalElements(), "totalPages", pg.getTotalPages());
    }

    /** 자동배정 동의여부 실시간 저장 (관리마켓 토글) — 교육 이수완료 상품에 한함 */
    @PostMapping("/products/{id}/auto-assign")
    public ResponseEntity<?> setAutoAssign(Authentication auth, @PathVariable Long id, @RequestBody Map<String, Object> body) {
        User me = auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Education e = eduRepo.findByProductIdAndManagerId(id, me.getId()).orElse(null);
        if (e == null || !e.isCompleted())
            return ResponseEntity.badRequest().body(Map.of("message", "교육 이수완료된 상품만 자동배정을 설정할 수 있습니다."));
        boolean autoAssign = body.get("autoAssign") != null && Boolean.parseBoolean(String.valueOf(body.get("autoAssign")));
        e.setAutoAssign(autoAssign);
        eduRepo.save(e);
        return ResponseEntity.ok(Map.of("autoAssign", autoAssign, "message", autoAssign ? "자동배정 동의로 저장되었습니다." : "자동배정 미동의로 저장되었습니다."));
    }

    /** 상품 상세 (수당 전 항목 반환 — 역할별 표시 필터는 FE 담당).
     *  as=buzz(기본) → 버즈용 상품설명, as=manager → 매니저용 상품설명 (docs/18, 미등록 시 레거시 description 폴백) */
    @GetMapping("/products/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id, @RequestParam(required = false, defaultValue = "buzz") String as) {
        Product p = productRepo.findById(id).orElse(null);
        if (p == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "상품을 찾을 수 없습니다."));
        Map<Long, String> pn = partnerNames(), cn = categoryNames();
        Map<String, Object> m = card(p, pn, cn);
        m.put("rewardType", p.getRewardType().name());
        m.put("image2", p.getImage2()); m.put("image3", p.getImage3()); m.put("image4", p.getImage4()); m.put("image5", p.getImage5());
        m.put("buzzReward", p.getBuzzReward());
        m.put("chinkuReward", p.getChinkuReward());
        m.put("managerReward", p.getManagerReward());
        m.put("salesCenterReward", p.getSalesCenterReward());
        m.put("mgmtCenterReward", p.getMgmtCenterReward());
        m.put("divisionReward", p.getDivisionReward());
        m.put("hqReward", p.getHqReward());
        String roleDesc = "manager".equals(as) ? p.getDescManager() : p.getDescBuzz();
        if (roleDesc == null || roleDesc.isBlank()) roleDesc = p.getDescription(); // 레거시 폴백
        m.put("description", roleDesc);
        m.put("installPolicy", p.getInstallPolicy());
        m.put("returnPolicy", p.getReturnPolicy());
        // 상품등록 확장필드(docs/25) — 상세 확인화면 노출
        m.put("videoUrl", p.getVideoUrl());
        m.put("monthlyCare", p.isMonthlyCare());
        m.put("asSupport", p.isAsSupport());
        m.put("specEffect", p.getSpecEffect());
        m.put("salesTarget", p.getSalesTarget());
        m.put("productFeature", p.getProductFeature());
        m.put("processFlow", p.getProcessFlow());
        return ResponseEntity.ok(m);
    }
}
