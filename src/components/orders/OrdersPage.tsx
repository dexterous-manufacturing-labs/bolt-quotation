import React, { useState } from 'react';
import { Search, Eye, Download, Truck, CheckCircle, Package, Filter, Calendar, Hash, User, AlertCircle } from 'lucide-react';
import { Order, CustomersData, OrderStatus } from '../../types';
import { useOrders } from '../../hooks/useOrders';
import { PDFGenerator } from '../../utils/pdfGenerator';

interface OrdersPageProps {
  customersData: CustomersData;
  technologiesData: any;
}

const OrdersPage: React.FC<OrdersPageProps> = ({ customersData, technologiesData }) => {
  const { orders, updateOrderStatus, deleteOrder } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isGeneratingJobWork, setIsGeneratingJobWork] = useState<string | null>(null);

  const ordersList = Object.values(orders);

  const filteredOrders = ordersList.filter(order => {
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customerId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handleStatusChange = (orderId: string, newStatus: OrderStatus) => {
    updateOrderStatus(orderId, newStatus);
  };

  const handleDeleteOrder = (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      deleteOrder(orderId);
    }
  };

  const handleGenerateJobWork = async (order: Order) => {
    setIsGeneratingJobWork(order.id);
    
    try {
      await PDFGenerator.generateJobWorkPDF(order, technologiesData);
      console.log('Job work PDF generated successfully for order:', order.orderNumber);
    } catch (error) {
      console.error('Error generating job work PDF:', error);
      alert('Failed to generate job work PDF. Please try again.');
    } finally {
      setIsGeneratingJobWork(null);
    }
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'New': return 'bg-blue-100 text-blue-800';
      case 'Produced': return 'bg-green-100 text-green-800';
      case 'Dispatched': return 'bg-purple-100 text-purple-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'New': return <Package className="h-4 w-4" />;
      case 'Produced': return <CheckCircle className="h-4 w-4" />;
      case 'Dispatched': return <Truck className="h-4 w-4" />;
      case 'Cancelled': return <AlertCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getCustomerName = (customerId: string) => {
    const customer = customersData.customers[customerId];
    return customer ? customer.company_name : `Customer ID: ${customerId}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
          <p className="text-gray-600">Manage production orders and job work</p>
        </div>
        <div className="text-sm text-gray-500">
          {ordersList.length} total orders
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
                placeholder="Search orders..."
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
                <option value="New">New</option>
                <option value="Produced">Produced</option>
                <option value="Dispatched">Dispatched</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No orders found</p>
            {searchTerm && (
              <p className="text-sm mt-1">Try adjusting your search criteria</p>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredOrders.map((order) => {
              const isGenerating = isGeneratingJobWork === order.id;
              
              return (
                <div key={order.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <Package className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {order.orderNumber}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Invoice: {order.invoiceNumber}
                          </p>
                          <p className="text-sm text-gray-600">
                            Created: {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 ${getStatusColor(order.status)}`}>
                            {getStatusIcon(order.status)}
                            <span>{order.status}</span>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{getCustomerName(order.customerId)}</p>
                            <p className="text-xs text-gray-500">Customer ID: {order.customerId}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Package className="h-4 w-4" />
                          <div>
                            <p className="font-medium">{order.parts.length} parts</p>
                            <p className="text-xs text-gray-500">
                              {order.parts.reduce((sum, part) => sum + part.quantity, 0)} total qty
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                          <Hash className="h-4 w-4" />
                          <div>
                            <p className="font-medium">Services: {order.serviceCharges.length}</p>
                            <p className="text-xs text-gray-500">
                              Additional services included
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>Last updated: {new Date(order.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                        title="View Details"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleGenerateJobWork(order)}
                        disabled={isGenerating}
                        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                        title="Export Job Work"
                      >
                        {isGenerating ? (
                          <div className="flex items-center space-x-2">
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                            <span>Generating...</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <Download className="h-3 w-3" />
                            <span>Job Work</span>
                          </div>
                        )}
                      </button>

                      {order.status === 'New' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'Produced')}
                          className="px-3 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors duration-200 flex items-center space-x-1"
                          title="Mark as Produced"
                        >
                          <CheckCircle className="h-3 w-3" />
                          <span>Produced</span>
                        </button>
                      )}

                      {order.status === 'Produced' && (
                        <button
                          onClick={() => handleStatusChange(order.id, 'Dispatched')}
                          className="px-3 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors duration-200 flex items-center space-x-1"
                          title="Mark as Dispatched"
                        >
                          <Truck className="h-3 w-3" />
                          <span>Dispatch</span>
                        </button>
                      )}

                      {(order.status === 'New' || order.status === 'Produced') && (
                        <div className="relative group">
                          <button className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200">
                            <AlertCircle className="h-4 w-4" />
                          </button>
                          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none group-hover:pointer-events-auto">
                            <div className="p-2">
                              <button
                                onClick={() => handleStatusChange(order.id, 'Cancelled')}
                                className="block w-full text-left px-3 py-2 text-sm text-red-700 hover:bg-red-100 rounded"
                              >
                                Cancel Order
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Order Details - {selectedOrder.orderNumber}
              </h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Order Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="font-medium">Order Number: {selectedOrder.orderNumber}</p>
                    <p className="text-gray-600">Invoice: {selectedOrder.invoiceNumber}</p>
                    <p className="text-gray-600">Customer ID: {selectedOrder.customerId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">
                      <span className="font-medium">Status:</span> {selectedOrder.status}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Created:</span> {new Date(selectedOrder.createdAt).toLocaleDateString()}
                    </p>
                    <p className="text-gray-600">
                      <span className="font-medium">Updated:</span> {new Date(selectedOrder.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Parts List */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Parts ({selectedOrder.parts.length})</h3>
                <div className="space-y-3">
                  {selectedOrder.parts.map((part, index) => (
                    <div key={part.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start">
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
                          {part.comments && (
                            <p className="text-sm text-blue-600 mt-1">
                              <span className="font-medium">Notes:</span> {part.comments}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Service Charges */}
              {selectedOrder.serviceCharges.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Additional Services ({selectedOrder.serviceCharges.length})</h3>
                  <div className="space-y-2">
                    {selectedOrder.serviceCharges.map((charge, index) => (
                      <div key={charge.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-700">{charge.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;