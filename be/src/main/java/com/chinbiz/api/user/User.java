package com.chinbiz.api.user;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 사용자 엔티티.
 * CLAUDE.md §1: 개인정보 전 항목 '평문' 저장(요구사항). 비밀번호도 현재 평문.
 * 테이블명은 MySQL 예약어 회피를 위해 백틱으로 감싼 `user`.
 */
@Entity
@Table(name = "`user`", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_user_id", columnNames = "user_id")
})
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 로그인 아이디 (중복 불가) */
    @Column(name = "user_id", nullable = false, length = 30)
    private String userId;

    /** 비밀번호 (요구사항에 따라 평문 저장) */
    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(length = 120)
    private String email;

    @Column(length = 20)
    private String phone;

    @Column(length = 10)
    private String zipcode;

    @Column(length = 200)
    private String address;

    @Column(name = "address_detail", length = 200)
    private String addressDetail;

    /** 추천인(친쿠) 코드 */
    @Column(name = "referral_code", length = 60)
    private String referralCode;

    /** 소속센터 ID (버즈회원이 소속된 센터). CLAUDE.md §3 '소속센터' */
    @Column(name = "sales_center_id")
    private Long salesCenterId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role = Role.BUZZ;

    /** 회원 상태 (ACTIVE=활동 / INACTIVE=휴면) */
    @Column(length = 20)
    private String status = "ACTIVE";

    // 정산 계좌 (본부/센터 등 조직 계정 등록용)
    @Column(name = "bank_name", length = 40)
    private String bankName;
    @Column(name = "account_number", length = 40)
    private String accountNumber;
    @Column(name = "account_holder", length = 50)
    private String accountHolder;

    @Column(name = "agree_marketing", nullable = false)
    private boolean agreeMarketing = false;

    // 매니저 신청/승인/활동센터는 manager_center 테이블이 소스 (docs/19에서 user.manager_* 필드 제거)

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.role == null) this.role = Role.BUZZ;
        if (this.status == null) this.status = "ACTIVE";
    }

    // --- getters / setters ---
    public Long getId() { return id; }
    public String getUserId() { return userId; }
    public void setUserId(String userId) { this.userId = userId; }
    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getZipcode() { return zipcode; }
    public void setZipcode(String zipcode) { this.zipcode = zipcode; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getAddressDetail() { return addressDetail; }
    public void setAddressDetail(String addressDetail) { this.addressDetail = addressDetail; }
    public String getReferralCode() { return referralCode; }
    public void setReferralCode(String referralCode) { this.referralCode = referralCode; }
    public Long getSalesCenterId() { return salesCenterId; }
    public void setSalesCenterId(Long salesCenterId) { this.salesCenterId = salesCenterId; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getBankName() { return bankName; }
    public void setBankName(String v) { this.bankName = v; }
    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String v) { this.accountNumber = v; }
    public String getAccountHolder() { return accountHolder; }
    public void setAccountHolder(String v) { this.accountHolder = v; }
    public boolean isAgreeMarketing() { return agreeMarketing; }
    public void setAgreeMarketing(boolean agreeMarketing) { this.agreeMarketing = agreeMarketing; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
