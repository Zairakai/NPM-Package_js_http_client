import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createAuthInterceptor,
  createCSRFInterceptor,
  createErrorLoggerInterceptor,
  createRetryInterceptor,
  createTimeoutInterceptor,
  createTrackingInterceptors,
} from '../src/interceptors.ts'

describe('createTrackingInterceptors', () => {
  let mockTracker
  let interceptors

  beforeEach(() => {
    mockTracker = {
      increment: vi.fn(),
      decrement: vi.fn(),
    }
    interceptors = createTrackingInterceptors(mockTracker)
  })

  it('should increment tracker on request', () => {
    const config = { url: '/test' }
    const result = interceptors.request(config)

    expect(mockTracker.increment).toHaveBeenCalledTimes(1)
    expect(result).toBe(config)
  })

  it('should reject request errors without affecting tracker', async () => {
    const error = new Error('Request error')

    await expect(interceptors.requestError(error)).rejects.toThrow('Request error')
    expect(mockTracker.increment).not.toHaveBeenCalled()
    expect(mockTracker.decrement).not.toHaveBeenCalled()
  })

  it('should decrement tracker on response', () => {
    const response = { data: 'test' }
    const result = interceptors.response(response)

    expect(mockTracker.decrement).toHaveBeenCalledTimes(1)
    expect(result).toBe(response)
  })

  it('should decrement tracker on response error', async () => {
    const error = new Error('Response error')

    await expect(interceptors.responseError(error)).rejects.toThrow('Response error')
    expect(mockTracker.decrement).toHaveBeenCalledTimes(1)
  })
})

describe('createCSRFInterceptor', () => {
  it('should add CSRF token to headers when token is string', () => {
    const interceptor = createCSRFInterceptor('test-csrf-token')
    const config = { url: '/test' }

    const result = interceptor(config)

    expect(result.headers['X-CSRF-TOKEN']).toBe('test-csrf-token')
  })

  it('should call function to get CSRF token', () => {
    const tokenFunction = vi.fn().mockReturnValue('dynamic-csrf-token')
    const interceptor = createCSRFInterceptor(tokenFunction)
    const config = { url: '/test' }

    const result = interceptor(config)

    expect(tokenFunction).toHaveBeenCalledTimes(1)
    expect(result.headers['X-CSRF-TOKEN']).toBe('dynamic-csrf-token')
  })

  it('should not add header when token is null or empty', () => {
    const interceptor = createCSRFInterceptor(null)
    const config = { url: '/test' }

    const result = interceptor(config)

    expect(result.headers).toBeUndefined()
  })

  it('should preserve existing headers', () => {
    const interceptor = createCSRFInterceptor('test-token')
    const config = {
      url: '/test',
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const result = interceptor(config)

    expect(result.headers['Content-Type']).toBe('application/json')
    expect(result.headers['X-CSRF-TOKEN']).toBe('test-token')
  })

  it('should handle function returning null', () => {
    const tokenFunction = vi.fn().mockReturnValue(null)
    const interceptor = createCSRFInterceptor(tokenFunction)
    const config = { url: '/test' }

    const result = interceptor(config)

    expect(tokenFunction).toHaveBeenCalledTimes(1)
    expect(result.headers).toBeUndefined()
  })
})

describe('createAuthInterceptor', () => {
  it('should add Bearer token by default', () => {
    const interceptor = createAuthInterceptor('test-auth-token')
    const config = { url: '/test' }

    const result = interceptor(config)

    expect(result.headers['Authorization']).toBe('Bearer test-auth-token')
  })

  it('should use custom token type', () => {
    const interceptor = createAuthInterceptor('test-auth-token', 'Token')
    const config = { url: '/test' }

    const result = interceptor(config)

    expect(result.headers['Authorization']).toBe('Token test-auth-token')
  })

  it('should call function to get auth token', () => {
    const tokenFunction = vi.fn().mockReturnValue('dynamic-auth-token')
    const interceptor = createAuthInterceptor(tokenFunction, 'Bearer')
    const config = { url: '/test' }

    const result = interceptor(config)

    expect(tokenFunction).toHaveBeenCalledTimes(1)
    expect(result.headers['Authorization']).toBe('Bearer dynamic-auth-token')
  })

  it('should not add header when token is null', () => {
    const interceptor = createAuthInterceptor(null)
    const config = { url: '/test' }

    const result = interceptor(config)

    expect(result.headers).toBeUndefined()
  })

  it('should preserve existing headers', () => {
    const interceptor = createAuthInterceptor('test-token')
    const config = {
      url: '/test',
      headers: {
        'Content-Type': 'application/json',
      },
    }

    const result = interceptor(config)

    expect(result.headers['Content-Type']).toBe('application/json')
    expect(result.headers['Authorization']).toBe('Bearer test-token')
  })
})

describe('createErrorLoggerInterceptor', () => {
  it('should log error with default console.error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const interceptor = createErrorLoggerInterceptor()
    const error = {
      config: { url: '/test', method: 'GET' },
      response: { status: 404, statusText: 'Not Found' },
    }

    await expect(interceptor(error)).rejects.toBe(error)
    expect(consoleSpy).toHaveBeenCalledWith(
      'HTTP Error:',
      expect.objectContaining({
        method: 'GET',
        url: '/test',
        status: 404,
        statusText: 'Not Found',
      })
    )

    consoleSpy.mockRestore()
  })

  it('should use custom logger', async () => {
    const customLogger = vi.fn()
    const interceptor = createErrorLoggerInterceptor(customLogger)
    const error = {
      config: { url: '/test', method: 'POST' },
      response: { status: 500, statusText: 'Internal Server Error' },
    }

    await expect(interceptor(error)).rejects.toBe(error)
    expect(customLogger).toHaveBeenCalledWith(
      'HTTP Error:',
      expect.objectContaining({
        method: 'POST',
        url: '/test',
        status: 500,
        statusText: 'Internal Server Error',
      })
    )
  })

  it('should handle error without response', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const interceptor = createErrorLoggerInterceptor()
    const error = {
      config: { url: '/test', method: 'GET' },
      message: 'Network Error',
    }

    await expect(interceptor(error)).rejects.toBe(error)
    expect(consoleSpy).toHaveBeenCalledWith(
      'HTTP Error:',
      expect.objectContaining({
        method: 'GET',
        url: '/test',
        message: 'Network Error',
      })
    )

    consoleSpy.mockRestore()
  })
})

