package com.chinbiz.api.push;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 웹푸시(Web Push) 구독 정보.
 * PWA가 알림 권한을 받으면 브라우저가 발급하는 구독(endpoint + 키)을 로그인 계정과 묶어 저장한다.
 *  - account : JWT subject(로그인 아이디). user 테이블 userId, partner 테이블 partnerId 공용.
 *  - endpoint: 브라우저 푸시 서비스 URL(발송 대상). 기기/브라우저 단위 고유 → unique.
 *  - p256dh/auth: 페이로드 암호화용 공개키/인증 시크릿(구독이 준 값 그대로 저장).
 * 인프라성 테이블이라 만료(410/404) 구독은 삭제 허용(정산 원장 Insert-only 원칙과 무관).
 */
@Entity
@Table(name = "push_subscription", uniqueConstraints = {
        @UniqueConstraint(name = "uk_push_endpoint", columnNames = "endpoint")
})
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 로그인 계정(JWT subject) */
    @Column(nullable = false, length = 60)
    private String account;

    /** 브라우저 푸시 서비스 endpoint (발송 대상 URL) */
    @Column(nullable = false, length = 500)
    private String endpoint;

    /** 페이로드 암호화 공개키(base64url) */
    @Column(nullable = false, length = 255)
    private String p256dh;

    /** 인증 시크릿(base64url) */
    @Column(nullable = false, length = 255)
    private String auth;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now(); }

    public PushSubscription() {}

    public PushSubscription(String account, String endpoint, String p256dh, String auth) {
        this.account = account;
        this.endpoint = endpoint;
        this.p256dh = p256dh;
        this.auth = auth;
    }

    public Long getId() { return id; }
    public String getAccount() { return account; }
    public void setAccount(String account) { this.account = account; }
    public String getEndpoint() { return endpoint; }
    public void setEndpoint(String endpoint) { this.endpoint = endpoint; }
    public String getP256dh() { return p256dh; }
    public void setP256dh(String p256dh) { this.p256dh = p256dh; }
    public String getAuth() { return auth; }
    public void setAuth(String auth) { this.auth = auth; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
