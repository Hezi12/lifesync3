'use client';

import { useState } from 'react';
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
    <div className="space-y-6">
      {/* סיכום */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* חובות */}
        <motion.div 
          className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-red-200 via-red-300 to-red-400"></div>
          
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-gray-800">סה"כ חובות</h3>
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-9 h-9 flex items-center justify-center bg-red-500 rounded-full text-white shadow-sm"
            >
              <IoArrowDown className="text-lg" />
            </motion.div>
          </div>
          
          <div className="flex items-baseline">
            <motion.span 
              key={summary.debts}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-red-600"
            >
              {summary.debts.toLocaleString()}
            </motion.span>
            <span className="text-lg text-gray-500 mr-1">₪</span>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            סכום שאני חייב לאחרים
          </div>
        </motion.div>
        
        {/* הלוואות */}
        <motion.div 
          className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-green-200 via-green-300 to-green-400"></div>
          
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-gray-800">סה"כ הלוואות</h3>
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className="w-9 h-9 flex items-center justify-center bg-green-500 rounded-full text-white shadow-sm"
            >
              <IoArrowUp className="text-lg" />
            </motion.div>
          </div>
          
          <div className="flex items-baseline">
            <motion.span 
              key={summary.loans}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold text-green-600"
            >
              {summary.loans.toLocaleString()}
            </motion.span>
            <span className="text-lg text-gray-500 mr-1">₪</span>
          </div>
          
          <div className="mt-3 text-xs text-gray-500">
            סכום שחייבים לי
          </div>
        </motion.div>
        
        {/* מאזן */}
        <motion.div 
          className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
          
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-base font-semibold text-gray-800">מאזן כולל</h3>
            <motion.div 
              whileHover={{ rotate: 15, scale: 1.1 }}
              className={`w-9 h-9 flex items-center justify-center ${summary.balance >= 0 ? 'bg-blue-500' : 'bg-yellow-500'} rounded-full text-white shadow-sm`}
            >
              <IoCashOutline className="text-lg" />
            </motion.div>
          </div>
          
          <div className="flex items-baseline">
            <motion.span 
              key={summary.balance}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-3xl font-bold ${summary.balance >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}
            >
              {summary.balance.toLocaleString()}
            </motion.span>
            <span className="text-lg text-gray-500 mr-1">₪</span>
            
            {summary.balance > 0 && (
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
            יתרה לאחר קיזוז
          </div>
        </motion.div>
      </div>
      
      {/* מסנן */}
      <motion.div 
        className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
        
        <div className="flex space-x-2 space-x-reverse justify-between">
          <div className="flex space-x-2 space-x-reverse">
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg ${filterType === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setFilterType('all')}
            >
              הכל
            </motion.button>
            
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg ${filterType === 'debt' ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setFilterType('debt')}
            >
              חובות
            </motion.button>
            
            <motion.button
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.95 }}
              className={`px-4 py-2 rounded-lg ${filterType === 'loan' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setFilterType('loan')}
            >
              הלוואות
            </motion.button>
          </div>
          
          <div className="flex items-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openAddModal}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg shadow-sm hover:bg-purple-700"
            >
              <FiPlus className="ml-2" />
              הוסף חדש
            </motion.button>
          </div>
        </div>
      </motion.div>
      
      {/* רשימת חובות והלוואות */}
      <motion.div 
        className="relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        {sortedDebtLoans.length === 0 ? (
          <div className="text-center py-10 text-gray-500 bg-white rounded-xl border border-dashed border-gray-300">
            אין {filterType === 'all' ? 'חובות והלוואות' : filterType === 'debt' ? 'חובות' : 'הלוואות'} להצגה
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {sortedDebtLoans.map((item, index) => {
                const paymentMethod = item.paymentMethodId ? getPaymentMethodById(item.paymentMethodId) : undefined;
                const daysLeft = item.dueDate ? getDaysLeft(item.dueDate) : null;
                
                return (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md border transition-all cursor-pointer ${
                      item.isPaid
                        ? 'border-gray-200 border-r-4 border-r-gray-300 bg-gray-50/50'
                        : item.isDebt
                          ? 'border-red-100 border-r-4 border-r-red-500 bg-red-50/30'
                          : 'border-green-100 border-r-4 border-r-green-500 bg-green-50/30'
                    }`}
                    onClick={() => openEditModal(item)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center mb-2">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center mr-2">
                            <HiUserCircle className={`text-2xl ${
                              item.isPaid ? 'text-gray-400' : item.isDebt ? 'text-red-500' : 'text-green-500'
                            }`} />
                          </div>
                          <div>
                            <h3 className={`font-semibold ${item.isPaid ? 'text-gray-500' : 'text-gray-800'}`}>
                              {item.personName}
                            </h3>
                            <div className="flex space-x-1 space-x-reverse">
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                item.isPaid
                                  ? 'bg-gray-200 text-gray-700'
                                  : item.isDebt
                                    ? 'bg-red-100 text-red-600'
                                    : 'bg-green-100 text-green-600'
                              }`}>
                                {item.isPaid ? 'שולם' : item.isDebt ? 'אני חייב' : 'חייבים לי'}
                              </span>
                              
                              {!item.isPaid && item.dueDate && daysLeft !== null && (
                                <span className={`text-xs px-2 py-0.5 rounded-full ${
                                  daysLeft < 0 
                                    ? 'bg-red-100 text-red-600' 
                                    : daysLeft < 7 
                                      ? 'bg-yellow-100 text-yellow-600'
                                      : 'bg-blue-100 text-blue-600'
                                }`}>
                                  {daysLeft < 0 
                                    ? `באיחור של ${Math.abs(daysLeft)} ימים` 
                                    : daysLeft === 0 
                                      ? 'היום' 
                                      : `נותרו ${daysLeft} ימים`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end">
                        <div className={`text-base font-bold mb-1 ${
                          item.isPaid 
                            ? 'text-gray-500' 
                            : item.isDebt 
                              ? 'text-red-600' 
                              : 'text-green-600'
                        }`}>
                          {item.amount.toLocaleString()} ₪
                        </div>
                        
                        <div className="flex gap-1">
                          {!item.isPaid && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePaidStatus(item.id, item.isPaid);
                              }}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full p-1.5"
                              title="סמן כשולם"
                            >
                              <FiCheck className="text-sm" />
                            </motion.button>
                          )}
                          
                          {item.isPaid && (
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePaidStatus(item.id, item.isPaid);
                              }}
                              className="bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full p-1.5"
                              title="סמן כלא שולם"
                            >
                              <FiX className="text-sm" />
                            </motion.button>
                          )}
                          
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteDebtLoan(item.id);
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 rounded-full p-1.5"
                            title="מחק לצמיתות"
                          >
                            <FiTrash2 className="text-sm" />
                          </motion.button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
                      <div className="flex flex-wrap gap-2">
                        {item.dueDate && (
                          <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                            <FiCalendar className={`ml-1 ${
                              !item.isPaid && isOverdue(item.dueDate) ? 'text-red-500' : 'text-gray-400'
                            }`} />
                            <span className={!item.isPaid && isOverdue(item.dueDate) ? 'text-red-600 font-medium' : 'text-gray-600'}>
                              {formatDate(item.dueDate)}
                            </span>
                          </div>
                        )}
                        
                        {paymentMethod && (
                          <div className="flex items-center bg-gray-50 px-2 py-1 rounded-md">
                            <span className="flex items-center text-gray-600">
                              <span style={{ color: paymentMethod.color }} className="ml-1">{paymentMethod.icon}</span>
                              {paymentMethod.name}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {item.notes && (
                        <div className="mt-2 text-gray-600 bg-gray-50 p-2 rounded-md line-clamp-2">
                          {item.notes}
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
      
      {/* מודל להוספה/עריכה */}
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