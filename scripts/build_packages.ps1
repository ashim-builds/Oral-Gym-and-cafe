# ==============================================================================
# Oral Gym and Cafe - cPanel Packaging Script
# Generates production deployment archives in deployment/ directory
# ==============================================================================

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression.FileSystem

$RootDir = (Get-Item -Path "$PSScriptRoot\..").FullName
$DeploymentDir = Join-Path $RootDir "deployment"
$BackendDir = Join-Path $RootDir "backend"
$MobileDir = Join-Path $RootDir "mobile"

Write-Host "[1/5] Preparing deployment directory..." -ForegroundColor Cyan
if (-not (Test-Path $DeploymentDir)) {
    New-Item -ItemType Directory -Path $DeploymentDir -Force | Out-Null
}

# Clean any previous staging directories
Get-ChildItem -Path $DeploymentDir -Filter "staging_*" -Directory | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# 1. Build Backend
Write-Host "[2/5] Compiling Backend TypeScript..." -ForegroundColor Cyan
Push-Location $BackendDir
try {
    npm run build
} finally {
    Pop-Location
}

# 2. Build Frontend (React Expo Web)
Write-Host "[3/5] Exporting Frontend Static Web Assets..." -ForegroundColor Cyan
Push-Location $MobileDir
try {
    npm run build
} finally {
    Pop-Location
}

# Ensure .htaccess is in frontend dist
$FrontendHtaccess = Join-Path $MobileDir "public\.htaccess"
$FrontendDistDir = Join-Path $MobileDir "dist"
$DistHtaccess = Join-Path $FrontendDistDir ".htaccess"
if (Test-Path $FrontendHtaccess) {
    Copy-Item -Path $FrontendHtaccess -Destination $DistHtaccess -Force
}

# 3. Create frontend-dist.zip
Write-Host "[4/5] Packaging frontend-dist.zip for public_html..." -ForegroundColor Green
$FrontendZip = Join-Path $DeploymentDir "frontend-dist.zip"
if (Test-Path $FrontendZip) {
    Remove-Item -Path $FrontendZip -Force
}

[System.IO.Compression.ZipFile]::CreateFromDirectory($FrontendDistDir, $FrontendZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)

# 4. Create backend-deploy.zip and backend-update.zip
Write-Host "[5/5] Packaging backend deployment packages..." -ForegroundColor Green
$BackendDeployZip = Join-Path $DeploymentDir "backend-deploy.zip"
$BackendUpdateZip = Join-Path $DeploymentDir "backend-update.zip"

if (Test-Path $BackendDeployZip) { Remove-Item -Path $BackendDeployZip -Force }
if (Test-Path $BackendUpdateZip) { Remove-Item -Path $BackendUpdateZip -Force }

# Create temporary staging directory for backend full deploy
$StagingDeploy = Join-Path $DeploymentDir "staging_backend_deploy"
if (Test-Path $StagingDeploy) { Remove-Item -Path $StagingDeploy -Recurse -Force }
New-Item -ItemType Directory -Path $StagingDeploy -Force | Out-Null

Copy-Item -Path (Join-Path $BackendDir "dist") -Destination (Join-Path $StagingDeploy "dist") -Recurse -Force
Copy-Item -Path (Join-Path $BackendDir "app.js") -Destination $StagingDeploy -Force
Copy-Item -Path (Join-Path $BackendDir ".htaccess") -Destination $StagingDeploy -Force
Copy-Item -Path (Join-Path $BackendDir "package.json") -Destination $StagingDeploy -Force
Copy-Item -Path (Join-Path $BackendDir "package-lock.json") -Destination $StagingDeploy -Force
Copy-Item -Path (Join-Path $BackendDir ".env.example") -Destination $StagingDeploy -Force

$stagingPrisma = Join-Path $StagingDeploy "prisma"
New-Item -ItemType Directory -Path $stagingPrisma -Force | Out-Null
Copy-Item -Path (Join-Path $BackendDir "prisma\schema.prisma") -Destination $stagingPrisma -Force
if (Test-Path (Join-Path $BackendDir "prisma\migrations")) {
    Copy-Item -Path (Join-Path $BackendDir "prisma\migrations") -Destination (Join-Path $stagingPrisma "migrations") -Recurse -Force
}

$stagingUploads = Join-Path $StagingDeploy "uploads"
New-Item -ItemType Directory -Path $stagingUploads -Force | Out-Null
if (Test-Path (Join-Path $BackendDir "uploads\.gitkeep")) {
    Copy-Item -Path (Join-Path $BackendDir "uploads\.gitkeep") -Destination $stagingUploads -Force
}

[System.IO.Compression.ZipFile]::CreateFromDirectory($StagingDeploy, $BackendDeployZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)
Remove-Item -Path $StagingDeploy -Recurse -Force -ErrorAction SilentlyContinue

# Create staging directory for backend fast update
$StagingUpdate = Join-Path $DeploymentDir "staging_backend_update"
if (Test-Path $StagingUpdate) { Remove-Item -Path $StagingUpdate -Recurse -Force }
New-Item -ItemType Directory -Path $StagingUpdate -Force | Out-Null

Copy-Item -Path (Join-Path $BackendDir "dist") -Destination (Join-Path $StagingUpdate "dist") -Recurse -Force
Copy-Item -Path (Join-Path $BackendDir "app.js") -Destination $StagingUpdate -Force
Copy-Item -Path (Join-Path $BackendDir ".htaccess") -Destination $StagingUpdate -Force

$updatePrisma = Join-Path $StagingUpdate "prisma"
New-Item -ItemType Directory -Path $updatePrisma -Force | Out-Null
Copy-Item -Path (Join-Path $BackendDir "prisma\schema.prisma") -Destination $updatePrisma -Force

[System.IO.Compression.ZipFile]::CreateFromDirectory($StagingUpdate, $BackendUpdateZip, [System.IO.Compression.CompressionLevel]::Optimal, $false)
Remove-Item -Path $StagingUpdate -Recurse -Force -ErrorAction SilentlyContinue

Write-Host "Packaging completed successfully!" -ForegroundColor Green
Write-Host "Generated archives in ${DeploymentDir}:" -ForegroundColor Yellow
Get-ChildItem -Path $DeploymentDir -File | Select-Object Name, @{Name="Size (KB)";Expression={[math]::Round($_.Length/1KB, 2)}}, LastWriteTime | Format-Table -AutoSize
