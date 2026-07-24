package com.chinbiz.api.common;

import java.util.regex.Pattern;

/**
 * 회원가입 공통 검증 (모든 admin 회원 등록에 적용).
 *  - 아이디: 영문/숫자만 4~20자
 *  - 비밀번호: 최소 10자 이상
 */
public final class AccountValidation {

    private static final Pattern ID = Pattern.compile("^[A-Za-z0-9]{4,20}$");
    public static final int PASSWORD_MIN = 10;

    private AccountValidation() {}

    /** 아이디 검증 오류 메시지(없으면 null) */
    public static String idError(String userId) {
        if (userId == null || userId.isBlank()) return "아이디를 입력해 주세요.";
        if (!ID.matcher(userId.trim()).matches()) return "아이디는 영문/숫자만 4~20자로 입력해 주세요.";
        return null;
    }

    /** 비밀번호 검증 오류 메시지(없으면 null) */
    public static String passwordError(String password) {
        if (password == null || password.isBlank()) return "비밀번호를 입력해 주세요.";
        if (password.length() < PASSWORD_MIN) return "비밀번호는 " + PASSWORD_MIN + "자 이상 입력해 주세요.";
        return null;
    }

    /** 등록(create) 공통 검증 — 아이디+비밀번호. 오류 메시지 반환(없으면 null) */
    public static String createError(String userId, String password) {
        String e = idError(userId);
        if (e != null) return e;
        return passwordError(password);
    }
}
