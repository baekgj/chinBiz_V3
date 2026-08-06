package com.chinbiz.api.buzz;

import com.chinbiz.api.allowance.Allowance;
import com.chinbiz.api.allowance.AllowancePayment;
import com.chinbiz.api.allowance.AllowancePaymentRepository;
import com.chinbiz.api.allowance.AllowanceRepository;
import com.chinbiz.api.product.ProductRepository;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * 버즈/매니저 [수당/정산현황].
 *  - GET /api/buzz/allowances?as=buzz|manager&gubun=all|buzz|referral&status=all|cp|mp&month=YYYYMM  (수당현황)
 *  - GET /api/buzz/payments?as=buzz|manager&month=YYYYMM                                            (정산현황)
 *  member_id = 로그인 userId.
 */
@RestController
@RequestMapping("/api/buzz")
public class BuzzSettlementController {

    private final AllowanceRepository allowanceRepo;
    private final AllowancePaymentRepository paymentRepo;
    private final UserRepository userRepo;
    private final SaleRepository saleRepo;
    private final ProductRepository productRepo;

    private static final DateTimeFormatter YM = DateTimeFormatter.ofPattern("yyyyMM");
    private static final Map<String, String> MT_LABEL = Map.of(
            "BUZZ", "영업수당", "TOPBUZZ", "추천수당", "MANAGER", "관리수당");

    public BuzzSettlementController(AllowanceRepository allowanceRepo, AllowancePaymentRepository paymentRepo,
                                    UserRepository userRepo, SaleRepository saleRepo, ProductRepository productRepo) {
        this.allowanceRepo = allowanceRepo; this.paymentRepo = paymentRepo;
        this.userRepo = userRepo; this.saleRepo = saleRepo; this.productRepo = productRepo;
    }

    private User me(Authentication auth) { return auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null); }

    private List<Allowance.MemberType> memberTypes(boolean manager, String gubun) {
        if (manager) return List.of(Allowance.MemberType.MANAGER);
        if ("buzz".equalsIgnoreCase(gubun)) return List.of(Allowance.MemberType.BUZZ);
        if ("referral".equalsIgnoreCase(gubun)) return List.of(Allowance.MemberType.TOPBUZZ);
        return List.of(Allowance.MemberType.BUZZ, Allowance.MemberType.TOPBUZZ);
    }

    private List<Allowance.Status> statuses(String status) {
        if ("cp".equalsIgnoreCase(status)) return List.of(Allowance.Status.CP);
        if ("mp".equalsIgnoreCase(status)) return List.of(Allowance.Status.MP);
        return List.of(Allowance.Status.CP, Allowance.Status.MP);
    }

    /** 확정월 없으면 등록월(created_at) 기준 대상월 */
    private String targetMonth(Allowance a) {
        if (a.getFixedMonth() != null && !a.getFixedMonth().isBlank()) return a.getFixedMonth();
        return a.getCreatedAt() == null ? null : a.getCreatedAt().format(YM);
    }

    /** 수당현황 */
    @GetMapping("/allowances")
    public ResponseEntity<?> allowances(Authentication auth,
                                        @RequestParam(required = false) String as,
                                        @RequestParam(required = false) String gubun,
                                        @RequestParam(required = false) String status,
                                        @RequestParam(required = false) String month) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        boolean manager = "manager".equalsIgnoreCase(as);

        List<Allowance> rows = allowanceRepo.findByMemberIdAndMemberTypeInAndStatusInOrderByCreatedAtDesc(
                me.getUserId(), memberTypes(manager, gubun), statuses(status));
        if (month != null && !month.isBlank())
            rows = rows.stream().filter(a -> month.equals(targetMonth(a))).toList();

        // 주문번호 → sale, 상품 이름 룩업
        Map<String, Sale> saleByOrder = new HashMap<>();
        saleRepo.findAll().forEach(s -> { if (s.getOrderNo() != null) saleByOrder.put(s.getOrderNo(), s); });
        Map<Long, String> pName = new HashMap<>();
        productRepo.findAll().forEach(p -> pName.put(p.getId(), p.getName()));
        Map<Long, String> uName = new HashMap<>();
        userRepo.findAll().forEach(u -> uName.put(u.getId(), u.getName()));

        List<Map<String, Object>> list = new ArrayList<>();
        for (Allowance a : rows) {
            Sale s = a.getOrderNo() == null ? null : saleByOrder.get(a.getOrderNo());
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("saleDate", a.getContractDate() != null ? a.getContractDate().toString()
                    : (a.getCreatedAt() == null ? null : a.getCreatedAt().toLocalDate().toString()));
            m.put("gubun", MT_LABEL.getOrDefault(a.getMemberType().name(), a.getMemberType().name()));
            m.put("productName", a.getProductId() == null ? null : pName.get(a.getProductId()));
            m.put("customerName", s == null ? null : s.getCompanyName());
            // 버즈뷰: 추천수당이면 하위 버즈명 / 매니저뷰: 1차 영업 버즈명
            m.put("buzzName", s == null ? null : uName.get(s.getBuzzId()));
            m.put("fixedDate", a.getFixedDate() == null ? null : a.getFixedDate().toLocalDate().toString());
            m.put("amount", a.getAmount());
            m.put("status", a.getStatus() == null ? null : a.getStatus().name());
            m.put("type", a.getType() == null ? null : a.getType().name());
            list.add(m);
        }
        return ResponseEntity.ok(Map.of("content", list));
    }

    /** 정산현황 */
    @GetMapping("/payments")
    public ResponseEntity<?> payments(Authentication auth,
                                      @RequestParam(required = false) String as,
                                      @RequestParam(required = false) String month) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        boolean manager = "manager".equalsIgnoreCase(as);
        List<Allowance.MemberType> types = manager ? List.of(Allowance.MemberType.MANAGER)
                : List.of(Allowance.MemberType.BUZZ, Allowance.MemberType.TOPBUZZ);

        List<AllowancePayment> rows = paymentRepo.findByMemberIdAndMemberTypeInOrderByIdDesc(me.getUserId(), types);
        if (month != null && !month.isBlank())
            rows = rows.stream().filter(p -> month.equals(p.getFixedMonth())).toList();

        List<Map<String, Object>> list = new ArrayList<>();
        for (AllowancePayment p : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("fixedMonth", p.getFixedMonth());
            m.put("gubun", p.getMemberType() == null ? null : MT_LABEL.getOrDefault(p.getMemberType().name(), p.getMemberType().name()));
            m.put("amount", p.getPaymentAmount());
            m.put("paymentDate", p.getPaymentDate() == null ? null : p.getPaymentDate().toLocalDate().toString());
            m.put("paymentFlag", p.getPaymentFlag());
            list.add(m);
        }
        return ResponseEntity.ok(Map.of("content", list));
    }
}
