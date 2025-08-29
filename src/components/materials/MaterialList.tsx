import React, { useState } from 'react';
import { Plus, Edit, Trash2, Package, Search } from 'lucide-react';
import { TechnologiesData, Technology, Material } from '../../types';

interface MaterialListProps {
  technologiesData: TechnologiesData;
  onEditMaterial: (techId: string, materialId: string) => void;
  onDeleteMaterial: (techId: string, materialId: string) => void;
  onAddMaterial: (techId: string) => void;
}

const MaterialList: React.FC<MaterialListProps> = ({ 
  technologiesData, 
  onEditMaterial, 
  onDeleteMaterial, 
  onAddMaterial 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTechnology, setSelectedTechnology] = useState<string>('all');

  const technologies = Object.entries(technologiesData.technologies);
  
  const filteredTechnologies = technologies.filter(([techId, tech]) => {
    if (selectedTechnology !== 'all' && techId !== selectedTechnology) return false;
    
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      tech.name.toLowerCase().includes(searchLower) ||
      Object.values(tech.materials).some(material => 
        material.name.toLowerCase().includes(searchLower)
      )
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Materials & Costing</h2>
          <p className="text-gray-600">Manage your 3D printing materials and pricing</p>
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
                placeholder="Search materials..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={selectedTechnology}
              onChange={(e) => setSelectedTechnology(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Technologies</option>
              {technologies.map(([techId, tech]) => (
                <option key={techId} value={techId}>{tech.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Technology Cards */}
      <div className="space-y-6">
        {filteredTechnologies.map(([techId, technology]) => (
          <div key={techId} className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{technology.name}</h3>
                  <p className="text-gray-600 mt-1">{technology.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {Object.keys(technology.materials).length} materials available
                  </p>
                </div>
                <button
                  onClick={() => onAddMaterial(techId)}
                  className="bg-indigo-600 text-white px-3 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Material</span>
                </button>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {Object.entries(technology.materials).map(([materialId, material]) => (
                <div key={materialId} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                          <Package className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">{material.name}</h4>
                          <p className="text-sm text-gray-600">{materialId}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Cost per CC</p>
                          <p className="text-lg font-semibold text-indigo-600">
                            ₹{material.cost_per_cc.toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Properties</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {material.properties.slice(0, 3).map((property, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                              >
                                {property}
                              </span>
                            ))}
                            {material.properties.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{material.properties.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-700">Available Colors</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {material.colors.slice(0, 4).map((color, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full"
                              >
                                {color}
                              </span>
                            ))}
                            {material.colors.length > 4 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{material.colors.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => onEditMaterial(techId, materialId)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors duration-200"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => onDeleteMaterial(techId, materialId)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {Object.keys(technology.materials).length === 0 && (
                <div className="p-8 text-center text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No materials found for this technology</p>
                  <button
                    onClick={() => onAddMaterial(techId)}
                    className="mt-2 text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    Add the first material
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredTechnologies.length === 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center text-gray-500">
          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No technologies or materials found matching your search</p>
        </div>
      )}
    </div>
  );
};

export default MaterialList;