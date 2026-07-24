# CLAUDE_MASTER.md · 본사 어드민 (HQ Master / `MASTER_ADMIN`)

> 본사 마스터 어드민 작업 시 이 문서를 우선 참조한다. 공통 규칙(스택·DB·인증·역할 라우팅·가드)은 루트 `CLAUDE.md` 참조.
> **우선순위 2 · 구축 완료**

## 개요
- 역할: `MASTER_ADMIN` (전체 총괄). 실무 분리용 4대 담당자(ROLE_MD/OP/FIN/CS)는 시스템 설정에서 시각적 정의(실 RBAC 세분화는 향후).
- 접근: 홈(8001) `/login` → `admin`/`sample1234!` → `http://localhost:3100/master`.
- 테마: **다크 네이비 + 블루·청록 그라디언트** (`--color-navy-*`, `--color-brand-*`, `cyan`).
- 가드: `admin/src/app/master/layout.tsx` 의 `AuthGuard allow={["MASTER_ADMIN"]}` → 비로그인 홈 로그인, 권한 불일치 시 본인 워크스페이스로 이동.

## 파일 구조
- `admin/src/app/master/layout.tsx` — 셸(AuthGuard + `Sidebar` + `Topbar`)
- `admin/src/app/master/page.tsx` — 대시보드
- `admin/src/app/master/partners/` — 파트너사 관리(리스트 `page.tsx`, 등록 `new/page.tsx`, 수정 `[id]/page.tsx`)
- `admin/src/app/master/products/page.tsx` — 상품 관리 + 7단계 분배 시뮬레이터
- `admin/src/app/master/organization/page.tsx` — 조직망 관리
- `admin/src/app/master/settlement/page.tsx` — 수당·정산(OTP 게이트)
- `admin/src/app/master/complaints/page.tsx` — 민원(Freeze)
- `admin/src/app/master/settings/page.tsx` — 시스템 설정(RBAC/토글)
- 공통 컴포넌트: `components/Sidebar.tsx`, `Topbar.tsx`, `Icon.tsx`, `ui.tsx`, `nav.ts`(LNB 7메뉴), `AuthGuard.tsx`
- 파트너 폼: `components/master/PartnerForm.tsx`

## LNB 7메뉴 (`components/nav.ts`)
대시보드 / 파트너사 관리 / 상품 관리 / 조직망 관리 / 수당 및 정산 관리 / 민원 관리 센터 / 시스템 설정 (경로 `/master`, `/master/partners` …)

## 화면별 현황
| 메뉴 | 상태 | 내용 |
|---|---|---|
| 대시보드 | mock | GMV ₩2,450,000,000·순수익 ₩184,000,000 그라디언트 KPI + 플랫폼 가동 현황(파트너42/상품128/본부5/센터24/매니저350/버즈12,400) + 처리대기·실시간 피드 |
| **파트너사 관리** | **✅ 실 BE 연동(CRUD)** | 아래 별도 항목 |
| **상품 관리** | **✅ 실 BE 연동** | LNB 하위메뉴(카테고리 관리/상품 등록/상품 리스트). 아래 별도 항목 |
| **조직망 관리** | **✅ 실 BE 연동** | 하위메뉴(본부·센터 등록/회원 리스트/조직 관리 트리). 아래 별도 항목 |
| 수당·정산 | mock | 2차 인증(OTP) 게이트 → CP/MP append-only 원장(역정산 예시)·출금 승인 |
| 민원 센터 | mock | VOC 리스트 + 수당 확정 동결(SETTLEMENT_FREEZE) 토글 |
| 시스템 설정 | mock | RBAC 4담당자 + 배정 알고리즘 토글(선착순/리매칭/우회/크로스센터) |

## ★ 파트너사 관리 (실 BE 연동 · `docs/03.txt`)
- **partner 테이블** CRUD. API는 `/api/partners/**` (`hasRole("MASTER_ADMIN")`).
  - `GET /api/partners?page=&size=` 페이징 목록
  - `POST /api/partners` 등록 (비번 BCrypt, 아이디 user+partner 양쪽 중복검사)
  - `GET /api/partners/{id}` 단건 / `PUT /api/partners/{id}` 수정(비번 비우면 유지)
  - `GET /api/partners/check-id?loginId=` **user·partner 양쪽 중복확인**
- BE: `com.chinbiz.api.partner`(`Partner`, `PartnerRepository`, `PartnerController`, `dto/*`).
- FE: 리스트(등록버튼·페이징·상호명 클릭→수정), 폼 14필드(계정/회사/담당자/정산계좌)+다음 우편번호+중복확인. `admin/src/lib/api.ts`가 JWT Bearer 자동 첨부.
- 검증 완료: 등록→리스트→페이징(12건 2p)→수정(상호명·비번)→중복확인→비인증 403.

