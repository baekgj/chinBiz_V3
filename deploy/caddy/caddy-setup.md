# 친비즈 V3 · Caddy 자동 SSL 설치 가이드 (Let's Encrypt 자동 발급·갱신)

Caddy 는 도메인만 지정하면 **인증서 발급·갱신을 완전 자동**으로 처리한다(구매 인증서 불필요).
전제: 리눅스 서버(Ubuntu/Debian 기준), 내부 앱은 로컬 포트로 구동(home 8001 / admin 3100 / BE 9001).

---

## 0) 사전 조건 (반드시 먼저)
1. **DNS A 레코드** 3개가 서버 IP(175.125.94.198)로:
   ```
   chinbiz.kr        A  175.125.94.198
   www.chinbiz.kr    A  175.125.94.198
   admin.chinbiz.kr  A  175.125.94.198
   ```
   확인: `dig +short chinbiz.kr www.chinbiz.kr admin.chinbiz.kr` → 모두 서버 IP.
2. **방화벽/보안그룹 80, 443 오픈** (80=ACME 검증, 443=서비스). ★80 을 막으면 발급 실패.
3. **80/443 을 점유한 다른 서비스 종료** (기존 nginx·apache·home:80 등). Caddy 가 80/443 을 잡아야 함.
   ```bash
   sudo systemctl stop nginx 2>/dev/null; sudo systemctl disable nginx 2>/dev/null
   ```
4. 내부 앱 구동: BE(9001), home(8001), admin(3100). (home 은 80 이 아니라 8001 로 — Caddy 가 80/443 사용)

## 1) Caddy 설치 (공식 apt 저장소, systemd 서비스로 등록됨)
```bash
sudo apt install -y debian-keyring debian-archive-keyring apt-transport-https curl
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
  | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
  | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt update && sudo apt install -y caddy
```
→ `caddy` 서비스가 사용자 `caddy` 로 등록되고 `/etc/caddy/Caddyfile` 을 읽음.
(다른 배포판/설치법: https://caddyserver.com/docs/install — snap·바이너리·yum 등)

## 2) Caddyfile 배치
이 저장소의 `deploy/caddy/Caddyfile` 을 서버로 복사:
```bash
sudo cp deploy/caddy/Caddyfile /etc/caddy/Caddyfile
sudo caddy fmt --overwrite /etc/caddy/Caddyfile   # 포맷 정리(선택)
sudo caddy validate --config /etc/caddy/Caddyfile # 문법 검사
```

## 3) 적용 → 자동 발급
```bash
sudo systemctl reload caddy      # 최초면 sudo systemctl enable --now caddy
```
Caddy 가 기동되면서 3개 도메인의 인증서를 **자동 발급**(수 초~수십 초). 발급 로그 확인:
```bash
sudo journalctl -u caddy -f      # "certificate obtained successfully" 등 확인 (Ctrl+C 로 종료)
```

## 4) 확인
```bash
curl -I https://chinbiz.kr
curl -I https://admin.chinbiz.kr
```
브라우저에서 자물쇠 + 유효 인증서 확인. HTTP 로 오면 Caddy 가 자동으로 HTTPS 리다이렉트.

## 5) 자동 갱신 (할 일 없음)
- Caddy 가 **만료 ~30일 전 자동 갱신**. cron/타이머 설정 불필요.
- 인증서 저장 위치: `/var/lib/caddy/.local/share/caddy/`.
- 서비스만 계속 떠 있으면 갱신도 자동. 확인만 하려면: `sudo journalctl -u caddy | grep -i renew`.

---

## 6) 앱(FE) 마무리 — HTTPS 전환
- FE `resolveServiceUrl` 은 https 접속이면 **자동 same-origin(`/api`)** 호출 → API 추가설정 불필요
  (Caddy 가 `/api` 를 BE 9001 로 프록시).
- 서브도메인 분리(admin.chinbiz.kr)라 **이동 링크만** 빌드 전에 지정 후 `npm run build`:
  ```
  home/.env.local :  NEXT_PUBLIC_ADMIN_URL=https://admin.chinbiz.kr
  admin/.env.local:  NEXT_PUBLIC_HOME_URL=https://chinbiz.kr
  ```

---

## 발급 테스트(rate limit 회피)
Let's Encrypt 운영 CA 는 실패 반복 시 rate limit 이 있으므로, 처음엔 **staging** 으로 시험 권장:
`Caddyfile` 전역 블록의 `# acme_ca https://acme-staging-v02.api.letsencrypt.org/directory` 주석 해제
→ `sudo systemctl reload caddy` → 정상 발급 흐름 확인되면 **다시 주석 처리하고** reload(운영 인증서 발급).

## 문제 해결
- **발급 실패**: DNS 미전파 / 80(또는 443) 미오픈 / 다른 웹서버가 80 점유 → 0) 사전조건 재확인.
- **`admin.chinbiz.kr` 만 실패**: 해당 A 레코드 확인.
- **502 Bad Gateway**: 내부 앱(8001/3100/9001) 미기동 → `curl -I http://127.0.0.1:8001` 등으로 확인.
- **설정 변경 후 반영**: `sudo systemctl reload caddy` (무중단 리로드).

> 참고: 구매한 Sectigo 인증서(`docs/chinbizkr_ssl.crt`)를 쓰지 않고 **Caddy 자동 발급**을 쓰면
> 개인키·중간인증서 관리, 만료 재설치가 모두 사라집니다. (구매 인증서를 굳이 쓰려면 `tls <cert> <key>` 지시어 사용)
