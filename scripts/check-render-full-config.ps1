# Render 전체 설정 확인 및 PHP 완전 제거 스크립트

$RENDER_API_KEY = $env:RENDER_API_KEY
$SERVICE_ID = if ($env:RENDER_SERVICE_ID) { $env:RENDER_SERVICE_ID } else { "srv-d48p38jipnbc73dkh990" }

Write-Host "`n🔍 Render 전체 설정 확인 및 PHP 제거 시작...`n" -ForegroundColor Cyan

if ([string]::IsNullOrWhiteSpace($RENDER_API_KEY)) {
    Write-Host "⚠️  API 키 없음 - 수동 확인 가이드 제공`n" -ForegroundColor Yellow
    Write-Host "📋 Render 대시보드에서 확인할 항목:`n" -ForegroundColor Cyan
    
    Write-Host "1. Settings 탭:" -ForegroundColor White
    Write-Host "   ✅ Dockerfile Path: ./Dockerfile" -ForegroundColor Green
    Write-Host "   ✅ Docker Build Context: ." -ForegroundColor Green
    Write-Host "   ✅ Docker Command: (비워두기)" -ForegroundColor Green
    Write-Host "   ✅ Pre-Deploy Command: (비워두기)" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "2. Environment Variables 탭:" -ForegroundColor White
    Write-Host "   ❌ PHP 관련 변수 삭제:" -ForegroundColor Red
    Write-Host "      - PHP_VERSION" -ForegroundColor Gray
    Write-Host "      - MYSQL_* (모든 MySQL 변수)" -ForegroundColor Gray
    Write-Host "      - 기타 PHP 관련 변수" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "3. Build & Start Commands:" -ForegroundColor White
    Write-Host "   ✅ Build Command: (비워두기)" -ForegroundColor Green
    Write-Host "   ✅ Start Command: (비워두기)" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "💡 API 키가 있으면 자동으로 확인 및 수정 가능:" -ForegroundColor Cyan
    Write-Host "   `$env:RENDER_API_KEY = 'your-api-key'" -ForegroundColor Gray
    Write-Host "   .\scripts\check-render-full-config.ps1`n" -ForegroundColor Gray
    exit 0
}

$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Content-Type" = "application/json"
    "Accept" = "application/json"
}

