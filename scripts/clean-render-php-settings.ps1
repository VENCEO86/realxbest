# Render에서 PHP 관련 설정 완전 제거 스크립트

$RENDER_API_KEY = $env:RENDER_API_KEY
$SERVICE_ID = if ($env:RENDER_SERVICE_ID) { $env:RENDER_SERVICE_ID } else { "srv-d48p38jipnbc73dkh990" }

Write-Host "🧹 Render PHP 설정 완전 제거 시작...`n" -ForegroundColor Cyan

if ([string]::IsNullOrWhiteSpace($RENDER_API_KEY)) {
    Write-Host "⚠️  RENDER_API_KEY가 없어 수동 수정 가이드를 제공합니다.`n" -ForegroundColor Yellow
    
    Write-Host "📋 Render 대시보드에서 수동으로 수정:`n" -ForegroundColor Cyan
    Write-Host "1. https://dashboard.render.com/web/$SERVICE_ID 접속" -ForegroundColor White
    Write-Host "2. Settings 탭 클릭" -ForegroundColor White
    Write-Host "3. 다음 항목들을 확인하고 삭제/수정:" -ForegroundColor White
    Write-Host "   - Start Command: 비워두기 (빈 값)" -ForegroundColor Yellow
    Write-Host "   - Build Command: 비워두기 (빈 값)" -ForegroundColor Yellow
    Write-Host "   - Runtime: Node (또는 Docker)" -ForegroundColor Yellow
    Write-Host "   - Environment Variables에서 PHP 관련 변수 삭제" -ForegroundColor Yellow
    Write-Host "4. 저장 후 Manual Deploy`n" -ForegroundColor White
    
    Write-Host "💡 API 키가 있으면 자동으로 수정할 수 있습니다:" -ForegroundColor Cyan
    Write-Host "   `$env:RENDER_API_KEY = 'your-api-key'" -ForegroundColor Gray
    Write-Host "   .\scripts\clean-render-php-settings.ps1`n" -ForegroundColor Gray
    exit 0
}

$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

try {
    Write-Host "📡 서비스 정보 조회 중..." -ForegroundColor Yellow
    $service = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "`n현재 설정 확인:" -ForegroundColor Cyan
    Write-Host "  Build Command: '$($service.service.buildCommand)'" -ForegroundColor Gray
    Write-Host "  Start Command: '$($service.service.startCommand)'" -ForegroundColor Gray
    Write-Host "  Runtime: $($service.service.runtime)" -ForegroundColor Gray
    Write-Host ""
    
    # PHP 관련 설정 제거
    $updateBody = @{}
    $needsUpdate = $false
    
    # Start Command에 php가 있으면 제거
    if ($service.service.startCommand -and $service.service.startCommand -match "php") {
        Write-Host "⚠️  Start Command에 PHP 발견: '$($service.service.startCommand)'" -ForegroundColor Yellow
        $updateBody.startCommand = ""
        $needsUpdate = $true
    }
    elseif ($service.service.startCommand) {
        Write-Host "⚠️  Start Command가 설정되어 있음: '$($service.service.startCommand)'" -ForegroundColor Yellow
        Write-Host "   Dockerfile을 사용하므로 비워야 합니다." -ForegroundColor Gray
        $updateBody.startCommand = ""
        $needsUpdate = $true
    }
    
    # Build Command에 php가 있으면 제거
    if ($service.service.buildCommand -and $service.service.buildCommand -match "php") {
        Write-Host "⚠️  Build Command에 PHP 발견: '$($service.service.buildCommand)'" -ForegroundColor Yellow
        $updateBody.buildCommand = ""
        $needsUpdate = $true
    }
    
    # Runtime이 PHP면 Node로 변경
    if ($service.service.runtime -eq "php" -or $service.service.runtime -eq "php7" -or $service.service.runtime -eq "php8") {
        Write-Host "⚠️  Runtime이 PHP로 설정됨: $($service.service.runtime)" -ForegroundColor Yellow
        $updateBody.runtime = "docker"
        $needsUpdate = $true
    }
    
    if ($needsUpdate) {
        Write-Host "`n🔧 설정 수정 중..." -ForegroundColor Yellow
        $body = $updateBody | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID" `
            -Method Patch `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "✅ PHP 설정 제거 완료!`n" -ForegroundColor Green
        
        Write-Host "수정된 설정:" -ForegroundColor Cyan
        if ($updateBody.startCommand -ne $null) {
            Write-Host "  Start Command: (비워짐)" -ForegroundColor Green
        }
        if ($updateBody.buildCommand -ne $null) {
            Write-Host "  Build Command: (비워짐)" -ForegroundColor Green
        }
        if ($updateBody.runtime) {
            Write-Host "  Runtime: $($updateBody.runtime)" -ForegroundColor Green
        }
        Write-Host ""
        
        Write-Host "📋 다음 단계:" -ForegroundColor Cyan
        Write-Host "  1. Render 대시보드에서 설정 확인" -ForegroundColor White
        Write-Host "  2. Environment Variables에서 PHP 관련 변수 확인 및 삭제" -ForegroundColor White
        Write-Host "  3. Manual Deploy 실행`n" -ForegroundColor White
    }
    else {
        Write-Host "✅ PHP 관련 설정이 없습니다. 설정이 올바릅니다.`n" -ForegroundColor Green
    }
    
    # 환경 변수 확인
    Write-Host "🔍 환경 변수 확인 중..." -ForegroundColor Yellow
    $envVars = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID/env-vars" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    $phpVars = $envVars | Where-Object { 
        $_.envVar.key -match "php|PHP|MYSQL|mysql" -or 
        $_.envVar.key -match "DB_|DATABASE_" -and $_.envVar.key -notmatch "DATABASE_URL"
    }
    
    if ($phpVars) {
        Write-Host "`n⚠️  PHP/MySQL 관련 환경 변수 발견:" -ForegroundColor Yellow
        foreach ($var in $phpVars) {
            Write-Host "  - $($var.envVar.key)" -ForegroundColor Red
        }
        Write-Host "`n💡 Render 대시보드 > Environment에서 위 변수들을 삭제하세요.`n" -ForegroundColor Cyan
    }
    else {
        Write-Host "✅ PHP 관련 환경 변수가 없습니다.`n" -ForegroundColor Green
    }
}
catch {
    Write-Host "`n❌ 오류 발생: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "상세: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
    Write-Host "`n💡 수동으로 수정하세요:" -ForegroundColor Yellow
    Write-Host "  Render 대시보드 > Settings에서 Start Command와 Build Command를 비우세요`n" -ForegroundColor White
}


