export type EnquiryStatus = 
  | 'new' 
  | 'contacted' 
  | 'survey_pending' 
  | 'qualified' 
  | 'quoted' 
  | 'converted' 
  | 'lost' 
  | 'cancelled';

export type SurveyStatus = 
  | 'DRAFT' 
  | 'SUBMITTED' 
  | 'APPROVED' 
  | 'REJECTED';

export type TicketStatus = 
  | 'OPEN' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'RESOLUTION_PENDING' 
  | 'CUSTOMER_CONFIRMATION' 
  | 'CLOSED';

export type UserRole = 
  | 'system_admin' 
  | 'sales' 
  | 'surveyor' 
  | 'inventory_manager' 
  | 'technician' 
  | 'service_manager' 
  | 'finance' 
  | 'management';
