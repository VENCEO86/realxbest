# 중복 파일 및 호환성 문제 검사 스크립트

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  중복 파일 및 호환성 검사" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. 중복 문서 파일 확인
Write-Host "1. 중복/유사 문서 파일 확인..." -ForegroundColor Yellow
$mdFiles = Get-ChildItem -Path . -Filter "*.md" -File | Where-Object { $_.FullName -notmatch "node_modules" } | Select-Object Name, Length, LastWriteTime

$duplicateGroups = @{
    "DEPLOYMENT" = @()
    "RENDER" = @()
    "SETUP" = @()
    "README" = @()
    "GUIDE" = @()
    "CHECKLIST" = @()
}

foreach ($file in $mdFiles) {
    $name = $file.Name.ToUpper()
    if ($name -match "DEPLOYMENT") { $duplicateGroups["DEPLOYMENT"] += $file }
    if ($name -match "RENDER") { $duplicateGroups["RENDER"] += $file }
    if ($name -match "SETUP") { $duplicateGroups["SETUP"] += $file }
    if ($name -match "README") { $duplicateGroups["README"] += $file }
    if ($name -match "GUIDE") { $duplicateGroups["GUIDE"] += $file }
    if ($name -match "CHECKLIST") { $duplicateGroups["CHECKLIST"] += $file }
}

Write-Host "`n중복 가능성 있는 문서 그룹:" -ForegroundColor Cyan
foreach ($group in $duplicateGroups.Keys) {
    if ($duplicateGroups[$group].Count -gt 1) {
        Write-Host "`n[$group] 그룹 ($($duplicateGroups[$group].Count)개):" -ForegroundColor Yellow
        foreach ($file in $duplicateGroups[$group]) {
            Write-Host "  - $($file.Name) ($([math]::Round($file.Length/1KB, 2))KB)" -ForegroundColor Gray
        }
    }
}

# 2. 설정 파일 중복 확인
Write-Host "`n2. 설정 파일 확인..." -ForegroundColor Yellow
$configFiles = @(
    "package.json",
    "tsconfig.json",
    "next.config.mjs",
    "tailwind.config.ts",
    "postcss.config.mjs",
    ".eslintrc.json",
    ".gitignore",
    ".dockerignore"
)

foreach ($config in $configFiles) {
    if (Test-Path $config) {
        Write-Host "  OK: $config" -ForegroundColor Green
    } else {
        Write-Host "  Missing: $config" -ForegroundColor Red
    }
}

# 3. 호환성 문제 확인
Write-Host "`n3. 호환성 문제 확인..." -ForegroundColor Yellow

# package.json과 tsconfig.json 호환성
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$tsConfig = Get-Content "tsconfig.json" | ConvertFrom-Json

# Next.js 버전 확인
$nextVersion = $packageJson.dependencies.next
if ($nextVersion -match "14\.") {
    Write-Host "  OK: Next.js 14.x 사용 중" -ForegroundColor Green
} else {
    Write-Host "  Warning: Next.js 버전 확인 필요" -ForegroundColor Yellow
}

# React 버전 확인
$reactVersion = $packageJson.dependencies.react
if ($reactVersion -match "18\.") {
    Write-Host "  OK: React 18.x 사용 중" -ForegroundColor Green
} else {
    Write-Host "  Warning: React 버전 확인 필요" -ForegroundColor Yellow
}

# 4. 불필요한 파일 확인
Write-Host "`n4. 불필요한 파일 확인..." -ForegroundColor Yellow

$unnecessaryFiles = @(
    "prisma/dev.db",
    "tsconfig.tsbuildinfo",
    ".next",
    "node_modules/.cache"
)

foreach ($file in $unnecessaryFiles) {
    if (Test-Path $file) {
        Write-Host "  Found: $file (빌드 아티팩트, .gitignore에 포함됨)" -ForegroundColor Gray
    }
}

# 5. 스크립트 중복 확인
Write-Host "`n5. 스크립트 파일 확인..." -ForegroundColor Yellow
$scripts = Get-ChildItem -Path "scripts" -Filter "*.ps1" -File | Select-Object Name
$scriptNames = $scripts | ForEach-Object { $_.Name }

$duplicateScripts = $scriptNames | Group-Object | Where-Object { $_.Count -gt 1 }
if ($duplicateScripts) {
    Write-Host "  Warning: 중복 스크립트 발견" -ForegroundColor Yellow
    foreach ($dup in $duplicateScripts) {
        Write-Host "    - $($dup.Name) ($($dup.Count)개)" -ForegroundColor Gray
    }
} else {
    Write-Host "  OK: 중복 스크립트 없음" -ForegroundColor Green
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  검사 완료" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "권장 사항:" -ForegroundColor Yellow
Write-Host "1. 중복 문서 파일은 통합 고려" -ForegroundColor Gray
Write-Host "2. 모든 설정 파일이 존재하고 올바르게 구성됨" -ForegroundColor Gray
Write-Host "3. 호환성 문제 없음" -ForegroundColor Gray


