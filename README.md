# @zairakai/js-http-client

[![Main][pipeline-main-badge]][pipeline-main-link]
[![Develop][pipeline-develop-badge]][pipeline-develop-link]
[![Coverage][coverage-badge]][coverage-link]

[![npm][npm-badge]][npm-link]
[![GitLab Release][gitlab-release-badge]][gitlab-release]
[![License][license-badge]][license]

[![Node.js][node-badge]][node]
[![ESLint][eslint-badge]][eslint]
[![Prettier][prettier-badge]][prettier]

Axios-based HTTP client with request tracking, interceptor management, and Laravel CSRF support.

---

## Features

- **Three factory functions** — `createHttpClient`, `createApiClient`, `createLaravelClient`
- **Request tracking** — reactive `isLoading` and `requestCount` per client instance
- **Built-in interceptors** — CSRF token, auth bearer, retry with backoff, error logging, timeout
- **Laravel ready** — automatic `X-Requested-With` and CSRF headers
- **TypeScript first** — full type exports including `AxiosInstance`, `AxiosResponse`, `HttpMethod`

---

## Install

```bash
npm install @zairakai/js-http-client
```

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

## API

### Factory functions

| Function | Description |
| - | - |
| `createHttpClient(options?)` | Base factory. Full control over all options. |
| `createLaravelClient(options?)` | Adds `withCredentials`, `X-Requested-With`, and CSRF support. |
| `createApiClient(options?)` | Clean JSON API client without Laravel-specific headers. |

### Options

| Option | Type | Default | Description |
| - | - | - | - |
| `baseURL` | `string` | `''` | Base URL for all requests |
| `timeout` | `number` | `10000` | Request timeout in ms |
| `authToken` | `string \| (() => string)` | — | Bearer token or token factory |
| `csrfToken` | `string \| (() => string)` | — | CSRF token or factory |
| `retries` | `number` | `0` | Number of retry attempts on failure |
| `retryDelay` | `number` | `1000` | Delay between retries in ms |
| `trackRequests` | `boolean` | `true` | Enable `isLoading` / `requestCount` |
| `logger` | `Logger` | — | Custom error logger |

### Standalone interceptors

```ts
import { createRetryInterceptor, createAuthInterceptor, createCSRFInterceptor } from '@zairakai/js-http-client'
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
[node-badge]: https://img.shields.io/badge/node.js-%3E%3D22-green.svg?logo=node.js
[node]: https://nodejs.org
[eslint-badge]: https://img.shields.io/badge/code%20style-eslint-4B32C3.svg?logo=eslint
[eslint]: https://eslint.org
[prettier-badge]: https://img.shields.io/badge/formatter-prettier-F7B93E.svg?logo=prettier
[prettier]: https://prettier.io
[ecosystem]: https://gitlab.com/zairakai
