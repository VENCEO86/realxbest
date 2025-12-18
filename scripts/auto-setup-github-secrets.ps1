# GitHub Secrets 완전 자동 설정 스크립트
# GitHub CLI 또는 수동 설정 안내

param(
    [string]$DatabaseUrl = "",
    [string]$YouTubeApiKeys = "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU",
    [string]$Repository = "VENCEO86/realxbest"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  GitHub Secrets 자동 설정" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# GitHub CLI 확인
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue

if ($ghInstalled) {
    Write-Host "✅ GitHub CLI 발견됨 - 자동 설정 가능!" -ForegroundColor Green
    
    # GitHub CLI 로그인 확인
    $authStatus = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "`n⚠️  GitHub에 로그인되지 않았습니다." -ForegroundColor Yellow
        Write-Host "로그인을 진행합니다..." -ForegroundColor Cyan
        gh auth login
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ 로그인 실패 - 수동 설정으로 전환" -ForegroundColor Red
            $ghInstalled = $false
        }
    }
    
    if ($ghInstalled) {
        Write-Host "✅ GitHub 인증 확인됨" -ForegroundColor Green
        
        # DATABASE_URL 확인
        if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
            Write-Host "`n⚠️  DATABASE_URL이 필요합니다." -ForegroundColor Yellow
            Write-Host "Render 대시보드에서 PostgreSQL 연결 문자열을 가져오세요." -ForegroundColor Gray
            Write-Host "형식: postgresql://user:password@host:5432/dbname?schema=public" -ForegroundColor Gray
            $DatabaseUrl = Read-Host "DATABASE_URL 입력"
        }
        
        # Secrets 설정
        Write-Host "`n📝 Secrets 설정 중..." -ForegroundColor Cyan
        
        Write-Host "  DATABASE_URL 설정 중..." -ForegroundColor Yellow
        gh secret set DATABASE_URL --repo $Repository --body $DatabaseUrl
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ DATABASE_URL 설정 완료" -ForegroundColor Green
        } else {
            Write-Host "    ❌ DATABASE_URL 설정 실패" -ForegroundColor Red
        }
        
        Write-Host "  YOUTUBE_API_KEYS 설정 중..." -ForegroundColor Yellow
        gh secret set YOUTUBE_API_KEYS --repo $Repository --body $YouTubeApiKeys
        if ($LASTEXITCODE -eq 0) {
            Write-Host "    ✅ YOUTUBE_API_KEYS 설정 완료" -ForegroundColor Green
        } else {
            Write-Host "    ❌ YOUTUBE_API_KEYS 설정 실패" -ForegroundColor Red
        }
        
        Write-Host "`n========================================" -ForegroundColor Cyan
        Write-Host "  ✅ 자동 설정 완료!" -ForegroundColor Green
        Write-Host "========================================`n" -ForegroundColor Cyan
        
        Write-Host "다음 단계:" -ForegroundColor Yellow
        Write-Host "1. Actions에서 수동 실행 테스트:" -ForegroundColor White
        Write-Host "   https://github.com/$Repository/actions" -ForegroundColor Cyan
        Write-Host "2. 'Daily Channel Collection' > 'Run workflow' 클릭" -ForegroundColor White
        
        exit 0
    }
}

# GitHub CLI가 없거나 실패한 경우
Write-Host "`n⚠️  GitHub CLI가 없거나 자동 설정이 불가능합니다." -ForegroundColor Yellow
Write-Host "수동 설정이 필요합니다." -ForegroundColor Yellow

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  수동 설정 방법" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. GitHub Secrets 페이지 접속:" -ForegroundColor Yellow
Write-Host "   https://github.com/$Repository/settings/secrets/actions" -ForegroundColor Cyan

Write-Host "`n2. 다음 2개 Secret 추가:" -ForegroundColor Yellow

Write-Host "`n   Secret 1:" -ForegroundColor Cyan
Write-Host "   - Name: DATABASE_URL" -ForegroundColor White
Write-Host "   - Value: Render PostgreSQL 연결 문자열" -ForegroundColor Gray
if (-not [string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    Write-Host "     (제공된 값: $($DatabaseUrl.Substring(0, [Math]::Min(30, $DatabaseUrl.Length)))...)" -ForegroundColor Gray
}

Write-Host "`n   Secret 2:" -ForegroundColor Cyan
Write-Host "   - Name: YOUTUBE_API_KEYS" -ForegroundColor White
Write-Host "   - Value: $($YouTubeApiKeys.Substring(0, [Math]::Min(30, $YouTubeApiKeys.Length)))..." -ForegroundColor Gray

Write-Host "`n3. 'Add secret' 클릭하여 저장" -ForegroundColor Yellow

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  소요 시간: 약 2분" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan


