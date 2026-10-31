import { RequireSession } from '../auth/RequireSession'

export function ProtectedRoute() {
  return <RequireSession audience="any" />
}

export default ProtectedRoute
