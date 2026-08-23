git add .
git commit -m "fix: apply surgical bug fixes to auth forms, ui touch, and routing"
git push origin experimental

git checkout dev
git merge experimental --ff-only
if ($LASTEXITCODE -ne 0) { git merge experimental -m "Merge experimental into dev" }
git push origin dev

git checkout main
git merge dev --ff-only
if ($LASTEXITCODE -ne 0) { git merge dev -m "Merge dev into main" }
git push origin main

git checkout backup
git merge main --ff-only
if ($LASTEXITCODE -ne 0) { git merge main -m "Merge main into backup" }
git push origin backup

git checkout main
