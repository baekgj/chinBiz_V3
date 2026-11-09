package com.chinbiz.api.alimtalk;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/** 알림톡 발송 이력 (Insert-Only, docs/35). 성공/실패/미발송(설정 미비) 모두 기록. */
@Entity
@Table(name = "alimtalk_log", indexes = @Index(name = "idx_alimtalk_log_ref", columnList = "event_code,ref_id"))
public class AlimtalkLog {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "event_code", length = 40) private String eventCode;
    @Column(name = "ref_id") private Long refId;                          // 이벤트 대상 PK (SALE1_CUSTOMER → sale.id)
    @Column(name = "receiver", length = 20) private String receiver;
    @Column(name = "recv_name", length = 50) private String recvName;
    @Column(name = "tpl_code", length = 40) private String tplCode;
    @Column(name = "message", columnDefinition = "TEXT") private String message; // 치환 완료 본문
    @Column(name = "result", length = 10) private String result;          // SUCCESS / FAIL / SKIP
    @Column(name = "result_code", length = 20) private String resultCode; // 알리고 code (0=성공)
    @Column(name = "result_message", length = 500) private String resultMessage;
    @Column(name = "mid", length = 40) private String mid;                // 알리고 메시지ID
    @Column(name = "test_mode", length = 1) private String testMode;
    @Column(name = "created_at", nullable = false, updatable = false) private LocalDateTime createdAt;

    @PrePersist void pre() { createdAt = LocalDateTime.now(); }

    public Long getId() { return id; }
    public String getEventCode() { return eventCode; }
    public void setEventCode(String v) { eventCode = v; }
    public Long getRefId() { return refId; }
    public void setRefId(Long v) { refId = v; }
    public String getReceiver() { return receiver; }
    public void setReceiver(String v) { receiver = v; }
    public String getRecvName() { return recvName; }
    public void setRecvName(String v) { recvName = v; }
    public String getTplCode() { return tplCode; }
    public void setTplCode(String v) { tplCode = v; }
    public String getMessage() { return message; }
    public void setMessage(String v) { message = v; }
    public String getResult() { return result; }
    public void setResult(String v) { result = v; }
    public String getResultCode() { return resultCode; }
    public void setResultCode(String v) { resultCode = v; }
    public String getResultMessage() { return resultMessage; }
    public void setResultMessage(String v) { resultMessage = v; }
    public String getMid() { return mid; }
    public void setMid(String v) { mid = v; }
    public String getTestMode() { return testMode; }
    public void setTestMode(String v) { testMode = v; }
    public LocalDateTime getCreatedAt() { return createdAt; }
}
