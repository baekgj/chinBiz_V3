package com.chinbiz.api.setting;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * 전역 환경설정 키-값 저장 (본사 [시스템설정]-[환경설정]). docs/18 추천마일리지 등.
 *  - join_cp_buzz     : 회원가입 시 가입 버즈회원 지급 CP
 *  - join_cp_referrer : 회원가입 시 추천인 회원 지급 CP
 */
@Entity
@Table(name = "app_setting")
public class AppSetting {

    @Id
    @Column(name = "code", length = 60)
    private String code;

    @Column(name = "value", length = 255)
    private String value;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist @PreUpdate void touch() { updatedAt = LocalDateTime.now(); }

    public AppSetting() {}
    public AppSetting(String code, String value) { this.code = code; this.value = value; }

    public String getCode() { return code; }
    public String getValue() { return value; }
    public void setValue(String v) { value = v; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
