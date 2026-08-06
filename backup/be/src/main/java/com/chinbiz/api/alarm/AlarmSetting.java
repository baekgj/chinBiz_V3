package com.chinbiz.api.alarm;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 알람 설정 (본사 [시스템설정]-[알람설정]). 프로세스×수신대상 별 1행.
 *  - 어떤 프로세스에서(process_code) 어떤 대상(target)에게 어떤 문구(message)를 보낼지, 사용여부(enabled).
 */
@Entity
@Table(name = "alram_setting", uniqueConstraints = @UniqueConstraint(columnNames = {"process_code", "target"}))
public class AlarmSetting {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "process_code", length = 40, nullable = false) private String processCode;
    @Column(name = "process_name", length = 60) private String processName;   // 구분 (예: 회원가입)
    @Column(name = "trigger_desc", length = 255) private String triggerDesc;  // 메뉴위치/발생시점
    @Column(name = "sort_order") private Integer sortOrder;

    @Enumerated(EnumType.STRING)
    @Column(name = "target", length = 20, nullable = false) private AlarmTarget target;
    @Column(name = "target_order") private Integer targetOrder;

    @Column(columnDefinition = "TEXT") private String message;
    @Column(name = "enabled", nullable = false) private boolean enabled = false;

    @Column(name = "updated_at") private LocalDateTime updatedAt;

    @PrePersist @PreUpdate void touch() { updatedAt = LocalDateTime.now(); }

    public AlarmSetting() {}
    public AlarmSetting(String processCode, String processName, String triggerDesc, int sortOrder,
                        AlarmTarget target, int targetOrder, String message, boolean enabled) {
        this.processCode = processCode; this.processName = processName; this.triggerDesc = triggerDesc;
        this.sortOrder = sortOrder; this.target = target; this.targetOrder = targetOrder;
        this.message = message; this.enabled = enabled;
    }

    public Long getId() { return id; }
    public String getProcessCode() { return processCode; }
    public String getProcessName() { return processName; } public void setProcessName(String v) { processName = v; }
    public String getTriggerDesc() { return triggerDesc; } public void setTriggerDesc(String v) { triggerDesc = v; }
    public Integer getSortOrder() { return sortOrder; } public void setSortOrder(Integer v) { sortOrder = v; }
    public AlarmTarget getTarget() { return target; }
    public Integer getTargetOrder() { return targetOrder; } public void setTargetOrder(Integer v) { targetOrder = v; }
    public String getMessage() { return message; } public void setMessage(String v) { message = v; }
    public boolean isEnabled() { return enabled; } public void setEnabled(boolean v) { enabled = v; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
