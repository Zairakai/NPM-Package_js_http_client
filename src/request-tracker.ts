/**
 * Request tracking utility for monitoring ongoing HTTP requests
 */

/**
 * State that a listener receives when the counter changes
 */
export interface RequestTrackerState {
  /** Current number of active requests */
  readonly count: number
  /** Whether there are any active requests */
  readonly isActive: boolean
}

/**
 * Function called when the counter changes
 */
export type RequestTrackerListener = (state: RequestTrackerState) => void

/**
 * Interface for request tracker instance
 */
export interface RequestTracker {
  /** Current number of active requests */
  readonly count: number
  /** Whether there are any active requests */
  readonly isActive: boolean
  /** Increment the request counter */
  increment(): void
  /** Decrement the request counter */
  decrement(): void
  /** Reset the counter to zero */
  reset(): void
  /**
   * Call a function each time the counter changes (not when it is set to the
   * value it already has). It is not called when subscribing: read `count`
   * for the initial value.
   * @returns A function that removes the listener
   */
  subscribe(listener: RequestTrackerListener): () => void
}

/**
 * Creates a request tracker instance
 * @returns Request tracker with counter and methods
 */
export const createRequestTracker = (): RequestTracker => {
  let nbrInternal = 0
  const listeners = new Set<RequestTrackerListener>()

  // Set the counter and tell the listeners when it changed
  const update = (value: number): void => {
    const next = Math.max(0, value)

    if (next === nbrInternal) {
      return
    }

    nbrInternal = next

    const state: RequestTrackerState = { count: next, isActive: next > 0 }

    // A copy, so that a listener can unsubscribe while it is called. A listener
    // that throws does not stop the others.
    for (const listener of [...listeners]) {
      try {
        listener(state)
      } catch {
        // The error of a listener is not the business of the tracker
      }
    }
  }

  return {
    get count(): number {
      return nbrInternal
    },

    set count(val: number) {
      update(val)
    },

    get isActive(): boolean {
      return nbrInternal > 0
    },

    increment(): void {
      update(nbrInternal + 1)
    },

    decrement(): void {
      update(nbrInternal - 1)
    },

    reset(): void {
      update(0)
    },

    subscribe(listener: RequestTrackerListener): () => void {
      listeners.add(listener)

      return () => {
        listeners.delete(listener)
      }
    },
  }
}

// Global shared instance for backward compatibility
export const globalRequestTracker: RequestTracker = createRequestTracker()
