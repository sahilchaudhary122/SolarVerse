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
const Foundation = lazy(() => import('./pages/FoundationPages').then((m) => ({ default: m.FoundationPage })))
const HomePage = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.HomePage })))
const AboutPage = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.AboutPage })))
const EnquiryPage = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.EnquiryPage })))
const PackagesPage = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.PackagesPage })))
const ProjectsPage = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.ProjectsPage })))
const ServicesPage = lazy(() => import('./pages/PublicPages').then((m) => ({ default: m.ServicesPage })))
const StaffDashboard = lazy(() => import('./pages/StaffDashboard').then((m) => ({ default: m.StaffDashboard })))
const ApiDashboardPage = lazy(() => import('./pages/StaffCorePages').then((m) => ({ default: m.ApiDashboardPage })))
const CustomerManagementPage = lazy(() => import('./pages/StaffCorePages').then((m) => ({ default: m.CustomerManagementPage })))
const EnquiryManagementPage = lazy(() => import('./pages/StaffCorePages').then((m) => ({ default: m.EnquiryManagementPage })))
const SiteManagementPage = lazy(() => import('./pages/StaffCorePages').then((m) => ({ default: m.SiteManagementPage })))
const SurveyManagementPage = lazy(() => import('./pages/StaffCorePages').then((m) => ({ default: m.SurveyManagementPage })))
const CatalogManagementPage = lazy(() => import('./pages/SalesWorkflowPages').then((m) => ({ default: m.CatalogManagementPage })))
const OrderManagementPage = lazy(() => import('./pages/SalesWorkflowPages').then((m) => ({ default: m.OrderManagementPage })))
const QuotationManagementPage = lazy(() => import('./pages/SalesWorkflowPages').then((m) => ({ default: m.QuotationManagementPage })))
const DispatchManagementPage = lazy(() => import('./pages/OperationsWorkflowPages').then((m) => ({ default: m.DispatchManagementPage })))
const EquipmentManagementPage = lazy(() => import('./pages/OperationsWorkflowPages').then((m) => ({ default: m.EquipmentManagementPage })))
const InstallationManagementPage = lazy(() => import('./pages/OperationsWorkflowPages').then((m) => ({ default: m.InstallationManagementPage })))
const InventoryManagementPage = lazy(() => import('./pages/OperationsWorkflowPages').then((m) => ({ default: m.InventoryManagementPage })))
const PaymentLedgerPage = lazy(() => import('./pages/OperationsWorkflowPages').then((m) => ({ default: m.PaymentLedgerPage })))
const ServiceTicketManagementPage = lazy(() => import('./pages/OperationsWorkflowPages').then((m) => ({ default: m.ServiceTicketManagementPage })))
const WarrantyManagementPage = lazy(() => import('./pages/OperationsWorkflowPages').then((m) => ({ default: m.WarrantyManagementPage })))
const CustomerEnquiriesPage = lazy(() => import('./pages/CustomerWorkflowPages').then((m) => ({ default: m.CustomerEnquiriesPage })))
const CustomerOverviewPage = lazy(() => import('./pages/CustomerWorkflowPages').then((m) => ({ default: m.CustomerOverviewPage })))
const CustomerProfilePage = lazy(() => import('./pages/CustomerWorkflowPages').then((m) => ({ default: m.CustomerProfilePage })))
const CustomerServicePage = lazy(() => import('./pages/CustomerWorkflowPages').then((m) => ({ default: m.CustomerServicePage })))
const CustomerSitesPage = lazy(() => import('./pages/CustomerWorkflowPages').then((m) => ({ default: m.CustomerSitesPage })))
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })))
const RegistrationPage = lazy(() => import('./pages/RegistrationPage').then((m) => ({ default: m.RegistrationPage })))
const AdminRolesPage = lazy(() => import('./pages/AdminPages').then((m) => ({ default: m.AdminRolesPage })))
const AdminSettingsPage = lazy(() => import('./pages/AdminPages').then((m) => ({ default: m.AdminSettingsPage })))
const AdminStaffPage = lazy(() => import('./pages/AdminPages').then((m) => ({ default: m.AdminStaffPage })))
const AdminLogin = lazy(() => import('./pages/AdminLogin').then((m) => ({ default: m.AdminLogin })))
const CustomerQuotationsPage = lazy(() => import('./pages/CustomerPortalPages').then((m) => ({ default: m.CustomerQuotationsPage })))
const CustomerOrdersPage = lazy(() => import('./pages/CustomerPortalPages').then((m) => ({ default: m.CustomerOrdersPage })))
const CustomerInstallationsPage = lazy(() => import('./pages/CustomerPortalPages').then((m) => ({ default: m.CustomerInstallationsPage })))
const CustomerEquipmentPage = lazy(() => import('./pages/CustomerPortalPages').then((m) => ({ default: m.CustomerEquipmentPage })))
const CustomerWarrantiesPage = lazy(() => import('./pages/CustomerPortalPages').then((m) => ({ default: m.CustomerWarrantiesPage })))
const CustomerDocumentsPage = lazy(() => import('./pages/CustomerPortalPages').then((m) => ({ default: m.CustomerDocumentsPage })))
const ReportingPage = lazy(() => import('./pages/ReportingPages').then((m) => ({ default: m.ReportingPage })))
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
const CustomerDashboardPreviewPage = import.meta.env.DEV
  ? lazy(() => import('./pages/CustomerDashboardPreview').then((module) => ({ default: module.CustomerDashboardPreview })))
  : null

