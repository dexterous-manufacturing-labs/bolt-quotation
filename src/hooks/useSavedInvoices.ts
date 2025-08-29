import { useState, useEffect } from 'react';
import { SavedInvoice, SavedInvoicesData, SavedQuotation, Payment } from '../types';
import { useOrders } from './useOrders';

const SAVED_INVOICES_KEY = 'saved_invoices_data';

interface CreateInvoiceParams {
  quotation: SavedQuotation;
  onQuotationDeleted: (quotationId: string) => void;
}

interface CreateOrderFromInvoiceParams {
  invoice: SavedInvoice;
}

export function useSavedInvoices() {
  const [invoicesData, setInvoicesData] = useState<SavedInvoicesData>(() => {
    return loadSavedInvoices();
  });
  
  const { createOrder } = useOrders();

  // Save to localStorage whenever data changes
  useEffect(() => {
    saveSavedInvoices(invoicesData);
  }, [invoicesData]);

  const generateInvoiceNumber = (): string => {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2); // Last 2 digits of year
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Extract the numeric part from next_invoice_number (e.g., "INV0001" -> "001")
    const numericPart = invoicesData.next_invoice_number.replace('INV', '').padStart(3, '0');
    
    // Format: INV + YYMMDD + 3-digit serial = 12 characters total
    return `INV${year}${month}${day}${numericPart}`;
  };

  const createInvoiceFromQuotation = async (params: CreateInvoiceParams): Promise<string> => {
    const { quotation, onQuotationDeleted } = params;
    const invoiceId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    // Calculate due date based on payment terms
    const dueDate = new Date();
    const paymentTerms = quotation.paymentTerms || 'Net 30';
    
    if (paymentTerms === '100% advance') {
      // For advance payment, due date is today (payment required upfront)
      // No change to dueDate - it's already today
    } else if (paymentTerms === '60% advance and rest upon delivery') {
      // For partial advance, due date is today for the advance portion
      // No change to dueDate - advance is due immediately
    } else if (paymentTerms === 'Payment on delivery') {
      // Due on delivery - set to 7 days (estimated delivery time)
      dueDate.setDate(dueDate.getDate() + 7);
    } else if (paymentTerms.startsWith('Net ')) {
      // Extract number of days from "Net X" format
      const days = parseInt(paymentTerms.replace('Net ', ''));
      if (!isNaN(days)) {
        dueDate.setDate(dueDate.getDate() + days);
      } else {
        // Default to 30 days if parsing fails
        dueDate.setDate(dueDate.getDate() + 30);
      }
    } else {
      // Default case - 30 days
      dueDate.setDate(dueDate.getDate() + 30);
    }

    // Generate invoice number with new format
    const invoiceNumber = generateInvoiceNumber();

    const newInvoice: SavedInvoice = {
      id: invoiceId,
      invoiceNumber,
      quotationId: quotation.id,
      quotationNumber: quotation.quotationNumber,
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      parts: quotation.parts,
      totalBasePrice: quotation.totalBasePrice,
      discount: quotation.discount,
      totalGST: quotation.totalGST,
      finalPrice: quotation.finalPrice,
      status: 'Draft',
      createdAt: now,
      updatedAt: now,
      dueDate: dueDate.toISOString(),
      notes: quotation.notes,
      gstType: quotation.gstType,
      shippingAddressType: quotation.shippingAddressType || 'shipping',
      serviceCharges: quotation.serviceCharges || [], // Copy service charges from quotation
      totalServiceCharges: quotation.totalServiceCharges || 0, // Copy total service charges
      payments: [], // Initialize empty payments array
      totalPaid: 0, // Initialize total paid as 0
      remainingAmount: quotation.finalPrice // Initialize remaining amount as full amount
    };

    // Generate next invoice number (increment the serial part)
    const currentNum = parseInt(invoicesData.next_invoice_number.replace('INV', ''));
    const nextInvoiceNumber = `INV${String(currentNum + 1).padStart(4, '0')}`;

    // Save the invoice
    setInvoicesData(prev => ({
      ...prev,
      invoices: {
        ...prev.invoices,
        [invoiceId]: newInvoice
      },
      last_updated: now,
      next_invoice_number: nextInvoiceNumber
    }));

    // Delete the corresponding quotation
    onQuotationDeleted(quotation.id);

    // Create corresponding order directly
    console.log('Creating order for invoice:', invoiceNumber);
    try {
      const orderId = createOrder(newInvoice);
      console.log('Order created successfully:', orderId);
    } catch (error) {
      console.error('Error creating order:', error);
    }

    console.log(`Invoice ${invoiceNumber} created and quotation ${quotation.quotationNumber} deleted`);

    return invoiceId;
  };

  const updateInvoiceStatus = (invoiceId: string, status: SavedInvoice['status']) => {
    setInvoicesData(prev => ({
      ...prev,
      invoices: {
        ...prev.invoices,
        [invoiceId]: {
          ...prev.invoices[invoiceId],
          status,
          updatedAt: new Date().toISOString()
        }
      },
      last_updated: new Date().toISOString()
    }));
  };

  const addPayment = (invoiceId: string, payment: Omit<Payment, 'id' | 'createdAt'>) => {
    const invoice = invoicesData.invoices[invoiceId];
    if (!invoice) return;

    const newPayment: Payment = {
      ...payment,
      id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date().toISOString()
    };

    const updatedPayments = [...invoice.payments, newPayment];
    const newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const newRemainingAmount = invoice.finalPrice - newTotalPaid;

    // Auto-update status based on payment
    let newStatus = invoice.status;
    if (newRemainingAmount <= 0) {
      newStatus = 'Paid';
    } else if (newStatus === 'Paid') {
      // If was paid but now has remaining amount, set to sent or overdue based on due date
      const isOverdue = new Date(invoice.dueDate) < new Date();
      newStatus = isOverdue ? 'Overdue' : 'Sent';
    }

    setInvoicesData(prev => ({
      ...prev,
      invoices: {
        ...prev.invoices,
        [invoiceId]: {
          ...invoice,
          payments: updatedPayments,
          totalPaid: newTotalPaid,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }
      },
      last_updated: new Date().toISOString()
    }));
  };

  const removePayment = (invoiceId: string, paymentId: string) => {
    const invoice = invoicesData.invoices[invoiceId];
    if (!invoice) return;

    const updatedPayments = invoice.payments.filter(p => p.id !== paymentId);
    const newTotalPaid = updatedPayments.reduce((sum, p) => sum + p.amount, 0);
    const newRemainingAmount = invoice.finalPrice - newTotalPaid;

    // Auto-update status based on remaining payment
    let newStatus = invoice.status;
    if (newRemainingAmount <= 0) {
      newStatus = 'Paid';
    } else if (newStatus === 'Paid') {
      // If was paid but now has remaining amount, set to sent or overdue based on due date
      const isOverdue = new Date(invoice.dueDate) < new Date();
      newStatus = isOverdue ? 'Overdue' : 'Sent';
    }

    setInvoicesData(prev => ({
      ...prev,
      invoices: {
        ...prev.invoices,
        [invoiceId]: {
          ...invoice,
          payments: updatedPayments,
          totalPaid: newTotalPaid,
          remainingAmount: newRemainingAmount,
          status: newStatus,
          updatedAt: new Date().toISOString()
        }
      },
      last_updated: new Date().toISOString()
    }));
  };
  const deleteInvoice = (invoiceId: string) => {
    const invoice = invoicesData.invoices[invoiceId];
    
    // Delete corresponding order if it exists
    if (invoice) {
      try {
        // Find and delete the order that corresponds to this invoice
        const orders = JSON.parse(localStorage.getItem('orders_data') || '{"orders": {}}');
        const orderToDelete = Object.values(orders.orders).find((order: any) => order.invoiceId === invoiceId);
        
        if (orderToDelete) {
          const { deleteOrder } = require('./useOrders');
          // Since we can't use the hook here, we'll directly manipulate localStorage
          delete orders.orders[(orderToDelete as any).id];
          orders.last_updated = new Date().toISOString();
          localStorage.setItem('orders_data', JSON.stringify(orders));
          console.log(`Deleted corresponding order for invoice: ${invoice.invoiceNumber}`);
        }
      } catch (error) {
        console.error('Error deleting corresponding order:', error);
      }
    }
    
    setInvoicesData(prev => {
      const updatedInvoices = { ...prev.invoices };
      delete updatedInvoices[invoiceId];
      
      return {
        ...prev,
        invoices: updatedInvoices,
        last_updated: new Date().toISOString()
      };
    });
  };

  const getInvoice = (invoiceId: string): SavedInvoice | null => {
    return invoicesData.invoices[invoiceId] || null;
  };

  return {
    invoices: invoicesData.invoices,
    createInvoiceFromQuotation,
    updateInvoiceStatus,
    addPayment,
    removePayment,
    deleteInvoice,
    getInvoice
  };
}

