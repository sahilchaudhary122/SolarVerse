import apiClient, { setAccessToken } from '../lib/apiClient'

export const STAFF_ROLES = [
  'system_admin',
  'sales',
  'surveyor',
  'sales_manager',
  'inventory_manager',
  'technician',
  'service_manager',
  'finance',
  'management',
] as const

export type StaffRole = typeof STAFF_ROLES[number]
export type AuthPrincipal =
  | { kind: 'staff'; role: StaffRole }
  | { kind: 'customer'; role: 'customer' }

export interface LoginCredentials {
  email: string
  password: string
}

/** Internal frontend adapter contract. Backend request and response formats are intentionally unspecified. */
export interface AuthAdapter {
  signIn(credentials: LoginCredentials): Promise<AuthPrincipal>
  register?(input: { full_name: string; email: string; mobile: string; password: string }): Promise<AuthPrincipal>
  currentPrincipal?(): Promise<AuthPrincipal>
}

export type AuthErrorCode =
  | 'invalid_credentials'
  | 'inactive_account'
  | 'missing_role'
  | 'unsupported_role'
  | 'network_error'
  | 'api_error'

export class AuthServiceError extends Error {
  readonly code: AuthErrorCode

  constructor(code: AuthErrorCode, message?: string) {
    super(message ?? code)
    this.code = code
    this.name = 'AuthServiceError'
  }
}

/** Maps the canonical role returned by the FastAPI authentication routes. */
export function principalFromRole(role: unknown): AuthPrincipal {
  if (typeof role !== 'string' || role.trim() === '') {
    throw new AuthServiceError('missing_role')
  }
  const value = role.trim().toLowerCase()
  const normalizedRole = value
  if (normalizedRole === 'customer') return { kind: 'customer', role: 'customer' }
  if ((STAFF_ROLES as readonly string[]).includes(normalizedRole)) {
    return { kind: 'staff', role: normalizedRole as StaffRole }
  }
  throw new AuthServiceError('unsupported_role')
}

export const apiAuthAdapter: AuthAdapter = {
  async signIn(credentials) {
    try {
      const response = await apiClient.post<{ access_token: string; role: string }>('/auth/login', credentials)
      setAccessToken(response.data.access_token)
      return principalFromRole(response.data.role)
    } catch (error) {
      setAccessToken(null)
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const status = (error as { response?: { status?: number } }).response?.status
        if (status === 401) throw new AuthServiceError('invalid_credentials')
        if (status === 403) throw new AuthServiceError('inactive_account')
        throw new AuthServiceError('api_error')
      }
      throw new AuthServiceError('network_error')
    }
  },
  async currentPrincipal() {
    const response = await apiClient.get<{ role: string }>('/auth/me')
    return principalFromRole(response.data.role)
  },
  async register(input) {
    return registerCustomer(input)
  },
}

export async function registerCustomer(input: { full_name: string; email: string; mobile: string; password: string }): Promise<AuthPrincipal> {
  const response = await apiClient.post<{ access_token: string; role: string }>('/auth/register', input)
  setAccessToken(response.data.access_token)
  return principalFromRole(response.data.role)
}

export function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof AuthServiceError)) {
    return 'The sign-in request could not be completed. Please try again later.'
  }

  switch (error.code) {
    case 'invalid_credentials':
      return 'The email or password was not accepted. Check your details and try again.'
    case 'inactive_account':
      return 'This account is inactive. Contact SolarVerse support for assistance.'
    case 'missing_role':
      return 'Your account has no recognized role, so SolarVerse cannot choose a portal. Contact support.'
    case 'unsupported_role':
      return 'Your account role is not supported by this frontend. Contact SolarVerse support.'
    case 'network_error':
      return 'SolarVerse could not be reached. Check your connection and try again.'
    case 'api_error':
      return 'SolarVerse could not complete sign-in. Please try again later.'
  }
}

export function dashboardForPrincipal(principal: AuthPrincipal): string {
  if (principal.kind === 'customer') return '/customer/dashboard'
  return principal.role === 'system_admin' ? '/admin/dashboard' : '/staff/dashboard'
}
