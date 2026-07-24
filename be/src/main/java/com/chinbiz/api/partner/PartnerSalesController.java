package com.chinbiz.api.partner;

import com.chinbiz.api.buzz.Sale;
import com.chinbiz.api.buzz.SaleRepository;
import com.chinbiz.api.product.Product;
import com.chinbiz.api.product.ProductRepository;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 파트너사 영업 현황 (PARTNER 전용).
 * 내 상품(product.partner_id = 로그인 파트너)에 접수된 1차 영업(sale) 건을 조회.
 * 상품명·1차 접수자(버즈)·2차 담당자(매니저)명을 조인해 반환.
 */
@RestController
@RequestMapping("/api/partner/sales")
public class PartnerSalesController {

    private final SaleRepository saleRepo;
    private final ProductRepository productRepo;
    private final PartnerRepository partnerRepo;
    private final UserRepository userRepo;
    private final com.chinbiz.api.allowance.AllowanceService allowanceService;

    public PartnerSalesController(SaleRepository saleRepo, ProductRepository productRepo, PartnerRepository partnerRepo,
                                  UserRepository userRepo, com.chinbiz.api.allowance.AllowanceService allowanceService) {
        this.saleRepo = saleRepo; this.productRepo = productRepo; this.partnerRepo = partnerRepo;
        this.userRepo = userRepo; this.allowanceService = allowanceService;
    }

    /** 내 상품에 접수된 sale 인지 검증 후 (sale, product) 반환. 아니면 null */
    private Object[] ownedSale(Authentication auth, Long id) {
        if (auth == null) return null;
        Partner me = partnerRepo.findByPartnerId(auth.getName()).orElse(null);
        if (me == null) return null;
        Sale s = saleRepo.findById(id).orElse(null);
        if (s == null || s.getProductId() == null) return null;
        Product p = productRepo.findById(s.getProductId()).orElse(null);
        if (p == null || !me.getId().equals(p.getPartnerId())) return null;
        return new Object[]{ s, p };
    }

