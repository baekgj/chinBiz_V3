package com.chinbiz.api.buzz;

import com.chinbiz.api.alimtalk.AlimtalkLog;
import com.chinbiz.api.alimtalk.AlimtalkLogRepository;
import com.chinbiz.api.alimtalk.AlimtalkService;
import com.chinbiz.api.user.User;
import com.chinbiz.api.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

/**
 * 버즈 추천링크 알림톡 발송 (docs/38) — 버즈admin [대시보드]·[버즈네트워크]의 추천링크 영역.
 *  POST /api/buzz/referral/alimtalk {phone} → 입력한 핸드폰번호로 REFERRAL_LINK 알림톡 발송.
 *  문구·템플릿은 본사 [시스템설정]-[알림톡설정] [추천링크 발송] 탭. 결과는 alimtalk_log(ref_id = 발송 회원 user.id).
 *  남용 방지: 회원당 하루 DAILY_LIMIT 건.
 */
@RestController
@RequestMapping("/api/buzz/referral")
public class BuzzReferralController {

    static final int DAILY_LIMIT = 30;

    private final UserRepository userRepo;
    private final AlimtalkService alimtalkService;
    private final AlimtalkLogRepository logRepo;
    private final String homeUrl;

    public BuzzReferralController(UserRepository userRepo, AlimtalkService alimtalkService, AlimtalkLogRepository logRepo,
                                  @Value("${app.home-url:http://localhost:8001}") String homeUrl) {
        this.userRepo = userRepo; this.alimtalkService = alimtalkService; this.logRepo = logRepo;
        this.homeUrl = homeUrl.endsWith("/") ? homeUrl.substring(0, homeUrl.length() - 1) : homeUrl;
    }

    public record SendRequest(String phone) {}

    @PostMapping("/alimtalk")
    public ResponseEntity<?> send(Authentication auth, @RequestBody SendRequest req) {
        User me = auth == null ? null : userRepo.findByUserId(auth.getName()).orElse(null);
        if (me == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "인증 필요"));

        String to = req == null || req.phone() == null ? "" : req.phone().replaceAll("[^0-9]", "");
        if (!to.matches("01[016789]\\d{7,8}"))
            return ResponseEntity.badRequest().body(Map.of("message", "핸드폰번호를 정확히 입력해 주세요."));

        long today = logRepo.countByEventCodeAndRefIdAndCreatedAtGreaterThanEqual(
                AlimtalkService.EV_REFERRAL_LINK, me.getId(), LocalDate.now().atStartOfDay());
        if (today >= DAILY_LIMIT)
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(Map.of("message", "추천링크 알림톡은 하루 " + DAILY_LIMIT + "건까지 발송할 수 있습니다."));

        String link = homeUrl + "/signup?ref=" + me.getUserId();
        AlimtalkLog l = alimtalkService.sendReferralLink(me, to, link);
        return switch (l.getResult()) {
            case "SUCCESS" -> ResponseEntity.ok(Map.of("result", "SUCCESS",
                    "message", "추천링크 알림톡을 발송했습니다." + ("Y".equals(l.getTestMode()) ? " (테스트모드)" : "")));
            case "SKIP" -> ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(Map.of("result", "SKIP",
                    "message", "현재 추천링크 알림톡 발송을 사용할 수 없습니다. (" + l.getResultMessage() + ")"));
            default -> ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(Map.of("result", "FAIL",
                    "message", "알림톡 발송에 실패했습니다. 잠시 후 다시 시도해 주세요."));
        };
    }
}
