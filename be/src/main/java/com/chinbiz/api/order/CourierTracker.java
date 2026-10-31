package com.chinbiz.api.order;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 택배사 화물추적 (docs/33-1).
 * 택배사 조회화면(또는 그 화면이 호출하는 조회 API)을 서버에서 호출해, 날짜가 있는 배송 이력 행 중 가장 최근 행을
 * 골라 키워드로 배송상태(집화완료/배송중/배송출발/배송완료)를 판정한다. 택배사 화면 구조가 바뀌어도
 * "날짜가 있는 행 + 상태 키워드" 기준이라 비교적 견고하다.
 */
@Component
public class CourierTracker {

    /** code, 택배사명, 고객용 화물추적 화면 URL(송장번호를 뒤에 붙임) */
    public record Courier(String code, String name, String trackUrl) {}

    public static final List<Courier> COURIERS = List.of(
            new Courier("CJ", "CJ대한통운", "https://trace.cjlogistics.com/next/tracking.html?wblNo="),
            new Courier("EPOST", "우체국택배", "https://service.epost.go.kr/trace.RetrieveDomRigiTraceList.comm?sid1="),
            new Courier("LOTTE", "롯데택배", "https://www.lotteglogis.com/home/reservation/tracking/linkView?InvNo="),
            new Courier("HANJIN", "한진택배", "https://www.hanjin.com/kor/CMS/DeliveryMgr/WaybillResult.do?mCode=MN038&schLang=KR&wblnumText2="),
            new Courier("LOGEN", "로젠택배", "https://www.ilogen.com/web/personal/trace/"),
            new Courier("KDEXP", "경동택배", "https://kdexp.com/service/delivery/etc/delivery.do?barcode="));

    public static Optional<Courier> courier(String code) {
        return code == null ? Optional.empty() : COURIERS.stream().filter(c -> c.code().equals(code)).findFirst();
    }

    public static String trackUrl(String code, String invoiceNo) {
        if (invoiceNo == null || invoiceNo.isBlank()) return null;
        return courier(code).map(c -> c.trackUrl() + URLEncoder.encode(invoiceNo.trim(), StandardCharsets.UTF_8)).orElse(null);
    }

    /** 조회 결과 — status: 집화완료/배송중/배송출발/배송완료/조회결과없음, detail: 최근 이력(일시·위치·내용) */
    public record Result(String status, String detail) {}

    public static final String NOT_FOUND = "조회결과없음";

    private static final String UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
    private static final Pattern DATE = Pattern.compile("(20\\d{2})[.\\-/년 ]\\s*(\\d{1,2})[.\\-/월 ]\\s*(\\d{1,2})일?(?:[^0-9]{0,3}(\\d{1,2}):(\\d{2})(?::(\\d{2}))?)?");

