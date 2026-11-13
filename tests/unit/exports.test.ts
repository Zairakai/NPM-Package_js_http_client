import { describe, expect, it } from 'vitest'
import * as library from '../../src/index.js'
import * as interceptors from '../../src/interceptors.js'

describe('what the package exports', () => {
  it('exports the retry helpers from the two entries: the library and ./interceptors', () => {
    for (const name of [
      'createRetryInterceptor',
      'createShouldRetry',
      'defaultShouldRetry',
      'exponentialBackoff',
      'isNetworkError',
    ]) {
      expect(library, name).toHaveProperty(name)
      expect(interceptors, name).toHaveProperty(name)
      expect((library as Record<string, unknown>)[name]).toBeTypeOf('function')
    }
  })

  it('exports the tracking functions', () => {
    expect(library.createRequestTracker).toBeTypeOf('function')
    expect(library.globalRequestTracker.subscribe).toBeTypeOf('function')
  })

  it('exports the three kinds of client and axios', () => {
    for (const name of [
      'createHttpClient',
      'createApiClient',
      'createLaravelClient',
      'axios',
    ]) {
      expect(library, name).toHaveProperty(name)
    }
  })
})
