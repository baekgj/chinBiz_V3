# 제작 note · 모듈 소스 위치 레지스트리

> 모든 admin 화면/메뉴는 **모듈화**하여 제작하고, 제작한 모듈의 소스 위치를 이 파일에 기록한다.
> (요구사항: 화면·메뉴 제작 시 모듈화 + 위치 기록)

## 공통 admin 규칙 (파트너/본부/센터/버즈(매니저) admin)
- 상단 메뉴 클릭 → **해당 메뉴 화면(실제 라우트)으로 이동** (대시보드 내 앵커 스크롤 아님).
- 상단 우측 **업체명(계정명) 클릭 → 내 정보 수정** 화면: 전화번호·이메일·담당자명·계좌정보(은행/계좌/예금주)·비밀번호 변경.
- 각 메뉴 = 별도 라우트 `page.tsx`(모듈), 화면 본문은 재사용 컴포넌트(모듈)로 분리.

---

## 공용 모듈 (admin 전역) — `admin/src/components`, `admin/src/lib`
| 모듈 | 위치 | 용도 |
|---|---|---|
| Icon | `components/Icon.tsx` | 인라인 SVG 아이콘 |
| ui (dark) | `components/ui.tsx` | Card/Badge/StatTile/krw (HQ 다크) |
| AuthGuard | `components/AuthGuard.tsx` | JWT/role 가드(/me 서버검증) |
| auth | `lib/auth.ts` | 토큰(getToken/쿠키)·ROLE_PATH·fetchMe |
| api | `lib/api.ts` | apiGet/apiPost/apiPut/apiUpload (JWT 자동첨부) |
| RichTextEditor | `components/RichTextEditor.tsx` | 상품설명 에디터: 서식 + **이미지 업로드(/api/uploads)** + **이미지 크기 조절**(클릭 선택→프리셋 25/50/75/100%·슬라이더·모서리 드래그, style.width로 영속). theme dark/light. ★에디터 클릭이 첫 툴바 버튼 onClick을 유발하는 현상은 `armed`(버튼 mousedown 선행) 가드로 차단. 본사/파트너 상품등록 공용. CSS `.rte-content` |

## 본사(MASTER) 모듈 — `admin/src/app/master`, `admin/src/components`
| 모듈 | 위치 |
|---|---|
| 셸(Sidebar/Topbar/nav) | `components/Sidebar.tsx`, `Topbar.tsx`, `nav.ts` |
| 대시보드 | `app/master/page.tsx` |
| 파트너사 관리 | `app/master/partners/{page,new,[id]}`, `components/master/PartnerForm.tsx` |
| 상품(카테고리/등록/리스트) | `app/master/products/{page,categories,new,[id]/edit}`, `components/master/ProductForm.tsx` |
| 조직망(등록/회원/트리) | `app/master/organization/{page,register,members,members/[id]}`, `components/master/OrgMemberForm.tsx` |
| 정산/민원/설정 | `app/master/{settlement,complaints,settings}/page.tsx` |

## 파트너(PARTNER) 모듈 — `admin/src/app/partner`, `admin/src/components/partner`
| 모듈 | 위치 | 메뉴/용도 |
|---|---|---|
| 라이트 셸 | `app/partner/layout.tsx` (AuthGuard[PARTNER]) | 공통 셸 |
| 상단바(라우트 메뉴) | `components/partner/PartnerTopbar.tsx` | 메뉴=라우트 이동, 업체명→/partner/profile |
| 공용 UI | `components/partner/PartnerUI.tsx` | Card/Stat/PageHead (라이트) |
| 정산/수당 현황 | `app/partner/page.tsx` + `components/partner/sections/BillingSection.tsx` | |
| 상품 관리(리스트+등록버튼) | `app/partner/products/page.tsx` + `sections/ProductsSection.tsx`(실데이터·우측상단 [+ 상품 등록]) | |
| 상품 등록/수정 | `app/partner/products/new/page.tsx`, `products/[id]/page.tsx` + `components/partner/ProductForm.tsx`(라이트, 본사 폼 참조) | 카테고리 대→중→소·7주체 수당·이미지 업로드 |
| 영업 현황(★실DB) | `app/partner/pipeline/page.tsx` + `sections/SalesSection.tsx` + `PartnerPipeline.tsx` + BE `partner/PartnerSalesController` | `/api/partner/sales` 내 상품 접수 영업 + 탭/요약 |
| 민원 센터 | `app/partner/voc/page.tsx` + `sections/VocSection.tsx` | |
| 직영 매니저 | `app/partner/managers/page.tsx` + `sections/ManagersSection.tsx` | |
| **내 정보 수정** | `app/partner/profile/page.tsx` + `components/partner/ProfileForm.tsx` | 업체명 클릭 진입 |

