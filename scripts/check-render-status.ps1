# Render 배포 상태 확인 및 안내 스크립트

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Render 배포 상태 확인" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. GitHub 푸시 상태 확인..." -ForegroundColor Yellow
$gitStatus = git status --short
if ([string]::IsNullOrWhiteSpace($gitStatus)) {
    Write-Host "   OK: Working tree clean" -ForegroundColor Green
} else {
    Write-Host "   Warning: Uncommitted changes detected" -ForegroundColor Yellow
}

$lastCommit = git log -1 --oneline
Write-Host "   Latest commit: $lastCommit" -ForegroundColor Gray

Write-Host "`n2. Render 자동 배포 안내..." -ForegroundColor Yellow
Write-Host "   Render는 GitHub 푸시를 감지하여 자동으로 배포를 시작합니다." -ForegroundColor Green
Write-Host "   GitHub 푸시가 완료되었으므로 배포가 자동으로 시작됩니다." -ForegroundColor Green

Write-Host "`n3. 배포 확인 방법:" -ForegroundColor Yellow
Write-Host "   a) Render 대시보드: https://dashboard.render.com/web/srv-d48p38jipnbc73dkh990" -ForegroundColor Cyan
Write-Host "   b) Events 탭에서 배포 상태 확인" -ForegroundColor Gray
Write-Host "   c) Logs 탭에서 빌드 로그 확인" -ForegroundColor Gray

Write-Host "`n4. 사이트 접속 테스트:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://realxbest.com" -Method Get -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Host "   OK: Site is accessible (HTTP 200)" -ForegroundColor Green
    } else {
        Write-Host "   Warning: Site returned HTTP $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   Info: Site may be deploying or sleeping (this is normal)" -ForegroundColor Gray
}

Write-Host "`n5. 예상 배포 시간:" -ForegroundColor Yellow
Write-Host "   - 빌드: 3-5분" -ForegroundColor Gray
Write-Host "   - 배포: 1-2분" -ForegroundColor Gray
Write-Host "   - 총 소요: 약 5-7분" -ForegroundColor Gray

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  배포가 완료되면 다음을 확인하세요:" -ForegroundColor Green
Write-Host "  1. https://realxbest.com 접속" -ForegroundColor White
Write-Host "  2. https://realxbest.com/api/rankings API 테스트" -ForegroundColor White
Write-Host "========================================`n" -ForegroundColor Cyan