    /** 구매확정 — 수당 CP→MP + 구매확정일자, 영업상태=구매확정 */
    @PostMapping("/{id}/confirm")
    public ResponseEntity<?> confirm(Authentication auth, @PathVariable Long id) {
        Object[] o = ownedSale(auth, id);
        if (o == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "영업 건을 찾을 수 없습니다."));
        Sale s = (Sale) o[0];
        if (s.getOrderNo() == null) return ResponseEntity.badRequest().body(Map.of("message", "주문번호가 없는 건입니다(구버전). 처리할 수 없습니다."));
        if ("취소/반품".equals(s.getStatus())) return ResponseEntity.badRequest().body(Map.of("message", "이미 취소/반품된 건입니다."));
        allowanceService.confirmOrder(s.getOrderNo());
        s.setStatus("구매확정");
        saleRepo.save(s);
        return ResponseEntity.ok(Map.of("message", "구매확정 처리되었습니다.", "status", s.getStatus()));
    }

    /** 취소/반품 — 상계(CANCEL, −금액) 전표 Insert (+설치형 조건 시 매니저 CANCEL_FEE), 영업상태=취소/반품 */
    @PostMapping("/{id}/cancel")
    public ResponseEntity<?> cancel(Authentication auth, @PathVariable Long id) {
        Object[] o = ownedSale(auth, id);
        if (o == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "영업 건을 찾을 수 없습니다."));
        Sale s = (Sale) o[0];
        Product p = (Product) o[1];
        if (s.getOrderNo() == null) return ResponseEntity.badRequest().body(Map.of("message", "주문번호가 없는 건입니다(구버전). 처리할 수 없습니다."));
        if ("취소/반품".equals(s.getStatus())) return ResponseEntity.badRequest().body(Map.of("message", "이미 취소/반품된 건입니다."));
        allowanceService.cancelOrder(s, p); // 상태 변경 전 현재 상태 기준으로 처리
        s.setStatus("취소/반품");
        saleRepo.save(s);
        return ResponseEntity.ok(Map.of("message", "취소/반품 처리되었습니다.", "status", s.getStatus()));
    }

    /** 영업진행상태 → 파이프라인 그룹 */
    private String group(String status) {
        if (status == null) return "진행중";
        return switch (status) {
            case "계약체결" -> "계약완료";
            case "배송/설치", "구매확정" -> "설치완료";
            case "취소/반품" -> "취소반품";
            default -> "진행중"; // 접수, 상담/방문
        };
    }

    private String userName(Long id) {
        if (id == null) return null;
        User u = userRepo.findById(id).orElse(null);
        return u == null ? null : u.getName();
    }

    private Map<String, Object> row(Sale s, Map<Long, String> productNames) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("customerName", s.getCompanyName());
        m.put("productName", s.getProductId() == null ? null : productNames.get(s.getProductId()));
        m.put("buzzName", userName(s.getBuzzId()));
        m.put("managerName", userName(s.getManagerId()));
        m.put("status", s.getStatus());
        m.put("group", group(s.getStatus()));
        m.put("updatedAt", s.getUpdatedAt() == null ? (s.getCreatedAt() == null ? null : s.getCreatedAt().toString()) : s.getUpdatedAt().toString());
        return m;
    }

    /** 영업 상세 (고객사명 클릭) — 내 상품에 접수된 건만 */
    @GetMapping("/{id}")
    public ResponseEntity<?> detail(Authentication auth, @PathVariable Long id) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Partner me = partnerRepo.findByPartnerId(auth.getName()).orElse(null);
        if (me == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "파트너사를 찾을 수 없습니다."));
        Sale s = saleRepo.findById(id).orElse(null);
        if (s == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "영업 건을 찾을 수 없습니다."));
        Product p = s.getProductId() == null ? null : productRepo.findById(s.getProductId()).orElse(null);
        if (p == null || !me.getId().equals(p.getPartnerId()))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "영업 건을 찾을 수 없습니다."));

        Map<String, Object> m = new LinkedHashMap<>();
        // 공통
        m.put("id", s.getId());
        m.put("status", s.getStatus());
        m.put("group", group(s.getStatus()));
        m.put("productName", p.getName());
        m.put("createdAt", s.getCreatedAt() == null ? null : s.getCreatedAt().toString());
        m.put("updatedAt", s.getUpdatedAt() == null ? null : s.getUpdatedAt().toString());
        // 1차 영업(버즈 등록 정보)
        m.put("buzzName", userName(s.getBuzzId()));
        m.put("companyName", s.getCompanyName());
        m.put("businessNumber", s.getBusinessNumber());
        m.put("ceoName", s.getCeoName());
        m.put("companyPhone", s.getCompanyPhone());
        m.put("managerContactName", s.getManagerName());   // 고객사 담당자명
        m.put("phone", s.getPhone());
        m.put("email", s.getEmail());
        m.put("zipcode", s.getZipcode());
        m.put("address", s.getAddress());
        m.put("addressDetail", s.getAddressDetail());
        m.put("memo", s.getMemo());
        // 2차 영업(매니저 배정 현황)
        m.put("managerId", s.getManagerId());
        m.put("managerName", userName(s.getManagerId()));   // 배정된 관리매니저명(미배정 null)
        m.put("assigned", s.getManagerId() != null);
        return ResponseEntity.ok(m);
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Partner me = partnerRepo.findByPartnerId(auth.getName()).orElse(null);
        if (me == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "파트너사를 찾을 수 없습니다."));

        // 내 상품 목록
        Specification<Product> prodSpec = (r, q, cb) -> cb.equal(r.get("partnerId"), me.getId());
        List<Product> myProducts = productRepo.findAll(prodSpec);
        if (myProducts.isEmpty())
            return ResponseEntity.ok(Map.of("content", List.of(), "stats", Map.of("total", 0, "progress", 0, "done", 0, "canceled", 0)));

        List<Long> productIds = myProducts.stream().map(Product::getId).toList();
        Map<Long, String> productNames = new LinkedHashMap<>();
        myProducts.forEach(p -> productNames.put(p.getId(), p.getName()));

        // 내 상품에 접수된 영업
        Specification<Sale> saleSpec = (r, q, cb) -> r.get("productId").in(productIds);
        List<Sale> sales = saleRepo.findAll(saleSpec, Sort.by(Sort.Direction.DESC, "id"));

        List<Map<String, Object>> content = sales.stream().map(s -> row(s, productNames)).toList();

        long progress = sales.stream().filter(s -> "진행중".equals(group(s.getStatus())) || "계약완료".equals(group(s.getStatus()))).count();
        long done = sales.stream().filter(s -> "구매확정".equals(s.getStatus())).count();
        long canceled = sales.stream().filter(s -> "취소/반품".equals(s.getStatus())).count();

        return ResponseEntity.ok(Map.of(
                "content", content,
                "stats", Map.of("total", sales.size(), "progress", progress, "done", done, "canceled", canceled)
        ));
    }
}
