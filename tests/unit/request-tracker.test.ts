import { describe, expect, it } from 'vitest'
import { createTrackingInterceptors } from '../../src/interceptors'
import { createRequestTracker } from '../../src/request-tracker'

describe('request tracker', () => {
  it('increments and decrements safely', () => {
    const tracker = createRequestTracker()

    expect(tracker.count).toBe(0)
    expect(tracker.isActive).toBe(false)

    tracker.increment()
    tracker.increment()
    expect(tracker.count).toBe(2)
    expect(tracker.isActive).toBe(true)

    tracker.decrement()
    tracker.decrement()
    tracker.decrement()
    expect(tracker.count).toBe(0)
    expect(tracker.isActive).toBe(false)
  })

  it('integrates with tracking interceptors', async () => {
    const tracker = createRequestTracker()
    const interceptors = createTrackingInterceptors(tracker)

    interceptors.request({} as any)
    expect(tracker.count).toBe(1)

    interceptors.response({} as any)
    expect(tracker.count).toBe(0)

    await interceptors.responseError(new Error('fail')).catch(() => undefined)
    expect(tracker.count).toBe(0)
  })
})
