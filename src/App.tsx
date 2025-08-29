import React, { useState } from 'react';
import Navigation from './components/Navigation';
import CustomerList from './components/customers/CustomerList';
import CustomerForm from './components/customers/CustomerForm';
import MaterialList from './components/materials/MaterialList';
import MaterialForm from './components/materials/MaterialForm';
import QuotationPage from './components/quotations/QuotationPage';
import SavedQuotationsPage from './components/quotations/SavedQuotationsPage';
import InvoicesPage from './components/invoices/InvoicesPage';
import OrdersPage from './components/orders/OrdersPage';
import { useLocalStorage } from './hooks/useLocalStorage';
import { CustomersData, TechnologiesData, Customer, Material } from './types';

// Import initial data
import initialCustomersData from './data/customers.json';
import initialTechnologiesData from './data/technologies.json';

function App() {
  const [activeTab, setActiveTab] = useState('quotations');
  
  // Local storage hooks for data persistence
  const [customersData, setCustomersData] = useLocalStorage<CustomersData>('customers', initialCustomersData);
  const [technologiesData, setTechnologiesData] = useLocalStorage<TechnologiesData>('technologies', initialTechnologiesData);
  
  // Form states
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<{ id: string; data: Customer } | null>(null);
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<{ 
    techId: string; 
    materialId: string; 
    data: Material;
    techName: string;
  } | null>(null);

  // Customer CRUD operations
  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setShowCustomerForm(true);
  };

  const handleEditCustomer = (customerId: string) => {
    setEditingCustomer({ id: customerId, data: customersData.customers[customerId] });
    setShowCustomerForm(true);
  };

  const handleDeleteCustomer = (customerId: string) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      const updatedCustomers = { ...customersData.customers };
      delete updatedCustomers[customerId];
      setCustomersData({
        ...customersData,
        customers: updatedCustomers,
        last_updated: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleSaveCustomer = (customer: Customer, customerId?: string) => {
    const id = customerId || customersData.next_customer_id;
    const updatedCustomers = {
      ...customersData.customers,
      [id]: customer
    };

    // Generate next customer ID if adding new customer
    let nextId = customersData.next_customer_id;
    if (!customerId) {
      const currentNum = parseInt(nextId.replace('CUST', ''));
      nextId = `CUST${String(currentNum + 1).padStart(3, '0')}`;
    }

    setCustomersData({
      customers: updatedCustomers,
      last_updated: new Date().toISOString().split('T')[0],
      next_customer_id: nextId
    });

    setShowCustomerForm(false);
    setEditingCustomer(null);
  };

  // Handle customer added from quotation page
  const handleCustomerAddedFromQuotation = (customer: Customer, customerId: string) => {
    // Call handleSaveCustomer with the correct parameter order
    handleSaveCustomer(customer, customerId);
  };

  // Material CRUD operations
  const handleAddMaterial = (techId: string) => {
    setEditingMaterial(null);
    setShowMaterialForm(true);
    // Store the technology ID for the form
    setEditingMaterial({ 
      techId, 
      materialId: '', 
      data: { name: '', cost_per_cc: 0, properties: [], colors: [] },
      techName: technologiesData.technologies[techId].name
    });
  };

  const handleEditMaterial = (techId: string, materialId: string) => {
    setEditingMaterial({
      techId,
      materialId,
      data: technologiesData.technologies[techId].materials[materialId],
      techName: technologiesData.technologies[techId].name
    });
    setShowMaterialForm(true);
  };

  const handleDeleteMaterial = (techId: string, materialId: string) => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      const updatedTechnologies = { ...technologiesData.technologies };
      const updatedMaterials = { ...updatedTechnologies[techId].materials };
      delete updatedMaterials[materialId];
      updatedTechnologies[techId] = {
        ...updatedTechnologies[techId],
        materials: updatedMaterials
      };

      setTechnologiesData({
        ...technologiesData,
        technologies: updatedTechnologies,
        last_updated: new Date().toISOString().split('T')[0]
      });
    }
  };

  const handleSaveMaterial = (material: Material, materialId?: string) => {
    if (!editingMaterial) return;

    const { techId } = editingMaterial;
    const id = materialId || generateMaterialId(material.name);
    
    const updatedTechnologies = { ...technologiesData.technologies };
    updatedTechnologies[techId] = {
      ...updatedTechnologies[techId],
      materials: {
        ...updatedTechnologies[techId].materials,
        [id]: material
      }
    };

    setTechnologiesData({
      ...technologiesData,
      technologies: updatedTechnologies,
      last_updated: new Date().toISOString().split('T')[0]
    });

    setShowMaterialForm(false);
    setEditingMaterial(null);
  };

  const generateMaterialId = (name: string): string => {
    return name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '').toUpperCase();
  };

  const handleCancelForm = () => {
    setShowCustomerForm(false);
    setShowMaterialForm(false);
    setEditingCustomer(null);
    setEditingMaterial(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-1 p-8">
        {activeTab === 'customers' && (
          <CustomerList
            customers={customersData.customers}
            onEdit={handleEditCustomer}
            onDelete={handleDeleteCustomer}
            onAdd={handleAddCustomer}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialList
            technologiesData={technologiesData}
            onEditMaterial={handleEditMaterial}
            onDeleteMaterial={handleDeleteMaterial}
            onAddMaterial={handleAddMaterial}
          />
        )}

        {activeTab === 'quotations' && (
          <QuotationPage
            customersData={customersData}
            technologiesData={technologiesData}
            onCustomerAdded={handleCustomerAddedFromQuotation}
          />
        )}

        {activeTab === 'saved-quotations' && (
          <SavedQuotationsPage
            customersData={customersData}
            technologiesData={technologiesData}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoicesPage
            customersData={customersData}
            technologiesData={technologiesData}
          />
        )}

        {activeTab === 'orders' && (
          <OrdersPage
            customersData={customersData}
            technologiesData={technologiesData}
          />
        )}
      </div>

      {/* Customer Form Modal */}
      {showCustomerForm && (
        <CustomerForm
          customer={editingCustomer?.data}
          customerId={editingCustomer?.id}
          onSave={handleSaveCustomer}
          onCancel={handleCancelForm}
        />
      )}

      {/* Material Form Modal */}
      {showMaterialForm && editingMaterial && (
        <MaterialForm
          material={editingMaterial.materialId ? editingMaterial.data : undefined}
          materialId={editingMaterial.materialId || undefined}
          technologyName={editingMaterial.techName}
          onSave={handleSaveMaterial}
          onCancel={handleCancelForm}
        />
      )}
    </div>
  );
}

export default App;