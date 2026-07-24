# CLAUDE_CENTER.md · 센추럴 마스터 오피스 (`CENTER_ADMIN`)

> 센터(Center) 어드민 작업 시 이 문서를 우선 참조한다. 공통 규칙은 루트 `CLAUDE.md`.
> **우선순위 6 · 워크스페이스 구축 완료(FE 셸+대시보드) · 내 정보 실연동 · 도메인 섹션 mock**

## 개요
- 역할: `CENTER_ADMIN` (하부 버즈·매니저를 거느린 플랫폼 허브. 교육·상품공급·인프라 배정 총괄).
- 접근: 홈(8001) `/login` → `center`/`sample1234!` → `http://localhost:3100/center`.
- 테마: **프리미엄 골드 / 블랙 (다크)** — page `#0d0b06`, 카드 `#16120a`, 액센트 amber/gold 그라디언트. 단일 역할이라 컨텍스트 없이 `CenterUI.ct` 토큰 상수 사용.
- 가드: `admin/src/app/center/layout.tsx` 의 `AuthGuard allow={["CENTER_ADMIN"]}`.

## 파일 구조 (★모듈화. 전체 위치는 `docs/제작note.md`)
- `admin/src/app/center/layout.tsx` — AuthGuard[CENTER_ADMIN] + `CenterTopbar` + 골드/블랙 셸
- `components/center/CenterUI.tsx` — 테마 토큰 `ct` + `Card`/`Stat`/`PageHead`
- `components/center/CenterTopbar.tsx` — 라우트 메뉴 + 계정명→`/center/profile`(`/api/user/me`)
- 라우트(메뉴, ★디자인 시안 https://chinbiz.base44.app/center-dashboard 기준): `center/page.tsx`(센터 요약) · `buzz/`(소속 버즈) · `managers/`(소속 매니저) · `products/`(상품 및 교육 컨트롤) · `settlement/`(정산 원장) · `profile/`(내 정보)
- `components/center/sections/*` — `WalletSection`·`BuzzSection`·`ManagerSection`·`ProductsSection`·`SettlementSection` (mock)
- `components/center/ProfileForm.tsx` — 내 정보 수정(GET/PUT `/api/user/me`, 공용 `lib/postcode.ts`)

## 화면 (디자인 시안 반영 · 상단 메뉴=실제 라우트)
1. **센터 요약** (`/center`) — 실시간 정산·자산 현황판: CP/MP 센터 총합(버즈 + 매니저 분리), 조직별 세부 명세(소속=버즈 1차 / 관리=매니저 2차, CP 예정·MP 확정 + 정산 리포트 링크), MP 즉시 출금.
2. **소속 버즈 관리** (`/center/buzz`) — 소속 버즈회원 및 1차 영업 모니터링: 총 버즈(전월비) + **상품별 버즈 매핑 테이블**(카테고리·상품(파트너)·활동 버즈·접수 건수·건당 소속수당).
3. **소속 매니저 관리** (`/center/managers`) — 2차 영업 상품별 매니저 매핑 + **강제 배정(Override)**: 방치 DB 리스트, [강제 배정] 클릭 시 배정 완료 처리(client).
4. **상품 및 교육 컨트롤** (`/center/products`) — **상품 취급 ON/OFF 토글**(OFF 시 본사 우회 배지: 교육 HQ_ACADEMY / 수당 HQ_MAIN, CLAUDE.md §7) + 전체/ON/OFF 통계 + 버즈·매니저 교육 컨트롤 패널(공지·스케줄러·서식·QR).
5. **정산 원장** (`/center/settlement`) — 소속/관리 배정 전표(Insert-Only, CP_READY/MP_CONFIRMED/ROLLBACK_CANCEL).
6. **내 정보 수정** (`/center/profile`) — 이름·전화·이메일·주소(우편검색)·계좌·비밀번호. `/api/user/me`.

## 정산 라우팅 유의 (루트 CLAUDE.md §3-4, §7)
- **소속센터 ≠ 관리센터**: `settlement_ledger`에 소속센터ID·관리센터ID 각각 저장.
- 센터 기피 상품 우회: `sales_routing_rule`(상품ID·센터ID·취급상태·1차교육주체·2차관리주체·수당수취ID). 버즈 `user.sales_center_id` 활용.

## 실행/검증
- 데모: `center`/`sample1234!` (DataSeeder 자동 생성, user 테이블 CENTER_ADMIN).
- 검증(2026-07-12): 6개 라우트 200, 셸(골드/블랙 #0d0b06·CENTER 브랜드·시안 메뉴 5개·계정명→profile), 센터 요약(CP 총합·출금)·버즈(상품별 매핑·1,250)·매니저(강제배정 클릭→배정완료)·상품(취급 토글 ON↔OFF·HQ 우회 배지·교육·QR)·정산(MP_CONFIRMED·ROLLBACK) 렌더 실증.

## 남은 일
- 도메인 BE 실연동: 센터 집계(소속 버즈/관리 매니저·정산), 취급 토글(`Center_Product.is_active`)·라우팅 룰(`sales_routing_rule`), 강제 배정(`customer_allocation` override), LMS(교육 등록/출석/자료). 현재 전부 mock.
