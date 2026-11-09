# CLAUDE_DIVISION.md · 총괄본부 마스터 오피스 (`DIVISION_ADMIN`)

> 본부(Division) 어드민 작업 시 이 문서를 우선 참조한다. 공통 규칙은 루트 `CLAUDE.md`.
> **우선순위 5 · 워크스페이스 구축 완료(FE 셸+대시보드) · 내 정보 실연동 · 도메인 섹션 mock**

## 개요
- 역할: `DIVISION_ADMIN` (센터들을 권역별로 묶은 상위 조직, 프랜차이즈형 확장).
- 접근: 홈(8001) `/login` → `division`/`sample1234!` → `http://localhost:3100/division`.
- 테마: **딥 퍼플 / 차콜 메탈릭 (다크)** — page `#141019`, 카드 `#1e1730`, 액센트 violet/fuchsia 그라디언트. 단일 역할이라 컨텍스트 없이 `DivisionUI.dv` 토큰 상수 사용.
- 가드: `admin/src/app/division/layout.tsx` 의 `AuthGuard allow={["DIVISION_ADMIN"]}`.

## 파일 구조 (★모듈화. 전체 위치는 `docs/제작note.md`)
- `admin/src/app/division/layout.tsx` — AuthGuard[DIVISION_ADMIN] + `DivisionTopbar` + 다크 퍼플 셸
- `components/division/DivisionUI.tsx` — 테마 토큰 `dv` + `Card`/`Stat`/`PageHead`
- `components/division/DivisionTopbar.tsx` — 라우트 메뉴 + 계정명→`/division/profile`(`/api/user/me`)
- 라우트(메뉴, ★디자인 시안 https://chinbiz.base44.app/division-dashboard 기준): `division/page.tsx`(본부 자산) · `centers/`(산하 센터 모니터링) · `pipeline/`(광역 파이프라인) · `settlement/`(수당 정산 원장) · `notices/`(본사 공지·프로모션) · `profile/`(내 정보) · `leaderboard/`(기여도 랭킹 — 본부 자산 내 버튼에서 진입, nav 비노출)
- `components/division/sections/*` — `WalletSection`·`CentersSection`·`PipelineSection`·`SettlementSection`·`NoticesSection`·`LeaderboardSection` (mock)
- `components/division/ProfileForm.tsx` — 내 정보 수정(GET/PUT `/api/user/me`, 공용 `lib/postcode.ts`)

## 화면 (디자인 시안 반영 · 상단 메뉴=실제 라우트)
1. **본부 자산** (`/division`) — 실시간 정산·광역 자산 현황판: CP/MP 본부 총합(버즈 인프라 + 매니저 인프라 분리), 1차/2차(7단계) 본부 배정액(CP 예정/MP 확정) + 기여도 랭킹·원장 링크, MP 즉시 출금 신청. 배정 요율 4%.
2. **산하 센터 모니터링** (`/division/centers`) — 1차 영업(버즈): 총 센터/버즈/상품종류 + **상품별 센터/버즈 매핑 테이블**(활성 센터·버즈 수·접수 건수·건당 본부 배정 수당).
3. **광역 파이프라인** (`/division/pipeline`) — 2차 영업(매니저): 총 매니저/상품종류 + **센터별 매니저 가동 테이블**(매니저 수·2차 상품·매칭·설치중·완결(MP) 전환율·최우수/집중관리 태그).
4. **수당 정산 원장** (`/division/settlement`) — 본부 배정 전표(Insert-Only) 로그(CP_READY/MP_CONFIRMED/ROLLBACK_CANCEL) + 매트릭스 로그 다운로드.
5. **본사 공지 및 프로모션** (`/division/notices`) — 본사 공지·정책·프로모션 리스트.
6. **내 정보 수정** (`/division/profile`) — 이름·전화·이메일·주소(우편검색)·계좌·비밀번호. `/api/user/me`.

## 정산 라우팅 유의 (루트 CLAUDE.md §3-4)
- `settlement_ledger`는 **소속본부(sales_division_id)** 와 **관리본부(mgmt_division_id)** 를 이원 저장 → 본부 수당 다중 라우팅.

## 실행/검증
- 데모: `division`/`sample1234!` (DataSeeder 자동 생성, user 테이블 DIVISION_ADMIN).
- 검증(2026-07-12): 4개 라우트 200, 셸(다크 퍼플 #141019·DIVISION 브랜드·라우트 메뉴·계정명→profile), 지갑(배정요율 4%)·리더보드/기여도·내정보(4섹션+우편검색+저장) 렌더 실증.

## 남은 일
- 도메인 BE 실연동: 산하 센터 집계(센터별 1·2차 영업/GMV/지원비), 본부 지갑 CP/MP 원장, 리더보드 점수 산식 — 현재 전부 mock.
- 본부↔센터 계층(`center_code` head_code 그룹) 기준 실데이터 매핑.

## docs/35-1 (2026-11-09) 본부분석 · 센터별 실적비교 실데이터
- BE `org/DivisionDashboardController` (`/api/division`):
  - `GET /dashboard` — CP=전체기간 예정수당 합계, MP=확정 합계−지급완료(출금가능, 버즈 대시보드와 동일), 산하 센터수/버즈회원수/상품종류 + 센터장 지정 리스트
  - `GET /centers?month=YYYY-MM` — 월별 산하 현황 + 센터별(센터코드·센터명·센터장ID·센터장명·버즈수·매니저수·영업접수건수·본부배정수당)
  - `GET /centers/{idx}/products?month=` — 센터의 상품별 버즈수·접수건수·본부배정수당(건당, RATE면 %) (타 본부 센터 403)
- 집계 기준: 소속 센터 = 본부장 할당 본부행(center_code.fix_idx=본인, 복수 가능) + user.sales_center_id 본부의 센터행 전체 / 센터장 = center_code.fix_idx 할당 계정(없으면 [미등록]) / 버즈 = BUZZ 소속(월말 기준 누적) /
  매니저 = manager_center 승인(Y) / 1차영업 = 등록자 소속센터 / 상품종류 = 취소/반품 제외 / 본부수당 센터귀속 = 전표 handler_id 소속센터(월=전표 등록일)
- FE: `DivisionDashboard`(매핑 섹션 삭제 → [소속센터 센터장 지정 현황], 미등록은 (미등록)) · `WalletSection`(props) ·
  `CentersSection`(오른쪽 상단 월 검색·기본 이번달, 센터코드/센터명 클릭 시 해당 센터 [1차 영업 상품별 센터/버즈 매핑 현황] 펼침, 1개만, 활성센터수 컬럼 삭제)
