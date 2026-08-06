package com.chinbiz.api.alarm;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 알람 설정 관리 (본사 [시스템설정]-[알람설정], MASTER_ADMIN).
 *  - GET  /api/org/alarm-settings           : 프로세스별 대상/문구/사용여부 목록
 *  - PUT  /api/org/alarm-settings/{code}    : 특정 프로세스의 대상별 사용여부/문구 저장
 *  - GET  /api/org/alarms                   : 발생 알람 조회(테스트 확인용)
 *  (/api/org/** = MASTER_ADMIN 전용)
 */
@RestController
@RequestMapping("/api/org")
public class AlarmSettingController {

    private final AlarmSettingRepository settingRepo;
    private final AlarmRepository alarmRepo;

    public AlarmSettingController(AlarmSettingRepository settingRepo, AlarmRepository alarmRepo) {
        this.settingRepo = settingRepo; this.alarmRepo = alarmRepo;
    }

    private Map<String, Object> targetDto(AlarmSetting s) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("target", s.getTarget().name());
        m.put("targetLabel", s.getTarget().label());
        m.put("enabled", s.isEnabled());
        m.put("message", s.getMessage() == null ? "" : s.getMessage());
        return m;
    }

    /** 프로세스별 그룹화 목록 */
    @GetMapping("/alarm-settings")
    public List<Map<String, Object>> list() {
        List<Map<String, Object>> out = new ArrayList<>();
        Map<String, Map<String, Object>> byProcess = new LinkedHashMap<>();
        for (AlarmSetting s : settingRepo.findAllByOrderBySortOrderAscTargetOrderAsc()) {
            Map<String, Object> p = byProcess.computeIfAbsent(s.getProcessCode(), k -> {
                Map<String, Object> m = new LinkedHashMap<>();
                m.put("code", s.getProcessCode());
                m.put("name", s.getProcessName());
                m.put("trigger", s.getTriggerDesc());
                m.put("targets", new ArrayList<Map<String, Object>>());
                out.add(m);
                return m;
            });
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> targets = (List<Map<String, Object>>) p.get("targets");
            targets.add(targetDto(s));
        }
        return out;
    }

    public record TargetReq(String target, Boolean enabled, String message) {}
    public record UpdateReq(List<TargetReq> targets) {}

    /** 특정 프로세스의 대상별 사용여부/문구 저장 */
    @PutMapping("/alarm-settings/{code}")
    public ResponseEntity<?> update(@PathVariable String code, @RequestBody UpdateReq req) {
        List<AlarmSetting> rows = settingRepo.findByProcessCodeOrderByTargetOrderAsc(code);
        if (rows.isEmpty()) return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("message", "알람 프로세스를 찾을 수 없습니다."));
        Map<String, TargetReq> byTarget = new LinkedHashMap<>();
        if (req.targets() != null) for (TargetReq t : req.targets()) if (t.target() != null) byTarget.put(t.target(), t);
        for (AlarmSetting s : rows) {
            TargetReq t = byTarget.get(s.getTarget().name());
            if (t == null) continue;
            if (t.enabled() != null) s.setEnabled(t.enabled());
            if (t.message() != null) s.setMessage(t.message());
        }
        settingRepo.saveAll(rows);
        return ResponseEntity.ok(Map.of("message", "저장되었습니다.", "code", code));
    }

    /** 발생 알람 조회 (테스트 확인용). processCode 로 필터 가능 */
    @GetMapping("/alarms")
    public List<Map<String, Object>> alarms(@RequestParam(required = false) String processCode) {
        List<Alarm> list = (processCode == null || processCode.isBlank())
                ? alarmRepo.findAll(org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "id"))
                : alarmRepo.findByProcessCodeOrderByIdDesc(processCode);
        List<Map<String, Object>> out = new ArrayList<>();
        for (Alarm a : list) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", a.getId());
            m.put("processCode", a.getProcessCode());
            m.put("target", a.getTarget() == null ? null : a.getTarget().name());
            m.put("recipientId", a.getRecipientId());
            m.put("recipientName", a.getRecipientName());
            m.put("recipientRole", a.getRecipientRole());
            m.put("message", a.getMessage());
            m.put("createdAt", a.getCreatedAt() == null ? null : a.getCreatedAt().toString());
            out.add(m);
        }
        return out;
    }
}
