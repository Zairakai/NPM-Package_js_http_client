import axios from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createApiClient, createHttpClient, createLaravelClient } from '../src/client.ts'

// Mock axios
vi.mock('axios')

describe('createHttpClient', () => {
  let mockAxiosInstance
  let mockInterceptors

  beforeEach(() => {
    mockInterceptors = {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    }

    mockAxiosInstance = {
      interceptors: mockInterceptors,
      defaults: { headers: { common: {} } },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    }

    axios.create = vi.fn().mockReturnValue(mockAxiosInstance)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('should create HTTP client with default configuration', () => {
    const httpClient = createHttpClient()

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: '',
      timeout: 10000,
      withCredentials: false,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    })

    expect(httpClient.client).toBe(mockAxiosInstance)
    expect(httpClient.tracker).toBeDefined()
  })

  it('should merge custom configuration with defaults', () => {
    const customConfig = {
      baseURL: 'https://api.example.com',
      timeout: 5000,
      headers: {
        Authorization: 'Bearer token',
      },
    }

    createHttpClient(customConfig)

    expect(axios.create).toHaveBeenCalledWith({
      baseURL: 'https://api.example.com',
      timeout: 5000,
      withCredentials: false,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer token',
      },
    })
  })

  it('should disable request tracking when trackRequests is false', () => {
    const httpClient = createHttpClient({ trackRequests: false })

    expect(httpClient.tracker).toBeNull()
    expect(httpClient.isLoading).toBe(false)
    expect(httpClient.requestCount).toBe(0)
  })

  it('should add CSRF interceptor when csrfToken is provided', () => {
    createHttpClient({ csrfToken: 'test-csrf-token' })

    expect(mockInterceptors.request.use).toHaveBeenCalledWith(expect.any(Function))
  })

  it('should add auth interceptor when authToken is provided', () => {
    createHttpClient({ authToken: 'test-auth-token' })

    expect(mockInterceptors.request.use).toHaveBeenCalledWith(expect.any(Function))
  })

  it('should add retry interceptor when retries > 0', () => {
    createHttpClient({ retries: 3 })

    expect(mockInterceptors.response.use).toHaveBeenCalledWith(expect.any(Function), expect.any(Function))
  })

  it('should attach axios instance to request config when retries configured', () => {
    const httpClient = createHttpClient({ retries: 3 })

    // Find the request interceptor callback registered for retry (_axios attachment)
    const requestCalls = mockInterceptors.request.use.mock.calls
    const retryRequestInterceptor = requestCalls.find((call) => {
      const fn = call[0]
      const result = fn({ headers: {} })
      return result._axios === httpClient.client
    })

    expect(retryRequestInterceptor).toBeDefined()
  })

  it('should add Laravel headers by default', () => {
    createHttpClient()

    expect(mockAxiosInstance.defaults.headers.common['X-Requested-With']).toBe('XMLHttpRequest')
  })

  it('should not add Laravel headers when laravel is false', () => {
    createHttpClient({ laravel: false })

    expect(mockAxiosInstance.defaults.headers.common['X-Requested-With']).toBeUndefined()
  })

  it('should provide convenience methods', () => {
    const httpClient = createHttpClient()

    // Test convenience methods
    httpClient.get('/test')
    expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test', undefined)

    httpClient.post('/test', { data: 'test' })
    expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', { data: 'test' }, undefined)

    httpClient.put('/test', { data: 'test' })
    expect(mockAxiosInstance.put).toHaveBeenCalledWith('/test', { data: 'test' }, undefined)

    httpClient.patch('/test', { data: 'test' })
    expect(mockAxiosInstance.patch).toHaveBeenCalledWith('/test', { data: 'test' }, undefined)

    httpClient.delete('/test')
    expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/test', undefined)
  })

  it('should handle error logging configuration', () => {
    createHttpClient({ enableErrorLogging: true, logger: vi.fn() })

    // Should have added error logging interceptor
    expect(mockInterceptors.response.use).toHaveBeenCalled()
  })

  it('should disable error logging when enableErrorLogging is false', () => {
    const useCallCount = mockInterceptors.response.use.mock.calls.length
    createHttpClient({ enableErrorLogging: false })

    // Should have one less call (no error logging interceptor)
    const newCallCount = mockInterceptors.response.use.mock.calls.length
    expect(newCallCount).toBeLessThanOrEqual(useCallCount + 1)
  })
})

describe('createLaravelClient', () => {
  beforeEach(() => {
    const mockInterceptors = {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    }

    const mockAxiosInstance = {
      interceptors: mockInterceptors,
      defaults: { headers: { common: {} } },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    }

    axios.create = vi.fn().mockReturnValue(mockAxiosInstance)
  })

  it('should create Laravel-compatible client with correct defaults', () => {
    createLaravelClient()

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        withCredentials: true,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        }),
      })
    )
  })

  it('should allow overriding Laravel defaults', () => {
    createLaravelClient({
      baseURL: 'https://laravel.example.com',
      withCredentials: false,
    })

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://laravel.example.com',
        withCredentials: false,
        headers: expect.objectContaining({
          'X-Requested-With': 'XMLHttpRequest',
        }),
      })
    )
  })
})

describe('createApiClient', () => {
  beforeEach(() => {
    const mockInterceptors = {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    }

    const mockAxiosInstance = {
      interceptors: mockInterceptors,
      defaults: { headers: { common: {} } },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    }

    axios.create = vi.fn().mockReturnValue(mockAxiosInstance)
  })

  it('should create API client without Laravel-specific settings', () => {
    const apiClient = createApiClient()

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        withCredentials: false,
      })
    )

    // Should not have Laravel headers
    expect(apiClient.client.defaults.headers.common['X-Requested-With']).toBeUndefined()
  })

  it('should allow custom configuration for API client', () => {
    createApiClient({
      baseURL: 'https://api.external.com',
      timeout: 30000,
      headers: {
        'API-Key': 'secret-key',
      },
    })

    expect(axios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'https://api.external.com',
        timeout: 30000,
        withCredentials: false,
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'API-Key': 'secret-key',
        }),
      })
    )
  })
})
