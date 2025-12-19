# GitHub Secrets 설정 상태 확인 스크립트
# 초등학생도 이해할 수 있도록 단계별로 확인

Write-Host "`n🔍 GitHub Secrets 설정 확인 시작...`n" -ForegroundColor Cyan
Write-Host "=" -Repeat 60 -ForegroundColor White

# 1단계: GitHub Actions 실행 기록 확인
Write-Host "`n📋 1단계: 최근 실행 기록 확인`n" -ForegroundColor Yellow

$repoOwner = "VENCEO86"
$repoName = "realxbest"
$workflowFile = "daily-collect.yml"

try {
    $headers = @{ "Accept" = "application/vnd.github.v3+json" }
    $runsResponse = Invoke-RestMethod -Uri "https://api.github.com/repos/$repoOwner/$repoName/actions/workflows/$workflowFile/runs?per_page=3" -Headers $headers
    
    if ($runsResponse.workflow_runs.Count -eq 0) {
        Write-Host "⚠️  실행 기록이 없습니다.`n" -ForegroundColor Yellow
        Write-Host "💡 다음 단계: GitHub Actions에서 수동 실행해보세요.`n" -ForegroundColor Cyan
    } else {
        Write-Host "✅ 최근 실행 기록 발견: $($runsResponse.workflow_runs.Count)개`n" -ForegroundColor Green
        
        foreach ($run in $runsResponse.workflow_runs) {
            $status = $run.status
            $conclusion = if ($run.conclusion) { $run.conclusion } else { "진행중" }
            $runId = $run.id
            $createdAt = $run.created_at
            
            $statusColor = if ($conclusion -eq "success") { "Green" } 
                          elseif ($conclusion -eq "failure") { "Red" } 
                          else { "Yellow" }
            
            Write-Host "   실행 ID: $runId" -ForegroundColor White
            Write-Host "   상태: $status / $conclusion" -ForegroundColor $statusColor
            Write-Host "   시간: $createdAt" -ForegroundColor White
            Write-Host "   링크: https://github.com/$repoOwner/$repoName/actions/runs/$runId`n" -ForegroundColor Cyan
        }
    }
} catch {
    Write-Host "❌ 실행 기록 확인 실패: $($_.Exception.Message)`n" -ForegroundColor Red
}

# 2단계: 확인 방법 안내
Write-Host "`n📋 2단계: API 키 인식 확인 방법`n" -ForegroundColor Yellow

Write-Host "✅ 자동 확인 가능한 것:" -ForegroundColor Green
Write-Host "   • 실행 기록 존재 여부" -ForegroundColor White
Write-Host "   • 실행 성공/실패 여부`n" -ForegroundColor White

Write-Host "⚠️  수동 확인 필요한 것:" -ForegroundColor Yellow
Write-Host "   • GitHub Secrets 실제 값 (보안상 API로 확인 불가)" -ForegroundColor White
Write-Host "   • 실행 로그 상세 내용`n" -ForegroundColor White

Write-Host "🔍 수동 확인 방법:`n" -ForegroundColor Cyan

Write-Host "방법 1: GitHub Actions 로그 확인 (가장 확실)" -ForegroundColor Yellow
Write-Host "   1. 위의 링크 중 하나 클릭" -ForegroundColor White
Write-Host "   2. 'Verify environment variables' 단계 클릭" -ForegroundColor White
Write-Host "   3. 로그에서 다음 메시지 찾기:" -ForegroundColor White
Write-Host "      ✅ 'YOUTUBE_API_KEYS 형식이 올바릅니다. 키 개수: 3개'" -ForegroundColor Green
Write-Host "      또는" -ForegroundColor White
Write-Host "      ❌ 'YOUTUBE_API_KEYS가 설정되지 않았습니다'" -ForegroundColor Red
Write-Host ""

Write-Host "방법 2: GitHub Secrets 페이지 확인" -ForegroundColor Yellow
Write-Host "   1. https://github.com/$repoOwner/$repoName/settings/secrets/actions 접속" -ForegroundColor Cyan
Write-Host "   2. 'YOUTUBE_API_KEYS' Secret이 있는지 확인" -ForegroundColor White
Write-Host "   3. 이름이 정확히 'YOUTUBE_API_KEYS'인지 확인 (Y 포함!)" -ForegroundColor White
Write-Host "   4. 값은 보안상 표시되지 않지만, 편집 버튼으로 확인 가능" -ForegroundColor White
Write-Host ""

Write-Host "=" -Repeat 60 -ForegroundColor White
Write-Host "`n💡 다음 단계:`n" -ForegroundColor Cyan

Write-Host "1. 위의 링크로 실행 로그 확인" -ForegroundColor White
Write-Host "2. 'Verify environment variables' 단계에서 API 키 인식 여부 확인" -ForegroundColor White
Write-Host "3. 문제가 있으면 GitHub Secrets 페이지에서 수정`n" -ForegroundColor White