## ★ 상품 관리 (하위메뉴 · docs/04.txt A · 실 BE 연동)
LNB 상품 관리 아래 하위메뉴: **카테고리 관리 / 상품 등록 / 상품 리스트**. (`components/nav.ts` children, `Sidebar` 확장 렌더)
- **카테고리 관리** `/master/products/categories` — `category` 테이블. 대/중/소(level)·상위 분류(parentId)·카테고리명·운영상태. 상위 선택: **중분류→대분류**, **소분류→대분류+중분류(2단 cascade)**. [등록](모달) + 게시/중지 토글 + 카테고리명 클릭 수정.
  - API `/api/categories`: `GET`(목록)·`POST`·`GET/{id}`·`PUT/{id}`·`POST /{id}/toggle`.
- **상품 등록/수정** `/master/products/new`, `/master/products/[id]/edit` — `ProductForm`. 필드: 상품명·수당유형(RATE/FIXED)·판매가·총수당·**카테고리(대→중→소 3단 cascade)**·파트너사·**이미지(파일 업로드/드래그앤드롭, 최대 5)**·역할별 수당7·상품설명(textarea)·설치/반품 규정·판매여부.
  - **저장 검증**: RATE → 역할별 수당 합계 =100%, FIXED → 합계 =총수당. 불일치 시 메시지·저장 불가(실시간 합계 표시).
  - **이미지 업로드**: `POST /api/uploads`(multipart, MASTER_ADMIN)가 `be/uploads/`에 저장 후 URL 반환 → 상품 image1~5에 URL 저장. 정적 서빙 `GET /uploads/**`(공개, `WebConfig`). BE: `com.chinbiz.api.upload`, multipart 10MB.
- **상품 리스트** `/master/products` — 좌 60%(리스트) / 우 40%(총수당 분배 시뮬레이터). 상단 필터(카테고리/파트너사/판매여부/상품명 검색), 하단 페이징, 상품명 클릭→시뮬레이터 갱신, 수정 버튼.
  - API `/api/products`: `GET`(필터 categoryId/partnerId/onSale/keyword + 페이징)·`POST`·`GET/{id}`·`PUT/{id}`.
- BE: `com.chinbiz.api.category`, `com.chinbiz.api.product`(JpaSpecificationExecutor 필터). 모두 `hasRole("MASTER_ADMIN")`.
- 검증: 카테고리 등록/토글, 상품 등록(UI)→리스트 반영, 필터·페이징·시뮬레이터 E2E 통과.

## ★ 조직망 관리 (하위메뉴 · docs/04.txt B · 일부 실 BE 연동)
LNB 조직망 관리 하위: **본부·센터 등록 / 회원 리스트 / 조직 관리**.
- **center_code 테이블(원본 chin4 재사용)**: `idx`·`head_code`·`head_name`(본부명)·`center_code`(null=본부/not null=센터)·`center_name`(센터명). 본부/센터 계정은 **user 테이블**에 저장, `user.sales_center_id = center_code.idx`.
- **본부·센터 등록** `/master/organization/register` — 역할(본부/센터)·아이디+중복확인(user+partner)·비번·이름·전화·이메일·계좌(은행/번호/예금주).
  - 본부: `GET /api/org/center-codes/divisions`(center_code IS NULL) 선택 → role=DIVISION_ADMIN.
  - 센터: `GET /api/org/divisions`(본부 계정) 선택 → 그 본부 sales_center_id로 `GET /api/org/center-codes/centers?divisionIdx=`(head_code 그룹의 센터 후보) 선택 → role=CENTER_ADMIN.
- **회원 리스트** `/master/organization/members` — 전체 user 페이징, 역할/소속(center_name) 표시, 회원명 클릭→수정(비번 변경 가능).
- **조직 관리 트리** `/master/organization` — 본부 클릭→산하 센터, 센터 클릭→소속 버즈/매니저 lazy 전개. API `tree/divisions`·`tree/centers?divisionId=`·`tree/members?centerIdx=` (head_code로 본부↔센터 연결, sales_center_id로 센터↔버즈/매니저 연결).
- API `/api/org/**`(`hasRole("MASTER_ADMIN")`): `check-id`·`center-codes/divisions`·`center-codes/centers`·`divisions`·`members`(GET 페이징/POST)·`members/{id}`(GET/PUT). BE: `com.chinbiz.api.org`.
- 검증: 본부·센터 cascade(서울남부→강남구 등), UI 등록→리스트 반영, 중복확인, 회원 목록 소속 매핑 E2E 통과.
- User 엔티티에 `bank_name`/`account_number`/`account_holder` 컬럼 추가됨.

## 실행/검증
- admin: `cd admin && npm run dev`(3100). BE 9001 필요.
- 데모 로그인: `admin` / `sample1234!`.

## 남은 일
- **docs/04.txt C (내정보 수정)**: 상단 우측 업체명 클릭 → 전화/이메일/담당자/계좌/비번 변경.
- 대시보드/정산/민원/설정 실 BE 연동, OTP, RBAC 메뉴 분기, admin_audit_log. (상품 이미지 업로드·상품설명 WYSIWYG 완료)
- 대시보드/조직망/정산/민원/설정 실 BE 연동, 상품 이미지 파일 업로드(스토리지 고도화). (상품설명 WYSIWYG 에디터 완료)
- OTP 실제 2차 인증, RBAC 4담당자 실제 메뉴 권한 분기, admin_audit_log.
