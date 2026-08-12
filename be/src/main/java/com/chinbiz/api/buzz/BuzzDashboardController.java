package com.chinbiz.api.buzz;

import com.chinbiz.api.allowance.Allowance;
import com.chinbiz.api.allowance.AllowanceRepository;
import com.chinbiz.api.allowance.AllowancePaymentRepository;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 버즈/매니저 대시보드 지표 (이달 CP 예정수당 / MP 확정수당).
 *  - 버즈 뷰(as=buzz)  : 회원구분 BUZZ, TOPBUZZ
 *  - 매니저 뷰(as=manager): 회원구분 MANAGER
 *  member_id = 로그인 userId, 이달(created_at) 기준 합산.
 */
@RestController
@RequestMapping("/api/buzz/dashboard")
public class BuzzDashboardController {

    private final AllowanceRepository allowanceRepo;
    private final AllowancePaymentRepository paymentRepo;
    private final UserRepository userRepo;
    private final SaleRepository saleRepo;

    public BuzzDashboardController(AllowanceRepository allowanceRepo, AllowancePaymentRepository paymentRepo,
                                   UserRepository userRepo, SaleRepository saleRepo) {
        this.allowanceRepo = allowanceRepo; this.paymentRepo = paymentRepo; this.userRepo = userRepo;
        this.saleRepo = saleRepo;
    }

    /**
     * 버즈 대시보드 요약 (docs/21): 영업 파이프라인 5단계 카운트 + 최근 상태 + 네트워크 지표.
     * 파이프라인 범위 = 내가 등록한 1차영업 + 나를 추천인으로 등록한 버즈의 1차영업.
     */
    @GetMapping("/summary")
    public ResponseEntity<?> summary(Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        User me = userRepo.findByUserId(auth.getName()).orElse(null);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));

        // 파이프라인 범위(버즈): 본인 + 추천 하위 버즈
        java.util.List<Long> buzzIds = new java.util.ArrayList<>();
        buzzIds.add(me.getId());
        userRepo.findByReferralCode(me.getUserId()).forEach(u -> { if (!u.getId().equals(me.getId())) buzzIds.add(u.getId()); });
        List<Sale> sales = saleRepo.findAll((r, q, cb) -> r.get("buzzId").in(buzzIds));

        // 5단계 매핑 (실제 status → 표시 단계)
        long lead = 0, survey = 0, contract = 0, success = 0, settled = 0;
        Sale recent = null;
        for (Sale s : sales) {
            String st = s.getStatus() == null ? "" : s.getStatus();
            switch (st) {
                case "접수" -> lead++;
                case "상담/방문" -> survey++;
                case "계약체결" -> contract++;
                case "배송/설치" -> success++;
                case "구매확정" -> settled++;
                default -> {}
            }
            if (recent == null || (s.getId() != null && recent.getId() != null && s.getId() > recent.getId())) recent = s;
        }
        Map<String, Object> stages = new LinkedHashMap<>();
        stages.put("리드접수", lead);
        stages.put("매니저실사", survey);
        stages.put("계약대기", contract);
        stages.put("최종성공", success);
        stages.put("정산완료", settled);

        String recentMessage = recent == null ? null
                : "'" + (recent.getCompanyName() == null ? "고객" : recent.getCompanyName()) + "' 건이 ["
                  + (recent.getStatus() == null ? "접수" : recent.getStatus()) + "] 단계로 진행 중입니다.";

        long referredCount = userRepo.findByReferralCode(me.getUserId()).size();
        long networkIncome = paymentRepo.sumCumulative(me.getUserId(), List.of(Allowance.MemberType.TOPBUZZ));

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("stages", stages);
        m.put("recentMessage", recentMessage);
        m.put("referredCount", referredCount);
        m.put("networkIncome", networkIncome);
        m.put("referralCode", me.getUserId());
        return ResponseEntity.ok(m);
    }

    @GetMapping
    public ResponseEntity<?> dashboard(Authentication auth, @RequestParam(required = false) String as) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        User me = userRepo.findByUserId(auth.getName()).orElse(null);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        String mid = me.getUserId();
        boolean manager = "manager".equalsIgnoreCase(as);

        var BUZZ = List.of(Allowance.MemberType.BUZZ);
        var TOPBUZZ = List.of(Allowance.MemberType.TOPBUZZ);
        var MANAGER = List.of(Allowance.MemberType.MANAGER);
        List<Allowance.MemberType> types = manager ? MANAGER : List.of(Allowance.MemberType.BUZZ, Allowance.MemberType.TOPBUZZ);

        LocalDateTime from = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime to = from.plusMonths(1);

        long cp = allowanceRepo.sumMonthly(mid, Allowance.Status.CP, types, from, to);
        long mp = allowanceRepo.sumMonthly(mid, Allowance.Status.MP, types, from, to);

        // 수당 구성 4항목 (docs/11)
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("cp", cp);
        m.put("mp", mp);
        if (manager) {
            m.put("directCp", allowanceRepo.sumMonthly(mid, Allowance.Status.CP, MANAGER, from, to));                       // 관리 CP
            m.put("referralOrPenalty", allowanceRepo.sumMonthlyByTx(mid, Allowance.Status.MP, MANAGER, Allowance.Type.CANCEL_FEE, from, to)); // 패널티/보전
            m.put("confirmedMp", allowanceRepo.sumMonthly(mid, Allowance.Status.MP, MANAGER, from, to));                     // 이번달 확정 MP
            m.put("cumulativeMp", paymentRepo.sumCumulative(mid, MANAGER));                                                  // 누적 확정 MP
        } else {
            m.put("directCp", allowanceRepo.sumMonthly(mid, Allowance.Status.CP, BUZZ, from, to));                           // 직접영업 CP
            m.put("referralOrPenalty", allowanceRepo.sumMonthly(mid, Allowance.Status.CP, TOPBUZZ, from, to));              // 추천 네트워크 CP
            m.put("confirmedMp", allowanceRepo.sumMonthly(mid, Allowance.Status.MP, types, from, to));                       // 이번달 확정 MP
            m.put("cumulativeMp", paymentRepo.sumCumulative(mid, List.of(Allowance.MemberType.BUZZ, Allowance.MemberType.TOPBUZZ))); // 누적 확정 MP
        }
        return ResponseEntity.ok(m);
    }
}
