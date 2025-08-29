import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { Customer } from '../../types';

interface CustomerFormProps {
  customer?: Customer;
  customerId?: string;
  onSave: (customer: Customer, customerId?: string) => void;
  onCancel: () => void;
}

const CustomerForm: React.FC<CustomerFormProps> = ({ customer, customerId, onSave, onCancel }) => {
  const [formData, setFormData] = useState<Customer>({
    company_name: '',
    gstn: '',
    contact_person: '',
    email: '',
    phone: '',
    billing_address: {
      street: '',
      city: '',
      state: '',
      pin: '',
      country: 'India'
    },
    shipping_address: {
      street: '',
      city: '',
      state: '',
      pin: '',
      country: 'India'
    },
    customer_type: 'Business',
    discount_rate: 0,
    payment_terms: '100% advance', // Set as default
    preferred_technologies: [],
    total_orders: 0,
    total_spent: 0,
    status: 'Active',
    notes: ''
  });

  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [skipBillingAddress, setSkipBillingAddress] = useState(false);
  const [skipShippingAddress, setSkipShippingAddress] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData(customer);
      setSameAsBilling(
        JSON.stringify(customer.billing_address) === JSON.stringify(customer.shipping_address)
      );
      
      // Check if billing address is empty (all fields are empty strings)
      const billingEmpty = !customer.billing_address.street && 
                          !customer.billing_address.city && 
                          !customer.billing_address.state && 
                          !customer.billing_address.pin;
      setSkipBillingAddress(billingEmpty);
      
      // Check if shipping address is empty
      const shippingEmpty = !customer.shipping_address.street && 
                           !customer.shipping_address.city && 
                           !customer.shipping_address.state && 
                           !customer.shipping_address.pin;
      setSkipShippingAddress(shippingEmpty);
    }
  }, [customer]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddressChange = (type: 'billing_address' | 'shipping_address', field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [type]: { ...prev[type], [field]: value }
    }));

    if (type === 'billing_address' && sameAsBilling && !skipShippingAddress) {
      setFormData(prev => ({
        ...prev,
        shipping_address: { ...prev.billing_address, [field]: value }
      }));
    }
  };

  const handleSameAsBillingChange = (checked: boolean) => {
    setSameAsBilling(checked);
    if (checked && !skipBillingAddress && !skipShippingAddress) {
      setFormData(prev => ({
        ...prev,
        shipping_address: { ...prev.billing_address }
      }));
    }
  };

  const handleSkipBillingAddressChange = (checked: boolean) => {
    setSkipBillingAddress(checked);
    if (checked) {
      // Clear billing address when skipping
      setFormData(prev => ({
        ...prev,
        billing_address: {
          street: '',
          city: '',
          state: '',
          pin: '',
          country: 'India'
        }
      }));
      setSameAsBilling(false);
    }
  };

  const handleSkipShippingAddressChange = (checked: boolean) => {
    setSkipShippingAddress(checked);
    if (checked) {
      // Clear shipping address when skipping
      setFormData(prev => ({
        ...prev,
        shipping_address: {
          street: '',
          city: '',
          state: '',
          pin: '',
          country: 'India'
        }
      }));
      setSameAsBilling(false);
    }
  };

  const handleTechnologyToggle = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_technologies: prev.preferred_technologies.includes(tech)
        ? prev.preferred_technologies.filter(t => t !== tech)
        : [...prev.preferred_technologies, tech]
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.contact_person.trim()) {
      alert('Contact Person is required');
      return;
    }
    
    if (!formData.phone.trim()) {
      alert('Phone number is required');
      return;
    }
    
    // No address validation required anymore - both are optional
    
    onSave(formData, customerId);
  };

  const technologies = ['FDM', 'SLA', 'SLS', 'MJF'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
                <span className="text-gray-500 text-xs ml-1">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.company_name}
                onChange={(e) => handleInputChange('company_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter company name (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GSTN</label>
              <input
                type="text"
                value={formData.gstn || ''}
                onChange={(e) => handleInputChange('gstn', e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter GSTN (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person *</label>
              <input
                type="text"
                required
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter contact person name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
                <span className="text-gray-500 text-xs ml-1">(Optional)</span>
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter email address (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Type</label>
              <select
                value={formData.customer_type}
                onChange={(e) => handleInputChange('customer_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Business">Business</option>
                <option value="Individual">Individual</option>
              </select>
            </div>
          </div>

          {/* Billing Address - Optional */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                Billing Address
                <span className="text-gray-500 text-sm ml-2">(Optional)</span>
              </h3>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={skipBillingAddress}
                  onChange={(e) => handleSkipBillingAddressChange(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">Skip billing address</span>
              </label>
            </div>
            
            {!skipBillingAddress && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={formData.billing_address.street}
                    onChange={(e) => handleAddressChange('billing_address', 'street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.billing_address.city}
                    onChange={(e) => handleAddressChange('billing_address', 'city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.billing_address.state}
                    onChange={(e) => handleAddressChange('billing_address', 'state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={formData.billing_address.pin}
                    onChange={(e) => handleAddressChange('billing_address', 'pin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter PIN code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.billing_address.country}
                    onChange={(e) => handleAddressChange('billing_address', 'country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter country"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Shipping Address - Now Optional */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-medium text-gray-900">
                Shipping Address
                <span className="text-gray-500 text-sm ml-2">(Optional)</span>
              </h3>
              <div className="flex items-center space-x-4">
                {!skipBillingAddress && !skipShippingAddress && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => handleSameAsBillingChange(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">Same as billing address</span>
                  </label>
                )}
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={skipShippingAddress}
                    onChange={(e) => handleSkipShippingAddressChange(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">Skip shipping address</span>
                </label>
              </div>
            </div>
            
            {!skipShippingAddress && (!sameAsBilling || skipBillingAddress) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Street Address</label>
                  <input
                    type="text"
                    value={formData.shipping_address.street}
                    onChange={(e) => handleAddressChange('shipping_address', 'street', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter street address"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.shipping_address.city}
                    onChange={(e) => handleAddressChange('shipping_address', 'city', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter city"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.shipping_address.state}
                    onChange={(e) => handleAddressChange('shipping_address', 'state', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter state"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={formData.shipping_address.pin}
                    onChange={(e) => handleAddressChange('shipping_address', 'pin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter PIN code"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.shipping_address.country}
                    onChange={(e) => handleAddressChange('shipping_address', 'country', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Enter country"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Business Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Rate (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={formData.discount_rate * 100}
                onChange={(e) => handleInputChange('discount_rate', parseFloat(e.target.value) / 100)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Terms</label>
              <select
                value={formData.payment_terms}
                onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="100% advance">100% advance</option>
                <option value="60% advance and rest upon delivery">60% advance and rest upon delivery</option>
                <option value="Payment on delivery">Payment on delivery</option>
                <option value="Net 15">Net 15</option>
                <option value="Net 30">Net 30</option>
                <option value="Net 45">Net 45</option>
                <option value="Net 60">Net 60</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Preferred Technologies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Technologies</label>
            <div className="flex flex-wrap gap-2">
              {technologies.map(tech => (
                <label key={tech} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.preferred_technologies.includes(tech)}
                    onChange={() => handleTechnologyToggle(tech)}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-sm text-gray-700">{tech}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Additional notes about the customer..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>{customer ? 'Update Customer' : 'Add Customer'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CustomerForm;