function loadSavedInvoices(): SavedInvoicesData {
  try {
    const saved = localStorage.getItem(SAVED_INVOICES_KEY);
    if (!saved) {
      return createEmptyInvoicesData();
    }

    const parsed = migrateInvoicesData(JSON.parse(saved));
    console.log(`Loaded ${Object.keys(parsed.invoices).length} saved invoices`);
    
    return parsed;
  } catch (error) {
    console.error('Error loading saved invoices:', error);
    return createEmptyInvoicesData();
  }
}

function saveSavedInvoices(data: SavedInvoicesData): void {
  try {
    localStorage.setItem(SAVED_INVOICES_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving invoices data:', error);
  }
}

function createEmptyInvoicesData(): SavedInvoicesData {
  return {
    invoices: {},
    last_updated: new Date().toISOString(),
    next_invoice_number: 'INV0001'
  };
}

function migrateInvoicesData(data: any): SavedInvoicesData {
  // Ensure all invoices have payment tracking fields
  const migratedInvoices: { [key: string]: SavedInvoice } = {};
  
  for (const [id, invoice] of Object.entries(data.invoices || {})) {
    const typedInvoice = invoice as SavedInvoice;
    migratedInvoices[id] = {
      ...typedInvoice,
      payments: typedInvoice.payments || [],
      totalPaid: typedInvoice.totalPaid || 0,
      remainingAmount: typedInvoice.remainingAmount ?? typedInvoice.finalPrice,
      serviceCharges: typedInvoice.serviceCharges || [], // Migrate service charges
      totalServiceCharges: typedInvoice.totalServiceCharges || 0 // Migrate total service charges
    };
  }

  return {
    invoices: migratedInvoices,
    last_updated: data.last_updated || new Date().toISOString(),
    next_invoice_number: data.next_invoice_number || 'INV0001'
  };
}