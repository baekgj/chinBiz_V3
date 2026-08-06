package com.chinbiz.api.alarm;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * 알람 설정 시드 — 13개 프로세스 × 8개 대상 행을 보장(idempotent).
 *  - 엑셀 기본 대상은 enabled=true + 기본문구, 나머지 대상은 enabled=false + 공란.
 *  - 프로세스명/발생시점/정렬순서(비-사용자편집 필드)는 부팅 시 최신화. message/enabled(사용자 편집)는 보존.
 */
@Component
@Order(21)
public class AlarmSettingSeeder implements CommandLineRunner {

    private final AlarmSettingRepository repo;

    public AlarmSettingSeeder(AlarmSettingRepository repo) { this.repo = repo; }

    @Override
    public void run(String... args) {
        int sort = 0;
        for (AlarmDefs.Def d : AlarmDefs.DEFS) {
            sort++;
            Map<String, String> defaults = AlarmDefs.defaultMessages(d);
            int tOrder = 0;
            for (AlarmTarget t : AlarmDefs.ALL_TARGETS) {
                tOrder++;
                boolean hasDefault = defaults.containsKey(t.name());
                AlarmSetting existing = repo.findByProcessCodeAndTarget(d.code(), t).orElse(null);
                if (existing == null) {
                    repo.save(new AlarmSetting(d.code(), d.name(), d.trigger(), sort, t, tOrder,
                            hasDefault ? defaults.get(t.name()) : "", hasDefault));
                } else {
                    // 사용자 편집 필드(message/enabled)는 보존, 메타만 최신화
                    existing.setProcessName(d.name());
                    existing.setTriggerDesc(d.trigger());
                    existing.setSortOrder(sort);
                    existing.setTargetOrder(tOrder);
                    repo.save(existing);
                }
            }
        }
    }
}
