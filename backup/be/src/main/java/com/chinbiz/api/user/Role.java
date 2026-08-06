package com.chinbiz.api.user;

/**
 * 사용자 역할 (CLAUDE.md §2 조직 계층).
 * 위로 갈수록 상위 조직.
 */
public enum Role {
    BUZZ,           // 버즈회원(일반회원) - 1차 영업
    MANAGER,        // 관리매니저 - 2차 영업
    CENTER_ADMIN,   // 센터(장)
    DIVISION_ADMIN, // 본부(장)
    PARTNER,        // 파트너사(공급사/제조사)
    MASTER_ADMIN    // 본사 마스터 어드민(HQ)
}
