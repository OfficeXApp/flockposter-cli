import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/api.ts', 'src/config.ts'],
  format: ['cjs'],
  dts: false, // Disable DTS generation to avoid type issues
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  banner: {
    js: '#!/usr/bin/env node',
  },
});
