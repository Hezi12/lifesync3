'use client';

import { useState, useEffect } from 'react';
import { FiX } from 'react-icons/fi';
import { Transaction, PaymentMethod, FinancialCategory } from '../../types';
import { v4 as uuidv4 } from 'uuid';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: Transaction) => void;
  transaction: Transaction | null;
  paymentMethods: PaymentMethod[];
  categories: FinancialCategory[];
}

const TransactionModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  transaction, 
  paymentMethods, 
  categories 
}: TransactionModalProps) => {
  const [formData, setFormData] = useState<Transaction>({
    id: '',
    amount: 0,
    date: new Date(),
    description: '',
    categoryId: '',
    paymentMethodId: '',
    type: 'expense'
  });
  
  // איתחול הטופס עם נתוני העסקה הקיימת, אם יש
  useEffect(() => {
    if (transaction) {
      setFormData({ ...transaction });
    } else {
      // איתחול הטופס לעסקה חדשה
      setFormData({
        id: uuidv4(),
        amount: 0,
        date: new Date(),
        description: '',
        categoryId: categories.length > 0 ? categories.filter(c => c.type === 'expense')[0]?.id || '' : '',
        paymentMethodId: paymentMethods.length > 0 ? paymentMethods[0].id : '',
        type: 'expense'
      });
    }
  }, [transaction, categories, paymentMethods]);
  
  // טיפול בשינויים בשדות הטופס
  const handleChange = (field: keyof Transaction, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    });
    
    // אם שינינו את סוג העסקה, יש לעדכן גם את הקטגוריה
    if (field === 'type') {
      const matchingCategories = categories.filter(c => c.type === value);
      if (matchingCategories.length > 0) {
        setFormData((prev) => ({
          ...prev,
          type: value as 'income' | 'expense',
          categoryId: matchingCategories[0].id
        }));
      }
    }
  };
  
  // טיפול בשמירת הטופס
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };
  
  // אם המודל סגור, לא מציגים כלום
  if (!isOpen) return null;
  
  // פילטור קטגוריות לפי סוג העסקה
  const filteredCategories = categories.filter(c => c.type === formData.type);
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex justify-center items-center p-4">
      <div className="bg-white rounded-lg w-full max-w-lg">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-xl font-medium">
            {transaction ? 'עריכת עסקה' : 'הוספת עסקה חדשה'}
          </h2>
          <button
            className="text-gray-400 hover:text-gray-600"
            onClick={onClose}
          >
            <FiX size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* סוג עסקה: הכנסה או הוצאה */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סוג עסקה:</label>
            <div className="flex">
              <button
                type="button"
                className={`flex-1 py-2 border-l ${
                  formData.type === 'income'
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                }`}
                onClick={() => handleChange('type', 'income')}
              >
                הכנסה
              </button>
              
              <button
                type="button"
                className={`flex-1 py-2 ${
                  formData.type === 'expense'
                    ? 'bg-red-100 text-red-800 border-red-300'
                    : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                }`}
                onClick={() => handleChange('type', 'expense')}
              >
                הוצאה
              </button>
            </div>
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
          
          {/* תיאור */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              תיאור:
            </label>
            <input
              type="text"
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          {/* תאריך */}
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
              תאריך:
            </label>
            <input
              type="date"
              id="date"
              value={formData.date.toISOString().split('T')[0]}
              onChange={(e) => handleChange('date', new Date(e.target.value))}
              className="w-full p-2 border rounded-md"
              required
            />
          </div>
          
          {/* קטגוריה */}
          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
              קטגוריה:
            </label>
            <select
              id="categoryId"
              value={formData.categoryId}
              onChange={(e) => handleChange('categoryId', e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="" disabled>בחר קטגוריה</option>
              {filteredCategories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
            
            {filteredCategories.length === 0 && (
              <p className="text-red-500 text-sm mt-1">
                אין קטגוריות מסוג {formData.type === 'income' ? 'הכנסה' : 'הוצאה'}. אנא צור קטגוריה תחילה.
              </p>
            )}
          </div>
          
          {/* שיטת תשלום */}
          <div>
            <label htmlFor="paymentMethodId" className="block text-sm font-medium text-gray-700 mb-1">
              אמצעי תשלום:
            </label>
            <select
              id="paymentMethodId"
              value={formData.paymentMethodId}
              onChange={(e) => handleChange('paymentMethodId', e.target.value)}
              className="w-full p-2 border rounded-md"
              required
            >
              <option value="" disabled>בחר אמצעי תשלום</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.icon} {method.name}
                </option>
              ))}
            </select>
            
            {paymentMethods.length === 0 && (
              <p className="text-red-500 text-sm mt-1">
                אין אמצעי תשלום. אנא צור אמצעי תשלום תחילה.
              </p>
            )}
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
              disabled={
                !formData.description || 
                formData.amount <= 0 || 
                !formData.categoryId || 
                !formData.paymentMethodId
              }
            >
              {transaction ? 'עדכון' : 'הוספה'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal; 