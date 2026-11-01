import type { EnquiryStatus } from '../types'
import apiClient from './apiClient'

export interface TokenResponse { access_token: string; token_type: 'bearer'; role: string; email: string }
export interface UserResponse { id: string; email: string; role: string; is_active: boolean }
export interface AdminUser { id: string; display_name: string; email: string; role: string; is_active: boolean; created_at: string }
export interface CustomerPortalMetrics { enquiries: number; active_enquiries: number; quotations: number; orders: number; installations: number; equipment: number; warranties: number; service_tickets: number }
export interface PortalQuotation extends Quotation { lines?: QuoteLine[] }
export interface PortalOrder extends SalesOrder { confirmed_at: string | null; site: Pick<Site, 'id' | 'label' | 'address_line' | 'city' | 'state' | 'postal_code'> | null }
export interface PortalInstallation extends Installation { checklist_summary: { total: number; completed: number } }
export interface PortalEquipment { id: string; serial_number: string | null; product_id: string; product_name: string | null; dispatch_status: string }
export interface PortalWarranty { id: string; equipment_unit_id: string; serial_number: string | null; starts_on: string; ends_on: string; valid_now: boolean; terms: string | null; equipment_status: string }
export interface ReportSummary { period: { date_from: string | null; date_to: string | null }; reports: Record<string, unknown> }
export interface Customer { id: string; name: string; phone_e164: string; email: string | null; created_at: string | null }
export interface Site { id: string; customer_id: string; label: string | null; address_line: string; city: string | null; state: string | null; postal_code: string | null; country_code: string; created_at: string | null }
export interface Enquiry {
  id: string; customer_id: string; customer_name: string; phone: string; email: string | null; site_id: string
  address: string; city: string | null; state: string | null; postal_code: string | null; capacity_kw: string | null
  system_type: 'on-grid' | 'off-grid' | null; monthly_bill: string | null; monthly_bill_currency_code: string | null
  requirements: string | null; status: EnquiryStatus; created_at: string | null
}
export interface EnquiryCreate {
  customer_name: string; phone: string; email?: string; address: string; city?: string | null; state?: string | null
  postal_code?: string | null; capacity_kw?: number | null; system_type?: 'on-grid' | 'off-grid' | null
  monthly_bill?: number | null; monthly_bill_currency_code?: string | null; requirements?: string | null
}
export interface EnquirySubmission { success: boolean; message: string; data: Enquiry }
export interface EnquiryHistory { id: string; from_status: string | null; to_status: string; changed_at: string; reason: string | null }
export interface Survey {
  id: string; enquiry_id: string; site_id: string; scheduled_at: string | null; roof_area_sqm: string | null
  roof_direction: string | null; roof_tilt_degrees: string | null; shadow_free_area_sqm: string | null
  monthly_bill: string | null; monthly_bill_currency_code: string | null; cable_distance_m: string | null
  grid_suitability: boolean | null; status: 'draft' | 'submitted' | 'approved' | 'rejected'; is_current: boolean
  submitted_at: string | null; approved_at: string | null; created_at: string | null
}
export interface Product { id: string; name: string; category: string; tracks_serial_number: boolean; active: boolean; created_at: string | null }
export interface PackageComponent { product: Product; quantity: string }
export interface SolarPackage { id: string; name: string; capacity_kw: string; system_type: 'on-grid' | 'off-grid'; active: boolean; created_at: string | null; components?: PackageComponent[] }
export interface QuoteLine { id: string; product_id: string | null; description_snapshot: string; quantity: string; unit_price: string; discount_amount: string; tax_amount: string; line_total: string }
export interface Quotation {
  id: string; enquiry_id: string; survey_id: string; package_id: string | null; version: number; status: string
  created_at: string | null; valid_until: string | null; currency_code: string; subtotal_amount: string
  discount_amount: string; tax_amount: string; total_amount: string; lines?: QuoteLine[]
}
export interface QuotationCreate {
  enquiry_id: string; survey_id: string; package_id: string | null; valid_until: string | null; currency_code: string
  subtotal_amount: string; discount_amount: string; tax_amount: string; total_amount: string
  lines: Array<{ product_id: string | null; description_snapshot: string; quantity: string; unit_price: string; discount_amount: string; tax_amount: string; line_total: string }>
}
export interface SalesOrder {
  id: string; quotation_id: string; status: string; currency_code: string; subtotal_amount: string
  discount_amount: string; tax_amount: string; total_amount: string; created_at: string | null; lines?: Array<QuoteLine & { source_quotation_line_id: string | null }>
}
export interface InventoryLocation { id: string; name: string; active: boolean }
export interface InventoryBalance { location_id: string; product_id: string; quantity_on_hand: string; updated_at: string | null }
export interface StockMovement { id: string; location_id: string; product_id: string; order_id: string | null; movement_type: string; quantity_delta: string; occurred_at: string; notes: string | null }
export interface DispatchItem { id: string; order_line_id: string | null; product_id: string; quantity: string }
export interface Dispatch { id: string; order_id: string; status: string; dispatched_at: string | null; delivered_at: string | null; recipient_name: string | null; notes: string | null; items: DispatchItem[] }
export interface Technician { id: string; name: string; phone_e164: string | null; active: boolean }
export interface Installation {
  id: string; order_id: string | null; site_id: string; status: string; scheduled_at: string | null; started_at: string | null
  completed_at: string | null; customer_signed_off_at: string | null; technicians: Array<{ id: string; name: string }>
}
export interface Warranty { id: string; equipment_unit_id: string; serial_number: string; starts_on: string; ends_on: string; valid_now: boolean; terms: string | null }
export interface EquipmentUnit { id: string; serial_number: string | null; product_id: string; dispatch_item_id: string | null }
export interface ServiceTicket {
  id: string; customer_id: string; site_id: string | null; equipment_unit_id: string | null; status: string
  opened_at: string; closed_at: string | null; technician_ids: string[]
  activities?: Array<{ id: string; activity_type: string; from_status: string | null; to_status: string | null; notes: string | null; occurred_at: string }>
}
export interface Payment { id: string; order_id: string; amount: string; currency_code: string; status: string; external_reference: string | null; paid_at: string | null }
export interface DashboardMetrics {
  customers: number; sites: number; enquiries: number; surveys: number; quotations: number; orders: number
  inventory_locations: number; stock_movements: number; dispatches: number; equipment_units: number
  installations: number; warranties: number; service_tickets: number; payments: number; payment_amount_recorded: string
}

