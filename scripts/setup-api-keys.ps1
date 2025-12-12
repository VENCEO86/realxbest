# YouTube API 키 자동 설정 스크립트
# 여러 API 키를 쉼표로 구분하여 입력하면 자동으로 환경 변수 설정

Write-Host "=== YouTube API 키 설정 ===" -ForegroundColor Cyan
Write-Host ""

# 기존 API 키 확인
$existingKey = $env:YOUTUBE_API_KEY
if ($existingKey) {
    Write-Host "✅ 기존 API 키 발견: $($existingKey.Substring(0, 20))..." -ForegroundColor Green
    Write-Host ""
}

Write-Host "📋 API 키 입력 방법:" -ForegroundColor Yellow
Write-Host "  1. 기존 키 1개만 사용: 기존키" -ForegroundColor White
Write-Host "  2. 여러 키 사용 (추천): 기존키,새키1,새키2" -ForegroundColor White
Write-Host "  3. 쉼표로 구분하여 입력" -ForegroundColor White
Write-Host ""

# API 키 입력 받기
$apiKeysInput = Read-Host "API 키 입력 (쉼표로 구분)"

if ([string]::IsNullOrWhiteSpace($apiKeysInput)) {
    Write-Host "❌ API 키가 입력되지 않았습니다." -ForegroundColor Red
    exit 1
}

# 쉼표로 분리 및 공백 제거
$apiKeys = $apiKeysInput -split ',' | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' }

if ($apiKeys.Count -eq 0) {
    Write-Host "❌ 유효한 API 키가 없습니다." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ 입력된 API 키: $($apiKeys.Count)개" -ForegroundColor Green
$apiKeys | ForEach-Object { Write-Host "   - $($_.Substring(0, 20))..." -ForegroundColor Gray }

# 환경 변수 설정
$keysString = $apiKeys -join ','
$env:YOUTUBE_API_KEYS = $keysString
$env:YOUTUBE_API_KEY = $apiKeys[0]  # 첫 번째 키를 기본 키로도 설정

Write-Host ""
Write-Host "✅ 환경 변수 설정 완료!" -ForegroundColor Green
Write-Host "   YOUTUBE_API_KEYS = $keysString" -ForegroundColor Gray
Write-Host ""

# 할당량 계산
$totalQuota = $apiKeys.Count * 10000
Write-Host "📊 예상 할당량:" -ForegroundColor Cyan
Write-Host "   - API 키 개수: $($apiKeys.Count)개" -ForegroundColor White
Write-Host "   - 각 키당 할당량: 10,000 units" -ForegroundColor White
Write-Host "   - 총 할당량: $totalQuota units" -ForegroundColor White
Write-Host ""

# .env 파일에도 저장 (선택사항)
$saveToFile = Read-Host ".env 파일에도 저장하시겠습니까? (y/n)"
if ($saveToFile -eq 'y' -or $saveToFile -eq 'Y') {
    $envFile = ".env.local"
    $envContent = @"
# YouTube API Keys (쉼표로 구분)
YOUTUBE_API_KEYS=$keysString
YOUTUBE_API_KEY=$($apiKeys[0])
"@
    
    $envContent | Out-File -FilePath $envFile -Encoding utf8 -Force
    Write-Host "✅ .env.local 파일에 저장 완료!" -ForegroundColor Green
    Write-Host ""
}

Write-Host "🚀 다음 단계:" -ForegroundColor Yellow
Write-Host "   npm run collect-country-channels" -ForegroundColor Green
Write-Host ""



