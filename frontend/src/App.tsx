import { lazy, Suspense } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sun } from 'lucide-react'
import { ThemeProvider } from './app/providers/ThemeProvider'
import { AuthProvider } from './auth/AuthProvider'
import { RequireSession } from './auth/RequireSession'
import { AuthLayout } from './layouts/AuthLayout'
import { PortalLayout } from './layouts/PortalLayout'
import { AdminLayout } from './layouts/AdminLayout'
import { PublicLayout } from './layouts/PublicLayout'
import { FoundationPage } from './pages/FoundationPages'
import { AboutPage, EnquiryPage, HomePage, PackagesPage, ProjectsPage, ServicesPage } from './pages/PublicPages'
import { StaffDashboard } from './pages/StaffDashboard'

// Legacy demo routes remain available while the new portal foundation is built.
import { Dashboard } from './pages/Dashboard'
import { QuoteBuilder } from './pages/QuoteBuilder'
import { SerialScanner } from './pages/SerialScanner'
import { InstallationForm } from './pages/InstallationForm'
import { WarrantyLookup } from './pages/WarrantyLookup'
import { SupportTickets } from './pages/SupportTickets'
import { EnquiriesList } from './pages/EnquiriesList'
import { SiteSurvey } from './pages/SiteSurvey'
import { OrderConfirm } from './pages/OrderConfirm'
import { Login } from './pages/Login'
import { ProtectedRoute } from './components/ProtectedRoute'
import { RegistrationPage } from './pages/RegistrationPage'
import { AdminCustomersPage, AdminOverviewPage, AdminRolesPage, AdminSettingsPage, AdminStaffPage } from './pages/AdminPages'
import { AdminLogin } from './pages/AdminLogin'
import { TechnicianDashboard } from './pages/TechnicianDashboard'
import { SalesDashboard } from './pages/SalesDashboard'
import { SurveyorDashboard } from './pages/SurveyorDashboard'

const queryClient = new QueryClient()
const InventoryDashboardPreview = import.meta.env.DEV
  ? lazy(() => import('./pages/InventoryDashboard').then((module) => ({ default: module.InventoryDashboard })))
  : null
const SalesManagerDashboardPreview = import.meta.env.DEV
  ? lazy(() => import('./pages/SalesManagerDashboard').then((module) => ({ default: module.SalesManagerDashboard })))
  : null
const ServiceManagerDashboardPreview = import.meta.env.DEV
  ? lazy(() => import('./pages/ServiceManagerDashboard').then((module) => ({ default: module.ServiceManagerDashboard })))
  : null
const FinanceDashboardPreview = import.meta.env.DEV
  ? lazy(() => import('./pages/FinanceDashboard').then((module) => ({ default: module.FinanceDashboard })))
  : null
const ManagementDashboardPreview = import.meta.env.DEV
  ? lazy(() => import('./pages/ManagementDashboard').then((module) => ({ default: module.ManagementDashboard })))
  : null
const CustomerDashboardPage = lazy(() => import('./pages/CustomerDashboard').then((module) => ({ default: module.CustomerDashboard })))
const CustomerDashboardPreviewPage = import.meta.env.DEV
  ? lazy(() => import('./pages/CustomerDashboardPreview').then((module) => ({ default: module.CustomerDashboardPreview })))
  : null

function Foundation({ title, description, legacyPath }: { title: string; description: string; legacyPath?: string }) {
  return <FoundationPage title={title} description={description} legacyPath={legacyPath} />
}

