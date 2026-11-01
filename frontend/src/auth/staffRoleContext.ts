import { createContext, useContext } from 'react'
import type { LucideIcon } from 'lucide-react'
import type { StaffRole } from './authService'

export type StaffLink = { to: string; label: string; icon: LucideIcon; group: string }
export type StaffRoleContextValue = { role: StaffRole; roleLabel: string; shortcuts: StaffLink[] }

export const StaffRoleContext = createContext<StaffRoleContextValue | null>(null)

export function useStaffRole() {
  const context = useContext(StaffRoleContext)
  if (!context) throw new Error('useStaffRole must be used within the staff portal')
  return context
}
