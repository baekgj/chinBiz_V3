package com.chinbiz.api.partner;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 파트너사(공급사/제조사) 엔티티. user 테이블과 별개의 `partner` 테이블.
 * 비밀번호는 BCrypt 해시 저장. (개인/회사정보는 평문)
 */
@Entity
@Table(name = "partner", uniqueConstraints = {
        @UniqueConstraint(name = "uk_partner_partner_id", columnNames = "partner_id")
})
public class Partner {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "partner_id", nullable = false, length = 30)
    private String partnerId;         // 파트너사 로그인 아이디

    @Column(nullable = false)
    private String password;          // BCrypt

    @Column(name = "company_name", nullable = false, length = 100)
    private String companyName;       // 상호명

    @Column(name = "business_number", length = 20)
    private String businessNumber;    // 사업자등록번호

    @Column(name = "ceo_name", length = 50)
    private String ceoName;           // 대표자명

    @Column(name = "company_phone", length = 20)
    private String companyPhone;      // 회사 전화번호

    @Column(length = 10)
    private String zipcode;
    @Column(length = 200)
    private String address;
    @Column(name = "address_detail", length = 200)
    private String addressDetail;

    @Column(name = "manager_name", length = 50)
    private String managerName;       // 담당자명
    @Column(name = "manager_phone", length = 20)
    private String managerPhone;      // 담당자 연락처
    @Column(length = 120)
    private String email;

    @Column(name = "bank_name", length = 40)
    private String bankName;          // 은행명
    @Column(name = "account_number", length = 40)
    private String accountNumber;     // 계좌번호
    @Column(name = "account_holder", length = 50)
    private String accountHolder;     // 예금주

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    void onCreate() { this.createdAt = LocalDateTime.now(); this.updatedAt = this.createdAt; }
    @PreUpdate
    void onUpdate() { this.updatedAt = LocalDateTime.now(); }

    // getters / setters
    public Long getId() { return id; }
    public String getPartnerId() { return partnerId; }
    public void setPartnerId(String v) { this.partnerId = v; }
    public String getPassword() { return password; }
    public void setPassword(String v) { this.password = v; }
    public String getCompanyName() { return companyName; }
    public void setCompanyName(String v) { this.companyName = v; }
    public String getBusinessNumber() { return businessNumber; }
    public void setBusinessNumber(String v) { this.businessNumber = v; }
    public String getCeoName() { return ceoName; }
    public void setCeoName(String v) { this.ceoName = v; }
    public String getCompanyPhone() { return companyPhone; }
    public void setCompanyPhone(String v) { this.companyPhone = v; }
    public String getZipcode() { return zipcode; }
    public void setZipcode(String v) { this.zipcode = v; }
    public String getAddress() { return address; }
    public void setAddress(String v) { this.address = v; }
    public String getAddressDetail() { return addressDetail; }
    public void setAddressDetail(String v) { this.addressDetail = v; }
    public String getManagerName() { return managerName; }
    public void setManagerName(String v) { this.managerName = v; }
    public String getManagerPhone() { return managerPhone; }
    public void setManagerPhone(String v) { this.managerPhone = v; }
    public String getEmail() { return email; }
    public void setEmail(String v) { this.email = v; }
    public String getBankName() { return bankName; }
    public void setBankName(String v) { this.bankName = v; }
    public String getAccountNumber() { return accountNumber; }
    public void setAccountNumber(String v) { this.accountNumber = v; }
    public String getAccountHolder() { return accountHolder; }
    public void setAccountHolder(String v) { this.accountHolder = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
