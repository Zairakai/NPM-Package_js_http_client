/**
 * Knip configuration - extends the @zairakai/js-dev-tools base config.
 * @see https://knip.dev/reference/configuration
 */

import baseConfig from '@zairakai/js-dev-tools/config/knip.config.js'

export default {
  ...baseConfig,
  project: ['src/**/*.ts'],
  // The base ignores docs/**, stylelint and zod for the projects that have them: this one does not.
  ignore: [],
  ignoreDependencies: ['sort-package-json'],
}
