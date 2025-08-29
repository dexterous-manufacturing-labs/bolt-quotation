import React, { useState } from 'react';
import { X, Save, Package } from 'lucide-react';
import { QuotationPart, TechnologiesData, Customer } from '../../types';
import { calculateGST } from '../../utils/gstCalculator';

interface ManualPartFormProps {
  technologiesData: TechnologiesData;
  customer: Customer | null;
  onSave: (part: QuotationPart) => void;
  onCancel: () => void;
  nextSerialNumber: number;
}

const ManualPartForm: React.FC<ManualPartFormProps> = ({
  technologiesData,
  customer,
  onSave,
  onCancel,
  nextSerialNumber
}) => {
  const [formData, setFormData] = useState({
    partName: '',
    volume: '',
    quantity: 1,
    technology: '',
    material: '',
    comments: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const technologies = Object.entries(technologiesData.technologies);
  const selectedTechnology = formData.technology ? technologiesData.technologies[formData.technology] : null;
  const availableMaterials = selectedTechnology ? Object.entries(selectedTechnology.materials) : [];
  const selectedMaterial = formData.technology && formData.material ? 
    technologiesData.technologies[formData.technology].materials[formData.material] : null;

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Reset material when technology changes
    if (field === 'technology') {
      setFormData(prev => ({ ...prev, material: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.partName.trim()) {
      newErrors.partName = 'Part name is required';
    }

    if (!formData.volume || parseFloat(formData.volume) <= 0) {
      newErrors.volume = 'Volume must be greater than 0';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (!formData.technology) {
      newErrors.technology = 'Technology is required';
    }

    if (!formData.material) {
      newErrors.material = 'Material is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !customer || !selectedMaterial) {
      return;
    }

    console.log('Manual part form data:', {
      technology: formData.technology,
      material: formData.material,
      selectedMaterial: selectedMaterial
    });
    const volume = parseFloat(formData.volume);
    const unitPrice = volume * selectedMaterial.cost_per_cc;
    const totalPrice = unitPrice * formData.quantity;
    
    // Calculate GST
    const gstCalculation = calculateGST(totalPrice, customer);
    const finalPrice = totalPrice + gstCalculation.total;

    const newPart: QuotationPart = {
      id: `manual_part_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      serialNumber: nextSerialNumber,
      fileName: formData.partName,
      fileType: 'manual',
      volume,
      boundingBox: null, // No bounding box for manual entries
      technology: formData.technology,
      material: formData.material,
      quantity: formData.quantity,
      unitPrice,
      totalPrice,
      gstAmount: gstCalculation.total,
      finalPrice,
      file: undefined, // No file for manual entries
      selected: false,
      comments: formData.comments || undefined // Add comments to the part
    };

    onSave(newPart);
  };

  // Calculate preview pricing
  const volume = parseFloat(formData.volume) || 0;
  const unitPrice = selectedMaterial && volume > 0 ? volume * selectedMaterial.cost_per_cc : 0;
  const totalPrice = unitPrice * formData.quantity;
  const gstCalculation = customer && totalPrice > 0 ? calculateGST(totalPrice, customer) : null;
  const finalPrice = totalPrice + (gstCalculation?.total || 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <Package className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Add Part Manually</h2>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Part Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Part Name *
              </label>
              <input
                type="text"
                value={formData.partName}
                onChange={(e) => handleInputChange('partName', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.partName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter part name"
              />
              {errors.partName && (
                <p className="text-red-500 text-xs mt-1">{errors.partName}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Volume (cm³) *
              </label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={formData.volume}
                onChange={(e) => handleInputChange('volume', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.volume ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="0.00"
              />
              {errors.volume && (
                <p className="text-red-500 text-xs mt-1">{errors.volume}</p>
              )}
            </div>
          </div>

          {/* Technology and Material */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Technology *
              </label>
              <select
                value={formData.technology}
                onChange={(e) => handleInputChange('technology', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.technology ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Technology</option>
                {technologies.map(([techId, tech]) => (
                  <option key={techId} value={techId}>{tech.name}</option>
                ))}
              </select>
              {errors.technology && (
                <p className="text-red-500 text-xs mt-1">{errors.technology}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Material *
              </label>
              <select
                value={formData.material}
                onChange={(e) => handleInputChange('material', e.target.value)}
                disabled={!formData.technology}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                  errors.material ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Material</option>
                {availableMaterials.map(([materialId, material]) => (
                  <option key={materialId} value={materialId}>
                    {material.name} - ₹{material.cost_per_cc.toFixed(2)}/cm³
                  </option>
                ))}
              </select>
              {errors.material && (
                <p className="text-red-500 text-xs mt-1">{errors.material}</p>
              )}
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity *
            </label>
            <input
              type="number"
              min="1"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                errors.quantity ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.quantity && (
              <p className="text-red-500 text-xs mt-1">{errors.quantity}</p>
            )}
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Comments
              <span className="text-gray-500 text-xs ml-1">(Optional)</span>
            </label>
            <textarea
              value={formData.comments}
              onChange={(e) => handleInputChange('comments', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Add specific requirements, painting color, heat inserts, delivery instructions, etc..."
            />
            <p className="text-xs text-gray-500 mt-1">
              These comments will appear on the quotation and invoice PDFs
            </p>
          </div>
          {/* Pricing Preview */}
          {selectedMaterial && volume > 0 && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-indigo-900 mb-3">Pricing Preview</h4>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <p className="text-sm text-indigo-700">Unit Price</p>
                  <p className="text-lg font-semibold text-indigo-900">
                    ₹{unitPrice.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-indigo-700">Base Total</p>
                  <p className="text-lg font-semibold text-indigo-900">
                    ₹{totalPrice.toFixed(2)}
                  </p>
                </div>
              </div>
              
              {gstCalculation && customer && (
                <div className="border-t border-indigo-200 pt-3">
                  <div className="grid grid-cols-2 gap-4 mb-2">
                    <div>
                      <p className="text-sm text-indigo-700">GST (18%)</p>
                      <p className="text-sm font-medium text-indigo-800">
                        ₹{gstCalculation.total.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-indigo-700">Final Price</p>
                      <p className="text-lg font-bold text-indigo-900">
                        ₹{finalPrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-indigo-600">
                    {gstCalculation.type === 'INTRASTATE' 
                      ? `CGST (9%): ₹${gstCalculation.cgst.toFixed(2)}, SGST (9%): ₹${gstCalculation.sgst.toFixed(2)}`
                      : `IGST (18%): ₹${gstCalculation.igst.toFixed(2)}`
                    }
                  </p>
                </div>
              )}
              
              <div className="mt-2 text-xs text-indigo-600">
                {volume.toFixed(2)} cm³ × ₹{selectedMaterial.cost_per_cc.toFixed(2)}/cm³ × {formData.quantity} qty
              </div>
            </div>
          )}

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
              disabled={!customer}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Add Part</span>
            </button>
          </div>

          {!customer && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                Please select a customer first to calculate pricing and GST.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ManualPartForm;