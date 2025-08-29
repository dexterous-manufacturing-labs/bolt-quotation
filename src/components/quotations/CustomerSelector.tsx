import React, { useState } from 'react';
import { Search, Building, User, Check, X, Plus } from 'lucide-react';
import { Customer } from '../../types';

interface CustomerSelectorProps {
  customers: Record<string, Customer>;
  selectedCustomerId: string | null;
  onSelectCustomer: (customerId: string) => void;
  onAddNewCustomer?: () => void;
}

const CustomerSelector: React.FC<CustomerSelectorProps> = ({
  customers,
  selectedCustomerId,
  onSelectCustomer,
  onAddNewCustomer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredCustomers = Object.entries(customers).filter(([_, customer]) =>
    customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.contact_person.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedCustomer = selectedCustomerId ? customers[selectedCustomerId] : null;

  const handleSelectCustomer = (customerId: string) => {
    onSelectCustomer(customerId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClearSelection = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onSelectCustomer('');
    setIsOpen(false);
  };

  const handleToggleDropdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(!isOpen);
  };

  const handleDropdownClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const handleAddNewCustomer = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsOpen(false);
    if (onAddNewCustomer) {
      onAddNewCustomer();
    }
  };

  return (
    <div className="relative z-50" onClick={handleDropdownClick}>
      <div className="mb-2">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Customer *
        </label>
      </div>
      
      {selectedCustomer ? (
        <div 
          className="bg-white border border-gray-300 rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
          onClick={handleToggleDropdown}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg ${selectedCustomer.customer_type === 'Business' ? 'bg-blue-100' : 'bg-green-100'}`}>
                {selectedCustomer.customer_type === 'Business' ? (
                  <Building className="h-4 w-4 text-blue-600" />
                ) : (
                  <User className="h-4 w-4 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{selectedCustomer.company_name}</h3>
                <p className="text-sm text-gray-600">{selectedCustomer.contact_person}</p>
                <p className="text-sm text-gray-500">{selectedCustomer.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Delivery: {selectedCustomer.shipping_address.city}, {selectedCustomer.shipping_address.state}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Check className="h-5 w-5 text-green-600" />
              <button
                onClick={handleClearSelection}
                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors duration-200"
                title="Clear selection"
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleToggleDropdown}
          className="w-full bg-white border border-gray-300 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors duration-200"
        >
          <div className="flex items-center space-x-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <User className="h-4 w-4 text-gray-400" />
            </div>
            <span className="text-gray-500">Click to select a customer</span>
          </div>
        </button>
      )}

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-96 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                autoFocus
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>

          {/* Add New Customer Button */}
          {onAddNewCustomer && (
            <div className="p-3 border-b border-gray-200 bg-indigo-50">
              <button
                type="button"
                onClick={handleAddNewCustomer}
                className="w-full flex items-center space-x-3 p-3 text-left hover:bg-indigo-100 transition-colors duration-200 rounded-lg border-2 border-dashed border-indigo-300"
              >
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Plus className="h-4 w-4 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-medium text-indigo-900">Add New Customer</h4>
                  <p className="text-sm text-indigo-700">Create a new customer profile</p>
                </div>
              </button>
            </div>
          )}
          
          <div className="max-h-64 overflow-y-auto">
            {filteredCustomers.map(([customerId, customer]) => (
              <button
                key={customerId}
                type="button"
                onClick={() => handleSelectCustomer(customerId)}
                className="w-full p-3 text-left hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${customer.customer_type === 'Business' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    {customer.customer_type === 'Business' ? (
                      <Building className="h-4 w-4 text-blue-600" />
                    ) : (
                      <User className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{customer.company_name}</h4>
                    <p className="text-sm text-gray-600">{customer.contact_person}</p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                    <p className="text-xs text-gray-500">
                      {customer.shipping_address.city}, {customer.shipping_address.state}
                    </p>
                  </div>
                  {customerId === selectedCustomerId && (
                    <Check className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {filteredCustomers.length === 0 && !searchTerm && (
            <div className="p-4 text-center text-gray-500">
              No customers found
            </div>
          )}

          {filteredCustomers.length === 0 && searchTerm && (
            <div className="p-4 text-center text-gray-500">
              <p>No customers found matching "{searchTerm}"</p>
              {onAddNewCustomer && (
                <button
                  type="button"
                  onClick={handleAddNewCustomer}
                  className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                >
                  Add "{searchTerm}" as new customer
                </button>
              )}
            </div>
          )}
          
          <div className="p-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerSelector;