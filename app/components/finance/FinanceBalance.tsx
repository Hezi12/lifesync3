'use client';

import { useState, useEffect } from 'react';
import { FiArrowUp, FiArrowDown, FiInfo } from 'react-icons/fi';
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
    
    // חישוב סכום כולל של אמצעי תשלום
    const totalPaymentMethods = paymentMethods.reduce((sum, method) => sum + method.currentBalance, 0);
    
    // חישוב השפעת החובות וההלוואות פתוחים
    const openDebtsTotal = debtLoans
      .filter(item => !item.isPaid && item.isDebt)
      .reduce((sum, item) => sum + item.amount, 0);
      
    const openLoansTotal = debtLoans
      .filter(item => !item.isPaid && !item.isDebt)
      .reduce((sum, item) => sum + item.amount, 0);
    
    // המצב הנוכחי - סכום אמצעי תשלום + הלוואות פתוחות - חובות פתוחים
    const currentBalance = totalPaymentMethods - openDebtsTotal + openLoansTotal;
    
    // בדיקה אם יש עסקאות בכלל בשיטת תשלום מוגדרת
    const validTransactions = transactions.filter(t => {
      // בדיקה אם שיטת התשלום קיימת
      return paymentMethods.some(m => m.id === t.paymentMethodId);
    });
    
    const hasTransactions = validTransactions.length > 0;
    
    // אם אין עסקאות תקפות או יש בעיה אחרת, פשוט מציג קו ישר עם המצב הנוכחי
    if (!hasTransactions) {
      // מילוי ההיסטוריה עם הערך הנוכחי לכל 30 הימים
      dates.forEach(date => {
        history.push({
          date,
          balance: currentBalance
        });
      });
      
      setBalanceHistory(history);
      
      // אין שינוי חודשי אם אין עסקאות
      setMonthlyChange(0);
      setMonthlyChangePercent(0);
      return;
    }
    
    // אם יש עסקאות, ממשיך בחישוב המותאם
    // חישוב היתרה ההתחלתית (מתחילים מהמצב הנוכחי ואז מחסירים את ההשפעה של העסקאות)
    let initialBalance = currentBalance;
    
    // מיון העסקאות לפי תאריך (מהישן לחדש)
    const sortedTransactions = [...validTransactions].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // סינון עסקאות מהחודש האחרון בלבד
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentTransactions = sortedTransactions.filter(t => 
      t.date.getTime() >= thirtyDaysAgo.getTime()
    );
    
    // חישוב השינוי הכולל מעסקאות לאורך 30 יום
    const totalTransactionChange = recentTransactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
    
    // החסרת השינוי מהמצב הנוכחי לקבלת המצב בתחילת התקופה
    initialBalance -= totalTransactionChange;
    
    // יצירת מפה של תאריכים וההשפעה המצטברת של עסקאות
    const transactionImpactByDate: { [key: string]: number } = {};
    
    // חישוב ההשפעה המצטברת לפי תאריך
    recentTransactions.forEach(transaction => {
      const dateStr = transaction.date.toISOString().split('T')[0];
      const amount = transaction.type === 'income' ? transaction.amount : -transaction.amount;
      
      if (transactionImpactByDate[dateStr]) {
        transactionImpactByDate[dateStr] += amount;
      } else {
        transactionImpactByDate[dateStr] = amount;
      }
    });
    
    // בניית היסטוריית המאזן
    let runningBalance = initialBalance;
    dates.forEach(date => {
      // בדיקה אם יש עסקאות ביום זה
      for (const [transactionDate, impact] of Object.entries(transactionImpactByDate)) {
        if (new Date(transactionDate) <= new Date(date)) {
          runningBalance += impact;
          // מחיקת העסקאות שכבר נכללו כדי לא לספור אותן שוב
          delete transactionImpactByDate[transactionDate];
        }
      }
      
      history.push({
        date,
        balance: runningBalance
      });
    });
    
    setBalanceHistory(history);
    
    // חישוב שינוי חודשי לפי העסקאות מהחודש האחרון בלבד
    if (history.length >= 2) {
      // השינוי הוא ההפרש בין הערך הראשון לאחרון בהיסטוריה
      const firstDay = history[0].balance;
      const lastDay = history[history.length - 1].balance;
      const change = lastDay - firstDay;
      
      setMonthlyChange(change);
      // חישוב אחוז השינוי ביחס למצב הנוכחי
      const percentChange = lastDay !== 0 ? Math.round((change / lastDay) * 100) : 0;
      setMonthlyChangePercent(percentChange);
    } else {
      // אם אין מספיק נתונים בהיסטוריה
      setMonthlyChange(0);
      setMonthlyChangePercent(0);
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
    </div>
  );
};

export default FinanceBalance; 