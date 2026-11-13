import { createServer, type IncomingMessage, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'

export interface Recorded {
  method: string
  url: string
  headers: IncomingMessage['headers']
  body: string
}

export interface TestServer {
  url: string
  requests: Recorded[]
  close: () => Promise<void>
}

/**
 * Starts a server on a free port. `handler` can answer in its own way, by
 * default the server answers 200 with a JSON echo of the request.
 */
export const startServer = async (
  status: number | 'hang' = 200,
): Promise<TestServer> => {
  const requests: Recorded[] = []
  const server: Server = createServer((req, res) => {
    let body = ''
    req.on('data', (chunk: Buffer) => (body += chunk))
    req.on('end', () => {
      const recorded = {
        method: req.method ?? '',
        url: req.url ?? '',
        headers: req.headers,
        body,
      }
      requests.push(recorded)

      if (status === 'hang') {
        return
      }

      res.writeHead(status, { 'content-type': 'application/json' })
      res.end(JSON.stringify(recorded))
    })
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo

  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () =>
      new Promise<void>((resolve) => {
        server.closeAllConnections()
        server.close(() => resolve())
      }),
  }
}

/** A URL where nothing listens: a request to it fails with a network error */
export const closedUrl = async (): Promise<string> => {
  const server = await startServer()
  const { url } = server
  await server.close()

  return url
}
