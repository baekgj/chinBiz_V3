package com.chinbiz.api.user;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * user 테이블 계정 본인(로그인 사용자) 내 정보 조회/수정.
 * BUZZ·MANAGER·DIVISION_ADMIN·CENTER_ADMIN·MASTER_ADMIN 등 user 테이블 역할 공용.
 * (파트너는 partner 테이블 → PartnerSelfController)
 */
@RestController
@RequestMapping("/api/user")
public class UserSelfController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserSelfController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    private Map<String, Object> dto(User u) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("userId", u.getUserId());
        m.put("name", u.getName());
        m.put("email", u.getEmail());
        m.put("phone", u.getPhone());
        m.put("zipcode", u.getZipcode());
        m.put("address", u.getAddress());
        m.put("addressDetail", u.getAddressDetail());
        m.put("bankName", u.getBankName());
        m.put("accountNumber", u.getAccountNumber());
        m.put("accountHolder", u.getAccountHolder());
        m.put("role", u.getRole().name());
        m.put("referralCode", u.getReferralCode());
        m.put("salesCenterId", u.getSalesCenterId());
        return m;
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(Authentication auth) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        User u = userRepository.findByUserId(auth.getName()).orElse(null);
        if (u == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "사용자를 찾을 수 없습니다."));
        return ResponseEntity.ok(dto(u));
    }

    public record SelfUpdate(
            String name, String phone, String email,
            String zipcode, String address, String addressDetail,
            String bankName, String accountNumber, String accountHolder, String password) {}

    @PutMapping("/me")
    public ResponseEntity<?> update(Authentication auth, @RequestBody SelfUpdate req) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        User u = userRepository.findByUserId(auth.getName()).orElse(null);
        if (u == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "사용자를 찾을 수 없습니다."));
        if (req.name() != null) u.setName(req.name());
        if (req.phone() != null) u.setPhone(req.phone());
        if (req.email() != null) u.setEmail(req.email());
        if (req.zipcode() != null) u.setZipcode(req.zipcode());
        if (req.address() != null) u.setAddress(req.address());
        if (req.addressDetail() != null) u.setAddressDetail(req.addressDetail());
        if (req.bankName() != null) u.setBankName(req.bankName());
        if (req.accountNumber() != null) u.setAccountNumber(req.accountNumber());
        if (req.accountHolder() != null) u.setAccountHolder(req.accountHolder());
        if (req.password() != null && !req.password().isBlank()) u.setPassword(passwordEncoder.encode(req.password()));
        userRepository.save(u);
        return ResponseEntity.ok(dto(u));
    }
}