export function App() {
  return <QueryClientProvider client={queryClient}><ThemeProvider><AuthProvider><BrowserRouter>
    <Suspense fallback={<div className="grid min-h-48 place-items-center text-sm text-muted">Loading SolarVerse…</div>}><Routes>
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
          <Route path="dashboard" element={<ApiDashboardPage />} />
          <Route path="staff" element={<AdminStaffPage />} />
          <Route path="roles" element={<AdminRolesPage />} />
          <Route path="customers" element={<CustomerManagementPage />} />
          <Route path="reports" element={<ReportingPage />} />
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
        <Route path="customers" element={<CustomerManagementPage />} />
        <Route path="enquiries" element={<EnquiryManagementPage />} />
        <Route path="sites" element={<SiteManagementPage />} />
        <Route path="surveys" element={<SurveyManagementPage />} />
        <Route path="catalog/products" element={<CatalogManagementPage />} />
        <Route path="catalog/packages" element={<CatalogManagementPage />} />
        <Route path="quotations" element={<QuotationManagementPage />} />
        <Route path="orders" element={<OrderManagementPage />} />
        <Route path="inventory" element={<InventoryManagementPage />} />
        <Route path="dispatch" element={<DispatchManagementPage />} />
        <Route path="equipment" element={<EquipmentManagementPage />} />
        <Route path="installations" element={<InstallationManagementPage />} />
        <Route path="warranties" element={<WarrantyManagementPage />} />
        <Route path="service/tickets" element={<ServiceTicketManagementPage />} />
        <Route path="finance/payments" element={<PaymentLedgerPage />} />
        <Route path="reports" element={<ReportingPage />} />
        <Route path="settings" element={<Foundation title="Settings" description="Account and application settings will be connected after identity and permissions are confirmed." />} />
      </Route>
      </Route>

      <Route element={<RequireSession audience="customer" />}>
      <Route path="customer" element={<PortalLayout kind="customer" />}>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<CustomerOverviewPage />} />
        <Route path="profile" element={<CustomerProfilePage />} />
        <Route path="sites" element={<CustomerSitesPage />} />
        <Route path="enquiries" element={<CustomerEnquiriesPage />} />
        <Route path="quotations" element={<CustomerQuotationsPage />} />
        <Route path="orders" element={<CustomerOrdersPage />} />
        <Route path="installations" element={<CustomerInstallationsPage />} />
        <Route path="equipment" element={<CustomerEquipmentPage />} />
        <Route path="warranties" element={<CustomerWarrantiesPage />} />
        <Route path="service" element={<CustomerServicePage />} />
        <Route path="documents" element={<CustomerDocumentsPage />} />
        <Route path="notifications" element={<Foundation title="Notifications" description="Notification storage and delivery are not defined in the current database proposal." />} />
      </Route>
      </Route>

      <Route element={<RequireSession audience="staff" />}>
        <Route path="/quote-builder" element={<QuotationManagementPage />} />
        <Route path="/dashboard" element={<Navigate to="/staff/dashboard" replace />} />
        <Route path="/dashboard/enquiries" element={<EnquiryManagementPage />} />
        <Route path="/dashboard/survey" element={<SurveyManagementPage />} />
        <Route path="/dashboard/orders" element={<OrderManagementPage />} />
        <Route path="/dashboard/scanner" element={<EquipmentManagementPage />} />
        <Route path="/dashboard/installation" element={<InstallationManagementPage />} />
        <Route path="/dashboard/warranty" element={<WarrantyManagementPage />} />
        <Route path="/dashboard/tickets" element={<ServiceTicketManagementPage />} />
      </Route>
      <Route path="*" element={<div className="grid min-h-screen place-items-center bg-app-bg p-6 text-center"><div><Sun className="mx-auto size-10 text-brand" /><h1 className="mt-4 text-2xl font-bold">Page not found</h1><p className="mt-2 text-muted">That SolarVerse page isn’t available.</p><Link to="/" className="mt-5 inline-block font-semibold text-brand hover:underline">Return to home</Link></div></div>} />
    </Routes></Suspense>
  </BrowserRouter></AuthProvider></ThemeProvider></QueryClientProvider>
}

export default App
