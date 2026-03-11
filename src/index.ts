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
} from './client.js'

export { createRequestTracker, globalRequestTracker, type RequestTracker } from './request-tracker.js'

export {
  createAuthInterceptor,
  createCSRFInterceptor,
  createErrorLoggerInterceptor,
  createRetryInterceptor,
  createTimeoutInterceptor,
  createTrackingInterceptors,
  type Logger,
  type ShouldRetryFunction,
  type TokenSource,
  type TrackingInterceptors,
} from './interceptors.js'

// Re-export axios for convenience
export { default as axios } from 'axios'
export type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, Method as HttpMethod } from 'axios'
