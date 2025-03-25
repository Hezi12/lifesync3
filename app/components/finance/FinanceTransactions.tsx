'use client';

import { useState, useEffect } from 'react';
import { FiArrowUp, FiArrowDown, FiPlus, FiFilter, FiSearch, FiChevronLeft, FiChevronRight, FiTrash2 } from 'react-icons/fi';
import { Transaction, PaymentMethod, FinancialCategory } from '../../types';
import TransactionModal from './TransactionModal';
import TransactionChart from './TransactionChart';

const FinanceTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // טעינת נתונים מ-localStorage
  useEffect(() => {
    // טעינת שיטות תשלום
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
    
    // טעינת קטגוריות
    const savedCategories = localStorage.getItem('financialCategories');
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch (error) {
        console.error('שגיאה בטעינת קטגוריות:', error);
        createDefaultCategories();
      }
    } else {
      createDefaultCategories();
    }
    
    // טעינת עסקאות
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      try {
        // המרת תאריכים ממחרוזות לאובייקטי Date
        const parsedTransactions = JSON.parse(savedTransactions, (key, value) => {
          if (key === 'date') {
            return new Date(value);
          }
          return value;
        });
        setTransactions(parsedTransactions);
      } catch (error) {
        console.error('שגיאה בטעינת עסקאות:', error);
        createSampleTransactions();
      }
    } else {
      createSampleTransactions();
    }
  }, []);
  
  // שמירת עסקאות ב-localStorage בכל פעם שיש שינוי
  useEffect(() => {
    if (transactions.length > 0) {
      localStorage.setItem('transactions', JSON.stringify(transactions));
      
      // שליחת אירוע מותאם אישית לעדכון כל הרכיבים באתר
      const event = new CustomEvent('transactions-updated', { 
        detail: { transactions }
      });
      window.dispatchEvent(event);
    }
  }, [transactions]);
  
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
  };
  
  // יצירת קטגוריות ברירת מחדל
  const createDefaultCategories = () => {
    const sampleCategories: FinancialCategory[] = [
      {
        id: 'salary',
        name: 'משכורת',
        icon: '💼',
        color: '#4CAF50',
        type: 'income'
      },
      {
        id: 'bonus',
        name: 'בונוס',
        icon: '🎁',
        color: '#8BC34A',
        type: 'income'
      },
      {
        id: 'rent',
        name: 'שכר דירה',
        icon: '🏠',
        color: '#F44336',
        type: 'expense'
      },
      {
        id: 'food',
        name: 'מזון',
        icon: '🍕',
        color: '#FF9800',
        type: 'expense'
      },
      {
        id: 'entertainment',
        name: 'בידור',
        icon: '🎬',
        color: '#9C27B0',
        type: 'expense'
      },
      {
        id: 'utilities',
        name: 'חשבונות',
        icon: '💡',
        color: '#2196F3',
        type: 'expense'
      }
    ];
    
    setCategories(sampleCategories);
  };
  
  // יצירת עסקאות דוגמאיות
  const createSampleTransactions = () => {
    // בדיקה אם יש כבר עסקאות ב-localStorage - אם יש, לא נייצר חדשות
    const existingTransactionsJson = localStorage.getItem('transactions');
    if (existingTransactionsJson) {
      try {
        const existingTransactions = JSON.parse(existingTransactionsJson, (key, value) => {
          if (key === 'date') return new Date(value);
          return value;
        });
        
        if (existingTransactions && existingTransactions.length > 0) {
          // יש עסקאות קיימות, נשתמש בהן
          setTransactions(existingTransactions);
          return;
        }
      } catch (error) {
        console.error('שגיאה בטעינת עסקאות קיימות:', error);
        // נמשיך לייצר עסקאות דוגמאיות במקרה של שגיאה
      }
    }
    
    // יצירת עסקאות דוגמאיות רק אם אין קיימות
    const sampleTransactions: Transaction[] = [];
    const today = new Date();
    const thisMonth = today.getMonth();
    const thisYear = today.getFullYear();
    
    // הכנסות
    sampleTransactions.push({
      id: '1',
      amount: 5000,
      date: new Date(thisYear, thisMonth, 10),
      categoryId: 'salary',
      paymentMethodId: '2',
      description: 'משכורת חודשית',
      type: 'income'
    });
    
    sampleTransactions.push({
      id: '2',
      amount: 500,
      date: new Date(thisYear, thisMonth, 15),
      categoryId: 'bonus',
      paymentMethodId: '3',
      description: 'בונוס מהעבודה',
      type: 'income'
    });
    
    // הוצאות
    sampleTransactions.push({
      id: '3',
      amount: 1500,
      date: new Date(thisYear, thisMonth, 5),
      categoryId: 'rent',
      paymentMethodId: '2',
      description: 'שכר דירה',
      type: 'expense'
    });
    
    sampleTransactions.push({
      id: '4',
      amount: 200,
      date: new Date(thisYear, thisMonth, 8),
      categoryId: 'food',
      paymentMethodId: '1',
      description: 'קניות בסופר',
      type: 'expense'
    });
    
    sampleTransactions.push({
      id: '5',
      amount: 100,
      date: new Date(thisYear, thisMonth, 12),
      categoryId: 'entertainment',
      paymentMethodId: '1',
      description: 'סרט וארוחה',
      type: 'expense'
    });
    
    sampleTransactions.push({
      id: '6',
      amount: 300,
      date: new Date(thisYear, thisMonth, 18),
      categoryId: 'utilities',
      paymentMethodId: '3',
      description: 'חשבון חשמל',
      type: 'expense'
    });
    
    sampleTransactions.push({
      id: '7',
      amount: 150,
      date: new Date(thisYear, thisMonth, 20),
      categoryId: 'food',
      paymentMethodId: '1',
      description: 'קניות בסופר',
      type: 'expense'
    });
    
    sampleTransactions.push({
      id: '8',
      amount: 50,
      date: new Date(thisYear, thisMonth, 22),
      categoryId: 'entertainment',
      paymentMethodId: '1',
      description: 'ספר חדש',
      type: 'expense'
    });
    
    // לא נוסיף יותר את העסקה הקבועה מהחודש הקודם שגורמת לשגיאה
    
    setTransactions(sampleTransactions);
    localStorage.setItem('transactions', JSON.stringify(sampleTransactions));
  };
  
  // מחיקת עסקה - ישירות ללא אישור
  const deleteTransaction = (id: string) => {
    const updatedTransactions = transactions.filter(transaction => transaction.id !== id);
    setTransactions(updatedTransactions);
    
    // שמירה מיידית ב-localStorage
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
    
    // שליחת אירוע עדכון
    const event = new CustomEvent('transactions-updated', { 
      detail: { transactions: updatedTransactions }
    });
    window.dispatchEvent(event);
  };
  
  // סינון עסקאות לפי חודש
  const filteredTransactionsByMonth = transactions.filter(transaction => {
    return transaction.date.getMonth() === currentMonth.getMonth() &&
           transaction.date.getFullYear() === currentMonth.getFullYear();
  });
  
  // סינון עסקאות לפי סוג ומטרת חיפוש
  const filteredTransactions = filteredTransactionsByMonth.filter(transaction => {
    // סינון לפי סוג
    if (filterType !== 'all' && transaction.type !== filterType) {
      return false;
    }
    
    // סינון לפי חיפוש
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const description = transaction.description.toLowerCase();
      const category = categories.find(c => c.id === transaction.categoryId)?.name.toLowerCase() || '';
      const method = paymentMethods.find(m => m.id === transaction.paymentMethodId)?.name.toLowerCase() || '';
      
      return description.includes(query) || category.includes(query) || method.includes(query);
    }
    
    return true;
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
  
  // התקדמות לחודש הבא
  const goToNextMonth = () => {
    const nextMonth = new Date(currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  };
  
  // חזרה לחודש הקודם
  const goToPreviousMonth = () => {
    const prevMonth = new Date(currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  };
  
  // קפיצה לחודש הנוכחי
  const goToCurrentMonth = () => {
    setCurrentMonth(new Date());
  };
  
  // פורמט שם החודש והשנה
  const formatMonthYear = (): string => {
    const months = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];
    const month = months[currentMonth.getMonth()];
    const year = currentMonth.getFullYear();
    
    return `${month} ${year}`;
  };
  
  // פתיחת מודל להוספת עסקה
  const openTransactionModal = () => {
    setIsModalOpen(true);
  };
  
  // טיפול בהוספת עסקה חדשה
  const handleAddTransaction = (transaction: Transaction) => {
    setTransactions([...transactions, transaction]);
    setIsModalOpen(false);
  };
  
  // חישוב עסקאות לפי קטגוריות לתרשים עוגה
  const getTransactionsByCategory = (type: 'income' | 'expense') => {
    const categoryTotals: { [key: string]: number } = {};
    
    filteredTransactionsByMonth.forEach(transaction => {
      if (transaction.type === type) {
        const { categoryId, amount } = transaction;
        categoryTotals[categoryId] = (categoryTotals[categoryId] || 0) + amount;
      }
    });
    
    return Object.entries(categoryTotals).map(([categoryId, amount]) => {
      const category = categories.find(c => c.id === categoryId);
      return {
        id: categoryId,
        name: category?.name || 'קטגוריה לא ידועה',
        value: amount,
        color: category?.color || '#999999'
      };
    });
  };
  
  const incomeByCategory = getTransactionsByCategory('income');
  const expenseByCategory = getTransactionsByCategory('expense');
  
  return (
    <div className="space-y-6">
      {/* כותרת וכפתור הוספה */}
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiChevronRight className="h-5 w-5 text-gray-600" />
          </button>
          
          <h2 className="text-xl font-semibold mx-4">{formatMonthYear()}</h2>
          
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <button
            onClick={goToCurrentMonth}
            className="ml-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            חודש נוכחי
          </button>
        </div>
        
        <button
          onClick={openTransactionModal}
          className="btn-primary flex items-center"
        >
          <FiPlus className="ml-1" />
          עסקה חדשה
        </button>
      </div>
      
      {/* סיכום חודשי */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-green-50">
          <h3 className="text-sm font-medium text-gray-500">הכנסות</h3>
          <p className="text-2xl font-bold text-green-600">₪{summary.income.toLocaleString()}</p>
        </div>
        
        <div className="card bg-red-50">
          <h3 className="text-sm font-medium text-gray-500">הוצאות</h3>
          <p className="text-2xl font-bold text-red-600">₪{summary.expense.toLocaleString()}</p>
        </div>
        
        <div className={`card ${summary.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <h3 className="text-sm font-medium text-gray-500">מאזן</h3>
          <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            ₪{summary.balance.toLocaleString()}
          </p>
        </div>
      </div>
      
      {/* פילוח הכנסות והוצאות */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">הכנסות לפי קטגוריה</h3>
          <div className="h-64">
            <TransactionChart data={incomeByCategory} />
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">הוצאות לפי קטגוריה</h3>
          <div className="h-64">
            <TransactionChart data={expenseByCategory} />
          </div>
        </div>
      </div>
      
      {/* רשימת עסקאות */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">עסקאות</h3>
          
          <div className="flex">
            <div className="relative ml-2">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="חיפוש..."
                className="py-1 pl-8 pr-2 border rounded-md text-sm"
              />
              <FiSearch className="absolute right-2 top-2 text-gray-400" />
            </div>
            
            <div className="flex bg-gray-100 rounded-md">
              <button
                className={`px-3 py-1 text-sm rounded-r-md ${filterType === 'all' ? 'bg-primary-500 text-white' : ''}`}
                onClick={() => setFilterType('all')}
              >
                הכל
              </button>
              <button
                className={`px-3 py-1 text-sm ${filterType === 'income' ? 'bg-primary-500 text-white' : ''}`}
                onClick={() => setFilterType('income')}
              >
                הכנסות
              </button>
              <button
                className={`px-3 py-1 text-sm rounded-l-md ${filterType === 'expense' ? 'bg-primary-500 text-white' : ''}`}
                onClick={() => setFilterType('expense')}
              >
                הוצאות
              </button>
            </div>
          </div>
        </div>
        
        <div className="space-y-2">
          {sortedTransactions.length > 0 ? (
            sortedTransactions.map((transaction) => {
              const category = categories.find(c => c.id === transaction.categoryId);
              const method = paymentMethods.find(m => m.id === transaction.paymentMethodId);
              
              return (
                <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex items-center">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-xl"
                      style={{ backgroundColor: `${category?.color}20`, color: category?.color }}
                    >
                      {category?.icon}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-gray-500 text-sm">
                        {transaction.date.getDate()}/{transaction.date.getMonth() + 1}/{transaction.date.getFullYear()} • {method?.name} • {category?.name}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <div className={`text-lg font-semibold mr-4 ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}₪{transaction.amount.toLocaleString()}
                    </div>
                    
                    <button
                      onClick={() => deleteTransaction(transaction.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded-full"
                      title="מחק עסקה"
                    >
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-center text-gray-500 py-4">אין עסקאות לתקופה זו</p>
          )}
        </div>
      </div>
      
      {/* מודל להוספת עסקה */}
      {isModalOpen && (
        <TransactionModal
          onClose={() => setIsModalOpen(false)}
          onAdd={handleAddTransaction}
          categories={categories}
          paymentMethods={paymentMethods}
        />
      )}
    </div>
  );
};

export default FinanceTransactions; 