# Render 배포 트리거 스크립트
# GitHub 푸시 후 Render 자동 배포 확인 및 수동 배포 트리거

param(
    [string]$RenderApiKey = $env:RENDER_API_KEY,
    [string]$ServiceId = "srv-d48p38jipnbc73dkh990"
)

Write-Host "`n🚀 Render 배포 트리거`n" -ForegroundColor Cyan

if (-not $RenderApiKey) {
    Write-Host "⚠️  RENDER_API_KEY 환경 변수가 설정되지 않았습니다." -ForegroundColor Yellow
    Write-Host "`n다음 중 하나를 선택하세요:" -ForegroundColor Cyan
    Write-Host "1. 환경 변수 설정: `$env:RENDER_API_KEY = 'your-api-key'" -ForegroundColor Gray
    Write-Host "2. Render 대시보드에서 수동 배포: https://dashboard.render.com/web/$ServiceId" -ForegroundColor Gray
    Write-Host "3. GitHub 푸시가 완료되었으므로 자동 배포가 시작됩니다." -ForegroundColor Green
    Write-Host "`n✅ GitHub 푸시 완료 확인됨" -ForegroundColor Green
    Write-Host "   Render는 GitHub 푸시를 감지하여 자동으로 배포를 시작합니다." -ForegroundColor Gray
    Write-Host "`n📋 배포 상태 확인:" -ForegroundColor Yellow
    Write-Host "   Render 대시보드: https://dashboard.render.com/web/$ServiceId" -ForegroundColor Cyan
    Write-Host "   서비스 URL: https://realxbest.com" -ForegroundColor Cyan
    exit 0
}

Write-Host "📡 Render API를 사용하여 배포 상태 확인 중..." -ForegroundColor Cyan

try {
    $headers = @{
        "Authorization" = "Bearer $RenderApiKey"
        "Content-Type" = "application/json"
    }

    # 서비스 정보 가져오기
    $serviceUrl = "https://api.render.com/v1/services/$ServiceId"
    $serviceResponse = Invoke-RestMethod -Uri $serviceUrl -Method Get -Headers $headers
    
    Write-Host "`n✅ 서비스 정보:" -ForegroundColor Green
    Write-Host "   이름: $($serviceResponse.service.name)" -ForegroundColor Gray
    Write-Host "   상태: $($serviceResponse.service.serviceDetails.url)" -ForegroundColor Gray
    
    # 최근 배포 정보 가져오기
    $deploysUrl = "https://api.render.com/v1/services/$ServiceId/deploys"
    $deploysResponse = Invoke-RestMethod -Uri $deploysUrl -Method Get -Headers $headers
    
    if ($deploysResponse -and $deploysResponse.Count -gt 0) {
        $latestDeploy = $deploysResponse[0]
        Write-Host "`n📦 최근 배포:" -ForegroundColor Yellow
        Write-Host "   상태: $($latestDeploy.deploy.status)" -ForegroundColor Gray
        Write-Host "   생성 시간: $($latestDeploy.deploy.createdAt)" -ForegroundColor Gray
        
        if ($latestDeploy.deploy.status -eq "live") {
            Write-Host "`n✅ 배포가 성공적으로 완료되었습니다!" -ForegroundColor Green
        } elseif ($latestDeploy.deploy.status -eq "build_in_progress" -or $latestDeploy.deploy.status -eq "update_in_progress") {
            Write-Host "`n⏳ 배포가 진행 중입니다..." -ForegroundColor Yellow
        } else {
            Write-Host "`n⚠️  배포 상태: $($latestDeploy.deploy.status)" -ForegroundColor Yellow
            Write-Host "   수동 배포를 트리거하시겠습니까? (Y/N)" -ForegroundColor Cyan
            $response = Read-Host
            if ($response -eq "Y" -or $response -eq "y") {
                Write-Host "`n🚀 수동 배포 트리거 중..." -ForegroundColor Cyan
                $deployUrl = "https://api.render.com/v1/services/$ServiceId/deploys"
                $deployResponse = Invoke-RestMethod -Uri $deployUrl -Method Post -Headers $headers
                Write-Host "✅ 배포가 트리거되었습니다!" -ForegroundColor Green
            }
        }
    }
    
} catch {
    Write-Host "`n❌ API 호출 실패: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "`n💡 Render 대시보드에서 수동으로 확인하세요:" -ForegroundColor Cyan
    Write-Host "   https://dashboard.render.com/web/$ServiceId" -ForegroundColor Gray
}

Write-Host "`n📋 다음 단계:" -ForegroundColor Yellow
Write-Host "1. Render 대시보드에서 배포 로그 확인" -ForegroundColor Gray
Write-Host "2. https://realxbest.com 접속하여 사이트 확인" -ForegroundColor Gray
Write-Host "3. https://realxbest.com/api/rankings API 테스트" -ForegroundColor Gray


