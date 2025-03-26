'use client';

import { useState } from 'react';
import { FiArrowUp, FiArrowDown, FiPlus, FiFilter, FiSearch, FiChevronLeft, FiChevronRight, FiTrash2 } from 'react-icons/fi';
import { Transaction, PaymentMethod, FinancialCategory } from '../../types';
import TransactionModal from './TransactionModal';
import TransactionChart from './TransactionChart';
import { useFinanceContext } from '../../context/FinanceContext';

const FinanceTransactions = () => {
  const { 
    transactions, 
    paymentMethods, 
    categories, 
    addTransaction, 
    updateTransaction, 
    deleteTransaction,
    getPaymentMethodById,
    getCategoryById,
    recalculateBalances
  } = useFinanceContext();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  
  // פילטור עסקאות לפי חודש נוכחי
  const filteredTransactionsByMonth = transactions.filter(transaction => {
    const transactionMonth = transaction.date.getMonth();
    const transactionYear = transaction.date.getFullYear();
    
    return (
      transactionMonth === currentMonth.getMonth() &&
      transactionYear === currentMonth.getFullYear()
    );
  });
  
  // פילטור עסקאות לפי סוג וחיפוש
  const filteredTransactions = filteredTransactionsByMonth.filter(transaction => {
    const matchesType = filterType === 'all' || transaction.type === filterType;
    
    const matchesSearch = searchQuery
      ? transaction.description.toLowerCase().includes(searchQuery.toLowerCase())
      : true;
    
    return matchesType && matchesSearch;
  });
  
  // מיון עסקאות לפי תאריך (מהחדש לישן)
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    return b.date.getTime() - a.date.getTime();
  });
  
  // חישוב סיכומי הכנסות והוצאות
  const calculateSummary = () => {
    let totalIncome = 0;
    let totalExpense = 0;
    
    filteredTransactionsByMonth.forEach(transaction => {
      if (transaction.type === 'income') {
        totalIncome += transaction.amount;
      } else {
        totalExpense += transaction.amount;
      }
    });
    
    return {
      income: totalIncome,
      expense: totalExpense,
      balance: totalIncome - totalExpense
    };
  };
  
  const summary = calculateSummary();
  
  // ניווט בין חודשים
  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };
  
  const goToPreviousMonth = () => {
    const previousMonth = new Date(currentMonth);
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    setCurrentMonth(previousMonth);
  };
  
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };
  
  // פורמט של חודש ושנה
  const formatMonthYear = (): string => {
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    const monthName = months[currentMonth.getMonth()];
    const year = currentMonth.getFullYear();
    
    return `${monthName} ${year}`;
  };
  
  // פתיחת מודל להוספת עסקה
  const openAddModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };
  
  // פתיחת מודל לעריכת עסקה
  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };
  
  // הוספה או עדכון של עסקה
  const handleSaveTransaction = async (transaction: Transaction) => {
    if (editingTransaction) {
      // עדכון
      await updateTransaction(transaction);
    } else {
      // הוספה
      await addTransaction(transaction);
    }
    
    setIsModalOpen(false);
    setEditingTransaction(null);
  };
  
  // סינון עסקאות לפי קטגוריה ויצירת נתונים לתרשים
  const getTransactionsByCategory = (type: 'income' | 'expense') => {
    const categoryMap = new Map<string, number>();
    
    filteredTransactionsByMonth
      .filter(transaction => transaction.type === type)
      .forEach(transaction => {
        const categoryId = transaction.categoryId;
        const currentAmount = categoryMap.get(categoryId) || 0;
        categoryMap.set(categoryId, currentAmount + transaction.amount);
      });
    
    const data: { name: string; value: number; color: string }[] = [];
    
    Array.from(categoryMap.entries()).forEach(([categoryId, amount]) => {
      const category = getCategoryById(categoryId);
      
      if (category) {
        data.push({
          name: category.name,
          value: amount,
          color: category.color
        });
      }
    });
    
    return data;
  };
  
  // נתונים לתרשימים
  const incomeData = getTransactionsByCategory('income');
  const expenseData = getTransactionsByCategory('expense');
  
  // פורמט תאריך
  const formatDate = (date: Date): string => {
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };
  
  // מחיקת עסקה
  const handleDeleteTransaction = async (id: string) => {
    try {
      await deleteTransaction(id);
      // חישוב מחדש של היתרות אחרי המחיקה
      recalculateBalances();
    } catch (error) {
      console.error('שגיאה במחיקת העסקה:', error);
      alert('אירעה שגיאה במחיקת העסקה');
    }
  };
  
  return (
    <div className="space-y-6">
      {/* כותרת, ניווט בין חודשים וכפתור הוספה */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4 space-x-reverse">
          <button
            onClick={goToPreviousMonth}
            className="p-1 rounded-full hover:bg-gray-100"
            title="חודש קודם"
          >
            <FiChevronRight size={20} />
          </button>
          
          <h2 className="text-xl font-semibold">{formatMonthYear()}</h2>
          
          <button
            onClick={goToNextMonth}
            className="p-1 rounded-full hover:bg-gray-100"
            title="חודש הבא"
          >
            <FiChevronLeft size={20} />
          </button>
          
          <button
            onClick={goToCurrentMonth}
            className="text-sm text-primary-600 hover:underline"
          >
            החודש הנוכחי
          </button>
        </div>
        
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center"
        >
          <FiPlus className="ml-1" />
          עסקה חדשה
        </button>
      </div>
      
      {/* סיכום */}
      <div className="card bg-gray-50 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <h3 className="text-gray-600 mb-1">סה"כ הכנסות</h3>
            <p className="text-xl font-semibold text-green-600">{summary.income.toLocaleString()} ₪</p>
          </div>
          
          <div className="text-center">
            <h3 className="text-gray-600 mb-1">סה"כ הוצאות</h3>
            <p className="text-xl font-semibold text-red-600">{summary.expense.toLocaleString()} ₪</p>
          </div>
          
          <div className="text-center">
            <h3 className="text-gray-600 mb-1">מאזן חודשי</h3>
            <p className={`text-xl font-semibold ${summary.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {summary.balance.toLocaleString()} ₪
            </p>
          </div>
        </div>
      </div>
      
      {/* תרשימים */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">התפלגות הכנסות</h3>
          {incomeData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-500">
              אין נתוני הכנסות לחודש זה
            </div>
          ) : (
            <div className="h-52">
              <TransactionChart data={incomeData} />
            </div>
          )}
        </div>
        
        <div className="card p-4">
          <h3 className="text-lg font-semibold mb-3">התפלגות הוצאות</h3>
          {expenseData.length === 0 ? (
            <div className="h-52 flex items-center justify-center text-gray-500">
              אין נתוני הוצאות לחודש זה
            </div>
          ) : (
            <div className="h-52">
              <TransactionChart data={expenseData} />
            </div>
          )}
        </div>
      </div>
      
      {/* חיפוש ומסנן */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div className="flex space-x-2 space-x-reverse">
          <button
            className={`px-3 py-1 rounded-md ${filterType === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setFilterType('all')}
          >
            הכל
          </button>
          
          <button
            className={`px-3 py-1 rounded-md ${filterType === 'income' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setFilterType('income')}
          >
            הכנסות
          </button>
          
          <button
            className={`px-3 py-1 rounded-md ${filterType === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}
            onClick={() => setFilterType('expense')}
          >
            הוצאות
          </button>
        </div>
        
        <div className="relative">
          <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="חיפוש לפי תיאור..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-3 pr-10 py-2 border rounded-md w-full md:w-64"
          />
        </div>
      </div>
      
      {/* רשימת עסקאות */}
      <div className="space-y-3">
        {sortedTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            אין עסקאות להצגה בחודש זה
          </div>
        ) : (
          sortedTransactions.map(transaction => {
            const category = getCategoryById(transaction.categoryId);
            const paymentMethod = getPaymentMethodById(transaction.paymentMethodId);
            
            return (
              <div 
                key={transaction.id} 
                className={`card p-4 border-r-4 ${
                  transaction.type === 'income' ? 'border-green-500' : 'border-red-500'
                } transition-all hover:shadow-md`}
                onClick={() => openEditModal(transaction)}
              >
                <div className="flex justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <h3 className="font-semibold text-lg">{transaction.description}</h3>
                      
                      {category && (
                        <span 
                          className="text-xs px-2 py-0.5 rounded-full flex items-center" 
                          style={{ backgroundColor: `${category.color}25`, color: category.color }}
                        >
                          <span className="ml-1">{category.icon}</span>
                          {category.name}
                        </span>
                      )}
                    </div>
                    
                    <div className="mt-1 flex items-center space-x-3 space-x-reverse text-sm text-gray-600">
                      <div className="flex items-center">
                        <span className={transaction.type === 'income' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                          {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()} ₪
                        </span>
                      </div>
                      
                      <div className="flex items-center">
                        <span>{formatDate(transaction.date)}</span>
                      </div>
                      
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
                  </div>
                  
                  <div className="flex flex-col items-center justify-center">
                    <span className={`text-2xl ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                      {transaction.type === 'income' ? <FiArrowUp /> : <FiArrowDown />}
                    </span>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // מניעת הפעלת האירוע של הדיב הראשי
                        handleDeleteTransaction(transaction.id);
                      }}
                      className="mt-2 p-1.5 rounded-full bg-gray-100 text-red-600 hover:bg-gray-200"
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
        <TransactionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setEditingTransaction(null);
          }}
          onSave={handleSaveTransaction}
          transaction={editingTransaction}
          paymentMethods={paymentMethods}
          categories={categories}
        />
      )}
    </div>
  );
};

export default FinanceTransactions; 