# Render 설정 자동 수정 스크립트
# Start Command를 제거하여 Dockerfile CMD 사용

$RENDER_API_KEY = $env:RENDER_API_KEY
$SERVICE_ID = if ($env:RENDER_SERVICE_ID) { $env:RENDER_SERVICE_ID } else { "srv-d48p38jipnbc73dkh990" }

if ([string]::IsNullOrWhiteSpace($RENDER_API_KEY)) {
    Write-Host "❌ RENDER_API_KEY 환경 변수가 설정되지 않았습니다." -ForegroundColor Red
    Write-Host ""
    Write-Host "사용 방법:" -ForegroundColor Cyan
    Write-Host "  1. Render 대시보드 > Account Settings > API Keys에서 API 키 생성" -ForegroundColor Gray
    Write-Host "  2. `$env:RENDER_API_KEY = 'your-api-key-here'" -ForegroundColor Gray
    Write-Host "  3. .\scripts\fix-render-settings.ps1" -ForegroundColor Gray
    exit 1
}

Write-Host "🔧 Render 서비스 설정 수정 중..." -ForegroundColor Cyan
Write-Host "서비스 ID: $SERVICE_ID" -ForegroundColor Gray
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

# 서비스 정보 가져오기
try {
    Write-Host "서비스 정보 조회 중..." -ForegroundColor Yellow
    $service = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "현재 설정:" -ForegroundColor Cyan
    Write-Host "  Build Command: $($service.service.buildCommand)" -ForegroundColor Gray
    Write-Host "  Start Command: $($service.service.startCommand)" -ForegroundColor Gray
    Write-Host ""
    
    # Start Command 제거 (Dockerfile CMD 사용)
    $body = @{
        startCommand = ""
        buildCommand = ""
    } | ConvertTo-Json
    
    Write-Host "Start Command 제거 중..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID" `
        -Method Patch `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ Start Command 제거 완료!" -ForegroundColor Green
    Write-Host ""
    Write-Host "다음 단계:" -ForegroundColor Cyan
    Write-Host "  1. Render 대시보드에서 설정 확인" -ForegroundColor White
    Write-Host "  2. Manual Deploy 실행" -ForegroundColor White
}
catch {
    Write-Host "❌ 오류 발생: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "상세: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "💡 수동으로 수정하는 방법:" -ForegroundColor Yellow
    Write-Host "  Render 대시보드 > Settings > Start Command를 비워두세요" -ForegroundColor White
}

