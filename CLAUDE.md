# 친비즈(ChinBiz) V3 · 프로젝트 가이드 (CLAUDE.md)

> 이 문서는 `docs/20260709_chinbizV3.pdf`(46p) 기획서와 `docs/setting3.txt`, `.env`를 분석해
> 재구축(V3) 작업의 **핵심 정책 · 도메인 규칙 · 화면 구조**를 정리한 것이다.
> 코드 작성 전 반드시 이 문서의 규칙을 우선 준수한다.

---

## 0. 한 줄 정의

**친비즈**는 "대한민국 최초의 버즈마케팅 영업대행 ERP"다.
일반인(**버즈회원**)이 자기 네트워크로 상품을 1차 영업하고, 전문가(**관리매니저**)가 2차로 계약을
클로징하며, 그 성과를 **7단계 총수당 분배 매트릭스**로 투명하게 정산하는 오픈형 가맹 플랫폼이다.
슬로건: **"내 네트워크가 곧 비즈니스가 된다"**

---

## 0.5 개발 우선순위 (★ 작업 순서)

아래 순서대로 화면/기능을 구축한다.

1. **친비즈 홈페이지** (랜딩 + 로그인 + 회원가입) — `home/`, 포트 8001  ← 진행 중
2. **본사 admin** (HQ Master / `MASTER_ADMIN` + 4대 담당자 RBAC)
3. **파트너사 admin** (`PARTNER` · B2B Billing Hub)
4. **버즈 admin** (버즈회원 워크스페이스 · `BUZZ`)
5. **본부 admin** (`DIVISION_ADMIN`)
6. **센터 admin** (`CENTER_ADMIN`)

> 2~6번 admin은 FE(Next.js 3100) + BE(Spring Boot 9001, JWT) 스택으로 구축한다.
> 각 화면 상세는 9절(화면별 요약), 테마는 10절 참고.

---

## 0.6 역할별 문서 (★ admin 작업 시 필수 참조)

특정 admin(워크스페이스)을 작업할 때는 **해당 역할 문서를 먼저 열어** 현황·파일 구조·화면 스펙·남은 일을 확인하고,
작업 후 그 문서를 갱신한다. (공통 규칙·스택·DB·인증·역할 라우팅은 본 문서를 계속 유지)

| 작업 대상 | 참조/갱신 문서 | role |
|---|---|---|
| 본사 어드민 | [`CLAUDE_MASTER.md`](CLAUDE_MASTER.md) | `MASTER_ADMIN` |
| 파트너사 어드민 | [`CLAUDE_PARTNER.md`](CLAUDE_PARTNER.md) | `PARTNER` |
| 버즈회원·관리매니저 | [`CLAUDE_BUZZ.md`](CLAUDE_BUZZ.md) | `BUZZ`, `MANAGER` |
| 총괄본부 | [`CLAUDE_DIVISION.md`](CLAUDE_DIVISION.md) | `DIVISION_ADMIN` |
| 센터 | [`CLAUDE_CENTER.md`](CLAUDE_CENTER.md) | `CENTER_ADMIN` |

---

## 1. 기술 스택 / 전역 규칙 (★ 최우선 · 사용자 지정)

- **FE** : Next.js 16(App Router) + React 19 + TypeScript + Tailwind CSS 4
- **BE** : Spring Boot 3.5 + Spring Security(JWT) + Spring Data JPA + springdoc(Swagger)
- **DB** : MySQL 8.x (기존 `chin4` DB 재사용)
- **인증** : JWT Bearer 토큰(무상태). jjwt 0.12.6
- **포트** : BE **9001**, FE **3100**, HOME **8001** (이 PC에서 3000은 OS 예약 범위라 3100 사용)
- **개인정보** : 전 항목 **평문** 저장. 암호화 및 `encryption_key` 컬럼 제거(요구사항).
  - ⚠️ **예외(2026-07-10 변경)**: **비밀번호는 BCrypt 해시로 저장**(평문 금지). 로그인은 `PasswordEncoder.matches`로 검증.
- **금액/수당** : 정수(원 단위). RATE=bp(1%=100), FIXED=원.
- `.env` 주요값: DB `chin4_test`/`chin4`(localhost:3306), `CORS_ORIGINS=http://175.125.94.198:*,http://localhost:*`

### ⚠️ PDF와의 스택 충돌 (반드시 인지)
PDF 39~46p의 "Claude Code 프롬프트 모음집"은 **NestJS + PostgreSQL + Prisma ORM + Redis + Docker,
포트 4000/3000** 을 가정한다. **이는 채택하지 않는다.**
→ PDF의 그 부분은 *참고용*이며, **실제 스택은 위 1절(Spring Boot + MySQL + JPA)** 이 정답이다.
PDF에서 가져올 것은 **데이터 모델 · 비즈니스 로직 · 정산 규칙 · 화면 구조**이고, 구현 기술은 위 규칙을 따른다.
(Redis 분산 락 / 메시지 브로커 등은 개념만 참고하고, 우선 MySQL 트랜잭션·비관적 락으로 구현한다.)

