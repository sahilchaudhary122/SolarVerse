import { createContext, useContext, useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Menu, Sun, X, LayoutDashboard, Users, ClipboardList, Compass, Package, FileText, ShoppingBag, Boxes, Truck, ScanLine, Wrench, ShieldCheck, LifeBuoy, CreditCard, ChartNoAxesCombined, Settings, UserRound, Bell, type LucideIcon } from 'lucide-react'
import { Avatar, Button, IconButton, ThemeToggle } from '../components/ui'
import { useAuth } from '../auth/AuthProvider'
import type { StaffRole } from '../auth/authService'
import { customerNotifications, customerProfile } from '../data/customerDemo'
export type { StaffRole } from '../auth/authService'

type PortalKind = 'staff' | 'customer'
type StaffLink = { to: string; label: string; icon: LucideIcon; group: string }

const staffLinks: StaffLink[] = [
  { to: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Workspace' },
  { to: '/staff/customers', label: 'Customers', icon: Users, group: 'Customer work' },
  { to: '/staff/enquiries', label: 'Enquiries', icon: ClipboardList, group: 'Customer work' },
  { to: '/staff/surveys', label: 'Site surveys', icon: Compass, group: 'Customer work' },
  { to: '/staff/catalog/products', label: 'Products', icon: Package, group: 'Sales' },
  { to: '/staff/catalog/packages', label: 'Solar packages', icon: Sun, group: 'Sales' },
  { to: '/staff/quotations', label: 'Quotations', icon: FileText, group: 'Sales' },
  { to: '/staff/orders', label: 'Sales orders', icon: ShoppingBag, group: 'Sales' },
  { to: '/staff/inventory', label: 'Inventory', icon: Boxes, group: 'Operations' },
  { to: '/staff/dispatch', label: 'Dispatch', icon: Truck, group: 'Operations' },
  { to: '/staff/equipment', label: 'Equipment', icon: ScanLine, group: 'Operations' },
  { to: '/staff/installations', label: 'Installations', icon: Wrench, group: 'Operations' },
  { to: '/staff/warranties', label: 'Warranties', icon: ShieldCheck, group: 'Operations' },
  { to: '/staff/service/tickets', label: 'Service tickets', icon: LifeBuoy, group: 'Operations' },
  { to: '/staff/finance/payments', label: 'Payments', icon: CreditCard, group: 'Business' },
  { to: '/staff/reports', label: 'Reports', icon: ChartNoAxesCombined, group: 'Business' },
  { to: '/staff/settings', label: 'Settings', icon: Settings, group: 'Business' },
]

const customerLinks = [
  { to: '/customer/dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: '/customer/profile', label: 'My Profile', icon: UserRound },
  { to: '/customer/sites', label: 'My Solar Sites', icon: Sun },
  { to: '/customer/enquiries', label: 'My Enquiries', icon: ClipboardList },
  { to: '/customer/quotations', label: 'My Quotations', icon: FileText },
  { to: '/customer/orders', label: 'My Orders', icon: ShoppingBag },
  { to: '/customer/installations', label: 'Installation Tracking', icon: Wrench },
  { to: '/customer/warranties', label: 'Warranties', icon: ShieldCheck },
  { to: '/customer/service', label: 'Service Requests', icon: LifeBuoy },
  { to: '/customer/notifications', label: 'Notifications', icon: Bell },
]

const roleLabels: Record<StaffRole, string> = {
  system_admin: 'System admin', sales: 'Sales', surveyor: 'Surveyor', sales_manager: 'Sales manager',
  inventory_manager: 'Inventory manager', technician: 'Technician', service_manager: 'Service manager',
  finance: 'Finance', management: 'Management',
}

// These are convenience shortcuts for the demo UI, not access rules or permissions.
const roleShortcutLabels: Record<StaffRole, string[]> = {
  system_admin: ['Customers', 'Enquiries', 'Settings', 'Reports'],
  sales: ['Customers', 'Enquiries', 'Site surveys', 'Quotations', 'Sales orders'],
  surveyor: ['Customers', 'Enquiries', 'Site surveys'],
  sales_manager: ['Customers', 'Enquiries', 'Site surveys', 'Quotations', 'Sales orders', 'Reports'],
  inventory_manager: ['Products', 'Solar packages', 'Inventory', 'Dispatch', 'Equipment'],
  technician: ['Installations', 'Equipment', 'Warranties', 'Service tickets'],
  service_manager: ['Customers', 'Installations', 'Warranties', 'Service tickets'],
  finance: ['Sales orders', 'Payments', 'Reports'],
  management: ['Customers', 'Quotations', 'Sales orders', 'Reports'],
}

const StaffRoleContext = createContext<{ role: StaffRole; roleLabel: string; shortcuts: StaffLink[] } | null>(null)
export function useStaffRole() {
  const context = useContext(StaffRoleContext)
  if (!context) throw new Error('useStaffRole must be used within the staff portal')
  return context
}

function StaffNavigation({ mobileOpen, closeMobile, role, shortcuts }: { mobileOpen: boolean; closeMobile: () => void; role: StaffRole; shortcuts: StaffLink[] }) {
  const groups = [...new Set(staffLinks.map((link) => link.group))]
  const navClass = ({ isActive }: { isActive: boolean }) => `flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-offset-2 ${isActive ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-surface-raised hover:text-app-text'}`
  return <>
    {mobileOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={closeMobile} />}
    <aside id="portal-navigation" className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0 visible' : '-translate-x-full invisible lg:visible'}`}>
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-5"><Link to="/staff/dashboard" onClick={closeMobile} className="flex items-center gap-2 font-bold"><span className="grid size-8 place-items-center rounded-md bg-brand text-white dark:text-gray-950"><Sun aria-hidden="true" className="size-4" /></span>SolarVerse</Link><IconButton label="Close navigation" className="lg:hidden" onClick={closeMobile}><X aria-hidden="true" className="size-5" /></IconButton></div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-5">
        <div className="px-3 pb-2 pt-5 text-xs font-bold uppercase tracking-wider text-muted">Staff workspace</div>
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wide text-accent">Suggested for {roleLabels[role]}</p>
        <nav aria-label="Suggested staff shortcuts" className="space-y-1 border-b border-border pb-4">{shortcuts.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={closeMobile} className={navClass}><Icon aria-hidden="true" className="size-4 shrink-0" />{label}</NavLink>)}</nav>
        <nav aria-label="All staff modules" className="mt-2 space-y-5">{groups.map((group) => <div key={group}><h2 className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{group}</h2><div className="space-y-1">{staffLinks.filter((link) => link.group === group).map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={closeMobile} className={navClass}><Icon aria-hidden="true" className="size-4 shrink-0" />{label}</NavLink>)}</div></div>)}</nav>
      </div>
      <div className="shrink-0 border-t border-border p-4"><Link to="/" className="text-sm text-muted hover:text-brand focus-visible:outline-offset-2">← Public website</Link></div>
    </aside>
  </>
}

