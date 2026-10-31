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
}

export type AuthErrorCode =
  | 'integration_pending'
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

/** Maps a canonical role supplied by a future API adapter to the frontend's internal identity. */
export function principalFromRole(role: unknown): AuthPrincipal {
  if (typeof role !== 'string' || role.trim() === '') {
    throw new AuthServiceError('missing_role')
  }
  const normalizedRole = role.trim().toLowerCase()
  if (normalizedRole === 'customer') return { kind: 'customer', role: 'customer' }
  if ((STAFF_ROLES as readonly string[]).includes(normalizedRole)) {
    return { kind: 'staff', role: normalizedRole as StaffRole }
  }
  throw new AuthServiceError('unsupported_role')
}

/** No API endpoint or server response contract has been supplied, so sign-in stays unavailable. */
export const pendingAuthAdapter: AuthAdapter = {
  async signIn() {
    throw new AuthServiceError('integration_pending')
  },
}

export function getAuthErrorMessage(error: unknown): string {
  if (!(error instanceof AuthServiceError)) {
    return 'The sign-in request could not be completed. Please try again later.'
  }

  switch (error.code) {
    case 'integration_pending':
      return 'Sign-in is not connected yet. No credentials were sent; the FastAPI authentication contract is still pending.'
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