describe('createTimeoutInterceptor', () => {
  it('should set timeout in config', () => {
    const interceptor = createTimeoutInterceptor(5000)
    const config = { url: '/test' }

    const result = interceptor(config)

    expect(result.timeout).toBe(5000)
  })

  it('should override existing timeout', () => {
    const interceptor = createTimeoutInterceptor(8000)
    const config = { url: '/test', timeout: 3000 }

    const result = interceptor(config)

    expect(result.timeout).toBe(8000)
  })

  it('should preserve other config properties', () => {
    const interceptor = createTimeoutInterceptor(5000)
    const config = {
      url: '/test',
      method: 'POST',
      data: { test: 'data' },
    }

    const result = interceptor(config)

    expect(result.url).toBe('/test')
    expect(result.method).toBe('POST')
    expect(result.data).toEqual({ test: 'data' })
    expect(result.timeout).toBe(5000)
  })
})

describe('createRetryInterceptor', () => {
  let mockAxiosInstance

  beforeEach(() => {
    mockAxiosInstance = {
      request: vi.fn(),
    }
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should retry failed requests up to maxRetries', async () => {
    const interceptor = createRetryInterceptor(2, 1000)
    const error = {
      config: { url: 'https://example.com/test', _axios: mockAxiosInstance },
      response: { status: 500 },
      isAxiosError: true,
    }

    // Mock the retry requests to succeed
    mockAxiosInstance.request.mockResolvedValueOnce({ data: 'success' })

    const retryPromise = interceptor(error)

    // Fast-forward timers for retries
    vi.advanceTimersByTime(1000)
    await Promise.resolve() // Allow promise to resolve

    await expect(retryPromise).resolves.toEqual({ data: 'success' })
    expect(mockAxiosInstance.request).toHaveBeenCalledTimes(1)
  })

  it('should not retry when max retries reached', async () => {
    const interceptor = createRetryInterceptor(1, 1000)
    const error = {
      config: { url: '/test', __retryCount: 1 },
      response: { status: 500 },
      isAxiosError: true,
    }

    await expect(interceptor(error)).rejects.toBe(error)
  })

  it('should not retry non-retryable errors', async () => {
    const shouldRetry = vi.fn().mockReturnValue(false)
    const interceptor = createRetryInterceptor(3, 1000, shouldRetry)
    const error = {
      config: { url: '/test' },
      response: { status: 404 },
      isAxiosError: true,
    }

    await expect(interceptor(error)).rejects.toBe(error)
    expect(shouldRetry).toHaveBeenCalledWith(error)
  })

  it('should use custom shouldRetry function', async () => {
    const shouldRetry = vi.fn().mockReturnValue(true)
    const interceptor = createRetryInterceptor(2, 1000, shouldRetry)
    const error = {
      config: { url: 'https://example.com/test', _axios: mockAxiosInstance },
      response: { status: 404 },
      isAxiosError: true,
    }

    mockAxiosInstance.request.mockResolvedValueOnce({ data: 'success' })

    const retryPromise = interceptor(error)
    vi.advanceTimersByTime(1000)

    await expect(retryPromise).resolves.toEqual({ data: 'success' })
    expect(shouldRetry).toHaveBeenCalledWith(error)
  })
})