export async function submitEnquiry(data: EnquiryCreate): Promise<EnquirySubmission> {
  return (await apiClient.post<EnquirySubmission>('/enquiries', data)).data
}
export const getCustomers = async (search?: string) => (await apiClient.get<Customer[]>('/customers', { params: { search, limit: 100 } })).data
export const createCustomer = async (data: Pick<Customer, 'name' | 'phone_e164' | 'email'>) => (await apiClient.post<Customer>('/customers', data)).data
export const updateCustomer = async (id: string, data: Partial<Pick<Customer, 'name' | 'phone_e164' | 'email'>>) => (await apiClient.patch<Customer>(`/customers/${id}`, data)).data
export const getMyCustomer = async () => (await apiClient.get<Customer>('/customers/me')).data
export const getAdminUsers = async (params: { search?: string; role?: string; is_active?: boolean } = {}) => (await apiClient.get<AdminUser[]>('/auth/users', { params: { ...params, limit: 100 } })).data
export const getAdminUser = async (id: string) => (await apiClient.get<AdminUser>(`/auth/users/${id}`)).data
export const provisionUser = async (data: { display_name: string; email: string; password: string; role: string }) => (await apiClient.post<UserResponse>('/auth/users', data)).data
export const setUserActive = async (id: string, isActive: boolean) => (await apiClient.patch<UserResponse>(`/auth/users/${id}/active`, undefined, { params: { is_active: isActive } })).data
export const setUserRole = async (id: string, role: string) => (await apiClient.patch<UserResponse>(`/auth/users/${id}/role`, { role })).data
export const getCustomerPortalMetrics = async () => (await apiClient.get<CustomerPortalMetrics>('/customer-portal/dashboard')).data
export const getMyQuotations = async () => (await apiClient.get<Quotation[]>('/customer-portal/quotations', { params: { limit: 100 } })).data
export const getMyQuotation = async (id: string) => (await apiClient.get<PortalQuotation>(`/customer-portal/quotations/${id}`)).data
export const getMyOrders = async () => (await apiClient.get<PortalOrder[]>('/customer-portal/orders', { params: { limit: 100 } })).data
export const getMyOrder = async (id: string) => (await apiClient.get<PortalOrder>(`/customer-portal/orders/${id}`)).data
export const getMyInstallations = async () => (await apiClient.get<PortalInstallation[]>('/customer-portal/installations', { params: { limit: 100 } })).data
export const getMyInstallation = async (id: string) => (await apiClient.get<PortalInstallation>(`/customer-portal/installations/${id}`)).data
export const getMyEquipment = async () => (await apiClient.get<PortalEquipment[]>('/customer-portal/equipment', { params: { limit: 100 } })).data
export const getMyEquipmentItem = async (id: string) => (await apiClient.get<PortalEquipment>(`/customer-portal/equipment/${id}`)).data
export const getMyWarranties = async () => (await apiClient.get<PortalWarranty[]>('/customer-portal/warranties', { params: { limit: 100 } })).data
export const getMyWarranty = async (id: string) => (await apiClient.get<PortalWarranty>(`/customer-portal/warranties/${id}`)).data
export const getCustomerDocuments = async () => (await apiClient.get<never[]>('/customer-portal/documents')).data
export const getReportsSummary = async (params: { date_from?: string; date_to?: string } = {}) => (await apiClient.get<ReportSummary>('/reports/summary', { params })).data
export const getSites = async (customerId?: string) => (await apiClient.get<Site[]>('/sites', { params: { customer_id: customerId, limit: 100 } })).data
export const createSite = async (data: { customer_id?: string; label?: string | null; address_line: string; city?: string | null; state?: string | null; postal_code?: string | null; country_code?: string }) => (await apiClient.post<Site>('/sites', data)).data
export const getEnquiries = async (params: { status_filter?: string; search?: string } = {}) => (await apiClient.get<Enquiry[]>('/enquiries', { params: { ...params, limit: 100 } })).data
export const createEnquiry = submitEnquiry
export const updateEnquiryStatus = async (id: string, status: EnquiryStatus, reason?: string) => (await apiClient.patch(`/enquiries/${id}/status`, { status, reason })).data
export const getEnquiryHistory = async (id: string) => (await apiClient.get<EnquiryHistory[]>(`/enquiries/${id}/history`)).data
export const getSurveys = async (enquiryId?: string) => (await apiClient.get<Survey[]>('/surveys', { params: { enquiry_id: enquiryId, limit: 100 } })).data
export const createSurvey = async (data: { site_id: string; enquiry_id: string; scheduled_at?: string; roof_area_sqm?: number; roof_direction?: string; roof_tilt_degrees?: number; shadow_free_area_sqm?: number; monthly_bill?: number; monthly_bill_currency_code?: string; cable_distance_m?: number; grid_suitability?: boolean }) => (await apiClient.post<Survey>('/surveys', data)).data
export const reviewSurvey = async (id: string, data: { status: 'approved' | 'rejected'; reviewer_notes?: string; rejection_reason?: string }) => (await apiClient.post(`/surveys/${id}/review`, data)).data
export const getProducts = async () => (await apiClient.get<Product[]>('/products', { params: { limit: 100 } })).data
export const createProduct = async (data: Pick<Product, 'name' | 'category' | 'tracks_serial_number' | 'active'>) => (await apiClient.post<Product>('/products', data)).data
export const updateProduct = async (id: string, data: Partial<Pick<Product, 'name' | 'category' | 'tracks_serial_number' | 'active'>>) => (await apiClient.patch<Product>(`/products/${id}`, data)).data
export const getPackages = async () => (await apiClient.get<SolarPackage[]>('/products/packages', { params: { limit: 100 } })).data
export const createPackage = async (data: { name: string; capacity_kw: string; system_type: 'on-grid' | 'off-grid' }) => (await apiClient.post<SolarPackage>('/products/packages', data)).data
export const getPackage = async (id: string) => (await apiClient.get<SolarPackage>(`/products/packages/${id}`)).data
export const addPackageComponent = async (id: string, data: { product_id: string; quantity: number }) => (await apiClient.post(`/products/packages/${id}/components`, data)).data
export const getQuotations = async () => (await apiClient.get<Quotation[]>('/quotations', { params: { limit: 100 } })).data
export const createQuotation = async (data: QuotationCreate) => (await apiClient.post<Quotation>('/quotations', data)).data
export const approveQuotation = async (id: string) => (await apiClient.post(`/quotations/${id}/approve`)).data
export const getOrders = async () => (await apiClient.get<SalesOrder[]>('/orders', { params: { limit: 100 } })).data
export const getOrder = async (id: string) => (await apiClient.get<SalesOrder>(`/orders/${id}`)).data
export const createOrder = async (quotationId: string) => (await apiClient.post<{ success: boolean; data: SalesOrder }>('/orders', { quotation_id: quotationId })).data
export const getInventoryLocations = async () => (await apiClient.get<InventoryLocation[]>('/inventory/locations')).data
export const createInventoryLocation = async (name: string) => (await apiClient.post<InventoryLocation>('/inventory/locations', { name })).data
export const getInventoryBalances = async () => (await apiClient.get<InventoryBalance[]>('/inventory/balances', { params: { limit: 500 } })).data
export const getStockMovements = async () => (await apiClient.get<StockMovement[]>('/inventory/movements', { params: { limit: 100 } })).data
export const createStockMovement = async (data: { location_id: string; product_id: string; order_id?: string; movement_type: string; quantity_delta: string; notes?: string }) => (await apiClient.post('/inventory/movements', data)).data
export const getDispatches = async () => (await apiClient.get<Dispatch[]>('/dispatches', { params: { limit: 100 } })).data
export const createDispatch = async (data: { order_id: string; status: string; dispatched_at?: string; recipient_name?: string; notes?: string; items: Array<{ order_line_id: string; quantity: string }> }) => (await apiClient.post<Dispatch>('/dispatches', data)).data
export const getInstallations = async () => (await apiClient.get<Installation[]>('/installations', { params: { limit: 100 } })).data
export const getTechnicians = async () => (await apiClient.get<Technician[]>('/installations/technicians', { params: { limit: 100 } })).data
export const createInstallation = async (data: { site_id?: string; order_id?: string; scheduled_at?: string; technician_ids?: string[]; status?: string }) => (await apiClient.post<Installation>('/installations', data)).data
export const updateInstallationStatus = async (id: string, data: { status: string; started_at?: string | null; completed_at?: string | null; customer_signed_off_at?: string | null }) => (await apiClient.patch<Installation>(`/installations/${id}/status`, data)).data
export const createChecklistItem = async (id: string, data: { item_key: string; description_snapshot: string; notes?: string }) => (await apiClient.post(`/installations/${id}/checklist`, data)).data
export const updateChecklistItem = async (installationId: string, itemId: string, data: { is_completed: boolean; notes?: string }) => (await apiClient.patch(`/installations/${installationId}/checklist/${itemId}`, data)).data
export const getWarranties = async () => (await apiClient.get<Warranty[]>('/warranties', { params: { limit: 100 } })).data
export const lookupWarranty = async (serial: string) => (await apiClient.get<Warranty>(`/warranties/lookup/${encodeURIComponent(serial)}`)).data
export const createWarranty = async (data: { equipment_unit_id: string; starts_on: string; ends_on: string; terms?: string }) => (await apiClient.post<Warranty>('/warranties', data)).data
export const registerSerial = async (data: { serial_number: string; product_id: string; dispatch_item_id?: string }) => (await apiClient.post<EquipmentUnit>('/orders/serials', data)).data
export const lookupSerial = async (serial: string) => (await apiClient.get<EquipmentUnit>(`/orders/serials/${encodeURIComponent(serial)}`)).data
export const getTickets = async () => (await apiClient.get<ServiceTicket[]>('/support/tickets', { params: { limit: 100 } })).data
export const getTicket = async (id: string) => (await apiClient.get<ServiceTicket>(`/support/tickets/${id}`)).data
export const createTicket = async (data: { customer_id?: string; site_id?: string; equipment_unit_id?: string; status?: string; notes?: string }) => (await apiClient.post<ServiceTicket>('/support/tickets', data)).data
export const addTicketActivity = async (id: string, data: { activity_type: string; notes?: string }) => (await apiClient.post(`/support/tickets/${id}/activities`, data)).data
export const updateTicketStatus = async (id: string, status: string, notes?: string) => (await apiClient.patch<ServiceTicket>(`/support/tickets/${id}/status`, { status, notes })).data
export const assignTicketTechnician = async (id: string, technician_id: string) => (await apiClient.post(`/support/tickets/${id}/technicians`, { technician_id })).data
export const getPayments = async () => (await apiClient.get<Payment[]>('/payments', { params: { limit: 100 } })).data
export const getDashboardMetrics = async () => (await apiClient.get<DashboardMetrics>('/dashboard')).data
