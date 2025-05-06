'use client';

import { useState, useEffect } from 'react';
import { FiArrowUp, FiArrowDown, FiPlus, FiFilter, FiSearch, FiChevronLeft, FiChevronRight, FiTrash2, FiUpload, FiCalendar, FiClock, FiDollarSign, FiList } from 'react-icons/fi';
import { HiCalendarDays, HiChartBar } from 'react-icons/hi2';
import { IoWallet, IoSparkles, IoAnalytics, IoListSharp, IoStatsChart } from 'react-icons/io5';
import { Transaction, PaymentMethod, FinancialCategory } from '../../types';
import TransactionModal from './TransactionModal';
import TransactionChart from './TransactionChart';
import { useFinanceContext } from '../../context/FinanceContext';
import CreditCardImport from './CreditCardImport';
import { Dialog } from '@headlessui/react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
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

  // פתיחת מודל לייבוא עסקאות
  const openImportModal = () => {
    setIsImportModalOpen(true);
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
    <div className="space-y-4 sm:space-y-6">
      {/* כותרת ובקרת חודשים */}
      <motion.div 
        className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <motion.div 
              whileHover={{ rotate: isMobile ? 5 : 15, scale: isMobile ? 1.05 : 1.1 }}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center bg-indigo-500 rounded-full text-white shadow-sm mr-2 sm:mr-3"
            >
              <HiCalendarDays className="text-base sm:text-lg" />
            </motion.div>
            
            <div className="flex items-center space-x-2 sm:space-x-3 space-x-reverse">
              <motion.button
                whileHover={{ scale: isMobile ? 1.05 : 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToPreviousMonth}
                className="p-1 sm:p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                title="חודש קודם"
              >
                <FiChevronRight size={isMobile ? 16 : 20} />
              </motion.button>
              
              <motion.h2 
                className="text-xl sm:text-2xl font-bold text-gray-800"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                key={formatMonthYear()}
              >
                {formatMonthYear()}
              </motion.h2>
              
              <motion.button
                whileHover={{ scale: isMobile ? 1.05 : 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToNextMonth}
                className="p-1 sm:p-1.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700"
                title="חודש הבא"
              >
                <FiChevronLeft size={isMobile ? 16 : 20} />
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05, y: isMobile ? -1 : -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={goToCurrentMonth}
                className="text-xs sm:text-sm text-indigo-600 bg-white border border-indigo-200 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full hover:bg-indigo-50"
              >
                החודש הנוכחי
              </motion.button>
            </div>
          </div>
          
          <div className="flex space-x-2 sm:space-x-3 space-x-reverse w-full sm:w-auto">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openImportModal}
              className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-white border border-indigo-300 text-indigo-600 rounded-lg shadow-sm hover:bg-indigo-50 text-xs sm:text-sm flex-1 sm:flex-none justify-center sm:justify-start"
            >
              <FiUpload className="ml-1 sm:ml-2" />
              <span className="whitespace-nowrap">ייבוא עסקאות</span>
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openAddModal}
              className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 text-xs sm:text-sm flex-1 sm:flex-none justify-center sm:justify-start"
            >
              <FiPlus className="ml-1 sm:ml-2" />
              <span className="whitespace-nowrap">עסקה חדשה</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
      
      {/* סיכום חודשי */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
        {/* הכנסות */}
        <motion.div 
          className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-green-200 via-green-300 to-green-400"></div>
          
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">הכנסות החודש</h3>
            <motion.div 
              whileHover={{ rotate: isMobile ? 5 : 15, scale: isMobile ? 1.05 : 1.1 }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-green-500 rounded-full text-white shadow-sm"
            >
              <FiArrowUp className="text-base sm:text-lg" />
            </motion.div>
          </div>
          
          <div className="flex items-baseline">
            <motion.span 
              key={summary.income}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-3xl font-bold text-green-600"
            >
              {summary.income.toLocaleString()}
            </motion.span>
            <span className="text-base sm:text-lg text-gray-500 mr-1">₪</span>
          </div>
          
          <div className="mt-1 sm:mt-3 text-2xs sm:text-xs text-gray-500">
            מתוך {filteredTransactionsByMonth.filter(t => t.type === 'income').length} עסקאות
          </div>
        </motion.div>
        
        {/* הוצאות */}
        <motion.div 
          className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-red-200 via-red-300 to-red-400"></div>
          
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">הוצאות החודש</h3>
            <motion.div 
              whileHover={{ rotate: isMobile ? 5 : 15, scale: isMobile ? 1.05 : 1.1 }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-red-500 rounded-full text-white shadow-sm"
            >
              <FiArrowDown className="text-base sm:text-lg" />
            </motion.div>
          </div>
          
          <div className="flex items-baseline">
            <motion.span 
              key={summary.expense}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-3xl font-bold text-red-600"
            >
              {summary.expense.toLocaleString()}
            </motion.span>
            <span className="text-base sm:text-lg text-gray-500 mr-1">₪</span>
          </div>
          
          <div className="mt-1 sm:mt-3 text-2xs sm:text-xs text-gray-500">
            מתוך {filteredTransactionsByMonth.filter(t => t.type === 'expense').length} עסקאות
          </div>
        </motion.div>

        {/* מאזן */}
        <motion.div 
          className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden col-span-1 sm:col-span-2 md:col-span-1"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
          
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">מאזן חודשי</h3>
            <motion.div 
              whileHover={{ rotate: isMobile ? 5 : 15, scale: isMobile ? 1.05 : 1.1 }}
              className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center ${summary.balance >= 0 ? 'bg-blue-500' : 'bg-yellow-500'} rounded-full text-white shadow-sm`}
            >
              <IoStatsChart className="text-base sm:text-lg" />
            </motion.div>
          </div>
          
          <div className="flex items-baseline">
            <motion.span 
              key={summary.balance}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-xl sm:text-3xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}
            >
              {summary.balance.toLocaleString()}
            </motion.span>
            <span className="text-base sm:text-lg text-gray-500 mr-1">₪</span>
            
            {summary.balance > 0 && (
              <motion.div 
                animate={{ rotate: [0, 10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse" }}
                className="mr-1 sm:mr-2 text-yellow-500 text-lg sm:text-xl"
              >
                <IoSparkles />
              </motion.div>
            )}
          </div>
          
          <div className="mt-1 sm:mt-3 text-2xs sm:text-xs text-gray-500">
            סה"כ {filteredTransactionsByMonth.length} עסקאות בחודש
          </div>
        </motion.div>
      </div>
      
      {/* תרשימים ומסננים */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
        {/* תרשימים */}
        <motion.div 
          className="col-span-1 md:col-span-8 bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800">התפלגות הכנסות</h3>
                <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-green-100 rounded-full text-green-600">
                  <FiArrowUp className="text-xs sm:text-sm" />
                </div>
              </div>
              {incomeData.length === 0 ? (
                <div className="h-40 sm:h-52 flex items-center justify-center text-gray-500 text-xs sm:text-sm border border-dashed border-gray-200 rounded-lg">
                  אין נתוני הכנסות לחודש זה
                </div>
              ) : (
                <div className="h-40 sm:h-52">
                  <TransactionChart data={incomeData} />
                </div>
              )}
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-3 sm:mb-4">
                <h3 className="text-sm sm:text-base font-semibold text-gray-800">התפלגות הוצאות</h3>
                <div className="w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center bg-red-100 rounded-full text-red-600">
                  <FiArrowDown className="text-xs sm:text-sm" />
                </div>
              </div>
              {expenseData.length === 0 ? (
                <div className="h-40 sm:h-52 flex items-center justify-center text-gray-500 text-xs sm:text-sm border border-dashed border-gray-200 rounded-lg">
                  אין נתוני הוצאות לחודש זה
                </div>
              ) : (
                <div className="h-40 sm:h-52">
                  <TransactionChart data={expenseData} />
                </div>
              )}
            </div>
          </div>
        </motion.div>
        
        {/* מסננים וחיפוש */}
        <motion.div 
          className="col-span-1 md:col-span-4 bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
          
          <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
            <IoListSharp className="ml-1 sm:ml-2 text-indigo-500" />
            סינון וחיפוש
          </h3>
          
          <div className="space-y-3 sm:space-y-4">
            <div className="flex space-x-1 sm:space-x-2 space-x-reverse">
              <motion.button
                whileHover={{ y: isMobile ? -1 : -2 }}
                whileTap={{ scale: 0.95 }}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex-1 text-xs sm:text-sm ${filterType === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setFilterType('all')}
              >
                הכל
              </motion.button>
              
              <motion.button
                whileHover={{ y: isMobile ? -1 : -2 }}
                whileTap={{ scale: 0.95 }}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex-1 text-xs sm:text-sm ${filterType === 'income' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setFilterType('income')}
              >
                הכנסות
              </motion.button>
              
              <motion.button
                whileHover={{ y: isMobile ? -1 : -2 }}
                whileTap={{ scale: 0.95 }}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg flex-1 text-xs sm:text-sm ${filterType === 'expense' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setFilterType('expense')}
              >
                הוצאות
              </motion.button>
            </div>
            
            <div className="relative">
              <FiSearch className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="חיפוש לפי תיאור..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-3 pr-10 py-2 text-sm border border-gray-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            
            <div className="text-2xs sm:text-xs text-gray-500 mt-3 sm:mt-4">
              מציג {sortedTransactions.length} מתוך {filteredTransactionsByMonth.length} עסקאות
            </div>
          </div>
        </motion.div>
      </div>
      
      {/* רשימת עסקאות */}
      <motion.div 
        className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
        
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center">
          <span className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center bg-gray-800 rounded-full mr-1 sm:mr-2 text-white shadow-sm">
            <FiList className="text-xs sm:text-sm" />
          </span>
          רשימת עסקאות
        </h3>
        
        <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
          {sortedTransactions.length === 0 ? (
            <div className="text-center py-6 sm:py-10 text-gray-500 text-sm border border-dashed border-gray-300 rounded-lg">
              אין עסקאות להצגה בחודש זה
            </div>
          ) : (
            <AnimatePresence>
              {sortedTransactions.map((transaction, index) => {
                const category = getCategoryById(transaction.categoryId);
                const paymentMethod = getPaymentMethodById(transaction.paymentMethodId);
                
                return (
                  <motion.div 
                    key={transaction.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    exit={{ opacity: 0, height: 0 }}
                    whileHover={{ scale: isMobile ? 1.005 : 1.01, x: isMobile ? 1 : 3 }}
                    onClick={() => openEditModal(transaction)}
                    className={`p-3 sm:p-4 rounded-lg border shadow-sm transition-all hover:shadow cursor-pointer ${
                      transaction.type === 'income' 
                        ? 'border-r-4 border-r-green-500 border-green-100 bg-green-50/30' 
                        : 'border-r-4 border-r-red-500 border-red-100 bg-red-50/30'
                    }`}
                  >
                    <div className="flex justify-between">
                      <div className="flex-1 overflow-hidden">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <h3 className="font-semibold text-base sm:text-lg text-gray-800 truncate">{transaction.description}</h3>
                          
                          {category && (
                            <span 
                              className="text-2xs sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex items-center shadow-sm whitespace-nowrap" 
                              style={{ backgroundColor: `${category.color}20`, color: category.color, borderColor: `${category.color}40` }}
                            >
                              <span className="ml-0.5 sm:ml-1">{category.icon}</span>
                              {category.name}
                            </span>
                          )}
                        </div>
                        
                        <div className="mt-1.5 sm:mt-2 flex flex-wrap items-center gap-1.5 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <div className="flex items-center bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md shadow-sm border border-gray-100">
                            <span className={transaction.type === 'income' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                              {transaction.type === 'income' ? '+' : '-'}{transaction.amount.toLocaleString()} ₪
                            </span>
                          </div>
                          
                          <div className="flex items-center">
                            <FiCalendar className="ml-0.5 sm:ml-1 text-gray-400" />
                            <span>{formatDate(transaction.date)}</span>
                          </div>
                          
                          {paymentMethod && (
                            <div className="flex items-center bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border border-gray-100 max-w-[120px] sm:max-w-none">
                              <span className="flex items-center truncate">
                                <span style={{ color: paymentMethod.color }} className="ml-0.5 sm:ml-1 flex-shrink-0">{paymentMethod.icon}</span>
                                <span className="truncate">{paymentMethod.name}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center justify-center ml-1 sm:ml-2">
                        <span className={`text-xl sm:text-2xl ${transaction.type === 'income' ? 'text-green-500' : 'text-red-500'}`}>
                          {transaction.type === 'income' ? <FiArrowUp /> : <FiArrowDown />}
                        </span>
                        
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation(); // מניעת הפעלת האירוע של הדיב הראשי
                            handleDeleteTransaction(transaction.id);
                          }}
                          className="mt-1 sm:mt-2 p-1 sm:p-1.5 rounded-full bg-white border border-red-200 text-red-600 hover:bg-red-50 shadow-sm"
                          title="מחק"
                        >
                          <FiTrash2 size={isMobile ? 14 : 16} />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </motion.div>
      
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

      {/* מודל לייבוא עסקאות */}
      {isImportModalOpen && (
        <Dialog
          open={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          className="fixed inset-0 z-10 overflow-y-auto"
        >
          <div className="flex items-center justify-center min-h-screen">
            <div className="fixed inset-0 bg-black bg-opacity-30" aria-hidden="true" />
            
            <div className="relative bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto p-3 sm:p-4 shadow-xl mx-2 sm:mx-4">
              <div className="absolute top-2 sm:top-4 right-2 sm:right-4">
                <button
                  onClick={() => setIsImportModalOpen(false)}
                  className="p-1 rounded-full text-gray-500 hover:bg-gray-100"
                >
                  <FiTrash2 size={isMobile ? 16 : 18} />
                </button>
              </div>
              
              <CreditCardImport 
                onClose={() => setIsImportModalOpen(false)}
                paymentMethods={paymentMethods}
                categories={categories}
              />
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};

export default FinanceTransactions; 