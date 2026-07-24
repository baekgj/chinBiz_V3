package com.chinbiz.api.org;

import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * 주소 → center_code 매칭기.
 * 주소에서 시(市)/구/군/동을 추출하여 center_code 의 match_key(시) + search_key/center_name(구·동)으로
 * 소속센터 idx 를 찾는다. (user.sales_center_id 저장용)
 *
 * 매칭 규칙:
 *  - match_key = 시 키(서울시/부천시/광명시/가평군 …). 광역시·특별시는 접두어+"시"로 정규화.
 *  - 구(區)가 있으면: search_key 목록에 포함 → center_name == 구 → center_name 끝이 구.
 *  - 구가 없고 동/읍/면이 있으면: search_key 목록에 동 포함.
 *  - 둘 다 없으면(시 자체가 최소단위, 예 광명시/가평군): center_name == match_key.
 */
@Component
public class CenterMatcher {

    private static final List<String> METRO = List.of("서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종");

    private final CenterCodeRepository repo;

    public CenterMatcher(CenterCodeRepository repo) { this.repo = repo; }

    /** 주소로 소속센터 idx 를 찾는다(없으면 null). */
    public Long matchCenterIdx(String address) {
        if (address == null || address.isBlank()) return null;
        String[] tokens = address.trim().split("\\s+");

        String cityKey = cityKey(tokens);
        if (cityKey == null) return null;

        String gu = firstEndingWith(tokens, "구");
        String dong = firstEndingWithAny(tokens, "동", "읍", "면");

        // center 후보(center_name 존재) + match_key 일치
        List<CenterCode> centers = repo.findAll().stream()
                .filter(c -> c.getCenterName() != null && !c.getCenterName().isBlank())
                .filter(c -> cityKey.equals(c.getMatchKey()))
                .toList();
        if (centers.isEmpty()) return null;

        // 1) 구 매칭
        if (gu != null) {
            for (CenterCode c : centers) if (searchKeyContains(c, gu)) return c.getIdx();
            for (CenterCode c : centers) if (gu.equals(c.getCenterName())) return c.getIdx();
            for (CenterCode c : centers) if (c.getCenterName().endsWith(gu)) return c.getIdx();
        }
        // 2) 동/읍/면 매칭 (search_key 목록)
        if (dong != null) {
            for (CenterCode c : centers) if (searchKeyContains(c, dong)) return c.getIdx();
        }
        // 3) 시 자체가 최소단위 (예: 광명시, 가평군)
        for (CenterCode c : centers) if (cityKey.equals(c.getCenterName())) return c.getIdx();
        // 4) 후보가 하나면 그것으로
        if (centers.size() == 1) return centers.get(0).getIdx();
        return null;
    }

    /** 주소 토큰에서 match_key(시) 도출 */
    private String cityKey(String[] tokens) {
        // 광역시/특별시: 접두어 기반
        for (String t : tokens) {
            for (String m : METRO) {
                if (t.startsWith(m) && (t.equals(m) || t.contains("시") || t.contains("특별") || t.contains("광역"))) {
                    return m + "시";
                }
            }
        }
        // 도 산하: '시' 또는 '군' 으로 끝나는 토큰
        for (String t : tokens) {
            if (t.length() >= 2 && (t.endsWith("시") || t.endsWith("군")) && !t.endsWith("특별시") && !t.endsWith("광역시")) {
                return t;
            }
        }
        return null;
    }

    private String firstEndingWith(String[] tokens, String suffix) {
        for (String t : tokens) if (t.length() > suffix.length() && t.endsWith(suffix)) return t;
        return null;
    }

    private String firstEndingWithAny(String[] tokens, String... suffixes) {
        for (String t : tokens) for (String s : suffixes) if (t.length() > s.length() && t.endsWith(s)) return t;
        return null;
    }

    private boolean searchKeyContains(CenterCode c, String token) {
        if (c.getSearchKey() == null || c.getSearchKey().isBlank()) return false;
        Set<String> keys = Arrays.stream(c.getSearchKey().split(","))
                .map(String::trim).filter(s -> !s.isEmpty()).collect(Collectors.toSet());
        return keys.contains(token);
    }
}
