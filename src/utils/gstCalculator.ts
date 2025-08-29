import { Customer, CompanyInfo } from '../types';

export const COMPANY_INFO: CompanyInfo = {
  name: 'Dexterous Manufacturing Labs Pvt Ltd',
  gstn: '29AAGCD4100R2ZC',
  address: {
    city: 'Bangalore',
    state: 'Karnataka'
  }
};

export interface GSTCalculation {
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  type: 'INTRASTATE' | 'INTERSTATE';
}

export function calculateGST(baseAmount: number, customer: Customer): GSTCalculation {
  const GST_RATE = 0.18; // 18%
  
  // Check if delivery is within Karnataka
  const isIntrastate = customer.shipping_address.state.toLowerCase() === 'karnataka';
  
  if (isIntrastate) {
    // Within Karnataka: 9% CGST + 9% SGST
    const cgst = baseAmount * 0.09;
    const sgst = baseAmount * 0.09;
    
    return {
      cgst,
      sgst,
      igst: 0,
      total: cgst + sgst,
      type: 'INTRASTATE'
    };
  } else {
    // Outside Karnataka: 18% IGST
    const igst = baseAmount * GST_RATE;
    
    return {
      cgst: 0,
      sgst: 0,
      igst,
      total: igst,
      type: 'INTERSTATE'
    };
  }
}

export function formatGSTBreakdown(gst: GSTCalculation): string {
  if (gst.type === 'INTRASTATE') {
    return `CGST (9%): ₹${gst.cgst.toFixed(2)}, SGST (9%): ₹${gst.sgst.toFixed(2)}`;
  } else {
    return `IGST (18%): ₹${gst.igst.toFixed(2)}`;
  }
}