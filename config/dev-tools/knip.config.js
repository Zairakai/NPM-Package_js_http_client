/**
 * Knip configuration
 * @see https://knip.dev/reference/configuration
 */
export default {
  project: ['src/**/*.ts'],
  ignoreBinaries: ['make'],
  // sort-package-json and tsup are run by the scripts of js-dev-tools (make build), which Knip does not read
  ignoreDependencies: ['sort-package-json', 'tsup'],
}
