/**
 * HTTP client factory with configurable options
 */

import axios, {
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
  type Method,
} from 'axios'
import {
  type Logger,
  type RetryDelay,
  type ShouldRetryFunction,
  type TokenSource,
  createAuthInterceptor,
  createCSRFInterceptor,
  createErrorLoggerInterceptor,
  createRetryInterceptor,
  createTimeoutInterceptor,
  createTrackingInterceptors,
} from './interceptors.js'
import {
  type RequestTracker,
  type RequestTrackerListener,
  createRequestTracker,
} from './request-tracker.js'

/**
 * HTTP method. `QUERY` (RFC 10008) is a safe and idempotent method that carries
 * its query in the body.
 */
export type HttpMethod = Method | 'QUERY' | 'query'

/**
 * HTTP client configuration options
 */
export interface HttpClientOptions {
  /** Base URL for requests */
  baseURL?: string
  /** Default headers */
  headers?: Record<string, string>
  /** Include credentials */
  withCredentials?: boolean
  /** Request timeout in milliseconds */
  timeout?: number
  /** Enable request tracking */
  trackRequests?: boolean
  /**
   * Tracker that counts the requests of this client. Give the same one to
   * several clients, or `globalRequestTracker`, to count their requests together
   * (for example for an initial loading bar). Default: one tracker for the client.
   */
  tracker?: RequestTracker
  /** CSRF token or getter function */
  csrfToken?: TokenSource
  /** Auth token or getter function */
  authToken?: TokenSource
  /** Auth token type (Bearer, Token, etc.) */
  authType?: string
  /** Enable error logging */
  enableErrorLogging?: boolean
  /** Custom logger function */
  logger?: Logger
  /** Number of retries for failed requests. Default: none (5 when you ask for retries with the interceptor) */
  retries?: number
  /** Delay between retries in milliseconds, or a function of the attempt. Default: 300 */
  retryDelay?: RetryDelay
  /** Retry logic. Default: network failures on the methods that only read, see `createShouldRetry` */
  shouldRetry?: ShouldRetryFunction
  /** Enable Laravel-specific features */
  laravel?: boolean
}

/**
 * HTTP client instance with convenience methods
 */
export interface HttpClient {
  /** Axios instance */
  readonly client: AxiosInstance
  /** Request tracker instance (null if tracking disabled) */
  readonly tracker: RequestTracker | null
  /** Whether there are active requests */
  readonly isLoading: boolean
  /** Current number of active requests */
  readonly requestCount: number
  /**
   * Call a function each time the number of active requests changes.
   * Nothing is called when tracking is disabled.
   * @returns A function that removes the listener
   */
  subscribe(listener: RequestTrackerListener): () => void

  // Convenience HTTP methods: one for each method
  get<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>
  head<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>
  options<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>
  post<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>
  put<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>
  patch<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>
  delete<T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>
  /** QUERY (RFC 10008): like GET, with the query in the body */
  query<T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>>
}

/**
 * Default configuration for HTTP clients
 */
const DEFAULT_CONFIG: Required<
  Pick<HttpClientOptions, 'baseURL' | 'timeout' | 'withCredentials' | 'headers'>
> = {
  baseURL: '',
  timeout: 10000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
}

/**
 * Creates a configured HTTP client with interceptors
 * @param options - Configuration options
 * @returns Configured axios instance with tracker
 */
