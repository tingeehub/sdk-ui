import { defineConfig } from 'tsup';

export default defineConfig([
  // 1. Subpath modules for NPM (ESM + CJS + d.ts)
  {
    entry: {
      index: 'src/index.ts',
      react: 'src/react/index.tsx',
      vue: 'src/vue/index.ts',
      angular: 'src/angular/index.ts',
    },
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: false,
    minify: true,
    treeshake: true,
    external: ['react', 'react/jsx-runtime', 'vue', '@angular/core'],
  },
  // 2. Standalone IIFE/CDN bundles (drop-in replacements for <script> tags)
  {
    entry: {
      'tingee-bank-link.global': 'src/cdn/tingee-bank-link.ts',
      'tingee.global': 'src/cdn/tingee-checkout.ts',
    },
    format: ['iife'],
    dts: false,
    clean: false,
    sourcemap: false,
    minify: true,
    outExtension() {
      return {
        js: '.js',
      };
    },
  },
]);
