/**
 * Common interceptors for HTTP clients
 */

import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from 'axios'
import { type RequestTracker } from './request-tracker.js'

/**
 * Token source type - either a string or a function that returns a string
 */
export type TokenSource = string | (() => string)

/**
 * Logger function type
 */
export type Logger = (message: string, data?: unknown) => void

/**
 * Retry condition function type. It is called before each new attempt, with the
 * number of the attempt (1 for the first retry), and decides if it is made.
 */
export type ShouldRetryFunction = (
  error: AxiosError,
  attempt: number,
) => boolean | Promise<boolean>

/**
 * Delay before a retry: a time in milliseconds, or a function that gives it
 * from the number of the attempt (1 for the first retry) and the error
 */
export type RetryDelay =
  number | ((attempt: number, error: AxiosError) => number)

/**
 * Options of the default retry condition
 */
export interface ShouldRetryOptions {
  /**
   * Methods that can be retried, or 'all'. Default: the methods that only read
   * (get, head, options, query): a method that writes can be repeated by mistake.
   */
  methods?: readonly string[] | 'all'
  /** Retry a request that timed out. Default: true */
  retryTimeouts?: boolean
  /** Status of a server response that is retried. Default: none, a response is an answer */
  statuses?: readonly number[]
}

/**
 * Options of the exponential backoff
 */
export interface ExponentialBackoffOptions {
  /** Delay of the first retry, in milliseconds. Default: 300 */
  base?: number
  /** What the delay is multiplied by at each retry. Default: 2 */
  factor?: number
  /** The longest delay, in milliseconds. Default: 10000 */
  max?: number
  /** Part of the delay that is random, from 0 (none) to 1. Default: 0.5 */
  jitter?: number
}

/**
 * Tracking interceptors interface
 */
export interface TrackingInterceptors {
  request: (config: InternalAxiosRequestConfig) => InternalAxiosRequestConfig
  requestError: (error: Error) => Promise<never>
  response: (response: AxiosResponse) => AxiosResponse
  responseError: (error: Error) => Promise<never>
}

/**
 * Creates request tracking interceptors
 * @param tracker - Request tracker instance
 * @returns Request and response interceptors
 */
export const createTrackingInterceptors = (
  tracker: RequestTracker,
): TrackingInterceptors => ({
  request: (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    tracker.increment()
    return config
  },

  requestError: (error: Error): Promise<never> => {
    return Promise.reject(error)
  },

  response: (response: AxiosResponse): AxiosResponse => {
    tracker.decrement()
    return response
  },

  responseError: (error: Error): Promise<never> => {
    tracker.decrement()
    return Promise.reject(error)
  },
})

/**
 * Creates Laravel CSRF token interceptor
 * @param tokenSource - CSRF token or function that returns token
 * @returns Request interceptor
 */
export const createCSRFInterceptor =
  (tokenSource: TokenSource) =>
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token =
      typeof tokenSource === 'function' ? tokenSource() : tokenSource

    if (token) {
      config.headers = config.headers ?? {}
      config.headers['X-CSRF-TOKEN'] = token
    }

    return config
  }

/**
 * Creates authentication interceptor
 * @param tokenSource - Auth token or function that returns token
 * @param type - Token type ('Bearer', 'Token', etc.)
 * @returns Request interceptor
 */
export const createAuthInterceptor =
  (tokenSource: TokenSource, type: string = 'Bearer') =>
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token =
      typeof tokenSource === 'function' ? tokenSource() : tokenSource

    if (token) {
      config.headers = config.headers ?? {}
      config.headers['Authorization'] = `${type} ${token}`
    }

    return config
  }

/**
 * Creates error logging interceptor
 * @param logger - Logging function
 * @returns Response error interceptor
 */
export const createErrorLoggerInterceptor =
  (logger: Logger = console.error) =>
  (error: AxiosError): Promise<never> => {
    const logData = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
    }

    logger('HTTP Error:', logData)
    return Promise.reject(error)
  }

/**
 * Creates timeout interceptor
 * @param timeout - Default timeout in milliseconds
 * @returns Request interceptor
 */
export const createTimeoutInterceptor =
  (timeout: number) =>
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    config.timeout = timeout
    return config
  }

/**
 * Interface for retry configuration in request config
 */
