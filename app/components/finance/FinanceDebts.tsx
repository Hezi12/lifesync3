'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiCheck, FiX, FiEdit, FiTrash2, FiDollarSign, FiCalendar, FiClock, FiAlertCircle } from 'react-icons/fi';
import { HiCalendarDays, HiUserCircle } from 'react-icons/hi2';
import { IoWallet, IoSparkles, IoArrowDown, IoArrowUp, IoCashOutline, IoSwapVertical } from 'react-icons/io5';
import { DebtLoan, PaymentMethod } from '../../types';
import DebtLoanModal from './DebtLoanModal';
import { useFinanceContext } from '../../context/FinanceContext';
import { motion, AnimatePresence } from 'framer-motion';

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
  
  // מחיקת חוב/הלוואה
  const handleDeleteDebtLoan = async (id: string) => {
    if (window.confirm('האם אתה בטוח שברצונך למחוק את החוב/ההלוואה לצמיתות?')) {
      await deleteDebtLoan(id);
    }
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
  
  // מחזיר את מספר הימים שנותרו עד לתאריך היעד
  const getDaysLeft = (date: Date | undefined): number | null => {
    if (!date) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dueDate = new Date(date);
    dueDate.setHours(0, 0, 0, 0);
    
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  };
  
  return (
    <div className="space-y-3 sm:space-y-6">
      {/* סיכום */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* חובות */}
        <motion.div 
          className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-red-200 via-red-300 to-red-400"></div>
          
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">סה"כ חובות</h3>
            <motion.div 
              whileHover={{ rotate: isMobile ? 5 : 15, scale: isMobile ? 1.05 : 1.1 }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-red-500 rounded-full text-white shadow-sm"
            >
              <IoArrowDown className="text-base sm:text-lg" />
            </motion.div>
          </div>
          
          <div className="flex items-baseline">
            <motion.span 
              key={summary.debts}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-3xl font-bold text-red-600"
            >
              {summary.debts.toLocaleString()}
            </motion.span>
            <span className="text-base sm:text-lg text-gray-500 mr-1">₪</span>
          </div>
          
          <div className="mt-1 sm:mt-3 text-2xs sm:text-xs text-gray-500">
            סכום שאני חייב לאחרים
          </div>
        </motion.div>
        
        {/* הלוואות */}
        <motion.div 
          className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-green-200 via-green-300 to-green-400"></div>
          
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">סה"כ הלוואות</h3>
            <motion.div 
              whileHover={{ rotate: isMobile ? 5 : 15, scale: isMobile ? 1.05 : 1.1 }}
              className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center bg-green-500 rounded-full text-white shadow-sm"
            >
              <IoArrowUp className="text-base sm:text-lg" />
            </motion.div>
          </div>
          
          <div className="flex items-baseline">
            <motion.span 
              key={summary.loans}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl sm:text-3xl font-bold text-green-600"
            >
              {summary.loans.toLocaleString()}
            </motion.span>
            <span className="text-base sm:text-lg text-gray-500 mr-1">₪</span>
          </div>
          
          <div className="mt-1 sm:mt-3 text-2xs sm:text-xs text-gray-500">
            סכום שחייבים לי
          </div>
        </motion.div>
        
        {/* מאזן */}
        <motion.div 
          className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
          
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800">מאזן כולל</h3>
            <motion.div 
              whileHover={{ rotate: isMobile ? 5 : 15, scale: isMobile ? 1.05 : 1.1 }}
              className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center ${summary.balance >= 0 ? 'bg-blue-500' : 'bg-yellow-500'} rounded-full text-white shadow-sm`}
            >
              <IoCashOutline className="text-base sm:text-lg" />
            </motion.div>
          </div>
          
          <div className="flex items-baseline">
            <motion.span 
              key={summary.balance}
              initial={{ opacity: 0, y: -20 }}
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
                className="mr-1 sm:mr-2 text-lg sm:text-xl text-yellow-500"
              >
                <IoSparkles />
              </motion.div>
            )}
          </div>
          
          <div className="mt-1 sm:mt-3 text-2xs sm:text-xs text-gray-500">
            יתרה לאחר קיזוז
          </div>
        </motion.div>
      </div>
      
      {/* פילטרים והוספה */}
      <motion.div
        className="bg-white rounded-xl p-4 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div className="w-full sm:w-auto">
            <h3 className="text-sm sm:text-base font-semibold text-gray-800 mb-2 sm:mb-0 flex items-center">
              <HiUserCircle className="mr-1 sm:mr-2 text-indigo-500" />
              <span>חובות והלוואות</span>
              <span className="mr-2 text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                {sortedDebtLoans.length}
              </span>
            </h3>
          </div>
          
          <div className="flex flex-col xs:flex-row space-y-2 xs:space-y-0 space-x-0 xs:space-x-2 xs:space-x-reverse w-full sm:w-auto">
            <div className="flex space-x-1 sm:space-x-2 space-x-reverse flex-1 xs:flex-auto">
              <motion.button
                whileHover={{ y: isMobile ? -1 : -2 }}
                whileTap={{ scale: 0.95 }}
                className={`py-1.5 sm:py-2 rounded-lg flex-1 text-xs sm:text-sm ${filterType === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setFilterType('all')}
              >
                הכל
              </motion.button>
              
              <motion.button
                whileHover={{ y: isMobile ? -1 : -2 }}
                whileTap={{ scale: 0.95 }}
                className={`py-1.5 sm:py-2 rounded-lg flex-1 text-xs sm:text-sm ${filterType === 'debt' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setFilterType('debt')}
              >
                חובות
              </motion.button>
              
              <motion.button
                whileHover={{ y: isMobile ? -1 : -2 }}
                whileTap={{ scale: 0.95 }}
                className={`py-1.5 sm:py-2 rounded-lg flex-1 text-xs sm:text-sm ${filterType === 'loan' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                onClick={() => setFilterType('loan')}
              >
                הלוואות
              </motion.button>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openAddModal}
              className="flex items-center justify-center xs:justify-start px-3 py-1.5 sm:py-2 bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 text-xs sm:text-sm"
            >
              <FiPlus className="ml-1 sm:ml-2" />
              <span className="whitespace-nowrap">הוספת חוב/הלוואה</span>
            </motion.button>
          </div>
        </div>
      </motion.div>
      
      {/* רשימת חובות והלוואות */}
      <div className="space-y-3 sm:space-y-4">
        {sortedDebtLoans.length === 0 ? (
          <div className="bg-white rounded-xl p-8 shadow-md text-center text-gray-500">
            לא נמצאו חובות והלוואות
          </div>
        ) : (
          <AnimatePresence>
            {sortedDebtLoans.map((item, index) => {
              const paymentMethod = item.paymentMethodId ? getPaymentMethodById(item.paymentMethodId) : null;
              const daysLeft = item.dueDate ? getDaysLeft(item.dueDate) : null;
              const isItemOverdue = item.dueDate ? isOverdue(item.dueDate) : false;
              
              return (
                <motion.div 
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { duration: 0.4, delay: index * 0.05 } 
                  }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`bg-white rounded-xl p-3 sm:p-4 shadow-md hover:shadow-lg border border-gray-100 transition-all duration-300 ${
                    item.isPaid ? 'opacity-70' : ''
                  }`}
                >
                  <div className={`rounded-lg overflow-hidden relative ${
                    item.isPaid 
                      ? 'bg-gray-50'
                      : item.isDebt 
                        ? 'border-r-4 border-r-red-500 bg-red-50/30'
                        : 'border-r-4 border-r-green-500 bg-green-50/30'
                  }`}>
                    <div className="p-3 sm:p-4">
                      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-2 sm:mb-3 gap-2 sm:gap-0">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center mr-2 sm:mr-3 ${
                            item.isPaid
                              ? 'bg-gray-200 text-gray-600'
                              : item.isDebt 
                                ? 'bg-red-500/10 text-red-600'
                                : 'bg-green-500/10 text-green-600'
                          }`}>
                            {item.isPaid 
                              ? <FiCheck className="text-lg sm:text-xl" />
                              : item.isDebt 
                                ? <IoArrowDown className="text-lg sm:text-xl" />
                                : <IoArrowUp className="text-lg sm:text-xl" />
                            }
                          </div>
                          
                          <div>
                            <h4 className={`font-semibold text-base sm:text-lg ${
                              item.isPaid ? 'text-gray-500' : 'text-gray-800'
                            }`}>
                              {item.personName}
                            </h4>
                            
                            <div className="flex flex-wrap items-center mt-0.5 gap-1 sm:gap-2">
                              <span className={`inline-flex items-center text-xs sm:text-sm ${
                                item.isPaid
                                  ? 'text-gray-500'
                                  : item.isDebt
                                    ? 'text-red-600 font-medium'
                                    : 'text-green-600 font-medium'
                              }`}>
                                {item.isDebt ? 'אני חייב' : 'חייבים לי'}
                              </span>
                              
                              {item.dueDate && (
                                <span className={`text-2xs sm:text-xs flex items-center ${
                                  item.isPaid
                                    ? 'text-gray-500'
                                    : isItemOverdue && !item.isPaid
                                      ? 'text-red-500 font-medium'
                                      : 'text-blue-600'
                                }`}>
                                  <FiCalendar className="ml-1" />
                                  {formatDate(item.dueDate)}
                                  
                                  {!item.isPaid && daysLeft !== null && (
                                    <span className={`mr-1 px-1 py-0.5 rounded-full text-2xs ${
                                      isItemOverdue
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-blue-100 text-blue-600'
                                    }`}>
                                      {isItemOverdue
                                        ? `פיגור ${Math.abs(daysLeft)} ימים`
                                        : `בעוד ${daysLeft} ימים`
                                      }
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto">
                          <div className="flex flex-col items-end">
                            <span className={`text-lg sm:text-xl font-bold ${
                              item.isPaid
                                ? 'text-gray-500'
                                : item.isDebt
                                  ? 'text-red-600'
                                  : 'text-green-600'
                            }`}>
                              {item.amount.toLocaleString()} ₪
                            </span>
                            
                            {paymentMethod && (
                              <span className="mt-0.5 text-2xs sm:text-xs text-gray-500 flex items-center">
                                <span style={{ color: paymentMethod.color }}>{paymentMethod.icon}</span>
                                <span className="mr-1">{paymentMethod.name}</span>
                              </span>
                            )}
                            
                            {item.affectsBalance && (
                              <span className="mt-0.5 text-2xs sm:text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full shadow-sm">
                                משפיע על יתרה
                              </span>
                            )}
                          </div>
                          
                          <div className="flex sm:flex-col items-center gap-1 sm:gap-2 mr-3 sm:mr-0 sm:ml-3">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleTogglePaidStatus(item.id, item.isPaid)}
                              className={`p-1.5 sm:p-2 rounded-full ${
                                item.isPaid
                                  ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                  : 'bg-green-100 text-green-600 hover:bg-green-200'
                              }`}
                              title={item.isPaid ? 'סמן כלא שולם' : 'סמן כשולם'}
                            >
                              {item.isPaid ? <FiX size={16} /> : <FiCheck size={16} />}
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => openEditModal(item)}
                              className="p-1.5 sm:p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
                              title="ערוך"
                            >
                              <FiEdit size={16} />
                            </motion.button>
                            
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={() => handleDeleteDebtLoan(item.id)}
                              className="p-1.5 sm:p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                              title="מחק"
                            >
                              <FiTrash2 size={16} />
                            </motion.button>
                          </div>
                        </div>
                      </div>
                      
                      {item.notes && (
                        <div className="mt-2 text-xs sm:text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
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