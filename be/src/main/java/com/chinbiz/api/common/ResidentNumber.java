package com.chinbiz.api.common;

/**
 * 주민등록번호 유효성 검사 (세금신고용, docs/22).
 * 13자리 + 검증부호(check digit) 규칙. 하이픈/공백 허용.
 */
public final class ResidentNumber {

    private ResidentNumber() {}

    /** 유효한 주민등록번호인지 (형식 13자리 + 검증부호 일치) */
    public static boolean isValid(String raw) {
        String d = normalize(raw);
        if (d == null || d.length() != 13) return false;
        // 생년월일 간이 검증
        int mm = Integer.parseInt(d.substring(2, 4));
        int dd = Integer.parseInt(d.substring(4, 6));
        if (mm < 1 || mm > 12 || dd < 1 || dd > 31) return false;
        int gender = d.charAt(6) - '0';           // 성별/세기 코드(내국인 1~4, 외국인 5~8)
        if (gender < 1 || gender > 8) return false;
        // 검증부호
        int[] w = {2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5};
        int sum = 0;
        for (int i = 0; i < 12; i++) sum += (d.charAt(i) - '0') * w[i];
        int check = (11 - (sum % 11)) % 10;
        return check == (d.charAt(12) - '0');
    }

    /** 숫자만 남긴 정규화 문자열(저장용). null → null */
    public static String normalize(String raw) {
        return raw == null ? null : raw.replaceAll("\\D", "");
    }
}
