package com.chinbiz.api.config;

import com.chinbiz.api.partner.Partner;
import com.chinbiz.api.partner.PartnerRepository;
import com.chinbiz.api.user.Role;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * 개발용 시드 데이터. 기동 시 테스트 계정을 생성(없을 때만).
 *  - admin   / sample1234!  (role=MASTER_ADMIN)      → user 테이블
 *  - partner / sample1234!  (파트너사 삼화정공사)      → partner 테이블
 * 비밀번호는 BCrypt 해시로 저장.
 *
 * ※ 파트너 계정은 반드시 partner 테이블에만 저장한다(user 테이블 사용 금지).
 *    과거 user 테이블에 잘못 생성된 PARTNER 계정은 기동 시 정리(삭제)한다.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PartnerRepository partnerRepository;
    private final PasswordEncoder passwordEncoder;

    public DataSeeder(UserRepository userRepository, PartnerRepository partnerRepository,
                      PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.partnerRepository = partnerRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedUser("admin", "sample1234!", "본사관리자", "admin@chinbiz.com", Role.MASTER_ADMIN);
        seedUser("division", "sample1234!", "서울총괄본부", "division@chinbiz.com", Role.DIVISION_ADMIN);
        seedUser("center", "sample1234!", "강남 제1센터", "center@chinbiz.com", Role.CENTER_ADMIN);

        // 과거 user 테이블에 저장됐던 파트너 계정 정리 → partner 테이블로 일원화
        userRepository.findByUserId("partner")
                .filter(u -> u.getRole() == Role.PARTNER)
                .ifPresent(u -> {
                    userRepository.delete(u);
                    System.out.println("[DataSeeder] user 테이블의 PARTNER 계정 'partner' 삭제(partner 테이블로 이전)");
                });

        seedPartner("partner", "sample1234!", "삼화정공사", "김담당", "partner@chinbiz.com");
        // center_code 는 원본 chin4 데이터 재사용 (시드 불필요)
    }

    private void seedUser(String userId, String rawPw, String name, String email, Role role) {
        if (!userRepository.existsByUserId(userId)) {
            User u = new User();
            u.setUserId(userId);
            u.setPassword(passwordEncoder.encode(rawPw));
            u.setName(name);
            u.setEmail(email);
            u.setRole(role);
            userRepository.save(u);
            System.out.println("[DataSeeder] " + role + " 계정 생성: " + userId + " / " + rawPw);
        }
    }

    private void seedPartner(String partnerId, String rawPw, String companyName, String managerName, String email) {
        if (!partnerRepository.existsByPartnerId(partnerId)) {
            Partner p = new Partner();
            p.setPartnerId(partnerId);
            p.setPassword(passwordEncoder.encode(rawPw));
            p.setCompanyName(companyName);
            p.setManagerName(managerName);
            p.setEmail(email);
            partnerRepository.save(p);
            System.out.println("[DataSeeder] PARTNER(파트너 테이블) 계정 생성: " + partnerId + " / " + rawPw);
        }
    }
}
