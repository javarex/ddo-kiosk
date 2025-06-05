// build-renderer.js

const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/renderer/index.js'],   // your Alpine entry
  bundle: true,
  outfile: 'dist/bundle.js',                // output file
  format: 'esm',                            // to avoid eval issues
  minify: true,
  sourcemap: true,
  target: ['chrome110'],                    // or your Electron target
}).catch(() => process.exit(1));
