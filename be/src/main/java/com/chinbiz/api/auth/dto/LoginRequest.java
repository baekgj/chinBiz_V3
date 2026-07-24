package com.chinbiz.api.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** 로그인 요청. 아이디 또는 이메일 + 비밀번호. */
public record LoginRequest(
        @NotBlank String userId,
        @NotBlank String password
) {}
