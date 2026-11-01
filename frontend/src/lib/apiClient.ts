import axios from 'axios'

const apiClient = axios.create({
  baseURL: (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/+$/, ''),
  timeout: 15000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
})

const TOKEN_KEY = 'solarverse_access_token'

export function getAccessToken(): string | null {
  try { return window.sessionStorage.getItem(TOKEN_KEY) } catch { return null }
}

export function setAccessToken(token: string | null): void {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token)
    else window.sessionStorage.removeItem(TOKEN_KEY)
  } catch { /* Session persistence may be disabled by the browser. */ }
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status
      const detail = error.response?.data?.detail
      const inactiveAccount = status === 403 && detail === 'Inactive user account'
      if (status === 401 || inactiveAccount) {
        setAccessToken(null)
        if (typeof window !== 'undefined') window.dispatchEvent(new Event('solarverse:session-expired'))
      }
    }
    return Promise.reject(error)
  },
)

export function apiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 401) return 'Your session has expired. Please sign in again.'
    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail !== 'Request validation failed') return detail
    const errors = error.response?.data?.errors
    if (Array.isArray(errors)) {
      const messages = errors.map((item: unknown) => {
        if (typeof item !== 'object' || item === null) return ''
        const entry = item as { msg?: unknown; loc?: unknown }
        const message = typeof entry.msg === 'string' ? entry.msg : ''
        const location = Array.isArray(entry.loc) ? entry.loc.filter((part): part is string | number => typeof part === 'string' || typeof part === 'number').slice(1).join('.') : ''
        return location ? `${location}: ${message}` : message
      }).filter(Boolean)
      if (messages.length) return messages.join(' · ')
    }
    if (error.code === 'ECONNABORTED') return 'The request timed out. Please try again.'
    if (!error.response) return 'SolarVerse could not be reached. Check your connection and try again.'
  }
  return 'SolarVerse could not complete the request. Please try again.'
}

export default apiClient
