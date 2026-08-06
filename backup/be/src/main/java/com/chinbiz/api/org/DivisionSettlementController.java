package com.chinbiz.api.org;

import com.chinbiz.api.allowance.Allowance;
import com.chinbiz.api.allowance.AllowanceRepository;
import com.chinbiz.api.product.ProductRepository;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 본부(DIVISION_ADMIN) 정산현황.
 *  - GET /api/division/settlement?scope=ledger   : 정산 원장 (DIVISION 전체 전표)
 *  - GET /api/division/settlement?scope=payouts  : 수당지급 현황 (MP 확정 전표)
 * member_id = 로그인 본부 admin userId.
 */
@RestController
@RequestMapping("/api/division")
public class DivisionSettlementController {

    private final AllowanceRepository allowanceRepo;
    private final ProductRepository productRepo;
    private final UserRepository userRepo;

    public DivisionSettlementController(AllowanceRepository allowanceRepo, ProductRepository productRepo, UserRepository userRepo) {
        this.allowanceRepo = allowanceRepo; this.productRepo = productRepo; this.userRepo = userRepo;
    }

    private User me(Authentication auth) { return auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null); }

    @GetMapping("/settlement")
    public ResponseEntity<?> settlement(Authentication auth, @RequestParam(defaultValue = "ledger") String scope) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        String mid = me.getUserId();
        List<Allowance.MemberType> types = List.of(Allowance.MemberType.DIVISION);

        List<Allowance> rows = "payouts".equals(scope)
                ? allowanceRepo.findByMemberIdAndMemberTypeInAndStatusOrderBySeqDesc(mid, types, Allowance.Status.MP)
                : allowanceRepo.findByMemberIdAndMemberTypeInOrderBySeqDesc(mid, types);

        Map<Long, String> pName = new HashMap<>();
        productRepo.findAll().forEach(p -> pName.put(p.getId(), p.getName()));

        long cp = 0, mp = 0;
        List<Map<String, Object>> list = new ArrayList<>();
        for (Allowance a : rows) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("seq", a.getSeq());
            m.put("type", a.getType() == null ? null : a.getType().name());
            m.put("orderNo", a.getOrderNo());
            m.put("productName", a.getProductId() == null ? null : pName.get(a.getProductId()));
            m.put("amount", a.getAmount());
            m.put("status", a.getStatus() == null ? null : a.getStatus().name());
            m.put("contractDate", a.getContractDate() == null ? null : a.getContractDate().toString());
            m.put("confirmDate", a.getConfirmDate() == null ? null : a.getConfirmDate().toString());
            m.put("paid", a.isPaid());
            m.put("createdAt", a.getCreatedAt() == null ? null : a.getCreatedAt().toLocalDate().toString());
            list.add(m);
            long amt = a.getAmount() == null ? 0L : a.getAmount();
            if (a.getStatus() == Allowance.Status.MP) mp += amt; else cp += amt;
        }
        return ResponseEntity.ok(Map.of("content", list, "cpTotal", cp, "mpTotal", mp));
    }
}
