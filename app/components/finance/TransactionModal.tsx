'use client';

import { useState } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { Transaction, PaymentMethod, FinancialCategory } from '../../types';

interface TransactionModalProps {
  onClose: () => void;
  onAdd: (transaction: Transaction) => void;
  categories: FinancialCategory[];
  paymentMethods: PaymentMethod[];
}

const TransactionModal: React.FC<TransactionModalProps> = ({
  onClose,
  onAdd,
  categories,
  paymentMethods
}) => {
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  // סינון קטגוריות לפי סוג העסקה
  const filteredCategories = categories.filter(category => category.type === transactionType);
  
  // בדיקת תקינות הטופס
  const isFormValid = 
    amount.trim() !== '' && 
    !isNaN(Number(amount)) && 
    Number(amount) > 0 &&
    description.trim() !== '' &&
    categoryId !== '' &&
    paymentMethodId !== '' &&
    date !== '';
  
  // הוספת עסקה חדשה
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) return;
    
    const newTransaction: Transaction = {
      id: Date.now().toString(),
      amount: Number(amount),
      description,
      categoryId,
      paymentMethodId,
      date: new Date(date),
      type: transactionType
    };
    
    onAdd(newTransaction);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold">עסקה חדשה</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {/* סוג העסקה */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סוג עסקה</label>
              <div className="flex w-full rounded-md overflow-hidden border">
                <button
                  type="button"
                  className={`flex-1 py-2 text-center ${
                    transactionType === 'expense' 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setTransactionType('expense')}
                >
                  הוצאה
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-center ${
                    transactionType === 'income' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setTransactionType('income')}
                >
                  הכנסה
                </button>
              </div>
            </div>
            
            {/* סכום */}
            <div>
              <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
                סכום
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500">₪</span>
                </div>
                <input
                  type="number"
                  id="amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="הזן סכום"
                  min="0"
                  step="0.01"
                  className="block w-full pr-10 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            {/* תיאור */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                תיאור
              </label>
              <input
                type="text"
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="הזן תיאור"
                className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            {/* קטגוריה */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                קטגוריה
              </label>
              <select
                id="category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">בחר קטגוריה</option>
                {filteredCategories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* שיטת תשלום */}
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                שיטת תשלום
              </label>
              <select
                id="paymentMethod"
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">בחר שיטת תשלום</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.icon} {method.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* תאריך */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                תאריך
              </label>
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          
          <div className="p-4 border-t flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-md"
            >
              ביטול
            </button>
            <button
              type="submit"
              disabled={!isFormValid}
              className={`px-4 py-2 rounded-md flex items-center ${
                isFormValid 
                  ? 'bg-primary-500 text-white hover:bg-primary-600' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <FiCheck className="mr-1" />
              שמור
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal; 