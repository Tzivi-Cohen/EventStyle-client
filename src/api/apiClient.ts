import axios, { AxiosError, type AxiosProgressEvent } from 'axios'
import { env } from '../config/env'
import type { ApiErrorBody } from '../types/common'
import { tokenStorage } from '../utils/tokenStorage'
import { ApiError } from './apiError'

export { ApiError, fieldErrors } from './apiError'

export const http = axios.create({
  baseURL: env.apiUrl,
  headers: { Accept: 'application/json' },
  timeout: 60_000,
})

http.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  return config
})

let onUnauthorized: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    const sentToken = Boolean((error as AxiosError).config?.headers?.Authorization)
    if (apiError.status === 401 && apiError.code === 'UNAUTHORIZED' && sentToken) {
      tokenStorage.clear()
      onUnauthorized?.()
    }
    return Promise.reject(apiError)
  },
)

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (axios.isCancel(error)) return new ApiError(0, 'CANCELLED', 'Request was cancelled')
  if (error instanceof AxiosError) {
    if (!error.response) {
      const timedOut = error.code === 'ETIMEDOUT' || (error.code === 'ECONNABORTED' && /timeout/i.test(error.message))
      return timedOut ? new ApiError(0, 'TIMEOUT', 'The server did not respond in time') : new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server')
    }
    const body = error.response.data as Partial<ApiErrorBody> | undefined
    return new ApiError(
      error.response.status,
      body?.error?.code ?? 'INTERNAL_ERROR',
      body?.error?.message ?? `HTTP ${error.response.status}`,
      body?.error?.details,
    )
  }
  return new ApiError(0, 'UNKNOWN_ERROR', 'Unexpected error')
}

export function cleanParams(params: object): Record<string, string | number | boolean> {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''),
  )
}

const UPLOAD_TIMEOUT_MS = 5 * 60_000

export type UploadOptions = {
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

export const apiClient = {
  get: async <T>(path: string, params?: object) =>
    (await http.get<T>(path, { params: params ? cleanParams(params) : undefined })).data,
  post: async <T>(path: string, body?: unknown) => (await http.post<T>(path, body)).data,
  put: async <T>(path: string, body?: unknown) => (await http.put<T>(path, body)).data,
  patch: async <T>(path: string, body?: unknown) => (await http.patch<T>(path, body)).data,
  delete: async (path: string) => {
    await http.delete(path)
  },
  upload: async <T>(path: string, form: FormData, options: UploadOptions = {}) =>
    (
      await http.post<T>(path, form, {
        signal: options.signal,
        timeout: UPLOAD_TIMEOUT_MS,
        onUploadProgress: (event: AxiosProgressEvent) => {
          if (options.onProgress && event.total) options.onProgress(Math.round((event.loaded / event.total) * 100))
        },
      })
    ).data,
}
