# CLAUDE_PARTNER.md · 파트너사 어드민 (`PARTNER`)

> 파트너사(공급사/제조사) 어드민 작업 시 이 문서를 우선 참조한다. 공통 규칙은 루트 `CLAUDE.md`.
> **우선순위 3 · 구축 완료(화면) · 데이터는 mock**

## 개요
- 역할: `PARTNER` (상품 위탁 공급 + 총수당 지급 B2B 주체).
- 접근: 홈(8001) `/login` → 파트너 계정 → `http://localhost:3100/partner`.
  - 파트너 계정 로그인은 **user 테이블 → 없으면 partner 테이블** 순 조회(루트 CLAUDE.md 참조). 예: `sinhwa` / `pw12345678`(partner 테이블), 또는 시드 `partner`/`sample1234!`(user 테이블).
- 테마: **B2B 스카이블루 / 그레이 (라이트)** — HQ 다크 네이비와 확연히 구분. Tailwind 기본 `sky`/`slate`/`emerald` 사용.
- 가드: `admin/src/app/partner/layout.tsx` 의 `AuthGuard allow={["PARTNER"]}`.

## 파일 구조 (★모듈화 — 메뉴별 라우트 + 섹션 컴포넌트)
> 상단 메뉴 클릭 시 **실제 라우트 이동**(대시보드 앵커 아님). 각 메뉴 = 별도 `page.tsx`(모듈) + 재사용 섹션 컴포넌트. 전체 모듈 위치는 [`docs/제작note.md`](docs/제작note.md) 참조.
- `admin/src/app/partner/layout.tsx` — 라이트 셸(AuthGuard[PARTNER] + `PartnerTopbar`)
- 라우트(메뉴): `partner/page.tsx`(정산/수당) · `products/` · `pipeline/` · `voc/` · `managers/` · **`profile/`(내 정보 수정)**
- `components/partner/PartnerTopbar.tsx` — 라이트 상단바. 메뉴=`Link`+`usePathname()` 활성표시, **업체명 클릭 → `/partner/profile`**, 로그아웃(쿠키 삭제).
- `components/partner/PartnerUI.tsx` — 공용 `Card`/`Stat`/`PageHead`(라이트).
- `components/partner/sections/*` — `BillingSection`·`ProductsSection`·`SalesSection`·`VocSection`·`ManagersSection`(각 메뉴 본문 모듈).
- `components/partner/ProfileForm.tsx` — 내 정보 수정(GET/PUT `/api/partner/me`).
- `components/partner/PartnerPipeline.tsx` — 실시간 영업 파이프라인(탭 필터, 클라이언트).

## 상품 관리 · 상품 등록 (`/partner/products`, `/products/new`, `/products/[id]`)
- 리스트(`sections/ProductsSection.tsx`, 실데이터 `GET /api/partner/products`) 우측 상단 **[+ 상품 등록]** → `/partner/products/new`. 행 클릭/[수정] → `/partner/products/[id]`.
- 등록/수정 폼 `components/partner/ProductForm.tsx` — **본사 상품등록 화면 참조**(라이트 테마). 카테고리 대→중→소 cascade, 판매가/총수당, **7주체 역할별 수당 + 실시간 100%/총수당 합계 검증**, 이미지 파일 업로드/드래그앤드롭(최대 5), 상품설명(일반 textarea).
- BE `partner/PartnerProductController`: `GET categories`·`GET/POST/PUT products`. **partnerId는 로그인 파트너로 서버 강제**, 타 파트너 상품은 404. 이미지 업로드는 PARTNER도 허용.
- 검증(2026-07-11): categories 7건, POST 등록(partnerId 강제=1), 본인 상품만 목록(2건), 화면 렌더(7수당 필드·합계 배지·카테고리 select·드롭존) 실증.

## 내 정보 수정 (`/partner/profile`)
- 업체명 클릭 진입. 수정 가능: **담당자명·전화번호·이메일·계좌정보(은행명/계좌번호/예금주)·비밀번호**(8자↑, 비우면 유지). 상호명/아이디는 읽기전용.
- BE: `partner/PartnerSelfController` — `GET /api/partner/me`, `PUT /api/partner/me`(PARTNER 전용, `SecurityConfig` `/api/partner/**` hasRole PARTNER). 비밀번호는 입력 시 BCrypt 해시.

## 화면 섹션 (PDF p.29-32, 현재 mock)
1. **B2B Billing Hub** — CP 지급예정 ₩18,500,000 / MP 확정 ₩7,200,000 지갑 + 예치금 잔액 ₩15,000,000·전용 가상계좌 + [예치금 충전]·[확정수당 자동차감] + 명세서/세금계산서.
2. **위탁 상품·총수당 관리** — 등록 상품 수/설정 완료/활성 지표 + 상품 테이블(공급가/총수당) + [수당/조건 변경].
3. **실시간 영업 파이프라인** — ★**실DB 연동**★: 내 상품(product.partner_id=로그인 파트너)에 접수된 1차 영업(`sale`) 조회. 요약지표(유입/진행/완결/취소) + 탭(전체·진행중·계약완료·설치완료·취소반품) + 고객명·상품·버즈·매니저(미배정)·상태·업데이트일. BE `partner/PartnerSalesController` `GET /api/partner/sales`(상품 소유권 필터 + group/stats 계산). FE `PartnerPipeline`(useEffect fetch). **고객사명 클릭 → 영업 상세 팝업**(`GET /api/partner/sales/{id}`, `SaleDetailModal`): 1차(버즈 등록 정보 — 접수자·고객 B2B 상세·메모) / 2차(관리매니저 배정 현황·미배정). 검증(2026-07-12): 파트너 상품→버즈 1차영업 등록→영업현황 2건·탭 필터·상세 팝업(1·2차)·타 id 404 E2E.
4. **VOC 센터** — 미처리/처리 + 민원 리스트(즉시 조치/본사 소통).
5. **직영 관리매니저 & 유지보수비 빌링** — 가동/리뉴얼 지표 + 매니저 라이선스 테이블 + 정기 유지보수비(₩400,000) 자동청구 알림.

## 실행/검증
- 데모: `sinhwa`/`pw12345678`. 검증: PARTNER 토큰→렌더, MASTER_ADMIN 토큰→/master 차단.
- (2026-07-11) 모듈화+라우트 메뉴 검증 완료: 6개 라우트 200, 메뉴 클릭→라우트 이동(`/partner/pipeline` 등), 업체명→`/partner/profile` 폼 프리필(담당자/전화/이메일/계좌) + 전화번호 수정 PUT 라운드트립 저장 확인.

## 남은 일
- 실 BE 연동: 예치금/가상계좌(Billing Hub), 위탁 상품·총수당(상품 관리와 연계), 파이프라인(계약 데이터), VOC, 직영 매니저 빌링.
- 파트너 본인 상품의 총수당 설정 = 본사 상품관리의 7단계 매트릭스와 데이터 공유 설계 필요.
