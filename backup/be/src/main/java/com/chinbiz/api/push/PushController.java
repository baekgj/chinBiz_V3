package com.chinbiz.api.push;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 웹푸시 구독 API.
 *  - GET  /api/push/vapid-public-key : PWA 클라이언트가 구독 시 사용할 공개키 (permitAll)
 *  - POST /api/push/subscribe        : 로그인 사용자의 브라우저 구독 저장/갱신 (authenticated)
 *  - DELETE /api/push/unsubscribe    : endpoint로 구독 삭제 (authenticated)
 */
@RestController
@RequestMapping("/api/push")
public class PushController {

    private final PushSubscriptionRepository repo;
    private final WebPushService webPushService;

    public PushController(PushSubscriptionRepository repo, WebPushService webPushService) {
        this.repo = repo;
        this.webPushService = webPushService;
    }

    @GetMapping("/vapid-public-key")
    public ResponseEntity<?> vapidPublicKey() {
        return ResponseEntity.ok(Map.of(
                "publicKey", webPushService.getPublicKey(),
                "enabled", webPushService.isConfigured()));
    }

    public record SubscribeRequest(String endpoint, String p256dh, String auth) {}

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(Authentication auth, @RequestBody SubscribeRequest req) {
        if (auth == null || auth.getName() == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        if (req == null || req.endpoint() == null || req.endpoint().isBlank()
                || req.p256dh() == null || req.auth() == null)
            return ResponseEntity.badRequest().body(Map.of("message", "구독 정보가 올바르지 않습니다."));

        String account = auth.getName();
        // 동일 endpoint가 있으면 계정/키 갱신, 없으면 신규 저장 (기기 재구독 대응)
        PushSubscription sub = repo.findByEndpoint(req.endpoint()).orElseGet(PushSubscription::new);
        sub.setAccount(account);
        sub.setEndpoint(req.endpoint());
        sub.setP256dh(req.p256dh());
        sub.setAuth(req.auth());
        repo.save(sub);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "구독 저장됨"));
    }

    public record UnsubscribeRequest(String endpoint) {}

    @DeleteMapping("/unsubscribe")
    public ResponseEntity<?> unsubscribe(Authentication auth, @RequestBody UnsubscribeRequest req) {
        if (auth == null || auth.getName() == null)
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));
        if (req != null && req.endpoint() != null && !req.endpoint().isBlank()) {
            repo.findByEndpoint(req.endpoint()).ifPresent(repo::delete);
        }
        return ResponseEntity.ok(Map.of("message", "구독 해제됨"));
    }
}
