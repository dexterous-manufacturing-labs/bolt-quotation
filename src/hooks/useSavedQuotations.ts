import { useState, useEffect } from 'react';
import { SavedQuotation, SavedQuotationsData, ServiceCharge } from '../types';

const SAVED_QUOTATIONS_KEY = 'saved_quotations_data';
const STATE_EXPIRY_HOURS = 24; // State expires after 24 hours

interface SaveQuotationParams {
  customerId: string;
  customerName: string;
  parts: Omit<SavedQuotation['parts'][0], 'id'>[];
  totalBasePrice: number;
  discount: number;
  totalGST: number;
  finalPrice: number;
  gstType: 'INTRASTATE' | 'INTERSTATE';
  notes: string;
  paymentTerms?: string; // Add payment terms parameter
  leadTime?: string; // Add lead time parameter
  shippingAddressType?: 'billing' | 'shipping'; // Add shipping address type parameter
  serviceCharges: ServiceCharge[]; // Add service charges parameter
  totalServiceCharges: number; // Add total service charges parameter
  existingQuotationId?: string; // For updating existing quotations
}

export function useSavedQuotations() {
  const [quotationsData, setQuotationsData] = useState<SavedQuotationsData>(() => {
    return loadSavedQuotations();
  });

  // Save to localStorage whenever data changes
  useEffect(() => {
    saveSavedQuotations(quotationsData);
  }, [quotationsData]);

  const generateQuotationNumber = (serialNumber: string): string => {
    const now = new Date();
    const year = String(now.getFullYear()).slice(-2); // Last 2 digits of year
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Extract the numeric part from serialNumber (e.g., "QT0001" -> "001")
    const numericPart = serialNumber.replace('QT', '').padStart(3, '0');
    
    // Format: QT + YYMMDD + 3-digit serial = 11 characters total
    return `QT${year}${month}${day}${numericPart}`;
  };

  const saveQuotation = async (params: SaveQuotationParams): Promise<string> => {
    const now = new Date().toISOString();
    
    if (params.existingQuotationId) {
      // Update existing quotation
      const existingQuotation = quotationsData.quotations[params.existingQuotationId];
      if (!existingQuotation) {
        throw new Error('Quotation not found for editing');
      }

      // Calculate valid until date (30 days from now)
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      const updatedQuotation: SavedQuotation = {
        ...existingQuotation,
        customerId: params.customerId,
        customerName: params.customerName,
        parts: params.parts.map((part, index) => ({
          ...part,
          id: `${params.existingQuotationId}_part_${index + 1}`
        })),
        totalBasePrice: params.totalBasePrice,
        discount: params.discount,
        totalGST: params.totalGST,
        finalPrice: params.finalPrice,
        updatedAt: now,
        notes: params.notes,
        paymentTerms: params.paymentTerms, // Save payment terms
        leadTime: params.leadTime, // Save lead time
        shippingAddressType: params.shippingAddressType, // Save shipping address type
        serviceCharges: params.serviceCharges, // Save service charges
        totalServiceCharges: params.totalServiceCharges, // Save total service charges
        validUntil: validUntil.toISOString(),
        gstType: params.gstType,
        status: 'Draft' // Reset status to Draft when edited
      };

      setQuotationsData(prev => ({
        ...prev,
        quotations: {
          ...prev.quotations,
          [params.existingQuotationId]: updatedQuotation
        },
        last_updated: now
      }));

      return params.existingQuotationId;
    } else {
      // Create new quotation
      const quotationId = `quot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate valid until date (30 days from now)
      const validUntil = new Date();
      validUntil.setDate(validUntil.getDate() + 30);

      // Generate quotation number with new format
      const quotationNumber = generateQuotationNumber(quotationsData.next_quotation_number);

      const newQuotation: SavedQuotation = {
        id: quotationId,
        quotationNumber,
        customerId: params.customerId,
        customerName: params.customerName,
        parts: params.parts.map((part, index) => ({
          ...part,
          id: `${quotationId}_part_${index + 1}`
        })),
        totalBasePrice: params.totalBasePrice,
        discount: params.discount,
        totalGST: params.totalGST,
        finalPrice: params.finalPrice,
        status: 'Draft',
        createdAt: now,
        updatedAt: now,
        notes: params.notes,
        paymentTerms: params.paymentTerms, // Save payment terms
        leadTime: params.leadTime, // Save lead time
        shippingAddressType: params.shippingAddressType, // Save shipping address type
        serviceCharges: params.serviceCharges, // Save service charges
        totalServiceCharges: params.totalServiceCharges, // Save total service charges
        validUntil: validUntil.toISOString(),
        gstType: params.gstType
      };

      // Generate next quotation number (increment the serial part)
      const currentNum = parseInt(quotationsData.next_quotation_number.replace('QT', ''));
      const nextQuotationNumber = `QT${String(currentNum + 1).padStart(4, '0')}`;

      setQuotationsData(prev => ({
        quotations: {
          ...prev.quotations,
          [quotationId]: newQuotation
        },
        last_updated: now,
        next_quotation_number: nextQuotationNumber
      }));

      return quotationId;
    }
  };

  const updateQuotationStatus = (quotationId: string, status: SavedQuotation['status']) => {
    setQuotationsData(prev => ({
      ...prev,
      quotations: {
        ...prev.quotations,
        [quotationId]: {
          ...prev.quotations[quotationId],
          status,
          updatedAt: new Date().toISOString()
        }
      },
      last_updated: new Date().toISOString()
    }));
  };

  const deleteQuotation = (quotationId: string) => {
    setQuotationsData(prev => {
      const updatedQuotations = { ...prev.quotations };
      delete updatedQuotations[quotationId];
      
      return {
        ...prev,
        quotations: updatedQuotations,
        last_updated: new Date().toISOString()
      };
    });
  };

  const getQuotation = (quotationId: string): SavedQuotation | null => {
    return quotationsData.quotations[quotationId] || null;
  };

  return {
    quotations: quotationsData.quotations,
    saveQuotation,
    updateQuotationStatus,
    deleteQuotation,
    getQuotation
  };
}

function loadSavedQuotations(): SavedQuotationsData {
  try {
    const saved = localStorage.getItem(SAVED_QUOTATIONS_KEY);
    if (!saved) {
      return createEmptyQuotationsData();
    }

    const parsed = JSON.parse(saved);
    console.log(`Loaded ${Object.keys(parsed.quotations).length} saved quotations`);
    
    return parsed;
  } catch (error) {
    console.error('Error loading saved quotations:', error);
    return createEmptyQuotationsData();
  }
}

function saveSavedQuotations(data: SavedQuotationsData): void {
  try {
    localStorage.setItem(SAVED_QUOTATIONS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving quotations data:', error);
  }
}

function createEmptyQuotationsData(): SavedQuotationsData {
  return {
    quotations: {},
    last_updated: new Date().toISOString(),
    next_quotation_number: 'QT0001'
  };
}