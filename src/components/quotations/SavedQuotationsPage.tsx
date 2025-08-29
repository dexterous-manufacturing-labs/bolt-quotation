import React, { useState } from 'react';
import { Search, Eye, Download, Trash2, Calendar, Building, User, Package, Calculator, Filter, FileText, Edit } from 'lucide-react';
import { SavedQuotation, CustomersData } from '../../types';
import { useSavedQuotations } from '../../hooks/useSavedQuotations';
import { useSavedInvoices } from '../../hooks/useSavedInvoices';
import { useQuotationState } from '../../hooks/useQuotationState';
import { formatGSTBreakdown, calculateGST } from '../../utils/gstCalculator';
import { PDFGenerator } from '../../utils/pdfGenerator';

interface SavedQuotationsPageProps {
  customersData: CustomersData;
  technologiesData: any;
}

const SavedQuotationsPage: React.FC<SavedQuotationsPageProps> = ({ customersData, technologiesData }) => {
  const { quotations, deleteQuotation, updateQuotationStatus } = useSavedQuotations();
  const { createInvoiceFromQuotation } = useSavedInvoices();
  const { loadQuotationForEditing, clearQuotationState } = useQuotationState();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuotation, setSelectedQuotation] = useState<SavedQuotation | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);
  const [isCreatingInvoice, setIsCreatingInvoice] = useState<string | null>(null);

  const quotationsList = Object.values(quotations);

  const filteredQuotations = quotationsList.filter(quotation => {
    const matchesSearch = 
      quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDeleteQuotation = (quotationId: string) => {
    if (window.confirm('Are you sure you want to delete this quotation? This action cannot be undone.')) {
      deleteQuotation(quotationId);
    }
  };

  const handleStatusChange = (quotationId: string, newStatus: SavedQuotation['status']) => {
    updateQuotationStatus(quotationId, newStatus);
  };

  const handleDownloadPDF = async (quotation: SavedQuotation) => {
    const customer = customersData.customers[quotation.customerId];
    if (!customer) {
      alert('Customer information not found. Cannot generate PDF.');
      return;
    }

    setIsGeneratingPDF(quotation.id);
    
    try {
      await PDFGenerator.generateQuotationPDF(quotation, customer, technologiesData);
      console.log('PDF generated successfully for quotation:', quotation.quotationNumber);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(null);
    }
  };

  const handleCreateInvoice = async (quotation: SavedQuotation) => {
    setIsCreatingInvoice(quotation.id);
    
    try {
      const invoiceId = await createInvoiceFromQuotation({
        quotation,
        onQuotationDeleted: deleteQuotation
      });
      
      console.log('Invoice created successfully:', invoiceId);
      alert(`Invoice ${quotation.quotationNumber.replace('QT', 'INV_QT')} created successfully!\n\nThe corresponding quotation has been automatically removed.`);
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    } finally {
      setIsCreatingInvoice(null);
    }
  };

  const handleEditQuotation = (quotation: SavedQuotation) => {
    // Clear any existing state first
    clearQuotationState();
    
    // Load the quotation for editing
    loadQuotationForEditing(quotation);
    
    // Navigate to the create quotation page (this would be handled by the parent component)
    // For now, we'll show an alert
    alert(`Quotation ${quotation.quotationNumber} has been loaded for editing. Please navigate to the "Create Quotation" tab to continue editing.`);
  };

  const getStatusColor = (status: SavedQuotation['status']) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Sent': return 'bg-blue-100 text-blue-800';
      case 'Approved': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Expired': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Saved Quotations</h2>
          <p className="text-gray-600">Manage and track your saved quotations</p>
        </div>
        <div className="text-sm text-gray-500">
          {quotationsList.length} total quotations
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search quotations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
              >
                <option value="all">All Status</option>
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
                <option value="Expired">Expired</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Quotations List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredQuotations.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No quotations found</p>
            {searchTerm && (
              <p className="text-sm mt-1">Try adjusting your search criteria</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredQuotations.map((quotation) => {
              const customer = customersData.customers[quotation.customerId];
              const expired = isExpired(quotation.validUntil);
              const isGenerating = isGeneratingPDF === quotation.id;
              const isCreating = isCreatingInvoice === quotation.id;
              
              return (
                <div key={quotation.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <Package className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {quotation.quotationNumber}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Created: {new Date(quotation.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(quotation.status)}`}>
                            {quotation.status}
                          </span>
                          {expired && quotation.status !== 'Expired' && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Expired
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Building className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{quotation.customerName}</p>
                            {customer && (
                              <p className="text-xs text-gray-500">{customer.contact_person}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Package className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{quotation.parts.length} parts</p>
                            <p className="text-xs text-gray-500">
                              {quotation.parts.reduce((sum, part) => sum + part.quantity, 0)} total qty
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calculator className="h-4 w-4" />
                          <div>
                            <p className="font-medium text-indigo-600">₹{quotation.finalPrice.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">
                              {quotation.gstType === 'INTRASTATE' ? 'CGST+SGST' : 'IGST'} included
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Valid until: {new Date(quotation.validUntil).toLocaleDateString()}</span>
                        </div>
                        <div>
                          Last updated: {new Date(quotation.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditQuotation(quotation)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                        title="Edit Quotation"
                      >
                        <Edit className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() => setSelectedQuotation(quotation)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDownloadPDF(quotation)}
                        disabled={isGenerating}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download PDF Quote"
                      >
                        {isGenerating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </button>

                      <button
                        onClick={() => handleCreateInvoice(quotation)}
                        disabled={isCreating}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                        title="Create Invoice and Delete Quotation"
                      >
                        {isCreating ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            <span>Creating...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <FileText className="h-3 w-3" />
                            <span>Create Invoice</span>
                          </div>
                        )}
                      </button>

                      {quotation.status === 'Sent' && (
                        <div className="relative group">
                          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                            <Calendar className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                            <div className="p-2 space-y-1">
                              <button
                                onClick={() => handleStatusChange(quotation.id, 'Approved')}
                                className="block w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-green-100 rounded"
                              >
                                Mark as Approved
                              </button>
                              <button
                                onClick={() => handleStatusChange(quotation.id, 'Rejected')}
                                className="block w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-100 rounded"
                              >
                                Mark as Rejected
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => handleDeleteQuotation(quotation.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete Quotation"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Quotation Details Modal */}
      {selectedQuotation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Quotation Details - {selectedQuotation.quotationNumber}
              </h2>
              <button
                onClick={() => setSelectedQuotation(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Customer Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">{selectedQuotation.customerName}</p>
                    {customersData.customers[selectedQuotation.customerId] && (
                      <>
                        <p className="text-gray-600">
                          {customersData.customers[selectedQuotation.customerId].contact_person}
                        </p>
                        <p className="text-gray-600">
                          {customersData.customers[selectedQuotation.customerId].email}
                        </p>
                      </>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Status:</span> {selectedQuotation.status}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Valid Until:</span> {new Date(selectedQuotation.validUntil).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parts List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Parts ({selectedQuotation.parts.length})</h3>
                <div className="space-y-3">
                  {selectedQuotation.parts.map((part, index) => (
                    <div key={part.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h4 className="font-medium text-gray-900">#{part.serialNumber} - {part.fileName}</h4>
                            <p className="text-sm text-gray-600">
                              {part.volume.toFixed(2)} cm³ • {part.quantity} qty
                            </p>
                            {part.technology && part.material && (
                              <p className="text-sm text-gray-600">
                                {part.technology} - {part.material}
                                {technologiesData.technologies[part.technology]?.materials[part.material] && (
                                  <span className="block text-xs text-gray-500">
                                    ({technologiesData.technologies[part.technology].materials[part.material].name})
                                  </span>
                                )}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900">₹{part.finalPrice.toFixed(2)}</p>
                          <p className="text-sm text-gray-600">₹{part.unitPrice.toFixed(2)} per unit</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pricing Summary */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3">Pricing Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Base Price:</span>
                    <span>₹{selectedQuotation.totalBasePrice.toFixed(2)}</span>
                  </div>
                  {selectedQuotation.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({selectedQuotation.discount}%):</span>
                      <span>-₹{((selectedQuotation.totalBasePrice * selectedQuotation.discount) / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{(selectedQuotation.totalBasePrice - (selectedQuotation.totalBasePrice * selectedQuotation.discount) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({selectedQuotation.gstType}):</span>
                    <span>₹{selectedQuotation.totalGST.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-indigo-200 pt-2 flex justify-between font-semibold text-lg">
                    <span>Final Price:</span>
                    <span className="text-indigo-600">₹{selectedQuotation.finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedQuotation.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-600 text-sm">{selectedQuotation.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SavedQuotationsPage;