export function App() {
  return <QueryClientProvider client={queryClient}><ThemeProvider><AuthProvider><BrowserRouter>
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="packages" element={<PackagesPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="contact" element={<EnquiryPage />} />
        <Route path="consultation" element={<EnquiryPage />} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<RegistrationPage />} />
        <Route path="admin/login" element={<AdminLogin />} />
        <Route path="staff/login" element={<Navigate to="/login" replace />} />
        <Route path="customer/login" element={<Navigate to="/login" replace />} />
        <Route path="customer/register" element={<Navigate to="/register" replace />} />
      </Route>

      <Route element={<RequireSession audience="admin" loginPath="/admin/login" />}>
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/login" replace />} />
          <Route path="dashboard" element={<AdminOverviewPage />} />
          <Route path="staff" element={<AdminStaffPage />} />
          <Route path="roles" element={<AdminRolesPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
      </Route>

      {import.meta.env.DEV && <Route path="/staff/technician-preview" element={<TechnicianDashboard />} />}
      {import.meta.env.DEV && <Route path="/staff/sales-preview" element={<SalesDashboard />} />}
      {import.meta.env.DEV && <Route path="/staff/surveyor-preview" element={<SurveyorDashboard />} />}
      {import.meta.env.DEV && InventoryDashboardPreview && <Route path="/staff/inventory-preview" element={<Suspense fallback={<div className="grid min-h-48 place-items-center text-sm text-muted">Loading inventory preview…</div>}><InventoryDashboardPreview /></Suspense>} />}
      {import.meta.env.DEV && SalesManagerDashboardPreview && <Route path="/staff/sales-manager-preview" element={<Suspense fallback={<div className="grid min-h-48 place-items-center text-sm text-muted">Loading sales manager preview…</div>}><SalesManagerDashboardPreview /></Suspense>} />}
      {import.meta.env.DEV && ServiceManagerDashboardPreview && <Route path="/staff/service-manager-preview" element={<Suspense fallback={<div className="grid min-h-48 place-items-center text-sm text-muted">Loading service manager preview…</div>}><ServiceManagerDashboardPreview /></Suspense>} />}
      {import.meta.env.DEV && FinanceDashboardPreview && <Route path="/staff/finance-preview" element={<Suspense fallback={<div className="grid min-h-48 place-items-center text-sm text-muted">Loading finance preview…</div>}><FinanceDashboardPreview /></Suspense>} />}
      {import.meta.env.DEV && ManagementDashboardPreview && <Route path="/staff/management-preview" element={<Suspense fallback={<div className="grid min-h-48 place-items-center text-sm text-muted">Loading management preview…</div>}><ManagementDashboardPreview /></Suspense>} />}
      {import.meta.env.DEV && CustomerDashboardPreviewPage && <Route path="customer" element={<PortalLayout kind="customer" />}><Route path="dashboard-preview" element={<Suspense fallback={<div className="grid min-h-48 place-items-center text-sm text-muted">Loading customer preview…</div>}><CustomerDashboardPreviewPage /></Suspense>} /></Route>}

      <Route element={<RequireSession audience="staff" />}>
      <Route path="staff" element={<PortalLayout kind="staff" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="customers" element={<Foundation title="Customers" description="Customer records and sites will appear here when the service contract is ready." />} />
        <Route path="enquiries" element={<Foundation title="Enquiries" description="Review enquiries, interactions, and status history." legacyPath="/dashboard/enquiries" />} />
        <Route path="surveys" element={<Foundation title="Site surveys" description="Schedule surveys, record assessments, and review decisions." legacyPath="/dashboard/survey" />} />
        <Route path="catalog/products" element={<Foundation title="Product catalogue" description="Manage active products and serial tracking configuration." />} />
        <Route path="catalog/packages" element={<Foundation title="Solar packages" description="Manage configurable packages and their product components." />} />
        <Route path="quotations" element={<Foundation title="Quotations" description="Create and review immutable quotation revisions and line snapshots." legacyPath="/quote-builder" />} />
        <Route path="orders" element={<Foundation title="Sales orders" description="Review order snapshots, status, and related payment records." legacyPath="/dashboard/orders" />} />
        <Route path="inventory" element={<Foundation title="Inventory" description="Review locations, product balances, movements, and reservations." />} />
        <Route path="dispatch" element={<Foundation title="Dispatch" description="Manage dispatch records, items, and delivery updates." />} />
        <Route path="equipment" element={<Foundation title="Equipment" description="Trace equipment units, serials, and lifecycle events." legacyPath="/dashboard/scanner" />} />
        <Route path="installations" element={<Foundation title="Installations" description="Schedule work, assign technicians, and record checklist progress." legacyPath="/dashboard/installation" />} />
        <Route path="warranties" element={<Foundation title="Warranties" description="Review coverage linked to equipment and delivery records." legacyPath="/dashboard/warranty" />} />
        <Route path="service/tickets" element={<Foundation title="Service tickets" description="Review customer service requests, assignments, activities, and parts." legacyPath="/dashboard/tickets" />} />
        <Route path="finance/payments" element={<Foundation title="Payments" description="Review payment and refund records associated with orders." />} />
        <Route path="reports" element={<Foundation title="Reports" description="Reporting views depend on backend data and agreed report definitions." />} />
        <Route path="settings" element={<Foundation title="Settings" description="Account and application settings will be connected after identity and permissions are confirmed." />} />
      </Route>
      </Route>

      <Route element={<RequireSession audience="customer" />}>
      <Route path="customer" element={<PortalLayout kind="customer" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Suspense fallback={<div className="grid min-h-48 place-items-center text-sm text-muted">Loading customer dashboard…</div>}><CustomerDashboardPage /></Suspense>} />
        <Route path="profile" element={<Foundation title="Profile" description="View and manage your contact information after customer account ownership is defined." />} />
        <Route path="sites" element={<Foundation title="My solar sites" description="Review your registered sites when customer records are connected to the approved service contract." />} />
        <Route path="enquiries" element={<Foundation title="Your enquiries" description="Review your submitted requests and survey progress." />} />
        <Route path="quotations" element={<Foundation title="Your quotations" description="Review quotation revisions and available decisions." />} />
        <Route path="orders" element={<Foundation title="Your orders" description="Follow order status, payment records, and delivery progress." />} />
        <Route path="installations" element={<Foundation title="Your installations" description="Review installation scheduling, progress, and sign-off details." />} />
        <Route path="equipment" element={<Foundation title="Your equipment" description="View equipment and serial information associated with your installation." />} />
        <Route path="warranties" element={<Foundation title="Your warranties" description="Review coverage details for your equipment." />} />
        <Route path="service" element={<Foundation title="Support" description="Review support history or request service when customer workflows are connected." />} />
        <Route path="documents" element={<Foundation title="Your documents" description="Access files shared with you after secure document access is defined." />} />
        <Route path="notifications" element={<Foundation title="Notifications" description="Notification storage and delivery are not defined in the current database proposal." />} />
      </Route>
      </Route>

      {/* Existing demos remain reachable; Phase 1 does not replace their workflows. */}
      <Route path="/quote-builder" element={<QuoteBuilder />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/enquiries" element={<EnquiriesList />} />
        <Route path="/dashboard/survey" element={<SiteSurvey />} />
        <Route path="/dashboard/orders" element={<OrderConfirm />} />
        <Route path="/dashboard/scanner" element={<SerialScanner />} />
        <Route path="/dashboard/installation" element={<InstallationForm />} />
        <Route path="/dashboard/warranty" element={<WarrantyLookup />} />
        <Route path="/dashboard/tickets" element={<SupportTickets />} />
      </Route>
      <Route path="*" element={<div className="grid min-h-screen place-items-center bg-app-bg p-6 text-center"><div><Sun className="mx-auto size-10 text-brand" /><h1 className="mt-4 text-2xl font-bold">Page not found</h1><p className="mt-2 text-muted">That SolarVerse page isn’t available.</p><Link to="/" className="mt-5 inline-block font-semibold text-brand hover:underline">Return to home</Link></div></div>} />
    </Routes>
  </BrowserRouter></AuthProvider></ThemeProvider></QueryClientProvider>
}

export default App
