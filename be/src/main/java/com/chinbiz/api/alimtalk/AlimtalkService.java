package com.chinbiz.api.alimtalk;

import com.chinbiz.api.buzz.Sale;
import com.chinbiz.api.product.ProductRepository;
import com.chinbiz.api.setting.AppSettingRepository;
import com.chinbiz.api.user.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * 카카오 알림톡 발송 서비스 (알리고 연동, docs/35).
 *  - 계정 설정 : app_setting aligo_apikey / aligo_userid / aligo_senderkey / aligo_sender / aligo_test_mode
 *  - 발송 문구 : alimtalk_template (event_code 별)
 *  - 발송 이력 : alimtalk_log (Insert-Only)
 *  이벤트: SALE1_CUSTOMER — 버즈admin 1차영업신청 접수 시 가망고객 대표자 핸드폰으로 발송.
 *         REFERRAL_LINK  — 버즈admin [대시보드]·[버즈네트워크] 추천링크를 입력한 핸드폰번호로 발송 (docs/38).
 *  발송은 별도 스레드(비동기)로 수행해 영업 등록 응답을 지연시키지 않는다.
 */
@Service
public class AlimtalkService {

    private static final Logger log = LoggerFactory.getLogger(AlimtalkService.class);

    public static final String EV_SALE1_CUSTOMER = "SALE1_CUSTOMER";
    public static final String EV_REFERRAL_LINK = "REFERRAL_LINK";
    /** 알림톡 유형(이벤트) 표시 순서 — 본사 [알림톡설정] 탭 순서 */
    public static final List<String> EVENTS = List.of(EV_SALE1_CUSTOMER, EV_REFERRAL_LINK);

    // app_setting 키
    public static final String K_APIKEY = "aligo_apikey";
    public static final String K_USERID = "aligo_userid";
    public static final String K_SENDERKEY = "aligo_senderkey";
    public static final String K_SENDER = "aligo_sender";
    public static final String K_TESTMODE = "aligo_test_mode";
    public static final List<String> CONFIG_KEYS = List.of(K_APIKEY, K_USERID, K_SENDERKEY, K_SENDER, K_TESTMODE);

    /** 치환 변수 (화면 안내용 설명 포함) — SALE1_CUSTOMER */
    public static final Map<String, String> VARS = new LinkedHashMap<>();
    /** 치환 변수 — REFERRAL_LINK (docs/38) */
    public static final Map<String, String> REFERRAL_VARS = new LinkedHashMap<>();
    static {
        VARS.put("#{대표자명}", "가망고객 대표자명");
        VARS.put("#{상호명}", "가망고객 상호명");
        VARS.put("#{상품명}", "영업 상품명");
        VARS.put("#{주문번호}", "1차영업 주문(접수)번호");
        VARS.put("#{접수일시}", "접수 일시 (yyyy-MM-dd HH:mm)");
        VARS.put("#{버즈회원명}", "1차영업 버즈회원 이름");
        VARS.put("#{상품링크}", "상품 확인·동의 URL");
        VARS.put("#{고객센터}", "친비즈 고객센터 번호");
        REFERRAL_VARS.put("#{버즈회원명}", "추천하는 버즈회원 이름");
        REFERRAL_VARS.put("#{추천코드}", "추천 코드(버즈회원 아이디)");
        REFERRAL_VARS.put("#{추천링크}", "버즈회원 가입 추천 URL");
        REFERRAL_VARS.put("#{고객센터}", "친비즈 고객센터 번호");
    }

    /** 이벤트별 치환 변수 */
    public static Map<String, String> varsOf(String eventCode) {
        return EV_REFERRAL_LINK.equals(eventCode) ? REFERRAL_VARS : VARS;
    }
    static final String CS_PHONE = "02-6412-0505";

    private final AlimtalkTemplateRepository tplRepo;
    private final AlimtalkLogRepository logRepo;
    private final AppSettingRepository settingRepo;
    private final ProductRepository productRepo;
    private final UserRepository userRepo;
    private final AligoClient client;
    private final ObjectMapper om = new ObjectMapper();
    private final ExecutorService executor = Executors.newFixedThreadPool(2, r -> {
        Thread t = new Thread(r, "alimtalk-sender"); t.setDaemon(true); return t;
    });

