package com.chinbiz.api.edu;

import com.chinbiz.api.partner.PartnerRepository;
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
 * 교육관리 (본사 MASTER_ADMIN / 센터 CENTER_ADMIN).
 *  - GET  /api/education/pending   : 교육이수 신청(교육완료 & 미승인) 목록 → [승인완료]
 *  - POST /api/education/{id}/approve : 승인 처리
 *  - GET  /api/education/approved  : 교육이수 승인(신청일/승인일/담당자) 목록
 */
@RestController
@RequestMapping("/api/education")
public class EducationAdminController {

    private final EducationRepository eduRepo;
    private final ProductRepository productRepo;
    private final PartnerRepository partnerRepo;
    private final UserRepository userRepo;

    public EducationAdminController(EducationRepository eduRepo, ProductRepository productRepo, PartnerRepository partnerRepo, UserRepository userRepo) {
        this.eduRepo = eduRepo; this.productRepo = productRepo; this.partnerRepo = partnerRepo; this.userRepo = userRepo;
    }

    private String productName(Long id) { return id == null ? null : productRepo.findById(id).map(p -> p.getName()).orElse(null); }
    private String partnerName(Long id) { return id == null ? null : partnerRepo.findById(id).map(p -> p.getCompanyName()).orElse(null); }
    private String userName(Long id) { return id == null ? null : userRepo.findById(id).map(User::getName).orElse(null); }

    private Map<String, Object> dto(Education e) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", e.getId());
        m.put("productName", productName(e.getProductId()));
        m.put("partnerName", partnerName(e.getPartnerId()));
        m.put("managerName", userName(e.getManagerId()));
        m.put("managerReferralCode", e.getManagerReferralCode());
        m.put("completed", e.isCompleted());
        m.put("approved", e.isApproved());
        m.put("appliedAt", e.getCompletedAt() == null ? null : e.getCompletedAt().toLocalDate().toString()); // 교육신청일
        m.put("approvedAt", e.getApprovedAt() == null ? null : e.getApprovedAt().toLocalDate().toString());   // 승인일
        m.put("approverName", userName(e.getApproverId()));
        return m;
    }

    /** 교육이수 신청 목록 (교육완료 & 미승인) */
    @GetMapping("/pending")
    public Map<String, Object> pending() {
        return Map.of("content", eduRepo.findByCompletedTrueAndApprovedFalseOrderByCompletedAtDesc().stream().map(this::dto).toList());
    }

    /** 승인 처리 */
    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approve(Authentication auth, @PathVariable Long id) {
        Education e = eduRepo.findById(id).orElse(null);
        if (e == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "교육 내역을 찾을 수 없습니다."));
        if (!e.isCompleted()) return ResponseEntity.badRequest().body(Map.of("message", "교육완료된 건만 승인할 수 있습니다."));
        e.setApproved(true);
        e.setApprovedAt(LocalDateTime.now());
        User approver = auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null);
        e.setApproverId(approver == null ? null : approver.getId());
        eduRepo.save(e);
        return ResponseEntity.ok(dto(e));
    }

    /** 교육이수 승인 목록 (승인 완료 내역) */
    @GetMapping("/approved")
    public Map<String, Object> approved() {
        return Map.of("content", eduRepo.findByApprovedTrueOrderByApprovedAtDesc().stream().map(this::dto).toList());
    }
}
