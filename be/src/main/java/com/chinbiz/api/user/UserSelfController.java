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
    private final com.chinbiz.api.org.CenterCodeRepository centerCodeRepository;
    private final com.chinbiz.api.buzz.ManagerCenterRepository managerCenterRepository;

    public UserSelfController(UserRepository userRepository, PasswordEncoder passwordEncoder,
                             com.chinbiz.api.org.CenterCodeRepository centerCodeRepository,
                             com.chinbiz.api.buzz.ManagerCenterRepository managerCenterRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.centerCodeRepository = centerCodeRepository;
        this.managerCenterRepository = managerCenterRepository;
    }

    private String centerName(Long idx) {
        if (idx == null) return null;
        return centerCodeRepository.findById(idx).map(com.chinbiz.api.org.CenterCode::displayName).orElse(null);
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
        m.put("residentNumber", u.getResidentNumber());   // 주민등록번호(세금신고용, docs/22)
        m.put("role", u.getRole().name());
        m.put("referralCode", u.getReferralCode());
        m.put("salesCenterId", u.getSalesCenterId());
        m.put("salesCenterName", centerName(u.getSalesCenterId()));  // 소속센터명 (docs/20)
        // 추천회원 : 홍O동(hongXXXX) — referral_code = 추천인 userId
        String refLabel = null;
        if (u.getReferralCode() != null && !u.getReferralCode().isBlank()) {
            User ref = userRepository.findByUserId(u.getReferralCode().trim()).orElse(null);
            if (ref != null) refLabel = com.chinbiz.api.common.Mask.name(ref.getName()) + "(" + com.chinbiz.api.common.Mask.userId(ref.getUserId()) + ")";
            else refLabel = com.chinbiz.api.common.Mask.userId(u.getReferralCode());
        }
        m.put("referrerLabel", refLabel);
        // 매니저 활동신청 지역 (manager_center, 다중)
        java.util.List<Map<String, Object>> mcs = new java.util.ArrayList<>();
        for (com.chinbiz.api.buzz.ManagerCenter mc : managerCenterRepository.findByBuzzId(u.getId())) {
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("centerName", centerName(mc.getCenterId()));
            c.put("status", mc.getStatus());
            mcs.add(c);
        }
        m.put("managerCenters", mcs);
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
            String bankName, String accountNumber, String accountHolder, String residentNumber, String password) {}

    @PutMapping("/me")
    public ResponseEntity<?> update(Authentication auth, @RequestBody SelfUpdate req) {
        if (auth == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        User u = userRepository.findByUserId(auth.getName()).orElse(null);
        if (u == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "사용자를 찾을 수 없습니다."));
        // 주민등록번호(세금신고용): 입력 시 유효성 검증 후 숫자만 저장. 빈값이면 해제.
        if (req.residentNumber() != null) {
            String rrn = req.residentNumber().trim();
            if (rrn.isEmpty()) {
                u.setResidentNumber(null);
            } else if (com.chinbiz.api.common.ResidentNumber.isValid(rrn)) {
                u.setResidentNumber(com.chinbiz.api.common.ResidentNumber.normalize(rrn));
            } else {
                return ResponseEntity.badRequest().body(Map.of("message", "유효하지 않은 주민등록번호입니다."));
            }
        }
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