---

## 2. 조직 계층 & 사용자 역할 (User.role)

플랫폼은 6개 역할의 계층 구조다. 위로 갈수록 상위 조직.

| 역할(Role enum) | 한글 | 설명 |
|---|---|---|
| `BUZZ` | 버즈회원(일반회원) | 자기 네트워크로 **1차 영업**(고객 DB 접수, 링크 전달). 진입장벽 낮음 |
| `MANAGER` | 관리매니저 | 1차 DB를 배정받아 **2차 영업**(상담·방문·계약·설치) 클로징. 전문가 트랙 |
| `CENTER_ADMIN` | 센터(장) | 하부 버즈·매니저를 거느린 **플랫폼 허브**. 교육·상품공급·인프라 배정 총괄 |
| `DIVISION_ADMIN` | 본부(장) | 센터들을 권역별로 묶은 상위 조직(프랜차이즈형 확장) |
| `PARTNER` | 파트너사(공급사/제조사) | 상품을 위탁 공급하고 총수당(위탁비)을 지급하는 B2B 주체 |
| `MASTER_ADMIN` | 본사 마스터 어드민(HQ) | 전체 총괄. 실무는 4대 담당자로 분리(아래 8절 RBAC) |

- **CP / MP** (버즈·매니저·센터·본부·본사 지갑에 공통 적용되는 정산 상태 개념):
  - **CP(Cooperate Partner) 예정수당**: 내가 진행 중( 접수~배송/설치 )인 영업의 **예상 인센티브**. 아직 미확정.
  - **MP(Managing Partner) 확정수당**: **구매확정**되어 정산 완료된, **즉시 출금 가능**한 금액.
- **친쿠(Chinku) = 추천인**: 나를 추천 링크로 가입시킨 상위 버즈. 추천인은 하위 버즈 수익의 **약 10%**를
  MP 확정수당으로 **평생 적립**받는다. (추천 링크 예: `https://chinbiz.com/join?ref=buzz_hong123`)

---

## 3. ★핵심★ 7단계 총수당 분배 매트릭스

파트너사가 상품별로 책정한 **총수당(위탁비, `total_allowance`)** 을 7주체에게 쪼갠다.
합계는 **반드시 정확히 100%**. (본사 어드민 상품관리의 "총수당 분배 시뮬레이터"에서 검증 후 저장)

예시 상품: 깔끔돌이 돌솥 세척기 (판매가 ₩3,500,000, 파트너 위탁 총수당 ₩600,000 = 100%)

| # | 분배 대상 | 비율 | 예시 금액 | 정산 방식(공로) |
|---|---|---|---|---|
| 1 | 1차 영업 **버즈회원**(BUZZ) | **45%** | ₩270,000 | 영업 완료 시 MP 확정 |
| 2 | 상위 **추천회원(친쿠)** | **5%** | ₩30,000 | 버즈 수당의 일부(≈10%) |
| 3 | 2차 영업 **관리매니저**(MANAGER) | **25%** | ₩150,000 | 설치/검수 완료 시 확정 |
| 4 | **소속센터**(버즈 소속) | **7%** | ₩42,000 | 버즈회원 관리·영업 인프라 공로 |
| 5 | **관리센터**(매니저 소속) | **8%** | ₩48,000 | 매니저/현장 관리·운영 인프라 공로 |
| 6 | 총괄 상위 **본부**(DIVISION) | **4%** | ₩24,000 | 본부 인프라 지원비 |
| 7 | **친비즈 본사**(HQ 순수익) | **6%** | ₩36,000 | 플랫폼 매칭 수수료 |
| | **합계** | **100%** | ₩600,000 | 매트릭스 검증 완료 |

- **소속센터 ≠ 관리센터**: 버즈가 속한 센터(소속)와 매니저가 속한 센터(관리)는 **다를 수 있다.**
  → 정산 원장은 `소속센터ID`와 `관리센터ID`를 **각각** 저장해야 조율이 자동화된다.
  → 마찬가지로 본부도 `소속본부(sales_division_id)`와 `관리본부(mgmt_division_id)`로 이원 라우팅한다.
- 위 비율(%)은 상품마다 파트너사가 다르게 설정 가능. 위 값은 대표 예시일 뿐 하드코딩 금지.

---

## 4. ★핵심★ 정산 원장(Ledger) 무결성 원칙

