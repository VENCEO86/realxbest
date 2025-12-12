# Render 배포 상태 확인 스크립트
# 환경 변수 설정 상태와 배포 상태를 확인합니다

Write-Host "`n🔍 Render 배포 상태 확인`n" -ForegroundColor Cyan

# 필수 환경 변수 목록
$requiredEnvVars = @(
    "YOUTUBE_API_KEYS",
    "YOUTUBE_API_KEY",
    "NEXT_PUBLIC_BASE_URL",
    "NEXT_PUBLIC_APP_URL",
    "NODE_ENV",
    "NEXT_TELEMETRY_DISABLED"
)

Write-Host "📋 필수 환경 변수 체크리스트:" -ForegroundColor Yellow
Write-Host ""

$missingVars = @()

foreach ($var in $requiredEnvVars) {
    Write-Host "  [$var]" -ForegroundColor Gray -NoNewline
    
    # 사용자가 설정했다고 한 변수들
    $configuredVars = @(
        "NEXT_PUBLIC_BASE_URL",
        "NODE_ENV",
        "YOUTUBE_API_KEY",
        "YOUTUBE_API_KEYS"
    )
    
    if ($configuredVars -contains $var) {
        Write-Host " ✅ 설정됨" -ForegroundColor Green
    }
    else {
        Write-Host " ⚠️  누락됨" -ForegroundColor Yellow
        $missingVars += $var
    }
}

Write-Host ""

# 누락된 환경 변수 확인
if ($missingVars.Count -gt 0) {
    Write-Host "⚠️  누락된 환경 변수:" -ForegroundColor Yellow
    foreach ($var in $missingVars) {
        Write-Host "  - $var" -ForegroundColor Red
        
        # 권장 값 제시
        switch ($var) {
            "NEXT_PUBLIC_APP_URL" {
                Write-Host "    권장 값: https://realxbest.com" -ForegroundColor Gray
            }
            "NEXT_TELEMETRY_DISABLED" {
                Write-Host "    권장 값: 1" -ForegroundColor Gray
            }
        }
    }
    Write-Host ""
    Write-Host "💡 Render 대시보드에서 위 환경 변수들을 추가하세요." -ForegroundColor Cyan
}
else {
    Write-Host "✅ 모든 필수 환경 변수가 설정되었습니다!" -ForegroundColor Green
}

Write-Host ""
Write-Host "🌐 배포 상태 확인:" -ForegroundColor Yellow
Write-Host "  서비스 URL: https://realxbest.com" -ForegroundColor Gray
Write-Host "  API 테스트: https://realxbest.com/api/rankings" -ForegroundColor Gray
Write-Host ""

# 사이트 접속 테스트
Write-Host "🔗 사이트 접속 테스트 중..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "https://realxbest.com" -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ 사이트 접속 성공 (HTTP $($response.StatusCode))" -ForegroundColor Green
    }
    else {
        Write-Host "  ⚠️  사이트 응답: HTTP $($response.StatusCode)" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "  ❌ 사이트 접속 실패: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "     배포가 아직 진행 중이거나 오류가 있을 수 있습니다." -ForegroundColor Gray
}

Write-Host ""
Write-Host "🔗 API 엔드포인트 테스트 중..." -ForegroundColor Cyan
try {
    $apiResponse = Invoke-WebRequest -Uri "https://realxbest.com/api/rankings" -Method Get -TimeoutSec 10 -UseBasicParsing -ErrorAction Stop
    if ($apiResponse.StatusCode -eq 200) {
        $jsonData = $apiResponse.Content | ConvertFrom-Json
        if ($jsonData.channels) {
            Write-Host "  ✅ API 응답 성공" -ForegroundColor Green
            Write-Host "  📊 채널 데이터: $($jsonData.channels.Count)개" -ForegroundColor Gray
        }
        else {
            Write-Host "  ⚠️  API 응답은 성공했지만 데이터 형식이 예상과 다릅니다." -ForegroundColor Yellow
        }
    }
}
catch {
    Write-Host "  ❌ API 접속 실패: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "     환경 변수나 배포 상태를 확인하세요." -ForegroundColor Gray
}

Write-Host ""
Write-Host "다음 단계:" -ForegroundColor Cyan
Write-Host "  1. Render 대시보드에서 배포 로그 확인" -ForegroundColor White
Write-Host "  2. 누락된 환경 변수가 있으면 추가" -ForegroundColor White
Write-Host "  3. Manual Deploy로 재배포 (필요시)" -ForegroundColor White
Write-Host ""

