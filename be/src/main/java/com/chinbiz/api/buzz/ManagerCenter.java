package com.chinbiz.api.buzz;

import jakarta.persistence.*;
import java.time.LocalDate;

/**
 * 매니저 활동센터 신청 (docs/19). 버즈회원이 매니저 신청 시 최대 3개 센터를 선택 → 센터별 1행.
 *  status: I=신청(심사중) / Y=승인
 */
@Entity
@Table(name = "manager_center", uniqueConstraints = @UniqueConstraint(columnNames = {"buzz_id", "center_id"}))
public class ManagerCenter {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "buzz_id", nullable = false) private Long buzzId;     // 신청 버즈 user.id
    @Column(name = "center_id", nullable = false) private Long centerId; // center_code.idx
    @Column(name = "apply_date") private LocalDate applyDate;            // 신청일자
    @Column(name = "approve_date") private LocalDate approveDate;        // 승인일자
    @Column(length = 1) private String status = "I";                    // 신청상태 (I/Y)

    public ManagerCenter() {}
    public ManagerCenter(Long buzzId, Long centerId, LocalDate applyDate, String status) {
        this.buzzId = buzzId; this.centerId = centerId; this.applyDate = applyDate; this.status = status;
    }

    public Long getId() { return id; }
    public Long getBuzzId() { return buzzId; }
    public Long getCenterId() { return centerId; }
    public LocalDate getApplyDate() { return applyDate; }
    public LocalDate getApproveDate() { return approveDate; } public void setApproveDate(LocalDate v) { approveDate = v; }
    public String getStatus() { return status; } public void setStatus(String v) { status = v; }
}