**"한 번 기록된 돈의 흐름은 절대 Delete/Update 하지 않는다."**

- 취소/반품이 발생하면 데이터를 지우지 말고, **반대 성격(-)의 전표를 Insert** 하여 SUM이 0이 되게 만든다.
- 두 가지 원장 모델이 병행 설계된다:
  1. **append-only 원장** (`manager_settlement_ledger` 등): 컬럼 = 전표ID(PK), 계약ID, 주체ID,
     계정과목(CP/MP), 금액(+/−), 전표구분, 발생사유, 등록일시. **Insert-Only.**
  2. **거래 단위 와이드 원장** (`settlement_ledger`): 거래ID별로 7주체의 계정ID·배정금액·비율을
     **단일 Row(비정규화)** 로 저장 → 역정산 시 에러 방지, 실시간 SUM/조율 자동화.

### settlement_ledger 상태값(enum)
- `CP_READY` (예정수당) — 계약완료 시
- `MP_CONFIRMED` (확정수당) — 구매확정/설치완료 시 (파트너 예치금에서 총수당 차감)
- `SETTLEMENT_FREEZE` (민원 동결) — 민원 접수 시 재무 승인 전까지 출금 잠금
- `ROLLBACK_CANCEL` (취소/역정산) — 취소/반품 시

### 역정산(Rollback) 아키텍처 (취소/반품 시)
1. 상태값 변경: 고객 '취소/반품', 계약 `TERMINATED`
2. **CP 예정수당 롤백**: CP 테이블에 (−)전표 즉시 Insert (매니저 CP + 추천인 10% CP 동시 차감)
3. **패널티/비용 정산 (파트너사 정책 검증)**:
   - 매니저 귀책 없음 → 파트너사가 출장/설치비 보전 → 매니저 MP에 (+) 반영
   - 매니저 귀책 있음 → 철거 비용 매니저 부담 → MP에 (−) 패널티
4. 실시간 동기화: 모든 대시보드 자산 현황판 즉시 갱신
   - 예: "[배송/설치] 단계였던 건이 취소/반품 → CP 예정수당 ₩450,000 차감, 파트너 보전 출장비
     ₩50,000이 MP 확정수당으로 지급"

---

## 5. 영업 파이프라인 상태값 (Status Tracker)

상위 탭: **전체 / 교육중 / 영업중 / 영업종료**

1차 영업(버즈) 단계:
`접수 → 상담/방문 → 계약체결 → 배송/설치 → 구매확정(완료) / 취소·반품(경고)`

2차 영업(매니저)은 앞에 **배정** 단계가 추가됨:
`배정 → 상담/방문 → 계약체결 → 배송/설치 → 구매확정 → 취소/반품`
- 배정 건은 **24시간 내 미수락 시 자동 회수**.

`customer_allocation` 배정 상태: `PENDING → ASSIGNED`

---

## 6. 지역기반 선착순 배정 (Location-Based FCFS Dispatcher)

무분별한 선착순은 현장 대응력을 떨어뜨리므로 **"지역 필터링(1차) → 푸시 알림 및 선착순 수락(2차)"** 구조.

1. **DB 등록**: 버즈회원이 고객 정보(예: 서울시 중구 명동) 등록
2. **지역 매칭 & Queue ID 발급**: 고객 주소코드로 해당 지역 매니저 풀(Pool) 추출
3. **타겟 푸시**: 해당 지역 매니저들에게 동시 알림 → [배정 대기] 목록 노출
4. **선착순 수락(FCFS)**: 가장 먼저 [업무 수락] 누른 매니저에게 소유권 이전, 타 매니저 화면에선 실시간 제거

### 동시성 제어 (Race Condition 방지) — MySQL 구현
```sql
-- 매니저가 수락 버튼을 눌렀을 때 실행되는 쿼리 (status가 PENDING일 때만 성공 → 영향 Row 1이어야 성공)
UPDATE customer_allocation
   SET manager_id = :managerId, status = 'ASSIGNED', allocated_at = NOW()
 WHERE allocation_id = :allocationId
   AND status = 'PENDING';
```
- PDF는 Redis 분산 락을 권장하나, **본 프로젝트는 위 조건부 UPDATE + 비관적 락(`SELECT ... FOR UPDATE`)** 으로
  MySQL 내에서 먼저 구현한다.
- **강제 배정(Override)**: 장시간 미수락 방치 DB는 센터/본사 마스터가 특정 매니저에게 수동 배정 가능.

---

## 7. 센터 기피 상품 우회(Bypass) 라우팅

대원칙: **"센터의 관심 여부와 무관하게 버즈·매니저의 1·2차 영업은 중단 없이 실행되어야 한다."**

