package com.chinbiz.api.auth.dto;

import jakarta.validation.constraints.*;

/**
 * 버즈회원 가입 요청 (프론트 signup 폼과 필드 일치).
 */
public record SignupRequest(
        @NotBlank @Pattern(regexp = "^[a-zA-Z0-9]{4,20}$", message = "아이디는 영문/숫자 4~20자")
        String userId,

        @NotBlank @Size(min = 10, message = "비밀번호는 10자 이상")
        String password,

        @NotBlank String name,

        @Email String email,

        @NotBlank String phone,

        String zipcode,
        String address,
        String addressDetail,
        String referralCode,
        Long salesCenterId,
        boolean agreeMarketing
) {}
