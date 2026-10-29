import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { http as mswHttp, HttpResponse } from 'msw'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { API, db, server, TOKENS } from '../test/server'
import { tokenStorage } from '../utils/tokenStorage'
import { apiClient, ApiError, cleanParams, http, setUnauthorizedHandler } from './apiClient'
import { photosApi } from './eventsApi'

afterEach(() => setUnauthorizedHandler(null))

describe('central Axios instance', () => {
  it('uses VITE_API_URL as the base URL', () => {
    expect(http.defaults.baseURL).toBe('http://api.test/api')
  })

  it('sends Authorization: Bearer <token> only when a token exists', async () => {
    await apiClient.get('/packages')
    expect(db.requests.at(-1)?.auth).toBeNull()
    tokenStorage.set(TOKENS.client)
    await apiClient.get('/auth/me')
    expect(db.requests.at(-1)?.auth).toBe(`Bearer ${TOKENS.client}`)
  })

  it('turns server errors into ApiError with status, code and details', async () => {
    tokenStorage.set(TOKENS.client)
    const error = await apiClient.get('/events/999').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ status: 404, code: 'NOT_FOUND', message: 'Event not found' })
  })

  it('a network failure becomes NETWORK_ERROR (status 0)', async () => {
    server.use(mswHttp.get(`${API}/packages`, () => HttpResponse.error()))
    await expect(apiClient.get('/packages')).rejects.toMatchObject({ status: 0, code: 'NETWORK_ERROR' })
  })

  it('a request that times out becomes TIMEOUT, not NETWORK_ERROR', async () => {
    const adapter = (config: InternalAxiosRequestConfig) =>
      Promise.reject(new AxiosError('timeout of 20ms exceeded', 'ECONNABORTED', config))
    await expect(http.get('/packages', { adapter })).rejects.toMatchObject({ status: 0, code: 'TIMEOUT' })
  })

  it('uploads get a longer timeout than regular requests (server processing + Cloudinary)', async () => {
    const post = vi.spyOn(http, 'post').mockResolvedValue({ data: {} })
    await apiClient.upload('/gallery', new FormData())
    expect(post.mock.calls[0][2]?.timeout).toBe(5 * 60_000)
    expect(http.defaults.timeout).toBe(60_000)
    post.mockRestore()
  })

  it('401 UNAUTHORIZED clears the token and notifies the app; 401 INVALID_CREDENTIALS does not', async () => {
    const onUnauthorized = vi.fn()
    setUnauthorizedHandler(onUnauthorized)
    tokenStorage.set(TOKENS.expired)
    await expect(apiClient.get('/auth/me')).rejects.toMatchObject({ status: 401 })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    expect(tokenStorage.get()).toBeNull()

    tokenStorage.set(TOKENS.client)
    await expect(apiClient.post('/auth/login', { email: 'noa@test.com', password: 'wrong' })).rejects.toMatchObject({ code: 'INVALID_CREDENTIALS' })
    expect(onUnauthorized).toHaveBeenCalledTimes(1)
    expect(tokenStorage.get()).toBe(TOKENS.client)
  })

  it('drops empty query params (the server rejects ?status=)', () => {
    expect(cleanParams({ a: 1, b: '', c: undefined, d: null, e: false })).toEqual({ a: 1, e: false })
  })

  it('consent request body is exactly { publishConsent } as in the Swagger', async () => {
    tokenStorage.set(TOKENS.client)
    await photosApi.setConsent(10, 101, true)
    expect(db.requests.at(-1)).toMatchObject({ method: 'PUT', path: '/events/10/photos/101/consent', body: { publishConsent: true } })
  })
})