export function PortalLayout({ kind }: { kind: PortalKind }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { principal, signOut } = useAuth()
  const navigate = useNavigate()
  const logout = () => {
    signOut()
    setMobileOpen(false)
    navigate('/login', { replace: true })
  }
  const isStaff = kind === 'staff'
  const staffRole: StaffRole = isStaff && principal?.kind === 'staff' ? principal.role : 'management'
  const portalTitle = isStaff ? 'Staff workspace' : 'Customer portal'
  const shortcuts = staffLinks.filter((link) => roleShortcutLabels[staffRole].includes(link.label))
  const links = isStaff ? staffLinks : customerLinks
  const content = <div className="min-h-screen bg-app-bg text-app-text">
    {isStaff
      ? <StaffNavigation mobileOpen={mobileOpen} closeMobile={() => setMobileOpen(false)} role={staffRole} shortcuts={shortcuts} />
      : <>
        {mobileOpen && <button type="button" aria-label="Close navigation" className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />}
        <aside id="portal-navigation" className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-border bg-surface transition-transform lg:translate-x-0 ${mobileOpen ? 'translate-x-0 visible' : '-translate-x-full invisible lg:visible'}`}>
          <div className="flex h-16 items-center justify-between border-b border-border px-5"><Link to="/customer/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 font-bold"><span className="grid size-8 place-items-center rounded-md bg-brand text-white dark:text-gray-950"><Sun aria-hidden="true" className="size-4" /></span>SolarVerse</Link><IconButton label="Close navigation" className="lg:hidden" onClick={() => setMobileOpen(false)}><X aria-hidden="true" className="size-5" /></IconButton></div>
          <div className="border-b border-border px-4 pb-4 pt-5"><p className="px-1 text-xs font-bold uppercase tracking-wider text-muted">Customer portal</p><div className="mt-3 flex items-center gap-3 rounded-md bg-surface-raised p-3"><Avatar name={customerProfile.name} size="sm" /><div className="min-w-0"><p className="truncate text-sm font-semibold text-app-text">{customerProfile.name}</p><p className="truncate text-xs text-muted">{customerProfile.email}</p><p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-accent">Illustrative profile</p></div></div></div>
          <nav aria-label="Customer portal navigation" className="flex-1 space-y-1 overflow-y-auto px-3 pb-5">{links.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} onClick={() => setMobileOpen(false)} className={({ isActive }) => `flex min-h-10 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-offset-2 ${isActive ? 'bg-brand/10 text-brand' : 'text-muted hover:bg-surface-raised hover:text-app-text'}`}><Icon aria-hidden="true" className="size-4 shrink-0" />{label}</NavLink>)}</nav>
          <div className="border-t border-border p-4"><Link to="/" className="text-sm text-muted hover:text-brand">← Public website</Link></div>
        </aside>
      </>}
    <div className="lg:pl-72">
      <header className="sticky top-0 z-30 flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 py-2 backdrop-blur sm:px-6">
        <div className="flex items-center gap-2"><IconButton label="Open navigation" aria-expanded={mobileOpen} aria-controls="portal-navigation" className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu aria-hidden="true" className="size-5" /></IconButton><span className="text-sm font-semibold text-muted">{portalTitle}</span></div>
        <div className="flex items-center gap-2 sm:gap-3">
          {isStaff && <span className="hidden rounded-full bg-brand/10 px-3 py-2 text-xs font-semibold text-brand sm:inline">{roleLabels[staffRole]}</span>}
          {!isStaff && <Link to="/customer/notifications" aria-label={`${customerNotifications.filter((notification) => !notification.read).length} unread demo notifications`} className="relative grid size-10 place-items-center rounded-md text-muted hover:bg-surface-raised hover:text-brand"><Bell aria-hidden="true" className="size-5" />{customerNotifications.some((notification) => !notification.read) && <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-brand text-[10px] font-bold text-white dark:text-gray-950">{customerNotifications.filter((notification) => !notification.read).length}</span>}</Link>}
          <ThemeToggle />
          <div className="flex items-center gap-2 rounded-full p-1" aria-label="Account area"><Avatar name={isStaff ? 'Account' : customerProfile.name} size="sm" /><span className="hidden pr-2 text-sm font-medium sm:inline">{isStaff ? 'Account' : customerProfile.name}</span></div>
          <Button variant="secondary" onClick={logout} className="min-h-9 px-3 py-1 text-xs sm:text-sm">Log out</Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {isStaff && <div className="mb-5 rounded-md border border-info/30 bg-info/5 px-4 py-3 text-sm text-app-text"><span className="font-semibold">Role-aware workspace:</span> suggestions use the authenticated role. Backend permissions and employee-specific work assignment still require the confirmed API contract.</div>}
        {isStaff ? <StaffRoleContext.Provider value={{ role: staffRole, roleLabel: roleLabels[staffRole], shortcuts }}><Outlet /></StaffRoleContext.Provider> : <Outlet />}
      </main>
    </div>
  </div>
  return content
}
