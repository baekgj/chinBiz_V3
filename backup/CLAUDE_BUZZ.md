# CLAUDE_BUZZ.md · 버즈회원·관리매니저 워크스페이스 (`BUZZ`, `MANAGER`)

> 버즈/매니저 워크스페이스 작업 시 이 문서를 우선 참조한다. 공통 규칙은 루트 `CLAUDE.md`.
> **우선순위 4 · 워크스페이스 구축 완료(FE) · role별 테마(버즈 라이트/매니저 다크) · 내 정보 실연동 · 도메인 섹션 mock**

## 개요
- 역할: `BUZZ`(1차 영업 일반회원), `MANAGER`(2차 영업 전문 관리매니저). 두 역할 모두 `/buzz`로 진입.
- 접근: 홈(8001) `/login` → 예 `buzztester`/`pass1234`(BUZZ) → `http://localhost:3100/buzz`.
- 가드: `admin/src/app/buzz/layout.tsx` 의 `AuthGuard allow={["BUZZ","MANAGER"]}` (레이아웃에서 일괄 적용).
- 테마: **role별 자동 전환** — 버즈=딥 그린(emerald)+골드(amber) 라이트 / 매니저=블랙·차콜(neutral-950/900)+골드 다크. `components/buzz/theme.tsx`의 `BuzzProvider`가 `/api/auth/me`로 role 판별→테마 컨텍스트 제공, 모든 컴포넌트가 `useBuzz()`로 소비.
- 매니저 분기: 다크 테마 + 메뉴 라벨(정산·자산 현황/관리영업 파이프라인/관리 마켓·배정/네트워크) + 파이프라인 **배정 단계 추가**.

## 파일 구조 (★모듈화 — 메뉴별 라우트 + 섹션. 전체 위치는 `docs/제작note.md`)
- `admin/src/app/buzz/layout.tsx` — AuthGuard[BUZZ,MANAGER] + `BuzzProvider` + `BuzzShell`
- `components/buzz/theme.tsx` — **테마 컨텍스트/프로바이더**(LIGHT=버즈, DARK=매니저 토큰) + `useBuzz()`
- `components/buzz/BuzzShell.tsx` — 테마 적용 페이지 래퍼(+ BuzzTopbar + main)
- 라우트(메뉴): `buzz/page.tsx`(수당 현황) · `pipeline/` · `market/` · `network/` · **`profile/`(내 정보 수정)**
- `components/buzz/BuzzTopbar.tsx` — 라우트 메뉴 + 계정명→`/buzz/profile`, 테마·role별 라벨(useBuzz)
- `components/buzz/BuzzUI.tsx` — 공용 `Card`/`Stat`/`PageHead`/`GoldBadge`(테마 소비)
- `components/buzz/sections/*` — `WalletSection`(CP/MP, mock)·`PipelineSection`·`MarketSection`·`NetworkSection`(★실연동, 테마 소비)
- `components/buzz/ProfileForm.tsx` — 내 정보 수정(GET/PUT `/api/user/me`, 테마 소비)
- `components/buzz/MemberForm.tsx`·`ProductDetail.tsx`·`SaleForm.tsx` — 회원 등록/수정·상품 상세·1차영업 등록 폼
- 추가 라우트: `network/new`·`network/[id]`(회원)·`market/[id]`(상품상세)·`pipeline/new`·`pipeline/[id]`(영업상세)
- `lib/postcode.ts` — 카카오(다음) 우편번호 검색 공용 헬퍼

## docs/06.txt 구현 (네트워크·마켓·파이프라인 실연동, 2026-07-12)
### 네트워크 (`/buzz/network`, `NetworkSection`)
- 내가 추천/등록한 회원 목록(가입일·아이디·회원명·역할·상태) + 검색(아이디/이름, 가입일 from~to **캘린더** `input[type=date]`) + 페이징 + [+ 회원 등록].
- 회원명 클릭 → `/buzz/network/[id]` 수정. 등록 → `/buzz/network/new`(아이디 중복확인·우편번호 검색). **역할 BUZZ 고정, 추천인=로그인 버즈 자동 저장**.
### 상품 마켓 (`/buzz/market`, `MarketSection`)
- **3x3(9개/page) 그리드** + 페이징 + 검색(상품명·카테고리·파트너사). 상품명/상세보기 클릭 → `/buzz/market/[id]`.
- 상품 상세(`ProductDetail`): **수당내역 역할별 표시** — 버즈=버즈·추천인, 매니저=매니저·버즈·추천인만.
### 영업 파이프라인 (`/buzz/pipeline`, `PipelineSection`)
- [+ 1차 영업등록] → `/buzz/pipeline/new`(`SaleForm`): 카테고리·상품 선택 + 고객 B2B 정보(상호명·사업자번호·대표자·회사전화·담당자·핸드폰·이메일·회사주소(우편검색)·상세·영업진행상태·메모). 저장 시 **상품ID·버즈ID·매니저ID** 필드 저장(buzzId=로그인, managerId 미배정 null).
- 리스트: 등록일·상품명·파트너사명·고객명(상호명)·1차영업자명·영업단계. 상품명→상품상세, 고객명→`/buzz/pipeline/[id]`(영업 상세).

