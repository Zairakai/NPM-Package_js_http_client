#!/usr/bin/env bats
#
# Unit Tests - Package Structure
# Verifies required files are present and package is correctly configured.
#

load '../helpers/test_helper'

setup() {
  setup_test_env
}

teardown() {
  teardown_test_env
}

# ============================================================================
# Root config files
# ============================================================================

@test ".gitlab-ci.yml exists" {
  assert_file_exists "${PROJECT_ROOT}/.gitlab-ci.yml"
}

@test "Makefile exists" {
  assert_file_exists "${PROJECT_ROOT}/Makefile"
}

@test ".editorconfig exists" {
  assert_file_exists "${PROJECT_ROOT}/.editorconfig"
}

@test "tsconfig.json exists" {
  assert_file_exists "${PROJECT_ROOT}/tsconfig.json"
}

@test ".gitattributes exists" {
  assert_file_exists "${PROJECT_ROOT}/.gitattributes"
}

@test ".npmrc exists" {
  assert_file_exists "${PROJECT_ROOT}/.npmrc"
}

@test "LICENSE exists" {
  assert_file_exists "${PROJECT_ROOT}/LICENSE"
}

@test "the root files for the editors exist" {
  assert_file_exists "${PROJECT_ROOT}/eslint.config.mjs"
  assert_file_exists "${PROJECT_ROOT}/prettier.config.mjs"
  assert_file_exists "${PROJECT_ROOT}/stylelint.config.mjs"
  assert_file_exists "${PROJECT_ROOT}/vitest.config.mjs"
  assert_file_exists "${PROJECT_ROOT}/.markdownlint.json"
}

@test "config/dev-tools/eslint.config.js exists" {
  assert_file_exists "${PROJECT_ROOT}/config/dev-tools/eslint.config.js"
}

@test "config/dev-tools/prettier.config.js exists" {
  assert_file_exists "${PROJECT_ROOT}/config/dev-tools/prettier.config.js"
}

@test "config/dev-tools/tsup.config.js exists" {
  assert_file_exists "${PROJECT_ROOT}/config/dev-tools/tsup.config.js"
}

@test "config/dev-tools/vitest.config.js exists" {
  assert_file_exists "${PROJECT_ROOT}/config/dev-tools/vitest.config.js"
}

@test "config/dev-tools/knip.config.js exists" {
  assert_file_exists "${PROJECT_ROOT}/config/dev-tools/knip.config.js"
}

# ============================================================================
# npm - no yarn
# ============================================================================

@test "yarn.lock does not exist" {
  run test -f "${PROJECT_ROOT}/yarn.lock"
  [ "$status" -ne 0 ]
}

# ============================================================================
# src/ entry points
# ============================================================================

@test "src/index.ts exists" {
  assert_file_exists "${PROJECT_ROOT}/src/index.ts"
}

@test "src/client.ts exists" {
  assert_file_exists "${PROJECT_ROOT}/src/client.ts"
}

@test "src/interceptors.ts exists" {
  assert_file_exists "${PROJECT_ROOT}/src/interceptors.ts"
}

@test "src/request-tracker.ts exists" {
  assert_file_exists "${PROJECT_ROOT}/src/request-tracker.ts"
}

# ============================================================================
# package.json
# ============================================================================

@test "package.json includes dist/ in files[]" {
  run grep -q '"dist"' "${PROJECT_ROOT}/package.json"
  [ "$status" -eq 0 ]
}

@test "package.json includes src/ in files[]" {
  run grep -q '"src"' "${PROJECT_ROOT}/package.json"
  [ "$status" -eq 0 ]
}

@test "package.json has publishConfig access public" {
  run grep -q '"access": "public"' "${PROJECT_ROOT}/package.json"
  [ "$status" -eq 0 ]
}

@test "package.json uses @zairakai/js-http-client" {
  run grep -q '"@zairakai/js-http-client"' "${PROJECT_ROOT}/package.json"
  [ "$status" -eq 0 ]
}

# ============================================================================
# .gitlab-ci.yml
# ============================================================================

@test ".gitlab-ci.yml includes pipeline-js-package.yml" {
  run grep -q 'pipeline-js-package.yml' "${PROJECT_ROOT}/.gitlab-ci.yml"
  [ "$status" -eq 0 ]
}

@test ".gitlab-ci.yml does not use ref: main" {
  run grep -q 'ref: main' "${PROJECT_ROOT}/.gitlab-ci.yml"
  [ "$status" -ne 0 ]
}

@test ".gitlab-ci.yml sets NPM_PACKAGE_NAME" {
  run grep -q 'NPM_PACKAGE_NAME' "${PROJECT_ROOT}/.gitlab-ci.yml"
  [ "$status" -eq 0 ]
}

