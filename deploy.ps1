# GitHub upload and GitHub Pages setup
$ErrorActionPreference = "Stop"

$env:Path = "C:\Program Files\Git\cmd;" + $env:Path
$git = "C:\Program Files\Git\cmd\git.exe"
$gh = "C:\Program Files\GitHub CLI\gh.exe"
$repoUrl = "https://github.com/wada0619/expression-theme-maker.git"
$pagesUrl = "https://wada0619.github.io/expression-theme-maker/"

Set-Location $PSScriptRoot

if (-not (Test-Path $git)) {
  Write-Host "Git not found. Install from https://git-scm.com/download/win"
  exit 1
}

if (-not (Test-Path ".git")) {
  & $git init
}

& $git add .
$status = & $git status --porcelain
if ($status) {
  & $git -c user.name="wada0619" -c user.email="wada0619@users.noreply.github.com" commit -m "Update site"
}

& $git branch -M main

$remotes = & $git remote 2>$null
if ($remotes -notcontains "origin") {
  & $git remote add origin $repoUrl
}

Write-Host "Pushing to GitHub. Approve login in the browser if prompted."
& $git push -u origin main

if (Test-Path $gh) {
  Write-Host "Enabling GitHub Pages..."
  & $gh auth status 2>$null
  if ($LASTEXITCODE -ne 0) {
    & $gh auth login -w -p https -h github.com
  }

  $pagesArgs = @(
    "api", "repos/wada0619/expression-theme-maker/pages",
    "-X", "POST",
    "-f", "build_type=legacy",
    "-f", "source[branch]=main",
    "-f", "source[path]=/"
  )
  & $gh @pagesArgs 2>$null

  if ($LASTEXITCODE -ne 0) {
    $pagesArgs[3] = "PUT"
    & $gh @pagesArgs
  }

  Write-Host "Site URL: $pagesUrl"
}
else {
  Write-Host "GitHub CLI (gh) is not installed. Enable Pages manually:"
  Write-Host "Settings -> Pages -> Branch: main / Folder: / (root)"
  Write-Host "Site URL: $pagesUrl"
}

Write-Host "Done."
