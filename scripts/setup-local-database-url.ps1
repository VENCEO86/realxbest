# 로컬 개발용 DATABASE_URL 설정 스크립트

Write-Host "🔧 로컬 개발용 DATABASE_URL 설정" -ForegroundColor Cyan
Write-Host ""

# GitHub Secrets에서 DATABASE_URL 가져오기 시도
Write-Host "1. GitHub Secrets에서 DATABASE_URL 확인 중..." -ForegroundColor Yellow
try {
    $dbUrl = gh secret get DATABASE_URL --repo VENCEO86/realxbest 2>&1
    if ($LASTEXITCODE -eq 0 -and $dbUrl -notmatch "error|not found") {
        Write-Host "   ✅ GitHub Secrets에서 DATABASE_URL 발견" -ForegroundColor Green
        Write-Host "   DATABASE_URL: $($dbUrl.Substring(0, [Math]::Min(50, $dbUrl.Length)))..." -ForegroundColor Gray
        
        # .env.local 파일에 추가/업데이트
        $envFile = ".env.local"
        $content = @()
        
        if (Test-Path $envFile) {
            $content = Get-Content $envFile
            # 기존 DATABASE_URL 제거
            $content = $content | Where-Object { $_ -notmatch "^DATABASE_URL=" }
        }
        
        # 새로운 DATABASE_URL 추가
        $content += "DATABASE_URL=$dbUrl"
        
        # 파일 저장
        $content | Set-Content $envFile -Encoding UTF8
        Write-Host "   ✅ .env.local 파일에 DATABASE_URL 추가 완료" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 다음 단계:" -ForegroundColor Cyan
        Write-Host "   1. .env.local 파일 확인: Get-Content .env.local" -ForegroundColor Gray
        Write-Host "   2. 데이터 수집 실행: npm run collect:daily" -ForegroundColor Gray
        exit 0
    } else {
        Write-Host "   ⚠️ GitHub Secrets에서 DATABASE_URL을 찾을 수 없습니다" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ⚠️ GitHub CLI 오류: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "2. Render에서 DATABASE_URL 가져오기 (수동)" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Render에서 DATABASE_URL 가져오는 방법:" -ForegroundColor Cyan
Write-Host "   1. Render 대시보드 접속: https://dashboard.render.com" -ForegroundColor Gray
Write-Host "   2. PostgreSQL 데이터베이스 선택" -ForegroundColor Gray
Write-Host "   3. 'Connection Info' 클릭" -ForegroundColor Gray
Write-Host "   4. 'External Connection String' 복사" -ForegroundColor Gray
Write-Host ""
Write-Host "   예시 형식:" -ForegroundColor Gray
Write-Host "   postgresql://user:password@host:5432/database?schema=public" -ForegroundColor DarkGray
Write-Host ""

# 사용자 입력 받기
$userInput = Read-Host "DATABASE_URL을 입력하세요 (또는 Enter로 건너뛰기)"

if ($userInput -and $userInput.Trim() -ne "") {
    $dbUrl = $userInput.Trim()
    
    # .env.local 파일에 추가/업데이트
    $envFile = ".env.local"
    $content = @()
    
    if (Test-Path $envFile) {
        $content = Get-Content $envFile
        # 기존 DATABASE_URL 제거
        $content = $content | Where-Object { $_ -notmatch "^DATABASE_URL=" }
    }
    
    # 새로운 DATABASE_URL 추가
    $content += "DATABASE_URL=$dbUrl"
    
    # 파일 저장
    $content | Set-Content $envFile -Encoding UTF8
    Write-Host ""
    Write-Host "✅ .env.local 파일에 DATABASE_URL 추가 완료" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 다음 단계:" -ForegroundColor Cyan
    Write-Host "   1. .env.local 파일 확인: Get-Content .env.local" -ForegroundColor Gray
    Write-Host "   2. 데이터 수집 실행: npm run collect:daily" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "⚠️ DATABASE_URL 설정이 취소되었습니다" -ForegroundColor Yellow
    Write-Host "   나중에 .env.local 파일에 직접 추가하세요" -ForegroundColor Gray
}


