$commitMessage = Read-Host "Enter commit message (Press Enter for default: 'Auto-update')"
if ([string]::IsNullOrWhiteSpace($commitMessage)) {
    $commitMessage = "Auto-update"
}

git add .
git commit -m $commitMessage
git push origin main

Write-Host "✅ Pushed successfully to GitHub (https://github.com/Nae0000/Pms.git)!" -ForegroundColor Green
