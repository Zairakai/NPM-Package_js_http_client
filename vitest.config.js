import baseConfig from '@zairakai/js-dev-tools/vitest'
import { defineConfig } from 'vitest/config'

const baseTest = baseConfig.test ?? {}
const baseCoverage = baseTest.coverage ?? {}

export default defineConfig({
  ...baseConfig,
  test: {
    ...baseTest,
    environment: 'node',
    globals: true,
    coverage: {
      ...baseCoverage,
      reporter: ['text', 'lcov', 'html', 'cobertura'],
      exclude: [
        ...(baseCoverage.exclude ?? []),
        'tests/**',
        'vitest.config.js',
        'eslint.config.js',
        'prettier.config.js',
        'rollup.config.js',
      ],
    },
  },
})
