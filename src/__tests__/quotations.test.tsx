import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import QuotationPage from '../components/quotations/QuotationPage';
import CustomerSelector from '../components/quotations/CustomerSelector';
import PartCard from '../components/quotations/PartCard';
import BulkActions from '../components/quotations/BulkActions';
import { CustomersData, TechnologiesData, QuotationPart } from '../types';
import { calculateGST } from '../utils/gstCalculator';

// Mock data
const mockCustomersData: CustomersData = {
  customers: {
    'CUST001': {
      company_name: 'Test Company',
      gstn: '29ABCDE1234F1Z5',
      contact_person: 'John Doe',
      email: 'john@test.com',
      phone: '+91-9876543210',
      billing_address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Karnataka',
        pin: '123456',
        country: 'India'
      },
      shipping_address: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'Karnataka',
        pin: '123456',
        country: 'India'
      },
      customer_type: 'Business',
      discount_rate: 0.05,
      payment_terms: 'Net 30',
      preferred_technologies: ['FDM'],
      total_orders: 10,
      total_spent: 50000,
      status: 'Active',
      notes: 'Test customer'
    },
    'CUST002': {
      company_name: 'Out of State Company',
      gstn: '27FGHIJ5678K2L9',
      contact_person: 'Jane Smith',
      email: 'jane@outofstate.com',
      phone: '+91-9876543210',
      billing_address: {
        street: '456 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pin: '400001',
        country: 'India'
      },
      shipping_address: {
        street: '456 Test Street',
        city: 'Mumbai',
        state: 'Maharashtra',
        pin: '400001',
        country: 'India'
      },
      customer_type: 'Business',
      discount_rate: 0.10,
      payment_terms: 'Net 15',
      preferred_technologies: ['SLA'],
      total_orders: 5,
      total_spent: 25000,
      status: 'Active',
      notes: 'Out of state customer'
    }
  },
  last_updated: '2025-01-01',
  next_customer_id: 'CUST003'
};

const mockTechnologiesData: TechnologiesData = {
  technologies: {
    'FDM': {
      name: 'Fused Deposition Modeling',
      description: 'Layer-by-layer deposition',
      materials: {
        'PLA': {
          name: 'Polylactic Acid',
          cost_per_cc: 3.50,
          properties: ['Biodegradable'],
          colors: ['White', 'Black']
        }
      }
    }
  },
  last_updated: '2025-01-01',
  currency: 'INR'
};

const mockPart: QuotationPart = {
  id: 'part1',
  serialNumber: 1,
  fileName: 'test.stl',
  fileType: 'stl',
  volume: 10.5,
  boundingBox: { x: 20, y: 15, z: 10 },
  quantity: 1,
  unitPrice: 0,
  totalPrice: 0,
  gstAmount: 0,
  finalPrice: 0,
  file: new File([''], 'test.stl', { type: 'application/octet-stream' }),
  selected: false
};

describe('GST Calculator', () => {
  it('calculates intrastate GST correctly', () => {
    const customer = mockCustomersData.customers.CUST001; // Karnataka customer
    const baseAmount = 1000;
    const gst = calculateGST(baseAmount, customer);
    
    expect(gst.type).toBe('INTRASTATE');
    expect(gst.cgst).toBe(90); // 9% of 1000
    expect(gst.sgst).toBe(90); // 9% of 1000
    expect(gst.igst).toBe(0);
    expect(gst.total).toBe(180); // 18% total
  });

  it('calculates interstate GST correctly', () => {
    const customer = mockCustomersData.customers.CUST002; // Maharashtra customer
    const baseAmount = 1000;
    const gst = calculateGST(baseAmount, customer);
    
    expect(gst.type).toBe('INTERSTATE');
    expect(gst.cgst).toBe(0);
    expect(gst.sgst).toBe(0);
    expect(gst.igst).toBe(180); // 18% of 1000
    expect(gst.total).toBe(180);
  });
});

