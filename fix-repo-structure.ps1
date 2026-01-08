# Fix repository structure - move files to root
$env:GIT_PAGER = ""
git config --global core.pager ""

Write-Host "Removing nested Downloads structure from git..."
git rm -r --cached "Downloads" 2>&1 | Out-Null

Write-Host "Adding all files at root level..."
git add .

Write-Host "Committing changes..."
git commit -m "Fix: Move all files to repository root"

Write-Host "Pushing to GitHub (force push)..."
git push origin main --force

Write-Host "Done! Files should now be at repository root on GitHub."

