/**
 * @zairakai/npm-http-client
 * Configurable HTTP client built on axios with request tracking and Laravel support
 */

export {
  createApiClient,
  createHttpClient,
  createLaravelClient,
  type HttpClient,
  type HttpClientOptions,
  type HttpMethod,
} from './client.js'

export {
  createRequestTracker,
  globalRequestTracker,
  type RequestTracker,
  type RequestTrackerListener,
  type RequestTrackerState,
} from './request-tracker.js'

export {
  createAuthInterceptor,
  createCSRFInterceptor,
  createErrorLoggerInterceptor,
  createRetryInterceptor,
  createShouldRetry,
  createTimeoutInterceptor,
  createTrackingInterceptors,
  defaultShouldRetry,
  exponentialBackoff,
  isNetworkError,
  type ExponentialBackoffOptions,
  type Logger,
  type RetryDelay,
  type ShouldRetryFunction,
  type ShouldRetryOptions,
  type TokenSource,
  type TrackingInterceptors,
} from './interceptors.js'

// Re-export axios for convenience
export { default as axios } from 'axios'
export type {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios'
