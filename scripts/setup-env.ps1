# 통합 환경 변수 설정 스크립트
# 모든 문제를 한 번에 해결합니다.

Write-Host "`n🚀 환경 변수 설정 시작...`n" -ForegroundColor Cyan

# 프로젝트 루트 디렉토리로 이동
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
Set-Location $projectRoot

# .env.local 파일 생성
$envContent = @"
# YouTube API Keys (다중 키 지원 - 쉼표로 구분)
YOUTUBE_API_KEYS=AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU

# 기본 API 키 (하위 호환성)
YOUTUBE_API_KEY=AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY

# Next.js 설정
NEXT_PUBLIC_BASE_URL=http://localhost:3001

# Database (선택사항 - 없으면 Mock 데이터 사용)
# DATABASE_URL=postgresql://user:password@localhost:5432/korxyoutube
"@

$envFilePath = Join-Path $projectRoot ".env.local"

if (Test-Path $envFilePath) {
    Write-Host "⚠️  .env.local 파일이 이미 존재합니다." -ForegroundColor Yellow
    $overwrite = Read-Host "덮어쓰시겠습니까? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "❌ 취소되었습니다." -ForegroundColor Red
        exit 1
    }
}

$envContent | Out-File -FilePath $envFilePath -Encoding UTF8 -NoNewline
Write-Host "✅ .env.local 파일 생성 완료!" -ForegroundColor Green
Write-Host "   경로: $envFilePath`n" -ForegroundColor Gray

# PowerShell 환경 변수도 설정 (스크립트 실행 시 사용)
$env:YOUTUBE_API_KEYS = "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU"
$env:YOUTUBE_API_KEY = "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY"
$env:NEXT_PUBLIC_BASE_URL = "http://localhost:3001"

Write-Host "✅ PowerShell 환경 변수 설정 완료!`n" -ForegroundColor Green

# 확인
Write-Host "📋 설정된 환경 변수 확인:" -ForegroundColor Cyan
Write-Host "   YOUTUBE_API_KEYS: $($env:YOUTUBE_API_KEYS.Substring(0, 50))..." -ForegroundColor Gray
Write-Host "   API 키 개수: $($env:YOUTUBE_API_KEYS.Split(',').Count)개`n" -ForegroundColor Gray

Write-Host "🎯 다음 단계:" -ForegroundColor Cyan
Write-Host "   1. 개발 서버 재시작 (Ctrl+C 후 'npm run dev')" -ForegroundColor Yellow
Write-Host "   2. 브라우저에서 http://localhost:3001 접속" -ForegroundColor Yellow
Write-Host "   3. 모든 기능이 정상 작동하는지 확인`n" -ForegroundColor Yellow

Write-Host "✨ 설정 완료!`n" -ForegroundColor Green


