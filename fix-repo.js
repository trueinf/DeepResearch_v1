const { execSync } = require('child_process');

console.log('Fixing repository structure...\n');

try {
  // Set git pager to empty
  console.log('1. Disabling git pager...');
  execSync('git config --global core.pager ""', { stdio: 'inherit' });
  
  // Remove Downloads from git cache
  console.log('2. Removing nested Downloads structure from git...');
  try {
    execSync('git rm -r --cached "Downloads"', { stdio: 'inherit' });
  } catch (e) {
    console.log('   (Downloads folder not in git cache, continuing...)');
  }
  
  // Add all files
  console.log('3. Adding all files at root level...');
  execSync('git add -A', { stdio: 'inherit' });
  
  // Check status
  console.log('4. Checking status...');
  const status = execSync('git status --short', { encoding: 'utf8' });
  console.log(status.substring(0, 500));
  
  // Commit
  console.log('\n5. Committing changes...');
  execSync('git commit -m "Fix: Move all files to repository root"', { stdio: 'inherit' });
  
  // Push
  console.log('\n6. Pushing to GitHub (force push)...');
  execSync('git push origin main --force', { stdio: 'inherit' });
  
  console.log('\n✅ Done! Files should now be at repository root on GitHub.');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}

