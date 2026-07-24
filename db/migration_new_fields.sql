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

DROP PROCEDURE IF EXISTS chinbiz_add_col;
-- 완료.
