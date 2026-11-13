import axios, { AxiosError } from 'axios'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  createHttpClient,
  createRetryInterceptor,
  createShouldRetry,
  defaultShouldRetry,
  exponentialBackoff,
  isNetworkError,
} from '../../src/index.js'
import { closedUrl, startServer } from '../helpers/server.js'

// A client that retries, and records the attempt of each retry
const retrying = (baseURL: string, options = {}) => {
  const attempts: number[] = []
  const client = createHttpClient({
    baseURL,
    retries: 2,
    retryDelay: (attempt: number) => {
      attempts.push(attempt)
      return 1
    },
    enableErrorLogging: false,
    ...options,
  })

  return { client, attempts }
}

const errorOf = (code?: string, config = {}, response?: object) =>
  new AxiosError('failed', code, config as never, undefined, response as never)

afterEach(() => {
  vi.restoreAllMocks()
})

describe('retry by default', () => {
  it('retries a network failure of a method that reads, up to the number of retries', async () => {
    const { client, attempts } = retrying(await closedUrl())

    await expect(client.get('/')).rejects.toMatchObject({
      code: 'ECONNREFUSED',
    })
    expect(attempts).toEqual([1, 2])
  })

  it.each(['post', 'put', 'patch', 'delete'])(
    'does not retry %s: it writes',
    async (method) => {
      const { client, attempts } = retrying(await closedUrl())

      await expect(
        client.client.request({ url: '/', method }),
      ).rejects.toBeDefined()
      expect(attempts).toEqual([])
    },
  )

  it('retries a query, which is safe and idempotent', async () => {
    const { client, attempts } = retrying(await closedUrl())

    await expect(client.query('/', { q: 1 })).rejects.toBeDefined()
    expect(attempts).toEqual([1, 2])
  })

  it('does not retry a response of the server, a 500 included', async () => {
    const server = await startServer(500)
    const { client, attempts } = retrying(server.url)

    await expect(client.get('/')).rejects.toMatchObject({
      response: { status: 500 },
    })
    await server.close()

    expect(attempts).toEqual([])
    expect(server.requests).toHaveLength(1)
  })

  it('never retries a cancelled request', async () => {
    const server = await startServer('hang')
    const { client, attempts } = retrying(server.url)
    const controller = new AbortController()

    const request = client.get('/', { signal: controller.signal })
    controller.abort()

    await expect(request).rejects.toSatisfy((error) => axios.isCancel(error))
    await server.close()

    expect(attempts).toEqual([])
  })

  it('never retries a cancelled request, even when the condition would', async () => {
    const server = await startServer('hang')
    const { client, attempts } = retrying(server.url, {
      shouldRetry: () => true,
    })
    const controller = new AbortController()

    const request = client.get('/', { signal: controller.signal })
    controller.abort()

    await expect(request).rejects.toBeDefined()
    await server.close()

    expect(attempts).toEqual([])
  })

  it('retries a timeout, and can be told not to', async () => {
    const server = await startServer('hang')
    const retried = retrying(server.url, { timeout: 20 })
    const kept = retrying(server.url, {
      timeout: 20,
      shouldRetry: createShouldRetry({ retryTimeouts: false }),
    })

    await expect(retried.client.get('/')).rejects.toMatchObject({
      code: 'ECONNABORTED',
    })
    await expect(kept.client.get('/')).rejects.toMatchObject({
      code: 'ECONNABORTED',
    })
    await server.close()

    expect(retried.attempts).toEqual([1, 2])
    expect(kept.attempts).toEqual([])
  })

  it('stops as soon as a retry succeeds', async () => {
    const server = await startServer()
    const dead = await closedUrl()
    const { client, attempts } = retrying(dead)
    let calls = 0

    // The first answer is a failure of the network, the second reaches the server
    client.client.interceptors.request.use((config) => {
      calls += 1
      config.baseURL = calls === 1 ? dead : server.url

      return config
    })

    const response = await client.get('/')
    await server.close()

    expect(response.status).toBe(200)
    expect(attempts).toEqual([1])
  })
})

