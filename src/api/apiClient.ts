import type { ApiErrorBody } from '../types/api'
import { tokenStorage } from '../utils/tokenStorage'

const API_URL = import.meta.env.VITE_API_URL

/** שגיאה אחידה לכל הבקשות. status=0 פירושו שאין חיבור לשרת */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details?: unknown

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

let onUnauthorized: (() => void) | null = null

/** פעולה שתרוץ כשה-Token השמור כבר לא תקף (401 UNAUTHORIZED) */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json' }
  const token = tokenStorage.get()
  if (token) headers.Authorization = `Bearer ${token}`

  // ב-FormData הדפדפן מגדיר Content-Type (כולל boundary) בעצמו
  const isFormData = body instanceof FormData
  if (body !== undefined && !isFormData) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', 'Cannot reach the server')
  }

  if (response.status === 204) return undefined as T

  const data: unknown = await response.json().catch(() => null)

  if (!response.ok) {
    const err = (data as ApiErrorBody | null)?.error
    const apiError = new ApiError(
      response.status,
      err?.code ?? 'INTERNAL_ERROR',
      err?.message ?? `HTTP ${response.status}`,
      err?.details,
    )
    // רק UNAUTHORIZED מסמן Token לא תקף. GOOGLE_AUTH_FAILED (גם 401) הוא כישלון התחברות, לא ניתוק
    if (response.status === 401 && apiError.code === 'UNAUTHORIZED' && token) {
      tokenStorage.clear()
      onUnauthorized?.()
    }
    throw apiError
  }

  return data as T
}

export const apiClient = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
}

/** { שם שדה: הודעה } מתוך details של VALIDATION_ERROR */
export function fieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof ApiError) || !Array.isArray(error.details)) return {}
  return Object.fromEntries(
    (error.details as { field: string; message: string }[]).map((d) => [d.field || '_form', d.message]),
  )
}