## 버즈/매니저(BUZZ·MANAGER) 모듈 — `admin/src/app/buzz`, `admin/src/components/buzz` (우선순위 4)
| 모듈 | 위치 | 메뉴/용도 |
|---|---|---|
| 셸 | `app/buzz/layout.tsx` (AuthGuard[BUZZ,MANAGER] + BuzzProvider + BuzzShell) | role별 테마 셸 |
| **테마 컨텍스트** | `components/buzz/theme.tsx` | LIGHT(버즈 그린/골드)·DARK(매니저 블랙/골드) 토큰 + `BuzzProvider`(/api/auth/me로 role 판별) + `useBuzz()` |
| 페이지 래퍼 | `components/buzz/BuzzShell.tsx` | 테마 적용 + Topbar + main |
| 상단바(라우트 메뉴) | `components/buzz/BuzzTopbar.tsx` | 메뉴=라우트, 계정명→/buzz/profile, 테마·role별 라벨 |
| 공용 UI | `components/buzz/BuzzUI.tsx` | Card/Stat/PageHead/GoldBadge (테마 소비) |
| 네트워크(회원관리) | `sections/NetworkSection.tsx` + `MemberForm.tsx` + `app/buzz/network/{new,[id]}` | 목록·검색·캘린더·페이징·등록/수정, 역할 BUZZ 고정·추천인 자동 |
| 상품 마켓 | `sections/MarketSection.tsx` + `ProductDetail.tsx` + `app/buzz/market/[id]` | 3x3·검색·페이징·상세(역할별 수당) |
| 영업 파이프라인 | `sections/PipelineSection.tsx` + `SaleForm.tsx` + `app/buzz/pipeline/{new,[id]}` | 목록·1차영업등록·영업상세 |
| 우편번호 검색 | `lib/postcode.ts` | 카카오(다음) 우편번호 공용 헬퍼 |
| 버즈 도메인 BE | `be `com.chinbiz.api.buzz`(BuzzMember/BuzzMarket/BuzzSales Controller, Sale) | `/api/buzz/**` BUZZ·MANAGER |
| 수당 현황(CP/MP) | `app/buzz/page.tsx` + `sections/WalletSection.tsx` | |
| 영업 파이프라인 | `app/buzz/pipeline/page.tsx` + `sections/PipelineSection.tsx` | 탭 필터 |
| 상품 마켓 | `app/buzz/market/page.tsx` + `sections/MarketSection.tsx` | 추천링크 복사 |
| 버즈 네트워크(친쿠) | `app/buzz/network/page.tsx` + `sections/NetworkSection.tsx` | |
| **내 정보 수정** | `app/buzz/profile/page.tsx` + `components/buzz/ProfileForm.tsx` | 계정명 클릭 진입 |

## 본부(DIVISION) 모듈 — `admin/src/app/division`, `admin/src/components/division`
| 모듈 | 위치 | 메뉴/용도 |
|---|---|---|
| 다크 퍼플 셸 | `app/division/layout.tsx` (AuthGuard[DIVISION_ADMIN]) | 딥 퍼플/차콜 |
| 테마 토큰+UI | `components/division/DivisionUI.tsx` | `dv` 토큰 + Card/Stat/PageHead |
| 상단바(라우트) | `components/division/DivisionTopbar.tsx` | 메뉴=라우트, 계정명→/division/profile |
| 종합 지갑 | `app/division/page.tsx` + `sections/WalletSection.tsx` | 배정요율 4%·CP/MP |
| 센터 모니터링 | `app/division/centers/page.tsx` + `sections/CentersSection.tsx` | |
| 리더보드/기여도 | `app/division/leaderboard/page.tsx` + `sections/LeaderboardSection.tsx` | |
| 내 정보 수정 | `app/division/profile/page.tsx` + `components/division/ProfileForm.tsx` | /api/user/me |

## 센터(CENTER) 모듈 — `admin/src/app/center`, `admin/src/components/center`
| 모듈 | 위치 | 메뉴/용도 |
|---|---|---|
| 골드/블랙 셸 | `app/center/layout.tsx` (AuthGuard[CENTER_ADMIN]) | 프리미엄 골드/블랙 |
| 테마 토큰+UI | `components/center/CenterUI.tsx` | `ct` 토큰 + Card/Stat/PageHead |
| 상단바(라우트) | `components/center/CenterTopbar.tsx` | 메뉴=라우트, 계정명→/center/profile |
| 센터 요약 | `app/center/page.tsx` + `sections/WalletSection.tsx` | CP/MP·소속/관리 명세·출금 |
| 소속 버즈 관리 | `app/center/buzz/page.tsx` + `sections/BuzzSection.tsx` | 상품별 버즈 매핑 |
| 소속 매니저 관리 | `app/center/managers/page.tsx` + `sections/ManagerSection.tsx` | 매핑 + 강제배정(Override) |
| 상품 및 교육 컨트롤 | `app/center/products/page.tsx` + `sections/ProductsSection.tsx` | 취급 ON/OFF·본사우회·교육/QR |
| 정산 원장 | `app/center/settlement/page.tsx` + `sections/SettlementSection.tsx` | Insert-only 전표 |
| 내 정보 수정 | `app/center/profile/page.tsx` + `components/center/ProfileForm.tsx` | /api/user/me |

> 우선순위 1~6 admin 전부 구축 완료. (역할 스텁 없음)

## BE 모듈 — `be/src/main/java/com/chinbiz/api`
| 모듈 | 위치 |
|---|---|
| 인증(JWT/필터/me) | `auth/{AuthController,JwtUtil,JwtAuthenticationFilter}` |
| 보안/시드/업로드/정적 | `config/{SecurityConfig,DataSeeder,GlobalExceptionHandler,WebConfig}`, `upload/UploadController` |
| 사용자 | `user/{User,UserRepository,Role}` |
| 파트너사(관리+본인) | `partner/{Partner,PartnerRepository,PartnerController,PartnerSelfController,dto/*}` |
| 카테고리/상품 | `category/*`, `product/*` |
| 조직(center_code/트리) | `org/{CenterCode,CenterCodeRepository,OrgController}` |

### 파트너 본인 API (PARTNER 전용, `/api/partner/**`)
- `GET/PUT /api/partner/me` — 담당자명·전화·이메일·계좌·비밀번호 수정.
- `GET /api/partner/categories` — 상품등록 카테고리 cascade용.
- `GET /api/partner/products`(본인 상품만) · `GET /{id}` · `POST` · `PUT /{id}` — partnerId를 로그인 계정으로 강제, 소유자 아닌 상품 404. (`partner/PartnerProductController`)
- 이미지 업로드 `/api/uploads` 는 MASTER_ADMIN+PARTNER 공통 허용(SecurityConfig).

### 사용자 본인 API (user 테이블 역할 공용, `/api/user/**` authenticated)
- `GET/PUT /api/user/me` — 이름·전화·이메일·주소·계좌·비밀번호 수정. (`user/UserSelfController`) BUZZ·MANAGER·DIVISION·CENTER·MASTER 공용. 파트너만 `/api/partner/me` 별도.

## 교육관리 (docs/05-1.txt) — 매니저 상품 교육 이수·승인 + 영업 우선할당
| 모듈 | 위치 | 용도 |
|---|---|---|
| BE 엔티티/리포 | `be edu/{Education,EducationRepository}` | education 테이블(상품·파트너·매니저·referral·이수/승인·일자·담당자) |
| BE 매니저 교육 | `be edu/BuzzEducationController` `/api/buzz/education`(목록·`/complete`) | 파트너상품별 이수/승인 + [교육완료] |
| BE 본사·센터 교육 | `be edu/EducationAdminController` `/api/education`(`/pending`·`/{id}/approve`·`/approved`) | 신청(완료·미승인)/승인 |
| BE 영업 배정 | `be buzz/BuzzSalesController`(역할별 목록 + `/{id}/assign`) | 매니저 풀·eduApproved·우선할당(교육승인 필수) |
| FE 매니저 교육 | `app/buzz/education` + `sections/EducationSection.tsx` | [교육완료] |
| FE 매니저 영업 | `sections/PipelineSection.tsx` + `components/buzz/AssignModal.tsx` | 교육필수/우선할당/영업권확보/기할당 + 배정 모달 |
| FE 본사 교육 | `app/master/education/{apply,approve}` + `components/EducationAdminPanel.tsx` + `master/eduCls.ts` | 신청/승인 소메뉴 |
| FE 센터 교육 | `app/center/education`(신청/승인 탭) + `EducationAdminPanel` | |
| sale.parent_id | `Sale.parentId` + `BuzzSalesController.centerParentId`(주소→CenterMatcher→CENTER_ADMIN user.id) | 1차영업 등록 시 저장 |
