# fix-git-index.ps1
# Script sua git index bi hong tren Windows (loi: fatal: .git/index: index file smaller than expected)
# Chay: .\fix-git-index.ps1

param(
    [string]$RepoPath = "."
)

$gitDir = Join-Path $RepoPath ".git"
$indexFile = Join-Path $gitDir "index"

Write-Host "=== Git Index Repair Tool ===" -ForegroundColor Cyan
Write-Host "Repo: $(Resolve-Path $RepoPath)" -ForegroundColor Gray

# Kiem tra co phai git repo khong
if (-not (Test-Path $gitDir)) {
    Write-Error "Khong tim thay thu muc .git. Hay chay script nay tu goc cua repo."
    exit 1
}

# Xoa index bi hong
if (Test-Path $indexFile) {
    $indexSize = (Get-Item $indexFile).Length
    Write-Host "Dang xoa index cu (size: $indexSize bytes)..." -ForegroundColor Yellow
    Remove-Item $indexFile -Force
    Write-Host "Da xoa .git/index" -ForegroundColor Green
} else {
    Write-Host "Khong tim thay index file (co the da bi xoa roi)" -ForegroundColor Yellow
}

# Rebuild index tu HEAD
Write-Host "Dang rebuild index tu HEAD..." -ForegroundColor Yellow
Push-Location $RepoPath
try {
    git read-tree HEAD 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "git read-tree HEAD that bai"
        exit 1
    }

    git reset --mixed HEAD 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "git reset that bai"
        exit 1
    }
} finally {
    Pop-Location
}

# Apply Windows-specific configs de tranh tai phat
Write-Host "Dang ap dung Windows git config..." -ForegroundColor Yellow
Push-Location $RepoPath
git config core.trustctime false
git config core.untrackedCache false
git config core.fsmonitor false
git config core.autocrlf true
Pop-Location

# Ket qua
$newIndexSize = if (Test-Path $indexFile) { (Get-Item $indexFile).Length } else { 0 }
Write-Host ""
Write-Host "=== Ket qua ===" -ForegroundColor Cyan
Write-Host "Index moi: $newIndexSize bytes" -ForegroundColor Green
Write-Host "Git status:" -ForegroundColor Cyan
Push-Location $RepoPath
git status --short 2>&1 | Select-Object -First 20
Pop-Location
Write-Host ""
Write-Host "Sua xong! Git index da duoc khoi phuc." -ForegroundColor Green

