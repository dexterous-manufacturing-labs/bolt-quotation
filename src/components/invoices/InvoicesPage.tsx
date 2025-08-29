import React, { useState } from 'react';
import { Search, Eye, Download, Trash2, Calendar, Building, Package, Calculator, Filter, FileText, CreditCard, AlertTriangle, CheckCircle } from 'lucide-react';
import { SavedInvoice, CustomersData } from '../../types';
import { useSavedInvoices } from '../../hooks/useSavedInvoices';
import { formatGSTBreakdown, calculateGST } from '../../utils/gstCalculator';
import { PDFGenerator } from '../../utils/pdfGenerator';
import PaymentModal from './PaymentModal';
import PaymentHistory from './PaymentHistory';

interface InvoicesPageProps {
  customersData: CustomersData;
  technologiesData: any;
}

const InvoicesPage: React.FC<InvoicesPageProps> = ({ customersData, technologiesData }) => {
  const { invoices, deleteInvoice, updateInvoiceStatus, addPayment, removePayment } = useSavedInvoices();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedInvoice, setSelectedInvoice] = useState<SavedInvoice | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<string | null>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState<string | null>(null);

  const invoicesList = Object.values(invoices);

  const filteredInvoices = invoicesList.filter(invoice => {
    const matchesSearch = 
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleDeleteInvoice = (invoiceId: string) => {
    if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
      deleteInvoice(invoiceId);
    }
  };

  const handleStatusChange = (invoiceId: string, newStatus: SavedInvoice['status']) => {
    updateInvoiceStatus(invoiceId, newStatus);
  };

  const handleAddPayment = (invoiceId: string, payment: any) => {
    addPayment(invoiceId, payment);
    setShowPaymentModal(null);
  };

  const handleRemovePayment = (invoiceId: string, paymentId: string) => {
    removePayment(invoiceId, paymentId);
  };

  const handleDownloadPDF = async (invoice: SavedInvoice) => {
    const customer = customersData.customers[invoice.customerId];
    if (!customer) {
      alert('Customer information not found. Cannot generate PDF.');
      return;
    }

    setIsGeneratingPDF(invoice.id);
    
    try {
      await PDFGenerator.generateInvoicePDF(invoice, customer, technologiesData);
      console.log('Invoice PDF generated successfully for:', invoice.invoiceNumber);
    } catch (error) {
      console.error('Error generating invoice PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(null);
    }
  };

  const getStatusColor = (status: SavedInvoice['status']) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-800';
      case 'Sent': return 'bg-blue-100 text-blue-800';
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Cancelled': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = (dueDate: string, status: SavedInvoice['status']) => {
    return new Date(dueDate) < new Date() && status !== 'Paid' && status !== 'Cancelled';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Invoices</h2>
          <p className="text-gray-600">Manage and track your invoices</p>
        </div>
        <div className="text-sm text-gray-500">
          {invoicesList.length} total invoices
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
                placeholder="Search invoices..."
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
                <option value="Paid">Paid</option>
                <option value="Overdue">Overdue</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredInvoices.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No invoices found</p>
            {searchTerm && (
              <p className="text-sm mt-1">Try adjusting your search criteria</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => {
              const customer = customersData.customers[invoice.customerId];
              const overdue = isOverdue(invoice.dueDate, invoice.status);
              const isGenerating = isGeneratingPDF === invoice.id;
              
              return (
                <div key={invoice.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <FileText className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {invoice.invoiceNumber}
                          </h3>
                          <p className="text-sm text-gray-600">
                            From Quotation: {invoice.quotationNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            Created: {new Date(invoice.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                            {invoice.status}
                          </span>
                          {overdue && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Overdue
                            </span>
                          )}
                          {overdue && (invoice.remainingAmount || invoice.finalPrice) > 0 && (
                            <div className="flex items-center space-x-1 bg-red-100 border border-red-300 rounded-lg px-2 py-1">
                              <AlertTriangle className="h-3 w-3 text-red-600" />
                              <span className="text-xs font-bold text-red-700">PAYMENT OVERDUE</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Building className="h-4 w-4" />
                          <div>
                            <p className="font-medium">
                              {customer ? customer.company_name : invoice.customerName}
                            </p>
                            {customer && (
                              <p className="text-xs text-gray-500">{customer.contact_person}</p>
                            )}
                            {!customer && (
                              <p className="text-xs text-red-500">Customer data not found (ID: {invoice.customerId})</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Package className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{invoice.parts.length} parts</p>
                            <p className="text-xs text-gray-500">
                              {invoice.parts.reduce((sum, part) => sum + part.quantity, 0)} total qty
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Calculator className="h-4 w-4" />
                          <div>
                            <p className="font-medium text-indigo-600">₹{invoice.finalPrice.toFixed(2)}</p>
                            <p className="text-xs text-gray-500">
                              {invoice.gstType === 'INTRASTATE' ? 'CGST+SGST' : 'IGST'} included
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Payment Summary */}
                      <div className="bg-gray-50 rounded-lg p-3 mb-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Total Amount:</p>
                            <p className="font-semibold">₹{invoice.finalPrice.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Amount Paid:</p>
                            <p className="font-semibold text-green-600">₹{(invoice.totalPaid || 0).toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Amount Due:</p>
                            <p className={`font-semibold ${(invoice.remainingAmount || invoice.finalPrice) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              ₹{(invoice.remainingAmount || invoice.finalPrice).toFixed(2)}
                            </p>
                            {overdue && (
                              <div className="flex items-center space-x-1 mt-1">
                                <AlertTriangle className="h-3 w-3 text-red-500" />
                                <span className="text-xs text-red-600 font-bold">PAYMENT OVERDUE</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {/* Payment Count */}
                        {invoice.payments && invoice.payments.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-500">
                              {invoice.payments.length} payment{invoice.payments.length !== 1 ? 's' : ''} recorded
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Due: {new Date(invoice.dueDate).toLocaleDateString()}</span>
                        </div>
                        <div>
                          Last updated: {new Date(invoice.updatedAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      {/* Payment Actions */}
                      {(invoice.remainingAmount || invoice.finalPrice) > 0 && (
                        <button
                          onClick={() => setShowPaymentModal(invoice.id)}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-1"
                          title="Record Payment"
                        >
                          <CreditCard className="h-3 w-3" />
                          <span>Pay</span>
                        </button>
                      )}
                      
                      {invoice.payments && invoice.payments.length > 0 && (
                        <button
                          onClick={() => setShowPaymentHistory(invoice.id)}
                          className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center space-x-1"
                          title="View Payment History"
                        >
                          <CreditCard className="h-3 w-3" />
                          <span>History</span>
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedInvoice(invoice)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDownloadPDF(invoice)}
                        disabled={isGenerating}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Download PDF Invoice"
                      >
                        {isGenerating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </button>

                      {(invoice.status === 'Sent' || invoice.status === 'Overdue') && (
                        <div className="relative group">
                          <button className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200">
                            <Calendar className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                            <div className="p-2 space-y-1">
                              <button
                                onClick={() => handleStatusChange(invoice.id, 'Paid')}
                                className="block w-full text-left px-3 py-2 text-sm text-green-700 hover:bg-green-100 rounded"
                              >
                                Mark as Paid
                              </button>
                              <button
                                onClick={() => handleStatusChange(invoice.id, 'Cancelled')}
                                className="block w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-100 rounded"
                              >
                                Mark as Cancelled
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <button
                        onClick={() => handleDeleteInvoice(invoice.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        title="Delete Invoice"
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

      {/* Invoice Details Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Invoice Details - {selectedInvoice.invoiceNumber}
              </h2>
              <button
                onClick={() => setSelectedInvoice(null)}
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
                    <p className="font-medium">{selectedInvoice.customerName}</p>
                    {customersData.customers[selectedInvoice.customerId] && (
                      <>
                        <p className="text-gray-600">
                          {customersData.customers[selectedInvoice.customerId].contact_person}
                        </p>
                        <p className="text-gray-600">
                          {customersData.customers[selectedInvoice.customerId].email}
                        </p>
                      </>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Status:</span> {selectedInvoice.status}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Due Date:</span> {new Date(selectedInvoice.dueDate).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">From Quotation:</span> {selectedInvoice.quotationNumber}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parts List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Parts ({selectedInvoice.parts.length})</h3>
                <div className="space-y-3">
                  {selectedInvoice.parts.map((part, index) => (
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
                    <span>₹{selectedInvoice.totalBasePrice.toFixed(2)}</span>
                  </div>
                  {selectedInvoice.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount ({selectedInvoice.discount}%):</span>
                      <span>-₹{((selectedInvoice.totalBasePrice * selectedInvoice.discount) / 100).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>₹{(selectedInvoice.totalBasePrice - (selectedInvoice.totalBasePrice * selectedInvoice.discount) / 100).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST ({selectedInvoice.gstType}):</span>
                    <span>₹{selectedInvoice.totalGST.toFixed(2)}</span>
                  </div>
                  <div className="border-t border-indigo-200 pt-2 flex justify-between font-semibold text-lg">
                    <span>Final Price:</span>
                    <span className="text-indigo-600">₹{selectedInvoice.finalPrice.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {selectedInvoice.notes && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                  <p className="text-gray-600 text-sm">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Payment Information */}
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
                  <CreditCard className="h-4 w-4" />
                  <span>Payment Status</span>
                  {(selectedInvoice.remainingAmount || selectedInvoice.finalPrice) > 0 && (
                    <button
                      onClick={() => setShowPaymentModal(selectedInvoice.id)}
                      className="ml-auto px-3 py-1 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-1"
                    >
                      <CreditCard className="h-3 w-3" />
                      <span>Record Payment</span>
                    </button>
                  )}
                </h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Total Amount:</p>
                    <p className="font-semibold text-lg">₹{selectedInvoice.finalPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Amount Paid:</p>
                    <p className="font-semibold text-lg text-green-600">₹{(selectedInvoice.totalPaid || 0).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Amount Due:</p>
                    <p className={`font-semibold text-lg ${(selectedInvoice.remainingAmount || selectedInvoice.finalPrice) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      ₹{(selectedInvoice.remainingAmount || selectedInvoice.finalPrice).toFixed(2)}
                    </p>
                    {isOverdue(selectedInvoice.dueDate, selectedInvoice.status) && (
                      <div className="flex items-center space-x-1 mt-1">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <span className="text-sm text-red-600 font-medium">OVERDUE</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {selectedInvoice.payments && selectedInvoice.payments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-green-200">
                    <PaymentHistory 
                      payments={selectedInvoice.payments}
                      onDeletePayment={(paymentId) => handleRemovePayment(selectedInvoice.id, paymentId)}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          invoiceNumber={invoices[showPaymentModal].invoiceNumber}
          remainingAmount={invoices[showPaymentModal].remainingAmount}
          onSave={(payment) => handleAddPayment(showPaymentModal, payment)}
          onCancel={() => setShowPaymentModal(null)}
        />
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Payment History - {invoices[showPaymentHistory].invoiceNumber}
              </h2>
              <button
                onClick={() => setShowPaymentHistory(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              <PaymentHistory 
                payments={invoices[showPaymentHistory].payments}
                onDeletePayment={(paymentId) => handleRemovePayment(showPaymentHistory, paymentId)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoicesPage;