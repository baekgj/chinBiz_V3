package com.chinbiz.api.push;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.bouncycastle.jce.provider.BouncyCastleProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.Security;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * 웹푸시(Web Push · VAPID) 발송 서비스. Firebase 없이 웹표준 프로토콜로 안드로이드 Chrome 등에 푸시.
 *  - VAPID 공개/개인키는 app.push.vapid.* 설정에서 주입(최초 1회 생성 후 고정). 키 미설정 시 발송은 no-op.
 *  - sendToAccounts: 계정들의 구독을 모아 각 endpoint로 암호화 발송. 만료(404/410) 구독은 정리.
 */
@Service
public class WebPushService {

    private static final Logger log = LoggerFactory.getLogger(WebPushService.class);

    private final PushSubscriptionRepository repo;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${app.push.vapid.public-key:}")
    private String publicKey;
    @Value("${app.push.vapid.private-key:}")
    private String privateKey;
    @Value("${app.push.vapid.subject:mailto:admin@chinbiz.kr}")
    private String subject;

    private PushService pushService;

    public WebPushService(PushSubscriptionRepository repo) {
        this.repo = repo;
    }

    @PostConstruct
    void init() {
        if (Security.getProvider(BouncyCastleProvider.PROVIDER_NAME) == null) {
            Security.addProvider(new BouncyCastleProvider());
        }
        if (isConfigured()) {
            try {
                this.pushService = new PushService(publicKey.trim(), privateKey.trim(), subject);
                log.info("[push] WebPushService 초기화 완료 (VAPID 설정됨)");
            } catch (Exception e) {
                log.error("[push] VAPID 키 초기화 실패 — 푸시 비활성화", e);
                this.pushService = null;
            }
        } else {
            log.warn("[push] VAPID 키 미설정 — 웹푸시 발송 비활성화 (app.push.vapid.public-key/private-key 필요)");
        }
    }

    public boolean isConfigured() {
        return publicKey != null && !publicKey.isBlank()
                && privateKey != null && !privateKey.isBlank();
    }

    /** PWA 클라이언트가 구독 시 사용할 VAPID 공개키(base64url) */
    public String getPublicKey() {
        return publicKey == null ? "" : publicKey.trim();
    }

    /**
     * 지정 계정들에게 푸시 발송. 대상별 구독을 모아 각 endpoint로 전송.
     * @return 성공 발송 건수
     */
    @Transactional
    public int sendToAccounts(Collection<String> accounts, String title, String body, String url) {
        if (accounts == null || accounts.isEmpty()) return 0;
        if (pushService == null) {
            log.warn("[push] 발송 요청 무시 — 푸시 미설정 (대상 {}명)", accounts.size());
            return 0;
        }
        List<PushSubscription> subs = repo.findByAccountIn(accounts);
        if (subs.isEmpty()) return 0;

        String payload = buildPayload(title, body, url);
        int sent = 0;
        for (PushSubscription s : subs) {
            try {
                Subscription sub = new Subscription(s.getEndpoint(),
                        new Subscription.Keys(s.getP256dh(), s.getAuth()));
                Notification notification = new Notification(sub, payload);
                var response = pushService.send(notification);
                int status = response.getStatusLine().getStatusCode();
                if (status == 404 || status == 410) {
                    // 만료/폐기된 구독 → 정리
                    repo.deleteByEndpoint(s.getEndpoint());
                    log.info("[push] 만료 구독 삭제 endpoint={}", shorten(s.getEndpoint()));
                } else if (status >= 200 && status < 300) {
                    sent++;
                } else {
                    log.warn("[push] 발송 실패 status={} endpoint={}", status, shorten(s.getEndpoint()));
                }
            } catch (Exception e) {
                log.warn("[push] 발송 예외 endpoint={} : {}", shorten(s.getEndpoint()), e.getMessage());
            }
        }
        log.info("[push] 발송 완료 {}/{}건 (대상 계정 {}명)", sent, subs.size(), accounts.size());
        return sent;
    }

    private String buildPayload(String title, String body, String url) {
        Map<String, Object> m = new LinkedHashMap<>();
        m.put("title", title == null ? "친비즈 알림" : title);
        m.put("body", body == null ? "" : body);
        m.put("url", url == null ? "/" : url);
        try {
            return objectMapper.writeValueAsString(m);
        } catch (Exception e) {
            return "{\"title\":\"친비즈 알림\",\"url\":\"/\"}";
        }
    }

    private String shorten(String endpoint) {
        if (endpoint == null) return "";
        return endpoint.length() <= 40 ? endpoint : endpoint.substring(0, 40) + "…";
    }
}
