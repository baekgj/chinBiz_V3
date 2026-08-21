package com.chinbiz.api.buzz;

import com.chinbiz.api.edu.EducationRepository;
import com.chinbiz.api.org.CenterMatcher;
import com.chinbiz.api.partner.Partner;
import com.chinbiz.api.partner.PartnerRepository;
import com.chinbiz.api.product.Product;
import com.chinbiz.api.product.ProductRepository;
import com.chinbiz.api.user.Role;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 1차 영업 파이프라인 (BUZZ/MANAGER).
 *  - BUZZ  : 본인이 등록한 1차 영업 목록.
 *  - MANAGER: 전체 영업 풀 + 배정상태/교육승인여부(우선할당·영업권확보·기할당·교육필수 판단용).
 * 등록 시 buzz_id=로그인, parent_id=고객 주소→center_code→해당 센터 user.id.
 */
@RestController
@RequestMapping("/api/buzz/sales")
public class BuzzSalesController {

    private final SaleRepository saleRepo;
    private final ProductRepository productRepo;
    private final PartnerRepository partnerRepo;
    private final UserRepository userRepo;
    private final EducationRepository eduRepo;
    private final CenterMatcher centerMatcher;
    private final com.chinbiz.api.allowance.AllowanceService allowanceService;
    private final com.chinbiz.api.allowance.AllowanceRepository allowanceRepo;
    private final com.chinbiz.api.alarm.AlarmService alarmService;
    private final com.chinbiz.api.org.CenterCodeRepository centerCodeRepo;
    private final ManagerCenterRepository managerCenterRepo;

    public BuzzSalesController(SaleRepository saleRepo, ProductRepository productRepo, PartnerRepository partnerRepo,
                               UserRepository userRepo, EducationRepository eduRepo, CenterMatcher centerMatcher,
                               com.chinbiz.api.allowance.AllowanceService allowanceService,
                               com.chinbiz.api.allowance.AllowanceRepository allowanceRepo,
                               com.chinbiz.api.alarm.AlarmService alarmService,
                               com.chinbiz.api.org.CenterCodeRepository centerCodeRepo,
                               ManagerCenterRepository managerCenterRepo) {
        this.saleRepo = saleRepo; this.productRepo = productRepo; this.partnerRepo = partnerRepo;
        this.userRepo = userRepo; this.eduRepo = eduRepo; this.centerMatcher = centerMatcher;
        this.allowanceService = allowanceService; this.allowanceRepo = allowanceRepo;
        this.alarmService = alarmService; this.centerCodeRepo = centerCodeRepo; this.managerCenterRepo = managerCenterRepo;
    }

    /** 파트너사명 */
    private String partnerName(Long productId) {
        Product p = productId == null ? null : productRepo.findById(productId).orElse(null);
        if (p == null || p.getPartnerId() == null) return null;
        return partnerRepo.findById(p.getPartnerId()).map(com.chinbiz.api.partner.Partner::getCompanyName).orElse(null);
    }

    /** 해당 주문의 내(myUserId) 수당금액 (ORDER 전표 기준) */
    private long myAmount(String orderNo, String myUserId) {
        if (orderNo == null) return 0L;
        return allowanceRepo.findByOrderNoAndType(orderNo, com.chinbiz.api.allowance.Allowance.Type.ORDER).stream()
                .filter(a -> myUserId.equals(a.getMemberId()))
                .mapToLong(a -> a.getAmount() == null ? 0L : a.getAmount()).sum();
    }

    /** 버즈 파이프라인 행: 구분(영업/추천)·주문번호·파트너사·수당금액 포함 */
    private Map<String, Object> buzzRow(Sale s, boolean mine, String myUserId) {
        Product p = s.getProductId() == null ? null : productRepo.findById(s.getProductId()).orElse(null);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("createdAt", s.getCreatedAt() == null ? null : s.getCreatedAt().toLocalDate().toString());
        m.put("kind", mine ? "영업" : "추천");
        m.put("orderNo", s.getOrderNo());
        m.put("productId", s.getProductId());
        m.put("productName", p == null ? null : p.getName());
        m.put("partnerName", partnerName(s.getProductId()));
        m.put("customerName", s.getCompanyName());
        m.put("myAmount", myAmount(s.getOrderNo(), myUserId));
        m.put("status", s.getStatus());
        return m;
    }