describe('retry and the count of requests', () => {
  it('counts each attempt, and the count is back to zero at the end', async () => {
    const { client } = retrying(await closedUrl())
    const counts: number[] = []

    client.subscribe((state) => counts.push(state.count))
    await expect(client.get('/')).rejects.toBeDefined()

    // the request and its two retries: each one starts and ends
    expect(counts).toEqual([1, 0, 1, 0, 1, 0])
    expect(client.requestCount).toBe(0)
    expect(client.isLoading).toBe(false)
  })

  it('has its own attempts for each request of the same client', async () => {
    const { client, attempts } = retrying(await closedUrl())

    await expect(client.get('/a')).rejects.toBeDefined()
    await expect(client.get('/b')).rejects.toBeDefined()

    expect(attempts).toEqual([1, 2, 1, 2])
  })

  it('retries several requests at the same time without mixing them', async () => {
    const { client, attempts } = retrying(await closedUrl())

    await Promise.allSettled([
      client.get('/a'),
      client.get('/b'),
      client.get('/c'),
    ])

    expect(attempts.sort()).toEqual([1, 1, 1, 2, 2, 2])
    expect(client.requestCount).toBe(0)
  })
})

describe('retry is open to the user', () => {
  it('can retry the methods that the user chooses', async () => {
    const { client, attempts } = retrying(await closedUrl(), {
      shouldRetry: createShouldRetry({ methods: ['GET', 'post'] }),
    })

    await expect(client.post('/', {})).rejects.toBeDefined()
    expect(attempts).toEqual([1, 2])
  })

  it('can retry the statuses that the user chooses', async () => {
    const server = await startServer(503)
    const { client, attempts } = retrying(server.url, {
      shouldRetry: createShouldRetry({ statuses: [502, 503] }),
    })

    await expect(client.get('/')).rejects.toBeDefined()
    await server.close()

    expect(attempts).toEqual([1, 2])
  })

  it('accepts a condition of its own, called with the attempt, that can be async', async () => {
    const seen: number[] = []
    const { client, attempts } = retrying(await closedUrl(), {
      retries: 5,
      shouldRetry: async (_error: AxiosError, attempt: number) => {
        seen.push(attempt)

        return attempt < 3
      },
    })

    await expect(client.get('/')).rejects.toBeDefined()

    expect(seen).toEqual([1, 2, 3])
    expect(attempts).toEqual([1, 2])
  })

  // The delay is checked with fake timers: nothing is sent before it is over
  const waits = async (
    interceptor: ReturnType<typeof createRetryInterceptor>,
    expected: number,
  ) => {
    vi.useFakeTimers()

    try {
      const request = vi.fn().mockResolvedValue({ status: 200 })
      const config = { method: 'get', url: '/', _axios: { request } }
      const pending = interceptor(errorOf('ERR_NETWORK', config))

      await vi.advanceTimersByTimeAsync(expected - 1)
      expect(request).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(1)
      await pending
      expect(request).toHaveBeenCalledOnce()
    } finally {
      vi.useRealTimers()
    }
  }

  it('accepts a fixed delay', async () => {
    await waits(
      createRetryInterceptor(1, 50, () => true),
      50,
    )
  })

  it('accepts a function that gives the delay', async () => {
    await waits(
      createRetryInterceptor(1, (attempt) => attempt * 70),
      70,
    )
  })

  it('has the defaults: 5 retries of 300 ms, network failures that read', async () => {
    await waits(createRetryInterceptor(), 300)
  })

  it('gives up after the number of retries', async () => {
    const interceptor = createRetryInterceptor(5, 1)
    const config = { method: 'get', url: '/', __retryCount: 5 }
    const error = errorOf('ERR_NETWORK', config)

    await expect(interceptor(error)).rejects.toBe(error)
  })

  it('has nothing to retry without the config of the request', async () => {
    const error = new AxiosError('failed', 'ERR_NETWORK')

    await expect(createRetryInterceptor()(error)).rejects.toBe(error)
  })

  it('falls back to axios when the request has no client', async () => {
    const spy = vi.spyOn(axios, 'request').mockResolvedValue({ status: 200 })
    const config = { method: 'get', url: '/' }

    await createRetryInterceptor(1, 0)(errorOf('ERR_NETWORK', config))

    expect(spy).toHaveBeenCalledOnce()
  })
})

