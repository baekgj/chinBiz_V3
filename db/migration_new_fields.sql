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

-- ── [product] 대상별 상품설명 5종 (docs/18) ──────────────────────────
CALL chinbiz_add_col('product','desc_guest',   "`desc_guest` longtext");
CALL chinbiz_add_col('product','desc_buzz',    "`desc_buzz` longtext");
CALL chinbiz_add_col('product','desc_manager', "`desc_manager` longtext");
CALL chinbiz_add_col('product','desc_partner', "`desc_partner` longtext");
CALL chinbiz_add_col('product','desc_admin',   "`desc_admin` longtext");

DROP PROCEDURE IF EXISTS chinbiz_add_col;

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
-- 완료.


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
-- 완료.


-- ── [신규 테이블] 본사 RBAC 담당자 지정 admin_scope (2026-08-07 docs/20 Task4) ─────
--   MASTER_ADMIN 계정별 담당영역(A~D) 저장. 행 없음 = 슈퍼(전체 메뉴 접근).
--   A=파트너·상품·교육, B=조직망/영업, C=수당/정산, D=공지·민원. areas = CSV(예 "A,C").
--   ddl-auto=update 로 자동 생성되나, 신규 배포/원격 DB 수동 적용용으로 기재.
CREATE TABLE IF NOT EXISTS `admin_scope` (
  `login_id` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `areas` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`login_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
-- 완료.


-- ── [컬럼 추가] user.resident_number 주민등록번호(세금신고용) (2026-08-12 docs/22) ─────
--   활동수당 지급 세금신고용. 유효성 검증 후 숫자만 저장(평문·요구사항). ddl-auto=update 자동 반영되나 배포용 기재.
ALTER TABLE `user` ADD COLUMN `resident_number` varchar(20) DEFAULT NULL;
-- 완료.
