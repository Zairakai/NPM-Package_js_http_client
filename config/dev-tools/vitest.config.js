/**
 * Project Vitest configuration.
 * Extends the @zairakai/js-dev-tools base config: environment, coverage, thresholds and reports come from it.
 * The tests use the globals of Vitest (afterEach...).
 */

import baseConfig from '@zairakai/js-dev-tools/config/vitest.config.js'
import { defineConfig, mergeConfig } from 'vitest/config'

export default mergeConfig(
  baseConfig,
  defineConfig({ test: { globals: true } }),
)
