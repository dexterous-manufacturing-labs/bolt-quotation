import React, { useState } from 'react';
import { Calculator, Percent, Receipt, Building, Save, Download, Edit, CreditCard, Plus, Trash2, Wrench } from 'lucide-react';
import { QuotationPart, Customer, ServiceCharge } from '../../types';
import { calculateGST, formatGSTBreakdown, COMPANY_INFO } from '../../utils/gstCalculator';
import { PDFGenerator } from '../../utils/pdfGenerator';

interface QuotationSummaryProps {
  parts: QuotationPart[];
  customer: Customer | null;
  selectedCustomerId: string | null;
  technologiesData?: any;
  onDiscountChange: (discount: number) => void;
  discount: number;
  notes: string;
  onNotesChange: (notes: string) => void;
  paymentTerms?: string;
  onPaymentTermsChange?: (paymentTerms: string) => void;
  leadTime?: string;
  onLeadTimeChange?: (leadTime: string) => void;
  shippingAddressType?: 'billing' | 'shipping';
  onShippingAddressTypeChange?: (type: 'billing' | 'shipping') => void;
  serviceCharges: ServiceCharge[];
  onServiceChargesChange?: (serviceCharges: ServiceCharge[]) => void;
  onSaveQuotation?: () => Promise<string>; // Return quotation ID
  onClearQuotation?: () => void;
  isEditingMode?: boolean;
}

