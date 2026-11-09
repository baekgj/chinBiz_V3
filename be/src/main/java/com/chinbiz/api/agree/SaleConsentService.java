package com.chinbiz.api.agree;

import com.chinbiz.api.buzz.Sale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * 1차영업(sale) 고객 동의 연동 (docs/27).
 *  - syncProvideAgree : agree(대표자명+핸드폰+provide) 최신 기록 → sale.agree_check/agree_date
 *  - productLink      : 대표자에게 보낼 상품 URL ({HOME_URL}/products/{상품번호}?refId={sale.id}&ordNo={order_no})
 *  - sendProductLink  : 카카오 알림톡 발송 (알리고 연동, docs/35) — 문구는 본사 [시스템설정]-[알림톡설정]
 */
@Service
public class SaleConsentService {

    private static final Logger log = LoggerFactory.getLogger(SaleConsentService.class);

    private final AgreeRepository agreeRepo;
    private final String homeUrl;
    private final com.chinbiz.api.alimtalk.AlimtalkService alimtalkService;

    public SaleConsentService(AgreeRepository agreeRepo, com.chinbiz.api.alimtalk.AlimtalkService alimtalkService,
                              @Value("${app.home-url:http://localhost:8001}") String homeUrl) {
        this.agreeRepo = agreeRepo;
        this.alimtalkService = alimtalkService;
        this.homeUrl = homeUrl.endsWith("/") ? homeUrl.substring(0, homeUrl.length() - 1) : homeUrl;
    }

    /** 대표자명+핸드폰으로 provide 동의 기록 조회 → 있으면 sale 에 반영(없으면 pass). 저장은 호출자가 한다. */
    public void syncProvideAgree(Sale s) {
        if (isBlank(s.getCeoName()) || isBlank(s.getCeoPhone())) return;
        agreeRepo.findFirstByAgreeTypeAndNameAndPhoneOrderByIdDesc(Agree.PROVIDE, s.getCeoName().trim(), s.getCeoPhone().trim())
                .ifPresent(a -> { s.setAgreeCheck(a.getAgreeCheck()); s.setAgreeDate(a.getAgreeDate()); });
    }

    public String productLink(Sale s) {
        return homeUrl + "/products/" + s.getProductId() + "?refId=" + s.getId() + "&ordNo=" + s.getOrderNo();
    }

    /** 1차영업신청 접수 → 대표자 핸드폰으로 알림톡 발송(비동기, 결과는 alimtalk_log). 수신번호 없으면 SKIP 기록 */
    public void sendProductLink(Sale s) {
        log.info("[ALIMTALK-REQ] sale={} to={} url={}", s.getId(), s.getCeoPhone(), productLink(s));
        alimtalkService.sendSale1Customer(s, productLink(s));
    }

    private static boolean isBlank(String v) { return v == null || v.isBlank(); }
}
