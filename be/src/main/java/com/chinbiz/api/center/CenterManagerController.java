package com.chinbiz.api.center;

import com.chinbiz.api.allowance.Allowance;
import com.chinbiz.api.allowance.AllowanceRepository;
import com.chinbiz.api.org.CenterCode;
import com.chinbiz.api.org.CenterCodeRepository;
import com.chinbiz.api.user.Role;
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
 * 센터(CENTER_ADMIN) 소속 매니저 관리.
 *  - GET  /api/center/manager-applications  : 매니저 신청 목록(BUZZ, manager_center_id=내 센터, status=I)
 *  - POST /api/center/manager-applications/{id}/approve : 승인 → role=MANAGER, status=Y, manager_edate=오늘
 *  - GET  /api/center/managers              : 승인된 매니저(MANAGER, manager_center_id=내 센터, status=Y)
 */
@RestController
@RequestMapping("/api/center")
public class CenterManagerController {

    private final UserRepository userRepo;
    private final CenterCodeRepository centerCodeRepository;
    private final AllowanceRepository allowanceRepo;

    public CenterManagerController(UserRepository userRepo, CenterCodeRepository centerCodeRepository, AllowanceRepository allowanceRepo) {
        this.userRepo = userRepo; this.centerCodeRepository = centerCodeRepository; this.allowanceRepo = allowanceRepo;
    }

    /** 센터 대시보드 — CP/MP (BUZZ_CENTER+MANAGER_CENTER) + 버즈/매니저 분리, 이달 기준 */
    @GetMapping("/dashboard")
    public ResponseEntity<?> dashboard(Authentication auth) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        String mid = me.getUserId();
        LocalDateTime from = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime to = from.plusMonths(1);
        var bc = List.of(Allowance.MemberType.BUZZ_CENTER);
        var mc = List.of(Allowance.MemberType.MANAGER_CENTER);
        long cpBuzz = allowanceRepo.sumMonthly(mid, Allowance.Status.CP, bc, from, to);
        long cpMgr  = allowanceRepo.sumMonthly(mid, Allowance.Status.CP, mc, from, to);
        long mpBuzz = allowanceRepo.sumMonthly(mid, Allowance.Status.MP, bc, from, to);
        long mpMgr  = allowanceRepo.sumMonthly(mid, Allowance.Status.MP, mc, from, to);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("cp", cpBuzz + cpMgr);
        m.put("cpBuzz", cpBuzz);
        m.put("cpManager", cpMgr);
        m.put("mp", mpBuzz + mpMgr);
        m.put("mpBuzz", mpBuzz);
        m.put("mpManager", mpMgr);
        return ResponseEntity.ok(m);
    }

    private User me(Authentication auth) { return auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null); }

    private String centerName(Long idx) {
        if (idx == null) return null;
        return centerCodeRepository.findById(idx).map(CenterCode::displayName).orElse(null);
    }

    private Map<String, Object> dto(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", u.getId());
        m.put("userId", u.getUserId());
        m.put("name", u.getName());
        m.put("phone", u.getPhone());
        m.put("email", u.getEmail());
        m.put("managerCenterId", u.getManagerCenterId());
        m.put("managerCenterName", centerName(u.getManagerCenterId()));
        m.put("managerStatus", u.getManagerStatus());
        m.put("managerSdate", u.getManagerSdate());   // 신청일
        m.put("managerEdate", u.getManagerEdate());   // 승인일
        m.put("managerCode", u.getManagerCode());
        return m;
    }

    /** 매니저 신청 목록 — 내 센터(sales_center_id)로 신청(status=I)한 BUZZ */
    @GetMapping("/manager-applications")
    public ResponseEntity<?> applications(Authentication auth) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Long myCenter = me.getSalesCenterId();
        List<Map<String, Object>> list = myCenter == null ? List.of()
                : userRepo.findByRole(Role.BUZZ).stream()
                    .filter(u -> myCenter.equals(u.getManagerCenterId()) && "I".equals(u.getManagerStatus()))
                    .map(this::dto).toList();
        return ResponseEntity.ok(Map.of("content", list));
    }

    /** 매니저 승인 — role=MANAGER, status=Y, manager_edate=오늘 */
    @PostMapping("/manager-applications/{id}/approve")
    public ResponseEntity<?> approve(Authentication auth, @PathVariable Long id) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Long myCenter = me.getSalesCenterId();
        User u = userRepo.findById(id).orElse(null);
        if (u == null || myCenter == null || !myCenter.equals(u.getManagerCenterId()) || !"I".equals(u.getManagerStatus()))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "승인 대상 신청 건이 아닙니다."));
        u.setRole(Role.MANAGER);
        u.setManagerStatus("Y");
        u.setManagerEdate(LocalDate.now().toString());
        userRepo.save(u);
        return ResponseEntity.ok(Map.of("message", "매니저로 승인되었습니다.", "userId", u.getUserId()));
    }

    /** 승인된 매니저 목록 — 내 센터 소속(MANAGER, status=Y) */
    @GetMapping("/managers")
    public ResponseEntity<?> managers(Authentication auth) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Long myCenter = me.getSalesCenterId();
        List<Map<String, Object>> list = myCenter == null ? List.of()
                : userRepo.findByRole(Role.MANAGER).stream()
                    .filter(u -> myCenter.equals(u.getManagerCenterId()) && "Y".equals(u.getManagerStatus()))
                    .map(this::dto).toList();
        return ResponseEntity.ok(Map.of("content", list));
    }
}
