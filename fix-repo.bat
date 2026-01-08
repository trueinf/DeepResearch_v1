@echo off
set GIT_PAGER=
git config --global core.pager ""

echo Removing nested Downloads structure from git...
git rm -r --cached "Downloads" 2>nul

echo Adding all files at root level...
git add .

echo Committing changes...
git commit -m "Fix: Move all files to repository root"

echo Pushing to GitHub (force push)...
git push origin main --force

echo Done! Files should now be at repository root on GitHub.
pause

