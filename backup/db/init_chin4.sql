-- 친비즈 ERP - 로컬 개발 DB/계정 초기화
-- 실행: mysql -u root -p < db\init_chin4.sql  (root 비밀번호 입력)
-- .env 기준: DB_NAME=chin4, DB_USER=chin4_test, DB_PASSWORD=1234, host=localhost:3306
-- 테이블 스키마는 애플리케이션 기동 시 JPA(ddl-auto=update)가 자동 생성.
--   신규 서버에 스키마를 미리 만들려면: mysql -u root -p chin4 < db\schema_chin4.sql

CREATE DATABASE IF NOT EXISTS chin4
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- 계정 생성 (없으면). MySQL 8 기본 인증 플러그인 사용
CREATE USER IF NOT EXISTS 'chin4_test'@'localhost' IDENTIFIED BY '1234';
CREATE USER IF NOT EXISTS 'chin4_test'@'127.0.0.1' IDENTIFIED BY '1234';

GRANT ALL PRIVILEGES ON chin4.* TO 'chin4_test'@'localhost';
GRANT ALL PRIVILEGES ON chin4.* TO 'chin4_test'@'127.0.0.1';

FLUSH PRIVILEGES;

-- 확인
SELECT '=== 생성 결과 ===' AS info;
SHOW DATABASES LIKE 'chin4';
SELECT user, host FROM mysql.user WHERE user = 'chin4_test';
