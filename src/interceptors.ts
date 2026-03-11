/**
 * Common interceptors for HTTP clients
 */

import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { RequestTracker } from './request-tracker.js'

/**
 * Token source type - either a string or a function that returns a string
 */
export type TokenSource = string | (() => string)

/**
 * Logger function type
 */
export type Logger = (message: string, data?: unknown) => void

/**
 * Retry condition function type
 */
export type ShouldRetryFunction = (error: AxiosError) => boolean

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
export const createTrackingInterceptors = (tracker: RequestTracker): TrackingInterceptors => ({
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
    const token = 'function' === typeof tokenSource ? tokenSource() : tokenSource

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
    const token = 'function' === typeof tokenSource ? tokenSource() : tokenSource

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
}

/**
 * Creates retry interceptor
 * @param retries - Number of retries
 * @param delay - Delay between retries in milliseconds
 * @param shouldRetry - Function to determine if request should be retried
 * @returns Response error interceptor
 */
export const createRetryInterceptor = (
  retries: number = 3,
  delay: number = 1000,
  shouldRetry: ShouldRetryFunction = () => true
) => {
  return async (error: AxiosError): Promise<any> => {
    const config = error.config as RetryConfig | undefined

    if (!config || (config.__retryCount ?? 0) >= retries) {
      return Promise.reject(error)
    }

    if (!shouldRetry(error)) {
      return Promise.reject(error)
    }

    config.__retryCount = (config.__retryCount ?? 0) + 1

    await new Promise((resolve) => setTimeout(resolve, delay))

    // Try to use the instance from the error, otherwise fall back to axios
    /* c8 ignore next */
    const axiosInstance = (config as any)._axios ?? axios
    return axiosInstance.request(config)
  }
}
