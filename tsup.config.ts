import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    minify: true,
    sourcemap: true,
    outExtension({ format }) {
      return { js: format === 'esm' ? '.mjs' : '.js' };
    },
  },
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'TextTweener',
    minify: true,
    sourcemap: true,
    outDir: 'dist',
    outExtension() {
      return { js: '.umd.min.js' };
    },
  },
]);
