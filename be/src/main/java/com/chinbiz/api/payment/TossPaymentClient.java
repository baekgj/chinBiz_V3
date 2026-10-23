package com.chinbiz.api.payment;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/**
 * 토스페이먼츠 결제 승인 클라이언트.
 *  - toss.secret-key(=TOSS_SECRET_KEY) 가 설정되면 실제 승인 API 호출.
 *  - 미설정(로컬/미연동)이면 mock 모드: 승인 없이 DONE 처리(개발용).
 * 승인 API: POST https://api.tosspayments.com/v1/payments/confirm  (Basic base64(secretKey:))
 */
@Component
public class TossPaymentClient {

    @Value("${toss.client-key:}") private String clientKey;
    @Value("${toss.secret-key:}") private String secretKey;
    @Value("${toss.api-base:https://api.tosspayments.com}") private String apiBase;

    private final ObjectMapper om = new ObjectMapper();
    private final HttpClient http = HttpClient.newHttpClient();

    public boolean enabled() { return secretKey != null && !secretKey.isBlank(); }
    public String clientKey() { return clientKey == null ? "" : clientKey; }

    public record ConfirmResult(boolean ok, String status, String method, String cashReceiptKey, String message) {}

    /** JSON 노드에서 안전하게 문자열 추출(없거나 null이면 null) */
    private static String str(JsonNode node) {
        return node == null || node.isMissingNode() || node.isNull() ? null : node.asText();
    }

    /**
     * 결제 승인. mock 모드면 항상 성공(DONE) 반환.
     * 실제 모드면 토스 confirm 호출 후 status(DONE / WAITING_FOR_DEPOSIT 등)와
     * 결제창에서 요청한 현금영수증(cashReceipt.receiptKey) 결과를 반환.
     */
    public ConfirmResult confirm(String paymentKey, String orderId, long amount) {
        if (!enabled()) {
            return new ConfirmResult(true, "DONE", "MOCK", null, "mock 승인(테스트 키 미설정)");
        }
        try {
            String body = om.writeValueAsString(java.util.Map.of(
                    "paymentKey", paymentKey, "orderId", orderId, "amount", amount));
            String auth = Base64.getEncoder().encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(apiBase + "/v1/payments/confirm"))
                    .header("Authorization", "Basic " + auth)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            JsonNode json = om.readTree(res.body());
            if (res.statusCode() / 100 == 2) {
                String status = json.path("status").asText("DONE");
                String method = json.path("method").asText("");
                String cashReceiptKey = str(json.path("cashReceipt").path("receiptKey")); // 결제창에서 발급된 현금영수증
                return new ConfirmResult(true, status, method, cashReceiptKey, null);
            }
            String msg = json.path("message").asText("결제 승인에 실패했습니다.");
            return new ConfirmResult(false, "FAILED", null, null, msg);
        } catch (Exception e) {
            return new ConfirmResult(false, "FAILED", null, null, "결제 승인 통신 오류: " + e.getMessage());
        }
    }

    public record ReceiptResult(boolean ok, String receiptKey, String message) {}

    /**
     * 현금영수증 발행 — 토스 실 API: POST /v1/cash-receipts.
     *  identityNumber: 주민번호(뒷자리 없이 전체)/휴대폰번호/사업자번호. type: "소득공제" | "지출증빙".
     *  mock 모드면 발행 없이 성공 처리.
     */
    public ReceiptResult issueCashReceipt(String orderId, long amount, String orderName, String identityNumber, String type) {
        if (!enabled()) return new ReceiptResult(true, "MOCK-CASH-" + orderId, "mock 현금영수증(키 미설정)");
        try {
            String body = om.writeValueAsString(java.util.Map.of(
                    "orderId", orderId, "orderName", orderName == null ? "결제" : orderName,
                    "amount", amount, "customerIdentityNumber", identityNumber == null ? "" : identityNumber,
                    "type", type == null ? "소득공제" : type));
            String auth = Base64.getEncoder().encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(apiBase + "/v1/cash-receipts"))
                    .header("Authorization", "Basic " + auth)
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            JsonNode json = om.readTree(res.body());
            if (res.statusCode() / 100 == 2) {
                String key = json.path("receiptKey").asText(json.path("cashReceiptKey").asText("ISSUED"));
                return new ReceiptResult(true, key, null);
            }
            return new ReceiptResult(false, null, json.path("message").asText("현금영수증 발행 실패"));
        } catch (Exception e) {
            return new ReceiptResult(false, null, "현금영수증 통신 오류: " + e.getMessage());
        }
    }
}
