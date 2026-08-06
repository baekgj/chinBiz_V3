package com.chinbiz.api.alarm;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 발생한 알람 1건 (수신자별). 프로세스 트리거 시 alram_setting 을 참조해 생성.
 */
@Entity
@Table(name = "alram")
public class Alarm {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "process_code", length = 40) private String processCode;

    @Enumerated(EnumType.STRING)
    @Column(name = "target", length = 20) private AlarmTarget target;

    @Column(name = "recipient_id", length = 60) private String recipientId;    // 수신자 로그인ID
    @Column(name = "recipient_name", length = 60) private String recipientName; // 수신자 표시명
    @Column(name = "recipient_role", length = 30) private String recipientRole;

    @Column(columnDefinition = "TEXT") private String message;

    @Column(name = "ref_type", length = 20) private String refType;  // 연관 엔티티 유형(USER/SALE 등)
    @Column(name = "ref_id") private Long refId;                     // 연관 엔티티 id

    @Column(name = "read_flag", length = 1, nullable = false) private String readFlag = "N";
    @Column(name = "read_at") private LocalDateTime readAt;   // 확인완료 일시
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;

    @PrePersist void onCreate() { createdAt = LocalDateTime.now(); if (readFlag == null) readFlag = "N"; }

    public Alarm() {}
    public Alarm(String processCode, AlarmTarget target, String recipientId, String recipientName,
                 String recipientRole, String message, String refType, Long refId) {
        this.processCode = processCode; this.target = target; this.recipientId = recipientId;
        this.recipientName = recipientName; this.recipientRole = recipientRole; this.message = message;
        this.refType = refType; this.refId = refId;
    }

    public Long getId() { return id; }
    public String getProcessCode() { return processCode; }
    public AlarmTarget getTarget() { return target; }
    public String getRecipientId() { return recipientId; }
    public String getRecipientName() { return recipientName; }
    public String getRecipientRole() { return recipientRole; }
    public String getMessage() { return message; }
    public String getRefType() { return refType; }
    public Long getRefId() { return refId; }
    public String getReadFlag() { return readFlag; } public void setReadFlag(String v) { readFlag = v; }
    public LocalDateTime getReadAt() { return readAt; } public void setReadAt(LocalDateTime v) { readAt = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
