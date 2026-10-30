-- =====================================================================
--  친비즈(ChinBiz) V3 · 신규 필드/테이블 마이그레이션
--  용도: 기존(구버전) 서버 DB(chin4)에 그동안 추가된 컬럼·테이블을 반영.
--  실행: mysql -u root -p chin4 < db\migration_new_fields.sql
--  특징: 멱등(idempotent) — 이미 있는 컬럼/테이블은 건너뜀(재실행 안전).
--        (BE ddl-auto=update 로도 자동 반영되나, 수동 적용/문서화용)
--  기준일: 2026-07-24
-- =====================================================================

SET NAMES utf8mb4;

-- ── 없는 컬럼만 추가하는 헬퍼 프로시저 ────────────────────────────────
DROP PROCEDURE IF EXISTS chinbiz_add_col;
DELIMITER $$
CREATE PROCEDURE chinbiz_add_col(IN p_tbl VARCHAR(64), IN p_col VARCHAR(64), IN p_ddl TEXT)
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_tbl AND COLUMN_NAME = p_col) = 0 THEN
    SET @sql = CONCAT('ALTER TABLE `', p_tbl, '` ADD COLUMN ', p_ddl);
    PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
DELIMITER ;

-- ── [신규 테이블] 수당 원장 (7주체 정산) ─────────────────────────────
CREATE TABLE IF NOT EXISTS `allowance` (
  `member_id` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `member_type` enum('BUZZ','BUZZ_CENTER','DIVISION','HQ','MANAGER','MANAGER_CENTER','MASTER','TOPBUZZ') COLLATE utf8mb4_unicode_ci NOT NULL,
  `order_no` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('CANCEL','CANCEL_FEE','ORDER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_holder` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_number` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `amount` bigint DEFAULT NULL,
  `bank_name` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `confirm_date` date DEFAULT NULL,
  `contract_date` date DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `handler_id` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `paid` bit(1) NOT NULL DEFAULT b'0',
  `paid_date` date DEFAULT NULL,
  `partner_id` bigint DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  `seq` bigint NOT NULL AUTO_INCREMENT,
  `status` enum('CP','MP') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`member_id`,`member_type`,`order_no`,`type`),
  UNIQUE KEY `seq` (`seq`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── [신규 테이블] 파트너 입점 상담신청 (home → 본사 상담신청) ────────
CREATE TABLE IF NOT EXISTS `partner_inquiry` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `company_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contact_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stage` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── [product] 계약종료일 / 설치상품 / 키워드 배지(인기·추천) ─────────
CALL chinbiz_add_col('product','contract_end_date',"`contract_end_date` date DEFAULT NULL");
CALL chinbiz_add_col('product','install_product',  "`install_product` bit(1) NOT NULL DEFAULT b'0'");
CALL chinbiz_add_col('product','kw_popular',       "`kw_popular` bit(1) NOT NULL DEFAULT b'0'");
CALL chinbiz_add_col('product','kw_recommended',   "`kw_recommended` bit(1) NOT NULL DEFAULT b'0'");

-- ── [sale] 주문번호 / 소속센터 대표 / 매니저배정일시 / 고객지역센터 ──
CALL chinbiz_add_col('sale','order_no',           "`order_no` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
CALL chinbiz_add_col('sale','parent_id',          "`parent_id` bigint DEFAULT NULL");
CALL chinbiz_add_col('sale','manager_dated_at',   "`manager_dated_at` datetime(6) DEFAULT NULL");
CALL chinbiz_add_col('sale','customer_center_id', "`customer_center_id` bigint DEFAULT NULL");

-- ── [user] 소속센터 / 계좌 / 상태 / 매니저 승급 관련 ────────────────
CALL chinbiz_add_col('user','sales_center_id',   "`sales_center_id` bigint DEFAULT NULL");
CALL chinbiz_add_col('user','account_holder',    "`account_holder` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
CALL chinbiz_add_col('user','account_number',    "`account_number` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
CALL chinbiz_add_col('user','bank_name',         "`bank_name` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
CALL chinbiz_add_col('user','status',            "`status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
CALL chinbiz_add_col('user','manager_center_id', "`manager_center_id` bigint DEFAULT NULL");
CALL chinbiz_add_col('user','manager_code',      "`manager_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
CALL chinbiz_add_col('user','manager_sdate',     "`manager_sdate` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
CALL chinbiz_add_col('user','manager_edate',     "`manager_edate` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
CALL chinbiz_add_col('user','manager_status',    "`manager_status` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL");

-- ── [education] 자동배정 동의여부 (교육완료 시 매니저 선택) ──────────
CALL chinbiz_add_col('education','auto_assign',  "`auto_assign` bit(1) NOT NULL DEFAULT b'0'");

-- ── [allowance] 확정일자 / 확정월 (2026-07-24) ──────────────────────
CALL chinbiz_add_col('allowance','fixed_date',  "`fixed_date` datetime(6) DEFAULT NULL");
CALL chinbiz_add_col('allowance','fixed_month', "`fixed_month` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL");

-- ── [product] 단순배송상품 / 취소보전비 / 취소비용 (docs/11) ─────────
CALL chinbiz_add_col('product','simple_delivery', "`simple_delivery` bit(1) NOT NULL DEFAULT b'0'");
CALL chinbiz_add_col('product','cancel_fee_flag', "`cancel_fee_flag` bit(1) NOT NULL DEFAULT b'0'");
CALL chinbiz_add_col('product','cancel_amount',   "`cancel_amount` bigint DEFAULT 0");

-- ── [product] 대상별 상품설명 (docs/18) — 비로그인 전용은 description 사용(구 desc_guest, 2026-10-20) ──
CALL chinbiz_add_col('product','desc_buzz',    "`desc_buzz` longtext");
CALL chinbiz_add_col('product','desc_manager', "`desc_manager` longtext");
CALL chinbiz_add_col('product','desc_partner', "`desc_partner` longtext");
CALL chinbiz_add_col('product','desc_admin',   "`desc_admin` longtext");

DROP PROCEDURE IF EXISTS chinbiz_add_col;

-- ── [product] 비로그인 전용 상품설명 desc_guest → description 이관 (2026-10-20, 재실행 안전) ──
ALTER TABLE `product` MODIFY `description` longtext COLLATE utf8mb4_unicode_ci;
SET @has_dg := (SELECT COUNT(*) FROM information_schema.COLUMNS
                 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND COLUMN_NAME = 'desc_guest');
SET @sql := IF(@has_dg > 0,
  'UPDATE `product` SET `description` = `desc_guest` WHERE (`description` IS NULL OR `description` = '''') AND `desc_guest` IS NOT NULL AND `desc_guest` <> ''''',
  'DO 0');
PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;
-- (선택) 이관 확인 후 컬럼 제거: ALTER TABLE `product` DROP COLUMN `desc_guest`;

-- ── [신규 테이블] 정산(수당지급) allowance_payment (2026-07-24) ──────
CREATE TABLE IF NOT EXISTS `allowance_payment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `member_id` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `member_type` enum('BUZZ','BUZZ_CENTER','DIVISION','HQ','MANAGER','MANAGER_CENTER','MASTER','TOPBUZZ') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fixed_month` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `payment_amount` bigint DEFAULT NULL,
  `created_date` datetime(6) DEFAULT NULL,
  `payment_flag` char(1) COLLATE utf8mb4_unicode_ci DEFAULT 'N',
  `payment_date` datetime(6) DEFAULT NULL,
  `account_holder` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_number` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_bankname` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── [신규 테이블] 약관/동의서 terms (2026-07-27, docs/15) ────────────
--   본사 [시스템설정]-[약관설정]에서 10종 약관 등록·수정. home/버즈admin 노출.
--   code: TOTAL/PRIVACY/BUZZ/MANAGER/CENTER/DIVISION/CENTER_PAPER/DIVISION_PAPER/PARTNER/PRIVACY_CONSENT
CREATE TABLE IF NOT EXISTS `terms` (
  `code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(120) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci,
  `sort_order` int DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── [신규 테이블] 약관 동의 이력 term_agreement (2026-07-28) ──────────
--   센터/본부 담당자 최초 로그인 시 이용약관 동의 기록: 로그인ID·IP·동의시간·role·약관코드
CREATE TABLE IF NOT EXISTS `term_agreement` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `login_id` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `term_code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ip` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agreed_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_term_agreement_login_code` (`login_id`,`term_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── [신규 테이블] 알람 설정 alram_setting (2026-07-30 docs/16) ────────
--   프로세스×수신대상 별 문구/사용여부. 본사 [시스템설정]-[알람설정]에서 관리.
CREATE TABLE IF NOT EXISTS `alram_setting` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `process_code` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `process_name` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trigger_desc` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sort_order` int DEFAULT NULL,
  `target` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `target_order` int DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `enabled` bit(1) NOT NULL DEFAULT b'0',
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_alram_setting_proc_target` (`process_code`,`target`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── [신규 테이블] 발생 알람 alram (2026-07-30 docs/16) ────────────────
CREATE TABLE IF NOT EXISTS `alram` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `process_code` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_id` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_name` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `recipient_role` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `message` text COLLATE utf8mb4_unicode_ci,
  `ref_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ref_id` bigint DEFAULT NULL,
  `read_flag` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N',
  `read_at` datetime(6) DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_alram_recipient` (`recipient_id`),
  KEY `idx_alram_process` (`process_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- (기존 alram 테이블이 이미 있는 경우 read_at 컬럼만 추가 — 이미 있으면 오류 무시)
-- ALTER TABLE `alram` ADD COLUMN `read_at` datetime(6) DEFAULT NULL;  (docs/17, ddl-auto 자동반영)

-- ── [신규 테이블] 환경설정 키-값 app_setting (2026-07-31 docs/18) ─────
--   추천마일리지: join_cp_buzz(가입버즈 CP), join_cp_referrer(추천인 CP). 본사 [환경설정]에서 관리.
CREATE TABLE IF NOT EXISTS `app_setting` (
  `code` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- allowance.type ENUM 에 JOIN 추가(가입 추천마일리지). ★ENUM 컬럼이라 ddl-auto 미반영 → 수동 ALTER 필수:
ALTER TABLE `allowance` MODIFY COLUMN `type` ENUM('ORDER','CANCEL','CANCEL_FEE','JOIN') NOT NULL;

-- ── [신규 테이블] 매니저 활동센터 신청 manager_center (2026-08-01 docs/19) ──
--   버즈회원 매니저신청 시 최대 3개 센터 선택 → 센터별 1행. status I=신청 / Y=승인.
CREATE TABLE IF NOT EXISTS `manager_center` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `buzz_id` bigint NOT NULL,
  `center_id` bigint NOT NULL,
  `apply_date` date DEFAULT NULL,
  `approve_date` date DEFAULT NULL,
  `status` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT 'I',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_manager_center_buzz_center` (`buzz_id`,`center_id`),
  KEY `idx_manager_center_center` (`center_id`,`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── [이관 backfill] 기존 user.manager_* → manager_center (2026-08-01, docs/19) ──
--   기존 신청/승인 매니저를 manager_center 로 이관. ★user 컬럼 DROP 전에 반드시 실행.
--   (user 테이블에 아직 manager_* 컬럼이 남아 있을 때만 동작. 컬럼 삭제 후엔 이 INSERT 는 오류 → 스킵)
INSERT IGNORE INTO `manager_center` (`buzz_id`,`center_id`,`apply_date`,`approve_date`,`status`)
SELECT id, manager_center_id,
       CASE WHEN manager_sdate REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN STR_TO_DATE(manager_sdate,'%Y-%m-%d') ELSE CURDATE() END,
       CASE WHEN manager_status='Y' AND LEFT(manager_edate,10) REGEXP '^[0-9]{4}-[0-9]{2}-[0-9]{2}' THEN STR_TO_DATE(LEFT(manager_edate,10),'%Y-%m-%d') ELSE NULL END,
       manager_status
FROM `user`
WHERE manager_center_id IS NOT NULL AND manager_status IN ('I','Y');

-- ── [컬럼 제거] user 매니저 denorm 필드 5종 (docs/19에서 manager_center 로 이관 완료) ──
--   ★위 backfill 실행 후에 1회 실행. 이미 없으면 "check that column exists" 오류(무시 가능).
ALTER TABLE `user`
  DROP COLUMN `manager_center_id`,
  DROP COLUMN `manager_code`,
  DROP COLUMN `manager_status`,
  DROP COLUMN `manager_sdate`,
  DROP COLUMN `manager_edate`;



-- ── [신규 테이블] 웹푸시 구독 push_subscription (2026-08-01 모바일 PWA) ─────
--   PWA 알림 권한 허용 시 브라우저 구독(endpoint+키)을 로그인 계정과 묶어 저장. 웹푸시 발송 대상.
--   account = 로그인 아이디(user.user_id / partner.partner_id 공용). endpoint = 기기/브라우저 단위 고유.
CREATE TABLE IF NOT EXISTS `push_subscription` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `account` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `endpoint` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `p256dh` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `auth` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_push_endpoint` (`endpoint`),
  KEY `idx_push_account` (`account`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- ── [신규 테이블] 본사 RBAC 담당자 지정 admin_scope (2026-08-07 docs/20 Task4) ─────
--   MASTER_ADMIN 계정별 담당영역(A~D) 저장. 행 없음 = 슈퍼(전체 메뉴 접근).
--   A=파트너·상품·교육, B=조직망/영업, C=수당/정산, D=공지·민원. areas = CSV(예 "A,C").
--   ddl-auto=update 로 자동 생성되나, 신규 배포/원격 DB 수동 적용용으로 기재.
CREATE TABLE IF NOT EXISTS `admin_scope` (
  `login_id` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `areas` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`login_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;



-- ── [컬럼 추가] user.resident_number 주민등록번호(세금신고용) (2026-08-12 docs/22) ─────
--   활동수당 지급 세금신고용. 유효성 검증 후 숫자만 저장(평문·요구사항). ddl-auto=update 자동 반영되나 배포용 기재.
ALTER TABLE `user` ADD COLUMN `resident_number` varchar(20) DEFAULT NULL;



-- ── [컬럼 추가] product 상세 확장 (2026-08-21 docs/25) ─────────────────────────
--   월관리/AS지원 여부, 상품영상URL, 핵심스펙/효과·영업대상·상품특성·처리프로세스(에디터 HTML).
--   ddl-auto=update 자동 반영되나 배포용 병행.
ALTER TABLE `product` ADD COLUMN `monthly_care` bit(1) NOT NULL DEFAULT b'0';
ALTER TABLE `product` ADD COLUMN `as_support` bit(1) NOT NULL DEFAULT b'0';
ALTER TABLE `product` ADD COLUMN `video_url` varchar(500) DEFAULT NULL;
ALTER TABLE `product` ADD COLUMN `spec_effect` longtext;
ALTER TABLE `product` ADD COLUMN `sales_target` longtext;
ALTER TABLE `product` ADD COLUMN `product_feature` longtext;
ALTER TABLE `product` ADD COLUMN `process_flow` longtext;

-- [2026-08-30] sale: 현장설치 사진 (docs/25_2, 매니저 2차영업관리 영업권확보 레이어 업로드)
ALTER TABLE `sale` ADD COLUMN `install_photos` text;

-- [2026-09-10] 회비/입점비 결제 (매니저·센터 회비, 파트너 입점비)
ALTER TABLE `user` ADD COLUMN `membership_expiry` date DEFAULT NULL;            -- 매니저/센터 회원 만기일자
ALTER TABLE `partner` ADD COLUMN `entry_fee_paid` bit(1) NOT NULL DEFAULT b'0'; -- 파트너 입점비 납부여부
ALTER TABLE `partner` ADD COLUMN `entry_fee_paid_date` date DEFAULT NULL;        -- 파트너 입점비 납부일자
CREATE TABLE IF NOT EXISTS `membership_payment` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `payer_type` varchar(10) DEFAULT NULL,       -- USER | PARTNER
  `payer_id` bigint DEFAULT NULL,
  `payer_login_id` varchar(60) DEFAULT NULL,
  `role` varchar(20) DEFAULT NULL,
  `fee_type` varchar(12) DEFAULT NULL,          -- MONTHLY | YEARLY | ENTRY(monthly/yearly/entry)
  `method` varchar(12) DEFAULT NULL,            -- CARD|VBANK|TRANSFER|EASYPAY|MP
  `base_fee` bigint DEFAULT NULL,
  `vat` bigint DEFAULT NULL,
  `amount` bigint DEFAULT NULL,
  `expiry_after` date DEFAULT NULL,
  `order_id` varchar(64) DEFAULT NULL,          -- 토스 주문번호(가맹점)
  `payment_key` varchar(200) DEFAULT NULL,      -- 토스 결제키(승인 후)
  `status` varchar(20) DEFAULT NULL,            -- PENDING|DONE|WAITING_DEPOSIT|CANCELED
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_membership_payment_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- (이미 membership_payment 가 있는 환경) 토스 연동 컬럼 추가:
ALTER TABLE `membership_payment` ADD COLUMN `order_id` varchar(64) DEFAULT NULL;
ALTER TABLE `membership_payment` ADD COLUMN `payment_key` varchar(200) DEFAULT NULL;
ALTER TABLE `membership_payment` ADD COLUMN `status` varchar(20) DEFAULT NULL;
ALTER TABLE `membership_payment` ADD UNIQUE KEY `uk_membership_payment_order` (`order_id`);
-- [2026-09-10] 현금영수증 (가상계좌·계좌이체 결제 시 자동 발급)
ALTER TABLE `membership_payment` ADD COLUMN `receipt_type` varchar(20) DEFAULT NULL;    -- CASH_RECEIPT
ALTER TABLE `membership_payment` ADD COLUMN `receipt_status` varchar(20) DEFAULT NULL;  -- ISSUED|FAILED
ALTER TABLE `membership_payment` ADD COLUMN `receipt_key` varchar(300) DEFAULT NULL;    -- 발행 참조(현금영수증키)
-- [2026-09-10] 본사 회비결제내역 조회용 회원명 저장
ALTER TABLE `membership_payment` ADD COLUMN `payer_name` varchar(120) DEFAULT NULL;



-- ── [2026-10-04] docs/27 — 1차영업 대표자 핸드폰 + 고객 동의(agree) ─────────
--   sale.ceo_phone(ceo_name 뒤), sale.agree_check(기본 N)/agree_date(마지막),
--   agree 테이블 신규(개인정보3자제공 provide / 마케팅 marketing). 멱등.
DROP PROCEDURE IF EXISTS chinbiz_add_col;
DELIMITER $$
CREATE PROCEDURE chinbiz_add_col(IN p_tbl VARCHAR(64), IN p_col VARCHAR(64), IN p_ddl TEXT)
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_tbl AND COLUMN_NAME = p_col) = 0 THEN
    SET @sql = CONCAT('ALTER TABLE `', p_tbl, '` ADD COLUMN ', p_ddl);
    PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
DELIMITER ;
CALL chinbiz_add_col('sale','ceo_phone',   "`ceo_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL AFTER `ceo_name`");
CALL chinbiz_add_col('sale','agree_check', "`agree_check` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT 'N'");
CALL chinbiz_add_col('sale','agree_date',  "`agree_date` datetime(6) DEFAULT NULL");
DROP PROCEDURE IF EXISTS chinbiz_add_col;
UPDATE `sale` SET `agree_check` = 'N' WHERE `agree_check` IS NULL;


ALTER TABLE `sale` ADD COLUMN `ceo_phone` varchar(20)  NULL;
ALTER TABLE `sale` ADD COLUMN `agree_check` varchar(1)  NULL DEFAULT 'N';
ALTER TABLE `sale` ADD COLUMN `agree_date` datetime(6)  NULL ;


CREATE TABLE IF NOT EXISTS `agree` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `agree_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,   -- provide(개인정보3자제공) / marketing(마케팅동의)
  `name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(400) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agree_check` varchar(1) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'N',
  `agree_date` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_agree_lookup` (`agree_type`,`name`,`phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── [2026-10-23] docs/30 : 본부ᆞ센터 리스트(fix_idx) / 파트너 영업본부 / 회비 수당 ──
DROP PROCEDURE IF EXISTS chinbiz_add_col;
DELIMITER $$
CREATE PROCEDURE chinbiz_add_col(IN p_tbl VARCHAR(64), IN p_col VARCHAR(64), IN p_ddl TEXT)
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_tbl AND COLUMN_NAME = p_col) = 0 THEN
    SET @sql = CONCAT('ALTER TABLE `', p_tbl, '` ADD COLUMN ', p_ddl);
    PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
DELIMITER ;
-- center_code.fix_idx : 할당된 본부장/센터장 user.id (데이터 전체 재적재는 db/center_code_reload.sql)
CALL chinbiz_add_col('center_code','fix_idx', "`fix_idx` bigint DEFAULT NULL COMMENT '할당된 본부장/센터장 user.id'");
-- partner.sale_id : 영업본부(본부 계정 user.user_id)
CALL chinbiz_add_col('partner','sale_id', "`sale_id` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
DROP PROCEDURE IF EXISTS chinbiz_add_col;
-- allowance.type 에 MEMBERSHIP 포함 보장(회비 결제 차감/회비 수당). 이미 포함돼 있어도 재실행 안전.
ALTER TABLE `allowance` MODIFY `type` ENUM('ORDER','CANCEL','CANCEL_FEE','JOIN','MEMBERSHIP') NOT NULL;
-- app_setting 신규 키(org_dup_allow, fee_reward_*)는 BE 기동 시 시더가 기본값으로 자동 생성.

-- ── [partner_order / order_delivery] 단순배송상품 주문 (docs/33) ─────────
-- HOME 상품상세(카카오 링크 refId·ordNo) [구매하기] → 주문서 → 결제하기(무통장). 주문상태: 접수/입금/배송완료/취소
CREATE TABLE IF NOT EXISTS `partner_order` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_no` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sale_id` bigint DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  `partner_id` bigint DEFAULT NULL,
  `product_name` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sale_price` bigint DEFAULT NULL,
  `quantity` int NOT NULL,
  `total_amount` bigint DEFAULT NULL,
  `pay_method` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderer_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderer_tel` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderer_mobile` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderer_email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderer_zipcode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderer_address` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `orderer_address_detail` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_partner` (`partner_id`),
  KEY `idx_order_sale` (`sale_id`, `order_no`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `order_delivery` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `order_id` bigint NOT NULL,
  `receiver_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `receiver_mobile` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `zipcode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_detail` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_order_delivery_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 완료.


-- ── [2026-10-29] docs/32 : 상품정보·SEO / SEO 메타(app_setting) / 교육자료 / HOME 광고(ad_chinbiz) ──
DROP PROCEDURE IF EXISTS chinbiz_add_col;
DELIMITER $$
CREATE PROCEDURE chinbiz_add_col(IN p_tbl VARCHAR(64), IN p_col VARCHAR(64), IN p_ddl TEXT)
BEGIN
  IF (SELECT COUNT(*) FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = p_tbl AND COLUMN_NAME = p_col) = 0 THEN
    SET @sql = CONCAT('ALTER TABLE `', p_tbl, '` ADD COLUMN ', p_ddl);
    PREPARE st FROM @sql; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
DELIMITER ;
-- product : 상품정보 고시 + 검색노출(SEO) → HOME 상품상세 [상품 정보] · 메타태그 · JSON-LD
CALL chinbiz_add_col('product','brand',           "`brand` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
CALL chinbiz_add_col('product','model_name',      "`model_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
CALL chinbiz_add_col('product','manufacturer',    "`manufacturer` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
CALL chinbiz_add_col('product','origin',          "`origin` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
CALL chinbiz_add_col('product','spec_size',       "`spec_size` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
CALL chinbiz_add_col('product','seo_title',       "`seo_title` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
CALL chinbiz_add_col('product','seo_description', "`seo_description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
CALL chinbiz_add_col('product','seo_keywords',    "`seo_keywords` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL");
DROP PROCEDURE IF EXISTS chinbiz_add_col;
-- app_setting.value 255 → 1000 (SEO 설명·키워드 수용. ddl-auto 는 길이 변경을 반영하지 않으므로 필수). 재실행 안전.
ALTER TABLE `app_setting` MODIFY `value` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL;

-- 교육자료 (본사 [교육관리]-[교육자료 등록]) — 파일은 BE app.edu-dir(기본 ./edu-materials) 에 저장
CREATE TABLE IF NOT EXISTS `edu_material` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `product_id` bigint NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `stored_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `original_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` bigint DEFAULT NULL,
  `created_by` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_edu_material_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 교육자료 다운로드 이력 (Insert-Only) — 상품 자료 전체 다운로드 시 매니저 [교육완료] 활성화
CREATE TABLE IF NOT EXISTS `edu_material_download` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `material_id` bigint NOT NULL,
  `product_id` bigint NOT NULL,
  `manager_id` bigint NOT NULL,
  `downloaded_at` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_edu_dl_manager_product` (`manager_id`,`product_id`),
  KEY `idx_edu_dl_material` (`material_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- HOME 광고 (본사 [광고관리]) — 이미지는 ad_chinbiz_image (리사이징 PC/모바일 URL)
CREATE TABLE IF NOT EXISTS `ad_chinbiz` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `area_id` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `position` enum('MAIN') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ad_type` enum('BANNER','LAYER_POPUP','SLIDE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `published` bit(1) NOT NULL,
  `image_count` int NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_ad_area_id` (`area_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `ad_chinbiz_image` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ad_id` bigint NOT NULL,
  `sort_order` int NOT NULL,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mobile_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `link_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `alt_text` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `width` int DEFAULT NULL,
  `height` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_ad_image_ad` (`ad_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- alarm_setting 의 NOTICE(공지사항) 프로세스 행은 BE 기동 시 시더가 자동 생성.
-- 완료.