describe('CustomerSelector', () => {
  const mockProps = {
    customers: mockCustomersData.customers,
    selectedCustomerId: null,
    onSelectCustomer: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer selector correctly', () => {
    render(<CustomerSelector {...mockProps} />);
    
    expect(screen.getByText('Select Customer *')).toBeInTheDocument();
    expect(screen.getByText('Click to select a customer')).toBeInTheDocument();
  });

  it('opens dropdown when clicked', async () => {
    const user = userEvent.setup();
    render(<CustomerSelector {...mockProps} />);
    
    const selector = screen.getByText('Click to select a customer');
    await user.click(selector);
    
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('Out of State Company')).toBeInTheDocument();
  });

  it('selects customer when clicked', async () => {
    const user = userEvent.setup();
    render(<CustomerSelector {...mockProps} />);
    
    // Open dropdown
    const selector = screen.getByText('Click to select a customer');
    await user.click(selector);
    
    // Select customer
    const customerOption = screen.getByText('Test Company');
    await user.click(customerOption);
    
    expect(mockProps.onSelectCustomer).toHaveBeenCalledWith('CUST001');
  });

  it('shows clear button when customer is selected', () => {
    render(<CustomerSelector {...mockProps} selectedCustomerId="CUST001" />);
    
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByTitle('Clear selection')).toBeInTheDocument();
  });

  it('clears selection when clear button is clicked', async () => {
    const user = userEvent.setup();
    render(<CustomerSelector {...mockProps} selectedCustomerId="CUST001" />);
    
    const clearButton = screen.getByTitle('Clear selection');
    await user.click(clearButton);
    
    expect(mockProps.onSelectCustomer).toHaveBeenCalledWith('');
  });

  it('filters customers by search term', async () => {
    const user = userEvent.setup();
    render(<CustomerSelector {...mockProps} />);
    
    // Open dropdown
    const selector = screen.getByText('Click to select a customer');
    await user.click(selector);
    
    // Search for specific customer
    const searchInput = screen.getByPlaceholderText('Search customers...');
    await user.type(searchInput, 'Test Company');
    
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.queryByText('Out of State Company')).not.toBeInTheDocument();
  });
});

describe('BulkActions', () => {
  const mockProps = {
    parts: [
      mockPart, 
      { ...mockPart, id: 'part2', serialNumber: 2, selected: true },
      { ...mockPart, id: 'part3', serialNumber: 3, selected: true }
    ],
    selectedParts: [
      { ...mockPart, id: 'part2', serialNumber: 2, selected: true },
      { ...mockPart, id: 'part3', serialNumber: 3, selected: true }
    ],
    technologiesData: mockTechnologiesData,
    customer: mockCustomersData.customers.CUST001,
    onUpdateParts: vi.fn(),
    onDeleteAllParts: vi.fn(),
    onToggleSelectAll: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders bulk actions correctly', () => {
    render(<BulkActions {...mockProps} />);
    
    expect(screen.getByText('Select All (2 selected)')).toBeInTheDocument();
    expect(screen.getByText('Bulk Edit (2)')).toBeInTheDocument();
    expect(screen.getByText('Delete All')).toBeInTheDocument();
  });

  it('shows bulk edit panel when clicked', async () => {
    const user = userEvent.setup();
    render(<BulkActions {...mockProps} />);
    
    const bulkEditButton = screen.getByText('Bulk Edit (2)');
    await user.click(bulkEditButton);
    
    expect(screen.getByText('Bulk Edit 2 Selected Parts')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
  });

  it('applies bulk changes correctly', async () => {
    const user = userEvent.setup();
    render(<BulkActions {...mockProps} />);
    
    // Open bulk edit panel
    const bulkEditButton = screen.getByText('Bulk Edit (2)');
    await user.click(bulkEditButton);
    
    // Select technology
    const technologySelect = screen.getByDisplayValue('');
    await user.selectOptions(technologySelect, 'FDM');
    
    // Apply changes
    const applyButton = screen.getByText('Apply Changes');
    await user.click(applyButton);
    
    expect(mockProps.onUpdateParts).toHaveBeenCalledWith(
      ['part2', 'part3'],
      expect.objectContaining({
        technology: 'FDM'
      })
    );
  });

  it('applies bulk changes with material selection', async () => {
    const user = userEvent.setup();
    render(<BulkActions {...mockProps} />);
    
    // Open bulk edit panel
    const bulkEditButton = screen.getByText('Bulk Edit (2)');
    await user.click(bulkEditButton);
    
    // Select technology first
    const technologySelect = screen.getByDisplayValue('');
    await user.selectOptions(technologySelect, 'FDM');
    
    // Wait for material dropdown to appear
    await waitFor(() => {
      expect(screen.getByText('Material')).toBeInTheDocument();
    });
    
    // Select material
    const materialSelect = screen.getAllByDisplayValue('')[1]; // Second empty select is material
    await user.selectOptions(materialSelect, 'PLA');
    
    // Apply changes
    const applyButton = screen.getByText('Apply Changes');
    await user.click(applyButton);
    
    expect(mockProps.onUpdateParts).toHaveBeenCalledWith(
      ['part2', 'part3'],
      expect.objectContaining({
        technology: 'FDM',
        material: 'PLA'
      })
    );
  });

  it('calls onToggleSelectAll when select all is clicked', async () => {
    const user = userEvent.setup();
    render(<BulkActions {...mockProps} />);
    
    const selectAllButton = screen.getByText('Select All (2 selected)');
    await user.click(selectAllButton);
    
    expect(mockProps.onToggleSelectAll).toHaveBeenCalledTimes(1);
  });

  it('calls onDeleteAllParts when delete all is confirmed', async () => {
    const user = userEvent.setup();
    // Mock window.confirm
    vi.stubGlobal('confirm', vi.fn(() => true));
    
    render(<BulkActions {...mockProps} />);
    
    const deleteAllButton = screen.getByText('Delete All');
    await user.click(deleteAllButton);
    
    expect(mockProps.onDeleteAllParts).toHaveBeenCalledTimes(1);
  });

  it('does not delete when confirmation is cancelled', async () => {
    const user = userEvent.setup();
    // Mock window.confirm to return false
    vi.stubGlobal('confirm', vi.fn(() => false));
    
    render(<BulkActions {...mockProps} />);
    
    const deleteAllButton = screen.getByText('Delete All');
    await user.click(deleteAllButton);
    
    expect(mockProps.onDeleteAllParts).not.toHaveBeenCalled();
  });

  it('shows correct select all state when all parts are selected', () => {
    const allSelectedProps = {
      ...mockProps,
      parts: [
        { ...mockPart, id: 'part1', selected: true },
        { ...mockPart, id: 'part2', selected: true },
        { ...mockPart, id: 'part3', selected: true }
      ],
      selectedParts: [
        { ...mockPart, id: 'part1', selected: true },
        { ...mockPart, id: 'part2', selected: true },
        { ...mockPart, id: 'part3', selected: true }
      ]
    };
    
    render(<BulkActions {...allSelectedProps} />);
    
    expect(screen.getByText('Deselect All (3 selected)')).toBeInTheDocument();
  });
});

