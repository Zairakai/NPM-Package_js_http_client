import { describe, expect, it } from 'vitest'
import { createApiClient, createHttpClient, createLaravelClient } from '../../src/client'

describe('http client factory', () => {
  it('sets default headers and laravel header', () => {
    const client = createHttpClient()

    expect(client.client.defaults.headers.common['Accept']).toContain('application/json')
    expect(client.client.defaults.headers.common['X-Requested-With']).toBe('XMLHttpRequest')
  })

  it('creates api client without laravel headers', () => {
    const client = createApiClient()
    expect(client.client.defaults.headers.common['X-Requested-With']).toBeUndefined()
  })

  it('creates laravel client with credentials', () => {
    const client = createLaravelClient()
    expect(client.client.defaults.withCredentials).toBe(true)
    expect(client.client.defaults.headers.common['X-Requested-With']).toBe('XMLHttpRequest')
  })

  it('returns false/0 for isLoading/requestCount when tracking is disabled', () => {
    const client = createHttpClient({ trackRequests: false })
    expect(client.isLoading).toBe(false)
    expect(client.requestCount).toBe(0)
  })
})
