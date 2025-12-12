# GitHub Secrets 자동 설정 스크립트
# GitHub API를 사용하여 Secrets 설정

param(
    [string]$GitHubToken = $env:GITHUB_TOKEN,
    [string]$Repository = "VENCEO86/realxbest",
    [string]$DatabaseUrl = $env:DATABASE_URL,
    [string]$YouTubeApiKeys = $env:YOUTUBE_API_KEYS
)

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  GitHub Secrets 자동 설정" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# GitHub Token 확인
if ([string]::IsNullOrWhiteSpace($GitHubToken)) {
    Write-Host "❌ GITHUB_TOKEN 환경 변수가 설정되지 않았습니다." -ForegroundColor Red
    Write-Host "`nGitHub Personal Access Token 생성 방법:" -ForegroundColor Yellow
    Write-Host "1. https://github.com/settings/tokens 접속" -ForegroundColor White
    Write-Host "2. 'Generate new token (classic)' 클릭" -ForegroundColor White
    Write-Host "3. 권한 선택:" -ForegroundColor White
    Write-Host "   - repo (전체)" -ForegroundColor Gray
    Write-Host "   - workflow (워크플로우 수정)" -ForegroundColor Gray
    Write-Host "4. 토큰 생성 후 복사" -ForegroundColor White
    Write-Host "`n사용 방법:" -ForegroundColor Cyan
    Write-Host "  `$env:GITHUB_TOKEN = 'your-token-here'" -ForegroundColor Gray
    Write-Host "  .\scripts\setup-github-secrets.ps1" -ForegroundColor Gray
    Write-Host "`n또는 수동 설정:" -ForegroundColor Yellow
    Write-Host "  https://github.com/VENCEO86/realxbest/settings/secrets/actions" -ForegroundColor Cyan
    exit 1
}

# DATABASE_URL 확인
if ([string]::IsNullOrWhiteSpace($DatabaseUrl)) {
    Write-Host "⚠️  DATABASE_URL이 설정되지 않았습니다." -ForegroundColor Yellow
    Write-Host "환경 변수에서 가져오거나 수동으로 입력하세요." -ForegroundColor Gray
    $DatabaseUrl = Read-Host "DATABASE_URL 입력"
}

# YOUTUBE_API_KEYS 확인
if ([string]::IsNullOrWhiteSpace($YouTubeApiKeys)) {
    Write-Host "⚠️  YOUTUBE_API_KEYS가 설정되지 않았습니다." -ForegroundColor Yellow
    Write-Host "환경 변수에서 가져오거나 수동으로 입력하세요." -ForegroundColor Gray
    $YouTubeApiKeys = Read-Host "YOUTUBE_API_KEYS 입력 (쉼표로 구분)"
}

Write-Host "`n설정할 Secrets:" -ForegroundColor Cyan
Write-Host "  Repository: $Repository" -ForegroundColor Gray
Write-Host "  DATABASE_URL: $(if ($DatabaseUrl.Length -gt 20) { $DatabaseUrl.Substring(0, 20) + '...' } else { $DatabaseUrl })" -ForegroundColor Gray
Write-Host "  YOUTUBE_API_KEYS: $(if ($YouTubeApiKeys.Length -gt 20) { $YouTubeApiKeys.Substring(0, 20) + '...' } else { $YouTubeApiKeys })" -ForegroundColor Gray

$confirm = Read-Host "`n계속하시겠습니까? (Y/N)"
if ($confirm -ne "Y" -and $confirm -ne "y") {
    Write-Host "취소되었습니다." -ForegroundColor Yellow
    exit 0
}

# GitHub API를 사용하여 Secret 설정
# 참고: GitHub API는 Public Key를 먼저 가져온 후 암호화해야 함

function Set-GitHubSecret {
    param(
        [string]$SecretName,
        [string]$SecretValue
    )
    
    try {
        # 1. Public Key 가져오기
        $publicKeyUrl = "https://api.github.com/repos/$Repository/actions/secrets/public-key"
        $headers = @{
            "Authorization" = "Bearer $GitHubToken"
            "Accept" = "application/vnd.github.v3+json"
        }
        
        Write-Host "`n📡 Public Key 가져오는 중..." -ForegroundColor Cyan
        $publicKeyResponse = Invoke-RestMethod -Uri $publicKeyUrl -Method Get -Headers $headers
        
        $publicKey = $publicKeyResponse.key
        $keyId = $publicKeyResponse.key_id
        
        Write-Host "  ✅ Public Key 가져오기 성공" -ForegroundColor Green
        
        # 2. Secret 암호화 (NaCl/libsodium 사용)
        # PowerShell에서는 직접 암호화가 어려우므로, GitHub CLI 또는 다른 방법 사용
        Write-Host "`n⚠️  PowerShell에서는 직접 암호화가 어렵습니다." -ForegroundColor Yellow
        Write-Host "GitHub CLI (gh)를 사용하거나 수동 설정을 권장합니다." -ForegroundColor Yellow
        
        return $false
        
    } catch {
        Write-Host "  ❌ 오류: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

Write-Host "`n💡 GitHub Secrets 자동 설정 방법:" -ForegroundColor Cyan
Write-Host "`n방법 1: GitHub CLI 사용 (권장)" -ForegroundColor Yellow
Write-Host "1. GitHub CLI 설치: https://cli.github.com/" -ForegroundColor White
Write-Host "2. 로그인: gh auth login" -ForegroundColor White
Write-Host "3. Secret 설정:" -ForegroundColor White
Write-Host "   gh secret set DATABASE_URL --repo $Repository --body `"$DatabaseUrl`"" -ForegroundColor Gray
Write-Host "   gh secret set YOUTUBE_API_KEYS --repo $Repository --body `"$YouTubeApiKeys`"" -ForegroundColor Gray

Write-Host "`n방법 2: 수동 설정 (가장 확실)" -ForegroundColor Yellow
Write-Host "1. https://github.com/$Repository/settings/secrets/actions 접속" -ForegroundColor White
Write-Host "2. 'New repository secret' 클릭" -ForegroundColor White
Write-Host "3. 다음 2개 추가:" -ForegroundColor White
Write-Host "   - Name: DATABASE_URL" -ForegroundColor Gray
Write-Host "     Value: $DatabaseUrl" -ForegroundColor Gray
Write-Host "   - Name: YOUTUBE_API_KEYS" -ForegroundColor Gray
Write-Host "     Value: $YouTubeApiKeys" -ForegroundColor Gray

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  자동화 제한 사항" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan
Write-Host "GitHub Secrets는 보안상 이유로:" -ForegroundColor Yellow
Write-Host "- Public Key로 암호화해야 함" -ForegroundColor Gray
Write-Host "- PowerShell에서 직접 암호화 어려움" -ForegroundColor Gray
Write-Host "- GitHub CLI 또는 수동 설정 권장" -ForegroundColor Gray

