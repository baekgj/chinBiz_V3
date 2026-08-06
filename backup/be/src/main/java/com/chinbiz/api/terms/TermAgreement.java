package com.chinbiz.api.terms;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 약관 동의 기록 — 센터/본부 담당자 최초 로그인 시 이용약관 동의 이력.
 * 저장 항목: 로그인ID, IP주소, 동의시간, user.role, 약관코드.
 */
@Entity
@Table(name = "term_agreement")
public class TermAgreement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "login_id", length = 60, nullable = false) private String loginId;
    @Column(name = "term_code", length = 40, nullable = false) private String termCode;
    @Column(length = 30) private String role;
    @Column(length = 60) private String ip;
    @Column(name = "agreed_at", nullable = false) private LocalDateTime agreedAt;

    public TermAgreement() {}
    public TermAgreement(String loginId, String termCode, String role, String ip) {
        this.loginId = loginId; this.termCode = termCode; this.role = role; this.ip = ip;
        this.agreedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getLoginId() { return loginId; }
    public String getTermCode() { return termCode; }
    public String getRole() { return role; }
    public String getIp() { return ip; }
    public LocalDateTime getAgreedAt() { return agreedAt; }
}
