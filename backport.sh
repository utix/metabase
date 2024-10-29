git reset HEAD~1
rm ./backport.sh
git cherry-pick 16a4ac4aae51dba8ab6cdf21898748f80f175842
echo 'Resolve conflicts and force push this branch'