export const createHttpClient = (
  options: HttpClientOptions = {},
): HttpClient => {
  // Deep-merge headers so DEFAULT_CONFIG.headers are never lost when options.headers is provided.
  const config = {
    ...DEFAULT_CONFIG,
    ...options,
    headers: { ...DEFAULT_CONFIG.headers, ...(options.headers ?? {}) },
  }

  // Create axios instance
  const client = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout,
    withCredentials: config.withCredentials,
    headers: config.headers,
  })

  // Create request tracker if enabled
  const tracker =
    config.trackRequests !== false
      ? (config.tracker ?? createRequestTracker())
      : null

  // Add request tracking interceptors
  if (tracker) {
    const trackingInterceptors = createTrackingInterceptors(tracker)
    client.interceptors.request.use(
      trackingInterceptors.request,
      trackingInterceptors.requestError,
    )
    client.interceptors.response.use(
      trackingInterceptors.response,
      trackingInterceptors.responseError,
    )
  }

  // Add CSRF interceptor
  if (config.csrfToken) {
    client.interceptors.request.use(createCSRFInterceptor(config.csrfToken))
  }

  // Add auth interceptor
  if (config.authToken) {
    client.interceptors.request.use(
      createAuthInterceptor(config.authToken, config.authType),
    )
  }

  // Add timeout interceptor if different from default
  if (config.timeout !== DEFAULT_CONFIG.timeout) {
    client.interceptors.request.use(createTimeoutInterceptor(config.timeout))
  }

  // Add error logging interceptor
  if (config.enableErrorLogging !== false) {
    client.interceptors.response.use(
      (response) => response,
      createErrorLoggerInterceptor(config.logger),
    )
  }

  // Add retry interceptor
  if (config.retries && config.retries > 0) {
    // Add the client instance to configs for retry handling
    client.interceptors.request.use((reqConfig) => {
      return Object.assign(reqConfig, { _axios: client })
    })

    client.interceptors.response.use(
      (response) => response,
      createRetryInterceptor(
        config.retries,
        config.retryDelay,
        config.shouldRetry,
      ),
    )
  }

  // Add Laravel-style headers if not disabled
  if (config.laravel !== false) {
    client.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest'
  }

  return {
    client,
    tracker,

    // Convenience methods
    get: <T = unknown>(
      url: string,
      config?: AxiosRequestConfig,
    ): Promise<AxiosResponse<T>> => client.get<T>(url, config),
    head: <T = unknown>(
      url: string,
      config?: AxiosRequestConfig,
    ): Promise<AxiosResponse<T>> => client.head<T>(url, config),
    options: <T = unknown>(
      url: string,
      config?: AxiosRequestConfig,
    ): Promise<AxiosResponse<T>> => client.options<T>(url, config),
    post: <T = unknown>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig,
    ): Promise<AxiosResponse<T>> => client.post<T>(url, data, config),
    put: <T = unknown>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig,
    ): Promise<AxiosResponse<T>> => client.put<T>(url, data, config),
    patch: <T = unknown>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig,
    ): Promise<AxiosResponse<T>> => client.patch<T>(url, data, config),
    delete: <T = unknown>(
      url: string,
      config?: AxiosRequestConfig,
    ): Promise<AxiosResponse<T>> => client.delete<T>(url, config),
    query: <T = unknown>(
      url: string,
      data?: unknown,
      config?: AxiosRequestConfig,
    ): Promise<AxiosResponse<T>> =>
      client.request<T>({ ...config, url, method: 'QUERY', data }),

    // Request status
    get isLoading(): boolean {
      /* c8 ignore next */
      return tracker ? tracker.isActive : false
    },

    get requestCount(): number {
      /* c8 ignore next */
      return tracker ? tracker.count : 0
    },

    subscribe: (listener: RequestTrackerListener): (() => void) =>
      tracker ? tracker.subscribe(listener) : () => undefined,
  }
}

/**
 * Creates a Laravel-compatible HTTP client
 * @param options - Configuration options
 * @returns Configured HTTP client
 */
export const createLaravelClient = (
  options: HttpClientOptions = {},
): HttpClient => {
  return createHttpClient({
    withCredentials: true,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
    },
    ...options,
  })
}

/**
 * Creates an API client (typically for external APIs)
 * @param options - Configuration options
 * @returns Configured HTTP client
 */
export const createApiClient = (
  options: HttpClientOptions = {},
): HttpClient => {
  return createHttpClient({
    withCredentials: false,
    laravel: false,
    ...options,
  })
}
