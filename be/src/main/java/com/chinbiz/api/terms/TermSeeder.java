package com.chinbiz.api.terms;

import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/** 약관 10종 코드 시드 (없으면 제목만 생성, 내용은 [약관설정] 화면/PUT으로 등록) */
@Component
@Order(20)
public class TermSeeder implements CommandLineRunner {

    private final TermRepository repo;

    public TermSeeder(TermRepository repo) { this.repo = repo; }

    private static final String[][] DEFS = {
            {"TOTAL", "통합이용약관"},
            {"PRIVACY", "개인정보처리방침"},
            {"BUZZ", "버즈회원 이용약관"},
            {"MANAGER", "관리매니저 이용약관"},
            {"CENTER", "센터 이용약관"},
            {"DIVISION", "본부 이용약관"},
            {"CENTER_PAPER", "센터 위수탁계약서"},
            {"DIVISION_PAPER", "본부 위수탁계약서"},
            {"PARTNER", "파트너 이용약관"},
            {"PRIVACY_CONSENT", "개인정보 수집·이용 동의"},
    };

    @Override
    public void run(String... args) {
        for (int i = 0; i < DEFS.length; i++) {
            String code = DEFS[i][0];
            if (!repo.existsById(code)) {
                repo.save(new Term(code, DEFS[i][1], i));
            }
        }
    }
}