    public AlimtalkService(AlimtalkTemplateRepository tplRepo, AlimtalkLogRepository logRepo,
                           AppSettingRepository settingRepo, ProductRepository productRepo,
                           UserRepository userRepo, AligoClient client) {
        this.tplRepo = tplRepo; this.logRepo = logRepo; this.settingRepo = settingRepo;
        this.productRepo = productRepo; this.userRepo = userRepo; this.client = client;
    }

    public AligoClient.Account account() {
        return new AligoClient.Account(
                settingRepo.getStr(K_APIKEY, ""), settingRepo.getStr(K_USERID, ""),
                settingRepo.getStr(K_SENDERKEY, ""), settingRepo.getStr(K_SENDER, ""),
                "Y".equals(settingRepo.getStr(K_TESTMODE, "N")));
    }

    /** 1차영업신청 접수 → 가망고객 대표자 핸드폰 알림톡 (비동기) */
    public void sendSale1Customer(Sale s, String productLink) {
        if (s == null) return;
        Map<String, String> vars = saleVars(s, productLink);
        String phone = s.getCeoPhone();
        String name = s.getCeoName();
        Long saleId = s.getId();
        executor.submit(() -> {
            try { send(EV_SALE1_CUSTOMER, saleId, phone, name, vars); }
            catch (Exception e) { log.warn("[ALIMTALK] sale={} 발송 오류: {}", saleId, e.getMessage()); }
        });
    }

