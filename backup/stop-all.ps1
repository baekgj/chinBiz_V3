# =====================================================================
#  친비즈 V3 · 전체 서버 종료 스크립트
#  포트 9001(BE) / 80(HOME) / 3100(ADMIN) 를 점유한 프로세스를 종료한다.
#  사용법:  .\stop-all.ps1
# =====================================================================
$ports = @{ 9001 = "BE"; 80 = "HOME"; 3100 = "ADMIN" }

foreach ($p in $ports.Keys) {
    $conns = Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue
    if (-not $conns) { Write-Host "[--] $($ports[$p]) (포트 $p): 실행 중 아님" -ForegroundColor DarkGray; continue }
    $pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($procId in $pids) {
        try {
            Stop-Process -Id $procId -Force -ErrorAction Stop
            Write-Host "[kill] $($ports[$p]) (포트 $p) PID $procId 종료" -ForegroundColor Cyan
        } catch {
            Write-Host "[warn] PID $procId 종료 실패: $($_.Exception.Message)" -ForegroundColor Yellow
        }
    }
}
Write-Host "완료." -ForegroundColor Green
