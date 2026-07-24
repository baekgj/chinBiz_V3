package com.chinbiz.api.partner;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 파트너 상담신청.
 *  - POST /api/public/partner-inquiry : home 입점제안 접수 (공개)
 *  - GET  /api/partners/inquiries : 본사 상담신청 목록 (MASTER_ADMIN)
 *  - POST /api/partners/inquiries/{id}/status : 상담완료(DONE)/신청취소(CANCELED)
 */
@RestController
public class PartnerInquiryController {

    private final PartnerInquiryRepository repo;

    public PartnerInquiryController(PartnerInquiryRepository repo) { this.repo = repo; }

    private Map<String, Object> dto(PartnerInquiry q) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", q.getId());
        m.put("companyName", q.getCompanyName());
        m.put("contactName", q.getContactName());
        m.put("phone", q.getPhone());
        m.put("email", q.getEmail());
        m.put("stage", q.getStage());
        m.put("message", q.getMessage());
        m.put("status", q.getStatus());
        m.put("createdAt", q.getCreatedAt() == null ? null : q.getCreatedAt().toString());
        return m;
    }

    public record InquiryRequest(String companyName, String contactName, String phone, String email, String stage, String message) {}

    /** 공개 접수 (home) */
    @PostMapping("/api/public/partner-inquiry")
    public ResponseEntity<?> submit(@RequestBody InquiryRequest req) {
        if (req.companyName() == null || req.companyName().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "회사명을 입력해 주세요."));
        if ((req.phone() == null || req.phone().isBlank()) && (req.email() == null || req.email().isBlank()))
            return ResponseEntity.badRequest().body(Map.of("message", "연락처 또는 이메일을 입력해 주세요."));
        PartnerInquiry q = new PartnerInquiry();
        q.setCompanyName(req.companyName().trim());
        q.setContactName(req.contactName());
        q.setPhone(req.phone());
        q.setEmail(req.email());
        q.setStage(req.stage());
        q.setMessage(req.message());
        q.setStatus("NEW");
        repo.save(q);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "입점 상담 신청이 접수되었습니다. 24시간 이내 연락드립니다."));
    }

    /** 본사 상담신청 목록 */
    @GetMapping("/api/partners/inquiries")
    public ResponseEntity<?> list() {
        return ResponseEntity.ok(Map.of("content", repo.findAllByOrderByIdDesc().stream().map(this::dto).toList()));
    }

    public record StatusRequest(String status) {}

    /** 상담완료(DONE)/신청취소(CANCELED) */
    @PostMapping("/api/partners/inquiries/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody StatusRequest req) {
        PartnerInquiry q = repo.findById(id).orElse(null);
        if (q == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "상담신청을 찾을 수 없습니다."));
        String s = req.status() == null ? "" : req.status().trim().toUpperCase();
        if (!s.equals("DONE") && !s.equals("CANCELED"))
            return ResponseEntity.badRequest().body(Map.of("message", "status는 DONE 또는 CANCELED 여야 합니다."));
        q.setStatus(s);
        repo.save(q);
        return ResponseEntity.ok(Map.of("message", s.equals("DONE") ? "상담완료 처리되었습니다." : "신청취소 처리되었습니다.", "status", s));
    }
}
