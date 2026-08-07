#!/usr/bin/env bash
# =============================================================================
#  친비즈 V3 · FE 배포 스크립트 (로컬 빌드 → 서버 전송 → 교체·재시작)
#  대상 서버는 "소스 없이 빌드 산출물만" 실행하는 구조이므로,
#  반드시 로컬에서 빌드한 .next(admin은 public 포함)를 서버로 올려야 반영된다.
#
#  사용법 (Git Bash 권장):
#     ./deploy.sh home     # 홈만 배포
#     ./deploy.sh admin    # 어드민만 배포
#     ./deploy.sh all      # 둘 다 (기본값)
#
#  전제: 이 스크립트가 repo 루트(home/, admin/ 상위)에 있고, 로컬에 ssh/scp/tar/npm 사용 가능.
#        (Windows 11은 기본 제공. Git Bash에서 실행 권장)
#  참고: scp/ssh가 매번 비밀번호를 물으면, SSH 키 인증을 설정하면 무입력으로 동작한다.
# =============================================================================
set -euo pipefail

# ── 설정 (환경에 맞게 수정) ─────────────────────────────────────────────────
SERVER="root@175.125.94.198"
REPO="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

HOME_SRC="$REPO/home"
HOME_DEST="/var/www/home"
HOME_PM2="home"
HOME_PORT=8001
NEXT_PUBLIC_ADMIN_URL="https://admin.chinbiz.kr"   # home 빌드에 박히는 admin 주소

ADMIN_SRC="$REPO/admin"
ADMIN_DEST="/var/www/web_admin_dev"
ADMIN_PM2="web_admin_dev"
ADMIN_PORT=3100
NEXT_PUBLIC_HOME_URL="https://chinbiz.kr"          # admin 빌드에 박히는 home 주소
# ────────────────────────────────────────────────────────────────────────────

log() { echo -e "\n\033[1;36m▶ $*\033[0m"; }
ok()  { echo -e "\033[1;32m✓ $*\033[0m"; }

deploy_home() {
  log "[home] 빌드 (NEXT_PUBLIC_ADMIN_URL=$NEXT_PUBLIC_ADMIN_URL)"
  ( cd "$HOME_SRC" && rm -rf .next && NEXT_PUBLIC_ADMIN_URL="$NEXT_PUBLIC_ADMIN_URL" npm run build )

  log "[home] 압축(.next)"
  tar -czf "$REPO/home-dist.tar.gz" -C "$HOME_SRC" .next

  log "[home] 전송 → $SERVER:$HOME_DEST"
  scp "$REPO/home-dist.tar.gz" "$SERVER:$HOME_DEST/"

  log "[home] 서버 교체 + 재시작"
  ssh "$SERVER" "cd '$HOME_DEST' && rm -rf .next && tar -xzf home-dist.tar.gz && rm -f home-dist.tar.gz && pm2 restart '$HOME_PM2' && sleep 2 && echo -n '상태: ' && curl -sI http://127.0.0.1:$HOME_PORT | head -1"

  rm -f "$REPO/home-dist.tar.gz"
  ok "[home] 배포 완료 (https://chinbiz.kr)"
}

deploy_admin() {
  log "[admin] 빌드 (NEXT_PUBLIC_HOME_URL=$NEXT_PUBLIC_HOME_URL)"
  ( cd "$ADMIN_SRC" && rm -rf .next && NEXT_PUBLIC_HOME_URL="$NEXT_PUBLIC_HOME_URL" npm run build )

  log "[admin] 압축(.next + public — PWA manifest/sw.js/icons 포함)"
  tar -czf "$REPO/admin-dist.tar.gz" -C "$ADMIN_SRC" .next public

  log "[admin] 전송 → $SERVER:$ADMIN_DEST"
  scp "$REPO/admin-dist.tar.gz" "$SERVER:$ADMIN_DEST/"

  log "[admin] 서버 교체 + 재시작"
  ssh "$SERVER" "cd '$ADMIN_DEST' && rm -rf .next && tar -xzf admin-dist.tar.gz && rm -f admin-dist.tar.gz && pm2 restart '$ADMIN_PM2' && sleep 2 && echo -n '상태: ' && curl -sI http://127.0.0.1:$ADMIN_PORT | head -1"

  rm -f "$REPO/admin-dist.tar.gz"
  ok "[admin] 배포 완료 (https://admin.chinbiz.kr)"
}

TARGET="${1:-all}"
case "$TARGET" in
  home)  deploy_home ;;
  admin) deploy_admin ;;
  all)   deploy_home; deploy_admin ;;
  *) echo "사용법: ./deploy.sh [home|admin|all]"; exit 1 ;;
esac

ok "전체 완료 — 새 시크릿창에서 확인하세요."
