import React, { useState, useEffect } from 'react';
import { Plus, Save, Trash2, AlertCircle, CheckCircle, Edit } from 'lucide-react';
import CustomerSelector from './CustomerSelector';
import CustomerForm from '../customers/CustomerForm';
import FileUpload from './FileUpload';
import ManualPartForm from './ManualPartForm';
import PartCard from './PartCard';
import QuotationSummary from './QuotationSummary';
import BulkActions from './BulkActions';
import { CustomersData, TechnologiesData, QuotationPart, Customer } from '../../types';
import { FileParser } from '../../utils/stlParser';
import { calculateGST } from '../../utils/gstCalculator';
import { useQuotationState, hasSavedQuotationState } from '../../hooks/useQuotationState';
import { useSavedQuotations } from '../../hooks/useSavedQuotations';

interface QuotationPageProps {
  customersData: CustomersData;
  technologiesData: TechnologiesData;
  onCustomerAdded?: (customer: Customer, customerId: string) => void;
}

const QuotationPage: React.FC<QuotationPageProps> = ({
  customersData,
  technologiesData,
  onCustomerAdded
}) => {
  const {
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
  } = useQuotationState();

  const { saveQuotation } = useSavedQuotations();

  const [isProcessing, setIsProcessing] = useState(false);
  const [showRestoreNotification, setShowRestoreNotification] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null);
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showManualPartForm, setShowManualPartForm] = useState(false);

  const selectedCustomer = quotationState.selectedCustomerId ? 
    customersData.customers[quotationState.selectedCustomerId] : null;
  const selectedParts = quotationState.parts.filter(part => part.selected);

  // Check for saved state on component mount
  useEffect(() => {
    if (hasSavedQuotationState() && (quotationState.selectedCustomerId || quotationState.parts.length > 0)) {
      setShowRestoreNotification(true);
      // Auto-hide notification after 10 seconds
      const timer = setTimeout(() => setShowRestoreNotification(false), 10000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Auto-save indicator
  useEffect(() => {
    if (hasUnsavedChanges()) {
      setAutoSaveStatus('saving');
      const timer = setTimeout(() => setAutoSaveStatus('saved'), 500);
      return () => clearTimeout(timer);
    }
  }, [quotationState, hasUnsavedChanges]);

  const handleFilesSelected = async (files: File[]) => {
    setIsProcessing(true);
    
    try {
      const newParts: QuotationPart[] = [];
      const currentMaxSerial = quotationState.parts.length > 0 ? 
        Math.max(...quotationState.parts.map(p => p.serialNumber)) : 0;
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        try {
          console.log(`Processing file ${i + 1}/${files.length}: ${file.name}`);
          
          // Parse geometry
          const geometry = await FileParser.parseFile(file);
          console.log(`Geometry parsed for ${file.name}:`, geometry);
          
          const fileType = file.name.split('.').pop()?.toLowerCase() || '';
          
          const part: QuotationPart = {
            id: `part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            serialNumber: currentMaxSerial + i + 1,
            fileName: file.name,
            fileType,
            volume: geometry.volume,
            boundingBox: geometry.boundingBox,
            quantity: 1,
            unitPrice: 0,
            totalPrice: 0,
            gstAmount: 0,
            finalPrice: 0,
            file,
            selected: false
          };
          
          newParts.push(part);
          console.log(`Part created for ${file.name}:`, part.id);
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          // Continue with other files even if one fails
        }
      }
      
      console.log(`Successfully processed ${newParts.length} files`);
      updateParts([...quotationState.parts, ...newParts]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdatePart = (partId: string, updates: Partial<QuotationPart>) => {
    console.log('Updating single part:', partId, updates);
    const updatedParts = quotationState.parts.map(part => {
      if (part.id === partId) {
        const updatedPart = { ...part, ...updates };
        
        // Recalculate pricing if material or quantity changed and we have customer
        if (selectedCustomer && updatedPart.material && updatedPart.technology && 
            (updates.material || updates.quantity)) {
          const material = technologiesData.technologies[updatedPart.technology].materials[updatedPart.material];
          const unitPrice = updatedPart.volume * material.cost_per_cc;
          const totalPrice = unitPrice * updatedPart.quantity;
          const gstCalculation = calculateGST(totalPrice, selectedCustomer);
          const finalPrice = totalPrice + gstCalculation.total;
          
          updatedPart.unitPrice = unitPrice;
          updatedPart.totalPrice = totalPrice;
          updatedPart.gstAmount = gstCalculation.total;
          updatedPart.finalPrice = finalPrice;
        }
        
        return updatedPart;
      }
      return part;
    });
    
    updateParts(updatedParts);
  };

  const handleUpdateParts = (partIds: string[], updates: Partial<QuotationPart>) => {
    console.log('handleUpdateParts called with:', { partIds, updates });
    console.log('Total parts before update:', quotationState.parts.length);
    console.log('Parts to update:', partIds.length);
    
    const updatedParts = quotationState.parts.map(part => {
      if (partIds.includes(part.id)) {
        console.log(`Updating part ${part.id} with:`, updates);
        const updatedPart = { ...part, ...updates };
        
        // Handle quantity updates for bulk operations
        if (updates.quantity !== undefined && selectedCustomer && updatedPart.material && updatedPart.technology) {
          console.log('Recalculating pricing for quantity change on part:', part.id);
          const material = technologiesData.technologies[updatedPart.technology].materials[updatedPart.material];
          const unitPrice = updatedPart.volume * material.cost_per_cc;
          const totalPrice = unitPrice * updates.quantity;
          const gstCalculation = calculateGST(totalPrice, selectedCustomer);
          const finalPrice = totalPrice + gstCalculation.total;
          
          updatedPart.unitPrice = unitPrice;
          updatedPart.totalPrice = totalPrice;
          updatedPart.gstAmount = gstCalculation.total;
          updatedPart.finalPrice = finalPrice;
          
          console.log('Updated pricing for quantity change:', {
            partId: part.id,
            quantity: updates.quantity,
            unitPrice,
            totalPrice,
            gstAmount: gstCalculation.total,
            finalPrice
          });
        }
        // Recalculate pricing for bulk material updates
        else if (selectedCustomer && updates.material && updatedPart.technology) {
          console.log('Recalculating pricing for material change on part:', part.id);
          const material = technologiesData.technologies[updatedPart.technology].materials[updates.material];
          const unitPrice = updatedPart.volume * material.cost_per_cc;
          const totalPrice = unitPrice * updatedPart.quantity;
          const gstCalculation = calculateGST(totalPrice, selectedCustomer);
          const finalPrice = totalPrice + gstCalculation.total;
          
          updatedPart.unitPrice = unitPrice;
          updatedPart.totalPrice = totalPrice;
          updatedPart.gstAmount = gstCalculation.total;
          updatedPart.finalPrice = finalPrice;
          
          console.log('Updated pricing for material change:', {
            partId: part.id,
            material: updates.material,
            unitPrice,
            totalPrice,
            gstAmount: gstCalculation.total,
            finalPrice
          });
        } else if (updates.technology && !updates.material) {
          // If only technology is updated without material, reset pricing
          console.log('Resetting pricing for technology change on part:', part.id);
          updatedPart.unitPrice = 0;
          updatedPart.totalPrice = 0;
          updatedPart.gstAmount = 0;
          updatedPart.finalPrice = 0;
        }
        
        return updatedPart;
      }
      return part;
    });
    
    console.log('Parts after bulk update:', updatedParts.filter(p => partIds.includes(p.id)).map(p => ({
      id: p.id,
      technology: p.technology,
      material: p.material,
      quantity: p.quantity,
      unitPrice: p.unitPrice,
      totalPrice: p.totalPrice
    })));
    
    updateParts(updatedParts);
  };

  const handleDeletePart = (partId: string) => {
    const filteredParts = quotationState.parts.filter(part => part.id !== partId);
    // Renumber serial numbers
    const renumberedParts = filteredParts.map((part, index) => ({
      ...part,
      serialNumber: index + 1
    }));
    
    updateParts(renumberedParts);
  };

  const handleDeleteAllParts = () => {
    updateParts([]);
  };

  const handleToggleSelect = (partId: string) => {
    console.log('Toggling selection for part:', partId);
    const updatedParts = quotationState.parts.map(part => {
      if (part.id === partId) {
        const newSelected = !part.selected;
        console.log(`Part ${partId} selected state changed to:`, newSelected);
        return { ...part, selected: newSelected };
      }
      return part;
    });
    
    updateParts(updatedParts);
  };

  const handleToggleSelectAll = () => {
    console.log('Toggle select all called');
    const allSelected = quotationState.parts.length > 0 && selectedParts.length === quotationState.parts.length;
    console.log('Current state - All selected:', allSelected, 'Parts:', quotationState.parts.length, 'Selected:', selectedParts.length);
    
    const updatedParts = quotationState.parts.map(part => ({ ...part, selected: !allSelected }));
    console.log('After toggle select all:', updatedParts.filter(p => p.selected).length, 'selected out of', updatedParts.length);
    
    updateParts(updatedParts);
  };

  const handleCustomerChange = (customerId: string) => {
    console.log('Customer changed to:', customerId);
    updateSelectedCustomer(customerId);
    
    // Recalculate GST for all parts when customer changes
    if (customerId && customersData.customers[customerId]) {
      const customer = customersData.customers[customerId];
      const updatedParts = quotationState.parts.map(part => {
        if (part.totalPrice > 0) {
          const gstCalculation = calculateGST(part.totalPrice, customer);
          return {
            ...part,
            gstAmount: gstCalculation.total,
            finalPrice: part.totalPrice + gstCalculation.total
          };
        }
        return part;
      });
      updateParts(updatedParts);
    } else {
      // Clear customer - reset GST calculations
      const updatedParts = quotationState.parts.map(part => ({
        ...part,
        gstAmount: 0,
        finalPrice: part.totalPrice
      }));
      updateParts(updatedParts);
    }
  };

  const handleAddNewCustomer = () => {
    setShowCustomerForm(true);
  };

  const handleSaveCustomer = (customer: Customer, customerId?: string) => {
    // For new customers, generate the ID here and pass it correctly
    let id = customerId;
    if (!id) {
      // Generate new customer ID
      id = customersData.next_customer_id;
    }
    
    // Call the parent handler to update the customers data
    if (onCustomerAdded) {
      onCustomerAdded(customer, id);
    }
    
    // Select the newly created customer
    updateSelectedCustomer(id);
    
    // Close the form
    setShowCustomerForm(false);
  };

  const handleCancelCustomerForm = () => {
    setShowCustomerForm(false);
  };

  const handleAddManualPart = () => {
    if (!quotationState.selectedCustomerId) {
      alert('Please select a customer first before adding parts.');
      return;
    }
    setShowManualPartForm(true);
  };

  const handleSaveManualPart = (part: QuotationPart) => {
    updateParts([...quotationState.parts, part]);
    setShowManualPartForm(false);
  };

  const handleCancelManualPartForm = () => {
    setShowManualPartForm(false);
  };

  const handleSaveQuotation = async (): Promise<string> => {
    if (!selectedCustomer || quotationState.parts.length === 0) {
      throw new Error('Missing customer or parts');
    }

    try {
      const totalBasePrice = quotationState.parts.reduce((sum, part) => sum + part.totalPrice, 0);
      const totalServiceCharges = quotationState.serviceCharges.reduce((sum, charge) => sum + charge.amount, 0);
      const combinedBasePrice = totalBasePrice + totalServiceCharges;
      const discountAmount = (totalBasePrice * (quotationState.discount || 0)) / 100;
      const discountedPrice = combinedBasePrice - discountAmount;
      const gstCalculation = calculateGST(discountedPrice, selectedCustomer);
      const finalPrice = discountedPrice + gstCalculation.total;

      // Determine payment terms: use quotation-specific terms if set, otherwise use customer's default
      const paymentTerms = quotationState.paymentTerms || selectedCustomer.payment_terms;
     const leadTime = quotationState.leadTime || '3-5 days';
      const shippingAddressType = quotationState.shippingAddressType || 'shipping';

      const quotationId = await saveQuotation({
        customerId: quotationState.selectedCustomerId!,
        customerName: selectedCustomer.company_name,
        parts: quotationState.parts.map(part => ({
          id: part.id,
          serialNumber: part.serialNumber,
          fileName: part.fileName,
          fileType: part.fileType,
          volume: part.volume,
          boundingBox: part.boundingBox,
          technology: part.technology,
          material: part.material,
          quantity: part.quantity,
          unitPrice: part.unitPrice,
          totalPrice: part.totalPrice,
          gstAmount: part.gstAmount,
          finalPrice: part.finalPrice,
          comments: part.comments
        })),
        totalBasePrice: combinedBasePrice,
        discount: quotationState.discount || 0,
        totalGST: gstCalculation.total,
        finalPrice,
        gstType: gstCalculation.type,
        notes: quotationState.notes || '',
        paymentTerms, // Include payment terms
        leadTime, // Include lead time
        shippingAddressType, // Include shipping address type
        serviceCharges: quotationState.serviceCharges, // Include service charges
        totalServiceCharges, // Include total service charges
        existingQuotationId: quotationState.editingQuotationId // Pass existing ID if editing
      });

      // Show success message
      setShowSaveSuccess(true);
      setTimeout(() => setShowSaveSuccess(false), 3000);

      // Clear the current quotation state
      clearQuotationState();
      
      console.log('Quotation saved successfully with ID:', quotationId);
      return quotationId;
    } catch (error) {
      console.error('Error saving quotation:', error);
      throw error;
    }
  };

  const handleNewQuotation = () => {
    if (hasUnsavedChanges()) {
      if (window.confirm('Are you sure you want to start a new quotation? All current progress will be lost.')) {
        clearQuotationState();
        setShowRestoreNotification(false);
      }
    } else {
      clearQuotationState();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Auto-save Status */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditingMode() ? 'Edit Quotation' : 'Create Quotation'}
          </h2>
          <div className="flex items-center space-x-4 mt-1">
            <p className="text-gray-600">
              {isEditingMode() 
                ? 'Modify your existing quotation' 
                : 'Generate quotes for your 3D printing projects'
              }
            </p>
            {autoSaveStatus && (
              <div className="flex items-center space-x-1 text-sm">
                {autoSaveStatus === 'saving' && (
                  <>
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-indigo-600"></div>
                    <span className="text-gray-500">Saving...</span>
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    <span className="text-green-600">Auto-saved</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {hasUnsavedChanges() && (
            <button
              onClick={handleNewQuotation}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Quotation</span>
            </button>
          )}
        </div>
      </div>

      {/* Editing Mode Indicator */}
      {isEditingMode() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Edit className="h-5 w-5 text-blue-600" />
            <div>
              <h4 className="text-sm font-medium text-blue-900">Editing Mode</h4>
              <p className="text-sm text-blue-700 mt-1">
                You are currently editing an existing quotation. Changes will update the original quotation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {showSaveSuccess && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <h4 className="text-sm font-medium text-green-900">
                Quotation {isEditingMode() ? 'Updated' : 'Saved'} Successfully!
              </h4>
              <p className="text-sm text-green-700 mt-1">
                Your quotation has been {isEditingMode() ? 'updated' : 'saved'} and you can now create a new one.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Restore Notification */}
      {showRestoreNotification && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-blue-900">Previous Work Restored</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your previous quotation has been automatically restored. Last saved: {' '}
                {new Date(quotationState.lastUpdated).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => setShowRestoreNotification(false)}
              className="text-blue-400 hover:text-blue-600"
            >
              <span className="sr-only">Close</span>
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Selection */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <CustomerSelector
              customers={customersData.customers}
              selectedCustomerId={quotationState.selectedCustomerId}
              onSelectCustomer={handleCustomerChange}
              onAddNewCustomer={handleAddNewCustomer}
            />
          </div>

          {/* File Upload */}
          {quotationState.selectedCustomerId && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <FileUpload
                onFilesSelected={handleFilesSelected}
                isProcessing={isProcessing}
              />
              
              {/* Manual Part Entry Button */}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleAddManualPart}
                  className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Part Manually</span>
                </button>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter part details manually without uploading a file
                </p>
              </div>
            </div>
          )}

          {/* Bulk Actions */}
          {quotationState.parts.length > 0 && (
            <BulkActions
              parts={quotationState.parts}
              selectedParts={selectedParts}
              technologiesData={technologiesData}
              customer={selectedCustomer}
              onUpdateParts={handleUpdateParts}
              onDeleteAllParts={handleDeleteAllParts}
              onToggleSelectAll={handleToggleSelectAll}
            />
          )}

          {/* Parts List */}
          {quotationState.parts.length > 0 && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">
                  Parts ({quotationState.parts.length})
                  {selectedParts.length > 0 && (
                    <span className="text-indigo-600 ml-2">
                      ({selectedParts.length} selected)
                    </span>
                  )}
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (quotationState.selectedCustomerId) {
                      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
                      if (fileInput) {
                        fileInput.click();
                      }
                    } else {
                      alert('Please select a customer first before adding parts.');
                    }
                  }}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Upload More Files</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddManualPart}
                  className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Manual Part</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {quotationState.parts.map(part => (
                  <PartCard
                    key={part.id}
                    part={part}
                    technologiesData={technologiesData}
                    customer={selectedCustomer}
                    onUpdatePart={handleUpdatePart}
                    onDeletePart={handleDeletePart}
                    onToggleSelect={handleToggleSelect}
                    selectedParts={selectedParts}
                    onBulkUpdate={handleUpdateParts}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!quotationState.selectedCustomerId && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start Creating Your Quotation</h3>
              <p className="text-gray-600">Select a customer to begin uploading 3D files and generating quotes</p>
            </div>
          )}
        </div>

        {/* Quotation Summary */}
        <div className="lg:col-span-1">
          <QuotationSummary
            parts={quotationState.parts}
            customer={selectedCustomer}
            selectedCustomerId={quotationState.selectedCustomerId}
            technologiesData={technologiesData}
            onDiscountChange={updateDiscount}
            discount={quotationState.discount}
            notes={quotationState.notes || ''}
            onNotesChange={updateNotes}
            paymentTerms={quotationState.paymentTerms}
            onPaymentTermsChange={updatePaymentTerms}
            leadTime={quotationState.leadTime}
            onLeadTimeChange={updateLeadTime}
            shippingAddressType={quotationState.shippingAddressType}
            onShippingAddressTypeChange={updateShippingAddressType}
            serviceCharges={quotationState.serviceCharges}
            onServiceChargesChange={updateServiceCharges}
            onSaveQuotation={handleSaveQuotation}
            onClearQuotation={handleNewQuotation}
            isEditingMode={isEditingMode()}
          />
        </div>
      </div>

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <CustomerForm
          onSave={handleSaveCustomer}
          onCancel={handleCancelCustomerForm}
        />
      )}

      {/* Manual Part Form Modal */}
      {showManualPartForm && (
        <ManualPartForm
          technologiesData={technologiesData}
          customer={selectedCustomer}
          onSave={handleSaveManualPart}
          onCancel={handleCancelManualPartForm}
          nextSerialNumber={quotationState.parts.length + 1}
        />
      )}
    </div>
  );
};

export default QuotationPage;