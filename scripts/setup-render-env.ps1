# Render 환경 변수 자동 설정 스크립트
# 사용법: .\scripts\setup-render-env.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$RenderApiKey,
    
    [Parameter(Mandatory=$false)]
    [string]$ServiceId = "srv-d48p38jipnbc73dkh990",
    
    [Parameter(Mandatory=$false)]
    [string]$DatabaseUrl = "",
    
    [Parameter(Mandatory=$false)]
    [string]$YouTubeApiKey = "",
    
    [Parameter(Mandatory=$false)]
    [string]$YouTubeApiKeys = "",
    
    [Parameter(Mandatory=$false)]
    [string]$BaseUrl = "https://realxbest.onrender.com"
)

Write-Host "`n🚀 Render 환경 변수 자동 설정 시작...`n" -ForegroundColor Cyan

# Render API 엔드포인트
$baseUrl = "https://api.render.com/v1"
$headers = @{
    "Authorization" = "Bearer $RenderApiKey"
    "Accept" = "application/json"
    "Content-Type" = "application/json"
}

# 1. 기존 환경 변수 확인
Write-Host "📋 기존 환경 변수 확인 중...`n" -ForegroundColor Yellow
try {
    $envVarsUrl = "$baseUrl/services/$ServiceId/env-vars"
    $response = Invoke-RestMethod -Uri $envVarsUrl -Method Get -Headers $headers
    
    Write-Host "현재 환경 변수:" -ForegroundColor Cyan
    foreach ($envVar in $response) {
        Write-Host "  - $($envVar.key)" -ForegroundColor Gray
    }
    Write-Host ""
} catch {
    Write-Host "⚠️  기존 환경 변수 조회 실패: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host ""
}

# 2. MySQL 관련 환경 변수 삭제
Write-Host "🗑️  MySQL 환경 변수 삭제 중...`n" -ForegroundColor Yellow
$mysqlVars = @("MYSQL_DB", "MYSQL_HOST", "MYSQL_PASSWORD", "MYSQL_PORT", "MYSQL_USER")

foreach ($var in $mysqlVars) {
    try {
        $deleteUrl = "$baseUrl/services/$ServiceId/env-vars/$var"
        Invoke-RestMethod -Uri $deleteUrl -Method Delete -Headers $headers | Out-Null
        Write-Host "  ✅ 삭제: $var" -ForegroundColor Green
    } catch {
        Write-Host "  ℹ️  $var (없음 또는 이미 삭제됨)" -ForegroundColor Gray
    }
}
Write-Host ""

# 3. 새 환경 변수 추가
Write-Host "➕ 새 환경 변수 추가 중...`n" -ForegroundColor Yellow

$newEnvVars = @{}

# DATABASE_URL
if ($DatabaseUrl) {
    $newEnvVars["DATABASE_URL"] = $DatabaseUrl
} else {
    Write-Host "⚠️  DATABASE_URL이 제공되지 않았습니다." -ForegroundColor Yellow
    Write-Host "   Render PostgreSQL의 External Connection String을 입력하세요." -ForegroundColor Gray
    $dbUrl = Read-Host "DATABASE_URL 입력 (또는 Enter로 건너뛰기)"
    if ($dbUrl) {
        $newEnvVars["DATABASE_URL"] = $dbUrl
    }
}

# YOUTUBE_API_KEY
if ($YouTubeApiKey) {
    $newEnvVars["YOUTUBE_API_KEY"] = $YouTubeApiKey
} else {
    Write-Host "⚠️  YOUTUBE_API_KEY가 제공되지 않았습니다." -ForegroundColor Yellow
    $apiKey = Read-Host "YOUTUBE_API_KEY 입력 (또는 Enter로 건너뛰기)"
    if ($apiKey) {
        $newEnvVars["YOUTUBE_API_KEY"] = $apiKey
    }
}

# YOUTUBE_API_KEYS (선택사항)
if ($YouTubeApiKeys) {
    $newEnvVars["YOUTUBE_API_KEYS"] = $YouTubeApiKeys
}

# NEXT_PUBLIC_BASE_URL
$newEnvVars["NEXT_PUBLIC_BASE_URL"] = $BaseUrl

# NODE_ENV
$newEnvVars["NODE_ENV"] = "production"

# 환경 변수 추가
foreach ($key in $newEnvVars.Keys) {
    try {
        $body = @{
            key = $key
            value = $newEnvVars[$key]
        } | ConvertTo-Json
        
        $addUrl = "$baseUrl/services/$ServiceId/env-vars"
        Invoke-RestMethod -Uri $addUrl -Method Post -Headers $headers -Body $body | Out-Null
        Write-Host "  ✅ 추가: $key" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ 실패: $key - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n✅ 환경 변수 설정 완료!`n" -ForegroundColor Green

# 4. 최종 확인
Write-Host "📋 설정된 환경 변수 확인:`n" -ForegroundColor Cyan
try {
    $finalResponse = Invoke-RestMethod -Uri $envVarsUrl -Method Get -Headers $headers
    foreach ($envVar in $finalResponse) {
        $value = if ($envVar.key -match "PASSWORD|KEY|SECRET|TOKEN") {
            "***" + $envVar.value.Substring($envVar.value.Length - 4)
        } else {
            $envVar.value
        }
        Write-Host "  $($envVar.key) = $value" -ForegroundColor Gray
    }
} catch {
    Write-Host "⚠️  최종 확인 실패: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host "`n💡 다음 단계:" -ForegroundColor Yellow
Write-Host "  1. Render 대시보드에서 환경 변수 확인" -ForegroundColor White
Write-Host "  2. Build & Start Commands 확인" -ForegroundColor White
Write-Host "  3. 배포 실행`n" -ForegroundColor White

