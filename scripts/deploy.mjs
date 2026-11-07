// Build → publish dist/ to the gh-pages branch (GitHub Pages).
import { execSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';

const REPO = 'https://github.com/mashaelfarajalla/almizan-3d.git';
const run = (cmd, cwd = 'dist') => execSync(cmd, { cwd, stdio: 'inherit' });

run('npx vite build', '.');
writeFileSync('dist/.nojekyll', '');
if (!existsSync('dist/.git')) {
  run('git init -q -b gh-pages');
  run(`git remote add origin ${REPO}`);
}
run('git add -A');
try { run(`git commit -q -m "deploy ${new Date().toISOString()}"`); } catch { console.log('nothing to deploy'); }
run('git push -f origin HEAD:gh-pages');
