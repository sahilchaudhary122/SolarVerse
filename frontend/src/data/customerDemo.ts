export const customerProfile = {
  id: 'DEMO-CUS-047',
  name: 'Ananya Rao',
  email: 'ananya.rao@example.test',
  mobile: '+91 90000 00147',
  status: 'Active · illustrative account',
}

export const customerProjectStages = [
  'Enquiry submitted',
  'Site survey',
  'Survey approval',
  'Quotation prepared',
  'Order confirmed',
  'Dispatch',
  'Installation',
  'Handover',
] as const

export type CustomerProject = {
  id: string
  siteId: string
  siteName: string
  address: string
  capacity: string
  systemType: 'On-Grid' | 'Off-Grid'
  status: string
  currentStage: number
  expectedInstallation: string | null
  enquiryId: string
  quotationId: string | null
  orderId: string | null
}

export const customerSites = [
  { id: 'DEMO-SITE-047-A', name: 'Riverside Residence', address: '18 Sample Garden Road, Demo City', roofType: 'Illustrative pitched roof' },
  { id: 'DEMO-SITE-047-B', name: 'Hillview Cottage', address: '42 Example Hill Lane, Demo City', roofType: 'Illustrative flat roof' },
]

export const customerProjects: CustomerProject[] = [
  {
    id: 'DEMO-PROJECT-047-A', siteId: customerSites[0].id, siteName: customerSites[0].name,
    address: customerSites[0].address, capacity: '5.4 kW', systemType: 'On-Grid',
    status: 'Installation in progress · demo', currentStage: 6, expectedInstallation: '12 Nov 2026',
    enquiryId: 'DEMO-ENQ-047-A', quotationId: 'DEMO-QUO-047-A', orderId: 'DEMO-ORD-047-A',
  },
  {
    id: 'DEMO-PROJECT-047-B', siteId: customerSites[1].id, siteName: customerSites[1].name,
    address: customerSites[1].address, capacity: '3.2 kW', systemType: 'Off-Grid',
    status: 'Quotation prepared · demo', currentStage: 3, expectedInstallation: null,
    enquiryId: 'DEMO-ENQ-047-B', quotationId: 'DEMO-QUO-047-B', orderId: null,
  },
]

export const customerEnquiries = [
  { id: 'DEMO-ENQ-047-A', siteId: customerSites[0].id, submitted: '12 Sep 2026', requirement: 'Residential solar consultation', status: 'Survey approved · illustrative' },
  { id: 'DEMO-ENQ-047-B', siteId: customerSites[1].id, submitted: '22 Oct 2026', requirement: 'Off-grid system consultation', status: 'Quotation preparation · illustrative' },
]

export const customerQuotations = [
  { id: 'DEMO-QUO-047-A', enquiryId: 'DEMO-ENQ-047-A', created: '02 Oct 2026', status: 'Accepted · illustrative' },
  { id: 'DEMO-QUO-047-B', enquiryId: 'DEMO-ENQ-047-B', created: '29 Oct 2026', status: 'Ready to review · illustrative' },
]

export const customerOrders = [
  { id: 'DEMO-ORD-047-A', quotationId: 'DEMO-QUO-047-A', siteId: customerSites[0].id, created: '08 Oct 2026', status: 'Installation in progress · illustrative' },
]

export const customerInstallations = [
  { id: 'DEMO-INST-047-A', orderId: 'DEMO-ORD-047-A', siteId: customerSites[0].id, scheduled: '12 Nov 2026', status: 'Work in progress · illustrative' },
]

export const customerWarranties = [
  { id: 'DEMO-WAR-047-A', siteId: customerSites[0].id, equipment: 'Solar equipment set · sample', status: 'Active · illustrative', validThrough: '11 Nov 2031' },
]

export const customerServiceRequests = [
  { id: 'DEMO-SRV-047-A', siteId: customerSites[0].id, created: '30 Oct 2026', topic: 'Monitoring setup question', status: 'Open · illustrative' },
]

export const customerNotifications = [
  { id: 'DEMO-NOT-047-A', date: '01 Nov 2026', message: 'A sample installation schedule is available to review.', read: false },
  { id: 'DEMO-NOT-047-B', date: '29 Oct 2026', message: 'A sample quotation is ready for review.', read: false },
  { id: 'DEMO-NOT-047-C', date: '22 Oct 2026', message: 'A demo enquiry was received for Hillview Cottage.', read: true },
]

export const customerActivity = [
  { id: 'DEMO-ACT-047-A', date: '01 Nov 2026', text: 'Sample installation work scheduled for Riverside Residence.', type: 'Installation' },
  { id: 'DEMO-ACT-047-B', date: '29 Oct 2026', text: 'Illustrative quotation prepared for Hillview Cottage.', type: 'Quotation' },
  { id: 'DEMO-ACT-047-C', date: '08 Oct 2026', text: 'A sample order was confirmed for Riverside Residence.', type: 'Order' },
  { id: 'DEMO-ACT-047-D', date: '02 Oct 2026', text: 'A demo quotation was shared for review.', type: 'Quotation' },
]
