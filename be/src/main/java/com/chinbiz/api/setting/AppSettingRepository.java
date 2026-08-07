package com.chinbiz.api.setting;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AppSettingRepository extends JpaRepository<AppSetting, String> {

    /** long 값 조회 (없거나 파싱 실패 시 기본값) */
    default long getLong(String code, long def) {
        return findById(code).map(s -> {
            try { return Long.parseLong(s.getValue().trim()); } catch (Exception e) { return def; }
        }).orElse(def);
    }

    /** 문자열 값 조회 (없거나 공백이면 기본값) */
    default String getStr(String code, String def) {
        return findById(code).map(AppSetting::getValue)
                .filter(v -> v != null && !v.isBlank()).map(String::trim).orElse(def);
    }

    /** 값 저장(upsert) */
    default void put(String code, String value) {
        AppSetting s = findById(code).orElseGet(() -> new AppSetting(code, value));
        s.setValue(value);
        save(s);
    }
}
