package com.chinbiz.api.edu;

import com.chinbiz.api.partner.Partner;
import com.chinbiz.api.partner.PartnerRepository;
import com.chinbiz.api.product.Product;
import com.chinbiz.api.product.ProductRepository;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 매니저 교육관리 (BUZZ/MANAGER 워크스페이스).
 * 파트너사가 등록한 상품 목록 + 로그인 매니저의 이수/승인 상태. [교육완료] 처리.
 */
@RestController
@RequestMapping("/api/buzz/education")
public class BuzzEducationController {

    private final EducationRepository eduRepo;
    private final ProductRepository productRepo;
    private final PartnerRepository partnerRepo;
    private final UserRepository userRepo;
    private final com.chinbiz.api.alarm.AlarmService alarmService;

    public BuzzEducationController(EducationRepository eduRepo, ProductRepository productRepo, PartnerRepository partnerRepo, UserRepository userRepo,
                                   com.chinbiz.api.alarm.AlarmService alarmService) {
        this.eduRepo = eduRepo; this.productRepo = productRepo; this.partnerRepo = partnerRepo; this.userRepo = userRepo;
        this.alarmService = alarmService;
    }

    private User me(Authentication auth) { return auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null); }

    /** 파트너 상품별 교육 이수/승인 현황 */
    @GetMapping
    public ResponseEntity<?> list(Authentication auth) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Map<Long, String> pn = new LinkedHashMap<>();
        partnerRepo.findAll().forEach(p -> pn.put(p.getId(), p.getCompanyName()));

        // 이수완료(completed)된 상품은 목록에서 제외 → 아직 이수 전인 상품만 노출.
        // 단순배송상품(simple_delivery)은 교육 대상에서 제외 (docs/11)
        List<Map<String, Object>> rows = productRepo.findAll().stream()
                .filter(p -> p.getPartnerId() != null && !p.isSimpleDelivery())
                .filter(p -> {
                    Education e = eduRepo.findByProductIdAndManagerId(p.getId(), me.getId()).orElse(null);
                    return e == null || !e.isCompleted();
                })
                .map(p -> {
                    Education e = eduRepo.findByProductIdAndManagerId(p.getId(), me.getId()).orElse(null);
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("productId", p.getId());
                    m.put("productName", p.getName());
                    m.put("partnerId", p.getPartnerId());
                    m.put("partnerName", pn.get(p.getPartnerId()));
                    m.put("completed", e != null && e.isCompleted());
                    m.put("approved", e != null && e.isApproved());
                    m.put("completedAt", e != null && e.getCompletedAt() != null ? e.getCompletedAt().toLocalDate().toString() : null);
                    return m;
                }).toList();
        return ResponseEntity.ok(Map.of("content", rows));
    }

    /** 교육완료 처리 (upsert: completed=true) */
    @PostMapping("/complete")
    public ResponseEntity<?> complete(Authentication auth, @RequestBody Map<String, Object> body) {
        User me = me(auth);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Long productId = body.get("productId") == null ? null : Long.valueOf(String.valueOf(body.get("productId")));
        if (productId == null) return ResponseEntity.badRequest().body(Map.of("message", "상품을 선택해 주세요."));
        Product p = productRepo.findById(productId).orElse(null);
        if (p == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "상품을 찾을 수 없습니다."));

        // 자동 배정 허용 동의여부 (동의=true / 미동의=false)
        boolean autoAssign = body.get("autoAssign") != null && Boolean.parseBoolean(String.valueOf(body.get("autoAssign")));

        Education e = eduRepo.findByProductIdAndManagerId(productId, me.getId()).orElseGet(Education::new);
        e.setProductId(productId);
        e.setPartnerId(p.getPartnerId());
        e.setManagerId(me.getId());
        e.setManagerReferralCode(me.getReferralCode());
        e.setCompleted(true);
        e.setAutoAssign(autoAssign);
        if (e.getCompletedAt() == null) e.setCompletedAt(LocalDateTime.now());
        eduRepo.save(e);
        // [교육신청] 알람 (센터/본사) — docs/16
        try { alarmService.fireEduApply(me, p.getName(), e.getId()); } catch (Exception ignore) {}
        return ResponseEntity.ok(Map.of("message", autoAssign ? "교육완료 및 자동배정 동의로 처리되었습니다." : "교육완료(자동배정 미동의)로 처리되었습니다.",
                "completed", true, "approved", e.isApproved(), "autoAssign", autoAssign));
    }
}
