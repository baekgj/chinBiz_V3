package com.chinbiz.api.alarm;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AlarmSettingRepository extends JpaRepository<AlarmSetting, Long> {
    List<AlarmSetting> findAllByOrderBySortOrderAscTargetOrderAsc();
    List<AlarmSetting> findByProcessCodeOrderByTargetOrderAsc(String processCode);
    /** 발생 시 사용: 해당 프로세스의 사용중인 설정만 */
    List<AlarmSetting> findByProcessCodeAndEnabledTrue(String processCode);
    Optional<AlarmSetting> findByProcessCodeAndTarget(String processCode, AlarmTarget target);
}