@test "the thin files for the editor re-export config/dev-tools/" {
  for tool in eslint prettier stylelint vitest; do
    assert_file_exists "${PROJECT_ROOT}/${tool}.config.mjs"
    assert_file_contains "${PROJECT_ROOT}/${tool}.config.mjs" "config/dev-tools/${tool}.config.js"
  done
}

@test ".markdownlint.json extends config/dev-tools/" {
  assert_file_contains "${PROJECT_ROOT}/.markdownlint.json" "./config/dev-tools/.markdownlint.json"
}

@test "the ignore files at the root are copies of the ones in config/dev-tools/" {
  for file in .markdownlintignore .prettierignore .stylelintignore; do
    assert_same_file "${PROJECT_ROOT}/${file}" "${PROJECT_ROOT}/config/dev-tools/${file}"
  done
}

@test "config/dev-tools/ holds the configuration of each tool" {
  for file in eslint.config.js prettier.config.js stylelint.config.js knip.config.js vitest.config.js tsup.config.js \
    .markdownlint.json .markdownlintignore .prettierignore .stylelintignore; do
    assert_file_exists "${PROJECT_ROOT}/config/dev-tools/${file}"
  done
}

@test "the project ESLint config extends the base, which holds the rules" {
  assert_file_contains "${PROJECT_ROOT}/config/dev-tools/eslint.config.js" "@zairakai/js-dev-tools/config/eslint.config.js"
}

@test "the project Vitest config extends the base, which holds the coverage" {
  assert_file_contains "${PROJECT_ROOT}/config/dev-tools/vitest.config.js" "@zairakai/js-dev-tools/config/vitest.config.js"
}

@test "the project Knip config extends the base and checks the sources" {
  assert_file_contains "${PROJECT_ROOT}/config/dev-tools/knip.config.js" "@zairakai/js-dev-tools/config/knip.config.js"
  assert_file_contains "${PROJECT_ROOT}/config/dev-tools/knip.config.js" "src/**/*.ts"
}

@test "tsconfig.json extends the base of js-dev-tools" {
  assert_file_contains "${PROJECT_ROOT}/tsconfig.json" "@zairakai/js-dev-tools/tsconfig"
}

@test "package.json requires js-dev-tools 4.1" {
  assert_file_contains "${PROJECT_ROOT}/package.json" '"@zairakai/js-dev-tools": "^4.1.'
}

@test "package.json has the overrides of js-dev-tools" {
  for name in brace-expansion colord fast-uri js-yaml katex markdown-it minimatch nanoid re2js smol-toml; do
    assert_file_contains "${PROJECT_ROOT}/package.json" "\"${name}\":"
  done
}

@test ".editorconfig has the 80 columns of JavaScript and no 120" {
  assert_file_contains "${PROJECT_ROOT}/.editorconfig" "[*.{js,mjs,ts}]"
  assert_file_not_contains "${PROJECT_ROOT}/.editorconfig" "max_line_length = 120"
}

@test "package.json declares sideEffects false: no code runs on import" {
  assert_file_contains "${PROJECT_ROOT}/package.json" '"sideEffects": false'
}

@test ".gitignore ignores the coverage report" {
  assert_file_contains "${PROJECT_ROOT}/.gitignore" "/coverage"
}

@test "the Git hooks are the ones of js-dev-tools, not a local .githooks folder" {
  run test -d "${PROJECT_ROOT}/.githooks"
  [ "$status" -ne 0 ]
}

@test "no long dash (em or en) in the files of the repository" {
  cd "${PROJECT_ROOT}"
  local em en
  em="$(printf '\xe2\x80\x94')"
  en="$(printf '\xe2\x80\x93')"

  run git grep -Il --untracked -e "$em" -e "$en" -- . ':(exclude)package-lock.json' ':(exclude)docs/package-lock.json'

  [ "$status" -eq 1 ]
  [ -z "$output" ]
}

@test ".gitlab-ci.yml uses npm-packages/js-dev-tools project" {
  run grep -q 'npm-packages/js-dev-tools' "${PROJECT_ROOT}/.gitlab-ci.yml"
  [ "$status" -eq 0 ]
}

@test "the assets hold the icon and the banner, in both formats" {
  for file in icon.png icon.svg banner.png banner.svg; do
    assert_file_exists "${PROJECT_ROOT}/assets/${file}"
  done
}

@test "the README shows the icon, not the banner" {
  assert_file_contains "${PROJECT_ROOT}/README.md" "assets/icon.png"
  assert_file_not_contains "${PROJECT_ROOT}/README.md" "assets/banner.png"
}
