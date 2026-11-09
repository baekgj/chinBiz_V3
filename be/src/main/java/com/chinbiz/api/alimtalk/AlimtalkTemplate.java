package com.chinbiz.api.alimtalk;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 알림톡 발송 문구 설정 (본사 [시스템설정]-[알림톡설정], docs/35).
 *  - event_code 별 1행. 현재 이벤트: SALE1_CUSTOMER (버즈 1차영업신청 접수 → 가망고객 대표자 핸드폰)
 *  - message/subject/button 은 카카오 검수 승인된 알리고 템플릿(tpl_code)과 "동일"해야 발송된다.
 *    #{변수} 는 발송 시 실제 값으로 치환된다(AlimtalkService.VARS).
 */
@Entity
@Table(name = "alimtalk_template")
public class AlimtalkTemplate {

    @Id
    @Column(name = "event_code", length = 40)
    private String eventCode;

    @Column(name = "event_name", length = 100) private String eventName;
    @Column(name = "enabled", length = 1) private String enabled = "N";       // Y=발송, N=중지
    @Column(name = "tpl_code", length = 40) private String tplCode;            // 알리고 템플릿 코드
    @Column(name = "subject", length = 100) private String subject;            // 알림톡 제목(관리용)
    @Column(name = "message", columnDefinition = "TEXT") private String message; // 템플릿 본문(#{변수} 포함)
    @Column(name = "button_json", columnDefinition = "TEXT") private String buttonJson; // [{name,linkType,linkMo,linkPc}] (JSON 배열)
    @Column(name = "failover", length = 1) private String failover = "N";      // 실패 시 문자 대체발송
    @Column(name = "fsubject", length = 100) private String fsubject;          // 대체문자 제목(LMS)
    @Column(name = "fmessage", columnDefinition = "TEXT") private String fmessage; // 대체문자 본문(#{변수} 가능)
    @Column(name = "updated_at") private LocalDateTime updatedAt;

    @PrePersist @PreUpdate void touch() { updatedAt = LocalDateTime.now(); }

    public AlimtalkTemplate() {}
    public AlimtalkTemplate(String eventCode, String eventName) { this.eventCode = eventCode; this.eventName = eventName; }

    public String getEventCode() { return eventCode; }
    public String getEventName() { return eventName; }
    public void setEventName(String v) { eventName = v; }
    public String getEnabled() { return enabled; }
    public void setEnabled(String v) { enabled = v; }
    public String getTplCode() { return tplCode; }
    public void setTplCode(String v) { tplCode = v; }
    public String getSubject() { return subject; }
    public void setSubject(String v) { subject = v; }
    public String getMessage() { return message; }
    public void setMessage(String v) { message = v; }
    public String getButtonJson() { return buttonJson; }
    public void setButtonJson(String v) { buttonJson = v; }
    public String getFailover() { return failover; }
    public void setFailover(String v) { failover = v; }
    public String getFsubject() { return fsubject; }
    public void setFsubject(String v) { fsubject = v; }
    public String getFmessage() { return fmessage; }
    public void setFmessage(String v) { fmessage = v; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
