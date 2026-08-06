# =====================================================================
#  친비즈 V3 · 전체 서버 가동 스크립트 (PowerShell)
#  - BE   (Spring Boot) : 포트 9001
#  - HOME (Next.js)     : 포트 8001
#  - ADMIN(Next.js)     : 포트 3100
#  각 서비스를 별도 창에서 실행한다.  사용법:  .\start-all.ps1
#  (특정 서비스만:  .\start-all.ps1 be,home   /  .\start-all.ps1 admin)
# =====================================================================
param(
    [string[]]$only
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Definition

function Start-Svc($name, $dir, $cmd, $port) {
    $path = Join-Path $root $dir
    if (-not (Test-Path $path)) { Write-Host "[skip] $name : 폴더 없음 ($path)" -ForegroundColor Yellow; return }
    Write-Host "[start] $name  (포트 $port)  →  $dir" -ForegroundColor Cyan
    # 별도 PowerShell 창에서 실행 (창 제목 = 서비스명)
    Start-Process powershell -ArgumentList @(
        "-NoExit", "-Command",
        "`$host.UI.RawUI.WindowTitle='ChinBiz $name ($port)'; Set-Location '$path'; $cmd"
    )
    Start-Sleep -Milliseconds 800
}

$run = @{
    be    = { Start-Svc "BE"    "be"    ".\mvnw.cmd -DskipTests spring-boot:run" 9001 }
    home  = { Start-Svc "HOME"  "home"  "npm run dev" 80 }
    admin = { Start-Svc "ADMIN" "admin" "npm run dev" 3100 }
}

$targets = if ($only) { $only } else { @("be", "home", "admin") }

Write-Host "==== 친비즈 V3 서버 가동 ====" -ForegroundColor Green
foreach ($t in $targets) {
    $key = $t.ToLower()
    if ($run.ContainsKey($key)) { & $run[$key] }
    else { Write-Host "[warn] 알 수 없는 대상: $t (be|home|admin)" -ForegroundColor Yellow }
}

Write-Host ""
Write-Host "가동 완료. 각 창에서 로그를 확인하세요:" -ForegroundColor Green
Write-Host "  - BE    : http://localhost:9001  (Swagger: /swagger-ui/index.html)"
Write-Host "  - HOME  : http://localhost  (포트 80)"
Write-Host "  - ADMIN : http://localhost:3100"
Write-Host ""
Write-Host "종료하려면 각 창을 닫거나  .\stop-all.ps1  실행"
