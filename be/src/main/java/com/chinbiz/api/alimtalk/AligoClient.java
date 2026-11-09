package com.chinbiz.api.alimtalk;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 알리고(Aligo) 카카오 알림톡 API 클라이언트 (docs/35).
 *  문서: https://smartsms.aligo.in/alimapi.html  (SMS: https://smartsms.aligo.in/smsapi.html)
 *  - POST https://kakaoapi.aligo.in/akv10/alimtalk/send/   (form-urlencoded)
 *  - POST https://kakaoapi.aligo.in/akv10/template/list/
 *  - POST https://kakaoapi.aligo.in/akv10/heartinfo/       (잔여 포인트)
 *  응답: {"code":0,"message":"...","info":{...}} — code 0 = 성공, 그 외 실패.
 *  ⚠ 알리고는 [발송 서버 IP 등록]이 필요하다(알리고 관리페이지 > API 신청/IP 등록).
 */
@Component
public class AligoClient {

    @Value("${app.aligo.api-base:https://kakaoapi.aligo.in}")
    private String apiBase;

    private final ObjectMapper om = new ObjectMapper();
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();

    /** 계정 설정 (app_setting aligo_* 값) */
    public record Account(String apikey, String userid, String senderkey, String sender, boolean testMode) {
        public boolean ready() {
            return notBlank(apikey) && notBlank(userid) && notBlank(senderkey) && notBlank(sender);
        }
    }

    /** 단건 발송 요청 */
    public record Message(String tplCode, String receiver, String recvName, String subject, String message,
                          String buttonJson, boolean failover, String fsubject, String fmessage) {}

    public record Result(boolean ok, String code, String message, String mid, JsonNode raw) {}

    /** 알림톡 단건 발송 */
    public Result send(Account acc, Message m) {
        Map<String, String> p = auth(acc);
        p.put("senderkey", acc.senderkey());
        p.put("tpl_code", m.tplCode());
        p.put("sender", digits(acc.sender()));
        p.put("receiver_1", digits(m.receiver()));
        if (notBlank(m.recvName())) p.put("recvname_1", m.recvName());
        p.put("subject_1", notBlank(m.subject()) ? m.subject() : "알림");
        p.put("message_1", m.message());
        if (notBlank(m.buttonJson())) p.put("button_1", m.buttonJson());
        if (m.failover()) {
            p.put("failover", "Y");
            if (notBlank(m.fsubject())) p.put("fsubject_1", m.fsubject());
            p.put("fmessage_1", notBlank(m.fmessage()) ? m.fmessage() : m.message());
        }
        p.put("testMode", acc.testMode() ? "Y" : "N");
        return post("/akv10/alimtalk/send/", p);
    }

    /** 승인 템플릿 목록 (본사 화면 [알리고 템플릿 불러오기]) */
    public Result templates(Account acc) {
        Map<String, String> p = auth(acc);
        p.put("senderkey", acc.senderkey());
        return post("/akv10/template/list/", p);
    }

    /** 잔여 포인트/건수 */
    public Result heartinfo(Account acc) {
        return post("/akv10/heartinfo/", auth(acc));
    }

    private Map<String, String> auth(Account acc) {
        Map<String, String> p = new LinkedHashMap<>();
        p.put("apikey", acc.apikey());
        p.put("userid", acc.userid());
        return p;
    }

    private Result post(String path, Map<String, String> params) {
        String body = params.entrySet().stream()
                .map(e -> enc(e.getKey()) + "=" + enc(e.getValue() == null ? "" : e.getValue()))
                .collect(Collectors.joining("&"));
        try {
            HttpRequest req = HttpRequest.newBuilder(URI.create(apiBase + path))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            JsonNode j = om.readTree(res.body());
            String code = j.path("code").asText("");
            String msg = j.path("message").asText("");
            String mid = j.path("info").path("mid").asText(null);
            return new Result("0".equals(code), code, msg, mid, j);
        } catch (Exception e) {
            return new Result(false, "ERR", "알리고 API 호출 실패: " + e.getMessage(), null, null);
        }
    }

    private static String enc(String v) { return URLEncoder.encode(v, StandardCharsets.UTF_8); }
    static String digits(String v) { return v == null ? "" : v.replaceAll("[^0-9]", ""); }
    static boolean notBlank(String v) { return v != null && !v.isBlank(); }
}
