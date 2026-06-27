# GitHub へアップロードして GitHub Pages を有効化するスクリプト
$ErrorActionPreference = "Stop"

$env:Path = "C:\Program Files\Git\cmd;" + $env:Path
$git = "C:\Program Files\Git\cmd\git.exe"
$gh = "C:\Program Files\GitHub CLI\gh.exe"
$repoUrl = "https://github.com/wada0619/expression-theme-maker.git"
$pagesUrl = "https://wada0619.github.io/expression-theme-maker/"

Set-Location $PSScriptRoot

if (-not (Test-Path $git)) {
  Write-Host "Git が見つかりません。https://git-scm.com/download/win からインストールしてください。"
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

Write-Host "GitHub へ push します。ブラウザで GitHub ログインを求められたら承認してください。"
& $git push -u origin main

if (Test-Path $gh) {
  Write-Host "GitHub Pages を有効化しています..."
  & $gh auth status 2>$null
  if ($LASTEXITCODE -ne 0) {
    & $gh auth login -w -p https -h github.com
  }
  & $gh api repos/wada0619/expression-theme-maker/pages -X POST -f build_type=legacy -f source[branch]=main -f source[path]=/ 2>$null
  if ($LASTEXITCODE -ne 0) {
    & $gh api repos/wada0619/expression-theme-maker/pages -X PUT -f build_type=legacy -f source[branch]=main -f source[path]=/
  }
  Write-Host "公開 URL: $pagesUrl"
} else {
  Write-Host "GitHub CLI (gh) が未インストールのため、Pages は手動設定が必要です。"
  Write-Host "Settings → Pages → Branch: main / Folder: / (root)"
  Write-Host "公開 URL: $pagesUrl"
}

Write-Host "完了しました。"