const QuotationSummary: React.FC<QuotationSummaryProps> = ({
  parts,
  customer,
  selectedCustomerId,
  technologiesData,
  onDiscountChange,
  discount,
  notes,
  onNotesChange,
  paymentTerms,
  onPaymentTermsChange,
  leadTime,
  onLeadTimeChange,
  shippingAddressType,
  onShippingAddressTypeChange,
  serviceCharges,
  onServiceChargesChange,
  onSaveQuotation,
  onClearQuotation,
  isEditingMode = false
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingPartsList, setIsDownloadingPartsList] = useState(false);
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [newServiceAmount, setNewServiceAmount] = useState('');

  const totalBasePrice = parts.reduce((sum, part) => sum + part.totalPrice, 0);
  const totalServiceCharges = serviceCharges.reduce((sum, charge) => sum + charge.amount, 0);
  const combinedBasePrice = totalBasePrice + totalServiceCharges;
  
  // ONLY apply discount if user has manually entered a value
  const appliedDiscountRate = discount || 0;
  const discountAmount = (combinedBasePrice * appliedDiscountRate) / 100;
  const discountedPrice = combinedBasePrice - discountAmount;
  
  // Calculate GST on discounted price
  const totalGST = customer && discountedPrice > 0 ? 
    calculateGST(discountedPrice, customer) : null;
  const finalPrice = discountedPrice + (totalGST?.total || 0);

  const totalParts = parts.length;
  const totalQuantity = parts.reduce((sum, part) => sum + part.quantity, 0);
  const totalVolume = parts.reduce((sum, part) => sum + (part.volume * part.quantity), 0);

  const hasContent = totalParts > 0 || customer || serviceCharges.length > 0;
  const canSave = (totalParts > 0 || serviceCharges.length > 0) && customer && combinedBasePrice > 0;

  // Get effective payment terms (quotation-specific or customer default)
  const effectivePaymentTerms = paymentTerms || (customer?.payment_terms);
  const effectiveLeadTime = leadTime || '3-5 days';

  const handleSaveQuotation = async () => {
    if (!canSave || !onSaveQuotation || !customer) return;

    setIsSaving(true);
    try {
      // Save the quotation
      await onSaveQuotation();
      console.log('Quotation saved successfully');
    } catch (error) {
      console.error('Error saving quotation:', error);
      alert('Failed to save quotation. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!canSave || !customer) return;

    setIsDownloading(true);
    try {
      // Create a temporary quotation object for PDF generation without saving
      const tempQuotation = {
        id: `temp_${Date.now()}`,
        quotationNumber: `TEMP_${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}_001`,
        customerId: selectedCustomerId || 'temp',
        customerName: customer.company_name,
        parts: parts.map(part => ({
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
        discount: discount || 0,
        totalGST: totalGST?.total || 0,
        finalPrice,
        status: 'Draft' as const,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        notes: notes || '',
        paymentTerms: effectivePaymentTerms || '',
        leadTime: effectiveLeadTime,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        gstType: totalGST?.type || 'INTRASTATE' as const,
        serviceCharges: serviceCharges,
        totalServiceCharges: totalServiceCharges
      };

      // Generate and download the PDF using the temporary quotation
      await PDFGenerator.generateQuotationPDF(tempQuotation, customer, technologiesData);
      console.log('PDF downloaded successfully');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPartsList = async () => {
    if (!canSave || !customer) return;

    setIsDownloadingPartsList(true);
    try {
      await PDFGenerator.generatePartsListPDF(parts, customer, totalVolume);
      console.log('Parts list PDF generated successfully');
    } catch (error) {
      console.error('Error generating parts list PDF:', error);
      alert('Failed to generate parts list PDF. Please try again.');
    } finally {
      setIsDownloadingPartsList(false);
    }
  };

  const paymentTermsOptions = [
    '100% advance',
    '60% advance and rest upon delivery',
    'Payment on delivery',
    'Net 15',
    'Net 30',
    'Net 45',
    'Net 60'
  ];

  const handleAddServiceCharge = () => {
    if (!newServiceDescription.trim() || !newServiceAmount || parseFloat(newServiceAmount) <= 0) {
      alert('Please enter a valid service description and amount.');
      return;
    }

    const newCharge: ServiceCharge = {
      id: `service_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      description: newServiceDescription.trim(),
      amount: parseFloat(newServiceAmount)
    };

    if (onServiceChargesChange) {
      onServiceChargesChange([...serviceCharges, newCharge]);
    }

    setNewServiceDescription('');
    setNewServiceAmount('');
  };

  const handleRemoveServiceCharge = (chargeId: string) => {
    if (onServiceChargesChange) {
      onServiceChargesChange(serviceCharges.filter(charge => charge.id !== chargeId));
    }
  };

  const handleUpdateServiceCharge = (chargeId: string, field: 'description' | 'amount', value: string | number) => {
    if (onServiceChargesChange) {
      onServiceChargesChange(serviceCharges.map(charge => 
        charge.id === chargeId 
          ? { ...charge, [field]: value }
          : charge
      ));
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 sticky top-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
        <Calculator className="h-5 w-5" />
        <span>Quotation Summary</span>
        {isEditingMode && (
          <div className="flex items-center space-x-1 text-sm text-blue-600">
            <Edit className="h-3 w-3" />
            <span className="text-xs">Editing</span>
          </div>
        )}
      </h3>

      {/* Company Info */}
      <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
        <div className="flex items-center space-x-2 mb-2">
          <Building className="h-4 w-4 text-indigo-600" />
          <h4 className="font-medium text-indigo-900">{COMPANY_INFO.name}</h4>
        </div>
        <p className="text-sm text-indigo-700">GSTN: {COMPANY_INFO.gstn}</p>
        <p className="text-sm text-indigo-700">
          {COMPANY_INFO.address.city}, {COMPANY_INFO.address.state}
        </p>
      </div>

      {/* Customer Info */}
      {customer && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900">{customer.company_name}</h4>
          <p className="text-sm text-gray-600">{customer.contact_person}</p>
          <p className="text-sm text-gray-600">{customer.email}</p>
          <p className="text-sm text-gray-600">
            Delivery: {customer.shipping_address.city}, {customer.shipping_address.state}
          </p>
        </div>
      )}

      {/* Parts Summary */}
      {totalParts > 0 && (
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Parts:</span>
            <span className="font-medium">{totalParts}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Quantity:</span>
            <span className="font-medium">{totalQuantity}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Volume:</span>
            <span className="font-medium">{totalVolume.toFixed(2)} cm³</span>
          </div>
        </div>
      )}

      {/* Payment Terms Section */}
      {customer && onPaymentTermsChange && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <CreditCard className="h-4 w-4" />
              <span>Payment Terms</span>
            </div>
          </label>
          <select
            value={paymentTerms || ''}
            onChange={(e) => onPaymentTermsChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Use customer default ({customer.payment_terms})</option>
            {paymentTermsOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {paymentTerms 
              ? `Using custom terms: ${paymentTerms}`
              : `Using customer default: ${customer.payment_terms}`
            }
          </p>
        </div>
      )}

      {/* Shipping Address Selection */}
      {customer && onShippingAddressTypeChange && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <span>Shipping Address</span>
            </div>
          </label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="shippingAddress"
                value="billing"
                checked={shippingAddressType === 'billing'}
                onChange={() => onShippingAddressTypeChange('billing')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Same as billing address</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="shippingAddress"
                value="shipping"
                checked={shippingAddressType === 'shipping'}
                onChange={() => onShippingAddressTypeChange('shipping')}
                className="text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Use separate shipping address</span>
            </label>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {shippingAddressType === 'billing' 
              ? 'Invoice will show: "Billing & Shipping Address: Same"'
              : 'Invoice will show both addresses separately'
            }
          </p>
        </div>
      )}

      {/* Lead Time Section */}
      {customer && onLeadTimeChange && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <div className="flex items-center space-x-2">
              <span>Lead Time</span>
            </div>
          </label>
          <input
            type="text"
            value={leadTime || ''}
            onChange={(e) => onLeadTimeChange(e.target.value)}
            placeholder="3-5 days"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            {leadTime 
              ? `Using custom lead time: ${leadTime}`
              : 'Using default: 3-5 days'
            }
          </p>
        </div>
      )}

      {/* Pricing */}
      {totalParts > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Parts Total:</span>
            <span className="text-lg font-semibold">₹{totalBasePrice.toFixed(2)}</span>
          </div>

          {/* Service Charges Section */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Wrench className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Additional Services</span>
              </div>
            </div>

            {/* Add New Service Charge */}
            {onServiceChargesChange && (
              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  value={newServiceDescription}
                  onChange={(e) => setNewServiceDescription(e.target.value)}
                  placeholder="Service description (e.g., Heat inserts, Painting, Delivery)"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <div className="flex space-x-2">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={newServiceAmount}
                    onChange={(e) => setNewServiceAmount(e.target.value)}
                    placeholder="Amount (₹)"
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddServiceCharge}
                    className="px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors duration-200 flex items-center space-x-1"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add</span>
                  </button>
                </div>
              </div>
            )}

            {/* Service Charges List */}
            {serviceCharges.length > 0 && (
              <div className="space-y-2 mb-3">
                {serviceCharges.map((charge) => (
                  <div key={charge.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex-1">
                      {onServiceChargesChange ? (
                        <input
                          type="text"
                          value={charge.description}
                          onChange={(e) => handleUpdateServiceCharge(charge.id, 'description', e.target.value)}
                          className="w-full text-sm bg-transparent border-none focus:outline-none"
                        />
                      ) : (
                        <span className="text-sm text-gray-700">{charge.description}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      {onServiceChargesChange ? (
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={charge.amount}
                          onChange={(e) => handleUpdateServiceCharge(charge.id, 'amount', parseFloat(e.target.value) || 0)}
                          className="w-20 text-sm text-right bg-transparent border-none focus:outline-none"
                        />
                      ) : (
                        <span className="text-sm font-medium">₹{charge.amount.toFixed(2)}</span>
                      )}
                      {onServiceChargesChange && (
                        <button
                          type="button"
                          onClick={() => handleRemoveServiceCharge(charge.id)}
                          className="p-1 text-red-600 hover:text-red-800 transition-colors duration-200"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                  <span className="text-sm text-gray-600">Services Total:</span>
                  <span className="text-sm font-semibold">₹{totalServiceCharges.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Combined Subtotal */}
          {(totalParts > 0 || serviceCharges.length > 0) && (
            <div className="flex justify-between items-center">
              <span className="text-gray-700">Subtotal:</span>
              <span className="text-lg font-semibold">₹{combinedBasePrice.toFixed(2)}</span>
            </div>
          )}

          {/* Discount Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Discount (%)
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={discount || ''}
                onChange={(e) => onDiscountChange(parseFloat(e.target.value) || 0)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter discount percentage"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Leave empty for no discount
            </p>
          </div>

          {appliedDiscountRate > 0 && (
            <div className="flex justify-between items-center text-green-600">
              <span>Discount ({appliedDiscountRate.toFixed(1)}%):</span>
              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}

          {appliedDiscountRate > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-gray-700">After Discount:</span>
              <span className="font-semibold">₹{discountedPrice.toFixed(2)}</span>
            </div>
          )}

          {/* GST Breakdown */}
          {totalGST && customer && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-2">
                <Receipt className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">GST Breakdown</span>
              </div>
              <div className="text-sm text-yellow-700">
                <p>{formatGSTBreakdown(totalGST)}</p>
                <div className="flex justify-between mt-1">
                  <span>Total GST:</span>
                  <span className="font-medium">₹{totalGST.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Final Price:</span>
              <span className="text-2xl font-bold text-indigo-600">₹{finalPrice.toFixed(2)}</span>
            </div>
            {totalGST && (
              <p className="text-xs text-gray-500 mt-1">
                (Inclusive of all taxes)
              </p>
            )}
          </div>
        </div>
      )}

      {/* Notes Section */}
      {(totalParts > 0 || serviceCharges.length > 0) && (
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Add any special instructions or notes..."
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="mt-6 space-y-2">
        <button
          onClick={handleSaveQuotation}
          disabled={!canSave || isSaving}
          className="w-full bg-indigo-600 text-white py-2.5 px-4 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{isEditingMode ? 'Updating...' : 'Saving...'}</span>
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              <span>{isEditingMode ? 'Update Quote' : 'Save Quote'}</span>
            </>
          )}
        </button>
        
        <button
          onClick={handleDownloadPartsList}
          disabled={!canSave || isDownloadingPartsList}
          className="w-full bg-purple-600 text-white py-2.5 px-4 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          {isDownloadingPartsList ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Generating Parts List...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Download Parts List</span>
            </>
          )}
        </button>
        
        <button
          onClick={handleDownloadPDF}
          disabled={!canSave || isDownloading}
          className="w-full bg-green-600 text-white py-2.5 px-4 rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
        >
          {isDownloading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Download Quote</span>
            </>
          )}
        </button>
      </div>

      {/* Helper Text */}
      {canSave && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          <p>Save to store in database • Download to get PDF • Parts List for production</p>
        </div>
      )}

      {/* Auto-save Notice */}
      {hasContent && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Save className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">Auto-saved locally</span>
          </div>
          <p className="text-xs text-green-700 mt-1">
            Your progress is automatically saved and will be restored when you return.
          </p>
        </div>
      )}
    </div>
  );
};

export default QuotationSummary;