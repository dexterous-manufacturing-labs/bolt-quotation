import React, { useState } from 'react';
import { Trash2, Package, Ruler, Calculator } from 'lucide-react';
import { QuotationPart, TechnologiesData, Customer } from '../../types';
import { calculateGST, formatGSTBreakdown } from '../../utils/gstCalculator';

interface PartCardProps {
  part: QuotationPart;
  technologiesData: TechnologiesData;
  customer: Customer | null;
  onUpdatePart: (partId: string, updates: Partial<QuotationPart>) => void;
  onDeletePart: (partId: string) => void;
  onToggleSelect: (partId: string) => void;
  selectedParts: QuotationPart[];
  onBulkUpdate?: (partIds: string[], updates: Partial<QuotationPart>) => void;
}

const PartCard: React.FC<PartCardProps> = ({
  part,
  technologiesData,
  customer,
  onUpdatePart,
  onDeletePart,
  onToggleSelect,
  selectedParts,
  onBulkUpdate
}) => {
  const technologies = Object.entries(technologiesData.technologies);
  const selectedTechnology = part.technology ? technologiesData.technologies[part.technology] : null;
  const availableMaterials = selectedTechnology ? Object.entries(selectedTechnology.materials) : [];
  const selectedMaterial = part.technology && part.material ? 
    technologiesData.technologies[part.technology].materials[part.material] : null;

  const isPartSelected = part.selected || false;
  const hasMultipleSelected = selectedParts.length > 1;

  const handleTechnologyChange = (techId: string) => {
    console.log('Technology change for part:', part.id, 'to:', techId);
    
    if (hasMultipleSelected && isPartSelected && onBulkUpdate) {
      // If this part is selected and there are multiple selections, apply to all selected
      const selectedPartIds = selectedParts.map(p => p.id);
      console.log('Applying technology change to multiple parts:', selectedPartIds);
      
      const updates: Partial<QuotationPart> = {
        technology: techId,
        material: undefined, // Reset material when technology changes
        unitPrice: 0,
        totalPrice: 0,
        gstAmount: 0,
        finalPrice: 0
      };
      onBulkUpdate(selectedPartIds, updates);
    } else {
      // Single part update
      const updates: Partial<QuotationPart> = {
        technology: techId,
        material: undefined, // Reset material when technology changes
        unitPrice: 0,
        totalPrice: 0,
        gstAmount: 0,
        finalPrice: 0
      };
      onUpdatePart(part.id, updates);
    }
  };

  const handleMaterialChange = (materialId: string) => {
    console.log('Material change for part:', part.id, 'to:', materialId);
    
    if (!part.technology || !customer) return;
    
    if (hasMultipleSelected && isPartSelected && onBulkUpdate) {
      // If this part is selected and there are multiple selections, apply to all selected
      const selectedPartIds = selectedParts.map(p => p.id);
      console.log('Applying material change to multiple parts:', selectedPartIds);
      
      // For bulk material update, we need to calculate pricing for each part individually
      // This will be handled in the parent component
      const updates: Partial<QuotationPart> = {
        material: materialId
      };
      onBulkUpdate(selectedPartIds, updates);
    } else {
      // Single part update
      const material = technologiesData.technologies[part.technology].materials[materialId];
      const unitPrice = part.volume * material.cost_per_cc;
      const totalPrice = unitPrice * part.quantity;
      
      // Calculate GST
      const gstCalculation = calculateGST(totalPrice, customer);
      const finalPrice = totalPrice + gstCalculation.total;
      
      const updates: Partial<QuotationPart> = {
        material: materialId,
        unitPrice,
        totalPrice,
        gstAmount: gstCalculation.total,
        finalPrice
      };
      onUpdatePart(part.id, updates);
    }
  };

  const handleQuantityChange = (quantity: number) => {
    console.log('Quantity change for part:', part.id, 'to:', quantity);
    
    if (hasMultipleSelected && isPartSelected && onBulkUpdate) {
      // If this part is selected and there are multiple selections, apply to all selected
      const selectedPartIds = selectedParts.map(p => p.id);
      console.log('Applying quantity change to multiple parts:', selectedPartIds);
      
      const updates: Partial<QuotationPart> = {
        quantity
      };
      onBulkUpdate(selectedPartIds, updates);
    } else {
      // Single part update
      const totalPrice = part.unitPrice * quantity;
      let gstAmount = 0;
      let finalPrice = totalPrice;
      
      if (customer && totalPrice > 0) {
        const gstCalculation = calculateGST(totalPrice, customer);
        gstAmount = gstCalculation.total;
        finalPrice = totalPrice + gstAmount;
      }
      
      const updates: Partial<QuotationPart> = {
        quantity,
        totalPrice,
        gstAmount,
        finalPrice
      };
      onUpdatePart(part.id, updates);
    }
  };

  const handleDeleteClick = () => {
    if (hasMultipleSelected && isPartSelected) {
      // If multiple parts are selected and this part is one of them, show confirmation
      const selectedPartIds = selectedParts.map(p => p.id);
      if (window.confirm(`Are you sure you want to delete ${selectedPartIds.length} selected parts?`)) {
        selectedPartIds.forEach(partId => onDeletePart(partId));
      }
    } else {
      // Single part deletion
      if (window.confirm('Are you sure you want to delete this part?')) {
        onDeletePart(part.id);
      }
    }
  };

  const gstBreakdown = customer && part.totalPrice > 0 ? 
    calculateGST(part.totalPrice, customer) : null;

  return (
    <div className={`bg-white border rounded-lg p-6 hover:shadow-md transition-all duration-200 ${
      part.selected ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200' : 'border-gray-200'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-4">
          <input
            type="checkbox"
            checked={part.selected || false}
            onChange={() => onToggleSelect(part.id)}
            className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <div className="bg-gray-100 px-2 py-1 rounded text-xs font-medium text-gray-600">
            #{part.serialNumber}
          </div>
          
          {/* File Icon */}
          <div className="bg-indigo-100 p-3 rounded-lg">
            <Package className="h-8 w-8 text-indigo-600" />
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">{part.fileName}</h3>
            <p className="text-sm text-gray-500">
              {part.fileType === 'manual' ? 'Manual Entry' : `${part.fileType.toUpperCase()} File`}
            </p>
            {hasMultipleSelected && isPartSelected && (
              <p className="text-xs text-indigo-600 font-medium">
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
        <button
          type="button"
          onClick={handleDeleteClick}
          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          title={hasMultipleSelected && isPartSelected ? `Delete ${selectedParts.length} selected parts` : 'Delete this part'}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Part Specifications */}
      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Calculator className="h-4 w-4 text-gray-500" />
          <div>
            <p className="text-xs text-gray-500">Volume</p>
            <p className="text-sm font-medium">{part.volume.toFixed(2)} cm³</p>
          </div>
        </div>
        {part.boundingBox ? (
          <div className="flex items-center space-x-2">
            <Ruler className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Bounding Box</p>
              <p className="text-sm font-medium">
                {part.boundingBox.x.toFixed(1)} × {part.boundingBox.y.toFixed(1)} × {part.boundingBox.z.toFixed(1)} mm
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <Package className="h-4 w-4 text-gray-500" />
            <div>
              <p className="text-xs text-gray-500">Entry Type</p>
              <p className="text-sm font-medium">Manual Entry</p>
            </div>
          </div>
        )}
      </div>

      {/* Technology Selection */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Technology
            {hasMultipleSelected && isPartSelected && (
              <span className="text-xs text-indigo-600 ml-1">(affects {selectedParts.length} parts)</span>
            )}
          </label>
          <select
            value={part.technology || ''}
            onChange={(e) => handleTechnologyChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select Technology</option>
            {technologies.map(([techId, tech]) => (
              <option key={techId} value={techId}>{tech.name}</option>
            ))}
          </select>
        </div>

        {/* Material Selection */}
        {part.technology && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Material
              {hasMultipleSelected && isPartSelected && (
                <span className="text-xs text-indigo-600 ml-1">(affects {selectedParts.length} parts)</span>
              )}
            </label>
            <select
              value={part.material || ''}
              onChange={(e) => handleMaterialChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Select Material</option>
              {availableMaterials.map(([materialId, material]) => (
                <option key={materialId} value={materialId}>
                  {material.name} - ₹{material.cost_per_cc.toFixed(2)}/cm³
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Comments Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Comments
            <span className="text-gray-500 text-xs ml-1">(Optional)</span>
          </label>
          <textarea
            value={part.comments || ''}
            onChange={(e) => onUpdatePart(part.id, { comments: e.target.value })}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="Add specific requirements, painting color, heat inserts, etc..."
          />
          <p className="text-xs text-gray-500 mt-1">
            These comments will appear on the quotation and invoice PDFs
          </p>
        </div>
        {/* Quantity */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Quantity
            {hasMultipleSelected && isPartSelected && (
              <span className="text-xs text-indigo-600 ml-1">(affects {selectedParts.length} parts)</span>
            )}
          </label>
          <input
            type="number"
            min="1"
            value={part.quantity}
            onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Pricing */}
        {selectedMaterial && (
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 mb-3">
              <div>
                <p className="text-sm text-indigo-700">Unit Price</p>
                <p className="text-lg font-semibold text-indigo-900">
                  ₹{part.unitPrice.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-indigo-700">Base Total</p>
                <p className="text-lg font-semibold text-indigo-900">
                  ₹{part.totalPrice.toFixed(2)}
                </p>
              </div>
            </div>
            
            {gstBreakdown && (
              <div className="border-t border-indigo-200 pt-3">
                <div className="grid grid-cols-2 gap-4 mb-2">
                  <div>
                    <p className="text-sm text-indigo-700">GST (18%)</p>
                    <p className="text-sm font-medium text-indigo-800">
                      ₹{part.gstAmount.toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-indigo-700">Final Price</p>
                    <p className="text-lg font-bold text-indigo-900">
                      ₹{part.finalPrice.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="text-xs text-indigo-600">
                  {formatGSTBreakdown(gstBreakdown)}
                </p>
              </div>
            )}
            
            <div className="mt-2 text-xs text-indigo-600">
              {part.volume.toFixed(2)} cm³ × ₹{selectedMaterial.cost_per_cc.toFixed(2)}/cm³ × {part.quantity} qty
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PartCard;