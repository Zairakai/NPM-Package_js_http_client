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
- **Request tracking** - `isLoading` and `requestCount`, and `subscribe` to be told when they change, per client or shared
- **Built-in interceptors** - CSRF token, auth bearer, retry (fixed or exponential delay), error logging, timeout
- **A shortcut for each HTTP method** - `get`, `head`, `options`, `post`, `put`, `patch`, `delete` and `query`
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

<details>
<summary>Follow the requests in progress: subscribe, for a loading bar</summary>

`subscribe` calls a function each time the number of requests in progress changes, with `{ count, isActive }`. It returns the function that removes it. The listener is not called when it subscribes: read `requestCount` for the first value.

```ts
import { createHttpClient, createRequestTracker } from '@zairakai/js-http-client'

// One tracker for several clients: the count of the whole page
const tracker = createRequestTracker()
const api = createHttpClient({ baseURL: '/api', tracker })
const files = createHttpClient({ baseURL: '/files', tracker })

const stop = tracker.subscribe(({ count, isActive }) => {
  progressBar.hidden = !isActive // initial loading bar
})
```

`globalRequestTracker` is a shared tracker that you can pass the same way. `api.subscribe(...)` follows the tracker of that client.

</details>

<details>
<summary>Retry: network failures only, by default</summary>

The retry is off until you give `retries`. It works for every method, and by default it is careful: it retries a **failure of the network** (no response) of a **method that only reads** (see the table of the methods), up to the number of `retries`, and never a cancelled request. A response of the server, a `500` included, is an answer: it is not retried. A method that writes is not either, so that nothing is written twice. Open it up with `methods`, a list or `'all'`.

```ts
import {
  createHttpClient,
  createShouldRetry,
  exponentialBackoff,
} from '@zairakai/js-http-client'

const api = createHttpClient({
  baseURL: '/api',
  retries: 5,
  // 300 ms by default; a number, or a function of the attempt
  retryDelay: exponentialBackoff({ base: 300, factor: 2, max: 10000, jitter: 0.5 }),
  // open it up: also retry a 503, and a POST that you know is safe to repeat
  shouldRetry: createShouldRetry({ methods: ['get', 'post'], statuses: [503] }),
})
```

`createShouldRetry` takes `methods` (a list, or `'all'`), `statuses` and `retryTimeouts` (default `true`). You can write your own condition: `(error, attempt) => boolean | Promise<boolean>`, called before each retry.

</details>

<details>
<summary>HTTP methods: a shortcut for each one</summary>

| Shortcut | Method | Body | Retried by default |
| - | - | - | - |
| `get(url, config)` | GET | no | yes |
| `head(url, config)` | HEAD | no | yes |
| `options(url, config)` | OPTIONS | no | yes |
| `query(url, data, config)` | QUERY | yes | yes |
| `post(url, data, config)` | POST | yes | no |
| `put(url, data, config)` | PUT | yes | no |
| `patch(url, data, config)` | PATCH | yes | no |
| `delete(url, config)` | DELETE | no | no |

Every shortcut takes the config of the request (headers, params, signal...) and exists on the three kinds of client. The methods that are retried by default are the ones that only read; the next section opens any method up. `HttpMethod` lists them all.

`QUERY` ([RFC 10008](https://www.rfc-editor.org/rfc/rfc10008.html)) is `GET` with the query in the body: safe and idempotent, for a search that is too long or too structured for the URL. Its body needs a `Content-Type` (JSON for an object), and a server answers a request without one with an error `4xx`.

A call to another origin with a method other than `GET`, `HEAD` or `POST` first sends a preflight request: the server has to allow the method in `Access-Control-Allow-Methods`.

</details>

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
[issues-badge]: https://img.shields.io/gitlab/issues/open-raw/zairakai%2Fnpm-packages%2Fjs-http-client?logo=gitlab&label=Issues
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