interface RetryConfig extends InternalAxiosRequestConfig {
  __retryCount?: number
  _axios?: AxiosInstance
}

// A request that fails with one of these codes has no answer to wait for, but
// retrying it would not change anything: the request itself is wrong.
const NOT_RETRYABLE_CODES = new Set([
  'ERR_CANCELED',
  'ERR_BAD_OPTION_VALUE',
  'ERR_BAD_OPTION',
  'ERR_BAD_REQUEST',
  'ERR_BAD_RESPONSE',
  'ERR_DEPRECATED',
  'ERR_FR_TOO_MANY_REDIRECTS',
  'ERR_INVALID_URL',
  'ERR_NOT_SUPPORT',
])

const TIMEOUT_CODES = new Set(['ECONNABORTED', 'ETIMEDOUT'])

/**
 * Tells if an error is a failure of the network: the request was sent (or could
 * not be) and no response came back. A cancelled request is not one.
 * @param error - The error of the request
 * @returns true if there is no response and the request was not cancelled
 */
export const isNetworkError = (error: unknown): boolean =>
  axios.isAxiosError(error) &&
  !axios.isCancel(error) &&
  !error.response &&
  !NOT_RETRYABLE_CODES.has(error.code ?? '')

/**
 * Creates the retry condition. By default: a failure of the network on a method
 * that only reads, a server response is never retried.
 * @param options - What to open up, for example `{ methods: ['get', 'post'] }`
 * @returns A retry condition for `createRetryInterceptor`
 */
export const createShouldRetry = (
  options: ShouldRetryOptions = {},
): ShouldRetryFunction => {
  const allowed = options.methods ?? ['get', 'head', 'options', 'query']
  const methods =
    allowed === 'all' ? null : allowed.map((method) => method.toLowerCase())
  const retryTimeouts = options.retryTimeouts ?? true
  const statuses = options.statuses ?? []

  return (error) => {
    if (axios.isCancel(error)) {
      return false
    }

    const method = (error.config?.method ?? 'get').toLowerCase()

    if (methods && !methods.includes(method)) {
      return false
    }

    if (error.response) {
      return statuses.includes(error.response.status)
    }

    if (TIMEOUT_CODES.has(error.code ?? '')) {
      return retryTimeouts
    }

    return isNetworkError(error)
  }
}

/**
 * The default retry condition
 */
export const defaultShouldRetry: ShouldRetryFunction = createShouldRetry()

/**
 * Creates a delay function that grows with each attempt
 * @param options - base, factor, max and jitter
 * @returns A function for the `delay` of `createRetryInterceptor`
 */
export const exponentialBackoff = (
  options: ExponentialBackoffOptions = {},
): ((attempt: number) => number) => {
  const base = options.base ?? 300
  const factor = options.factor ?? 2
  const max = options.max ?? 10000
  const jitter = Math.min(1, Math.max(0, options.jitter ?? 0.5))

  return (attempt) => {
    const delay = Math.min(max, base * factor ** (attempt - 1))

    return Math.round(delay * (1 - jitter * Math.random()))
  }
}

/**
 * Creates retry interceptor
 * @param retries - Number of retries
 * @param delay - Delay between retries in milliseconds, or a function of the attempt
 * @param shouldRetry - Function to determine if request should be retried
 * @returns Response error interceptor
 */
export const createRetryInterceptor = (
  retries: number = 5,
  delay: RetryDelay = 300,
  shouldRetry: ShouldRetryFunction = defaultShouldRetry,
) => {
  return async (error: AxiosError): Promise<AxiosResponse> => {
    const config = error.config as RetryConfig | undefined
    const attempt = (config?.__retryCount ?? 0) + 1

    // A cancelled request is never retried, whatever the condition says
    if (!config || attempt > retries || axios.isCancel(error)) {
      return Promise.reject(error)
    }

    if (!(await shouldRetry(error, attempt))) {
      return Promise.reject(error)
    }

    config.__retryCount = attempt

    const wait = typeof delay === 'function' ? delay(attempt, error) : delay

    await new Promise((resolve) => setTimeout(resolve, wait))

    // Try to use the instance from the error, otherwise fall back to axios
    /* c8 ignore next */
    const axiosInstance: AxiosInstance = config._axios ?? axios
    return axiosInstance.request(config)
  }
}
