// build-renderer.js (put at project root)

const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/renderer/index.js'],
  bundle: true,
  outfile: 'dist/renderer.js',
  platform: 'browser',
  sourcemap: true,
  minify: false,
}).catch(() => process.exit(1));
