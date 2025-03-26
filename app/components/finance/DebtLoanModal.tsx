'use client';

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { DebtLoan, PaymentMethod } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface DebtLoanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (debtLoan: DebtLoan) => void;
  debtLoan: DebtLoan | null;
  paymentMethods: PaymentMethod[];
}

const DebtLoanModal = ({ isOpen, onClose, onSave, debtLoan, paymentMethods }: DebtLoanModalProps) => {
  const [formData, setFormData] = useState<DebtLoan>({
    id: '',
    personName: '',
    amount: 0,
    dueDate: undefined,
    notes: '',
    paymentMethodId: '',
    isDebt: true,
    isPaid: false
  });
  
  // איתחול הטופס עם נתוני החוב/הלוואה הקיימים, אם יש
  useEffect(() => {
    if (debtLoan) {
      setFormData({ ...debtLoan });
    } else {
      // איתחול הטופס לחוב/הלוואה חדש/ה
      setFormData({
        id: uuidv4(),
        personName: '',
        amount: 0,
        dueDate: undefined,
        notes: '',
        paymentMethodId: paymentMethods.length > 0 ? paymentMethods[0].id : '',
        isDebt: true,
        isPaid: false
      });
    }
  }, [debtLoan, paymentMethods]);
  
  // טיפול בשינויים בשדות הטופס
  const handleChange = (field: keyof DebtLoan, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };
  
  // טיפול בשמירת הטופס
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  // אם המודל סגור, לא מציגים כלום
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-medium">
            {debtLoan ? 'עריכת חוב/הלוואה' : 'הוספת חוב/הלוואה חדש/ה'}
          </h2>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* סוג: חוב או הלוואה */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סוג:</label>
            <div className="flex">
              <button
                type="button"
                className={`flex-1 py-2 border-l ${
                  formData.isDebt
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                }`}
                onClick={() => handleChange('isDebt', true)}
              >
                חוב (אני חייב)
              </button>
              
              <button
                type="button"
                className={`flex-1 py-2 ${
                  !formData.isDebt
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                }`}
                onClick={() => handleChange('isDebt', false)}
              >
                הלוואה (חייבים לי)
              </button>
            </div>
          </div>
          
          {/* שם האדם */}
          <div>
            <label htmlFor="personName" className="block text-sm font-medium text-gray-700 mb-1">
              שם {formData.isDebt ? 'הנושה' : 'הלווה'}:
            </label>
            <input
              type="text"
              id="personName"
              value={formData.personName}
              onChange={(e) => handleChange('personName', e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          {/* סכום */}
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
              סכום:
            </label>
            <div className="relative">
              <input
                type="number"
                id="amount"
                value={formData.amount}
                onChange={(e) => handleChange('amount', Number(e.target.value))}
                className="w-full p-2 border rounded-md pl-8"
                min="0"
                step="0.01"
                required
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₪</span>
            </div>
          </div>
          
          {/* תאריך יעד */}
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
              תאריך יעד לתשלום (לא חובה):
            </label>
            <input
              type="date"
              id="dueDate"
              value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''}
              onChange={(e) => {
                const value = e.target.value ? new Date(e.target.value) : undefined;
                handleChange('dueDate', value);
              }}
              className="w-full p-2 border rounded-md"
            />
          </div>
          
          {/* שיטת תשלום */}
          <div>
            <label htmlFor="paymentMethodId" className="block text-sm font-medium text-gray-700 mb-1">
              אמצעי תשלום (לא חובה):
            </label>
            <select
              id="paymentMethodId"
              value={formData.paymentMethodId || ''}
              onChange={(e) => handleChange('paymentMethodId', e.target.value || undefined)}
              className="w-full p-2 border rounded-md"
            >
              <option value="">-- ללא אמצעי תשלום --</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.icon} {method.name}
                </option>
              ))}
            </select>
          </div>
          
          {/* הערות */}
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              הערות (לא חובה):
            </label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full p-2 border rounded-md"
              rows={3}
            />
          </div>
          
          {/* סטטוס תשלום */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isPaid"
              checked={formData.isPaid}
              onChange={(e) => handleChange('isPaid', e.target.checked)}
              className="h-4 w-4 text-primary-600 border-gray-300 rounded"
            />
            <label htmlFor="isPaid" className="mr-2 block text-sm text-gray-700">
              שולם
            </label>
          </div>
          
          {/* כפתורי פעולה */}
          <div className="flex justify-end space-x-2 space-x-reverse pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              ביטול
            </button>
            
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              disabled={!formData.personName || formData.amount <= 0}
            >
              {debtLoan ? 'עדכון' : 'הוספה'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtLoanModal; 