describe('PartCard', () => {
  const mockProps = {
    part: mockPart,
    technologiesData: mockTechnologiesData,
    customer: mockCustomersData.customers.CUST001,
    onUpdatePart: vi.fn(),
    onDeletePart: vi.fn(),
    onToggleSelect: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders part card with serial number', () => {
    render(<PartCard {...mockProps} />);
    
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('test.stl')).toBeInTheDocument();
  });

  it('shows selection checkbox', () => {
    render(<PartCard {...mockProps} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeInTheDocument();
    expect(checkbox).not.toBeChecked();
  });

  it('calls onToggleSelect when checkbox is clicked', async () => {
    const user = userEvent.setup();
    render(<PartCard {...mockProps} />);
    
    const checkbox = screen.getByRole('checkbox');
    await user.click(checkbox);
    
    expect(mockProps.onToggleSelect).toHaveBeenCalledWith('part1');
  });

  it('shows selected state styling', () => {
    const selectedPart = { ...mockPart, selected: true };
    render(<PartCard {...mockProps} part={selectedPart} />);
    
    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calculates GST when material is selected', async () => {
    const user = userEvent.setup();
    const partWithTechnology = { ...mockPart, technology: 'FDM' };
    
    render(<PartCard {...mockProps} part={partWithTechnology} />);
    
    const materialSelect = screen.getByDisplayValue('');
    await user.selectOptions(materialSelect, 'PLA');
    
    // Should call onUpdatePart with GST calculations
    expect(mockProps.onUpdatePart).toHaveBeenCalledWith('part1', expect.objectContaining({
      material: 'PLA',
      unitPrice: 36.75, // 10.5 * 3.50
      totalPrice: 36.75,
      gstAmount: expect.any(Number),
      finalPrice: expect.any(Number)
    }));
  });
});

describe('QuotationPage Integration', () => {
  const mockProps = {
    customersData: mockCustomersData,
    technologiesData: mockTechnologiesData
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders quotation page correctly', () => {
    render(<QuotationPage {...mockProps} />);
    
    expect(screen.getByText('Create Quotation')).toBeInTheDocument();
    expect(screen.getByText('Generate quotes for your 3D printing projects')).toBeInTheDocument();
  });

  it('shows company information in summary', async () => {
    const user = userEvent.setup();
    render(<QuotationPage {...mockProps} />);
    
    // Select customer first
    const customerSelector = screen.getByText('Click to select a customer');
    await user.click(customerSelector);
    
    const customerOption = screen.getByText('Test Company');
    await user.click(customerOption);
    
    // Check if company info is shown in summary
    expect(screen.getByText('Dexterous Manufacturing Labs Pvt Ltd')).toBeInTheDocument();
    expect(screen.getByText('GSTN: 29AAGCD4100R2ZC')).toBeInTheDocument();
  });

  it('allows customer selection and deselection', async () => {
    const user = userEvent.setup();
    render(<QuotationPage {...mockProps} />);
    
    // Select customer
    const customerSelector = screen.getByText('Click to select a customer');
    await user.click(customerSelector);
    
    const customerOption = screen.getByText('Test Company');
    await user.click(customerOption);
    
    // Verify customer is selected
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByTitle('Clear selection')).toBeInTheDocument();
    
    // Clear selection
    const clearButton = screen.getByTitle('Clear selection');
    await user.click(clearButton);
    
    // Verify customer is deselected
    expect(screen.getByText('Click to select a customer')).toBeInTheDocument();
  });
});