- 센터 마스터 화면에 **상품별 취급 ON/OFF 토글**(`Center_Product.is_active`).
- 센터가 OFF(관심없음)로 둔 상품은 버즈 화면에 `[본사 직할/연합 지원 상품]` 배지로 노출.
- **해결책 1 (버즈)**: 교육 가이드는 본사 표준 LMS(`HQ_ACADEMY`)로 우회 매칭. 정산 시 원래 소속센터
  배정 수당은 본사(`HQ_MAIN`) 또는 우회 지원 센터로 **자동 롤오버(Rollover)**. (일 안 한 센터엔 수당 미배정)
- **해결책 2 (매니저)**: 소속센터 무관, '고객 위치 + 기술 자격'만으로 매칭하는 **광역 매니저 풀** 가동.
  센터 관리 수당은 실제 인프라 지원 주체(파트너사 전담팀/본사)로 이관. **매니저 본인 MP는 100% 보장.**
- **라우팅 룩업 테이블** `sales_routing_rule`: (상품ID, 센터ID, 센터취급상태, 1차교육주체, 2차관리주체, 센터수당수취ID)

---

## 8. 본사 어드민 RBAC · 보안

전체 총괄 `MASTER_ADMIN` + 업무/보안 분리를 위한 **4대 담당자 계정**:

| 담당자 | 역할 | 접근 권한 |
|---|---|---|
| A (`ROLE_MD`) | 상품·영업 관리자 (MD/파트너십) | 파트너사 관리, 상품 관리 |
| B (`ROLE_OP`) | 조직망 운영 관리자 (Operation/HR) | 본부·센터·매니저·버즈회원 관리 |
| C (`ROLE_FIN`) | 정산·재무 관리자 (Finance) | 수당관리, 파트너 예치금 (**민감 데이터 → OTP 2차 인증 필수**) |
| D (`ROLE_CS`) | CS·민원 관리자 | 민원관리, 계약 상태 강제 조정(Settlement Freeze) |

- **RBAC**: 메뉴 접근 권한 세분화. 개인정보(전화번호/계좌번호)는 **마스킹(`*`)** 처리 + 다운로드 로깅.
- **Audit Log**: 모든 행위를 `admin_audit_log`에 **Insert-Only** 로 영구 기록(누가·언제·무엇을 조회/수정).
- **EDA(권장)**: 상태 변경은 실시간 전파. PDF는 Kafka/RabbitMQ를 권장하나, 본 프로젝트는 우선 트랜잭션 기반
  동기 처리로 구현하고 필요 시 확장한다.
- **정산 에스크로**: 계약체결 진입 시 파트너 예치금에서 수당 총액을 지급 보류 락, 구매확정 시 즉시 출금.
- **민원-정산 결합 트리거**: 민원 접수 시 해당 계약ID를 `SETTLEMENT_FREEZE`로 전환해 출금 차단.

본사 LNB 메뉴: 대시보드 / 파트너사 관리 / 상품 관리 / 조직망 관리 / 수당·정산 관리 / 민원 관리 센터 / 시스템 설정
본사 KPI 예시: GMV ₩2,450,000,000 · 순수익 ₩184,000,000 · 파트너사 42 · 활성상품 128종 · 본부 5 · 센터 24 · 매니저 350 · 버즈회원 12,400

---

## 9. 화면(대시보드)별 요약

| 로그인 주체 | 워크스페이스명 | 핵심 화면 |
|---|---|---|
| 홈페이지(비로그인) | — | 랜딩(하단 12절) |
| 버즈회원 | 버즈 워크스페이스 | 실시간 수당 현황판(CP/MP) · 나의 1차 영업 파이프라인 · 상품 마켓 · 버즈 네트워크(추천) · 관리매니저 승급 배너 |
| 관리매니저 | 관리매니저 전용 | 정산·자산 현황판(설치형/일반형) · 2차 관리영업 파이프라인 · 관리 마켓(제안서/배정신청) · 오늘의 업무 캘린더·공급사 긴급공지 |
| 센터 | 센추럴 마스터 오피스 | 센터 종합 지갑 · 소속 버즈/매니저 모니터링 · 상품 취급 ON/OFF · 버즈/매니저 교육(LMS) 컨트롤 · 강제배정 |
| 본부 | 총괄본부 마스터 오피스 | 본부 종합 지갑(배정요율 예 4%) · 센터별 1차/2차 모니터링 · 센터 리더보드 · 기여도 분석 |
| 파트너사 | 파트너 마스터 오피스 | B2B Billing Hub(예치금·가상계좌) · 상품/총수당 관리 · 실시간 영업 파이프라인 · VOC 센터 · 직영 매니저 유지보수비 빌링 |
| 본사 어드민 | HQ Master | KPI 스코어카드 · 파트너사 심사 · 상품/7단계 분배 매트릭스 · 조직망 트리 · 정산 원장 · 민원(Freeze) · 시스템설정 |

