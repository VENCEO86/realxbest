# GitHub Secrets 설정 검증 스크립트

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  GitHub Secrets 설정 검증" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "1. GitHub Actions 워크플로우 확인 방법:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   a) GitHub 저장소 접속:" -ForegroundColor Cyan
Write-Host "      https://github.com/VENCEO86/realxbest/actions" -ForegroundColor Gray
Write-Host "      be that the workflow hasn't run yet, or we need to check" -ForegroundColor Gray
Write-Host "      the Actions tab to see if it's configured correctly." -ForegroundColor Gray
Write-Host ""
Write-Host "   b) Actions 탭에서 확인:" -ForegroundColor Cyan
Write-Host "      1. https://github.com/VENCEO86/realxbest/actions" -ForegroundColor White
Write-Host "      2. 'Daily Channel Collection' 워크플로우 클릭" -ForegroundColor White
Write-Host "      3. 최근 실행 기록 확인" -ForegroundColor White
Write-Host ""
Write-Host "   c) Secrets 설정 확인:" -ForegroundColor Cyan
Write-Host "      1. https://github.com/VENCEO86/realxbest/settings/secrets/actions" -ForegroundColor White
Write-Host "      2. 다음 Secrets가 있는지 확인:" -ForegroundColor White
Write-Host "         - DATABASE_URL" -ForegroundColor Green
Write-Host "         - YOUTUBE_API_KEYS" -ForegroundColor Green
Write-Host ""

Write-Host "2. 수동 실행으로 테스트:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   GitHub Actions에서 수동 실행:" -ForegroundColor Cyan
Write-Host "   1. https://github.com/VENCEO86/realxbest/actions" -ForegroundColor White
Write-Host "   2. 'Daily Channel Collection' 워크플로우 클릭" -ForegroundColor White
Write-Host "   3. 'Run workflow' 버튼 클릭" -ForegroundColor White
Write-Host "   4. 실행 로그 확인" -ForegroundColor White
Write-Host ""

Write-Host "3. 로컬에서 테스트 (Secrets 없이):" -ForegroundColor Yellow
Write-Host ""
Write-Host "   로컬 환경 변수로 테스트:" -ForegroundColor Cyan
Write-Host "   `$env:DATABASE_URL = 'your-database-url'" -ForegroundColor Gray
Write-Host "   `$env:YOUTUBE_API_KEYS = 'your-api-keys'" -ForegroundColor Gray
Write-Host "   npm run collect:daily" -ForegroundColor Gray
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  검증 체크리스트" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "✅ 확인 사항:" -ForegroundColor Yellow
Write-Host "  [ ] GitHub 저장소 > Settings > Secrets > Actions 접속" -ForegroundColor White
Write-Host "  [ ] DATABASE_URL Secret 존재 확인" -ForegroundColor White
Write-Host "  [ ] YOUTUBE_API_KEYS Secret 존재 확인" -ForegroundColor White
Write-Host "  [ ] Actions 탭에서 워크플로우 실행 기록 확인" -ForegroundColor White
Write-Host "  [ ] 수동 실행으로 테스트 (Run workflow 버튼)" -ForegroundColor White
Write-Host ""

Write-Host "💡 팁:" -ForegroundColor Cyan
Write-Host "  - Secrets가 설정되어 있으면 Actions 탭에서 워크플로우가 실행됩니다" -ForegroundColor Gray
Write-Host "  - 수동 실행(Run workflow)으로 즉시 테스트 가능합니다" -ForegroundColor Gray
Write-Host "  - 실행 로그에서 오류 메시지를 확인할 수 있습니다" -ForegroundColor Gray


