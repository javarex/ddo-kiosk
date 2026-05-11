// build-web.js - builds web assets to www/ for Capacitor

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

// Ensure www directory exists
if (!fs.existsSync('www')) fs.mkdirSync('www', { recursive: true });
if (!fs.existsSync('www/assets')) fs.mkdirSync('www/assets', { recursive: true });

// Build JS
esbuild.build({
  entryPoints: ['src/renderer/index.js'],
  bundle: true,
  outfile: 'www/renderer.js',
  platform: 'browser',
  sourcemap: false,
  minify: false,
}).then(() => {
  console.log('[build-web] JS built to www/renderer.js');
}).catch(() => process.exit(1));

// Copy and fix index.html paths
const html = fs.readFileSync('src/renderer/index.html', 'utf8')
  .replace(/src="\.\.\/\.\.\/dist\/renderer\.js"/g, 'src="./renderer.js"')
  .replace(/href="\.\.\/\.\.\/dist\/bundle\.css"/g, 'href="./bundle.css"')
  .replace(/src="\.\.\/\.\.\/assets\//g, 'src="./assets/')
  .replace(/\.\.\/\.\.\/assets\//g, './assets/')
  .replace(/\.\.\/assets\//g, './assets/')
  .replace(/<script type="module" src="\.\.\/\.\.\/dist\/bundle\.js"><\/script>/g,
           '<script type="module" src="./renderer.js"></script>');

fs.writeFileSync('www/index.html', html);
console.log('[build-web] index.html copied to www/');

// Copy assets recursively
function copyDir(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

copyDir('assets', 'www/assets');
console.log('[build-web] Assets copied to www/assets/');
