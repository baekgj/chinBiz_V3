package com.chinbiz.api.partner;

import com.chinbiz.api.partner.dto.PartnerRequest;
import com.chinbiz.api.partner.dto.PartnerResponse;
import com.chinbiz.api.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 파트너사 관리 API (본사 어드민 전용). partner 테이블 CRUD.
 *  - GET  /api/partners?page=&size=   목록(페이징)
 *  - POST /api/partners               등록
 *  - GET  /api/partners/{id}          단건
 *  - PUT  /api/partners/{id}          수정 (password 비우면 기존 유지)
 *  - GET  /api/partners/check-id      아이디 중복확인 (user + partner 양쪽)
 */
@RestController
@RequestMapping("/api/partners")
public class PartnerController {

    private final PartnerRepository partnerRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public PartnerController(PartnerRepository partnerRepository, UserRepository userRepository,
                             PasswordEncoder passwordEncoder) {
        this.partnerRepository = partnerRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** 아이디 중복확인: user 테이블과 partner 테이블 모두 검사 */
    @GetMapping("/check-id")
    public Map<String, Object> checkId(@RequestParam String loginId) {
        boolean taken = userRepository.existsByUserId(loginId) || partnerRepository.existsByPartnerId(loginId);
        return Map.of("loginId", loginId, "available", !taken);
    }

    /** 목록 (페이징) */
    @GetMapping
    public Map<String, Object> list(@RequestParam(defaultValue = "0") int page,
                                    @RequestParam(defaultValue = "10") int size) {
        Page<Partner> p = partnerRepository.findAll(
                PageRequest.of(Math.max(page, 0), Math.max(size, 1), Sort.by(Sort.Direction.DESC, "id")));
        List<PartnerResponse> content = p.getContent().stream().map(PartnerResponse::of).toList();
        return Map.of(
                "content", content,
                "page", p.getNumber(),
                "size", p.getSize(),
                "totalElements", p.getTotalElements(),
                "totalPages", p.getTotalPages()
        );
    }

    /** 단건 */
    @GetMapping("/{id}")
    public ResponseEntity<?> get(@PathVariable Long id) {
        return partnerRepository.findById(id)
                .map(p -> ResponseEntity.ok((Object) PartnerResponse.of(p)))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "파트너사를 찾을 수 없습니다.")));
    }

    /** 등록 */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody PartnerRequest req) {
        if (isBlank(req.companyName())) return ResponseEntity.badRequest().body(Map.of("message", "상호명을 입력해 주세요."));
        String ve = com.chinbiz.api.common.AccountValidation.createError(req.partnerId(), req.password());
        if (ve != null) return ResponseEntity.badRequest().body(Map.of("message", ve));
        if (userRepository.existsByUserId(req.partnerId()) || partnerRepository.existsByPartnerId(req.partnerId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("message", "이미 사용 중인 아이디입니다."));
        }
        Partner p = new Partner();
        p.setPartnerId(req.partnerId());
        p.setPassword(passwordEncoder.encode(req.password()));
        apply(p, req);
        partnerRepository.save(p);
        return ResponseEntity.status(HttpStatus.CREATED).body(PartnerResponse.of(p));
    }

    /** 수정 (partnerId 는 변경 불가, password 비우면 기존 유지) */
    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable Long id, @RequestBody PartnerRequest req) {
        Partner p = partnerRepository.findById(id).orElse(null);
        if (p == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "파트너사를 찾을 수 없습니다."));
        }
        if (!isBlank(req.password())) {
            p.setPassword(passwordEncoder.encode(req.password()));
        }
        apply(p, req);
        partnerRepository.save(p);
        return ResponseEntity.ok(PartnerResponse.of(p));
    }

    private void apply(Partner p, PartnerRequest req) {
        p.setCompanyName(req.companyName());
        p.setBusinessNumber(req.businessNumber());
        p.setCeoName(req.ceoName());
        p.setCompanyPhone(req.companyPhone());
        p.setZipcode(req.zipcode());
        p.setAddress(req.address());
        p.setAddressDetail(req.addressDetail());
        p.setManagerName(req.managerName());
        p.setManagerPhone(req.managerPhone());
        p.setEmail(req.email());
        p.setBankName(req.bankName());
        p.setAccountNumber(req.accountNumber());
        p.setAccountHolder(req.accountHolder());
    }

    private boolean isBlank(String s) { return s == null || s.trim().isEmpty(); }
}
