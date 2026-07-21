import { defineConfig } from 'tsup'

export default defineConfig([
  {
    entry: ['src/adapters/mcp/index.ts'],
    format: ['esm'],
    outDir: 'dist/adapters/mcp',
    outExtension: () => ({ js: '.js' }),
    clean: false,
    sourcemap: false,
    splitting: false,
  },
  {
    entry: ['src/adapters/cli/index.ts'],
    format: ['esm'],
    outDir: 'dist/adapters/cli',
    outExtension: () => ({ js: '.js' }),
    clean: false,
    sourcemap: false,
    splitting: false,
  },
  {
    entry: ['src/daemon/server.ts'],
    format: ['esm'],
    outDir: 'dist/daemon',
    outExtension: () => ({ js: '.js' }),
    clean: false,
    sourcemap: false,
    splitting: false,
  },
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    outDir: 'dist',
    outExtension: () => ({ js: '.js' }),
    dts: true,
    clean: false,
    sourcemap: false,
    splitting: false,
  },
])