---

## 10. 디자인 시스템 (역할별 테마 — PDF 시안 기준)

- **홈페이지 & 버즈회원**: 딥 포레스트 그린(#1b4332 계열) + **골드/앰버**(#d9a441 계열) 액센트.
  버즈 대시보드는 라이트 배경 + 그린/골드 포인트.
- **관리매니저**: 다크 모드(블랙/차콜) + 골드 — "일반회원 모드와 시각적으로 확연히 다른 다크 모드".
- **센터**: 프리미엄 골드/블랙.
- **본부**: 딥 퍼플 / 차콜 메탈릭.
- **파트너사**: B2B 스카이블루 / 그레이 (라이트).
- **본사 어드민**: 다크 네이비 + 블루·청록 그라디언트.
- 한글 폰트: Pretendard 계열(또는 Noto Sans KR), 두꺼운 굵기의 헤드라인.

> 현재 `home/` 폴더(HOME:8001)에 랜딩 초안이 있으나 초기엔 인디고/블루로 잘못 시작함.
> **정식 테마는 위의 그린+골드**로 맞춰야 한다.

---

## 11. 홈페이지(랜딩) 콘텐츠 스펙 — `home/` (포트 8001)

- **GNB**: 로고 친비즈 CHINBIZ · [친비즈 소개 | 상품 둘러보기 | 업무 프로세스 | 공지사항] · [로그인] · **[버즈회원 회원가입(무료)]**(강조) · [파트너사 입점문의]
- **Hero**: "KOREA'S FIRST BUZZ MARKETING SOLUTION" / **"내 네트워크가 곧 비즈니스가 된다"** /
  "대한민국 최초의 버즈마케팅 영업대행 솔루션, 친비즈. 손쉬운 1차 영업 파트너십으로 준비된 우수 비즈니스
  상품을 연결하고 함께 성장하세요." · CTA [지금 바로 버즈회원 시작하기] [영업 가능 상품 보러가기]
- **Live Activity Board**: "서울시 서초구 회원님이 [A사 디지털 솔루션] 1차 영업을 개시했습니다.(방금 전)" 등 실시간 롤링
- **실시간 성과 카운터**: 누적 영업 매칭 **12,847건** · 활성 버즈회원 **3,256명** · 이번 달 신규 매칭 **487건**
- **핵심 서비스 역량(SERVICE MATRIX)**: 01 상품 큐레이션 · 02 영업 자동화 · 03 파트너십 매칭 · 04 투명한 정산
- **대표 상품 그리드**: A사 디지털솔루션(기업용 클라우드 ERP·인기), B사 외식프랜차이즈(신규), C사 헬스케어(추천),
  D사 교육솔루션. **🔒 Guardrail: 정확한 공급 단가·마진율·버즈 수당은 로그인 후 확인**(비로그인 노출 금지)
- **이용 방법 3단계**: [Pick] 상품 파악하기 · [Connect] 1차 영업 진행 · [Earn] 매칭 및 정산
- **업무 프로세스 5단계**: 가입/로그인 → 상품 셀렉션 → 1차 영업 실행 → 파트너사 본영업 → 실시간 정산
- **Sales Toolkit 미리보기**: 카카오톡 공유 문구 템플릿 / 상품 제안서 PDF 다운로드 / 개인 전용 영업 추천 링크
  → 비로그인 시 **블러(Blur) + "로그인 후 확인 가능 / 무료 회원가입"**
- **파트너사 온보딩**: "제품은 좋은데 판로가 고민이신가요?" · 3,256+ 활성 버즈회원 / 100% 성과 기반 정산 / Zero 초기 마케팅 비용 · CTA [파트너사 입점 및 제안하기]
- **Footer**: 사업자등록번호 **822-81-00277** · 고객센터 **02-6412-0505** · 대표 최경호 · 통신판매업신고번호 · 이용약관/개인정보처리방침 · **Copyright © ChinBiz. All Rights Reserved.**
  (기획서상 법인명은 "혼마(주)/훈마(주)"로 표기되나 플레이스홀더로 추정 — 확정 시 반영)

### 로그인/회원가입
- **로그인**: 이메일/비밀번호 → JWT 발급(BE 9001). 회원가입 링크.
- **회원가입**: 버즈회원(무료) 가입 중심. 필드 예) 이름·이메일·휴대폰·비밀번호·추천인 코드(ref)·약관동의.
  (파트너사 입점은 별도 문의 플로우)

