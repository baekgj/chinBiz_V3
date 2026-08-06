package com.chinbiz.api.terms;

import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 약관 동의 게이트 — 센터/본부 담당자 최초 로그인 시 이용약관 동의 처리.
 *  - GET  /api/my/agreement?code=CENTER  : 동의 여부 조회 { agreed }
 *  - POST /api/my/agreement { code }      : 동의 기록 저장 (로그인ID·IP·시간·role)
 *  (/api/my/** = 인증 사용자 공용)
 */
@RestController
@RequestMapping("/api/my/agreement")
public class TermAgreementController {

    private final TermAgreementRepository repo;
    private final UserRepository userRepo;

    public TermAgreementController(TermAgreementRepository repo, UserRepository userRepo) {
        this.repo = repo; this.userRepo = userRepo;
    }

    @GetMapping
    public ResponseEntity<?> status(@RequestParam String code, Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        return ResponseEntity.ok(Map.of("agreed", repo.existsByLoginIdAndTermCode(auth.getName(), code)));
    }

    public record AgreeRequest(String code) {}

    @PostMapping
    public ResponseEntity<?> agree(@RequestBody AgreeRequest req, Authentication auth, HttpServletRequest http) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        if (req.code() == null || req.code().isBlank())
            return ResponseEntity.badRequest().body(Map.of("message", "약관 코드가 필요합니다."));

        String loginId = auth.getName();
        // 이미 동의했으면 중복 저장하지 않음(멱등)
        if (repo.existsByLoginIdAndTermCode(loginId, req.code()))
            return ResponseEntity.ok(Map.of("agreed", true, "message", "이미 동의한 약관입니다."));

        User me = userRepo.findByUserId(loginId).orElse(null);
        String role = me != null && me.getRole() != null ? me.getRole().name() : null;
        repo.save(new TermAgreement(loginId, req.code(), role, clientIp(http)));
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("agreed", true, "message", "약관에 동의하였습니다."));
    }

    /** 프록시 환경 고려한 클라이언트 IP 추출 */
    private String clientIp(HttpServletRequest req) {
        String xff = req.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) return xff.split(",")[0].trim();
        String real = req.getHeader("X-Real-IP");
        if (real != null && !real.isBlank()) return real.trim();
        return req.getRemoteAddr();
    }
}
