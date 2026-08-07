package com.chinbiz.api.org;

import com.chinbiz.api.alarm.AlarmService;
import com.chinbiz.api.buzz.ManagerCenter;
import com.chinbiz.api.buzz.ManagerCenterRepository;
import com.chinbiz.api.buzz.Sale;
import com.chinbiz.api.buzz.SaleRepository;
import com.chinbiz.api.product.Product;
import com.chinbiz.api.product.ProductRepository;
import com.chinbiz.api.user.Role;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 본사(MASTER_ADMIN) 매니저 신청 관리 (docs/20). [조직망 및 영업관리]-[매니저신청].
 *  - GET  /api/org/manager-applications?status=I|Y : 신청접수(I)/승인완료(Y) 목록(전 센터)
 *  - POST /api/org/manager-applications/{buzzId}/{centerId}/approve : 승인 → 매니저·센터 알람
 *  - POST /api/org/manager-applications/{buzzId}/{centerId}/cancel  : 승인취소 → 매니저·센터 알람
 */
@RestController
@RequestMapping("/api/org/manager-applications")
public class MasterManagerController {

    private final ManagerCenterRepository managerCenterRepo;
    private final UserRepository userRepo;
    private final CenterCodeRepository centerCodeRepo;
    private final SaleRepository saleRepo;
    private final ProductRepository productRepo;
    private final AlarmService alarmService;

    public MasterManagerController(ManagerCenterRepository managerCenterRepo, UserRepository userRepo,
                                   CenterCodeRepository centerCodeRepo, SaleRepository saleRepo,
                                   ProductRepository productRepo, AlarmService alarmService) {
        this.managerCenterRepo = managerCenterRepo; this.userRepo = userRepo;
        this.centerCodeRepo = centerCodeRepo; this.saleRepo = saleRepo;
        this.productRepo = productRepo; this.alarmService = alarmService;
    }

    private String centerName(Long idx) {
        if (idx == null) return null;
        return centerCodeRepo.findById(idx).map(CenterCode::displayName).orElse(null);
    }

    /** 매니저(user.id)의 최근 3개월 2차영업 실적 [건수, 금액(상품 판매가 합)] */
    private long[] recentPerf(Long managerId) {
        LocalDateTime cutoff = LocalDate.now().minusMonths(3).atStartOfDay();
        long cnt = 0, amt = 0;
        for (Sale s : saleRepo.findAll()) {
            if (!managerId.equals(s.getManagerId())) continue;
            LocalDateTime when = s.getManagerDatedAt() != null ? s.getManagerDatedAt() : s.getCreatedAt();
            if (when == null || when.isBefore(cutoff)) continue;
            cnt++;
            if (s.getProductId() != null) {
                Product p = productRepo.findById(s.getProductId()).orElse(null);
                if (p != null && p.getSalePrice() != null) amt += p.getSalePrice();
            }
        }
        return new long[]{ cnt, amt };
    }

    private Map<String, Object> dto(ManagerCenter mc, boolean withPerf) {
        User u = userRepo.findById(mc.getBuzzId()).orElse(null);
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("buzzId", mc.getBuzzId());
        m.put("userId", u == null ? null : u.getUserId());
        m.put("name", u == null ? null : u.getName());
        m.put("centerId", mc.getCenterId());
        m.put("centerName", centerName(mc.getCenterId()));
        m.put("applyDate", mc.getApplyDate() == null ? null : mc.getApplyDate().toString());
        m.put("approveDate", mc.getApproveDate() == null ? null : mc.getApproveDate().toString());
        if (withPerf) {
            long[] perf = recentPerf(mc.getBuzzId());
            m.put("recentCount", perf[0]);
            m.put("recentAmount", perf[1]);
        }
        return m;
    }

    /** 신청접수(I) / 승인완료(Y) 목록 */
    @GetMapping
    public ResponseEntity<?> list(@RequestParam(defaultValue = "I") String status) {
        String st = "Y".equalsIgnoreCase(status) ? "Y" : "I";
        // 전 센터 대상 — status 로 필터
        List<Map<String, Object>> rows = new ArrayList<>();
        for (ManagerCenter mc : managerCenterRepo.findAll())
            if (st.equals(mc.getStatus())) rows.add(dto(mc, "Y".equals(st)));
        rows.sort((a, b) -> String.valueOf(b.get("applyDate")).compareTo(String.valueOf(a.get("applyDate"))));
        return ResponseEntity.ok(Map.of("content", rows));
    }

    /** 승인 — 해당 (buzz,center) 행 Y + 매니저 승급, 매니저·센터 알람 */
    @PostMapping("/{buzzId}/{centerId}/approve")
    @Transactional
    public ResponseEntity<?> approve(@PathVariable Long buzzId, @PathVariable Long centerId) {
        ManagerCenter mc = managerCenterRepo.findByBuzzIdAndCenterId(buzzId, centerId).orElse(null);
        if (mc == null || !"I".equals(mc.getStatus()))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "승인 대상 신청이 아닙니다."));
        User u = userRepo.findById(buzzId).orElse(null);
        if (u == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "회원을 찾을 수 없습니다."));
        mc.setStatus("Y");
        mc.setApproveDate(LocalDate.now());
        managerCenterRepo.save(mc);
        u.setRole(Role.MANAGER);
        userRepo.save(u);
        try { alarmService.fireManagerApprove(u, centerId); } catch (Exception ignore) {}
        return ResponseEntity.ok(Map.of("message", "매니저로 승인되었습니다."));
    }

    /** 승인취소 — 해당 (buzz,center) 승인(Y) 행 제거, 매니저·센터 알람. 남은 승인센터 없으면 role BUZZ 로 */
    @PostMapping("/{buzzId}/{centerId}/cancel")
    @Transactional
    public ResponseEntity<?> cancel(@PathVariable Long buzzId, @PathVariable Long centerId) {
        ManagerCenter mc = managerCenterRepo.findByBuzzIdAndCenterId(buzzId, centerId).orElse(null);
        if (mc == null || !"Y".equals(mc.getStatus()))
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "취소 대상(승인완료)이 아닙니다."));
        User u = userRepo.findById(buzzId).orElse(null);
        // 알람 먼저(센터명·매니저 정보 있는 상태) 발송 후 행 제거
        if (u != null) { try { alarmService.fireManagerApproveCancel(u, centerId); } catch (Exception ignore) {} }
        managerCenterRepo.delete(mc);
        // 남은 승인 활동센터가 없으면 매니저 → 버즈로 강등
        if (u != null && managerCenterRepo.findByBuzzIdAndStatus(buzzId, "Y").isEmpty() && u.getRole() == Role.MANAGER) {
            u.setRole(Role.BUZZ);
            userRepo.save(u);
        }
        return ResponseEntity.ok(Map.of("message", "매니저 승인이 취소되었습니다."));
    }
}