---

## 12. 개발 시 주의 (Do / Don't)

- ✅ 금액은 정수(원). 비율은 상품별 설정값을 읽어서 계산(하드코딩 금지). 분배 합계 100% 검증 필수.
- ✅ 정산 데이터는 **Insert-only** 원칙. 취소는 (−)전표로 상쇄.
- ✅ 소속센터/관리센터, 소속본부/관리본부를 **분리** 저장.
- ✅ 개인정보 평문 저장(요구사항)이나 어드민 화면 노출 시 마스킹 + 감사 로그.
- ✅ 포트: BE 9001 / FE 3100 / HOME 8001. CORS는 host 뒤 `:*` 와일드카드 유지.
- ❌ PDF의 NestJS/Prisma/PostgreSQL/Redis/Docker/포트 4000·3000 설정을 그대로 채택하지 말 것(참고용).
- ❌ 비로그인 홈에서 단가·수당 정보 노출 금지(Guardrail).

---

## 13. 구현 현황 (진행 로그, 2026-07-10)

### 폴더 구조
- `home/` — 홈페이지(Next.js 16, 포트 8001). 랜딩 + `/login` + `/signup` 완료(그린+골드 테마).
- `admin/` — **본사 어드민(HQ Master, Next.js 16, 포트 3100)**. 다크 네이비+블루/청록 테마.
- `be/` — 인증 백엔드(Spring Boot **3.5.16**, Maven Wrapper `mvnw`, 포트 9001). Java 17.
- `db/init_chin4.sql` — chin4 DB/계정 초기화 스크립트.
- `db/schema_chin4.sql` — 전체 스키마 스냅샷(문서/신규 배포용).
- `db/migration_new_fields.sql` — **신규 필드/테이블 멱등 마이그레이션(서버 적용용, 재실행 안전)**.
  ⚠ **DB 필드 추가 시 규칙**: 신규 컬럼/테이블이 생기면 (1) `db/migration_new_fields.sql`에 반영하고
  (2) 서버 적용 ALTER 쿼리를 `docs/제작note.txt`의 "[DB 마이그레이션]" 섹션에 누적 기재한다.

### 역할별 admin 라우팅 (홈 로그인 → role별 이동)
홈(`home` 8001) 로그인 성공 시 `user.role`에 따라 admin(`admin` 3100)의 경로로 리다이렉트한다.
(`home/src/app/login`의 `ROLE_PATH`, `NEXT_PUBLIC_ADMIN_URL`)

| role | 이동 경로 |
|---|---|
| `MASTER_ADMIN` | `/master` (본사 어드민 — 구축 완료) |
| `PARTNER` | `/partner` (파트너사 어드민 — 구축 완료) |
| `BUZZ`, `MANAGER` | `/buzz` (우선순위 4 — 워크스페이스 구축, role별 테마 버즈 라이트/매니저 다크 완료, 도메인 BE 남음) |
| `DIVISION_ADMIN` | `/division` (우선순위 5 — 구축 완료: 딥 퍼플 셸 + 종합지갑/센터모니터링/리더보드·기여도 + 내정보 수정. 도메인 BE mock) |
| `CENTER_ADMIN` | `/center` (우선순위 6 — 구축 완료: 골드/블랙 셸 + 센터요약/소속버즈/소속매니저(강제배정)/상품·교육 컨트롤(취급 ON·OFF)/정산 원장 + 내정보. 도메인 BE mock) |

- `admin/src/app/` 구조: `master/`(셸+7메뉴 페이지), `partner|buzz|division|center/`(스텁), `page.tsx`(역할 런처).
- 검증: admin→`/master`, buzztester(BUZZ)→`/buzz` 리다이렉트 실증. 12개 라우트 200·에러 0.

### admin 인증 가드 (JWT/role)
- **크로스 오리진 토큰 핸드오프**: home(8001)과 admin(3100)은 오리진이 달라 localStorage 미공유 → 로그인 시 토큰을 **쿠키**(`chinbiz_token`, `localhost` 도메인은 포트 무관 공유)에 저장해 admin이 읽는다.
- **BE**: `JwtAuthenticationFilter`(Bearer 파싱→SecurityContext), `GET /api/auth/me`(토큰 검증+사용자 반환). `/login`·`/signup`·`/check-id`·`/error`만 permitAll, 그 외 인증 필요.
- **admin**: `AuthGuard`(`components/AuthGuard.tsx`)가 마운트 시 쿠키 토큰으로 `/me` 호출 → (토큰 없음/무효)면 home 로그인으로, (role 불일치)면 본인 `ROLE_PATH`로 리다이렉트. `master/layout` 및 각 역할 스텁을 감쌈. Topbar 로그아웃=쿠키 삭제+로그인 이동.
- 검증: 무토큰→로그인 리다이렉트 / MASTER_ADMIN→/master 렌더 / BUZZ 토큰으로 /master 접근→차단 후 /buzz 이동 (모두 실증).

