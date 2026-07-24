package com.chinbiz.api.org;

import com.chinbiz.api.allowance.Allowance;
import com.chinbiz.api.allowance.AllowanceRepository;
import com.chinbiz.api.buzz.SaleRepository;
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
 * 본사(MASTER_ADMIN) 대시보드 — 금월 플랫폼 총거래액(전월대비) / 본사 확정수익(전월대비).
 *  - 총거래액: 이달 등록된 sale × product.salePrice 합산
 *  - 확정수익: 회원구분 HQ, 상태 MP, member_id=로그인(본사) 이달 합산
 */
@RestController
@RequestMapping("/api/org/dashboard")
public class MasterDashboardController {

    private final SaleRepository saleRepo;
    private final AllowanceRepository allowanceRepo;
    private final UserRepository userRepo;

    public MasterDashboardController(SaleRepository saleRepo, AllowanceRepository allowanceRepo, UserRepository userRepo) {
        this.saleRepo = saleRepo; this.allowanceRepo = allowanceRepo; this.userRepo = userRepo;
    }

    /** 전월 대비 증감률(%) — 반올림 정수. 전월 0이면 이번달>0=100, 아니면 0 */
    private long rate(long cur, long prev) {
        if (prev == 0) return cur > 0 ? 100 : 0;
        return Math.round((cur - prev) * 100.0 / prev);
    }

    @GetMapping
    public ResponseEntity<?> dashboard(Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        User me = userRepo.findByUserId(auth.getName()).orElse(null);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));

        LocalDateTime curFrom = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime curTo = curFrom.plusMonths(1);
        LocalDateTime prevFrom = curFrom.minusMonths(1);

        // 금월/전월 총거래액(GMV)
        long gmvCur = saleRepo.sumGmvBetween(curFrom, curTo);
        long gmvPrev = saleRepo.sumGmvBetween(prevFrom, curFrom);

        // 금월/전월 본사 확정수익 (HQ, MP)
        var hq = List.of(Allowance.MemberType.HQ);
        long profitCur = allowanceRepo.sumMonthly(me.getUserId(), Allowance.Status.MP, hq, curFrom, curTo);
        long profitPrev = allowanceRepo.sumMonthly(me.getUserId(), Allowance.Status.MP, hq, prevFrom, curFrom);

        Map<String, Object> m = new LinkedHashMap<>();
        m.put("gmv", gmvCur);
        m.put("gmvRate", rate(gmvCur, gmvPrev));
        m.put("profit", profitCur);
        m.put("profitRate", rate(profitCur, profitPrev));
        return ResponseEntity.ok(m);
    }
}
