import React from 'react';
import { Users, Wrench, FileText, Database, Archive, Receipt, Package } from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'customers', label: 'Customers', icon: Users },
    { id: 'materials', label: 'Materials & Costing', icon: Wrench },
    { id: 'quotations', label: 'Create Quotation', icon: FileText },
    { id: 'saved-quotations', label: 'Saved Quotations', icon: Archive },
    { id: 'invoices', label: 'Invoices', icon: Receipt },
    { id: 'orders', label: 'Orders', icon: Package },
  ];

  return (
    <div className="w-64 bg-white shadow-lg border-r border-gray-200 h-full">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Database className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">3D Print Pro</h1>
            <p className="text-xs text-gray-600">Management Suite</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className={`h-5 w-5 ${activeTab === tab.id ? 'text-indigo-600' : 'text-gray-500'}`} />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default Navigation;