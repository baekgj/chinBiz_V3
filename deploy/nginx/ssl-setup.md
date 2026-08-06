# 친비즈 V3 · 서버 SSL 인증서 설치 가이드 (chinbiz.kr)

무료 **Let's Encrypt** 인증서를 **certbot** 으로 발급·자동갱신하는 표준 절차.
전제: 리눅스 서버(Ubuntu/Debian 기준) + **nginx 리버스 프록시**(`chinbiz.kr.conf`).
> SSL 은 Next.js/스프링을 앞단에서 감싸는 **nginx(또는 Caddy)** 가 종단(termination)하는 구조가 표준입니다.
> (home 을 80 에 직접 띄우는 방식으로는 HTTPS 를 깔끔히 붙일 수 없어 nginx 를 앞에 둡니다.)

---

## 0) 사전 조건 (반드시 먼저)
1. **DNS A 레코드**가 서버 IP(175.125.94.198)로 향해 있어야 함:
   ```
   chinbiz.kr        A  175.125.94.198
   www.chinbiz.kr    A  175.125.94.198
   admin.chinbiz.kr  A  175.125.94.198
   ```
   확인: `dig +short chinbiz.kr` (또는 `nslookup chinbiz.kr`) → 서버 IP 가 나와야 함.
2. **방화벽/보안그룹에서 80, 443 포트 열기** (Let's Encrypt 인증은 80 을 사용).
3. **nginx 가 설치돼 80 에서 서비스 중**이어야 함 (`chinbiz.kr.conf` 의 임시 HTTP 블록으로 먼저 기동).
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   curl -I http://chinbiz.kr        # 200/301 응답 확인
   ```

## 1) certbot 설치
Ubuntu/Debian:
```bash
sudo apt update
sudo apt install -y certbot python3-certbot-nginx
```
(CentOS/RHEL 이면 `sudo dnf install -y certbot python3-certbot-nginx`, snap 이면 `sudo snap install --classic certbot`)

## 2) 인증서 발급 (nginx 자동 설정)
3개 도메인을 한 번에 (SAN 인증서):
```bash
sudo certbot --nginx \
  -d chinbiz.kr -d www.chinbiz.kr -d admin.chinbiz.kr \
  --email admin@chinbiz.kr --agree-tos --no-eff-email --redirect
```
- `--nginx` : certbot 이 nginx 설정을 읽어 도메인 검증(HTTP-01) 후 **443 서버블록 + 인증서 경로를 자동 주입**하고 80→443 리다이렉트(`--redirect`)까지 추가.
- 성공하면 인증서가 `/etc/letsencrypt/live/chinbiz.kr/` 에 생성:
  - `fullchain.pem` (인증서 체인), `privkey.pem` (개인키)
- ★ 이미 `chinbiz.kr.conf` 에 443 블록을 직접 써 뒀다면, certbot 에 `--nginx` 대신 `certonly` 로 발급만 받고
  설정은 그대로 두는 방법도 있음:
  ```bash
  sudo certbot certonly --nginx -d chinbiz.kr -d www.chinbiz.kr -d admin.chinbiz.kr
  # 발급 후 conf 의 ssl_certificate 경로가 위와 같은지 확인 → nginx -t && reload
  ```

## 3) 확인
```bash
sudo nginx -t && sudo systemctl reload nginx
curl -I https://chinbiz.kr          # HTTP/2 200, 인증서 유효
```
브라우저에서 `https://chinbiz.kr` / `https://admin.chinbiz.kr` 자물쇠 확인.

## 4) 자동 갱신 (Let's Encrypt 는 90일 만료)
certbot 설치 시 자동 갱신 타이머가 함께 등록됨. 동작 확인:
```bash
systemctl list-timers | grep certbot     # certbot.timer 활성 확인
sudo certbot renew --dry-run              # 갱신 리허설(실제 갱신 X)
```
갱신 후 nginx 리로드가 필요하면 hook 추가:
```bash
# /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
#!/bin/sh
systemctl reload nginx
```
```bash
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/reload-nginx.sh
```

---

## 5) 앱(FE) 쪽 마무리 — HTTPS 전환 시
- FE 의 `resolveServiceUrl` 은 **https 접속이면 자동으로 same-origin(`/api`)** 을 호출하도록 이미 구현됨
  → API 는 별도 설정 불필요(nginx 가 `/api` 를 BE 9001 로 프록시).
- 단, **서브도메인 분리(admin.chinbiz.kr)** 라 서로 이동하는 링크는 빌드 전에 env 지정 필요:
  ```
  home/.env.local :  NEXT_PUBLIC_ADMIN_URL=https://admin.chinbiz.kr
  admin/.env.local:  NEXT_PUBLIC_HOME_URL=https://chinbiz.kr
  ```
  `NEXT_PUBLIC_*` 는 빌드 타임 인라인 → **설정 후 `npm run build` 재실행**.
- CORS: same-origin 프록시라 사실상 불필요하지만, BE `application.yml` 에 `https://chinbiz.kr` / `*.chinbiz.kr`
  이미 허용돼 있음.

---

## (대안) Caddy — SSL 자동
nginx 대신 **Caddy** 를 쓰면 인증서 발급·갱신이 완전 자동(설정 몇 줄):
```caddyfile
chinbiz.kr, www.chinbiz.kr {
    handle /api/*   { reverse_proxy 127.0.0.1:9001 }
    handle /uploads/* { reverse_proxy 127.0.0.1:9001 }
    handle          { reverse_proxy 127.0.0.1:8001 }
}
admin.chinbiz.kr {
    handle /api/*   { reverse_proxy 127.0.0.1:9001 }
    handle          { reverse_proxy 127.0.0.1:3100 }
}
```
Caddy 는 실행만 하면 Let's Encrypt 인증서를 알아서 발급·갱신함(80/443 오픈 필요).

---

## 문제 해결
- **발급 실패(HTTP-01 timeout)**: DNS 미전파 / 80 포트 미오픈 / nginx 미기동 → 0) 사전조건 재확인.
- **`admin.chinbiz.kr` 만 실패**: 해당 서브도메인 A 레코드 누락 확인.
- **혼합콘텐츠 경고**: FE 가 아직 `http://…:9001` 을 호출 → HTTPS 접속 시 same-origin 을 쓰는지(빌드 최신인지) 확인.
- **인증서 갱신 후 반영 안 됨**: `sudo systemctl reload nginx` (또는 위 deploy hook).
