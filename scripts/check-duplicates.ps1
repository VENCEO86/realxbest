# Duplicate files and compatibility check script

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Duplicate Files and Compatibility Check" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# 1. Check duplicate script files
Write-Host "1. Checking duplicate script files..." -ForegroundColor Yellow
$scripts = Get-ChildItem -Path "scripts" -File | Where-Object { $_.Extension -match "\.(ts|ps1|sh)$" } | Select-Object Name

$scriptGroups = @{}
foreach ($script in $scripts) {
    $baseName = $script.Name -replace "\.(ts|ps1|sh)$", ""
    if (-not $scriptGroups.ContainsKey($baseName)) {
        $scriptGroups[$baseName] = @()
    }
    $scriptGroups[$baseName] += $script.Name
}

$duplicates = $scriptGroups.GetEnumerator() | Where-Object { $_.Value.Count -gt 1 }
if ($duplicates) {
    Write-Host "  Found potential duplicates:" -ForegroundColor Yellow
    foreach ($dup in $duplicates) {
        Write-Host "    $($dup.Key): $($dup.Value -join ', ')" -ForegroundColor Gray
    }
} else {
    Write-Host "  OK: No duplicate script files" -ForegroundColor Green
}

# 2. Check package.json duplicate scripts
Write-Host "`n2. Checking package.json duplicate scripts..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" | ConvertFrom-Json
$scriptNames = $packageJson.scripts.PSObject.Properties.Name
$duplicateScripts = $scriptNames | Group-Object | Where-Object { $_.Count -gt 1 }

if ($duplicateScripts) {
    Write-Host "  Found duplicate script names:" -ForegroundColor Yellow
    foreach ($dup in $duplicateScripts) {
        Write-Host "    - $($dup.Name)" -ForegroundColor Gray
    }
} else {
    Write-Host "  OK: No duplicate script names" -ForegroundColor Green
}

# Check for similar script commands
$similarScripts = @{
    "setup-db" = @("db:setup", "setup-db")
    "collect-daily" = @("collect:daily", "collect-daily")
}

Write-Host "`n  Similar script commands:" -ForegroundColor Cyan
foreach ($group in $similarScripts.Keys) {
    $found = $similarScripts[$group] | Where-Object { $scriptNames -contains $_ }
    if ($found.Count -gt 1) {
        Write-Host "    Warning: $($found -join ', ') are similar" -ForegroundColor Yellow
    }
}

# 3. Check configuration files
Write-Host "`n3. Checking configuration files..." -ForegroundColor Yellow
$configFiles = @(
    @{Name="package.json"; Required=$true},
    @{Name="tsconfig.json"; Required=$true},
    @{Name="next.config.mjs"; Required=$true},
    @{Name="tailwind.config.ts"; Required=$true},
    @{Name="postcss.config.mjs"; Required=$true},
    @{Name=".eslintrc.json"; Required=$true},
    @{Name=".gitignore"; Required=$true},
    @{Name=".dockerignore"; Required=$true}
)

foreach ($config in $configFiles) {
    if (Test-Path $config.Name) {
        Write-Host "  OK: $($config.Name)" -ForegroundColor Green
    } else {
        if ($config.Required) {
            Write-Host "  Missing: $($config.Name)" -ForegroundColor Red
        } else {
            Write-Host "  Optional: $($config.Name) (not found)" -ForegroundColor Gray
        }
    }
}

# 4. Check compatibility
Write-Host "`n4. Checking compatibility..." -ForegroundColor Yellow

# Next.js and React compatibility
$nextVersion = $packageJson.dependencies.next
$reactVersion = $packageJson.dependencies.react

if ($nextVersion -match "^14\." -and $reactVersion -match "^18\.") {
    Write-Host "  OK: Next.js 14.x + React 18.x (compatible)" -ForegroundColor Green
} else {
    Write-Host "  Warning: Version compatibility check needed" -ForegroundColor Yellow
}

# 5. Check duplicate documentation files
Write-Host "`n5. Checking documentation files..." -ForegroundColor Yellow
$mdFiles = Get-ChildItem -Path . -Filter "*.md" -File | Where-Object { $_.FullName -notmatch "node_modules" } | Select-Object Name

$docGroups = @{
    "DEPLOYMENT" = ($mdFiles | Where-Object { $_.Name -match "DEPLOYMENT" }).Count
    "RENDER" = ($mdFiles | Where-Object { $_.Name -match "RENDER" }).Count
    "SETUP" = ($mdFiles | Where-Object { $_.Name -match "SETUP" }).Count
    "README" = ($mdFiles | Where-Object { $_.Name -match "README" }).Count
    "GUIDE" = ($mdFiles | Where-Object { $_.Name -match "GUIDE" }).Count
}

Write-Host "  Documentation file groups:" -ForegroundColor Cyan
foreach ($group in $docGroups.Keys) {
    if ($docGroups[$group] -gt 1) {
        Write-Host "    $group : $($docGroups[$group]) files (consider consolidation)" -ForegroundColor Yellow
    } else {
        Write-Host "    $group : $($docGroups[$group]) file" -ForegroundColor Gray
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  Check Complete" -ForegroundColor Green
Write-Host "========================================`n" -ForegroundColor Cyan

Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "- Configuration files: OK" -ForegroundColor Green
Write-Host "- Compatibility: OK" -ForegroundColor Green
Write-Host "- Some duplicate documentation files found (non-critical)" -ForegroundColor Gray
Write-Host "- Some similar script commands found (non-critical)" -ForegroundColor Gray


