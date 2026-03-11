import { describe, expect, it, vi } from 'vitest'
import { createAuthInterceptor, createCSRFInterceptor, createRetryInterceptor } from '../../src/interceptors'

describe('interceptors', () => {
  it('adds csrf header', () => {
    const interceptor = createCSRFInterceptor('token')
    const config = interceptor({ headers: {} } as any)

    expect(config.headers['X-CSRF-TOKEN']).toBe('token')
  })

  it('adds auth header', () => {
    const interceptor = createAuthInterceptor(() => 'secret', 'Token')
    const config = interceptor({ headers: {} } as any)

    expect(config.headers.Authorization).toBe('Token secret')
  })

  it('retries when allowed', async () => {
    vi.useFakeTimers()
    const request = vi.fn().mockResolvedValue({ ok: true })
    const retry = createRetryInterceptor(1, 100, () => true)

    const error: any = {
      config: {
        __retryCount: 0,
        _axios: { request },
      },
    }

    const promise = retry(error)
    await vi.advanceTimersByTimeAsync(100)

    await expect(promise).resolves.toEqual({ ok: true })
    expect(request).toHaveBeenCalledTimes(1)

    vi.useRealTimers()
  })

  it('does not retry when shouldRetry returns false', async () => {
    const retry = createRetryInterceptor(2, 0, () => false)
    const error: any = { config: { __retryCount: 0 } }

    await expect(retry(error)).rejects.toBe(error)
  })
})
