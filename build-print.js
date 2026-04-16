const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/print/ticket.js'],
  bundle: true,
  outfile: 'dist/print-bundle.js',
  platform: 'browser',
  format: 'iife',
  minify: true,
  sourcemap: false,
}).then(() => {
  console.log('✅ Build successful');
}).catch((err) => {
  console.error('❌ Build failed:', err);
  process.exit(1);
});
