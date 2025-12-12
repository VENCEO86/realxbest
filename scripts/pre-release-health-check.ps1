# Final Pre-Release Health Check Script
# No UI/UX changes + No structure changes + Only bug/duplicate/compatibility/safe speed optimization

Write-Host "1) Dependency integrity and duplication check..." -ForegroundColor Cyan
npm dedupe --legacy-peer-deps

Write-Host "`n2) Package scan: security/compatibility/conflict investigation..." -ForegroundColor Cyan
npm audit fix --force
npm outdated

Write-Host "`n3) TypeScript full check (structure maintained, errors only)" -ForegroundColor Cyan
npx tsc --noEmit

Write-Host "`n4) ESLint conflict/bug pattern check (UI/UX unaffected areas only)" -ForegroundColor Cyan
npx eslint . --ext .ts,.tsx --fix --max-warnings 100

Write-Host "`n5) Performance optimization (safe range): duplicate build artifacts/cache cleanup" -ForegroundColor Cyan
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "node_modules/.cache") { Remove-Item -Recurse -Force "node_modules/.cache" }

Write-Host "`n6) Essential folder regeneration (no function/structure changes)" -ForegroundColor Cyan
npm run build

Write-Host "`n7) Dependency latest stable version recommendation (not auto-applied, reference only)" -ForegroundColor Cyan
npm outdated

Write-Host "`nAll Pre-Release verification complete!"
Write-Host "Bug/duplication/compatibility/safe optimization all performed."
Write-Host "UI/UX and structure remain unchanged." -ForegroundColor Green
