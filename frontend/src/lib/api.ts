import type { EnquiryStatus } from '../types';

export interface Enquiry {
  id?: string;
  customer_name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  capacity_kw: number;
  system_type: 'on-grid' | 'off-grid';
  status?: EnquiryStatus;
  created_at?: string;
}

export interface EnquiryResponse {
  success: boolean;
  message: string;
  data: Enquiry;
}

export async function submitEnquiry(data: Enquiry): Promise<EnquiryResponse> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (Math.random() < 0.03) {
        reject(new Error('Failed to submit enquiry. Please try again.'));
      } else {
        resolve({
          success: true,
          message: 'Demo enquiry recorded for preview. No request was sent to a server.',
          data,
        });
      }
    }, 1200);
  });
}
