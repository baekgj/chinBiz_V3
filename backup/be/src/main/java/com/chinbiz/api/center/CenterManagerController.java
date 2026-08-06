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
    private final com.chinbiz.api.alarm.AlarmService alarmService;
    private final com.chinbiz.api.buzz.ManagerCenterRepository managerCenterRepo;

    public CenterManagerController(UserRepository userRepo, CenterCodeRepository centerCodeRepository, AllowanceRepository allowanceRepo,
                                   com.chinbiz.api.alarm.AlarmService alarmService,
                                   com.chinbiz.api.buzz.ManagerCenterRepository managerCenterRepo) {
        this.userRepo = userRepo; this.centerCodeRepository = centerCodeRepository; this.allowanceRepo = allowanceRepo;
        this.alarmService = alarmService; this.managerCenterRepo = managerCenterRepo;
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

    /** manager_center 행 + 신청 버즈 정보로 dto 구성 (해당 센터 기준 신청/승인일) */
    private Map<String, Object> dto(com.chinbiz.api.buzz.ManagerCenter mc) {
        User u = userRepo.findById(mc.getBuzzId()).orElse(null);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", mc.getBuzzId());
        m.put("userId", u == null ? null : u.getUserId());
        m.put("name", u == null ? null : u.getName());
        m.put("phone", u == null ? null : u.getPhone());
        m.put("email", u == null ? null : u.getEmail());
        m.put("managerCenterId", mc.getCenterId());
        m.put("managerCenterName", centerName(mc.getCenterId()));
        m.put("managerStatus", mc.getStatus());
        m.put("managerSdate", mc.getApplyDate() == null ? null : mc.getApplyDate().toString());     // 신청일
        m.put("managerEdate", mc.getApproveDate() == null ? null : mc.getApproveDate().toString()); // 승인일
        return m;
    }

    /** 매니저 신청 목록 — 내 센터로 신청(status=I)한 manager_center 행 */
    @GetMapping("/manager-applications")
    public ResponseEntity<?> applications(Authentication auth) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Long myCenter = me.getSalesCenterId();
        List<Map<String, Object>> list = myCenter == null ? List.of()
                : managerCenterRepo.findByCenterIdAndStatus(myCenter, "I").stream().map(this::dto).toList();
        return ResponseEntity.ok(Map.of("content", list));
    }

    /** 매니저 승인 — 해당 (버즈,내센터) manager_center 행 승인(Y) + user.role=MANAGER (denorm 동기화) */
    @PostMapping("/manager-applications/{id}/approve")
    public ResponseEntity<?> approve(Authentication auth, @PathVariable Long id) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Long myCenter = me.getSalesCenterId();
        com.chinbiz.api.buzz.ManagerCenter mc = myCenter == null ? null
                : managerCenterRepo.findByBuzzIdAndCenterId(id, myCenter).orElse(null);
        if (mc == null || !"I".equals(mc.getStatus()))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "승인 대상 신청 건이 아닙니다."));
        User u = userRepo.findById(id).orElse(null);
        if (u == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "회원을 찾을 수 없습니다."));
        LocalDate today = LocalDate.now();
        mc.setStatus("Y");
        mc.setApproveDate(today);
        managerCenterRepo.save(mc);
        // 역할 승급 (매니저 신청/승인의 실제 상태는 manager_center 가 소스, docs/19)
        u.setRole(Role.MANAGER);
        userRepo.save(u);
        // [매니저승인] 알람 (매니저 본인) — docs/16 · 승인센터 기준
        try { alarmService.fireManagerApprove(u, myCenter); } catch (Exception ignore) {}
        return ResponseEntity.ok(Map.of("message", "매니저로 승인되었습니다.", "userId", u.getUserId()));
    }

    /** 승인된 매니저 목록 — 내 센터로 승인(status=Y)된 manager_center 행 */
    @GetMapping("/managers")
    public ResponseEntity<?> managers(Authentication auth) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Long myCenter = me.getSalesCenterId();
        List<Map<String, Object>> list = myCenter == null ? List.of()
                : managerCenterRepo.findByCenterIdAndStatus(myCenter, "Y").stream().map(this::dto).toList();
        return ResponseEntity.ok(Map.of("content", list));
    }
}
