import { describe, expect, it, vi } from 'vitest'
import {
  createHttpClient,
  createRequestTracker,
  globalRequestTracker,
  type RequestTrackerState,
} from '../../src/index.js'
import { startServer } from '../helpers/server.js'

describe('request tracker subscription', () => {
  it('tells the listener the state at each change', () => {
    const tracker = createRequestTracker()
    const states: RequestTrackerState[] = []

    tracker.subscribe((state) => states.push(state))
    tracker.increment()
    tracker.increment()
    tracker.decrement()
    tracker.reset()

    expect(states).toEqual([
      { count: 1, isActive: true },
      { count: 2, isActive: true },
      { count: 1, isActive: true },
      { count: 0, isActive: false },
    ])
  })

  it('does not call the listener when it subscribes or when nothing changes', () => {
    const tracker = createRequestTracker()
    const listener = vi.fn()

    tracker.subscribe(listener)
    tracker.reset()
    tracker.decrement()
    tracker.count = 0

    expect(listener).not.toHaveBeenCalled()
  })

  it('tells the listener when the count is set', () => {
    const tracker = createRequestTracker()
    const listener = vi.fn()

    tracker.subscribe(listener)
    tracker.count = 3

    expect(listener).toHaveBeenCalledWith({ count: 3, isActive: true })
  })

  it('stops telling a listener that unsubscribed', () => {
    const tracker = createRequestTracker()
    const listener = vi.fn()
    const unsubscribe = tracker.subscribe(listener)

    unsubscribe()
    tracker.increment()

    expect(listener).not.toHaveBeenCalled()
  })

  it('lets a listener unsubscribe while it is called', () => {
    const tracker = createRequestTracker()
    const other = vi.fn()
    const unsubscribe = tracker.subscribe(() => unsubscribe())

    tracker.subscribe(other)
    tracker.increment()
    tracker.increment()

    expect(other).toHaveBeenCalledTimes(2)
  })

  it('keeps telling the others when a listener throws', () => {
    const tracker = createRequestTracker()
    const other = vi.fn()

    tracker.subscribe(() => {
      throw new Error('broken listener')
    })
    tracker.subscribe(other)

    expect(() => tracker.increment()).not.toThrow()
    expect(other).toHaveBeenCalledOnce()
  })

  it('has a global tracker that can be followed too', () => {
    const listener = vi.fn()
    const unsubscribe = globalRequestTracker.subscribe(listener)

    globalRequestTracker.increment()
    globalRequestTracker.reset()
    unsubscribe()

    expect(listener).toHaveBeenCalledTimes(2)
  })
})

describe('client subscription', () => {
  it('tells when the requests of the client start and end', async () => {
    const server = await startServer()
    const client = createHttpClient({ baseURL: server.url })
    const counts: number[] = []

    client.subscribe((state) => counts.push(state.count))
    await Promise.all([client.get('/a'), client.get('/b')])
    await server.close()

    expect(counts).toEqual([1, 2, 1, 0])
    expect(client.isLoading).toBe(false)
  })

  it('counts the requests of several clients together with a shared tracker', async () => {
    const server = await startServer()
    const tracker = createRequestTracker()
    const first = createHttpClient({ baseURL: server.url, tracker })
    const second = createHttpClient({ baseURL: server.url, tracker })
    const peak = vi.fn()

    tracker.subscribe((state) => peak(state.count))
    await Promise.all([first.get('/a'), second.get('/b')])
    await server.close()

    expect(first.tracker).toBe(tracker)
    expect(peak).toHaveBeenCalledWith(2)
  })

  it('does nothing when tracking is disabled', () => {
    const client = createHttpClient({ trackRequests: false })
    const listener = vi.fn()

    const unsubscribe = client.subscribe(listener)

    expect(unsubscribe).toBeTypeOf('function')
    expect(() => unsubscribe()).not.toThrow()
    expect(client.tracker).toBeNull()
  })
})
