'use client';

import { useState, useEffect } from 'react';
import { FiX, FiCheck } from 'react-icons/fi';
import { DebtLoan, PaymentMethod } from '../../types';

interface DebtLoanModalProps {
  onClose: () => void;
  onSave: (debtLoan: DebtLoan) => void;
  paymentMethods: PaymentMethod[];
  debtLoan: DebtLoan | null;
}

const DebtLoanModal: React.FC<DebtLoanModalProps> = ({
  onClose,
  onSave,
  paymentMethods,
  debtLoan
}) => {
  const [isDebt, setIsDebt] = useState(true);
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [isPaid, setIsPaid] = useState(false);
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  
  // אם מדובר בעריכה, למלא את השדות
  useEffect(() => {
    if (debtLoan) {
      setIsDebt(debtLoan.isDebt);
      setPersonName(debtLoan.personName);
      setAmount(debtLoan.amount.toString());
      setPaymentMethodId(debtLoan.paymentMethodId || '');
      setIsPaid(debtLoan.isPaid);
      
      if (debtLoan.dueDate) {
        setDueDate(debtLoan.dueDate.toISOString().split('T')[0]);
      }
      
      if (debtLoan.notes) {
        setNotes(debtLoan.notes);
      }
    }
  }, [debtLoan]);
  
  // בדיקת תקינות הטופס
  const isFormValid = 
    personName.trim() !== '' && 
    amount.trim() !== '' && 
    !isNaN(Number(amount)) && 
    Number(amount) > 0;
  
  // הוספה או עדכון של חוב/הלוואה
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isFormValid) return;
    
    const newDebtLoan: DebtLoan = {
      id: debtLoan?.id || Date.now().toString(),
      personName,
      amount: Number(amount),
      paymentMethodId: paymentMethodId || undefined,
      isDebt,
      isPaid,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      notes: notes.trim() || undefined
    };
    
    onSave(newDebtLoan);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-4 border-b flex justify-between items-center">
          <h3 className="text-xl font-semibold">
            {debtLoan ? 'עריכת' : 'הוספת'} {isDebt ? 'חוב' : 'הלוואה'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-4 space-y-4">
            {/* סוג (חוב או הלוואה) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סוג</label>
              <div className="flex w-full rounded-md overflow-hidden border">
                <button
                  type="button"
                  className={`flex-1 py-2 text-center ${
                    isDebt 
                      ? 'bg-red-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setIsDebt(true)}
                >
                  חוב (אני חייב)
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 text-center ${
                    !isDebt 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setIsDebt(false)}
                >
                  הלוואה (חייבים לי)
                </button>
              </div>
            </div>
            
            {/* שם האדם */}
            <div>
              <label htmlFor="personName" className="block text-sm font-medium text-gray-700 mb-1">
                שם האדם
              </label>
              <input
                type="text"
                id="personName"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="הזן שם"
                className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
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
            
            {/* שיטת תשלום */}
            <div>
              <label htmlFor="paymentMethod" className="block text-sm font-medium text-gray-700 mb-1">
                שיטת תשלום (אופציונלי)
              </label>
              <select
                id="paymentMethod"
                value={paymentMethodId}
                onChange={(e) => setPaymentMethodId(e.target.value)}
                className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">ללא שיטת תשלום</option>
                {paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.icon} {method.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* תאריך יעד */}
            <div>
              <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
                תאריך יעד להחזר (אופציונלי)
              </label>
              <input
                type="date"
                id="dueDate"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            
            {/* הערות */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                הערות (אופציונלי)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="הוסף הערות..."
                className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 min-h-[80px]"
              />
            </div>
            
            {/* האם שולם */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPaid"
                checked={isPaid}
                onChange={(e) => setIsPaid(e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded ml-2"
              />
              <label htmlFor="isPaid" className="text-sm font-medium text-gray-700">
                {isDebt ? 'שילמתי את החוב' : 'קיבלתי את ההחזר'}
              </label>
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
              <FiCheck className="ml-1" />
              שמור
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DebtLoanModal; 