import React, { useState } from 'react';
import { Settings, Trash2, CheckSquare, Square } from 'lucide-react';
import { QuotationPart, TechnologiesData, Customer } from '../../types';

interface BulkActionsProps {
  parts: QuotationPart[];
  selectedParts: QuotationPart[];
  technologiesData: TechnologiesData;
  customer: Customer | null;
  onUpdateParts: (partIds: string[], updates: Partial<QuotationPart>) => void;
  onDeleteAllParts: () => void;
  onToggleSelectAll: () => void;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  parts,
  selectedParts,
  technologiesData,
  customer,
  onUpdateParts,
  onDeleteAllParts,
  onToggleSelectAll
}) => {
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [bulkTechnology, setBulkTechnology] = useState('');
  const [bulkMaterial, setBulkMaterial] = useState('');
  const [bulkQuantity, setBulkQuantity] = useState<number | ''>('');

  const technologies = Object.entries(technologiesData.technologies);
  const selectedTechnology = bulkTechnology ? technologiesData.technologies[bulkTechnology] : null;
  const availableMaterials = selectedTechnology ? Object.entries(selectedTechnology.materials) : [];

  const allSelected = parts.length > 0 && selectedParts.length === parts.length;
  const someSelected = selectedParts.length > 0 && selectedParts.length < parts.length;

  const handleBulkTechnologyChange = (techId: string) => {
    setBulkTechnology(techId);
    setBulkMaterial(''); // Reset material when technology changes
  };

  const handleApplyBulkChanges = () => {
    if (selectedParts.length === 0) {
      console.log('No parts selected for bulk update');
      return;
    }

    const selectedPartIds = selectedParts.map(part => part.id);
    console.log('Applying bulk changes to parts:', selectedPartIds);
    console.log('Selected technology:', bulkTechnology);
    console.log('Selected material:', bulkMaterial);
    console.log('Selected quantity:', bulkQuantity);

    let updates: Partial<QuotationPart> = {};

    if (bulkTechnology) {
      updates.technology = bulkTechnology;
      
      // Reset material-related fields when changing technology
      if (!bulkMaterial) {
        updates.material = undefined;
        updates.unitPrice = 0;
        updates.totalPrice = 0;
        updates.gstAmount = 0;
        updates.finalPrice = 0;
      }

      // If material is also selected, include it in updates
      if (bulkMaterial) {
        updates.material = bulkMaterial;
        // Price calculations will be handled in the parent component
      }
    }

    // Add quantity to bulk updates if specified
    if (bulkQuantity !== '' && bulkQuantity > 0) {
      updates.quantity = bulkQuantity;
    }

    console.log('Updates to apply:', updates);
    onUpdateParts(selectedPartIds, updates);
    
    // Reset form
    setShowBulkEdit(false);
    setBulkTechnology('');
    setBulkMaterial('');
    setBulkQuantity('');
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all parts? This action cannot be undone.')) {
      onDeleteAllParts();
    }
  };

  const handleToggleSelectAll = () => {
    console.log('Toggle select all clicked');
    console.log('Current state - All selected:', allSelected, 'Parts count:', parts.length, 'Selected count:', selectedParts.length);
    onToggleSelectAll();
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors duration-200"
          >
            {allSelected ? (
              <CheckSquare className="h-4 w-4 text-indigo-600" />
            ) : someSelected ? (
              <div className="h-4 w-4 border border-gray-400 bg-indigo-100 rounded flex items-center justify-center">
                <div className="h-2 w-2 bg-indigo-600 rounded-sm"></div>
              </div>
            ) : (
              <Square className="h-4 w-4" />
            )}
            <span>
              {allSelected ? 'Deselect All' : 'Select All'} 
              {selectedParts.length > 0 && ` (${selectedParts.length} selected)`}
            </span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          {selectedParts.length > 0 && (
            <button
              type="button"
              onClick={() => setShowBulkEdit(!showBulkEdit)}
              className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Settings className="h-4 w-4" />
              <span>Bulk Edit ({selectedParts.length})</span>
            </button>
          )}
          
          {parts.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteAll}
              className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200 flex items-center space-x-2"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete All</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Edit Panel */}
      {showBulkEdit && selectedParts.length > 0 && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Bulk Edit {selectedParts.length} Selected Parts
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Technology</label>
              <select
                value={bulkTechnology}
                onChange={(e) => handleBulkTechnologyChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select Technology</option>
                {technologies.map(([techId, tech]) => (
                  <option key={techId} value={techId}>{tech.name}</option>
                ))}
              </select>
            </div>

            {bulkTechnology && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                <select
                  value={bulkMaterial}
                  onChange={(e) => setBulkMaterial(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select Material (Optional)</option>
                  {availableMaterials.map(([materialId, material]) => (
                    <option key={materialId} value={materialId}>
                      {material.name} - ₹{material.cost_per_cc.toFixed(2)}/cm³
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
              <input
                type="number"
                min="1"
                value={bulkQuantity}
                onChange={(e) => setBulkQuantity(e.target.value ? parseInt(e.target.value) : '')}
                placeholder="Leave empty to keep current"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              onClick={() => setShowBulkEdit(false)}
              className="px-3 py-2 text-gray-600 hover:text-gray-800 transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApplyBulkChanges}
              disabled={!bulkTechnology && bulkQuantity === ''}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Apply Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkActions;