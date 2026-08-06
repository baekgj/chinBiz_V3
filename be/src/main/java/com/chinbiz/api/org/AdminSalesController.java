package com.chinbiz.api.org;

import com.chinbiz.api.buzz.Sale;
import com.chinbiz.api.buzz.SaleRepository;
import com.chinbiz.api.partner.PartnerRepository;
import com.chinbiz.api.product.Product;
import com.chinbiz.api.product.ProductRepository;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 본사(MASTER_ADMIN) 조직망 · 영업 관리 — 전체 1차 영업(sale) 목록.
 * `/api/org/**` = MASTER_ADMIN (SecurityConfig).
 */
@RestController
@RequestMapping("/api/org/sales")
public class AdminSalesController {

    private final SaleRepository saleRepo;
    private final ProductRepository productRepo;
    private final PartnerRepository partnerRepo;
    private final UserRepository userRepo;
    private final com.chinbiz.api.allowance.AllowanceService allowanceService;
    private final com.chinbiz.api.alarm.AlarmService alarmService;

    public AdminSalesController(SaleRepository saleRepo, ProductRepository productRepo, PartnerRepository partnerRepo,
                                UserRepository userRepo, com.chinbiz.api.allowance.AllowanceService allowanceService,
                                com.chinbiz.api.alarm.AlarmService alarmService) {
        this.saleRepo = saleRepo; this.productRepo = productRepo; this.partnerRepo = partnerRepo;
        this.userRepo = userRepo; this.allowanceService = allowanceService;
        this.alarmService = alarmService;
    }

    /** 매니저 변경(재배정) 가능 여부: 매니저 배정됨 + 상태(접수/상담·방문) + 배정 7일 경과 */
    private boolean canReassign(Sale s) {
        if (s.getManagerId() == null || s.getManagerDatedAt() == null) return false;
        boolean stageOk = "접수".equals(s.getStatus()) || "상담/방문".equals(s.getStatus());
        boolean over7d = s.getManagerDatedAt().isBefore(java.time.LocalDateTime.now().minusDays(7));
        return stageOk && over7d;
    }

    private String userName(Long id) { return id == null ? null : userRepo.findById(id).map(User::getName).orElse(null); }

    private Map<String, Object> row(Sale s) {
        Product p = s.getProductId() == null ? null : productRepo.findById(s.getProductId()).orElse(null);
        String partnerName = (p != null && p.getPartnerId() != null)
                ? partnerRepo.findById(p.getPartnerId()).map(pt -> pt.getCompanyName()).orElse(null) : null;
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("createdAt", s.getCreatedAt() == null ? null : s.getCreatedAt().toLocalDate().toString());
        m.put("productId", s.getProductId());
        m.put("productName", p == null ? null : p.getName());
        m.put("partnerName", partnerName);
        m.put("customerName", s.getCompanyName());
        m.put("ceoName", s.getCeoName());
        m.put("buzzName", userName(s.getBuzzId()));
        m.put("managerName", userName(s.getManagerId()));
        m.put("status", s.getStatus());
        m.put("managerDatedAt", s.getManagerDatedAt() == null ? null : s.getManagerDatedAt().toString());
        m.put("canReassign", canReassign(s));
        return m;
    }

    /** 고객(영업) 상세 — 고객명 클릭 팝업용 */
    @GetMapping("/{id}")
    public ResponseEntity<?> detail(@PathVariable Long id) {
        Sale s = saleRepo.findById(id).orElse(null);
        if (s == null) return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(Map.of("message", "영업 건을 찾을 수 없습니다."));
        Map<String, Object> m = row(s);
        m.put("businessNumber", s.getBusinessNumber());
        m.put("companyPhone", s.getCompanyPhone());
        m.put("contactName", s.getManagerName());   // 고객사 담당자명
        m.put("phone", s.getPhone());
        m.put("email", s.getEmail());
        m.put("zipcode", s.getZipcode());
        m.put("address", s.getAddress());
        m.put("addressDetail", s.getAddressDetail());
        m.put("memo", s.getMemo());
        return ResponseEntity.ok(m);
    }

    /** 매니저 변경(재배정) — MANAGER·MANAGER_CENTER 수당 상계 + sale 초기화(접수/매니저 null) + 메모 기록 */
    @PostMapping("/{id}/reassign")
    public ResponseEntity<?> reassign(@PathVariable Long id) {
        Sale s = saleRepo.findById(id).orElse(null);
        if (s == null) return ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body(Map.of("message", "영업 건을 찾을 수 없습니다."));
        if (!canReassign(s)) return ResponseEntity.badRequest().body(Map.of("message", "재배정 조건(매니저 배정·접수/상담방문·7일 경과)에 맞지 않습니다."));

        // 1) 매니저 수당 상계(CANCEL, −금액)
        allowanceService.cancelManagerAllowance(s.getOrderNo());

        // [매니저취소] 알람 (매니저/관리센터/버즈/센터) — 매니저 정보 초기화 전에 발송. docs/16
        try { alarmService.fireSaleEvent("MANAGER_CANCEL", s); } catch (Exception ignore) {}

        // 2) sale 초기화 + 메모 기록
        String stamp = java.time.LocalDateTime.now().format(java.time.format.DateTimeFormatter.ofPattern("yyyy년 MM월 dd일 HH시 mm분"));
        String note = stamp + " 매니저 지정 취소(재배정) 되었습니다.";
        s.setStatus("접수");
        s.setManagerId(null);
        s.setManagerDatedAt(null);
        s.setMemo(s.getMemo() == null || s.getMemo().isBlank() ? note : s.getMemo() + "\n" + note);
        saleRepo.save(s);
        return ResponseEntity.ok(Map.of("message", "매니저 지정이 취소(재배정)되었습니다.", "memo", note));
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String keyword,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "10") int size) {
        List<Specification<Sale>> specs = new ArrayList<>();
        if (keyword != null && !keyword.isBlank())
            specs.add((r, q, cb) -> cb.like(r.get("companyName"), "%" + keyword.trim() + "%"));
        Specification<Sale> spec = specs.stream().reduce(Specification::and).orElse(null);
        Page<Sale> pg = saleRepo.findAll(spec, PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id")));
        return ResponseEntity.ok(Map.of(
                "content", pg.getContent().stream().map(this::row).toList(),
                "page", pg.getNumber(), "size", pg.getSize(),
                "totalElements", pg.getTotalElements(), "totalPages", pg.getTotalPages()));
    }
}