### 파트너사 어드민 (admin/partner, 포트 3100) — 우선순위 3 완료
- 테마: **B2B 스카이블루/그레이 라이트**(HQ 다크 네이비와 구분). `partner/layout.tsx`(AuthGuard[PARTNER]+라이트 셸), `PartnerTopbar`.
- 섹션(PDF p.29-32): ①B2B Billing Hub(CP 지급예정/MP 확정 + 예치금 계좌·가상계좌·충전/자동차감) ②위탁 상품·총수당 관리 ③실시간 영업 파이프라인(탭 필터, `PartnerPipeline`) ④VOC 센터 ⑤직영 매니저 유지보수비 빌링.
- 현재 mock 데이터. 검증: PARTNER 토큰→렌더 / MASTER_ADMIN 토큰→/master로 차단, 라우트 200·에러 0.

### 본사 어드민 (admin/master, 포트 3100) — 우선순위 2 완료
- LNB 7메뉴 + 상단바(최고운영자 HQ Master) 셸. `master/layout.tsx` + `/master/*` 페이지.
- **대시보드**: GMV/순수익 그라디언트 KPI + 플랫폼 가동 현황(파트너42/상품128/본부5/센터24/매니저350/버즈12,400) + 처리대기/실시간 피드.
- **상품 관리**: ★7단계 총수당 분배 매트릭스 시뮬레이터★ — 총수당 입력→7주체 %·금액 실시간 계산, 합계 100% 검증(초록/빨강), 저장 버튼 활성/비활성. (검증 완료)
- **파트너사 관리**: 입점 심사/계정/빌링 테이블. **조직망**: 본부·센터 트리 + 지역 선착순 강제배정. **수당·정산**: OTP 게이트→CP/MP 원장(역정산 예시)·출금승인. **민원**: VOC + Settlement Freeze 토글. **시스템설정**: RBAC 4담당자 + 배정 알고리즘 토글.
- ⚠️ 현재 **mock 데이터**, BE 미연동. OTP/RBAC는 시각적 데모. 실연동은 우선순위 진행 시 추가.
- 실행: `cd admin && npm run dev` (포트 3100).

### DB
- MySQL 8.0 (서비스 `MySQL80`). `chin4` DB + `chin4_test`/`1234` 계정 생성 완료(utf8mb4).
- JPA `ddl-auto=update` 로 `user` 테이블 자동 생성. 데모 계정(`be` `DataSeeder` 자동 생성): `buzztester`/`pass1234`(BUZZ), **`admin`/`sample1234!`(MASTER_ADMIN)**, **`division`/`sample1234!`(DIVISION_ADMIN)**, **`center`/`sample1234!`(CENTER_ADMIN)** → **user 테이블**. **`partner`/`sample1234!`(파트너사 삼화정공사)** → **partner 테이블**(2026-07-11 일원화. 과거 user 테이블에 있던 PARTNER 계정은 기동 시 삭제·이전). ⚠️ **파트너 계정은 항상 `partner` 테이블만 사용**(본사 admin 등록/수정 `PartnerController` = 파트너 본인수정 `PartnerSelfController` = 동일 `partner` 테이블).
- `user` 주요 컬럼: user_id(unique), password(**BCrypt**), name/email/phone, zipcode/address/address_detail, referral_code, **sales_center_id(소속센터ID)**, role, agree_marketing, created_at.

### 회원가입 공통 검증 (★모든 등록 지점)
- **아이디**: 영문/숫자만 4~20자. **비밀번호**: 최소 **10자** 이상. BE `common/AccountValidation` 로 강제.
- 적용: 홈 signup(`SignupRequest` DTO), 버즈/매니저(`BuzzMemberController`), 파트너(`PartnerController`), 본부/센터(`OrgController`). FE 각 폼(회원등록·파트너등록·조직등록·signup)도 동일 클라이언트 검증.
- 검증(2026-07-12): 특수문자/한글 아이디·10자 미만 비번 → 400, 영숫자+10자 → 201.

### 인증 API (be/, `com.chinbiz.api`)
- `GET  /api/auth/check-id?userId=` — 아이디 중복확인 `{available}`
- `POST /api/auth/signup` — 버즈회원 가입(role=BUZZ). 비밀번호 **BCrypt 해시** 저장. **소속센터 자동매칭**: salesCenterId 미지정 시 주소로 `center_code` 매칭(아래). 성공 201.

