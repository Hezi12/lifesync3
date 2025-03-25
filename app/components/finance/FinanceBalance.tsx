'use client';

import { useState, useEffect } from 'react';
import { FiArrowUp, FiArrowDown, FiInfo, FiTrash2 } from 'react-icons/fi';
import { PaymentMethod, Transaction } from '../../types';
import BalanceChart from './BalanceChart';

// פונקציה להמרת מערך תאריכים ל-30 הימים האחרונים
const getLast30Days = (): string[] => {
  const dates: string[] = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
};

const FinanceBalance = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [balanceHistory, setBalanceHistory] = useState<{date: string, balance: number}[]>([]);
  
  // טעינת נתונים מ-localStorage
  useEffect(() => {
    // טעינת שיטות תשלום מה-localStorage
    const savedPaymentMethods = localStorage.getItem('paymentMethods');
    let methodsToUse: PaymentMethod[] = [];
    
    if (savedPaymentMethods) {
      try {
        methodsToUse = JSON.parse(savedPaymentMethods);
      } catch (error) {
        console.error('שגיאה בטעינת שיטות תשלום:', error);
        // במקרה של שגיאה, נשתמש בנתונים הדוגמאים
        methodsToUse = createDefaultPaymentMethods();
      }
    } else {
      // אם אין שיטות תשלום מוגדרות, נשתמש בנתונים הדוגמאים
      methodsToUse = createDefaultPaymentMethods();
    }
    
    setPaymentMethods(methodsToUse);
    
    // טעינת עסקאות מ-localStorage
    const savedTransactions = localStorage.getItem('transactions');
    let transactionsToUse: Transaction[] = [];
    
    if (savedTransactions) {
      try {
        // המרת תאריכים ממחרוזות לאובייקטי Date
        transactionsToUse = JSON.parse(savedTransactions, (key, value) => {
          if (key === 'date') {
            return new Date(value);
          }
          return value;
        });
      } catch (error) {
        console.error('שגיאה בטעינת עסקאות:', error);
        transactionsToUse = [];
      }
    }
    
    setTransactions(transactionsToUse);
    
    // עדכון מצב ההון הכולל משיטות התשלום בפועל
    const total = methodsToUse.reduce((sum: number, method: PaymentMethod) => sum + method.currentBalance, 0);
    setTotalBalance(total);
    
    // יצירת היסטוריית מצב ההון ל-30 הימים האחרונים
    updateBalanceHistory(transactionsToUse, methodsToUse);
    
  }, []);
  
  // פונקציה ליצירת שיטות תשלום ברירת מחדל
  const createDefaultPaymentMethods = (): PaymentMethod[] => {
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
    
    // שומר את ברירות המחדל ב-localStorage אם הם לא קיימים
    localStorage.setItem('paymentMethods', JSON.stringify(samplePaymentMethods));
    return samplePaymentMethods;
  };
  
  // עדכון היסטוריית מצב ההון לפי עסקאות אמיתיות
  const updateBalanceHistory = (transactions: Transaction[], methods: PaymentMethod[]) => {
    const dates = getLast30Days();
    const history: {date: string, balance: number}[] = [];
    
    // חישוב היתרה ההתחלתית (סכום כל היתרות ההתחלתיות)
    const initialTotal = methods.reduce((sum, method) => sum + method.initialBalance, 0);
    
    // מיון העסקאות לפי תאריך (מהישן לחדש)
    const sortedTransactions = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // חישוב המאזן לכל אחד מ-30 הימים האחרונים
    let runningBalance = initialTotal;
    
    // יצירת מפה של תאריכים כמחרוזות לקלות השוואה
    const transactionDateMap: { [key: string]: number } = {};
    
    // קיבוץ השפעות העסקאות לפי תאריך
    sortedTransactions.forEach(transaction => {
      const dateStr = transaction.date.toISOString().split('T')[0];
      const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      
      if (transactionDateMap[dateStr]) {
        transactionDateMap[dateStr] += amount;
      } else {
        transactionDateMap[dateStr] = amount;
      }
    });
    
    // בניית היסטוריית המאזן
    dates.forEach(date => {
      // בדיקה אם יש עסקאות ביום זה
      for (const [transactionDate, impact] of Object.entries(transactionDateMap)) {
        if (new Date(transactionDate) <= new Date(date)) {
          runningBalance += impact;
          // מחיקת העסקאות שכבר נכללו כדי לא לספור אותן שוב
          delete transactionDateMap[transactionDate];
        }
      }
      
      history.push({
        date,
        balance: runningBalance
      });
    });
    
    setBalanceHistory(history);
  };
  
  // חישוב שינוי במצב ההון בחודש האחרון
  const calculateMonthlyChange = (): number => {
    if (balanceHistory.length >= 2) {
      const lastMonth = balanceHistory[0].balance;
      const current = balanceHistory[balanceHistory.length - 1].balance;
      return current - lastMonth;
    }
    return 0;
  };
  
  const monthlyChange = calculateMonthlyChange();
  const monthlyChangePercent = totalBalance ? Math.round((monthlyChange / totalBalance) * 100) : 0;
  
  // האזנה לשינויים ב-localStorage ולאירועים מותאמים אישית
  useEffect(() => {
    // טיפול בשינויים מאירועים מותאמים אישית (לעדכונים באותו החלון)
    const handlePaymentMethodsEvent = (event: CustomEvent<{ paymentMethods: PaymentMethod[] }>) => {
      const methods = event.detail.paymentMethods;
      setPaymentMethods(methods);
      
      // עדכון מצב ההון הכולל
      const total = methods.reduce((sum: number, method: PaymentMethod) => sum + method.currentBalance, 0);
      setTotalBalance(total);
      
      // עדכון היסטוריית מצב ההון
      updateBalanceHistory(transactions, methods);
    };
    
    // טיפול בשינויים בעסקאות (לעדכון העסקאות האחרונות)
    const handleTransactionsEvent = (event: CustomEvent<{ transactions: Transaction[] }>) => {
      const updatedTransactions = event.detail.transactions;
      setTransactions(updatedTransactions);
      
      // עדכון היסטוריית מצב ההון עם העסקאות החדשות
      updateBalanceHistory(updatedTransactions, paymentMethods);
    };

    // טיפול בשינויים מ-localStorage (לעדכונים מחלונות אחרים)
    const handleStorageChange = () => {
      const savedPaymentMethods = localStorage.getItem('paymentMethods');
      if (savedPaymentMethods) {
        try {
          const methods = JSON.parse(savedPaymentMethods);
          setPaymentMethods(methods);
          
          // עדכון מצב ההון הכולל
          const total = methods.reduce((sum: number, method: PaymentMethod) => sum + method.currentBalance, 0);
          setTotalBalance(total);
        } catch (error) {
          console.error('שגיאה בעדכון שיטות תשלום:', error);
        }
      }
      
      // טעינת עסקאות מעודכנות אם השתנו
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
          
          // עדכון היסטוריית מצב ההון
          if (parsedTransactions) {
            updateBalanceHistory(parsedTransactions, paymentMethods);
          }
        } catch (error) {
          console.error('שגיאה בטעינת עסקאות מעודכנות:', error);
        }
      } else {
        // אם אין עסקאות, נאפס אותן
        setTransactions([]);
        updateBalanceHistory([], paymentMethods);
      }
    };
    
    // האזנה לשינויים ב-localStorage
    window.addEventListener('storage', handleStorageChange);
    
    // האזנה לאירועים מותאמים אישית
    window.addEventListener('payment-methods-updated', handlePaymentMethodsEvent as EventListener);
    window.addEventListener('transactions-updated', handleTransactionsEvent as EventListener);
    
    // ניקוי בעת יציאה
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('payment-methods-updated', handlePaymentMethodsEvent as EventListener);
      window.removeEventListener('transactions-updated', handleTransactionsEvent as EventListener);
    };
  }, [transactions, paymentMethods]);

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
  
  // מחיקת כל העסקאות - ישירות ללא אישור
  const clearAllTransactions = () => {
    // מחיקה מהמצב המקומי
    setTransactions([]);
    
    // שמירה מיידית ב-localStorage
    localStorage.setItem('transactions', JSON.stringify([]));
    
    // שליחת אירוע עדכון
    const event = new CustomEvent('transactions-updated', { 
      detail: { transactions: [] }
    });
    window.dispatchEvent(event);
    
    // עדכון היסטוריית מצב ההון
    updateBalanceHistory([], paymentMethods);
  };
  
  return (
    <div className="space-y-6">
      {/* סיכום מצב ההון */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">סך מצב הון</h2>
            <p className="text-3xl font-bold text-primary-700">₪{totalBalance.toLocaleString()}</p>
          </div>
          
          <div className="flex items-center mt-4 md:mt-0">
            <div className={`flex items-center ${monthlyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {monthlyChange >= 0 ? <FiArrowUp className="mr-1" /> : <FiArrowDown className="mr-1" />}
              <span className="font-semibold">
                ₪{Math.abs(monthlyChange).toLocaleString()} ({monthlyChangePercent}%)
              </span>
            </div>
            <div className="ml-2 text-gray-500 flex items-center">
              <FiInfo className="w-4 h-4" />
              <span className="mr-1 text-sm">החודש האחרון</span>
            </div>
          </div>
        </div>
        
        {/* גרף מצב ההון */}
        <div className="mt-6 h-64">
          <BalanceChart data={balanceHistory} />
        </div>
      </div>
      
      {/* פירוט שיטות תשלום */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">יתרות לפי שיטות תשלום</h2>
        
        <div className="space-y-4">
          {paymentMethods.map((method) => (
            <div key={method.id} className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-xl"
                  style={{ backgroundColor: `${method.color}20`, color: method.color }}
                >
                  {method.icon}
                </div>
                <div>
                  <p className="font-medium">{method.name}</p>
                  <p className="text-gray-500 text-sm">יתרה התחלתית: ₪{method.initialBalance.toLocaleString()}</p>
                </div>
              </div>
              
              <div className="text-xl font-semibold">
                ₪{method.currentBalance.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* עסקאות אחרונות */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">עסקאות אחרונות</h2>
          <button
            onClick={clearAllTransactions}
            className="px-3 py-1 text-sm bg-red-100 text-red-600 rounded-md hover:bg-red-200 flex items-center"
          >
            <FiTrash2 className="ml-1" size={14} />
            נקה הכל
          </button>
        </div>
        
        <div className="space-y-2">
          {transactions && transactions.length > 0 ? (
            // מיון עסקאות לפי תאריך (מהחדש לישן) ותצוגת 5 העסקאות האחרונות
            [...transactions]
              .sort((a, b) => b.date.getTime() - a.date.getTime())
              .slice(0, 5)
              .map((transaction) => {
                const method = paymentMethods.find(m => m.id === transaction.paymentMethodId);
                
                return (
                  <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center">
                      <div 
                        className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 text-xl ${
                          transaction.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}
                      >
                        {transaction.type === 'income' ? <FiArrowUp /> : <FiArrowDown />}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-gray-500 text-sm">
                          {transaction.date.getDate()}/{transaction.date.getMonth() + 1}/{transaction.date.getFullYear()} • {method?.name || 'אמצעי תשלום לא ידוע'}
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
            <p className="text-center text-gray-500 py-4">אין עסקאות לתצוגה</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceBalance; 