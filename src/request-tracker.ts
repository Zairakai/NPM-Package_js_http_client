/**
 * Request tracking utility for monitoring ongoing HTTP requests
 */

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
}

/**
 * Creates a request tracker instance
 * @returns Request tracker with counter and methods
 */
export const createRequestTracker = (): RequestTracker => {
  let nbrInternal = 0

  return {
    get count(): number {
      return nbrInternal
    },

    set count(val: number) {
      nbrInternal = Math.max(0, val)
    },

    get isActive(): boolean {
      return 0 < nbrInternal
    },

    increment(): void {
      nbrInternal++
    },

    decrement(): void {
      nbrInternal = Math.max(0, nbrInternal - 1)
    },

    reset(): void {
      nbrInternal = 0
    },
  }
}

// Global shared instance for backward compatibility
export const globalRequestTracker: RequestTracker = createRequestTracker()