#### ★ 주소 → 소속센터 자동 매칭 (`org/CenterMatcher`)
- 버즈/매니저 **신규 등록 시** 주소에서 시/구/군/동을 추출해 `center_code`의 `match_key`(시)+`search_key`/`center_name`(구·동)으로 `idx`를 찾아 **user.sales_center_id**에 저장.
- 규칙: match_key=시(광역/특별시는 접두어+"시"로 정규화) → 구는 search_key 포함/center_name 일치, 동은 search_key(콤마목록) 포함, 시 자체 최소단위(광명시/가평군)는 center_name==match_key.
- 적용 지점: `AuthController.signup`(홈), `BuzzMemberController.create`(버즈/매니저 admin 회원등록). 검증(2026-07-12): 강남구→21, 수원 권선구→52, 부천 소사본동→49, 광명시→46, 가평군→78, 마포구→37, 인천 미추홀구→100.
- `POST /api/auth/login` — 로그인 → JWT(HS512, jjwt 0.12.6) 발급. **user 테이블 우선, 없으면 partner 테이블 조회**(partner 계정은 role=PARTNER, name=상호명). `/api/auth/me`도 동일하게 양쪽 조회.
- `SecurityConfig`: JWT 무상태, `/api/auth/**`·`/error` permitAll, CSRF off, CORS(`app.cors.allowed-origin-patterns`).
- `GlobalExceptionHandler`: 검증 실패를 **400 JSON**으로 반환.
  ⚠️ 교훈: `/error`를 permitAll 하지 않으면 검증 실패가 `/error` 포워딩→보안필터에서 **403으로 오인**됨. 새 컨트롤러 추가 시 주의.

### 파트너사 관리 CRUD (be `com.chinbiz.api.partner` + admin `/master/partners`)
- **`partner` 테이블**(user와 별개): partner_id(unique)·password(BCrypt)·company_name·business_number·ceo_name·company_phone·zipcode/address/address_detail·manager_name/phone·email·bank_name/account_number/account_holder·created_at/updated_at.
- API(**MASTER_ADMIN 전용**, `/api/partners/**` `hasRole`): `GET`(페이징 page/size)·`POST`(등록)·`GET /{id}`·`PUT /{id}`(비번 비우면 유지)·`GET /check-id?loginId=`(**user+partner 양쪽 중복검사**).
- admin 화면: `/master/partners`(리스트+등록버튼+페이징+상호명 클릭), `/master/partners/new`(등록), `/master/partners/[id]`(수정). 폼=14필드+다음 우편번호+중복확인. `admin/src/lib/api.ts`가 JWT Bearer 자동 첨부.
- 검증: 등록→리스트→페이징(12건 2p)→수정(상호명·비번 변경)→중복확인(user `admin`/partner `sinhwa`→불가) E2E 통과. 비인증 403.
- ⚠️ BE JWT 인증 필터(`JwtAuthenticationFilter`) + `GET /api/auth/me` 추가됨(admin AuthGuard가 서버 검증에 사용).

### FE 연동
- `home/.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:9001`
- `home/src/lib/api.ts`: `apiGet/apiPost`, `TOKEN_KEY='chinbiz_token'`.
- `/signup` 중복확인·가입, `/login` 로그인이 실제 API 호출. 로그인 성공 시 토큰을 localStorage/sessionStorage 저장.
- 검증 완료: 중복확인·가입(201)·로그인(200, JWT)·오답(401)·검증실패(400) E2E 통과, 한글 저장 정상.

### 실행 방법
- BE: `cd be && mvnw.cmd -DskipTests spring-boot:run` (포트 9001)
- FE(HOME): `cd home && npm run dev` (포트 8001)
- DB 재초기화 필요 시: `mysql -u root -p < db\init_chin4.sql`

### 남은 일 / 다음 단계
- 우선순위 4(버즈/매니저 워크스페이스) 1차 구축 완료: `/buzz` 그린+골드 셸 + 라우트 메뉴(수당현황·파이프라인·마켓·네트워크) + **내 정보 수정 실연동**(`user/UserSelfController` `GET/PUT /api/user/me`, user 테이블 역할 공용). **role별 테마 자동 전환**(버즈=그린/골드 라이트, 매니저=블랙/골드 다크 + 매니저 메뉴 라벨·파이프라인 배정 단계). 테마 컨텍스트 `components/buzz/theme.tsx`. 상세는 [`CLAUDE_BUZZ.md`](CLAUDE_BUZZ.md). 남은 일: 도메인 BE(파이프라인/CP·MP 원장/FCFS 배정) 실연동(현재 mock).
- 우선순위 2(본사 admin)부터 FE(3100)+BE(9001) 스택으로 확장 예정.
