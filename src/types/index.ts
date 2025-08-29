export interface Material {
  name: string;
  cost_per_cc: number;
  properties: string[];
  colors: string[];
}

export interface Technology {
  name: string;
  description: string;
  materials: Record<string, Material>;
}

export interface TechnologiesData {
  technologies: Record<string, Technology>;
  last_updated: string;
  currency: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pin: string;
  country: string;
}

export interface Customer {
  company_name: string;
  gstn: string | null;
  contact_person: string;
  email: string;
  phone: string;
  billing_address: Address;
  shipping_address: Address;
  customer_type: 'Business' | 'Individual';
  discount_rate: number;
  payment_terms: string;
  preferred_technologies: string[];
  total_orders: number;
  total_spent: number;
  status: 'Active' | 'Inactive';
  notes: string;
}

export interface CustomersData {
  customers: Record<string, Customer>;
  last_updated: string;
  next_customer_id: string;
}

export interface QuotationPart {
  id: string;
  serialNumber: number;
  fileName: string;
  fileType: string;
  volume: number; // in cubic centimeters
  boundingBox: {
    x: number;
    y: number;
    z: number;
  } | null; // Make boundingBox optional for manual entries
  technology?: string;
  material?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  gstAmount: number;
  finalPrice: number;
  file?: File; // Make file optional for manual entries
  selected?: boolean;
  comments?: string; // Part-specific comments
}

export interface ServiceCharge {
  id: string;
  description: string;
  amount: number;
}

export interface SavedQuotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  parts: Omit<QuotationPart, 'file' | 'selected'>[];
  totalBasePrice: number;
  discount: number;
  totalGST: number;
  finalPrice: number;
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected' | 'Expired';
  createdAt: string;
  updatedAt: string;
  notes: string;
  validUntil: string;
  gstType: 'INTRASTATE' | 'INTERSTATE';
  paymentTerms?: string; // Add payment terms to saved quotation
  leadTime?: string; // Add lead time to saved quotation
  shippingAddressType?: 'billing' | 'shipping'; // Add shipping address type to saved quotation
  serviceCharges: ServiceCharge[]; // Additional service charges
  totalServiceCharges: number; // Total amount of service charges
}

export interface SavedQuotationsData {
  quotations: Record<string, SavedQuotation>;
  last_updated: string;
  next_quotation_number: string;
}

export interface SavedInvoice {
  id: string;
  invoiceNumber: string;
  quotationId: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  parts: Omit<QuotationPart, 'file' | 'selected'>[];
  totalBasePrice: number;
  discount: number;
  totalGST: number;
  finalPrice: number;
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Cancelled';
  createdAt: string;
  updatedAt: string;
  dueDate: string;
  notes: string;
  gstType: 'INTRASTATE' | 'INTERSTATE';
  shippingAddressType?: 'billing' | 'shipping'; // Add shipping address type to saved invoice
  payments: Payment[]; // Add payments array
  totalPaid: number; // Add total paid amount
  remainingAmount: number; // Add remaining amount
  serviceCharges: ServiceCharge[]; // Additional service charges
  totalServiceCharges: number; // Total amount of service charges
}

export interface Payment {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'Card' | 'Other';
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface SavedInvoicesData {
  invoices: Record<string, SavedInvoice>;
  last_updated: string;
  next_invoice_number: string;
}

export type OrderStatus = 'New' | 'Produced' | 'Dispatched' | 'Cancelled';

export interface OrderPart {
  id: string;
  serialNumber: number;
  fileName: string;
  fileType: string;
  volume: number;
  boundingBox: {
    x: number;
    y: number;
    z: number;
  } | null;
  technology?: string;
  material?: string;
  quantity: number;
  comments?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  invoiceId: string;
  invoiceNumber: string;
  customerId: string;
  parts: OrderPart[];
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  serviceCharges: ServiceCharge[];
  totalServiceCharges: number;
}

export interface OrdersData {
  orders: Record<string, Order>;
  last_updated: string;
  next_order_number: string;
}

export interface Quotation {
  id: string;
  customerId: string;
  customerName: string;
  parts: QuotationPart[];
  totalBasePrice: number;
  discount: number;
  totalGST: number;
  finalPrice: number;
  status: 'Draft' | 'Sent' | 'Approved' | 'Rejected';
  createdAt: string;
  updatedAt: string;
  notes: string;
}

export interface QuotationsData {
  quotations: Record<string, Quotation>;
  last_updated: string;
  next_quotation_id: string;
}

export interface CompanyInfo {
  name: string;
  gstn: string;
  address: {
    city: string;
    state: string;
  };
}