# Render 환경 변수 자동 설정 스크립트 (PowerShell)
# Render API를 사용하여 환경 변수를 설정합니다

# Render API 키가 필요합니다 (Render 대시보드 > Account Settings > API Keys)
$RENDER_API_KEY = $env:RENDER_API_KEY
$SERVICE_ID = if ($env:RENDER_SERVICE_ID) { $env:RENDER_SERVICE_ID } else { "srv-d48p38jipnbc73dkh990" }

# 환경 변수 설정
$envVars = @(
    @{ Key = "YOUTUBE_API_KEYS"; Value = "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY,AIzaSyCjxqyzAGEmC21uyXVk1loyvqeOi3fDaB4,AIzaSyBfD3EPz6DL6J_I05fgT9zt3_iyZ39DkpU" },
    @{ Key = "YOUTUBE_API_KEY"; Value = "AIzaSyAQdvDGLrVzHYWz5XNKPEYCvWWJi5ZEnAY" },
    @{ Key = "NEXT_PUBLIC_BASE_URL"; Value = "https://realxbest.com" },
    @{ Key = "NEXT_PUBLIC_APP_URL"; Value = "https://realxbest.com" },
    @{ Key = "NODE_ENV"; Value = "production" },
    @{ Key = "NEXT_TELEMETRY_DISABLED"; Value = "1" }
)

if ([string]::IsNullOrWhiteSpace($RENDER_API_KEY)) {
    Write-Host "❌ RENDER_API_KEY 환경 변수가 설정되지 않았습니다." -ForegroundColor Red
    Write-Host "Render 대시보드 > Account Settings > API Keys에서 API 키를 생성하세요." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "사용 방법:" -ForegroundColor Cyan
    Write-Host "  `$env:RENDER_API_KEY = 'your-api-key-here'" -ForegroundColor Gray
    Write-Host "  .\scripts\setup-render-env.ps1" -ForegroundColor Gray
    exit 1
}

Write-Host "🚀 Render 환경 변수 설정 시작..." -ForegroundColor Cyan
Write-Host "서비스 ID: $SERVICE_ID" -ForegroundColor Gray
Write-Host ""

$headers = @{
    "Authorization" = "Bearer $RENDER_API_KEY"
    "Content-Type" = "application/json"
}

foreach ($envVar in $envVars) {
    Write-Host "설정 중: $($envVar.Key)" -ForegroundColor Yellow
    
    $body = @{
        envVar = @{
            key = $envVar.Key
            value = $envVar.Value
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-RestMethod -Uri "https://api.render.com/v1/services/$SERVICE_ID/env-vars" `
            -Method Put `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "  ✅ 성공" -ForegroundColor Green
    }
    catch {
        Write-Host "  ⚠️  오류: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.ErrorDetails.Message) {
            Write-Host "  상세: $($_.ErrorDetails.Message)" -ForegroundColor Gray
        }
    }
}

Write-Host ""
Write-Host "✅ 환경 변수 설정 완료!" -ForegroundColor Green
Write-Host "Render 대시보드에서 확인하세요: https://dashboard.render.com/web/$SERVICE_ID" -ForegroundColor Cyan
