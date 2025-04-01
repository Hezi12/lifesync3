'use client';

import { useState, useEffect } from 'react';
import { FiArrowUp, FiArrowDown, FiInfo, FiFilter, FiDownload, FiCalendar, FiSearch } from 'react-icons/fi';
import { HiCurrencyDollar, HiUserCircle, HiCalendarDays } from 'react-icons/hi2';
import { IoWallet, IoSparkles, IoArrowDown, IoArrowUp, IoCashOutline, IoSwapVertical, IoTrendingUp, IoTrendingDown, IoCheckmarkCircle, IoAdd, IoRemove } from 'react-icons/io5';
import { PaymentMethod, Transaction, DebtLoan, FinancialCategory } from '../../types';
import { useFinanceContext } from '../../context/FinanceContext';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';

const FinanceOverview = () => {
  const { 
    paymentMethods, 
    transactions, 
    categories,
    debtLoans,
    isLoading
  } = useFinanceContext();

  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [searchTerm, setSearchTerm] = useState('');
  
  // לשוניות להצגת מידע שונה
  const [activeTab, setActiveTab] = useState<'all' | 'accounts' | 'debts' | 'transactions'>('all');

  // סינון עסקאות לפי טווח תאריכים
  useEffect(() => {
    if (!transactions.length) return;

    const now = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    const filtered = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && 
             transactionDate <= now &&
             (searchTerm === '' || 
              t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    setFilteredTransactions(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [transactions, dateRange, searchTerm]);

  // חישוב סטטיסטיקות
  const stats = {
    totalIncome: filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    netChange: filteredTransactions
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0),
    openDebts: debtLoans
      .filter(d => d.isDebt && !d.isPaid)
      .reduce((sum, d) => sum + d.amount, 0),
    openLoans: debtLoans
      .filter(d => !d.isDebt && !d.isPaid)
      .reduce((sum, d) => sum + d.amount, 0),
  };

  // קבלת שם קטגוריה
  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'לא ידוע';
  };

  // קבלת שם אמצעי תשלום
  const getPaymentMethodName = (methodId: string) => {
    return paymentMethods.find(m => m.id === methodId)?.name || 'לא ידוע';
  };

  // פונקציה לייצוא לאקסל
  const exportToExcel = () => {
    // יצירת חוברת עבודה חדשה
    const wb = XLSX.utils.book_new();

    // 1. גיליון אמצעי תשלום
    const paymentMethodsData = paymentMethods.map(method => {
      const methodTransactions = filteredTransactions.filter(t => t.paymentMethodId === method.id);
      const totalChange = methodTransactions.reduce((sum, t) => 
        sum + (t.type === 'income' ? t.amount : -t.amount), 0
      );
      
      return {
        'שם': method.name,
        'יתרה התחלתית': method.initialBalance,
        'יתרה נוכחית': method.currentBalance,
        'שינוי': totalChange
      };
    });
    const wsPaymentMethods = XLSX.utils.json_to_sheet(paymentMethodsData);
    XLSX.utils.book_append_sheet(wb, wsPaymentMethods, 'אמצעי תשלום');

    // 2. גיליון חובות והלוואות
    const debtLoansData = debtLoans.map(d => ({
      'שם': d.personName,
      'סוג': d.isDebt ? 'חוב' : 'הלוואה',
      'סכום': d.amount,
      'תאריך יעד': d.dueDate ? format(new Date(d.dueDate), 'dd/MM/yyyy', { locale: he }) : 'ללא תאריך',
      'סטטוס': d.isPaid ? 'שולם' : 'פתוח'
    }));
    const wsDebtLoans = XLSX.utils.json_to_sheet(debtLoansData);
    XLSX.utils.book_append_sheet(wb, wsDebtLoans, 'חובות והלוואות');

    // 3. גיליון עסקאות
    const transactionsData = filteredTransactions.map(t => ({
      'תאריך': format(new Date(t.date), 'dd/MM/yyyy', { locale: he }),
      'תיאור': t.description,
      'קטגוריה': getCategoryName(t.categoryId),
      'אמצעי תשלום': getPaymentMethodName(t.paymentMethodId),
      'סכום': t.type === 'income' ? t.amount : -t.amount,
      'סוג': t.type === 'income' ? 'הכנסה' : 'הוצאה'
    }));
    const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'עסקאות');

    // 4. גיליון סיכום
    const summaryData = [{
      'סה"כ הכנסות': stats.totalIncome,
      'סה"כ הוצאות': stats.totalExpenses,
      'שינוי נטו': stats.netChange,
      'חובות פתוחים': stats.openDebts,
      'הלוואות פתוחות': stats.openLoans
    }];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'סיכום');

    // הגדרת רוחב עמודות
    const wscols = [
      { wch: 20 }, // שם
      { wch: 15 }, // יתרה התחלתית
      { wch: 15 }, // יתרה נוכחית
      { wch: 15 }, // שינוי
    ];
    wsPaymentMethods['!cols'] = wscols;

    // שמירת הקובץ
    const fileName = `דוח_פיננסי_${format(new Date(), 'dd-MM-yyyy', { locale: he })}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* סינון וחיפוש */}
      <motion.div 
        className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
        
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
            <FiCalendar className="text-gray-400 ml-2" />
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
              className="bg-transparent border-none focus:outline-none"
          >
            <option value="week">שבוע אחרון</option>
            <option value="month">חודש אחרון</option>
              <option value="year">שנה אחרונה</option>
            <option value="all">הכל</option>
          </select>
          </div>
          
          <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2 flex-1">
            <FiSearch className="text-gray-400 ml-2" />
          <input
            type="text"
            placeholder="חיפוש..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none focus:outline-none w-full"
            />
          </div>
          
          <div className="flex space-x-2 space-x-reverse">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg ${activeTab === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setActiveTab('all')}
            >
              הכל
            </motion.button>
            
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg ${activeTab === 'accounts' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setActiveTab('accounts')}
            >
              חשבונות
            </motion.button>
            
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg ${activeTab === 'debts' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setActiveTab('debts')}
            >
              חובות והלוואות
            </motion.button>
            
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg ${activeTab === 'transactions' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setActiveTab('transactions')}
            >
              עסקאות
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={exportToExcel}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700"
            >
              <FiDownload className="ml-1" />
              ייצוא
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* כרטיסי סיכום */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* הכנסות */}
        <motion.div 
          className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-green-200 via-green-300 to-green-400"></div>
          
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-gray-800">סה"כ הכנסות</h3>
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-9 h-9 flex items-center justify-center bg-green-500 rounded-full text-white shadow-sm"
            >
              <IoArrowUp className="text-lg" />
            </motion.div>
          </div>
          
          <div className="flex items-baseline">
            <motion.span 
              key={stats.totalIncome}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-green-600"
            >
              {stats.totalIncome.toLocaleString()}
            </motion.span>
            <span className="text-lg text-gray-500 mr-1">₪</span>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            ב{dateRange === 'week' ? 'שבוע' : dateRange === 'month' ? 'חודש' : dateRange === 'year' ? 'שנה' : 'כל התקופה'}
          </div>
        </motion.div>
        
        {/* הוצאות */}
        <motion.div 
          className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-red-200 via-red-300 to-red-400"></div>
          
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-gray-800">סה"כ הוצאות</h3>
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-9 h-9 flex items-center justify-center bg-red-500 rounded-full text-white shadow-sm"
            >
              <IoArrowDown className="text-lg" />
            </motion.div>
          </div>
          
          <div className="flex items-baseline">
            <motion.span 
              key={stats.totalExpenses}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-red-600"
            >
              {stats.totalExpenses.toLocaleString()}
            </motion.span>
            <span className="text-lg text-gray-500 mr-1">₪</span>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            ב{dateRange === 'week' ? 'שבוע' : dateRange === 'month' ? 'חודש' : dateRange === 'year' ? 'שנה' : 'כל התקופה'}
          </div>
        </motion.div>
        
        {/* מאזן */}
        <motion.div 
          className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
          
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-gray-800">מאזן כולל</h3>
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className={`w-9 h-9 flex items-center justify-center ${stats.netChange >= 0 ? 'bg-blue-500' : 'bg-yellow-500'} rounded-full text-white shadow-sm`}
            >
              <IoCashOutline className="text-lg" />
            </motion.div>
          </div>
          
          <div className="flex items-baseline">
            <motion.span 
              key={stats.netChange}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-3xl font-bold ${stats.netChange >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}
            >
              {stats.netChange.toLocaleString()}
            </motion.span>
            <span className="text-lg text-gray-500 mr-1">₪</span>
            
            {stats.netChange > 0 && (
              <motion.div 
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                className="mr-2 text-yellow-500 text-xl"
              >
                <IoSparkles />
              </motion.div>
            )}
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            סך השינוי (הכנסות פחות הוצאות)
          </div>
        </motion.div>
      </div>

      {/* תוכן לפי לשונית */}
      <AnimatePresence mode="wait">
        {(activeTab === 'all' || activeTab === 'accounts') && (
          <motion.div
            key="accounts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          >
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-blue-300 to-blue-400"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <IoWallet className="ml-2 text-blue-500" />
              אמצעי תשלום וחשבונות
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentMethods.map(method => {
                const methodTransactions = filteredTransactions.filter(t => t.paymentMethodId === method.id);
                const totalChange = methodTransactions.reduce((sum, t) => 
                  sum + (t.type === 'income' ? t.amount : -t.amount), 0
                );
                
                return (
                  <motion.div
                    key={method.id}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="bg-gray-50 rounded-lg p-4 border border-gray-100"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-800">{method.name}</h4>
                        <div className="mt-1 text-3xl font-bold text-gray-800">
                          ₪{method.currentBalance.toLocaleString()}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          יתרה התחלתית: ₪{method.initialBalance.toLocaleString()}
                        </div>
                      </div>
                      
                      <div className={`flex items-center ${totalChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {totalChange >= 0 ? <IoAdd className="ml-1" /> : <IoRemove className="ml-1" />}
                        ₪{Math.abs(totalChange).toLocaleString()}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
        </div>
          </motion.div>
        )}
        
        {(activeTab === 'all' || activeTab === 'debts') && (
          <motion.div
            key="debts"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          >
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-purple-200 via-purple-300 to-purple-400"></div>
            <div className="flex items-center mb-4">
              <IoSwapVertical className="text-lg text-purple-500" />
      </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {debtLoans.map(d => (
                <motion.div
                  key={d.id}
                  whileHover={{ scale: 1.02, y: -5 }}
                  className={`bg-gray-50 rounded-lg p-4 border border-l-4 ${
                    d.isPaid
                      ? 'border-gray-200 border-l-gray-300'
                      : d.isDebt
                        ? 'border-red-100 border-l-red-500'
                        : 'border-green-100 border-l-green-500'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center ml-2">
                      <HiUserCircle className={`text-xl ${
                        d.isPaid ? 'text-gray-400' : d.isDebt ? 'text-red-500' : 'text-green-500'
                      }`} />
                    </div>
                    <h4 className="font-medium text-gray-800">{d.personName}</h4>
                    <div className="mr-auto">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                      d.isPaid 
                          ? 'bg-gray-200 text-gray-700'
                          : d.isDebt
                            ? 'bg-red-100 text-red-600'
                            : 'bg-green-100 text-green-600'
                    }`}>
                        {d.isPaid ? 'שולם' : d.isDebt ? 'אני חייב' : 'חייבים לי'}
                    </span>
        </div>
      </div>

                <div className={`text-xl font-bold ${
                  d.isPaid 
                    ? 'text-gray-500' 
                    : d.isDebt 
                      ? 'text-red-600' 
                      : 'text-green-600'
                }`}>
                  ₪{d.amount.toLocaleString()}
                </div>
                
                {d.dueDate && (
                  <div className="mt-2 text-xs flex items-center text-gray-600">
                    <FiCalendar className="ml-1" />
                    {format(new Date(d.dueDate), 'dd/MM/yyyy', { locale: he })}
        </div>
                )}
              </motion.div>
            ))}
        </div>
          </motion.div>
        )}
        
        {(activeTab === 'all' || activeTab === 'transactions') && (
          <motion.div
            key="transactions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          >
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-green-200 via-green-300 to-green-400"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <IoTrendingUp className="ml-2 text-green-500" />
              היסטוריית עסקאות
            </h3>
            
            <div className="space-y-3">
              {filteredTransactions.slice(0, 10).map((t, index) => (
                <motion.div 
                  key={t.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="bg-gray-50 rounded-lg p-3 border border-gray-100 hover:shadow-sm transition-all flex items-center"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ml-3 ${
                    t.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    {t.type === 'income' ? <IoArrowUp /> : <IoArrowDown />}
      </div>

                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{t.description}</div>
                    <div className="text-sm text-gray-500 flex flex-wrap gap-2">
                      <span className="flex items-center">
                        <FiCalendar className="ml-1 text-xs" />
                        {format(new Date(t.date), 'dd/MM/yyyy', { locale: he })}
                      </span>
                      <span className="flex items-center">
                        <IoWallet className="ml-1 text-xs" />
                        {getPaymentMethodName(t.paymentMethodId)}
                      </span>
                      <span>{getCategoryName(t.categoryId)}</span>
          </div>
        </div>
                  
                  <div className={`text-lg font-bold ${
                    t.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {t.type === 'income' ? '+' : '-'}₪{t.amount.toLocaleString()}
          </div>
                </motion.div>
              ))}
              
              {filteredTransactions.length > 10 && (
                <div className="text-center py-2 text-gray-500">
                  מציג 10 עסקאות אחרונות מתוך {filteredTransactions.length}
        </div>
              )}
              
              {filteredTransactions.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  לא נמצאו עסקאות בטווח הזמן שנבחר
          </div>
              )}
        </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FinanceOverview; 