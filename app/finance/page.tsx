'use client';

import { useState, useEffect } from 'react';
import { FiDollarSign, FiCreditCard, FiFileText, FiSettings, FiBarChart2, FiMenu, FiX } from 'react-icons/fi';
import FinanceBalance from '../components/finance/FinanceBalance';
import FinanceTransactions from '../components/finance/FinanceTransactions';
import FinanceDebts from '../components/finance/FinanceDebts';
import FinanceSettings from '../components/finance/FinanceSettings';
import CreditCardImport from '../components/finance/CreditCardImport';
import FinanceOverview from '../components/finance/FinanceOverview';
import { useFinanceContext } from '../context/FinanceContext';
import AuthGuard from '../components/AuthGuard';
import { motion, AnimatePresence } from 'framer-motion';

type FinanceView = 'balance' | 'transactions' | 'debts' | 'settings' | 'overview';

export default function FinancePage() {
  const [selectedView, setSelectedView] = useState<FinanceView>('balance');
  const { isLoading, error, totalBalance, isOnline, pendingChanges } = useFinanceContext();
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // כאשר הדף נטען או משתנה תצוגה, סגור את התפריט במובייל
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [selectedView]);

  const renderView = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-xl text-gray-500">טוען נתונים...</div>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <div className="text-xl text-red-500">שגיאה בטעינת הנתונים</div>
            <div className="text-gray-500">{error}</div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
            >
              נסה שוב
            </button>
          </div>
        </div>
      );
    }

    switch (selectedView) {
      case 'balance':
        return <FinanceBalance />;
      case 'transactions':
        return <FinanceTransactions />;
      case 'debts':
        return <FinanceDebts />;
      case 'settings':
        return <FinanceSettings />;
      case 'overview':
        return <FinanceOverview />;
      default:
        return <FinanceBalance />;
    }
  };

  // מערך של פריטי התפריט לשימוש בשני התצוגות
  const menuItems = [
    { view: 'balance', icon: <FiDollarSign className="ml-2" />, label: 'מצב הון' },
    { view: 'transactions', icon: <FiCreditCard className="ml-2" />, label: 'עסקאות' },
    { view: 'debts', icon: <FiFileText className="ml-2" />, label: 'חובות והלוואות' },
    { view: 'overview', icon: <FiBarChart2 className="ml-2" />, label: 'סקירה מקיפה' },
    { view: 'settings', icon: <FiSettings className="ml-2" />, label: 'הגדרות' }
  ];

  // תפריט למובייל - שיפור האנימציות והעיצוב
  const MobileMenu = () => (
    <div className="block md:hidden mb-4">
      <div className="flex justify-between items-center mb-3">
        {/* כפתור תפריט */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-md bg-gray-200 text-gray-700 shadow-sm"
          aria-label={mobileMenuOpen ? "סגור תפריט" : "פתח תפריט"}
        >
          <AnimatePresence mode="wait">
            {mobileMenuOpen ? (
              <motion.div
                key="close"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiX size={24} />
              </motion.div>
            ) : (
              <motion.div 
                key="menu"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <FiMenu size={24} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>
        
        {/* סטטוס ויתרה כוללת */}
        <div className="flex items-center gap-2">
          {!isOnline && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md flex items-center text-xs shadow-sm"
            >
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse ml-1"></div>
              <span>לא מקוון</span>
            </motion.div>
          )}
          <motion.div 
            whileHover={{ y: -2 }}
            className="bg-primary-100 text-primary-800 px-3 py-1 rounded-md flex items-center text-sm md:text-base shadow-sm"
          >
            <FiDollarSign className="ml-1" />
            <motion.span 
              key={totalBalance}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-bold"
            >
              {totalBalance.toLocaleString()} ₪
            </motion.span>
          </motion.div>
        </div>
      </div>
      
      {/* תפריט נפתח */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="bg-white rounded-md shadow-md overflow-hidden mb-4 border border-gray-100"
          >
            <div className="flex flex-col">
              {menuItems.map((item, index) => (
                <motion.button
                  key={item.view}
                  onClick={() => setSelectedView(item.view as FinanceView)}
                  className={`px-4 py-3 flex items-center border-b border-gray-100 ${
                    selectedView === item.view 
                      ? 'bg-primary-50 text-primary-700 font-medium' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ 
                    opacity: 1, 
                    x: 0,
                    transition: { delay: index * 0.05 }
                  }}
                >
                  <span className="flex items-center">
                    {item.icon}
                    {item.label}
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* טיפ: הצג את הדף הנוכחי כותרת כאשר התפריט סגור */}
      <AnimatePresence mode="wait">
        {!mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="text-lg font-medium mb-4 bg-white p-2 rounded-md shadow-sm border border-gray-100 flex items-center"
          >
            <span className="mr-2 text-primary-500">
              {menuItems.find(item => item.view === selectedView)?.icon}
            </span>
            {menuItems.find(item => item.view === selectedView)?.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  // תפריט לדסקטופ
  const DesktopMenu = () => (
    <div className="hidden md:flex justify-between items-center mb-6">
      <div className="overflow-x-auto">
        <div className="flex space-x-4 rtl:space-x-reverse min-w-max">
          {menuItems.map((item) => (
              <button
              key={item.view}
              onClick={() => setSelectedView(item.view as FinanceView)}
                className={`px-4 py-2 rounded-md flex items-center ${
                selectedView === item.view 
                    ? 'bg-primary-500 text-white shadow-md' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
              {item.icon}
              <span>{item.label}</span>
              </button>
          ))}
            </div>
          </div>
          
          <div className="flex items-center gap-2 rtl:space-x-reverse mr-4">
            {!isOnline && (
              <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-md flex items-center text-sm">
                <span className="ml-1">מצב לא מקוון</span>
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
              </div>
            )}
            {pendingChanges && (
              <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md flex items-center text-sm">
                <span>שינויים בהמתנה</span>
              </div>
            )}
            <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-md flex items-center">
              <FiDollarSign className="ml-1" />
              <span className="font-bold">{totalBalance.toLocaleString()} ₪</span>
            </div>
          </div>
        </div>
  );

  return (
    <AuthGuard>
      <div className="container mx-auto px-2 sm:px-4 py-3 sm:py-4">
        {/* תפריט מובייל */}
        <MobileMenu />
        
        {/* תפריט דסקטופ */}
        <DesktopMenu />
        
        {/* תוכן הדף */}
        <div className="pb-20 md:pb-10">
        {renderView()}
        </div>
      </div>
    </AuthGuard>
  );
} 