<p align="center">
  <img src="https://gitlab.com/zairakai/npm-packages/js-http-client/-/raw/main/assets/icon.png" alt="JS HTTP Client" width="160">
</p>

# JS HTTP Client

[![Main][pipeline-main-badge]][pipeline-main-link]
[![Develop][pipeline-develop-badge]][pipeline-develop-link]
[![Coverage][coverage-badge]][coverage-link]

[![npm][npm-badge]][npm-link]
[![Docs][docs-badge]][docs]
[![GitLab Release][gitlab-release-badge]][gitlab-release]
[![License][license-badge]][license]

[![Node.js][node-badge]][node]
[![ESLint][eslint-badge]][eslint]
[![Prettier][prettier-badge]][prettier]
[![Vitest][vitest-badge]][vitest]
[![Knip][knip-badge]][knip]

Axios-based HTTP client with request tracking, interceptor management, and Laravel CSRF support.

**Documentation: [js-http-client-eb9079.gitlab.io][docs]**

---

## Features

- **Three factory functions** - `createHttpClient`, `createApiClient`, `createLaravelClient`
- **Request tracking** - reactive `isLoading` and `requestCount` per client instance
- **Built-in interceptors** - CSRF token, auth bearer, retry with backoff, error logging, timeout
- **Laravel ready** - automatic `X-Requested-With` and CSRF headers
- **TypeScript first** - full type exports including `AxiosInstance`, `AxiosResponse`, `HttpMethod`

---

## Documentation

The documentation site has this guide and the reference of the API (the factory functions, their options and the interceptors) generated from the source with TypeDoc, for every released version (selector at the top right, `next` is `main`). Build it with `cd docs && npm ci && npm run dev`. It is published with GitLab Pages from `main`.

---

## Install

```bash
npm install @zairakai/js-http-client
```

### In the browser

The library is made for the web: ESM and CommonJS builds, no Node.js built-ins, `"sideEffects": false`, and `axios` stays external (your bundler picks it up as a dependency). A bundler keeps only what you import (the tests of this repository check it with esbuild): a project that imports `createRequestTracker` alone gets a few hundred bytes, and the interceptors have their own entry point:

```js
import { createHttpClient } from '@zairakai/js-http-client'
import { createAuthInterceptor } from '@zairakai/js-http-client/interceptors'
```

There is no minimum browser version.

---

## Usage

```ts
import { createHttpClient, createLaravelClient, createApiClient } from '@zairakai/js-http-client'

// Generic API client
const api = createHttpClient({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  authToken: () => localStorage.getItem('token'),
  retries: 3,
})

const { data } = await api.get<User>('/users/1')

// Laravel full-stack client (CSRF + credentials + Laravel headers)
const laravelApi = createLaravelClient({ baseURL: '/api' })
await laravelApi.post('/users', { name: 'Alice' })

// Pure API client (no Laravel headers)
const publicApi = createApiClient({ baseURL: 'https://public.api.com' })

// Request tracking
console.log(api.isLoading)     // true while requests are pending
console.log(api.requestCount)  // number of active requests
```

---

## Development

```bash
make quality       # eslint + prettier + knip + markdownlint
make quality-fix   # auto-fix all fixable issues
make test          # vitest
make test-all      # vitest + bats + coverage
```

---

## Getting Help

[![License][license-badge]][license]
[![Security Policy][security-badge]][security]
[![Issues][issues-badge]][issues]

**Made with ❤️ by [Zairakai][ecosystem]**

<!-- Reference Links -->

## Statistics

![Statistics of js-http-client][stats-card]

[pipeline-main-badge]: https://gitlab.com/zairakai/npm-packages/js-http-client/badges/main/pipeline.svg?ignore_skipped=true&key_text=Main
[pipeline-main-link]: https://gitlab.com/zairakai/npm-packages/js-http-client/-/commits/main
[pipeline-develop-badge]: https://gitlab.com/zairakai/npm-packages/js-http-client/badges/develop/pipeline.svg?ignore_skipped=true&key_text=Develop
[pipeline-develop-link]: https://gitlab.com/zairakai/npm-packages/js-http-client/-/commits/develop
[coverage-badge]: https://gitlab.com/zairakai/npm-packages/js-http-client/badges/main/coverage.svg
[coverage-link]: https://gitlab.com/zairakai/npm-packages/js-http-client/-/pipelines?ref=main
[npm-badge]: https://img.shields.io/npm/v/@zairakai/js-http-client
[npm-link]: https://www.npmjs.com/package/@zairakai/js-http-client
[gitlab-release-badge]: https://img.shields.io/gitlab/v/release/zairakai/npm-packages/js-http-client?logo=gitlab
[gitlab-release]: https://gitlab.com/zairakai/npm-packages/js-http-client/-/releases
[license-badge]: https://img.shields.io/badge/license-MIT-blue.svg
[license]: ./LICENSE
[security-badge]: https://img.shields.io/badge/security-scanned-green.svg
[security]: ./SECURITY.md
[issues-badge]: https://img.shields.io/gitlab/issues/open-raw/zairakai%2Fnpm-packages%2Fhttp-client?logo=gitlab&label=Issues
[issues]: https://gitlab.com/zairakai/npm-packages/js-http-client/-/issues
[node-badge]: https://img.shields.io/badge/node.js-%3E%3D24-green.svg?logo=node.js
[node]: https://nodejs.org
[eslint-badge]: https://img.shields.io/badge/code%20style-eslint-4B32C3.svg?logo=eslint
[eslint]: https://eslint.org
[prettier-badge]: https://img.shields.io/badge/formatter-prettier-F7B93E.svg?logo=prettier
[prettier]: https://prettier.io
[vitest-badge]: https://img.shields.io/badge/test-vitest-6E9F18.svg?logo=vitest
[vitest]: https://vitest.dev
[knip-badge]: https://img.shields.io/badge/dead%20code-knip-EC4899.svg
[knip]: https://knip.dev
[ecosystem]: https://gitlab.com/zairakai
[docs]: https://js-http-client-eb9079.gitlab.io
[docs-badge]: https://img.shields.io/badge/docs-online-blue
[stats-card]: https://gitlab.com/zairakai/gitlab-profile/-/raw/main/assets/projects/js-http-client.svg
