import { describe, it, expect } from 'vitest';
import { calculateGST, formatGSTBreakdown, COMPANY_INFO } from '../utils/gstCalculator';
import { Customer } from '../types';

const mockKarnatakaCustomer: Customer = {
  company_name: 'Karnataka Company',
  gstn: '29ABCDE1234F1Z5',
  contact_person: 'John Doe',
  email: 'john@test.com',
  phone: '+91-9876543210',
  billing_address: {
    street: '123 Test Street',
    city: 'Bangalore',
    state: 'Karnataka',
    pin: '560001',
    country: 'India'
  },
  shipping_address: {
    street: '123 Test Street',
    city: 'Bangalore',
    state: 'Karnataka',
    pin: '560001',
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
};

const mockOutOfStateCustomer: Customer = {
  ...mockKarnatakaCustomer,
  company_name: 'Maharashtra Company',
  shipping_address: {
    street: '456 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pin: '400001',
    country: 'India'
  }
};

describe('GST Calculator', () => {
  describe('calculateGST', () => {
    it('calculates intrastate GST for Karnataka customers', () => {
      const baseAmount = 1000;
      const gst = calculateGST(baseAmount, mockKarnatakaCustomer);
      
      expect(gst.type).toBe('INTRASTATE');
      expect(gst.cgst).toBe(90); // 9% of 1000
      expect(gst.sgst).toBe(90); // 9% of 1000
      expect(gst.igst).toBe(0);
      expect(gst.total).toBe(180); // 18% total
    });

    it('calculates interstate GST for non-Karnataka customers', () => {
      const baseAmount = 1000;
      const gst = calculateGST(baseAmount, mockOutOfStateCustomer);
      
      expect(gst.type).toBe('INTERSTATE');
      expect(gst.cgst).toBe(0);
      expect(gst.sgst).toBe(0);
      expect(gst.igst).toBe(180); // 18% of 1000
      expect(gst.total).toBe(180);
    });

    it('handles case-insensitive state comparison', () => {
      const customerWithLowercaseState = {
        ...mockKarnatakaCustomer,
        shipping_address: {
          ...mockKarnatakaCustomer.shipping_address,
          state: 'karnataka' // lowercase
        }
      };
      
      const baseAmount = 1000;
      const gst = calculateGST(baseAmount, customerWithLowercaseState);
      
      expect(gst.type).toBe('INTRASTATE');
      expect(gst.total).toBe(180);
    });

    it('calculates GST for different amounts correctly', () => {
      const testAmounts = [100, 500, 1500, 2000];
      
      testAmounts.forEach(amount => {
        const gst = calculateGST(amount, mockKarnatakaCustomer);
        expect(gst.total).toBe(amount * 0.18); // 18% of amount
        expect(gst.cgst).toBe(amount * 0.09); // 9% of amount
        expect(gst.sgst).toBe(amount * 0.09); // 9% of amount
      });
    });
  });

  describe('formatGSTBreakdown', () => {
    it('formats intrastate GST breakdown correctly', () => {
      const gst = calculateGST(1000, mockKarnatakaCustomer);
      const formatted = formatGSTBreakdown(gst);
      
      expect(formatted).toBe('CGST (9%): ₹90.00, SGST (9%): ₹90.00');
    });

    it('formats interstate GST breakdown correctly', () => {
      const gst = calculateGST(1000, mockOutOfStateCustomer);
      const formatted = formatGSTBreakdown(gst);
      
      expect(formatted).toBe('IGST (18%): ₹180.00');
    });
  });

  describe('Company Info', () => {
    it('has correct company information', () => {
      expect(COMPANY_INFO.name).toBe('Dexterous Manufacturing Labs Pvt Ltd');
      expect(COMPANY_INFO.gstn).toBe('29AAGCD4100R2ZC');
      expect(COMPANY_INFO.address.city).toBe('Bangalore');
      expect(COMPANY_INFO.address.state).toBe('Karnataka');
    });
  });
});