#!/usr/bin/env bash
#
# BATS Test Helpers
#

setup_test_env() {
  export PROJECT_ROOT
  PROJECT_ROOT="$(cd "${BATS_TEST_DIRNAME}/../../.." && pwd)"
}

teardown_test_env() {
  unset PROJECT_ROOT
}

assert_file_exists() {
  local file="$1"

  if [[ ! -f "$file" ]]; then
    echo "ASSERTION FAILED: File does not exist: $file" >&2
    return 1
  fi
}

assert_file_contains() {
  local file="$1"
  local text="$2"

  if ! grep -qF -- "$text" "$file"; then
    echo "ASSERTION FAILED: ${file} does not contain: ${text}" >&2
    return 1
  fi
}

assert_file_not_contains() {
  local file="$1"
  local text="$2"

  if grep -qF -- "$text" "$file"; then
    echo "ASSERTION FAILED: ${file} contains: ${text}" >&2
    return 1
  fi
}

assert_same_file() {
  if ! diff -q "$1" "$2" >/dev/null; then
    echo "ASSERTION FAILED: $1 and $2 differ" >&2
    return 1
  fi
}
