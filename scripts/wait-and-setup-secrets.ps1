# GitHub 로그인 대기 및 Secrets 자동 설정 스크립트

param(
    [string]$Repository = "VENCEO86/realxbest",
    [string]$YouTubeApiKeys = "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  GitHub Secrets 자동 설정" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# GitHub CLI 확인
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI가 설치되지 않았습니다." -ForegroundColor Red
    exit 1
}

Write-Host "✅ GitHub CLI 확인됨" -ForegroundColor Green

# 인증 상태 확인
Write-Host "`n🔐 GitHub 인증 상태 확인 중..." -ForegroundColor Cyan
$authStatus = gh auth status 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  GitHub에 로그인되지 않았습니다." -ForegroundColor Yellow
    Write-Host "`n로그인을 시작합니다..." -ForegroundColor Cyan
    
    # 로그인 시작
    gh auth login --web 2>&1 | Out-Null
    
    Write-Host "`n브라우저가 열렸습니다." -ForegroundColor Green
    Write-Host "로그인 코드를 입력하고 'Authorize'를 클릭해주세요." -ForegroundColor Yellow
    Write-Host "`n인증 완료를 기다리는 중... (최대 5분)" -ForegroundColor Gray
    
    # 인증 완료 대기 (최대 5분)
    $maxAttempts = 100
    $attempt = 0
    $authenticated = $false
    
    while ($attempt -lt $maxAttempts -and -not $authenticated) {
        Start-Sleep -Seconds 3
        $attempt++
        
        $authCheck = gh auth status 2>&1
        if ($LASTEXITCODE -eq 0) {
            $authenticated = $true
            Write-Host "`n✅ GitHub 인증 완료!" -ForegroundColor Green
            break
        }
        
        if ($attempt % 10 -eq 0) {
            Write-Host "." -NoNewline -ForegroundColor Gray
        }
    }
    
    if (-not $authenticated) {
        Write-Host "`n❌ 인증 시간 초과" -ForegroundColor Red
        Write-Host "수동으로 로그인하거나 나중에 다시 시도해주세요." -ForegroundColor Yellow
        exit 1
    }
} else {
    Write-Host "✅ GitHub 인증 확인됨" -ForegroundColor Green
}

# Secrets 설정 시작
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Secrets 설정 시작" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# YOUTUBE_API_KEYS 설정
Write-Host "📝 YOUTUBE_API_KEYS 설정 중..." -ForegroundColor Yellow
gh secret set YOUTUBE_API_KEYS --repo $Repository --body $YouTubeApiKeys 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ YOUTUBE_API_KEYS 설정 완료!" -ForegroundColor Green
} else {
    Write-Host "   ❌ YOUTUBE_API_KEYS 설정 실패" -ForegroundColor Red
    exit 1
}

# 설정된 Secrets 확인
Write-Host "`n📋 설정된 Secrets:" -ForegroundColor Cyan
gh secret list --repo $Repository 2>&1

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ YOUTUBE_API_KEYS 설정 완료!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. DATABASE_URL 설정 (Render에서 가져와야 함)" -ForegroundColor White
Write-Host "   Render 대시보드 > PostgreSQL > Connection Info > External Connection String" -ForegroundColor Gray
Write-Host "2. DATABASE_URL 설정 명령어:" -ForegroundColor White
Write-Host "   gh secret set DATABASE_URL --repo $Repository --body `"your-database-url`"" -ForegroundColor Gray
Write-Host "`n또는 웹에서 수동 설정:" -ForegroundColor Gray
Write-Host "   https://github.com/$Repository/settings/secrets/actions" -ForegroundColor Cyan