describe('exponentialBackoff', () => {
  it('doubles the delay at each attempt from 300 ms, without jitter', () => {
    const delay = exponentialBackoff({ jitter: 0 })

    expect([1, 2, 3, 4].map(delay)).toEqual([300, 600, 1200, 2400])
  })

  it('does not go past the maximum', () => {
    const delay = exponentialBackoff({ base: 1000, max: 3000, jitter: 0 })

    expect([1, 2, 3, 4].map(delay)).toEqual([1000, 2000, 3000, 3000])
  })

  it('takes its own base and factor', () => {
    const delay = exponentialBackoff({ base: 100, factor: 3, jitter: 0 })

    expect([1, 2, 3].map(delay)).toEqual([100, 300, 900])
  })

  it('takes away a random part of the delay, half of it at most by default', () => {
    const random = vi.spyOn(Math, 'random')
    const delay = exponentialBackoff()

    random.mockReturnValue(0)
    expect(delay(1)).toBe(300)
    random.mockReturnValue(1)
    expect(delay(1)).toBe(150)
  })

  it('keeps the jitter between 0 and 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1)

    expect(exponentialBackoff({ jitter: 5 })(1)).toBe(0)
    expect(exponentialBackoff({ jitter: -1 })(1)).toBe(300)
  })

  it('is a delay for the interceptor', async () => {
    const delay = exponentialBackoff({ base: 1, jitter: 0 })
    const delays: number[] = []
    const { client } = retrying(await closedUrl(), {
      retryDelay: (attempt: number) => {
        delays.push(delay(attempt))

        return 0
      },
    })

    await expect(client.get('/')).rejects.toBeDefined()
    expect(delays).toEqual([1, 2])
  })
})

describe('isNetworkError and the default condition', () => {
  it('knows a network failure', () => {
    expect(isNetworkError(errorOf('ERR_NETWORK'))).toBe(true)
    expect(isNetworkError(errorOf('ECONNRESET'))).toBe(true)
    expect(isNetworkError(errorOf(undefined))).toBe(true)
  })

  it('does not take for one what is not', () => {
    expect(isNetworkError(new Error('plain'))).toBe(false)
    expect(isNetworkError(errorOf('ERR_CANCELED'))).toBe(false)
    expect(isNetworkError(errorOf('ERR_BAD_REQUEST'))).toBe(false)
    expect(isNetworkError(errorOf('ERR_NETWORK', {}, { status: 500 }))).toBe(
      false,
    )
  })

  it('does not retry a cancelled request', () => {
    const cancelled = new axios.CanceledError('cancelled')

    expect(defaultShouldRetry(cancelled as never, 1)).toBe(false)
  })

  it('takes a request without a method for a get', () => {
    expect(defaultShouldRetry(errorOf('ERR_NETWORK'), 1)).toBe(true)
  })

  it('takes a failure without a code for a network failure', () => {
    expect(defaultShouldRetry(errorOf(undefined, { method: 'get' }), 1)).toBe(
      true,
    )
  })

  it('takes a timeout code that is not retried for a failure that is not', () => {
    const timedOut = errorOf('ETIMEDOUT', { method: 'get' })

    expect(createShouldRetry({ retryTimeouts: false })(timedOut, 1)).toBe(false)
    expect(createShouldRetry()(timedOut, 1)).toBe(true)
  })
})