try {
    Write-Host "📡 서비스 정보 조회 중...`n" -ForegroundColor Yellow
    
    # 서비스 정보
    $service = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    Write-Host "=== 서비스 설정 ===" -ForegroundColor Cyan
    Write-Host "  Name: $($service.service.name)" -ForegroundColor Gray
    Write-Host "  Type: $($service.service.type)" -ForegroundColor Gray
    Write-Host "  Runtime: $($service.service.runtime)" -ForegroundColor Gray
    Write-Host "  Build Command: '$($service.service.buildCommand)'" -ForegroundColor Gray
    Write-Host "  Start Command: '$($service.service.startCommand)'" -ForegroundColor Gray
    Write-Host ""
    
    # 환경 변수 조회
    Write-Host "📋 환경 변수 확인 중..." -ForegroundColor Yellow
    $envVars = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID/env-vars" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    $allVars = @()
    if ($envVars -is [array]) {
        $allVars = $envVars
    } elseif ($envVars.envVars) {
        $allVars = $envVars.envVars
    }
    
    Write-Host "`n=== 환경 변수 목록 ===" -ForegroundColor Cyan
    $phpVars = @()
    $mysqlVars = @()
    
    foreach ($var in $allVars) {
        $key = if ($var.envVar) { $var.envVar.key } else { $var.key }
        $value = if ($var.envVar) { $var.envVar.value } else { $var.value }
        
        Write-Host "  $key" -ForegroundColor Gray
        
        # PHP 관련 변수 체크
        if ($key -match "php|PHP" -or $key -eq "PHP_VERSION") {
            $phpVars += $key
            Write-Host "    ⚠️  PHP 관련 변수 발견!" -ForegroundColor Red
        }
        
        # MySQL 관련 변수 체크 (DATABASE_URL 제외)
        if ($key -match "MYSQL|mysql" -or ($key -match "DB_" -and $key -notmatch "DATABASE_URL")) {
            $mysqlVars += $key
            Write-Host "    ⚠️  MySQL 관련 변수 발견!" -ForegroundColor Red
        }
    }
    
    Write-Host ""
    
    # 수정할 항목 확인
    $updateBody = @{}
    $needsUpdate = $false
    
    # Start Command 확인
    if ($service.service.startCommand -and $service.service.startCommand -ne "") {
        if ($service.service.startCommand -match "php") {
            Write-Host "❌ Start Command에 PHP 발견: '$($service.service.startCommand)'" -ForegroundColor Red
        } else {
            Write-Host "⚠️  Start Command가 설정되어 있음: '$($service.service.startCommand)'" -ForegroundColor Yellow
            Write-Host "   Dockerfile을 사용하므로 비워야 합니다." -ForegroundColor Gray
        }
        $updateBody.startCommand = ""
        $needsUpdate = $true
    }
    
    # Build Command 확인
    if ($service.service.buildCommand -and $service.service.buildCommand -ne "") {
        if ($service.service.buildCommand -match "php") {
            Write-Host "❌ Build Command에 PHP 발견: '$($service.service.buildCommand)'" -ForegroundColor Red
        } else {
            Write-Host "⚠️  Build Command가 설정되어 있음: '$($service.service.buildCommand)'" -ForegroundColor Yellow
        }
        $updateBody.buildCommand = ""
        $needsUpdate = $true
    }
    
    # Runtime 확인
    if ($service.service.runtime -match "php|PHP") {
        Write-Host "❌ Runtime이 PHP로 설정됨: $($service.service.runtime)" -ForegroundColor Red
        $updateBody.runtime = "docker"
        $needsUpdate = $true
    }
    
    # 수정 실행
    if ($needsUpdate) {
        Write-Host "`n🔧 설정 수정 중..." -ForegroundColor Yellow
        $body = $updateBody | ConvertTo-Json
        
        $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID" `
            -Method Patch `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "✅ 설정 수정 완료!`n" -ForegroundColor Green
    } else {
        Write-Host "✅ 서비스 설정이 올바릅니다.`n" -ForegroundColor Green
    }
    
    # PHP/MySQL 변수 요약
    if ($phpVars.Count -gt 0 -or $mysqlVars.Count -gt 0) {
        Write-Host "`n⚠️  삭제가 필요한 변수:" -ForegroundColor Yellow
        foreach ($var in ($phpVars + $mysqlVars)) {
            Write-Host "  - $var" -ForegroundColor Red
        }
        Write-Host "`n💡 Render 대시보드 > Environment에서 위 변수들을 삭제하세요.`n" -ForegroundColor Cyan
    } else {
        Write-Host "✅ PHP/MySQL 관련 환경 변수가 없습니다.`n" -ForegroundColor Green
    }
    
    # 최종 체크리스트
    Write-Host "=== 최종 체크리스트 ===" -ForegroundColor Cyan
    Write-Host "  [$(if (-not $service.service.startCommand -or $service.service.startCommand -eq '') { '✅' } else { '❌' })] Start Command: 비어있음" -ForegroundColor $(if (-not $service.service.startCommand -or $service.service.startCommand -eq '') { 'Green' } else { 'Red' })
    Write-Host "  [$(if (-not $service.service.buildCommand -or $service.service.buildCommand -eq '') { '✅' } else { '❌' })] Build Command: 비어있음" -ForegroundColor $(if (-not $service.service.buildCommand -or $service.service.buildCommand -eq '') { 'Green' } else { 'Red' })
    Write-Host "  [$(if ($service.service.runtime -notmatch 'php') { '✅' } else { '❌' })] Runtime: PHP가 아님" -ForegroundColor $(if ($service.service.runtime -notmatch 'php') { 'Green' } else { 'Red' })
    Write-Host "  [$(if ($phpVars.Count -eq 0 -and $mysqlVars.Count -eq 0) { '✅' } else { '❌' })] PHP/MySQL 환경 변수: 없음" -ForegroundColor $(if ($phpVars.Count -eq 0 -and $mysqlVars.Count -eq 0) { 'Green' } else { 'Red' })
    Write-Host ""
    
    Write-Host "📋 다음 단계:" -ForegroundColor Cyan
    Write-Host "  1. 위 체크리스트에서 ❌ 항목이 있으면 수정" -ForegroundColor White
    Write-Host "  2. Render 대시보드에서 최종 확인" -ForegroundColor White
    Write-Host "  3. Manual Deploy 실행`n" -ForegroundColor White
    
}
catch {
    Write-Host "`n❌ 오류 발생: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "상세: $($_.ErrorDetails.Message)" -ForegroundColor Gray
    }
    Write-Host "`n💡 수동으로 확인하세요: https://dashboard.render.com/web/$SERVICE_ID`n" -ForegroundColor Yellow
}

