import { useState, useEffect } from 'react';
import { QuotationPart, SavedQuotation, ServiceCharge } from '../types';

export interface QuotationState {
  selectedCustomerId: string | null;
  parts: QuotationPart[];
  discount: number;
  lastUpdated: string;
  editingQuotationId?: string; // Track if we're editing an existing quotation
  notes?: string;
  paymentTerms?: string; // Add payment terms to quotation state
  leadTime?: string; // Add lead time to quotation state
  shippingAddressType?: 'billing' | 'shipping'; // Add shipping address type
  serviceCharges: ServiceCharge[]; // Additional service charges
}

const QUOTATION_STATE_KEY = 'current_quotation_state';
const STATE_EXPIRY_HOURS = 24; // State expires after 24 hours

export function useQuotationState() {
  const [quotationState, setQuotationState] = useState<QuotationState>(() => {
    return loadQuotationState();
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveQuotationState(quotationState);
  }, [quotationState]);

  const updateSelectedCustomer = (customerId: string | null) => {
    setQuotationState(prev => ({
      ...prev,
      selectedCustomerId: customerId,
      lastUpdated: new Date().toISOString()
    }));
  };

  const updateParts = (parts: QuotationPart[]) => {
    setQuotationState(prev => ({
      ...prev,
      parts,
      lastUpdated: new Date().toISOString()
    }));
  };

  const updateDiscount = (discount: number) => {
    setQuotationState(prev => ({
      ...prev,
      discount,
      lastUpdated: new Date().toISOString()
    }));
  };

  const updateNotes = (notes: string) => {
    setQuotationState(prev => ({
      ...prev,
      notes,
      lastUpdated: new Date().toISOString()
    }));
  };

  const updatePaymentTerms = (paymentTerms: string) => {
    setQuotationState(prev => ({
      ...prev,
      paymentTerms,
      lastUpdated: new Date().toISOString()
    }));
  };

  const updateLeadTime = (leadTime: string) => {
    setQuotationState(prev => ({
      ...prev,
      leadTime,
      lastUpdated: new Date().toISOString()
    }));
  };

  const updateShippingAddressType = (shippingAddressType: 'billing' | 'shipping') => {
    setQuotationState(prev => ({
      ...prev,
      shippingAddressType,
      lastUpdated: new Date().toISOString()
    }));
  };

  const updateServiceCharges = (serviceCharges: ServiceCharge[]) => {
    setQuotationState(prev => ({
      ...prev,
      serviceCharges,
      lastUpdated: new Date().toISOString()
    }));
  };
  const loadQuotationForEditing = (quotation: SavedQuotation) => {
    // Convert saved quotation parts to QuotationPart format with mock File objects
    const quotationParts: QuotationPart[] = quotation.parts.map(part => ({
      ...part,
      file: createMockFile(part.fileName, part.fileType),
      selected: false
    }));

    setQuotationState({
      selectedCustomerId: quotation.customerId,
      parts: quotationParts,
      discount: quotation.discount,
      notes: quotation.notes,
      paymentTerms: quotation.paymentTerms, // Load payment terms from saved quotation
      leadTime: quotation.leadTime, // Load lead time from saved quotation
      shippingAddressType: quotation.shippingAddressType || 'shipping', // Load shipping address type
      serviceCharges: quotation.serviceCharges || [], // Load service charges
      editingQuotationId: quotation.id,
      lastUpdated: new Date().toISOString()
    });
  };

  const clearQuotationState = () => {
    const emptyState: QuotationState = {
      selectedCustomerId: null,
      parts: [],
      discount: 0,
      notes: '',
      paymentTerms: undefined, // Reset payment terms
      leadTime: undefined,
      shippingAddressType: 'shipping', // Default to separate shipping address
      serviceCharges: [], // Reset service charges
      lastUpdated: new Date().toISOString()
    };
    
    setQuotationState(emptyState);
    localStorage.removeItem(QUOTATION_STATE_KEY);
  };

  const hasUnsavedChanges = () => {
    return quotationState.selectedCustomerId !== null || quotationState.parts.length > 0;
  };

  const isEditingMode = () => {
    return !!quotationState.editingQuotationId;
  };

  return {
    quotationState,
    updateSelectedCustomer,
    updateParts,
    updateDiscount,
    updateNotes,
    updatePaymentTerms,
    updateLeadTime,
    updateShippingAddressType,
    updateServiceCharges,
    loadQuotationForEditing,
    clearQuotationState,
    hasUnsavedChanges,
    isEditingMode
  };
}

function loadQuotationState(): QuotationState {
  try {
    const saved = localStorage.getItem(QUOTATION_STATE_KEY);
    if (!saved) {
      return createEmptyState();
    }

    const parsed = JSON.parse(saved);
    
    // Check if state has expired
    const lastUpdated = new Date(parsed.lastUpdated);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > STATE_EXPIRY_HOURS) {
      console.log('Quotation state expired, starting fresh');
      localStorage.removeItem(QUOTATION_STATE_KEY);
      return createEmptyState();
    }

    // Restore File objects for parts (they can't be serialized)
    const restoredParts = parsed.parts.map((part: any) => ({
      ...part,
      file: part.file ? createMockFile(part.fileName, part.fileType) : undefined // Create a mock file object only if file data exists
    }));

    console.log(`Restored quotation state with ${restoredParts.length} parts`);
    
    return {
      ...parsed,
      parts: restoredParts || [],
      serviceCharges: parsed.serviceCharges || []
    };
  } catch (error) {
    console.error('Error loading quotation state:', error);
    return createEmptyState();
  }
}

function saveQuotationState(state: QuotationState): void {
  try {
    // Create a serializable version of the state
    const serializableState = {
      ...state,
      parts: state.parts.map(part => ({
        ...part,
        // Don't serialize the File object, just store metadata
        file: part.file ? {
          name: part.file.name,
          size: part.file.size,
          type: part.file.type,
          lastModified: part.file.lastModified
        } : undefined
      }))
    };

    localStorage.setItem(QUOTATION_STATE_KEY, JSON.stringify(serializableState));
  } catch (error) {
    console.error('Error saving quotation state:', error);
  }
}

function createEmptyState(): QuotationState {
  return {
    selectedCustomerId: null,
    parts: [],
    discount: 0,
    notes: '',
    paymentTerms: undefined,
    shippingAddressType: 'shipping', // Default to separate shipping address
    serviceCharges: [], // Initialize empty service charges
    lastUpdated: new Date().toISOString()
  };
}

function createMockFile(name: string, type: string): File {
  // Create a minimal File object for restored parts
  // This won't have the actual file content, but maintains the interface
  return new File([''], name, { type: `application/${type}` });
}

// Utility function to check if there's saved state
export function hasSavedQuotationState(): boolean {
  try {
    const saved = localStorage.getItem(QUOTATION_STATE_KEY);
    if (!saved) return false;

    const parsed = JSON.parse(saved);
    const lastUpdated = new Date(parsed.lastUpdated);
    const now = new Date();
    const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
    
    return hoursDiff <= STATE_EXPIRY_HOURS && (parsed.selectedCustomerId || parsed.parts.length > 0);
  } catch {
    return false;
  }
}