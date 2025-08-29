import React from 'react';
import { Calendar, CreditCard, Hash, FileText, Trash2 } from 'lucide-react';
import { Payment } from '../../types';

interface PaymentHistoryProps {
  payments: Payment[];
  onDeletePayment: (paymentId: string) => void;
}

const PaymentHistory: React.FC<PaymentHistoryProps> = ({ payments, onDeletePayment }) => {
  const getPaymentMethodIcon = (method: Payment['paymentMethod']) => {
    switch (method) {
      case 'Cash':
        return '💵';
      case 'Bank Transfer':
        return '🏦';
      case 'UPI':
        return '📱';
      case 'Cheque':
        return '📝';
      case 'Card':
        return '💳';
      default:
        return '💰';
    }
  };

  const getPaymentMethodColor = (method: Payment['paymentMethod']) => {
    switch (method) {
      case 'Cash':
        return 'bg-green-100 text-green-800';
      case 'Bank Transfer':
        return 'bg-blue-100 text-blue-800';
      case 'UPI':
        return 'bg-purple-100 text-purple-800';
      case 'Cheque':
        return 'bg-yellow-100 text-yellow-800';
      case 'Card':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>No payments recorded yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-gray-900 flex items-center space-x-2">
        <CreditCard className="h-4 w-4" />
        <span>Payment History ({payments.length})</span>
      </h4>
      
      <div className="space-y-3">
        {payments.map((payment) => (
          <div key={payment.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors duration-200">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-lg">{getPaymentMethodIcon(payment.paymentMethod)}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-semibold text-lg text-green-600">
                        ₹{payment.amount.toFixed(2)}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentMethodColor(payment.paymentMethod)}`}>
                        {payment.paymentMethod}
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(payment.paymentDate).toLocaleDateString('en-IN')}</span>
                      </div>
                      {payment.referenceNumber && (
                        <div className="flex items-center space-x-1">
                          <Hash className="h-3 w-3" />
                          <span>{payment.referenceNumber}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {payment.notes && (
                  <div className="flex items-start space-x-2 mt-2">
                    <FileText className="h-3 w-3 text-gray-400 mt-0.5" />
                    <p className="text-sm text-gray-600">{payment.notes}</p>
                  </div>
                )}
                
                <p className="text-xs text-gray-500 mt-2">
                  Recorded on {new Date(payment.createdAt).toLocaleDateString('en-IN')} at {new Date(payment.createdAt).toLocaleTimeString('en-IN')}
                </p>
              </div>
              
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this payment record?')) {
                    onDeletePayment(payment.id);
                  }
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Delete Payment"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div className="border-t border-gray-200 pt-3">
        <div className="flex justify-between items-center text-sm font-medium">
          <span className="text-gray-700">Total Payments:</span>
          <span className="text-green-600">
            ₹{payments.reduce((sum, payment) => sum + payment.amount, 0).toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;