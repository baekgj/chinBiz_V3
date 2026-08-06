# 친비즈 V3 · nginx 배포 가이드 (chinbiz.kr)

`chinbiz.kr.conf` 를 적용하기 위한 **앱 쪽 설정 + 서버 절차** 정리.
구조: **nginx(80/443)** 가 앞단, 내부 앱은 로컬 포트로만 구동.

| 서비스 | 내부 포트 | 외부 주소 |
|---|---|---|
| home (Next.js) | 8001 | `https://chinbiz.kr` |
| admin (Next.js) | 3100 | `https://admin.chinbiz.kr` |
| BE (Spring Boot) | 9001 | 각 도메인의 `/api`, `/uploads` (프록시) |

> API 는 각 도메인의 `/api` 로 호출 → **브라우저 입장 same-origin 이라 CORS 가 발생하지 않음.**
> (`resolveServiceUrl` 이 HTTPS 에서 same-origin 을 반환하도록 이미 구현됨.)

---

## 1) DNS
A 레코드 2개를 서버 IP(175.125.94.198)로:
```
chinbiz.kr        A   175.125.94.198
www.chinbiz.kr    A   175.125.94.198
admin.chinbiz.kr  A   175.125.94.198
```

## 2) 내부 앱 포트
nginx 가 80/443 을 점유하므로 **home 은 80이 아니라 8001** 로 띄운다.
- `home/package.json` 의 `"-p 80"` → `"-p 8001"` 로 되돌리거나, 실행 시 `PORT=8001` 지정.
- admin 은 그대로 3100, BE 는 9001.

## 3) FE 환경변수 (★ 서브도메인 분리라 필수, 빌드 전에 설정)
`NEXT_PUBLIC_*` 는 **빌드 시점에 인라인**되므로 `npm run build` **전에** 설정해야 한다.
같은 도메인의 `/api` 는 자동(same-origin)이라 API_URL 은 불필요하고, **서로 다른 서브도메인으로
이동하는 링크만** 지정하면 된다.

`home/.env.local`
```
# 홈 로그인 성공 → 어드민(서브도메인)으로 이동
NEXT_PUBLIC_ADMIN_URL=https://admin.chinbiz.kr
```
`admin/.env.local`
```
# 어드민 로그아웃/미인증 → 홈 로그인으로 이동
NEXT_PUBLIC_HOME_URL=https://chinbiz.kr
```
> 미설정 시 same-origin 으로 해석되어 home↔admin 이동 링크가 어긋난다. (API 는 무관)

## 4) 앱 빌드/기동 (예: PM2)
```bash
# BE
cd be && ./mvnw -DskipTests clean package
DB_HOST=175.125.94.198 DB_USER=chin4 DB_PASSWORD=**** \
  nohup java -jar target/*.jar > be.log 2>&1 &   # 9001

# home
cd home && npm ci && npm run build
PORT=8001 pm2 start "npm run start" --name chinbiz-home   # start 스크립트가 -p 8001 이면 PORT 불필요

# admin
cd admin && npm ci && npm run build
pm2 start "npm run start" --name chinbiz-admin            # 3100
```
> BE 는 원격 DB 접속 시 환경변수(DB_HOST/DB_USER/DB_PASSWORD)를 지정.
> `allowance.type` ENUM 에 `JOIN` 추가 등 DB 마이그레이션은 `db/migration_new_fields.sql` 참고.

## 5) nginx + SSL(Let's Encrypt)
```bash
sudo cp deploy/nginx/chinbiz.kr.conf /etc/nginx/sites-available/chinbiz.kr.conf
sudo ln -s /etc/nginx/sites-available/chinbiz.kr.conf /etc/nginx/sites-enabled/

# (임시) 인증서 없으면 conf 하단의 [HTTP 전용 임시 운영] 블록으로 먼저 기동
sudo nginx -t && sudo systemctl reload nginx

# 인증서 발급 (3개 도메인 한 번에)
sudo certbot --nginx -d chinbiz.kr -d www.chinbiz.kr -d admin.chinbiz.kr
# → 발급 후 conf 의 (1)(2)(3) HTTPS 블록 사용, 자동 갱신은 certbot.timer 가 처리
sudo nginx -t && sudo systemctl reload nginx
```

## 6) 방화벽
- **열기**: 80, 443 (nginx)
- **닫기(권장)**: 3100, 9001, 8001 은 외부 노출 불필요 — 127.0.0.1 로만 바인딩되면 방화벽에서 막아도 됨.

---

## HTTP 로만 먼저 운영하려면 (SSL 나중)
`chinbiz.kr.conf` 하단의 **[HTTP 전용 임시 운영]** 주석 블록을 사용하면 `http://chinbiz.kr` /
`http://admin.chinbiz.kr` 로 바로 서비스된다. 이때는 same-origin `/api` 프록시라 CORS 역시 무관.
(직접 포트 노출 방식 `http://chinbiz.kr:3100`, `:9001` 을 쓰려면 nginx 없이 현재 코드 그대로도 동작하며,
BE CORS 에 무포트/포트 오리진이 모두 등록되어 있음.)
