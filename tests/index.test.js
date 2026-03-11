import { describe, expect, it } from 'vitest'

describe('main exports', () => {
  it('should export all client functions', async () => {
    const clientExports = await import('../src/client.ts')

    expect(clientExports.createHttpClient).toBeDefined()
    expect(clientExports.createLaravelClient).toBeDefined()
    expect(clientExports.createApiClient).toBeDefined()
  })

  it('should export all interceptor functions', async () => {
    const interceptorExports = await import('../src/interceptors.ts')

    expect(interceptorExports.createTrackingInterceptors).toBeDefined()
    expect(interceptorExports.createCSRFInterceptor).toBeDefined()
    expect(interceptorExports.createAuthInterceptor).toBeDefined()
    expect(interceptorExports.createErrorLoggerInterceptor).toBeDefined()
    expect(interceptorExports.createTimeoutInterceptor).toBeDefined()
    expect(interceptorExports.createRetryInterceptor).toBeDefined()
  })

  it('should export request tracker functions', async () => {
    const trackerExports = await import('../src/request-tracker.ts')

    expect(trackerExports.createRequestTracker).toBeDefined()
    expect(trackerExports.globalRequestTracker).toBeDefined()
  })

  it('should export main index file', async () => {
    const mainExports = await import('../src/index.ts')

    // Should re-export all functions from submodules
    expect(Object.keys(mainExports).length).toBeGreaterThan(0)

    // Test a few key functions are available in main export
    expect(mainExports.createHttpClient).toBeDefined()
    expect(mainExports.createRequestTracker).toBeDefined()
    expect(mainExports.createTrackingInterceptors).toBeDefined()
  })
})
