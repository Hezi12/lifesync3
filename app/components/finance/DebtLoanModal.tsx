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
    dueDate: null,
    notes: '',
    paymentMethodId: '',
    isDebt: true,
    isPaid: false,
    affectsBalance: false
  });
  const [isMobile, setIsMobile] = useState(false);

  // זיהוי גודל המסך
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // בדיקה ראשונית
    checkIfMobile();
    
    // האזנה לשינויים בגודל המסך
    window.addEventListener('resize', checkIfMobile);
    
    // ניקוי
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // איתחול הטופס עם נתוני החוב/הלוואה הקיימים, אם יש
  useEffect(() => {
    if (debtLoan) {
      // וודא שה-dueDate לא undefined
      const safeDueDate = debtLoan.dueDate || null;
      setFormData({ 
        ...debtLoan, 
        dueDate: safeDueDate,
        // אם החוב/הלוואה נוצרו לפני הוספת השדה החדש, נאתחל אותו לfalse כברירת מחדל
        affectsBalance: debtLoan.affectsBalance !== undefined ? debtLoan.affectsBalance : false 
      });
    } else {
      // איתחול הטופס לחוב/הלוואה חדש/ה
      setFormData({
        id: uuidv4(),
        personName: '',
        amount: 0,
        dueDate: null,
        notes: '',
        paymentMethodId: paymentMethods.length > 0 ? paymentMethods[0].id : '',
        isDebt: true,
        isPaid: false,
        affectsBalance: false
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
    
    // וודא שאין שדות undefined לפני שליחה לפיירבייס
    const processedData = {
      ...formData,
      dueDate: formData.dueDate || null,
      notes: formData.notes || '',
      paymentMethodId: formData.paymentMethodId || '',
      affectsBalance: !!formData.affectsBalance
    };
    
    onSave(processedData);
  };
  
  // אם המודל סגור, לא מציגים כלום
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex justify-center items-center p-2 sm:p-4">
      <div className="bg-white rounded-lg w-full max-w-md sm:max-w-lg">
        <div className="flex justify-between items-center p-3 sm:p-4 border-b">
          <h2 className="text-lg sm:text-xl font-medium">
            {debtLoan ? 'עריכת חוב/הלוואה' : 'הוספת חוב/הלוואה חדש/ה'}
          </h2>
          <button
            className="text-gray-400 hover:text-gray-600 p-1"
            onClick={onClose}
            aria-label="סגור"
          >
            <FiX size={isMobile ? 20 : 24} />
          </button>
        </div>
        
        <div className="p-3 sm:p-4 max-h-[calc(100vh-150px)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
          {/* סוג: חוב או הלוואה */}
          <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">סוג:</label>
            <div className="flex">
              <button
                type="button"
                  className={`flex-1 py-1.5 sm:py-2 border-l text-xs sm:text-sm ${
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
                  className={`flex-1 py-1.5 sm:py-2 text-xs sm:text-sm ${
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
              <label htmlFor="personName" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              שם {formData.isDebt ? 'הנושה' : 'הלווה'}:
            </label>
            <input
              type="text"
              id="personName"
              value={formData.personName}
              onChange={(e) => handleChange('personName', e.target.value)}
                className="w-full p-1.5 sm:p-2 border rounded-md text-sm"
              required
            />
          </div>
          
          {/* סכום */}
          <div>
              <label htmlFor="amount" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              סכום:
            </label>
            <div className="relative">
              <input
                type="number"
                id="amount"
                  inputMode="decimal"
                value={formData.amount}
                onChange={(e) => handleChange('amount', Number(e.target.value))}
                  className="w-full p-1.5 sm:p-2 border rounded-md pl-7 sm:pl-8 text-sm"
                min="0"
                step="0.01"
                required
              />
                <span className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 text-xs sm:text-sm">₪</span>
            </div>
          </div>
          
          {/* תאריך יעד */}
          <div>
              <label htmlFor="dueDate" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              תאריך יעד לתשלום (לא חובה):
            </label>
            <input
              type="date"
              id="dueDate"
              value={formData.dueDate ? new Date(formData.dueDate).toISOString().split('T')[0] : ''}
              onChange={(e) => {
                // המר את התאריך לאובייקט Date או null אם ריק
                const value = e.target.value ? new Date(e.target.value) : null;
                handleChange('dueDate', value);
              }}
                className="w-full p-1.5 sm:p-2 border rounded-md text-sm"
            />
          </div>
          
          {/* שיטת תשלום */}
          <div>
              <label htmlFor="paymentMethodId" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              אמצעי תשלום (לא חובה):
            </label>
            <select
              id="paymentMethodId"
              value={formData.paymentMethodId || ''}
              onChange={(e) => handleChange('paymentMethodId', e.target.value || '')}
                className="w-full p-1.5 sm:p-2 border rounded-md text-sm"
            >
              <option value="">-- ללא אמצעי תשלום --</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.icon} {method.name}
                </option>
              ))}
            </select>
          </div>
            
            {/* השפעה על יתרת אמצעי תשלום - מוצג רק אם נבחר אמצעי תשלום */}
            {formData.paymentMethodId && (
              <div className="bg-blue-50 p-2 sm:p-3 rounded-md border border-blue-100">
                <div className="flex items-start mb-1">
                  <input
                    type="checkbox"
                    id="affectsBalance"
                    checked={formData.affectsBalance}
                    onChange={(e) => handleChange('affectsBalance', e.target.checked)}
                    className="h-4 w-4 mt-0.5 sm:mt-1 text-primary-600 border-gray-300 rounded"
                  />
                  <label htmlFor="affectsBalance" className="mr-2 block text-2xs sm:text-sm font-medium text-gray-700">
                    {formData.isDebt 
                      ? 'הגדל את היתרה באמצעי התשלום כשאלווה' 
                      : 'הפחת את היתרה באמצעי התשלום כשאלווה'}
                  </label>
                </div>
                <p className="text-2xs sm:text-xs text-gray-500 mr-6">
                  {formData.isDebt 
                    ? 'כאשר תסמן אפשרות זו, כסף שאתה לווה יתווסף ליתרת אמצעי התשלום הנבחר.' 
                    : 'כאשר תסמן אפשרות זו, כסף שאתה מלווה יופחת מיתרת אמצעי התשלום הנבחר.'}
                </p>
              </div>
            )}
          
          {/* הערות */}
          <div>
              <label htmlFor="notes" className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
              הערות (לא חובה):
            </label>
            <textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
                className="w-full p-1.5 sm:p-2 border rounded-md text-sm"
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
              <label htmlFor="isPaid" className="mr-2 block text-xs sm:text-sm text-gray-700">
              שולם
            </label>
          </div>
          
          {/* כפתורי פעולה */}
            <div className="flex justify-end gap-2 pt-3 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
                className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
            >
              ביטול
            </button>
            
            <button
              type="submit"
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-xs sm:text-sm"
              disabled={!formData.personName || formData.amount <= 0}
            >
              {debtLoan ? 'עדכון' : 'הוספה'}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default DebtLoanModal; 