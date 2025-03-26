'use client';

import { useState } from 'react';
import { FiPlus, FiCheck, FiX, FiEdit, FiTrash2 } from 'react-icons/fi';
import { DebtLoan, PaymentMethod } from '../../types';
import DebtLoanModal from './DebtLoanModal';
import { useFinanceContext } from '../../context/FinanceContext';

const FinanceDebts = () => {
  const { 
    debtLoans, 
    paymentMethods, 
    addDebtLoan, 
    updateDebtLoan, 
    deleteDebtLoan, 
    toggleDebtLoanPaid,
    getPaymentMethodById
  } = useFinanceContext();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebtLoan, setEditingDebtLoan] = useState<DebtLoan | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'debt' | 'loan'>('all');
  
  // סינון חובות והלוואות לפי סוג
  const filteredDebtLoans = debtLoans.filter(item => {
    if (filterType === 'all') return true;
    if (filterType === 'debt') return item.isDebt;
    if (filterType === 'loan') return !item.isDebt;
    return true;
  });
  
  // מיון חובות והלוואות
  const sortedDebtLoans = [...filteredDebtLoans].sort((a, b) => {
    // תחילה לפי סטטוס התשלום (לא שולם קודם)
    if (a.isPaid !== b.isPaid) {
      return a.isPaid ? 1 : -1;
    }
    
    // אז לפי תאריך יעד (הקרוב קודם)
    if (a.dueDate && b.dueDate) {
      return a.dueDate.getTime() - b.dueDate.getTime();
    }
    
    return 0;
  });
  
  // חישוב סיכומי חובות והלוואות
  const calculateSummary = () => {
    let totalDebts = 0;
    let totalLoans = 0;
    
    debtLoans.forEach(item => {
      if (!item.isPaid) {
        if (item.isDebt) {
          totalDebts += item.amount;
        } else {
          totalLoans += item.amount;
        }
      }
    });
    
    return {
      debts: totalDebts,
      loans: totalLoans,
      balance: totalLoans - totalDebts
    };
  };
  
  const summary = calculateSummary();
  
  // פתיחת מודל להוספת חוב/הלוואה
  const openAddModal = () => {
    setEditingDebtLoan(null);
    setIsModalOpen(true);
  };
  
  // פתיחת מודל לעריכת חוב/הלוואה
  const openEditModal = (debtLoan: DebtLoan) => {
    setEditingDebtLoan(debtLoan);
    setIsModalOpen(true);
  };
  
  // הוספת או עדכון חוב/הלוואה
  const handleSaveDebtLoan = async (debtLoan: DebtLoan) => {
    if (editingDebtLoan) {
      // עדכון
      await updateDebtLoan(debtLoan);
    } else {
      // הוספה
      await addDebtLoan(debtLoan);
    }
    
    setIsModalOpen(false);
    setEditingDebtLoan(null);
  };
  
  // סימון חוב/הלוואה כשולם/לא שולם
  const handleTogglePaidStatus = async (id: string, isPaid: boolean) => {
    await toggleDebtLoanPaid(id, !isPaid);
  };
  
  // בדיקה אם התאריך עבר
  const isOverdue = (date: Date | undefined): boolean => {
    if (!date) return false;
    return date < new Date();
  };
  
  // פורמט תאריך
  const formatDate = (date: Date | undefined): string => {
    if (!date) return '-';
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };
  
  return (
    <div className="space-y-6">
      {/* כותרת וכפתור הוספה */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">חובות והלוואות</h2>
        
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center"
        >
          <FiPlus className="ml-1" />
          חדש
        </button>
      </div>
      
      {/* סיכום */}
      <div className="card bg-gray-50 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <h3 className="text-gray-600 mb-1">סה"כ חובות (אני חייב)</h3>
            <p className="text-xl font-semibold text-red-600">{summary.debts.toLocaleString()} ₪</p>
          </div>
          
          <div className="text-center">
            <h3 className="text-gray-600 mb-1">סה"כ הלוואות (חייבים לי)</h3>
            <p className="text-xl font-semibold text-green-600">{summary.loans.toLocaleString()} ₪</p>
          </div>
          
          <div className="text-center">
            <h3 className="text-gray-600 mb-1">מאזן כולל</h3>
            <p className={`text-xl font-semibold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.balance.toLocaleString()} ₪
            </p>
          </div>
        </div>
      </div>
      
      {/* מסנן */}
      <div className="flex space-x-2 space-x-reverse">
        <button
          className={`px-3 py-1 rounded-md ${filterType === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setFilterType('all')}
        >
          הכל
        </button>
        
        <button
          className={`px-3 py-1 rounded-md ${filterType === 'debt' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setFilterType('debt')}
        >
          חובות
        </button>
        
        <button
          className={`px-3 py-1 rounded-md ${filterType === 'loan' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setFilterType('loan')}
        >
          הלוואות
        </button>
      </div>
      
      {/* רשימת חובות והלוואות */}
      <div className="space-y-3">
        {sortedDebtLoans.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            אין {filterType === 'all' ? 'חובות והלוואות' : filterType === 'debt' ? 'חובות' : 'הלוואות'} להצגה
          </div>
        ) : (
          sortedDebtLoans.map(item => {
            const paymentMethod = item.paymentMethodId ? getPaymentMethodById(item.paymentMethodId) : undefined;
            return (
              <div 
                key={item.id} 
                className={`card p-4 border-r-4 ${
                  item.isPaid 
                    ? 'border-gray-300 bg-gray-50' 
                    : item.isDebt 
                      ? 'border-red-500' 
                      : 'border-green-500'
                } transition-all hover:shadow-md`}
              >
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <h3 className={`font-semibold text-lg ${item.isPaid ? 'text-gray-500' : ''}`}>
                        {item.personName}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.isPaid
                          ? 'bg-gray-200 text-gray-700'
                          : item.isDebt
                            ? 'bg-red-100 text-red-700'
                            : 'bg-green-100 text-green-700'
                      }`}>
                        {item.isPaid ? 'שולם' : item.isDebt ? 'אני חייב' : 'חייבים לי'}
                      </span>
                      
                      {!item.isPaid && item.dueDate && isOverdue(item.dueDate) && (
                        <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">
                          איחור
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 flex items-center space-x-3 space-x-reverse text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className={`font-semibold ${item.isPaid ? 'text-gray-500' : item.isDebt ? 'text-red-600' : 'text-green-600'}`}>
                          {item.amount.toLocaleString()} ₪
                        </span>
                      </div>
                      
                      {item.dueDate && (
                        <div className="flex items-center">
                          <span>תאריך יעד: </span>
                          <span className={`mr-1 ${!item.isPaid && isOverdue(item.dueDate) ? 'text-red-600 font-semibold' : ''}`}>
                            {formatDate(item.dueDate)}
                          </span>
                        </div>
                      )}
                      
                      {paymentMethod && (
                        <div className="flex items-center">
                          <span>אמצעי תשלום: </span>
                          <span className="mr-1 flex items-center">
                            <span style={{ color: paymentMethod.color }} className="ml-1">{paymentMethod.icon}</span>
                            {paymentMethod.name}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {item.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        {item.notes}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col space-y-1 self-start">
                    <button
                      onClick={() => handleTogglePaidStatus(item.id, item.isPaid)}
                      className={`p-1.5 rounded-full ${
                        item.isPaid
                          ? 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                      title={item.isPaid ? 'סמן כלא שולם' : 'סמן כשולם'}
                    >
                      {item.isPaid ? <FiX size={16} /> : <FiCheck size={16} />}
                    </button>
                    
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 rounded-full bg-gray-100 text-blue-600 hover:bg-gray-200"
                      title="ערוך"
                    >
                      <FiEdit size={16} />
                    </button>
                    
                    <button
                      onClick={() => deleteDebtLoan(item.id)}
                      className="p-1.5 rounded-full bg-gray-100 text-red-600 hover:bg-gray-200"
                      title="מחק"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* מודל הוספה/עריכה */}
      {isModalOpen && (
        <DebtLoanModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingDebtLoan(null);
          }}
          onSave={handleSaveDebtLoan}
          debtLoan={editingDebtLoan}
          paymentMethods={paymentMethods}
        />
      )}
    </div>
  );
};

export default FinanceDebts; 