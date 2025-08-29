import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { Material } from '../../types';

interface MaterialFormProps {
  material?: Material;
  materialId?: string;
  technologyName: string;
  onSave: (material: Material, materialId?: string) => void;
  onCancel: () => void;
}

const MaterialForm: React.FC<MaterialFormProps> = ({ 
  material, 
  materialId, 
  technologyName, 
  onSave, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<Material>({
    name: '',
    cost_per_cc: 0,
    properties: [],
    colors: []
  });

  const [newProperty, setNewProperty] = useState('');
  const [newColor, setNewColor] = useState('');

  useEffect(() => {
    if (material) {
      setFormData(material);
    }
  }, [material]);

  const handleInputChange = (field: keyof Material, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addProperty = () => {
    if (newProperty.trim() && !formData.properties.includes(newProperty.trim())) {
      setFormData(prev => ({
        ...prev,
        properties: [...prev.properties, newProperty.trim()]
      }));
      setNewProperty('');
    }
  };

  const removeProperty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      properties: prev.properties.filter((_, i) => i !== index)
    }));
  };

  const addColor = () => {
    if (newColor.trim() && !formData.colors.includes(newColor.trim())) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, newColor.trim()]
      }));
      setNewColor('');
    }
  };

  const removeColor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData, materialId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {material ? 'Edit Material' : 'Add New Material'} - {technologyName}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Material Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="e.g., Polylactic Acid"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cost per CC (₹) *</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.cost_per_cc}
                onChange={(e) => handleInputChange('cost_per_cc', parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Properties */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Material Properties</label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newProperty}
                  onChange={(e) => setNewProperty(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addProperty())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add a property (e.g., Biodegradable)"
                />
                <button
                  type="button"
                  onClick={addProperty}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.properties.map((property, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{property}</span>
                    <button
                      type="button"
                      onClick={() => removeProperty(index)}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Available Colors</label>
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Add a color (e.g., White)"
                />
                <button
                  type="button"
                  onClick={addColor}
                  className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors duration-200"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.colors.map((color, index) => (
                  <div
                    key={index}
                    className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    <span>{color}</span>
                    <button
                      type="button"
                      onClick={() => removeColor(index)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
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
              <span>{material ? 'Update Material' : 'Add Material'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MaterialForm;