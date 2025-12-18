# 로컬 개발용 환경 변수 설정 스크립트

Write-Host "🔧 로컬 개발용 환경 변수 설정" -ForegroundColor Cyan
Write-Host ""

# .env.local 파일 경로
$envFile = ".env.local"

# Render PostgreSQL DATABASE_URL (MANUAL_DATABASE_URL_SETUP.md에서 가져옴)
# 사용자가 Render에서 직접 가져와야 합니다
$databaseUrl = "postgresql://realxbest_user:La71vp2YVSgoUN1QLsdqRtV40wngw0CC@dpg-d4vpt4umcj7s73ds1uj0-a.oregon-postgres.render.com/realxbest"

Write-Host "📋 DATABASE_URL 설정 방법:" -ForegroundColor Yellow
Write-Host "   1. Render 대시보드: https://dashboard.render.com" -ForegroundColor Gray
Write-Host "   2. PostgreSQL 데이터베이스 선택" -ForegroundColor Gray
Write-Host "   3. 'Connection Info' → 'External Connection String' 복사" -ForegroundColor Gray
Write-Host ""

# 사용자에게 확인
$useDefault = Read-Host "기본 DATABASE_URL을 사용하시겠습니까? (Y/N, 기본값: Y)"

if ($useDefault -eq "" -or $useDefault -eq "Y" -or $useDefault -eq "y") {
    Write-Host ""
    Write-Host "✅ 기본 DATABASE_URL 사용: $($databaseUrl.Substring(0, 50))..." -ForegroundColor Green
} else {
    Write-Host ""
    $customUrl = Read-Host "DATABASE_URL을 입력하세요"
    if ($customUrl -and $customUrl.Trim() -ne "") {
        $databaseUrl = $customUrl.Trim()
        Write-Host "✅ 사용자 입력 DATABASE_URL 사용" -ForegroundColor Green
    } else {
        Write-Host "⚠️ DATABASE_URL이 입력되지 않았습니다" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""
Write-Host "📝 .env.local 파일 업데이트 중..." -ForegroundColor Yellow

# 기존 .env.local 파일 읽기
$content = @()
if (Test-Path $envFile) {
    $content = Get-Content $envFile
    Write-Host "   ✅ 기존 .env.local 파일 발견" -ForegroundColor Gray
} else {
    Write-Host "   ℹ️ 새 .env.local 파일 생성" -ForegroundColor Gray
}

# DATABASE_URL 업데이트/추가
$updated = $false
$newContent = @()

foreach ($line in $content) {
    if ($line -match "^DATABASE_URL=") {
        $newContent += "DATABASE_URL=$databaseUrl"
        $updated = $true
        Write-Host "   ✅ 기존 DATABASE_URL 업데이트" -ForegroundColor Gray
    } else {
        $newContent += $line
    }
}

if (-not $updated) {
    $newContent += "DATABASE_URL=$databaseUrl"
    Write-Host "   ✅ 새 DATABASE_URL 추가" -ForegroundColor Gray
}

# YOUTUBE_API_KEYS 확인
$hasYoutubeKeys = $false
foreach ($line in $newContent) {
    if ($line -match "^YOUTUBE_API_KEYS=") {
        $hasYoutubeKeys = $true
        break
    }
}

if (-not $hasYoutubeKeys) {
    Write-Host ""
    Write-Host "⚠️ YOUTUBE_API_KEYS가 .env.local에 없습니다" -ForegroundColor Yellow
    Write-Host "   기존 .env.local에서 확인하거나 수동으로 추가하세요" -ForegroundColor Gray
}

# 파일 저장
$newContent | Set-Content $envFile -Encoding UTF8
Write-Host ""
Write-Host "✅ .env.local 파일 업데이트 완료!" -ForegroundColor Green
Write-Host ""

# 확인
Write-Host "📋 설정된 환경 변수:" -ForegroundColor Cyan
Get-Content $envFile | Select-String -Pattern "DATABASE_URL|YOUTUBE_API" | ForEach-Object {
    $line = $_.Line
    if ($line -match "DATABASE_URL=") {
        $url = $line -replace "DATABASE_URL=", ""
        Write-Host "   DATABASE_URL: $($url.Substring(0, [Math]::Min(60, $url.Length)))..." -ForegroundColor Gray
    } elseif ($line -match "YOUTUBE_API") {
        Write-Host "   $line" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "🚀 다음 단계:" -ForegroundColor Cyan
Write-Host "   1. 데이터베이스 연결 테스트: npm run check-db" -ForegroundColor Gray
Write-Host "   2. 데이터 수집 실행: npm run collect:daily" -ForegroundColor Gray
Write-Host ""


