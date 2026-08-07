package com.chinbiz.api.common;

/**
 * 개인정보 부분 마스킹 (어드민 화면 노출용).
 *  - 이름   : 홍길동 → 홍O동 (첫/끝 유지, 가운데 O)
 *  - 전화   : 010-1234-5678 → 010-XXXX-5678 (가운데 그룹 X)
 *  - 이메일 : honggildong@naver.com → hongxxxxx@naver.com (로컬 앞 4자 유지 + xxxxx + 도메인)
 */
public final class Mask {
    private Mask() {}

    public static String name(String v) {
        if (v == null) return null;
        String s = v.trim();
        int len = s.length();
        if (len <= 1) return s;
        if (len == 2) return s.charAt(0) + "O";
        return s.charAt(0) + "O".repeat(len - 2) + s.charAt(len - 1);
    }

    public static String phone(String v) {
        if (v == null || v.isBlank()) return v;
        String s = v.trim();
        String[] p = s.split("-");
        if (p.length == 3) {
            return p[0] + "-" + "X".repeat(Math.max(p[1].length(), 1)) + "-" + p[2];
        }
        // 하이픈 없는 형식: 앞 3자리 + 뒤 4자리만 노출, 가운데 X
        String digits = s.replaceAll("[^0-9]", "");
        if (digits.length() >= 7) {
            int midLen = digits.length() - 7;
            return digits.substring(0, 3) + "X".repeat(midLen) + digits.substring(digits.length() - 4);
        }
        return s;
    }

    /** 아이디: 앞 4자 유지 + 나머지 X (예: hong1234 → hongXXXX) */
    public static String userId(String v) {
        if (v == null || v.isBlank()) return v;
        String s = v.trim();
        int keep = Math.min(4, s.length());
        return s.length() <= keep ? s : s.substring(0, keep) + "X".repeat(s.length() - keep);
    }

    public static String email(String v) {
        if (v == null || v.isBlank()) return v;
        String s = v.trim();
        int at = s.indexOf('@');
        if (at < 0) return s;
        String local = s.substring(0, at);
        String domain = s.substring(at); // '@' 포함
        String keep = local.substring(0, Math.min(4, local.length()));
        return keep + "xxxxx" + domain;
    }
}