### BE (`com.chinbiz.api.buzz`, `/api/buzz/**` = BUZZ·MANAGER)
- `BuzzMemberController` `/api/buzz/members` (목록 검색·페이징 / `{id}` / POST 등록[BUZZ·referral=me] / PUT / `check-id`). 회원=`user.referral_code = 로그인 userId`. User에 `status`(ACTIVE/INACTIVE) 컬럼 추가.
- `BuzzMarketController` `/api/buzz/products`(검색·페이징 9)·`/{id}`(수당 전항목)·`/categories`·`/partners`. 판매중 상품만.
- `Sale` 엔티티(`sale` 테이블) + `BuzzSalesController` `/api/buzz/sales`(목록/`{id}`/POST/PUT). 상품·파트너·영업자명 조인 반환.
- 검증(2026-07-12): 회원 등록(referral 자동)/목록/중복확인, 마켓 9개·상품상세 수당, 1차영업 등록/목록, FE 네트워크(헤더·캘린더·등록버튼)·마켓(3x3·검색)·파이프라인(목록·상품명/고객명 링크)·상품상세 역할별 수당(버즈=버즈·추천인) 모두 실증.

## 내 정보 수정 (`/buzz/profile`)
- 계정명 클릭 진입. 수정: 이름·전화·이메일·주소(우편/주소/상세)·계좌(은행/계좌/예금주)·비밀번호(8자↑, 비우면 유지). 아이디/역할 읽기전용.
- BE: `user/UserSelfController` — `GET/PUT /api/user/me` (user 테이블 역할 공용, `SecurityConfig` `/api/user/**` authenticated). 비밀번호 입력 시 BCrypt.
- 검증(2026-07-12): buzztester GET/PUT(전화 변경) 라운드트립, 화면 프리필(홍길동) 실증.

## 테마 (구축 시)
- **버즈회원**: 딥 포레스트 그린 + 골드 (라이트) — 홈페이지와 동일 계열.
- **관리매니저**: 다크 모드(블랙/차콜) + 골드 — 일반회원 모드와 시각적으로 확연히 구분.
- (같은 `/buzz`에서 role에 따라 테마/구성 분기하거나, 매니저 승급 시 별도 뷰로 전환)

## 구축 예정 화면 (PDF p.8-18)
### 버즈회원
- 실시간 수당 현황판: **CP 예정수당 / MP 확정수당** 분리(직접 영업 + 추천 네트워크 10%).
- 나의 1차 영업 파이프라인: 접수→상담/방문→계약체결→배송/설치→구매확정/취소·반품 (탭: 전체/교육중/영업중/영업종료).
- 상품 마켓(1차 영업 대상), 즉시 1차 영업(링크 복사/카톡 공유).
- 버즈 네트워크 & 친구 추천(친쿠, 추천링크 `?ref=`), 관리매니저 승급 배너.
### 관리매니저
- 정산·자산 현황판(설치형/일반형), 2차 관리영업 파이프라인(배정 단계 추가, 24h 미수락 회수).
- 관리 마켓(제안서/배정 신청), 오늘의 업무 캘린더, 공급사 긴급공지.
- 지역기반 선착순 배정 수락(FCFS) — `customer_allocation` PENDING→ASSIGNED 조건부 UPDATE.

## 남은 일
- 매니저 전용 화면 심화: 오늘의 업무 캘린더, 공급사 긴급공지, 제안서 뷰, 지역 선착순 배정 수락(FCFS) UI. (다크 테마·배정 단계·관리 라벨은 완료)
- BE 도메인 실연동: 영업 파이프라인/정산 원장(CP/MP)/지역 선착순 배정(FCFS, `customer_allocation` PENDING→ASSIGNED 조건부 UPDATE). 현재 Wallet/Pipeline/Market/Network는 mock.
- 상품 마켓 실 상품 피드(버즈 접근용 상품 조회 API) + 추천링크 referralCode 실연동 + 카톡 공유 템플릿.

### 검증(2026-07-12 · role별 테마)
- MANAGER: 페이지 배경 neutral-950(다크)·카드 neutral-900·메뉴(정산·자산/관리영업 파이프라인+배정 단계/관리 마켓·배정) 실증.
- BUZZ: 페이지 emerald-50(라이트)·버즈 메뉴 실증. (buzztester role 임시 전환으로 검증 후 원복)
