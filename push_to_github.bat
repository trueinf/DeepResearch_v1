@echo off
cd /d C:\Users\Deepika\askDepth1
echo === Checking Git Status ===
git status
echo.
echo === Checking Remote ===
git remote -v
echo.
echo === Last Commit ===
git log --oneline -1
echo.
echo === Staging Changes ===
git add .
echo.
echo === Committing ===
git commit -m "Enhanced PPTX generation: removed title slide, improved layout, navy blue theme, removed HTML download"
echo.
echo === Pushing to GitHub ===
git push origin main
echo.
echo === Push Complete - Check GitHub ===
pause

