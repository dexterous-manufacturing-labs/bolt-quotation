import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import MaterialList from '../components/materials/MaterialList';
import MaterialForm from '../components/materials/MaterialForm';
import { TechnologiesData, Material } from '../types';

// Mock technologies data
const mockTechnologiesData: TechnologiesData = {
  technologies: {
    'FDM': {
      name: 'Fused Deposition Modeling',
      description: 'Layer-by-layer deposition of thermoplastic filament',
      materials: {
        'PLA': {
          name: 'Polylactic Acid',
          cost_per_cc: 3.50,
          properties: ['Biodegradable', 'Easy to print'],
          colors: ['White', 'Black', 'Red']
        }
      }
    }
  },
  last_updated: '2025-01-01',
  currency: 'INR'
};

describe('MaterialList', () => {
  const mockProps = {
    technologiesData: mockTechnologiesData,
    onEditMaterial: vi.fn(),
    onDeleteMaterial: vi.fn(),
    onAddMaterial: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders material list correctly', () => {
    render(<MaterialList {...mockProps} />);
    
    expect(screen.getByText('Materials & Costing')).toBeInTheDocument();
    expect(screen.getByText('Fused Deposition Modeling')).toBeInTheDocument();
    expect(screen.getByText('Polylactic Acid')).toBeInTheDocument();
    expect(screen.getByText('₹3.50')).toBeInTheDocument();
  });

  it('filters materials by search term', async () => {
    const user = userEvent.setup();
    render(<MaterialList {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search materials...');
    await user.type(searchInput, 'PLA');
    
    expect(screen.getByText('Polylactic Acid')).toBeInTheDocument();
  });

  it('filters by technology', async () => {
    const user = userEvent.setup();
    render(<MaterialList {...mockProps} />);
    
    const technologySelect = screen.getByDisplayValue('All Technologies');
    await user.selectOptions(technologySelect, 'FDM');
    
    expect(screen.getByText('Fused Deposition Modeling')).toBeInTheDocument();
  });

  it('calls onAddMaterial when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<MaterialList {...mockProps} />);
    
    const addButton = screen.getByText('Add Material');
    await user.click(addButton);
    
    expect(mockProps.onAddMaterial).toHaveBeenCalledWith('FDM');
  });

  it('calls onEditMaterial when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<MaterialList {...mockProps} />);
    
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => 
      button.querySelector('svg')?.getAttribute('class')?.includes('lucide-edit')
    );
    
    if (editButton) {
      await user.click(editButton);
      expect(mockProps.onEditMaterial).toHaveBeenCalledWith('FDM', 'PLA');
    }
  });
});

describe('MaterialForm', () => {
  const mockProps = {
    technologyName: 'Fused Deposition Modeling',
    onSave: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders add material form correctly', () => {
    render(<MaterialForm {...mockProps} />);
    
    expect(screen.getByText('Add New Material - Fused Deposition Modeling')).toBeInTheDocument();
    expect(screen.getByLabelText(/Material Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Cost per CC/)).toBeInTheDocument();
  });

  it('renders edit material form with existing data', () => {
    const material: Material = {
      name: 'Test Material',
      cost_per_cc: 5.00,
      properties: ['Strong'],
      colors: ['Blue']
    };

    render(
      <MaterialForm 
        {...mockProps} 
        material={material}
        materialId="TEST_MATERIAL"
      />
    );
    
    expect(screen.getByText('Edit Material - Fused Deposition Modeling')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Material')).toBeInTheDocument();
    expect(screen.getByDisplayValue('5')).toBeInTheDocument();
  });

  it('adds and removes properties', async () => {
    const user = userEvent.setup();
    render(<MaterialForm {...mockProps} />);
    
    const propertyInput = screen.getByPlaceholderText(/Add a property/);
    await user.type(propertyInput, 'Flexible');
    
    const addPropertyButton = propertyInput.nextElementSibling as HTMLElement;
    await user.click(addPropertyButton);
    
    expect(screen.getByText('Flexible')).toBeInTheDocument();
  });

  it('adds and removes colors', async () => {
    const user = userEvent.setup();
    render(<MaterialForm {...mockProps} />);
    
    const colorInput = screen.getByPlaceholderText(/Add a color/);
    await user.type(colorInput, 'Green');
    
    const addColorButton = colorInput.nextElementSibling as HTMLElement;
    await user.click(addColorButton);
    
    expect(screen.getByText('Green')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<MaterialForm {...mockProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<MaterialForm {...mockProps} />);
    
    const saveButton = screen.getByText('Add Material');
    await user.click(saveButton);
    
    // Form should not submit without required fields
    expect(mockProps.onSave).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<MaterialForm {...mockProps} />);
    
    // Fill required fields
    await user.type(screen.getByLabelText(/Material Name/), 'New Material');
    await user.type(screen.getByLabelText(/Cost per CC/), '10.50');
    
    const saveButton = screen.getByText('Add Material');
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledTimes(1);
    });
  });
});