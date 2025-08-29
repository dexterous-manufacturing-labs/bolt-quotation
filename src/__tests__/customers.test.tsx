import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import CustomerList from '../components/customers/CustomerList';
import CustomerForm from '../components/customers/CustomerForm';
import { Customer } from '../types';

// Mock customer data
const mockCustomers: Record<string, Customer> = {
  'CUST001': {
    company_name: 'Test Company',
    gstn: '29ABCDE1234F1Z5',
    contact_person: 'John Doe',
    email: 'john@test.com',
    phone: '+91-9876543210',
    billing_address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pin: '123456',
      country: 'India'
    },
    shipping_address: {
      street: '123 Test Street',
      city: 'Test City',
      state: 'Test State',
      pin: '123456',
      country: 'India'
    },
    customer_type: 'Business',
    discount_rate: 0.05,
    payment_terms: 'Net 30',
    preferred_technologies: ['FDM', 'SLA'],
    total_orders: 10,
    total_spent: 50000,
    status: 'Active',
    notes: 'Test customer'
  }
};

describe('CustomerList', () => {
  const mockProps = {
    customers: mockCustomers,
    onEdit: vi.fn(),
    onDelete: vi.fn(),
    onAdd: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders customer list correctly', () => {
    render(<CustomerList {...mockProps} />);
    
    expect(screen.getByText('Customer Management')).toBeInTheDocument();
    expect(screen.getByText('Test Company')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@test.com')).toBeInTheDocument();
  });

  it('filters customers by search term', async () => {
    const user = userEvent.setup();
    render(<CustomerList {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search customers...');
    await user.type(searchInput, 'Test Company');
    
    expect(screen.getByText('Test Company')).toBeInTheDocument();
  });

  it('calls onAdd when add button is clicked', async () => {
    const user = userEvent.setup();
    render(<CustomerList {...mockProps} />);
    
    const addButton = screen.getByText('Add Customer');
    await user.click(addButton);
    
    expect(mockProps.onAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<CustomerList {...mockProps} />);
    
    const editButtons = screen.getAllByRole('button');
    const editButton = editButtons.find(button => 
      button.querySelector('svg')?.getAttribute('class')?.includes('lucide-edit')
    );
    
    if (editButton) {
      await user.click(editButton);
      expect(mockProps.onEdit).toHaveBeenCalledWith('CUST001');
    }
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();
    // Mock window.confirm
    vi.stubGlobal('confirm', vi.fn(() => true));
    
    render(<CustomerList {...mockProps} />);
    
    const deleteButtons = screen.getAllByRole('button');
    const deleteButton = deleteButtons.find(button => 
      button.querySelector('svg')?.getAttribute('class')?.includes('lucide-trash-2')
    );
    
    if (deleteButton) {
      await user.click(deleteButton);
      expect(mockProps.onDelete).toHaveBeenCalledWith('CUST001');
    }
  });
});

describe('CustomerForm', () => {
  const mockProps = {
    onSave: vi.fn(),
    onCancel: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders add customer form correctly', () => {
    render(<CustomerForm {...mockProps} />);
    
    expect(screen.getByText('Add New Customer')).toBeInTheDocument();
    expect(screen.getByLabelText(/Company Name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Contact Person/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email/)).toBeInTheDocument();
  });

  it('renders edit customer form with existing data', () => {
    render(
      <CustomerForm 
        {...mockProps} 
        customer={mockCustomers.CUST001}
        customerId="CUST001"
      />
    );
    
    expect(screen.getByText('Edit Customer')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
  });

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup();
    render(<CustomerForm {...mockProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    await user.click(cancelButton);
    
    expect(mockProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('validates required fields', async () => {
    const user = userEvent.setup();
    render(<CustomerForm {...mockProps} />);
    
    const saveButton = screen.getByText('Add Customer');
    await user.click(saveButton);
    
    // Form should not submit without required fields
    expect(mockProps.onSave).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<CustomerForm {...mockProps} />);
    
    // Fill required fields
    await user.type(screen.getByLabelText(/Company Name/), 'New Company');
    await user.type(screen.getByLabelText(/Contact Person/), 'Jane Doe');
    await user.type(screen.getByLabelText(/Email/), 'jane@newcompany.com');
    await user.type(screen.getByLabelText(/Phone/), '+91-9876543210');
    
    // Fill address fields
    const streetInputs = screen.getAllByLabelText(/Street Address/);
    await user.type(streetInputs[0], '456 New Street');
    
    await user.type(screen.getByLabelText(/City/), 'New City');
    await user.type(screen.getByLabelText(/State/), 'New State');
    await user.type(screen.getByLabelText(/PIN Code/), '654321');
    
    const saveButton = screen.getByText('Add Customer');
    await user.click(saveButton);
    
    await waitFor(() => {
      expect(mockProps.onSave).toHaveBeenCalledTimes(1);
    });
  });
});