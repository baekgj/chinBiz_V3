package com.chinbiz.api.alimtalk;

import com.chinbiz.api.setting.AppSettingRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * 본사 [시스템설정]-[알림톡설정] API (MASTER_ADMIN, /api/org/** 보안 규칙 적용, docs/35).
 *  - GET  /api/org/alimtalk/config            : 알리고 계정 설정(API Key 마스킹)
 *  - PUT  /api/org/alimtalk/config            : 저장(API Key 공백이면 기존 유지)
 *  - GET  /api/org/alimtalk/templates         : 이벤트별 발송 문구 + 치환변수 목록
 *  - PUT  /api/org/alimtalk/templates/{code}  : 발송 문구 저장
 *  - GET  /api/org/alimtalk/aligo-templates   : 알리고 승인 템플릿 목록(불러오기)
 *  - GET  /api/org/alimtalk/remain            : 알리고 잔여 포인트
 *  - POST /api/org/alimtalk/test              : {eventCode, receiver} 샘플값으로 테스트 발송
 *  - GET  /api/org/alimtalk/logs?page=&size=  : 발송 이력
 */
@RestController
@RequestMapping("/api/org/alimtalk")
public class AlimtalkController {

    private final AlimtalkService service;
    private final AlimtalkTemplateRepository tplRepo;
    private final AlimtalkLogRepository logRepo;
    private final AppSettingRepository settingRepo;
    private final AligoClient client;
    private final ObjectMapper om = new ObjectMapper();

    public AlimtalkController(AlimtalkService service, AlimtalkTemplateRepository tplRepo, AlimtalkLogRepository logRepo,
                              AppSettingRepository settingRepo, AligoClient client) {
        this.service = service; this.tplRepo = tplRepo; this.logRepo = logRepo;
        this.settingRepo = settingRepo; this.client = client;
    }

    // ── 계정 설정 ─────────────────────────────────────────
    @GetMapping("/config")
    public Map<String, Object> config() {
        var acc = service.account();
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("apikeyMasked", mask(acc.apikey()));
        m.put("apikeySet", AligoClient.notBlank(acc.apikey()));
        m.put("userid", acc.userid());
        m.put("senderkey", acc.senderkey());
        m.put("sender", acc.sender());
        m.put("testMode", acc.testMode() ? "Y" : "N");
        m.put("ready", acc.ready());
        return m;
    }

    public record ConfigRequest(String apikey, String userid, String senderkey, String sender, String testMode) {}

    @PutMapping("/config")
    public ResponseEntity<?> saveConfig(@RequestBody ConfigRequest req) {
        if (req.apikey() != null && !req.apikey().isBlank()) settingRepo.put(AlimtalkService.K_APIKEY, req.apikey().trim());
        settingRepo.put(AlimtalkService.K_USERID, trim(req.userid()));
        settingRepo.put(AlimtalkService.K_SENDERKEY, trim(req.senderkey()));
        settingRepo.put(AlimtalkService.K_SENDER, AligoClient.digits(req.sender()));
        settingRepo.put(AlimtalkService.K_TESTMODE, "Y".equals(req.testMode()) ? "Y" : "N");
        return ResponseEntity.ok(Map.of("message", "저장되었습니다."));
    }

    // ── 발송 문구 ─────────────────────────────────────────
    @GetMapping("/templates")
    public Map<String, Object> templates() {
        List<Map<String, Object>> list = new ArrayList<>();
        tplRepo.findAll().forEach(t -> list.add(toMap(t)));
        List<Map<String, String>> vars = new ArrayList<>();
        AlimtalkService.VARS.forEach((k, v) -> vars.add(Map.of("key", k, "desc", v)));
        return Map.of("templates", list, "vars", vars, "sample", service.sampleVars());
    }

    public record TemplateRequest(String enabled, String tplCode, String subject, String message, String buttonJson,
                                  String failover, String fsubject, String fmessage) {}

    @PutMapping("/templates/{code}")
    public ResponseEntity<?> saveTemplate(@PathVariable String code, @RequestBody TemplateRequest req) {
        AlimtalkTemplate t = tplRepo.findById(code).orElse(null);
        if (t == null) return ResponseEntity.status(404).body(Map.of("message", "존재하지 않는 이벤트입니다."));
        boolean enable = "Y".equals(req.enabled());
        if (enable && (isBlank(req.tplCode()) || isBlank(req.message())))
            return ResponseEntity.badRequest().body(Map.of("message", "발송 사용 시 템플릿 코드와 본문은 필수입니다."));
        if (!isBlank(req.buttonJson())) {
            try {
                JsonNode n = om.readTree(req.buttonJson());
                if (!n.isArray()) throw new IllegalArgumentException();
                if (n.size() > 5) return ResponseEntity.badRequest().body(Map.of("message", "버튼은 최대 5개까지 가능합니다."));
            } catch (Exception e) {
                return ResponseEntity.badRequest().body(Map.of("message", "버튼 설정 형식이 올바르지 않습니다."));
            }
        }
        t.setEnabled(enable ? "Y" : "N");
        t.setTplCode(trim(req.tplCode()));
        t.setSubject(trim(req.subject()));
        t.setMessage(req.message() == null ? null : req.message().replace("\r\n", "\n"));
        t.setButtonJson(isBlank(req.buttonJson()) ? null : req.buttonJson());
        t.setFailover("Y".equals(req.failover()) ? "Y" : "N");
        t.setFsubject(trim(req.fsubject()));
        t.setFmessage(req.fmessage() == null ? null : req.fmessage().replace("\r\n", "\n"));
        tplRepo.save(t);
        return ResponseEntity.ok(Map.of("message", "저장되었습니다.", "template", toMap(t)));
    }

    // ── 알리고 조회 ───────────────────────────────────────
    @GetMapping("/aligo-templates")
    public ResponseEntity<?> aligoTemplates() {
        var acc = service.account();
        if (!acc.ready()) return ResponseEntity.badRequest().body(Map.of("message", "알리고 계정 설정을 먼저 저장해 주세요."));
        var r = client.templates(acc);
        if (!r.ok()) return ResponseEntity.badRequest().body(Map.of("message", "알리고 응답: " + r.message() + " (code " + r.code() + ")"));
        List<Map<String, Object>> list = new ArrayList<>();
        for (JsonNode n : r.raw().path("list")) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("tplCode", n.path("templtCode").asText(""));
            m.put("name", n.path("templtName").asText(""));
            m.put("content", n.path("templtContent").asText(""));
            m.put("title", n.path("templtTitle").asText(""));
            m.put("inspStatus", n.path("inspStatus").asText(""));
            m.put("status", n.path("status").asText(""));
            List<Map<String, String>> buttons = new ArrayList<>();
            for (JsonNode b : n.path("buttons")) {
                Map<String, String> bm = new LinkedHashMap<>();
                bm.put("name", b.path("name").asText(""));
                bm.put("linkType", b.path("linkType").asText("WL"));
                bm.put("linkMo", b.path("linkMo").asText(""));
                bm.put("linkPc", b.path("linkPc").asText(""));
                buttons.add(bm);
            }
            m.put("buttons", buttons);
            list.add(m);
        }
        return ResponseEntity.ok(Map.of("list", list));
    }

    @GetMapping("/remain")
    public ResponseEntity<?> remain() {
        var acc = service.account();
        if (!acc.ready()) return ResponseEntity.badRequest().body(Map.of("message", "알리고 계정 설정을 먼저 저장해 주세요."));
        var r = client.heartinfo(acc);
        if (!r.ok()) return ResponseEntity.badRequest().body(Map.of("message", "알리고 응답: " + r.message() + " (code " + r.code() + ")"));
        return ResponseEntity.ok(om.convertValue(r.raw(), Map.class));
    }

    // ── 테스트 발송 / 이력 ────────────────────────────────
    public record TestRequest(String eventCode, String receiver) {}

    @PostMapping("/test")
    public ResponseEntity<?> test(@RequestBody TestRequest req) {
        String to = AligoClient.digits(req.receiver());
        if (to.length() < 10) return ResponseEntity.badRequest().body(Map.of("message", "수신 핸드폰번호를 정확히 입력해 주세요."));
        String ev = isBlank(req.eventCode()) ? AlimtalkService.EV_SALE1_CUSTOMER : req.eventCode();
        AlimtalkLog l = service.send(ev, null, to, "테스트", service.sampleVars());
        return ResponseEntity.ok(logMap(l));
    }

    @GetMapping("/logs")
    public Map<String, Object> logs(@RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "10") int size) {
        Page<AlimtalkLog> p = logRepo.findAllByOrderByIdDesc(PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100)));
        return Map.of("content", p.getContent().stream().map(this::logMap).toList(),
                "totalPages", p.getTotalPages(), "totalElements", p.getTotalElements(), "page", p.getNumber());
    }

    private Map<String, Object> logMap(AlimtalkLog l) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("id", l.getId());
        m.put("eventCode", l.getEventCode());
        m.put("refId", l.getRefId());
        m.put("receiver", maskPhone(l.getReceiver()));
        m.put("recvName", l.getRecvName());
        m.put("tplCode", l.getTplCode());
        m.put("message", l.getMessage());
        m.put("result", l.getResult());
        m.put("resultCode", l.getResultCode());
        m.put("resultMessage", l.getResultMessage());
        m.put("mid", l.getMid());
        m.put("testMode", l.getTestMode());
        m.put("createdAt", l.getCreatedAt());
        return m;
    }

    private Map<String, Object> toMap(AlimtalkTemplate t) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("eventCode", t.getEventCode());
        m.put("eventName", t.getEventName());
        m.put("enabled", t.getEnabled());
        m.put("tplCode", t.getTplCode());
        m.put("subject", t.getSubject());
        m.put("message", t.getMessage());
        m.put("buttonJson", t.getButtonJson());
        m.put("failover", t.getFailover());
        m.put("fsubject", t.getFsubject());
        m.put("fmessage", t.getFmessage());
        m.put("updatedAt", t.getUpdatedAt());
        return m;
    }

    private static String mask(String v) {
        if (v == null || v.isBlank()) return "";
        return v.length() <= 6 ? "******" : v.substring(0, 3) + "*".repeat(Math.min(v.length() - 6, 20)) + v.substring(v.length() - 3);
    }

    /** 개인정보 마스킹 (CLAUDE.md 8절) 010-****-1234 */
    private static String maskPhone(String v) {
        if (v == null || v.length() < 8) return v;
        return v.substring(0, 3) + "-****-" + v.substring(v.length() - 4);
    }

    private static String trim(String v) { return v == null ? "" : v.trim(); }
    private static boolean isBlank(String v) { return v == null || v.isBlank(); }
}
