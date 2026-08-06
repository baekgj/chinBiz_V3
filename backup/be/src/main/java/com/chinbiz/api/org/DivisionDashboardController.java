package com.chinbiz.api.org;

import com.chinbiz.api.allowance.Allowance;
import com.chinbiz.api.allowance.AllowanceRepository;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * 본부(DIVISION_ADMIN) 대시보드 — 이달 CP 예정수당 / MP 확정수당.
 * 회원구분 DIVISION(본부 수당), member_id = 로그인 userId 기준 합산.
 */
@RestController
@RequestMapping("/api/division/dashboard")
public class DivisionDashboardController {

    private final AllowanceRepository allowanceRepo;
    private final UserRepository userRepo;

    public DivisionDashboardController(AllowanceRepository allowanceRepo, UserRepository userRepo) {
        this.allowanceRepo = allowanceRepo; this.userRepo = userRepo;
    }

    @GetMapping
    public ResponseEntity<?> dashboard(Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        User me = userRepo.findByUserId(auth.getName()).orElse(null);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        var types = List.of(Allowance.MemberType.DIVISION);
        LocalDateTime from = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime to = from.plusMonths(1);
        long cp = allowanceRepo.sumMonthly(me.getUserId(), Allowance.Status.CP, types, from, to);
        long mp = allowanceRepo.sumMonthly(me.getUserId(), Allowance.Status.MP, types, from, to);
        return ResponseEntity.ok(Map.of("cp", cp, "mp", mp));
    }
}
