package com.chinbiz.api.edu;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 교육관리 — 매니저가 파트너사 상품에 대해 이수하는 교육 기록.
 * (상품 × 매니저) 단위 1행. 이수 → 승인 2단계.
 */
@Entity
@Table(name = "education", uniqueConstraints = {
        @UniqueConstraint(name = "uk_edu_product_manager", columnNames = {"product_id", "manager_id"})
})
public class Education {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "product_id", nullable = false) private Long productId;
    @Column(name = "partner_id") private Long partnerId;         // 상품 공급 파트너사 id
    @Column(name = "manager_id", nullable = false) private Long managerId; // 교육 대상 매니저 user.id
    @Column(name = "manager_referral_code", length = 60) private String managerReferralCode;

    @Column(nullable = false) private boolean completed = false;  // 이수여부(교육전/교육완료)
    @Column(name = "completed_at") private LocalDateTime completedAt;

    @Column(nullable = false) private boolean approved = false;   // 승인여부(미승인/승인)
    @Column(name = "approved_at") private LocalDateTime approvedAt;
    @Column(name = "approver_id") private Long approverId;        // 처리담당자 user.id

    // 교육완료 시 매니저가 선택: 해당 상품 자동 배정 허용 동의여부 (동의=true / 미동의=false)
    @Column(name = "auto_assign", nullable = false) private boolean autoAssign = false;

    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public Long getProductId() { return productId; } public void setProductId(Long v) { productId = v; }
    public Long getPartnerId() { return partnerId; } public void setPartnerId(Long v) { partnerId = v; }
    public Long getManagerId() { return managerId; } public void setManagerId(Long v) { managerId = v; }
    public String getManagerReferralCode() { return managerReferralCode; } public void setManagerReferralCode(String v) { managerReferralCode = v; }
    public boolean isCompleted() { return completed; } public void setCompleted(boolean v) { completed = v; }
    public LocalDateTime getCompletedAt() { return completedAt; } public void setCompletedAt(LocalDateTime v) { completedAt = v; }
    public boolean isApproved() { return approved; } public void setApproved(boolean v) { approved = v; }
    public LocalDateTime getApprovedAt() { return approvedAt; } public void setApprovedAt(LocalDateTime v) { approvedAt = v; }
    public Long getApproverId() { return approverId; } public void setApproverId(Long v) { approverId = v; }
    public boolean isAutoAssign() { return autoAssign; } public void setAutoAssign(boolean v) { autoAssign = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
