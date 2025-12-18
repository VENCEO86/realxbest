# GitHub Secrets 자동 설정 스크립트 (GitHub CLI 사용)
# GitHub CLI가 설치되어 있어야 함

param(
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$YouTubeApiKeys = $env:YOUTUBE_API_KEYS,
    [string]$Repository = "VENCEO86/realxbest"
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  GitHub Secrets 자동 설정 (GitHub CLI)" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# GitHub CLI 설치 확인
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue
if (-not $ghInstalled) {
    Write-Host "❌ GitHub CLI (gh)가 설치되지 않았습니다." -ForegroundColor Red
    Write-Host "`n설치 방법:" -ForegroundColor Yellow
    Write-Host "1. https://cli.github.com/ 접속" -ForegroundColor White
    Write-Host "2. Windows용 다운로드 및 설치" -ForegroundColor White
    Write-Host "3. 또는 winget 사용: winget install GitHub.cli" -ForegroundColor White
    Write-Host "`n설치 후 다시 실행하세요." -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ GitHub CLI 확인됨" -ForegroundColor Green

# GitHub CLI 로그인 확인
Write-Host "`n🔐 GitHub 인증 확인 중..." -ForegroundColor Cyan
$authStatus = gh auth status 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  GitHub에 로그인되지 않았습니다." -ForegroundColor Yellow
    Write-Host "로그인 중..." -ForegroundColor Cyan
    gh auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 로그인 실패" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ GitHub 인증 확인됨" -ForegroundColor Green

# DATABASE_URL 확인
if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    Write-Host "`n⚠️  DATABASE_URL이 설정되지 않았습니다." -ForegroundColor Yellow
    $DatabaseUrl = Read-Host "DATABASE_URL 입력"
}

# YOUTUBE_API_KEYS 확인
if ([string]::IsNullOrWhiteSpace($YouTubeApiKeys)) {
    Write-Host "`n⚠️  YOUTUBE_API_KEYS가 설정되지 않았습니다." -ForegroundColor Yellow
    $YouTubeApiKeys = Read-Host "YOUTUBE_API_KEYS 입력 (쉼표로 구분)"
}

Write-Host "`n설정할 Secrets:" -ForegroundColor Cyan
Write-Host "  Repository: $Repository" -ForegroundColor Gray
Write-Host "  DATABASE_URL: $(if ($DatabaseUrl.Length -gt 30) { $DatabaseUrl.Substring(0, 30) + '...' } else { $DatabaseUrl })" -ForegroundColor Gray
Write-Host "  YOUTUBE_API_KEYS: $(if ($YouTubeApiKeys.Length -gt 30) { $YouTubeApiKeys.Substring(0, 30) + '...' } else { $YouTubeApiKeys })" -ForegroundColor Gray

$confirm = Read-Host "`n계속하시겠습니까? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "취소되었습니다." -ForegroundColor Yellow
    exit 0
}

# Secret 설정
Write-Host "`n📝 DATABASE_URL 설정 중..." -ForegroundColor Cyan
gh secret set DATABASE_URL --repo $Repository --body $DatabaseUrl
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ DATABASE_URL 설정 완료" -ForegroundColor Green
} else {
    Write-Host "  ❌ DATABASE_URL 설정 실패" -ForegroundColor Red
    exit 1
}

Write-Host "`n📝 YOUTUBE_API_KEYS 설정 중..." -ForegroundColor Cyan
gh secret set YOUTUBE_API_KEYS --repo $Repository --body $YouTubeApiKeys
if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ YOUTUBE_API_KEYS 설정 완료" -ForegroundColor Green
} else {
    Write-Host "  ❌ YOUTUBE_API_KEYS 설정 실패" -ForegroundColor Red
    exit 1
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  ✅ 모든 Secrets 설정 완료!" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "다음 단계:" -ForegroundColor Yellow
Write-Host "1. Actions에서 수동 실행 테스트:" -ForegroundColor White
Write-Host "   https://github.com/$Repository/actions" -ForegroundColor Cyan
Write-Host "2. 'Daily Channel Collection' > 'Run workflow' 클릭" -ForegroundColor White
Write-Host "3. 성공하면 자동화 완료!" -ForegroundColor White


