git reset HEAD~1
rm ./backport.sh
git cherry-pick d5377880e49ca32b03ba89c86a05136c10f7b41d
echo 'Resolve conflicts and force push this branch'