    Map<String, String> saleVars(Sale s, String productLink) {
        Map<String, String> v = new LinkedHashMap<>();
        v.put("#{대표자명}", nz(s.getCeoName()));
        v.put("#{상호명}", nz(s.getCompanyName()));
        v.put("#{상품명}", s.getProductId() == null ? "" :
                productRepo.findById(s.getProductId()).map(p -> nz(p.getName())).orElse(""));
        v.put("#{주문번호}", nz(s.getOrderNo()));
        LocalDateTime at = s.getCreatedAt() != null ? s.getCreatedAt() : LocalDateTime.now();
        v.put("#{접수일시}", at.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        v.put("#{버즈회원명}", s.getBuzzId() == null ? "" :
                userRepo.findById(s.getBuzzId()).map(u -> nz(u.getName())).orElse(""));
        v.put("#{상품링크}", nz(productLink));
        v.put("#{고객센터}", CS_PHONE);
        return v;
    }

    /** 추천링크 → 입력한 핸드폰 알림톡 (docs/38, 동기 — 결과를 화면에 안내). ref_id = 발송 버즈 user.id */
    public AlimtalkLog sendReferralLink(com.chinbiz.api.user.User buzz, String receiver, String link) {
        Map<String, String> v = new LinkedHashMap<>();
        v.put("#{버즈회원명}", nz(buzz.getName()));
        v.put("#{추천코드}", nz(buzz.getUserId()));
        v.put("#{추천링크}", nz(link));
        v.put("#{고객센터}", CS_PHONE);
        return send(EV_REFERRAL_LINK, buzz.getId(), receiver, "", v);
    }

    /** 이벤트별 테스트 발송용 샘플 값 */
    public Map<String, String> sampleVars(String eventCode) {
        if (!EV_REFERRAL_LINK.equals(eventCode)) return sampleVars();
        Map<String, String> v = new LinkedHashMap<>();
        v.put("#{버즈회원명}", "김버즈");
        v.put("#{추천코드}", "buzz_hong123");
        v.put("#{추천링크}", "https://chinbiz.kr/signup?ref=buzz_hong123");
        v.put("#{고객센터}", CS_PHONE);
        return v;
    }

    /** 테스트 발송용 샘플 값 (SALE1_CUSTOMER) */
    public Map<String, String> sampleVars() {
        Map<String, String> v = new LinkedHashMap<>();
        v.put("#{대표자명}", "홍길동");
        v.put("#{상호명}", "친비즈상회");
        v.put("#{상품명}", "깔끔돌이 돌솥 세척기");
        v.put("#{주문번호}", "OD20261109-000001");
        v.put("#{접수일시}", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")));
        v.put("#{버즈회원명}", "김버즈");
        v.put("#{상품링크}", "https://chinbiz.com/products/1?refId=1&ordNo=OD20261109-000001");
        v.put("#{고객센터}", CS_PHONE);
        return v;
    }

    /** 이벤트 발송(동기) — 결과 로그 Insert 후 반환 */
    public AlimtalkLog send(String eventCode, Long refId, String receiver, String recvName, Map<String, String> vars) {
        AlimtalkTemplate t = tplRepo.findById(eventCode).orElse(null);
        AligoClient.Account acc = account();
        AlimtalkLog l = new AlimtalkLog();
        l.setEventCode(eventCode);
        l.setRefId(refId);
        l.setReceiver(AligoClient.digits(receiver));
        l.setRecvName(recvName);
        l.setTestMode(acc.testMode() ? "Y" : "N");

        String skip = null;
        if (t == null) skip = "발송 문구 미설정";
        else if (!"Y".equals(t.getEnabled())) skip = "발송 사용 안함";
        else if (!AligoClient.notBlank(t.getTplCode())) skip = "템플릿 코드 미설정";
        else if (!acc.ready()) skip = "알리고 계정 설정 미비";
        else if (l.getReceiver().length() < 10) skip = "수신번호 없음/오류";

        if (t != null) {
            l.setTplCode(t.getTplCode());
            l.setMessage(render(t.getMessage(), vars));
        }
        if (skip != null) {
            l.setResult("SKIP");
            l.setResultMessage(skip);
            log.info("[ALIMTALK-SKIP] event={} ref={} to={} reason={}", eventCode, refId, l.getReceiver(), skip);
            return logRepo.save(l);
        }

        AligoClient.Result r = client.send(acc, new AligoClient.Message(
                t.getTplCode(), l.getReceiver(), recvName, render(t.getSubject(), vars), l.getMessage(),
                buttonParam(t.getButtonJson(), vars), "Y".equals(t.getFailover()),
                render(t.getFsubject(), vars), render(t.getFmessage(), vars)));
        l.setResult(r.ok() ? "SUCCESS" : "FAIL");
        l.setResultCode(r.code());
        l.setResultMessage(cut(r.message(), 500));
        l.setMid(r.mid());
        log.info("[ALIMTALK] event={} ref={} to={} result={} code={} msg={}", eventCode, refId, l.getReceiver(), l.getResult(), r.code(), r.message());
        return logRepo.save(l);
    }

    /** #{변수} 치환 */
    public static String render(String text, Map<String, String> vars) {
        if (text == null) return null;
        String out = text;
        for (var e : vars.entrySet()) out = out.replace(e.getKey(), e.getValue() == null ? "" : e.getValue());
        return out;
    }

    /** 저장된 버튼 배열 JSON → 알리고 button_1 형식 {"button":[...]} (변수 치환, 빈 배열이면 null) */
    String buttonParam(String buttonJson, Map<String, String> vars) {
        if (!AligoClient.notBlank(buttonJson)) return null;
        try {
            JsonNode arr = om.readTree(render(buttonJson, vars));
            if (!arr.isArray() || arr.isEmpty()) return null;
            ArrayNode out = om.createArrayNode();
            for (JsonNode b : arr) {
                if (!AligoClient.notBlank(b.path("name").asText(""))) continue;
                ObjectNode n = om.createObjectNode();
                String type = b.path("linkType").asText("WL");
                n.put("name", b.path("name").asText());
                n.put("linkType", type);
                n.put("linkTypeName", linkTypeName(type));
                for (String k : List.of("linkMo", "linkPc", "linkIos", "linkAnd")) {
                    String v = b.path(k).asText("");
                    if (!v.isBlank()) n.put(k, v);
                }
                out.add(n);
            }
            if (out.isEmpty()) return null;
            ObjectNode wrap = om.createObjectNode();
            wrap.set("button", out);
            return om.writeValueAsString(wrap);
        } catch (Exception e) {
            log.warn("[ALIMTALK] 버튼 JSON 파싱 실패: {}", e.getMessage());
            return null;
        }
    }

    static String linkTypeName(String t) {
        return switch (t) {
            case "AC" -> "채널 추가";
            case "DS" -> "배송조회";
            case "AL" -> "앱링크";
            case "BK" -> "봇키워드";
            case "MD" -> "메시지전달";
            default -> "웹링크";
        };
    }

    private static String nz(String v) { return v == null ? "" : v; }
    private static String cut(String v, int n) { return v == null || v.length() <= n ? v : v.substring(0, n); }

    /** 기본 이벤트/문구 시더 (최초 1회, 사용안함 상태로 생성) */
    @Component
    @Order(23)
    static class Seeder implements CommandLineRunner {
        private final AlimtalkTemplateRepository repo;
        Seeder(AlimtalkTemplateRepository repo) { this.repo = repo; }
        @Override public void run(String... args) {
            seedReferral();
            if (repo.findById(EV_SALE1_CUSTOMER).isPresent()) return;
            AlimtalkTemplate t = new AlimtalkTemplate(EV_SALE1_CUSTOMER, "1차영업신청 접수 → 가망고객 대표자");
            t.setEnabled("N");
            t.setSubject("상품 상담 신청 접수 안내");
            t.setMessage("""
                    [친비즈] #{대표자명} 대표님, 안녕하세요.
                    #{버즈회원명}님의 소개로 [#{상품명}] 상품 상담 신청이 접수되었습니다.

                    ■ 상호명 : #{상호명}
                    ■ 접수번호 : #{주문번호}
                    ■ 접수일시 : #{접수일시}

                    아래 [상품 확인하기] 버튼을 눌러 상품 정보를 확인해 주세요.
                    문의 : #{고객센터}""");
            t.setButtonJson("[{\"name\":\"상품 확인하기\",\"linkType\":\"WL\",\"linkMo\":\"#{상품링크}\",\"linkPc\":\"#{상품링크}\"}]");
            t.setFailover("Y");
            t.setFsubject("[친비즈] 상품 상담 신청 접수");
            t.setFmessage("[친비즈] #{대표자명} 대표님, [#{상품명}] 상담 신청이 접수되었습니다. 상품확인: #{상품링크}");
            repo.save(t);
        }

        /** 추천링크 발송 (docs/38) — 사용안함 상태로 생성. 알리고 템플릿 검수 후 본사에서 코드·문구 맞춰 사용 */
        private void seedReferral() {
            if (repo.findById(EV_REFERRAL_LINK).isPresent()) return;
            AlimtalkTemplate t = new AlimtalkTemplate(EV_REFERRAL_LINK, "버즈 추천링크 발송 → 입력한 핸드폰");
            t.setEnabled("N");
            t.setSubject("친비즈 버즈회원 추천 안내");
            t.setMessage("""
                    [친비즈] #{버즈회원명}님이 친비즈 버즈회원 가입을 추천했습니다.

                    친비즈는 내 네트워크로 좋은 상품을 소개하고
                    성과에 따라 수당을 받는 버즈마케팅 플랫폼입니다.

                    ■ 추천코드 : #{추천코드}

                    아래 [무료 회원가입] 버튼을 눌러 가입해 주세요.
                    문의 : #{고객센터}""");
            t.setButtonJson("[{\"name\":\"무료 회원가입\",\"linkType\":\"WL\",\"linkMo\":\"#{추천링크}\",\"linkPc\":\"#{추천링크}\"}]");
            t.setFailover("Y");
            t.setFsubject("[친비즈] 버즈회원 추천");
            t.setFmessage("[친비즈] #{버즈회원명}님이 친비즈 버즈회원 가입을 추천했습니다. 가입: #{추천링크}");
            repo.save(t);
        }
    }
}
