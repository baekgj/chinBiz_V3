@echo off
REM 친비즈 V3 · 전체 서버 가동 (더블클릭 실행용)
REM BE(9001) + HOME(8001) + ADMIN(3100)
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -NoProfile -File "%~dp0start-all.ps1" %*
