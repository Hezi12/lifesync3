'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiCheck, FiX, FiEdit, FiTrash2 } from 'react-icons/fi';
import { DebtLoan, PaymentMethod } from '../../types';
import DebtLoanModal from './DebtLoanModal';

const FinanceDebts = () => {
  const [debtLoans, setDebtLoans] = useState<DebtLoan[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebtLoan, setEditingDebtLoan] = useState<DebtLoan | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'debt' | 'loan'>('all');
  
  // טעינת נתונים מ-localStorage
  useEffect(() => {
    // טעינת שיטות תשלום מ-localStorage
    const savedPaymentMethods = localStorage.getItem('paymentMethods');
    if (savedPaymentMethods) {
      try {
        setPaymentMethods(JSON.parse(savedPaymentMethods));
      } catch (error) {
        console.error('שגיאה בטעינת שיטות תשלום:', error);
        createDefaultPaymentMethods();
      }
    } else {
      createDefaultPaymentMethods();
    }
    
    // טעינת חובות והלוואות מ-localStorage
    const savedDebtLoans = localStorage.getItem('debtLoans');
    if (savedDebtLoans) {
      try {
        // המרת תאריכים ממחרוזות לאובייקטי Date
        const parsedDebtLoans = JSON.parse(savedDebtLoans, (key, value) => {
          if (key === 'dueDate' && value) {
            return new Date(value);
          }
          return value;
        });
        setDebtLoans(parsedDebtLoans);
      } catch (error) {
        console.error('שגיאה בטעינת חובות והלוואות:', error);
        createDefaultDebtLoans();
      }
    } else {
      createDefaultDebtLoans();
    }
  }, []);
  
  // שמירת חובות והלוואות ב-localStorage בכל פעם שיש שינוי
  useEffect(() => {
    if (debtLoans.length > 0 || localStorage.getItem('debtLoans')) {
      localStorage.setItem('debtLoans', JSON.stringify(debtLoans));
      
      // שליחת אירוע מותאם אישית לעדכון כל הרכיבים באתר
      const event = new CustomEvent('debtLoans-updated', { 
        detail: { debtLoans }
      });
      window.dispatchEvent(event);
    }
  }, [debtLoans]);
  
  // יצירת שיטות תשלום ברירת מחדל
  const createDefaultPaymentMethods = () => {
    const samplePaymentMethods: PaymentMethod[] = [
      {
        id: '1',
        name: 'מזומן',
        icon: '💵',
        color: '#4CAF50',
        initialBalance: 1000,
        currentBalance: 800
      },
      {
        id: '2',
        name: 'אשראי',
        icon: '💳',
        color: '#2196F3',
        initialBalance: 2000,
        currentBalance: 1500
      },
      {
        id: '3',
        name: 'PayPal',
        icon: '🌐',
        color: '#9C27B0',
        initialBalance: 500,
        currentBalance: 700
      }
    ];
    
    setPaymentMethods(samplePaymentMethods);
    localStorage.setItem('paymentMethods', JSON.stringify(samplePaymentMethods));
  };
  
  // יצירת חובות והלוואות ברירת מחדל
  const createDefaultDebtLoans = () => {
    const sampleDebtLoans: DebtLoan[] = [
      {
        id: '1',
        personName: 'אמא',
        amount: 300,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 15)),
        paymentMethodId: '1',
        isDebt: true,
        isPaid: false,
        notes: 'קניות לבית'
      },
      {
        id: '2',
        personName: 'יוסי',
        amount: 500,
        dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
        paymentMethodId: '3',
        isDebt: false,
        isPaid: false,
        notes: 'הלוואה לחתונה'
      },
      {
        id: '3',
        personName: 'שירה',
        amount: 200,
        dueDate: new Date(new Date().setDate(new Date().getDate() - 5)),
        paymentMethodId: '2',
        isDebt: true,
        isPaid: true,
        notes: 'ארוחת ערב'
      }
    ];
    
    setDebtLoans(sampleDebtLoans);
    localStorage.setItem('debtLoans', JSON.stringify(sampleDebtLoans));
  };
  
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
  const handleSaveDebtLoan = (debtLoan: DebtLoan) => {
    if (editingDebtLoan) {
      // עדכון
      setDebtLoans(debtLoans.map(item => 
        item.id === debtLoan.id ? debtLoan : item
      ));
    } else {
      // הוספה
      setDebtLoans([...debtLoans, debtLoan]);
    }
    
    setIsModalOpen(false);
    setEditingDebtLoan(null);
  };
  
  // מחיקת חוב/הלוואה - ישירות ללא אישור
  const deleteDebtLoan = (id: string) => {
    setDebtLoans(debtLoans.filter(item => item.id !== id));
  };
  
  // סימון חוב/הלוואה כשולם/לא שולם
  const togglePaidStatus = (id: string) => {
    setDebtLoans(debtLoans.map(item => 
      item.id === id ? { ...item, isPaid: !item.isPaid } : item
    ));
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-red-50">
          <h3 className="text-sm font-medium text-gray-500">חובות (אני חייב)</h3>
          <p className="text-2xl font-bold text-red-600">₪{summary.debts.toLocaleString()}</p>
        </div>
        
        <div className="card bg-green-50">
          <h3 className="text-sm font-medium text-gray-500">הלוואות (חייבים לי)</h3>
          <p className="text-2xl font-bold text-green-600">₪{summary.loans.toLocaleString()}</p>
        </div>
        
        <div className={`card ${summary.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <h3 className="text-sm font-medium text-gray-500">מאזן</h3>
          <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            ₪{summary.balance.toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* רשימת חובות והלוואות */}
      <div className="card">
        <div className="flex justify-end mb-4">
          <div className="flex bg-gray-100 rounded-md">
            <button
              className={`px-3 py-1 text-sm rounded-r-md ${filterType === 'all' ? 'bg-primary-500 text-white' : ''}`}
              onClick={() => setFilterType('all')}
            >
              הכל
            </button>
            <button
              className={`px-3 py-1 text-sm ${filterType === 'debt' ? 'bg-primary-500 text-white' : ''}`}
              onClick={() => setFilterType('debt')}
            >
              חובות
            </button>
            <button
              className={`px-3 py-1 text-sm rounded-l-md ${filterType === 'loan' ? 'bg-primary-500 text-white' : ''}`}
              onClick={() => setFilterType('loan')}
            >
              הלוואות
            </button>
          </div>
        </div>
        
        <div className="space-y-3">
          {sortedDebtLoans.length > 0 ? (
            sortedDebtLoans.map((item) => {
              const paymentMethod = paymentMethods.find(m => m.id === item.paymentMethodId);
              const overdue = !item.isPaid && isOverdue(item.dueDate);
              
              return (
                <div 
                  key={item.id} 
                  className={`p-4 border rounded-md ${
                    item.isPaid ? 'bg-gray-50 border-gray-200' : overdue ? 'border-red-300' : 'border-gray-200'
                  }`}
                >
                  <div className="flex justify-between mb-2">
                    <div className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-2 ${
                        item.isDebt ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                      }`}>
                        {item.isDebt ? '↑' : '↓'}
                      </div>
                      <div>
                        <h3 className="font-medium flex items-center">
                          {item.personName}
                          {item.isPaid && (
                            <span className="mr-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                              שולם
                            </span>
                          )}
                          {overdue && (
                            <span className="mr-2 text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                              באיחור
                            </span>
                          )}
                        </h3>
                        <div className="text-sm text-gray-500">
                          {item.dueDate && (
                            <span className="ml-2">תאריך יעד: {formatDate(item.dueDate)}</span>
                          )}
                          {paymentMethod && (
                            <span>אמצעי תשלום: {paymentMethod.name}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-center">
                      <div className={`text-lg font-semibold ${
                        item.isDebt ? 'text-red-600' : 'text-green-600'
                      }`}>
                        {item.isDebt ? '-' : '+'}₪{item.amount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  {item.notes && (
                    <div className="text-sm text-gray-600 mb-2 bg-gray-50 p-2 rounded border">
                      {item.notes}
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 space-x-reverse">
                    <button
                      onClick={() => togglePaidStatus(item.id)}
                      className={`p-1.5 rounded-md ${
                        item.isPaid 
                          ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                          : 'bg-green-100 text-green-600 hover:bg-green-200'
                      }`}
                      title={item.isPaid ? 'סמן כלא שולם' : 'סמן כשולם'}
                    >
                      {item.isPaid ? <FiX /> : <FiCheck />}
                    </button>
                    
                    <button
                      onClick={() => openEditModal(item)}
                      className="p-1.5 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                      title="ערוך"
                    >
                      <FiEdit />
                    </button>
                    
                    <button
                      onClick={() => deleteDebtLoan(item.id)}
                      className="p-1.5 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                      title="מחק"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 py-4">אין חובות או הלוואות</p>
          )}
        </div>
      </div>
      
      {/* מודל להוספת/עריכת חוב/הלוואה */}
      {isModalOpen && (
        <DebtLoanModal
          onClose={() => {
            setIsModalOpen(false);
            setEditingDebtLoan(null);
          }}
          onSave={handleSaveDebtLoan}
          paymentMethods={paymentMethods}
          debtLoan={editingDebtLoan}
        />
      )}
    </div>
  );
};

export default FinanceDebts; 