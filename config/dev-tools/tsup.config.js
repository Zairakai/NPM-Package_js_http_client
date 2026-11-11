import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    interceptors: 'src/interceptors.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: ['axios'],
})
