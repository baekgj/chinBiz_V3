package com.chinbiz.api.partner;

import com.chinbiz.api.partner.dto.PartnerResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 파트너사 본인(로그인 계정) 내 정보 조회/수정 (PARTNER 전용).
 * 토큰 subject(partnerId)로 partner 테이블 조회.
 */
@RestController
@RequestMapping("/api/partner")
public class PartnerSelfController {

    private final PartnerRepository partnerRepository;
    private final PasswordEncoder passwordEncoder;

    public PartnerSelfController(PartnerRepository partnerRepository, PasswordEncoder passwordEncoder) {
        this.partnerRepository = partnerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Partner p = partnerRepository.findByPartnerId(auth.getName()).orElse(null);
        if (p == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "파트너사를 찾을 수 없습니다."));
        return ResponseEntity.ok(PartnerResponse.of(p));
    }

    public record SelfUpdate(
            String managerName, String phone, String email,
            String bankName, String accountNumber, String accountHolder, String password) {}

    @PutMapping("/me")
    public ResponseEntity<?> update(Authentication auth, @RequestBody SelfUpdate req) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        Partner p = partnerRepository.findByPartnerId(auth.getName()).orElse(null);
        if (p == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "파트너사를 찾을 수 없습니다."));
        if (req.managerName() != null) p.setManagerName(req.managerName());
        if (req.phone() != null) p.setManagerPhone(req.phone());
        if (req.email() != null) p.setEmail(req.email());
        if (req.bankName() != null) p.setBankName(req.bankName());
        if (req.accountNumber() != null) p.setAccountNumber(req.accountNumber());
        if (req.accountHolder() != null) p.setAccountHolder(req.accountHolder());
        if (req.password() != null && !req.password().isBlank()) p.setPassword(passwordEncoder.encode(req.password()));
        partnerRepository.save(p);
        return ResponseEntity.ok(PartnerResponse.of(p));
    }
}
