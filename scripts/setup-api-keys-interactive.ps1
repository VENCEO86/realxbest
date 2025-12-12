# YouTube API 키 대화형 설정 스크립트
# 단계별로 API 키를 입력받아 자동 설정

Write-Host "=== YouTube API 키 설정 (대화형) ===" -ForegroundColor Cyan
Write-Host ""

$apiKeys = @()

# 기존 API 키 확인
$existingKey = $env:YOUTUBE_API_KEY
if ($existingKey) {
    Write-Host "✅ 기존 API 키 발견: $($existingKey.Substring(0, 20))..." -ForegroundColor Green
    $useExisting = Read-Host "기존 키를 사용하시겠습니까? (y/n)"
    if ($useExisting -eq 'y' -or $useExisting -eq 'Y') {
        $apiKeys += $existingKey
        Write-Host "✅ 기존 키 추가됨" -ForegroundColor Green
        Write-Host ""
    }
}

# 추가 API 키 입력
Write-Host "📋 추가 API 키 입력 (최대 3개 권장)" -ForegroundColor Yellow
Write-Host "   각 Google 계정에서 발급받은 API 키를 입력하세요" -ForegroundColor Gray
Write-Host "   입력을 마치려면 빈 줄에서 Enter를 누르세요" -ForegroundColor Gray
Write-Host ""

$keyNumber = $apiKeys.Count + 1
while ($true) {
    $key = Read-Host "API 키 #$keyNumber (Enter로 종료)"
    
    if ([string]::IsNullOrWhiteSpace($key)) {
        break
    }
    
    $key = $key.Trim()
    
    # 기본적인 유효성 검사 (AIzaSy로 시작하는지)
    if ($key -notmatch '^AIzaSy') {
        Write-Host "⚠️  경고: API 키 형식이 올바르지 않을 수 있습니다." -ForegroundColor Yellow
        $continue = Read-Host "계속하시겠습니까? (y/n)"
        if ($continue -ne 'y' -and $continue -ne 'Y') {
            continue
        }
    }
    
    $apiKeys += $key
    Write-Host "✅ API 키 #$keyNumber 추가됨" -ForegroundColor Green
    Write-Host ""
    
    $keyNumber++
    
    if ($apiKeys.Count -ge 5) {
        Write-Host "⚠️  최대 5개까지 입력 가능합니다." -ForegroundColor Yellow
        break
    }
}

if ($apiKeys.Count -eq 0) {
    Write-Host "❌ API 키가 입력되지 않았습니다." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ 입력된 API 키: $($apiKeys.Count)개" -ForegroundColor Green
$apiKeys | ForEach-Object { 
    $index = $apiKeys.IndexOf($_) + 1
    Write-Host "   [$index] $($_.Substring(0, 20))..." -ForegroundColor Gray 
}

# 환경 변수 설정
$keysString = $apiKeys -join ','
$env:YOUTUBE_API_KEYS = $keysString
$env:YOUTUBE_API_KEY = $apiKeys[0]  # 첫 번째 키를 기본 키로도 설정

Write-Host ""
Write-Host "✅ 환경 변수 설정 완료!" -ForegroundColor Green
Write-Host ""

# 할당량 계산
$totalQuota = $apiKeys.Count * 10000
Write-Host "📊 예상 할당량:" -ForegroundColor Cyan
Write-Host "   - API 키 개수: $($apiKeys.Count)개" -ForegroundColor White
Write-Host "   - 각 키당 할당량: 10,000 units" -ForegroundColor White
Write-Host "   - 총 할당량: $totalQuota units" -ForegroundColor White
Write-Host "   - 74개국 수집 예상 소요: 약 15,000-20,000 units" -ForegroundColor Gray
Write-Host ""

if ($totalQuota -ge 20000) {
    Write-Host "✅ 충분한 할당량입니다! 74개국 모두 수집 가능합니다." -ForegroundColor Green
} elseif ($totalQuota -ge 10000) {
    Write-Host "⚠️  할당량이 부족할 수 있습니다. 추가 키를 권장합니다." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🚀 다음 단계:" -ForegroundColor Yellow
Write-Host "   npm run collect-country-channels" -ForegroundColor Green
Write-Host ""