    private User me(Authentication auth) { return auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null); }
    private String userName(Long id) { return id == null ? null : userRepo.findById(id).map(User::getName).orElse(null); }

    private Map<String, Object> row(Sale s, User viewer) {
        Product p = s.getProductId() == null ? null : productRepo.findById(s.getProductId()).orElse(null);
        String partnerName = null;
        if (p != null && p.getPartnerId() != null) {
            Partner pt = partnerRepo.findById(p.getPartnerId()).orElse(null);
            partnerName = pt == null ? null : pt.getCompanyName();
        }
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", s.getId());
        m.put("createdAt", s.getCreatedAt() == null ? null : s.getCreatedAt().toLocalDate().toString());
        m.put("productId", s.getProductId());
        m.put("productName", p == null ? null : p.getName());
        m.put("partnerName", partnerName);
        m.put("customerName", s.getCompanyName());
        m.put("buzzName", userName(s.getBuzzId()));
        m.put("status", s.getStatus());
        // 활동센터 지역 (고객 주소 지역 센터, docs/19)
        m.put("centerName", s.getCustomerCenterId() == null ? null
                : centerCodeRepo.findById(s.getCustomerCenterId()).map(com.chinbiz.api.org.CenterCode::displayName).orElse(null));
        // 배정 상태
        m.put("managerId", s.getManagerId());
        m.put("assignedManagerName", userName(s.getManagerId()));
        boolean isMine = viewer != null && viewer.getId().equals(s.getManagerId());
        m.put("mine", isMine);
        // 로그인 매니저의 해당 상품 교육 승인 여부
        boolean eduApproved = false;
        if (viewer != null && viewer.getRole() == Role.MANAGER && s.getProductId() != null) {
            eduApproved = eduRepo.findByProductIdAndManagerId(s.getProductId(), viewer.getId())
                    .map(e -> e.isCompleted() && e.isApproved()).orElse(false);
        }
        m.put("eduApproved", eduApproved);
        return m;
    }

    private Map<String, Object> detail(Sale s, User viewer) {
        Map<String, Object> m = row(s, viewer);
        m.put("orderNo", s.getOrderNo());
        m.put("categoryId", s.getCategoryId());
        m.put("buzzId", s.getBuzzId());
        m.put("parentId", s.getParentId());
        m.put("companyName", s.getCompanyName());
        m.put("businessNumber", s.getBusinessNumber());
        m.put("ceoName", s.getCeoName());
        m.put("companyPhone", s.getCompanyPhone());
        m.put("managerName", s.getManagerName());
        m.put("phone", s.getPhone());
        m.put("email", s.getEmail());
        m.put("zipcode", s.getZipcode());
        m.put("address", s.getAddress());
        m.put("addressDetail", s.getAddressDetail());
        m.put("memo", s.getMemo());
        return m;
    }

    @GetMapping
    public ResponseEntity<?> list(Authentication auth,
                                  @RequestParam(required = false) String keyword,
                                  @RequestParam(defaultValue = "0") int page,
                                  @RequestParam(defaultValue = "10") int size) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));

        // 영업파이프라인(버즈 뷰 전용): 역할과 무관하게 "내가 등록한 건(영업) + 나를 추천인으로 등록한 버즈가 등록한 건(추천)"만.
        // (매니저의 전체 영업 풀은 /intake·/managed 로 분리됨)
        final Long myId = me.getId();
        final String myUserId = me.getUserId();
        List<Long> buzzIds = new ArrayList<>();
        buzzIds.add(myId);
        userRepo.findByReferralCode(myUserId).forEach(u -> { if (!u.getId().equals(myId)) buzzIds.add(u.getId()); });

        List<Specification<Sale>> specs = new ArrayList<>();
        specs.add((r, q, cb) -> r.get("buzzId").in(buzzIds));
        if (keyword != null && !keyword.isBlank())
            specs.add((r, q, cb) -> cb.like(r.get("companyName"), "%" + keyword.trim() + "%"));
        Specification<Sale> spec = specs.stream().reduce(Specification::and).orElse(null);
        Page<Sale> pg = saleRepo.findAll(spec, PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id")));
        return ResponseEntity.ok(Map.of(
                "content", pg.getContent().stream().map(s -> buzzRow(s, myId.equals(s.getBuzzId()), myUserId)).toList(),
                "page", pg.getNumber(), "size", pg.getSize(),
                "totalElements", pg.getTotalElements(), "totalPages", pg.getTotalPages()));
    }

    /** [버즈1차접수현황] (MANAGER) — 고객 주소 지역(customer_center_id)이 내 관리센터(manager_center_id)와 같은 미배정 1차영업 */
    @GetMapping("/intake")
    public ResponseEntity<?> intake(Authentication auth,
                                    @RequestParam(required = false) String keyword,
                                    @RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "10") int size) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        if (me.getRole() != Role.MANAGER) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "관리매니저 전용"));
        // 내 활동센터(승인된 manager_center, 최대 3개) — docs/19
        List<Long> myCenters = managerCenterRepo.findByBuzzIdAndStatus(me.getId(), "Y").stream()
                .map(ManagerCenter::getCenterId).toList();
        if (myCenters.isEmpty())
            return ResponseEntity.ok(Map.of("content", List.of(), "page", 0, "size", size, "totalElements", 0, "totalPages", 0));

        List<Specification<Sale>> specs = new ArrayList<>();
        specs.add((r, q, cb) -> r.get("customerCenterId").in(myCenters)); // 고객 주소 지역 ∈ 내 활동센터들
        specs.add((r, q, cb) -> cb.isNull(r.get("managerId")));  // 아직 매니저 미선정
        if (keyword != null && !keyword.isBlank())
            specs.add((r, q, cb) -> cb.like(r.get("companyName"), "%" + keyword.trim() + "%"));
        Specification<Sale> spec = specs.stream().reduce(Specification::and).orElse(null);
        Page<Sale> pg = saleRepo.findAll(spec, PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id")));
        return ResponseEntity.ok(Map.of(
                "content", pg.getContent().stream().map(s -> row(s, me)).toList(),
                "page", pg.getNumber(), "size", pg.getSize(),
                "totalElements", pg.getTotalElements(), "totalPages", pg.getTotalPages()));
    }

    /** [2차영업관리] (MANAGER) — 내가 배정받은 영업 건 */
    @GetMapping("/managed")
    public ResponseEntity<?> managed(Authentication auth,
                                     @RequestParam(required = false) String keyword,
                                     @RequestParam(defaultValue = "0") int page,
                                     @RequestParam(defaultValue = "10") int size) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        if (me.getRole() != Role.MANAGER) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "관리매니저 전용"));
        List<Specification<Sale>> specs = new ArrayList<>();
        specs.add((r, q, cb) -> cb.equal(r.get("managerId"), me.getId()));
        if (keyword != null && !keyword.isBlank())
            specs.add((r, q, cb) -> cb.like(r.get("companyName"), "%" + keyword.trim() + "%"));
        Specification<Sale> spec = specs.stream().reduce(Specification::and).orElse(null);
        Page<Sale> pg = saleRepo.findAll(spec, PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id")));
        return ResponseEntity.ok(Map.of(
                "content", pg.getContent().stream().map(s -> row(s, me)).toList(),
                "page", pg.getNumber(), "size", pg.getSize(),
                "totalElements", pg.getTotalElements(), "totalPages", pg.getTotalPages()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> get(Authentication auth, @PathVariable Long id) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Sale s = saleRepo.findById(id).orElse(null);
        // 버즈 본인 건 또는 매니저(전체 풀 접근)
        boolean ok = s != null && (me.getId().equals(s.getBuzzId()) || me.getRole() == Role.MANAGER);
        if (!ok) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "영업 건을 찾을 수 없습니다."));
        return ResponseEntity.ok(detail(s, me));
    }

    public record SaleRequest(
            Long productId, Long categoryId,
            String companyName, String businessNumber, String ceoName, String companyPhone,
            String managerName, String phone, String email,
            String zipcode, String address, String addressDetail,
            String status, String memo) {}

    /** 1차 영업 등록 (buzz_id=로그인, parent_id=주소→센터 대표 user) */
    @PostMapping
    public ResponseEntity<?> create(Authentication auth, @RequestBody SaleRequest req) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        if (req.productId() == null) return ResponseEntity.badRequest().body(Map.of("message", "상품을 선택해 주세요."));
        if (isBlank(req.companyName())) return ResponseEntity.badRequest().body(Map.of("message", "고객 상호명을 입력해 주세요."));
        Sale s = new Sale();
        s.setBuzzId(me.getId());
        apply(s, req);
        s.setParentId(centerParentId(req.address()));
        saleRepo.save(s); // id 생성

        // 주문번호 생성(OD+yyyyMMdd-일련번호) → 저장
        s.setOrderNo(String.format("OD%s-%06d",
                java.time.LocalDate.now().format(java.time.format.DateTimeFormatter.BASIC_ISO_DATE), s.getId()));
        saleRepo.save(s);

        // 수당 원장 레코드 생성 (버즈/소속센터/본부/본사 + 추천인)
        User referrer = (me.getReferralCode() != null && !me.getReferralCode().isBlank())
                ? userRepo.findByUserId(me.getReferralCode().trim()).orElse(null) : null;
        allowanceService.createForSale(s, me, referrer);

        // [1차영업신청] 알람 (버즈/센터/본부/본사/추천인/파트너) — docs/16
        try { alarmService.fireSaleEvent("SALE1", s); } catch (Exception ignore) {}

        // 가입 추천마일리지(JOIN/CP) → MP 전환 (docs/18): 첫 1차영업 등록 시 확정
        try {
            var joinRows = allowanceRepo.findByMemberIdAndTypeAndStatus(me.getUserId(),
                    com.chinbiz.api.allowance.Allowance.Type.JOIN, com.chinbiz.api.allowance.Allowance.Status.CP);
            for (var a : joinRows) { a.setStatus(com.chinbiz.api.allowance.Allowance.Status.MP); a.setConfirmDate(java.time.LocalDate.now()); }
            allowanceRepo.saveAll(joinRows);
        } catch (Exception ignore) {}

        return ResponseEntity.status(HttpStatus.CREATED).body(detail(s, me));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(Authentication auth, @PathVariable Long id, @RequestBody SaleRequest req) {
        User me = me(auth);
        Sale s = saleRepo.findById(id).orElse(null);
        if (s == null || me == null || !me.getId().equals(s.getBuzzId()))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "영업 건을 찾을 수 없습니다."));
        apply(s, req);
        s.setParentId(centerParentId(req.address()));
        saleRepo.save(s);
        return ResponseEntity.ok(detail(s, me));
    }

    public record AssignRequest(String status, String memo, Long categoryId, Long productId) {}

    /** [우선할당] — 매니저가 영업권 확보(manager_id 저장) + 카테고리/상품·진행현황/내용 기록. 교육 승인 필수. */
    @PostMapping("/{id}/assign")
    public ResponseEntity<?> assign(Authentication auth, @PathVariable Long id, @RequestBody AssignRequest req) {
        User me = me(auth);
        if (me == null || me.getRole() != Role.MANAGER)
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "관리매니저만 배정할 수 있습니다."));
        Sale s = saleRepo.findById(id).orElse(null);
        if (s == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "영업 건을 찾을 수 없습니다."));
        if (s.getManagerId() != null && !me.getId().equals(s.getManagerId()))
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "이미 다른 매니저에게 배정된 영업입니다."));
        // 매니저가 배정 시 카테고리/상품 선택 저장 (docs/24) — 교육 승인 판정 전에 반영
        if (req.categoryId() != null) s.setCategoryId(req.categoryId());
        if (req.productId() != null) s.setProductId(req.productId());
        boolean eduApproved = s.getProductId() != null && eduRepo.findByProductIdAndManagerId(s.getProductId(), me.getId())
                .map(e -> e.isCompleted() && e.isApproved()).orElse(false);
        if (!eduApproved) return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "해당 상품 교육 이수·승인 후 배정할 수 있습니다."));
        s.setManagerId(me.getId());
        s.setManagerDatedAt(java.time.LocalDateTime.now()); // 매니저 배정 일시
        if (!isBlank(req.status())) s.setStatus(req.status());
        if (req.memo() != null) s.setMemo(req.memo());
        saleRepo.save(s);

        // 영업권 확보 시 매니저·관리센터 수당 원장 레코드 생성
        allowanceService.createForAssign(s, me);

        // [2차영업신청] 알람 (매니저/관리센터/파트너) — docs/16
        try { alarmService.fireSaleEvent("SALE2", s); } catch (Exception ignore) {}

        return ResponseEntity.ok(detail(s, me));
    }

    /** 고객 주소 → center_code idx → 해당 센터(CENTER_ADMIN) user.id */
    private Long centerParentId(String address) {
        Long idx = centerMatcher.matchCenterIdx(address);
        if (idx == null) return null;
        return userRepo.findBySalesCenterId(idx).stream()
                .filter(u -> u.getRole() == Role.CENTER_ADMIN)
                .map(User::getId).findFirst().orElse(null);
    }

    private void apply(Sale s, SaleRequest req) {
        s.setProductId(req.productId());
        s.setCategoryId(req.categoryId());
        s.setCompanyName(req.companyName());
        s.setBusinessNumber(req.businessNumber());
        s.setCeoName(req.ceoName());
        s.setCompanyPhone(req.companyPhone());
        s.setManagerName(req.managerName());
        s.setPhone(req.phone());
        s.setEmail(req.email());
        s.setZipcode(req.zipcode());
        s.setAddress(req.address());
        s.setAddressDetail(req.addressDetail());
        s.setCustomerCenterId(centerMatcher.matchCenterIdx(req.address())); // 고객 주소 → center_code.idx (지역 매칭)
        if (!isBlank(req.status())) s.setStatus(req.status());
        s.setMemo(req.memo());
    }

    private boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
}
