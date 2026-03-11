#!/usr/bin/env bats
#
# Unit Tests — Package Structure
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

@test "tsup.config.js exists" {
    assert_file_exists "${PROJECT_ROOT}/tsup.config.js"
}

@test "vitest.config.js exists" {
    assert_file_exists "${PROJECT_ROOT}/vitest.config.js"
}

@test "eslint.config.js exists" {
    assert_file_exists "${PROJECT_ROOT}/eslint.config.js"
}

@test "prettier.config.js exists" {
    assert_file_exists "${PROJECT_ROOT}/prettier.config.js"
}

@test "config/dev-tools/knip.config.js exists" {
    assert_file_exists "${PROJECT_ROOT}/config/dev-tools/knip.config.js"
}

# ============================================================================
# npm — no yarn
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
