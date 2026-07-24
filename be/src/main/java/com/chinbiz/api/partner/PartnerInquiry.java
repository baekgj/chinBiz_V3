package com.chinbiz.api.partner;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 파트너사 입점 상담신청 (home 파트너사 입점제안하기에서 접수).
 * status: NEW(신규) / DONE(상담완료) / CANCELED(신청취소)
 */
@Entity
@Table(name = "partner_inquiry")
public class PartnerInquiry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "company_name", length = 120) private String companyName;   // 회사명
    @Column(name = "contact_name", length = 50) private String contactName;    // 담당자명
    @Column(length = 30) private String phone;                                 // 연락처
    @Column(length = 120) private String email;
    @Column(length = 40) private String stage;                                 // 비즈니스 단계(리서치/계획/즉시/영업중)
    @Column(columnDefinition = "TEXT") private String message;                 // 제안/문의 내용
    @Column(length = 20, nullable = false) private String status = "NEW";

    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); updatedAt = createdAt; if (status == null) status = "NEW"; }
    @PreUpdate void onUpdate() { updatedAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public String getCompanyName() { return companyName; } public void setCompanyName(String v) { companyName = v; }
    public String getContactName() { return contactName; } public void setContactName(String v) { contactName = v; }
    public String getPhone() { return phone; } public void setPhone(String v) { phone = v; }
    public String getEmail() { return email; } public void setEmail(String v) { email = v; }
    public String getStage() { return stage; } public void setStage(String v) { stage = v; }
    public String getMessage() { return message; } public void setMessage(String v) { message = v; }
    public String getStatus() { return status; } public void setStatus(String v) { status = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