    private static final Pattern TIME = Pattern.compile("\\b\\d{1,2}:\\d{2}\\b");

    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(8))
            .followRedirects(HttpClient.Redirect.NORMAL).build();
    private final ObjectMapper om = new ObjectMapper();

    public Result track(String code, String invoiceNo) throws Exception {
        String no = invoiceNo.replaceAll("[^0-9A-Za-z]", "");
        String enc = URLEncoder.encode(no, StandardCharsets.UTF_8);
        List<String> rows = switch (code) {
            // CJ·경동: 조회화면이 JS 로 호출하는 JSON API 를 직접 호출
            case "CJ" -> jsonRows(post("https://trace.cjlogistics.com/next/rest/selectTrackingDetailList.do", "paramInvcNo=" + enc));
            case "KDEXP" -> jsonRows(get("https://kdexp.com/service/delivery/new/ajax_basic.do?barcode=" + enc));
            default -> htmlRows(get(trackUrl(code, no)));
        };
        if (rows.isEmpty()) return new Result(NOT_FOUND, null);
        String latest = latest(rows);
        return new Result(classify(latest), latest.length() > 300 ? latest.substring(0, 300) : latest);
    }

    private String get(String url) throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(12)).header("User-Agent", UA).GET().build();
        return http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)).body();
    }

    private String post(String url, String form) throws Exception {
        HttpRequest req = HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(12)).header("User-Agent", UA)
                .header("Content-Type", "application/x-www-form-urlencoded; charset=UTF-8")
                .POST(HttpRequest.BodyPublishers.ofString(form)).build();
        return http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)).body();
    }

    /** HTML: 표의 각 행(tr) 텍스트 중 날짜가 있는 행만 이력으로 사용 (범례/안내 문구 제외) */
    static List<String> htmlRows(String html) {
        String body = html.replaceAll("(?is)<(script|style)[^>]*>.*?</\\1>", " ");
        List<String> rows = new ArrayList<>();
        for (String tr : body.split("(?i)<tr[\\s>]")) {
            String text = tr.replaceAll("(?is)</t[dh]>", " | ").replaceAll("(?s)<[^>]*>", " ")
                    .replace("&nbsp;", " ").replace("&amp;", "&").replaceAll("\\s+", " ").trim();
            int cut = text.toLowerCase().indexOf("</table");
            if (cut > 0) text = text.substring(0, cut);
            // 이력 행 = 날짜 + 시각(HH:MM). 조회기간 등 검색폼(날짜 범위 "~")은 제외
            if (DATE.matcher(text).find() && TIME.matcher(text).find() && !text.contains("~") && text.length() < 400)
                rows.add(text.replaceAll("( \\| )+$", ""));
        }
        return rows;
    }

    /** JSON: 날짜 문자열을 가진 객체(이력 1건)마다 문자열 값을 이어 붙여 행으로 사용 */
    List<String> jsonRows(String json) throws Exception {
        List<String> rows = new ArrayList<>();
        collect(om.readTree(json), rows);
        return rows;
    }

    private static void collect(JsonNode n, List<String> rows) {
        if (n.isArray()) { n.forEach(c -> collect(c, rows)); return; }
        if (!n.isObject()) return;
        StringBuilder sb = new StringBuilder();
        boolean leaf = true;
        for (Iterator<JsonNode> it = n.elements(); it.hasNext(); ) {
            JsonNode v = it.next();
            if (v.isContainerNode()) { leaf = false; collect(v, rows); }
            else if (v.isTextual() && !v.asText().isBlank()) sb.append(v.asText().trim()).append(" | ");
        }
        String text = sb.toString().replaceAll("( \\| )+$", "");
        // 하위 배열이 없는 객체이면서 날짜를 포함해야 이력 행 (CJ workDt=20261030 형태도 허용)
        if (leaf && (DATE.matcher(text).find() || text.matches(".*\\b20\\d{6}\\b.*"))) rows.add(text);
    }

    /** 날짜·시각이 가장 늦은 행 (같으면 뒤쪽 행) */
    static String latest(List<String> rows) {
        String best = rows.get(rows.size() - 1);
        long bestKey = -1;
        for (String r : rows) {
            long k = sortKey(r);
            if (k >= bestKey) { bestKey = k; best = r; }
        }
        return best;
    }

    private static long sortKey(String r) {
        Matcher m = DATE.matcher(r);
        if (m.find()) {
            long k = Long.parseLong(m.group(1)) * 10000 + Integer.parseInt(m.group(2)) * 100 + Integer.parseInt(m.group(3));
            k = k * 1_000_000 + (m.group(4) == null ? 0 : Integer.parseInt(m.group(4)) * 10000 + Integer.parseInt(m.group(5)) * 100
                    + (m.group(6) == null ? 0 : Integer.parseInt(m.group(6))));
            return k;
        }
        Matcher c = Pattern.compile("\\b(20\\d{6})\\b(?:\\D{1,3}(\\d{2}):?(\\d{2}):?(\\d{2})?)?").matcher(r); // CJ: 20261030 | 143000
        if (c.find()) {
            long k = Long.parseLong(c.group(1)) * 1_000_000;
            if (c.group(2) != null) k += Integer.parseInt(c.group(2)) * 10000 + Integer.parseInt(c.group(3)) * 100 + (c.group(4) == null ? 0 : Integer.parseInt(c.group(4)));
            return k;
        }
        return 0;
    }

    /** 최근 이력 문구 → 배송상태 */
    static String classify(String t) {
        String s = t.replace(" ", "");
        if (s.matches(".*(배달완료|배송완료|배달 완료|인수완료|수령완료|고객전달|전달완료|DELIVERED).*")) return "배송완료";
        if (s.matches(".*(배달출발|배송출발|배달중|배달준비|배송예정|배달예정|OUTFORDELIVERY).*")) return "배송출발";
        if (s.matches(".*(간선|이동중|상차|하차|도착|발송|출고|입고|터미널|허브|HUB|배송중|SM입고).*")) return "배송중";
        if (s.matches(".*(집화|접수|인수|픽업|PICKUP).*")) return "집화완료";
        return "배송중";
    }
}
