'use client';

import { useState, useEffect } from 'react';
import { FiArrowUp, FiArrowDown, FiInfo, FiDollarSign, FiCreditCard, FiTrendingUp, FiCalendar, FiClock } from 'react-icons/fi';
import { HiCalendarDays, HiChartBar } from 'react-icons/hi2';
import { IoWallet, IoSparkles, IoAnalytics } from 'react-icons/io5';
import { PaymentMethod, Transaction } from '../../types';
import BalanceChart from './BalanceChart';
import { useFinanceContext } from '../../context/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';

type TimeRangeType = 'week' | 'month' | 'last30' | 'prevMonth';

// פונקציה להמרת מערך תאריכים לפי טווח זמן מבוקש
const getDateRange = (range: TimeRangeType): string[] => {
  const dates: string[] = [];
  const today = new Date();
  let startDate: Date;
  let endDate = new Date();
  
  switch(range) {
    case 'week':
      // 7 ימים אחרונים
      startDate = new Date();
      startDate.setDate(today.getDate() - 6);
      break;
    case 'month':
      // מתחילת החודש הנוכחי
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      break;
    case 'last30':
      // 30 ימים אחרונים
      startDate = new Date();
      startDate.setDate(today.getDate() - 29);
      break;
    case 'prevMonth':
      // החודש הקודם מלא
      startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      endDate = new Date(today.getFullYear(), today.getMonth(), 0);
      break;
  }
  
  // יצירת מערך תאריכים
  let currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    dates.push(currentDate.toISOString().split('T')[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
};

// פונקציה לקבלת שם תצוגת טווח זמן
const getTimeRangeDisplayName = (range: TimeRangeType): string => {
  switch(range) {
    case 'week':
      return 'שבוע אחרון';
    case 'month':
      return 'מתחילת החודש';
    case 'last30':
      return '30 ימים אחרונים';
    case 'prevMonth':
      const date = new Date();
      const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
      return `${prevMonth.toLocaleString('he-IL', { month: 'long' })}`;
  }
};

const FinanceBalance = () => {
  const { 
    paymentMethods, 
    transactions, 
    totalBalance,
    debtLoans,
    isLoading
  } = useFinanceContext();
  
  const [timeRange, setTimeRange] = useState<TimeRangeType>('last30');
  const [balanceHistory, setBalanceHistory] = useState<{date: string, balance: number}[]>([]);
  const [periodChange, setPeriodChange] = useState(0);
  const [periodChangePercent, setPeriodChangePercent] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // זיהוי גודל המסך
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
      
      // תיאום גובה הגרף לפי גודל המסך
      const graphHeightEl = document.getElementById('balance-chart-container');
      if (graphHeightEl) {
        if (window.innerWidth < 480) {
          graphHeightEl.style.height = '180px'; // מסכים קטנים במיוחד
        } else if (window.innerWidth < 768) {
          graphHeightEl.style.height = '220px'; // מובייל
        } else {
          graphHeightEl.style.height = '280px'; // דסקטופ
        }
      }
    };
    
    // בדיקה ראשונית
    checkIfMobile();
    
    // האזנה לשינויים בגודל המסך
    window.addEventListener('resize', checkIfMobile);
    
    // ניקוי
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);
  
  // יצירת היסטוריית מצב ההון
  useEffect(() => {
    if (isLoading) return;
    updateBalanceHistory(timeRange);
  }, [paymentMethods, transactions, debtLoans, isLoading, timeRange]);
  
  // חישוב היסטוריית מצב ההון לפי עסקאות אמיתיות
  const updateBalanceHistory = (selectedRange: TimeRangeType) => {
    const dates = getDateRange(selectedRange);
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
      // מילוי ההיסטוריה עם הערך הנוכחי לכל הימים
      dates.forEach(date => {
        history.push({
          date,
          balance: currentBalance
        });
      });
      
      setBalanceHistory(history);
      
      // אין שינוי אם אין עסקאות
      setPeriodChange(0);
      setPeriodChangePercent(0);
      return;
    }
    
    // אם יש עסקאות, ממשיך בחישוב המותאם
    // חישוב היתרה ההתחלתית (מתחילים מהמצב הנוכחי ואז מחסירים את ההשפעה של העסקאות)
    let initialBalance = currentBalance;
    
    // מיון העסקאות לפי תאריך (מהישן לחדש)
    const sortedTransactions = [...validTransactions].sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // סינון עסקאות לפי התקופה המבוקשת
    const periodStartDate = new Date(dates[0] + 'T00:00:00');
    const periodEndDate = new Date(dates[dates.length - 1] + 'T23:59:59'); 
    
    // פונקציה להמרת תאריך לפורמט "YYYY-MM-DD" בלבד (ללא שעות)
    const normalizeDate = (date: Date): string => {
      return date.toISOString().split('T')[0];
    };
    
    const periodTransactions = sortedTransactions.filter(t => {
      const transactionDateStr = normalizeDate(t.date);
      const startDateStr = dates[0];
      const endDateStr = dates[dates.length - 1];
      
      return transactionDateStr >= startDateStr && transactionDateStr <= endDateStr;
    });
    
    // חישוב השינוי הכולל מעסקאות לאורך התקופה
    const totalTransactionChange = periodTransactions.reduce((sum, t) => {
      return sum + (t.type === 'income' ? t.amount : -t.amount);
    }, 0);
    
    // החסרת השינוי מהמצב הנוכחי לקבלת המצב בתחילת התקופה
    initialBalance -= totalTransactionChange;
    
    // יצירת מפה של תאריכים וההשפעה המצטברת של עסקאות
    const transactionImpactByDate: { [key: string]: number } = {};
    
    // חישוב ההשפעה המצטברת לפי תאריך
    periodTransactions.forEach(transaction => {
      const dateStr = normalizeDate(transaction.date);
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
        // כאן ההשוואה היא בין מחרוזות תאריכים ללא שעות
        if (transactionDate <= date) {
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
    
    // חישוב שינוי לפי התקופה שנבחרה
    if (history.length >= 2) {
      // השינוי הוא ההפרש בין הערך הראשון לאחרון בהיסטוריה
      const firstDay = history[0].balance;
      const lastDay = history[history.length - 1].balance;
      const change = lastDay - firstDay;
      
      setPeriodChange(change);
      
      // חישוב אחוז השינוי ביחס למצב ההתחלתי
      const percentChange = firstDay !== 0 
        ? Math.round((change / Math.abs(firstDay)) * 100) 
        : (change !== 0 ? 100 : 0);
      
      setPeriodChangePercent(percentChange);
    } else {
      // אם אין מספיק נתונים בהיסטוריה
      setPeriodChange(0);
      setPeriodChangePercent(0);
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

  // מחשב את האחוז של כל אמצעי תשלום מסך ההון
  const calculatePercentage = (balance: number) => {
    const totalPositive = paymentMethods.reduce((sum, method) => 
      method.currentBalance > 0 ? sum + method.currentBalance : sum, 0);
    return totalPositive === 0 ? 0 : Math.round((balance / totalPositive) * 100);
  };
  
  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3 sm:gap-4">
        {/* מצב הון */}
        <motion.div 
          className="col-span-1 md:col-span-4 bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden min-h-[150px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="absolute inset-0 bg-white"></div>
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
                <IoAnalytics className="mr-2 sm:mr-4 text-blue-500" />
                מצב הון כולל
              </h3>
              <motion.div 
                whileHover={{ rotate: isMobile ? 0 : 15, scale: isMobile ? 1.05 : 1.1 }}
                className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-blue-500 rounded-full text-white shadow-sm"
              >
                <IoWallet className="text-base sm:text-lg" />
              </motion.div>
            </div>
            
            <div className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-gray-800 flex items-baseline">
              <motion.span 
                key={totalBalance}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`${totalBalance >= 0 ? "text-green-600" : "text-red-500"} transition-colors duration-300`}
              >
                {totalBalance.toLocaleString()}
              </motion.span>
              <span className="text-base sm:text-lg text-gray-500 mr-1">₪</span>
            </div>
            
            <div className="flex items-center text-2xs sm:text-xs bg-gray-50 px-2 sm:px-3 py-2 sm:py-2.5 rounded-lg border border-gray-200 shadow-sm">
              <span className="text-gray-700 font-medium">שינוי ({getTimeRangeDisplayName(timeRange)}):</span>
              <motion.div 
                className="mr-1 sm:mr-2 flex items-center font-semibold"
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 0.5, repeat: 0, repeatDelay: 10 }}
              >
                <AnimatePresence mode="wait">
                  <motion.div
                    key={periodChange}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className={`flex items-center ${periodChange >= 0 ? "text-green-600" : "text-red-500"}`}
                  >
                    {periodChange >= 0 ? <FiArrowUp className="mr-1 sm:mr-4" /> : <FiArrowDown className="mr-1 sm:mr-4" />}
                    {periodChange.toLocaleString()} ₪ 
                    <span className="mr-1 ml-1 text-gray-600 font-normal">({periodChangePercent}%)</span>
                  </motion.div>
                </AnimatePresence>
              </motion.div>
              {periodChangePercent !== 0 && (
                <div className="mr-1 text-2xs sm:text-xs text-gray-500 cursor-help" title="אחוז השינוי מחושב ביחס לתחילת התקופה">
                  <FiInfo />
                </div>
              )}
            </div>
            
            <div className="mt-3 sm:mt-4 flex justify-center space-x-1 sm:space-x-2 rtl:space-x-reverse">
              <motion.button
                whileHover={{ y: isMobile ? -1 : -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeRange('week')}
                className={`flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg transition-all min-w-[3rem] sm:min-w-[3.5rem] ${
                  timeRange === 'week' 
                    ? 'bg-gray-100 text-blue-600 shadow-sm border border-gray-200' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
                title="שבוע אחרון"
              >
                <HiCalendarDays className="text-base sm:text-lg mb-0.5 sm:mb-1" />
                <span className="text-[9px] sm:text-[10px] font-medium">שבוע</span>
              </motion.button>
              
              <motion.button
                whileHover={{ y: isMobile ? -1 : -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeRange('month')}
                className={`flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg transition-all min-w-[3rem] sm:min-w-[3.5rem] ${
                  timeRange === 'month' 
                    ? 'bg-gray-100 text-blue-600 shadow-sm border border-gray-200' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
                title="מתחילת החודש"
              >
                <FiCalendar className="text-base sm:text-lg mb-0.5 sm:mb-1" />
                <span className="text-[9px] sm:text-[10px] font-medium">חודש</span>
              </motion.button>
              
              <motion.button
                whileHover={{ y: isMobile ? -1 : -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeRange('last30')}
                className={`flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg transition-all min-w-[3rem] sm:min-w-[3.5rem] ${
                  timeRange === 'last30' 
                    ? 'bg-gray-100 text-blue-600 shadow-sm border border-gray-200' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
                title="30 ימים אחרונים"
              >
                <FiClock className="text-base sm:text-lg mb-0.5 sm:mb-1" />
                <span className="text-[9px] sm:text-[10px] font-medium">30 יום</span>
              </motion.button>
              
              <motion.button
                whileHover={{ y: isMobile ? -1 : -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTimeRange('prevMonth')}
                className={`flex flex-col items-center justify-center p-1 sm:p-2 rounded-lg transition-all min-w-[3rem] sm:min-w-[3.5rem] ${
                  timeRange === 'prevMonth' 
                    ? 'bg-gray-100 text-blue-600 shadow-sm border border-gray-200' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                }`}
                title="חודש קודם"
              >
                <HiChartBar className="text-base sm:text-lg mb-0.5 sm:mb-1" />
                <span className="text-[9px] sm:text-[10px] font-medium">קודם</span>
              </motion.button>
            </div>
          </div>
        </motion.div>
        
        {/* חובות והלוואות */}
        <motion.div 
          className="col-span-1 md:col-span-4 bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden min-h-[150px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
          
          <div className="flex items-center mb-3 sm:mb-4">
            <span className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-purple-500 rounded-full text-white shadow-sm">
              <FiInfo className="text-base sm:text-lg" />
            </span>
          </div>
          
          <div className="space-y-2 sm:space-y-3">
            <motion.div 
              whileHover={{ x: isMobile ? 1 : 3 }}
              className="flex justify-between items-center p-2 sm:p-3 bg-red-25 rounded-lg border border-red-100 shadow-sm"
            >
              <span className="text-gray-700 font-medium text-xs sm:text-sm">חובות:</span>
              <span className="text-red-500 font-bold text-sm sm:text-base flex items-center">
                <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-red-500 text-white rounded-full mr-2 sm:mr-4">
                  <FiArrowDown className="text-2xs sm:text-sm" />
                </span>
                {openDebts.toLocaleString()} ₪
              </span>
            </motion.div>
            
            <motion.div
              whileHover={{ x: isMobile ? 1 : 3 }}
              className="flex justify-between items-center p-2 sm:p-3 bg-green-25 rounded-lg border border-green-100 shadow-sm"
            >
              <span className="text-gray-700 font-medium text-xs sm:text-sm">הלוואות:</span>
              <span className="text-green-600 font-bold text-sm sm:text-base flex items-center">
                <span className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center bg-green-500 text-white rounded-full mr-2 sm:mr-4">
                  <FiArrowUp className="text-2xs sm:text-sm" />
                </span>
                {openLoans.toLocaleString()} ₪
              </span>
            </motion.div>
            
            <motion.div 
              whileHover={{ scale: isMobile ? 1.01 : 1.02 }}
              className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm"
            >
              <span className="font-bold text-gray-800 text-xs sm:text-sm">מאזן נטו:</span>
              <motion.span 
                key={openLoans - openDebts}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`font-bold text-base sm:text-lg flex items-center ${openLoans - openDebts >= 0 ? "text-green-600" : "text-red-500"}`}
              >
                {(openLoans - openDebts).toLocaleString()} ₪
                <motion.div 
                  animate={{ rotate: [0, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                  className="ml-1 text-yellow-500"
                >
                  {openLoans - openDebts >= 0 && <IoSparkles />}
                </motion.div>
              </motion.span>
            </motion.div>
          </div>
        </motion.div>
        
        {/* אמצעי תשלום */}
        <motion.div 
          className="col-span-1 md:col-span-4 bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden min-h-[150px]"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
          
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center">
              <span className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-cyan-500 rounded-full mr-2 sm:mr-4 text-white shadow-sm">
                <FiCreditCard className="text-base sm:text-lg" />
              </span>
              אמצעי תשלום
            </h3>
            <div className="text-2xs sm:text-xs font-medium bg-white border border-cyan-200 text-cyan-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm">
              סה"כ: {paymentMethods.reduce((sum, method) => sum + method.currentBalance, 0).toLocaleString()} ₪
            </div>
          </div>
          
          <div className="space-y-2 sm:space-y-2.5 max-h-[120px] sm:max-h-[150px] overflow-y-auto pr-1 custom-scrollbar">
            {paymentMethods.length === 0 ? (
              <div className="text-center py-3 text-gray-500 text-xs sm:text-sm">
                לא הוגדרו אמצעי תשלום
              </div>
            ) : (
              paymentMethods.map((method) => (
                <motion.div 
                  key={method.id}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  whileHover={{ scale: isMobile ? 1.01 : 1.02, x: isMobile ? 1 : 3 }}
                  transition={{ duration: 0.3 }}
                  className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mr-2 sm:mr-4 bg-white border border-gray-200 shadow-sm" style={{ color: method.color }}>
                      <span className="text-base sm:text-lg">{method.icon}</span>
                    </div>
                    <span className="font-medium text-xs sm:text-sm text-gray-700">{method.name}</span>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <span className={`text-2xs sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full ${
                      method.currentBalance >= 0 
                        ? "bg-green-50 text-green-600 border border-green-200" 
                        : "bg-red-50 text-red-500 border border-red-200"
                    }`}>
                      {calculatePercentage(method.currentBalance)}%
                    </span>
                    <span className={`${
                      method.currentBalance >= 0 
                        ? "text-green-600 font-bold" 
                        : "text-red-500 font-bold"
                    } text-xs sm:text-sm`}>
                      {method.currentBalance.toLocaleString()} ₪
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>
      
      {/* גרף מצב הון */}
      <motion.div 
        className="bg-white rounded-xl p-3 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
        
        <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center mb-2 sm:mb-3 gap-2">
          <div className="flex items-center">
            <motion.h3 
              className="text-sm sm:text-base font-semibold text-gray-800"
              whileHover={{ scale: 1.03 }}
            >
              {getTimeRangeDisplayName(timeRange)}
            </motion.h3>
            <span className="text-2xs sm:text-xs text-gray-500 mr-2 bg-gray-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
              {balanceHistory.length} ימים
            </span>
          </div>
          
          {timeRange !== 'last30' && (
            <motion.button
              whileHover={{ scale: isMobile ? 1.03 : 1.05 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setTimeRange('last30')}
              className="text-2xs sm:text-xs font-medium bg-white border border-blue-200 text-blue-600 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full shadow-sm hover:bg-blue-50 transition-colors"
            >
              חזרה ל-30 ימים
            </motion.button>
          )}
        </div>
        <div id="balance-chart-container" className="h-[220px] sm:h-[280px]">
          <BalanceChart data={balanceHistory} period={timeRange} />
        </div>
      </motion.div>
    </div>
  );
};

export default FinanceBalance; 