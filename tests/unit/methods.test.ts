import { describe, expect, it } from 'vitest'
import {
  createApiClient,
  createHttpClient,
  createLaravelClient,
  createShouldRetry,
  type HttpMethod,
} from '../../src/index.js'
import { closedUrl, startServer } from '../helpers/server.js'

// Each method has its shortcut: the method, and how the shortcut is called
const shortcuts = [
  { method: 'GET', call: (c: Client, u: string) => c.get(u) },
  { method: 'HEAD', call: (c: Client, u: string) => c.head(u) },
  { method: 'OPTIONS', call: (c: Client, u: string) => c.options(u) },
  { method: 'POST', call: (c: Client, u: string) => c.post(u, { a: 1 }) },
  { method: 'PUT', call: (c: Client, u: string) => c.put(u, { a: 1 }) },
  { method: 'PATCH', call: (c: Client, u: string) => c.patch(u, { a: 1 }) },
  { method: 'DELETE', call: (c: Client, u: string) => c.delete(u) },
  { method: 'QUERY', call: (c: Client, u: string) => c.query(u, { a: 1 }) },
]

type Client = ReturnType<typeof createHttpClient>

const reading = ['GET', 'HEAD', 'OPTIONS', 'QUERY']

describe('a shortcut for each HTTP method', () => {
  it.each(shortcuts)(
    '$method sends a $method request',
    async ({ method, call }) => {
      const server = await startServer()
      const client = createHttpClient({ baseURL: server.url })

      const response = await call(client, '/path')
      await server.close()

      expect(response.status).toBe(200)
      expect(server.requests[0]?.method).toBe(method)
      expect(server.requests[0]?.url).toBe('/path')
    },
  )

  it.each(
    shortcuts.filter(
      ({ method }) => !['GET', 'HEAD', 'OPTIONS', 'DELETE'].includes(method),
    ),
  )('$method carries its data in the body, as JSON', async ({ call }) => {
    const server = await startServer()
    const client = createHttpClient({ baseURL: server.url })

    await call(client, '/')
    await server.close()

    expect(JSON.parse(server.requests[0]?.body ?? '')).toEqual({ a: 1 })
    expect(server.requests[0]?.headers['content-type']).toContain(
      'application/json',
    )
  })

  it('takes the config of the request on every shortcut: headers, params', async () => {
    const server = await startServer()
    const client = createHttpClient({ baseURL: server.url })

    await client.query(
      '/search',
      { q: 1 },
      {
        headers: { 'Content-Type': 'application/graphql' },
        params: { page: 2 },
      },
    )
    await server.close()

    expect(server.requests[0]?.headers['content-type']).toBe(
      'application/graphql',
    )
    expect(server.requests[0]?.url).toBe('/search?page=2')
  })

  it('is on the three kinds of client', async () => {
    const server = await startServer()

    for (const create of [
      createHttpClient,
      createApiClient,
      createLaravelClient,
    ]) {
      const client = create({ baseURL: server.url })

      for (const { call } of shortcuts) {
        expect((await call(client, '/')).status).toBe(200)
      }
    }

    await server.close()
    expect(server.requests).toHaveLength(shortcuts.length * 3)
  })

  it('lists them all in the type, QUERY included', () => {
    const methods: HttpMethod[] = shortcuts.map(
      ({ method }) => method as HttpMethod,
    )

    expect(methods).toHaveLength(8)
  })
})

describe('the retry of each HTTP method follows its parameters', () => {
  const retried = async (method: string, retry = {}) => {
    const attempts: number[] = []
    const client = createHttpClient({
      baseURL: await closedUrl(),
      retries: 2,
      retryDelay: (attempt: number) => {
        attempts.push(attempt)

        return 1
      },
      enableErrorLogging: false,
      ...retry,
    })
    const call = shortcuts.find((shortcut) => shortcut.method === method)!.call

    await expect(call(client, '/')).rejects.toBeDefined()

    return attempts
  }

  it.each(shortcuts.map(({ method }) => method))(
    'by default, %s is retried only if it only reads',
    async (method) => {
      expect(await retried(method)).toEqual(
        reading.includes(method) ? [1, 2] : [],
      )
    },
  )

  it.each(shortcuts.map(({ method }) => method))(
    "with methods: 'all', %s is retried",
    async (method) => {
      const shouldRetry = createShouldRetry({ methods: 'all' })

      expect(await retried(method, { shouldRetry })).toEqual([1, 2])
    },
  )

  it.each(shortcuts.map(({ method }) => method))(
    'with the methods of the user, %s is retried only if it is listed',
    async (method) => {
      const shouldRetry = createShouldRetry({ methods: ['put', 'delete'] })

      expect(await retried(method, { shouldRetry })).toEqual(
        ['PUT', 'DELETE'].includes(method) ? [1, 2] : [],
      )
    },
  )
})
