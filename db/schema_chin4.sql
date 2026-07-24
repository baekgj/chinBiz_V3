-- =====================================================================
--  친비즈(ChinBiz) V3 · DB 스키마 (chin4)
--  생성 기준: 2026-07-20  (JPA ddl-auto=update 로 생성된 실제 스키마 덤프)
--  실행: mysql -u root -p chin4 < db\schema_chin4.sql
--        (DB/계정은 db\init_chin4.sql 로 먼저 생성)
--  주의: 테이블은 평소 애플리케이션 기동 시 ddl-auto 가 자동 생성/변경함.
--        본 파일은 신규 서버 배포·문서화용 스냅샷.
--  참고: center_code(지역 본부/센터 코드)는 참조 데이터가 필요 → 별도 적재.
-- =====================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
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
  `paid` bit(1) NOT NULL,
  `paid_date` date DEFAULT NULL,
  `partner_id` bigint DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  `seq` bigint NOT NULL AUTO_INCREMENT,
  `status` enum('CP','MP') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`member_id`,`member_type`,`order_no`,`type`),
  UNIQUE KEY `seq` (`seq`)
) ENGINE=InnoDB AUTO_INCREMENT=62 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `category` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `created_at` datetime(6) NOT NULL,
  `level` enum('LARGE','MEDIUM','SMALL') COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `parent_id` bigint DEFAULT NULL,
  `status` enum('ACTIVE','INACTIVE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `center_code` (
  `idx` bigint NOT NULL,
  `head_code` varchar(40) DEFAULT NULL,
  `head_name` varchar(255) DEFAULT NULL,
  `center_code` varchar(40) DEFAULT NULL,
  `center_name` varchar(255) DEFAULT NULL,
  `Head_code_idx` int DEFAULT NULL COMMENT '지원센터가 소속된 교육센터의  idx 값',
  `status` varchar(255) DEFAULT NULL,
  `Regdate` datetime DEFAULT NULL COMMENT '등록일 ',
  `search_key` varchar(255) DEFAULT NULL,
  `match_key` varchar(255) DEFAULT NULL,
  `name` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idx`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `education` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `approved` bit(1) NOT NULL,
  `approved_at` datetime(6) DEFAULT NULL,
  `approver_id` bigint DEFAULT NULL,
  `completed` bit(1) NOT NULL,
  `completed_at` datetime(6) DEFAULT NULL,
  `auto_assign` bit(1) NOT NULL DEFAULT b'0',  -- 교육완료 시 자동배정 허용 동의(동의=1/미동의=0)
  `created_at` datetime(6) NOT NULL,
  `manager_id` bigint NOT NULL,
  `manager_referral_code` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `partner_id` bigint DEFAULT NULL,
  `product_id` bigint NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_edu_product_manager` (`product_id`,`manager_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `notice` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `all_flag` bit(1) NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(6) NOT NULL,
  `published` bit(1) NOT NULL,
  `target_id` bigint DEFAULT NULL,
  `target_type` enum('BUZZ','CENTER','DIVISION','MANAGER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `partner` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `account_holder` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_number` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_detail` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ceo_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `company_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `partner_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `zipcode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_partner_partner_id` (`partner_id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- 파트너사 입점 상담신청 (home 입점제안 접수 → 본사 파트너사관리 [상담신청])
--   status: NEW(접수) / DONE(상담완료) / CANCELED(신청취소)
--
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

/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `product` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `buzz_reward` bigint DEFAULT NULL,
  `category_id` bigint DEFAULT NULL,
  `chinku_reward` bigint DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `division_reward` bigint DEFAULT NULL,
  `hq_reward` bigint DEFAULT NULL,
  `image1` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image2` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image3` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image4` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `image5` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `install_policy` text COLLATE utf8mb4_unicode_ci,
  `manager_reward` bigint DEFAULT NULL,
  `mgmt_center_reward` bigint DEFAULT NULL,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `on_sale` bit(1) NOT NULL,
  `partner_id` bigint DEFAULT NULL,
  `return_policy` text COLLATE utf8mb4_unicode_ci,
  `reward_type` enum('FIXED','RATE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `sale_price` bigint DEFAULT NULL,
  `sales_center_reward` bigint DEFAULT NULL,
  `total_allowance` bigint DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `contract_end_date` date DEFAULT NULL,
  `install_product` bit(1) NOT NULL,
  `kw_popular` bit(1) NOT NULL,
  `kw_recommended` bit(1) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `sale` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `address` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_detail` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `business_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `buzz_id` bigint DEFAULT NULL,
  `category_id` bigint DEFAULT NULL,
  `ceo_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_name` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_id` bigint DEFAULT NULL,
  `manager_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `memo` text COLLATE utf8mb4_unicode_ci,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `product_id` bigint DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` datetime(6) DEFAULT NULL,
  `zipcode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_id` bigint DEFAULT NULL,
  `order_no` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_dated_at` datetime(6) DEFAULT NULL,     -- 매니저 배정(영업권확보) 일시
  `customer_center_id` bigint DEFAULT NULL,         -- 고객 주소 → center_code.idx (매니저 지역 배정 기준)
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE IF NOT EXISTS `user` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `address` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address_detail` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `agree_marketing` bit(1) NOT NULL,
  `created_at` datetime(6) NOT NULL,
  `email` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `referral_code` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('BUZZ','CENTER_ADMIN','DIVISION_ADMIN','MANAGER','MASTER_ADMIN','PARTNER') COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `zipcode` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `sales_center_id` bigint DEFAULT NULL,
  `account_holder` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_number` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(40) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_center_id` bigint DEFAULT NULL,
  `manager_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_edate` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_sdate` varchar(10) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `manager_status` varchar(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_user_id` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

SET FOREIGN_KEY_CHECKS=1;
