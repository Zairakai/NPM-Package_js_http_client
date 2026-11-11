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
      // cobertura is read by the pipeline (coverage/cobertura-coverage.xml)
      reporter: ['text', 'lcov', 'html', 'cobertura'],
      exclude: [
        ...(baseCoverage.exclude ?? []),
        'tests/**',
        'config/dev-tools/vitest.config.js',
        'config/dev-tools/eslint.config.js',
        'config/dev-tools/prettier.config.js',
        'config/dev-tools/tsup.config.js',
      ],
    },
  },
})
