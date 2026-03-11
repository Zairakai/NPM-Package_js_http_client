import { beforeEach, describe, expect, it } from 'vitest'
import { createRequestTracker, globalRequestTracker } from '../src/request-tracker.ts'

describe('createRequestTracker', () => {
  let tracker

  beforeEach(() => {
    tracker = createRequestTracker()
  })

  it('should initialize with zero count', () => {
    expect(tracker.count).toBe(0)
    expect(tracker.isActive).toBe(false)
  })

  it('should increment count correctly', () => {
    tracker.increment()
    expect(tracker.count).toBe(1)
    expect(tracker.isActive).toBe(true)

    tracker.increment()
    expect(tracker.count).toBe(2)
    expect(tracker.isActive).toBe(true)
  })

  it('should decrement count correctly', () => {
    tracker.increment()
    tracker.increment()
    tracker.increment()
    expect(tracker.count).toBe(3)

    tracker.decrement()
    expect(tracker.count).toBe(2)
    expect(tracker.isActive).toBe(true)

    tracker.decrement()
    expect(tracker.count).toBe(1)
    expect(tracker.isActive).toBe(true)

    tracker.decrement()
    expect(tracker.count).toBe(0)
    expect(tracker.isActive).toBe(false)
  })

  it('should not allow count to go below zero when decrementing', () => {
    expect(tracker.count).toBe(0)

    tracker.decrement()
    expect(tracker.count).toBe(0)
    expect(tracker.isActive).toBe(false)

    tracker.decrement()
    tracker.decrement()
    expect(tracker.count).toBe(0)
    expect(tracker.isActive).toBe(false)
  })

  it('should reset count to zero', () => {
    tracker.increment()
    tracker.increment()
    tracker.increment()
    expect(tracker.count).toBe(3)

    tracker.reset()
    expect(tracker.count).toBe(0)
    expect(tracker.isActive).toBe(false)
  })

  it('should allow setting count directly', () => {
    tracker.count = 5
    expect(tracker.count).toBe(5)
    expect(tracker.isActive).toBe(true)

    tracker.count = 0
    expect(tracker.count).toBe(0)
    expect(tracker.isActive).toBe(false)
  })

  it('should not allow setting negative count', () => {
    tracker.count = -5
    expect(tracker.count).toBe(0)
    expect(tracker.isActive).toBe(false)

    tracker.count = 10
    tracker.count = -3
    expect(tracker.count).toBe(0)
    expect(tracker.isActive).toBe(false)
  })

  it('should report isActive correctly based on count', () => {
    expect(tracker.isActive).toBe(false)

    tracker.count = 1
    expect(tracker.isActive).toBe(true)

    tracker.count = 100
    expect(tracker.isActive).toBe(true)

    tracker.count = 0
    expect(tracker.isActive).toBe(false)
  })

  it('should maintain independent state for multiple instances', () => {
    const tracker1 = createRequestTracker()
    const tracker2 = createRequestTracker()

    tracker1.increment()
    tracker1.increment()
    expect(tracker1.count).toBe(2)
    expect(tracker2.count).toBe(0)

    tracker2.increment()
    expect(tracker1.count).toBe(2)
    expect(tracker2.count).toBe(1)

    tracker1.reset()
    expect(tracker1.count).toBe(0)
    expect(tracker2.count).toBe(1)
  })

  it('should handle mixed operations correctly', () => {
    tracker.increment()
    tracker.increment()
    tracker.decrement()
    tracker.increment()
    expect(tracker.count).toBe(2)
    expect(tracker.isActive).toBe(true)

    tracker.count = 5
    tracker.decrement()
    tracker.decrement()
    expect(tracker.count).toBe(3)
    expect(tracker.isActive).toBe(true)

    tracker.reset()
    expect(tracker.count).toBe(0)
    expect(tracker.isActive).toBe(false)
  })
})

describe('globalRequestTracker', () => {
  beforeEach(() => {
    globalRequestTracker.reset()
  })

  it('should be a shared instance', () => {
    expect(globalRequestTracker.count).toBe(0)
    expect(globalRequestTracker.isActive).toBe(false)

    globalRequestTracker.increment()
    expect(globalRequestTracker.count).toBe(1)
    expect(globalRequestTracker.isActive).toBe(true)
  })

  it('should maintain state across multiple accesses', () => {
    globalRequestTracker.increment()
    globalRequestTracker.increment()

    // Access from different points should show same state
    expect(globalRequestTracker.count).toBe(2)
    expect(globalRequestTracker.isActive).toBe(true)

    globalRequestTracker.decrement()
    expect(globalRequestTracker.count).toBe(1)
    expect(globalRequestTracker.isActive).toBe(true)
  })

  it('should be different from created instances', () => {
    const localTracker = createRequestTracker()

    globalRequestTracker.increment()
    expect(globalRequestTracker.count).toBe(1)
    expect(localTracker.count).toBe(0)

    localTracker.increment()
    localTracker.increment()
    expect(globalRequestTracker.count).toBe(1)
    expect(localTracker.count).toBe(2)
  })
})
