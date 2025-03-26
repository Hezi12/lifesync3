'use client';

import { useState, useEffect } from 'react';
import { FiArrowUp, FiArrowDown, FiInfo, FiTrash2 } from 'react-icons/fi';
import { PaymentMethod, Transaction } from '../../types';
import BalanceChart from './BalanceChart';
import { useFinanceContext } from '../../context/FinanceContext';

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
  const { 
    paymentMethods, 
    transactions, 
    totalBalance,
    debtLoans,
    isLoading
  } = useFinanceContext();
  
  const [balanceHistory, setBalanceHistory] = useState<{date: string, balance: number}[]>([]);
  const [monthlyChange, setMonthlyChange] = useState(0);
  const [monthlyChangePercent, setMonthlyChangePercent] = useState(0);
  
  // יצירת היסטוריית מצב ההון
  useEffect(() => {
    if (isLoading) return;
    updateBalanceHistory();
  }, [paymentMethods, transactions, debtLoans, isLoading]);
  
  // חישוב היסטוריית מצב ההון לפי עסקאות אמיתיות
  const updateBalanceHistory = () => {
    const dates = getLast30Days();
    const history: {date: string, balance: number}[] = [];
    
    // חישוב היתרה ההתחלתית (סכום כל היתרות ההתחלתיות)
    const initialTotal = paymentMethods.reduce((sum, method) => sum + method.initialBalance, 0);
    
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
    
    // חישוב השפעת החובות וההלוואות
    let debtLoansImpact = 0;
    
    // הוספת השפעת ההלוואות (מוסיפות להון) וחובות (מקטינות את ההון)
    debtLoans.forEach(debtLoan => {
      if (!debtLoan.isPaid) { // רק חובות/הלוואות פתוחים
        // חובות (אני חייב) מקטינות את ההון, הלוואות (חייבים לי) מגדילות את ההון
        debtLoansImpact += debtLoan.isDebt ? -debtLoan.amount : debtLoan.amount;
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
      
      // הוספת השפעת החובות וההלוואות לכל נקודת זמן בהיסטוריה
      const totalBalanceWithDebtLoans = runningBalance + debtLoansImpact;
      
      history.push({
        date,
        balance: totalBalanceWithDebtLoans
      });
    });
    
    setBalanceHistory(history);
    
    // חישוב שינוי
    if (history.length >= 2) {
      const lastMonth = history[0].balance;
      const current = history[history.length - 1].balance;
      const change = current - lastMonth;
      setMonthlyChange(change);
      setMonthlyChangePercent(totalBalance ? Math.round((change / totalBalance) * 100) : 0);
    }
  };
  
  // חישוב התחייבויות פתוחות (חובות)
  const calculateOpenDebts = () => {
    return debtLoans
      .filter(item => !item.isPaid && item.isDebt)
      .reduce((sum, item) => sum + item.amount, 0);
  };
  
  // חישוב נכסים פתוחים (הלוואות שנתתי)
  const calculateOpenLoans = () => {
    return debtLoans
      .filter(item => !item.isPaid && !item.isDebt)
      .reduce((sum, item) => sum + item.amount, 0);
  };
  
  const openDebts = calculateOpenDebts();
  const openLoans = calculateOpenLoans();
  
  // מחיקת עסקה - ישירות ללא אישור
  const deleteTransaction = (id: string) => {
    const updatedTransactions = transactions.filter(transaction => transaction.id !== id);
    // עדכון מצב המקומי ושמירה ב-localStorage
    // שליחת אירוע עדכון
    const event = new CustomEvent('transactions-updated', { 
      detail: { transactions: updatedTransactions }
    });
    window.dispatchEvent(event);
  };
  
  // מחיקת כל העסקאות - ישירות ללא אישור
  const clearAllTransactions = () => {
    // מחיקה מהמצב המקומי
    // עדכון היסטוריית מצב ההון
    updateBalanceHistory();
    
    // שליחת אירוע עדכון
    const event = new CustomEvent('transactions-updated', { 
      detail: { transactions: [] }
    });
    window.dispatchEvent(event);
  };
  
  return (
    <div className="space-y-6">
      {/* סיכום מצב הון כולל */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* מצב הון */}
        <div className="card p-4 md:col-span-1">
          <h3 className="text-lg font-semibold mb-3">מצב הון כולל</h3>
          
          <div className="text-3xl font-bold mb-3">
            <span className={totalBalance >= 0 ? "text-green-600" : "text-red-600"}>
              {totalBalance.toLocaleString()} ₪
            </span>
          </div>
          
          <div className="flex items-center text-sm">
            <span>שינוי חודשי:</span>
            <span className={`ml-1 ${monthlyChange >= 0 ? "text-green-600" : "text-red-600"} flex items-center`}>
              {monthlyChange >= 0 ? <FiArrowUp className="mr-1" /> : <FiArrowDown className="mr-1" />}
              {monthlyChange.toLocaleString()} ₪ 
              <span className="ml-1 text-gray-500">({monthlyChangePercent}%)</span>
            </span>
          </div>
        </div>
        
        {/* חובות והלוואות */}
        <div className="card p-4 md:col-span-1">
          <h3 className="text-lg font-semibold mb-3">חובות והלוואות פתוחים</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">חובות:</span>
              <span className="text-red-600 font-semibold">-{openDebts.toLocaleString()} ₪</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">הלוואות:</span>
              <span className="text-green-600 font-semibold">+{openLoans.toLocaleString()} ₪</span>
            </div>
            
            <div className="pt-2 border-t flex justify-between">
              <span className="font-semibold">מצב נטו:</span>
              <span className={`font-semibold ${openLoans - openDebts >= 0 ? "text-green-600" : "text-red-600"}`}>
                {(openLoans - openDebts).toLocaleString()} ₪
              </span>
            </div>
          </div>
        </div>
        
        {/* אמצעי תשלום */}
        <div className="card p-4 md:col-span-1">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">אמצעי תשלום</h3>
            <div className="text-xs text-gray-500">סה"כ: {paymentMethods.reduce((sum, method) => sum + method.currentBalance, 0).toLocaleString()} ₪</div>
          </div>
          
          <div className="space-y-3 max-h-[120px] overflow-y-auto">
            {paymentMethods.map(method => (
              <div key={method.id} className="flex justify-between items-center">
                <div className="flex items-center">
                  <span className="w-6 h-6 flex items-center justify-center mr-2" style={{ color: method.color }}>{method.icon}</span>
                  <span>{method.name}</span>
                </div>
                <span className="font-medium">{method.currentBalance.toLocaleString()} ₪</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* גרף התפתחות מצב הון */}
      <div className="card p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">התפתחות מצב הון - 30 ימים אחרונים</h3>
          <div className="text-sm text-gray-500 flex items-center">
            <FiInfo className="mr-1" /> 
            המצב מחושב מסך יתרות אמצעי התשלום בתוספת הלוואות שנתת ובהפחתת חובות
          </div>
        </div>
        
        <BalanceChart data={balanceHistory} />
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