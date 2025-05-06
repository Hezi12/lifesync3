'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX, FiSettings, FiCreditCard, FiTag, FiDatabase, FiTool, FiCheck } from 'react-icons/fi';
import { IoWallet, IoColorPalette, IoSwapVertical, IoSave, IoCloudUpload, IoCloudDownload, IoTrash } from 'react-icons/io5';
import { PaymentMethod, FinancialCategory } from '../../types';
import { useFinanceContext } from '../../context/FinanceContext';
import FinanceBackup from './FinanceBackup';
import { motion, AnimatePresence } from 'framer-motion';

const FinanceSettings = () => {
  const { 
    paymentMethods, 
    categories, 
    updatePaymentMethod, 
    addPaymentMethod, 
    deletePaymentMethod,
    addCategory,
    updateCategory,
    deleteCategory,
    recalculateBalances
  } = useFinanceContext();
  
  const [activeTab, setActiveTab] = useState<'paymentMethods' | 'categories' | 'backup'>('paymentMethods');
  const [isEditingPaymentMethod, setIsEditingPaymentMethod] = useState(false);
  const [editingPaymentMethodId, setEditingPaymentMethodId] = useState<string | null>(null);
  const [newPaymentMethod, setNewPaymentMethod] = useState<PaymentMethod>({
    id: '',
    name: '',
    icon: '💲',
    color: '#6366f1',
    initialBalance: 0,
    currentBalance: 0,
    keywords: []
  });
  
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<FinancialCategory>({
    id: '',
    name: '',
    icon: '📁',
    color: '#6366f1',
    type: 'expense',
    keywords: []
  });
  
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
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
  
  // עריכת שיטת תשלום
  const startEditingPaymentMethod = (method: PaymentMethod) => {
    setNewPaymentMethod({ ...method });
    setEditingPaymentMethodId(method.id);
    setIsEditingPaymentMethod(true);
  };
  
  // סיום עריכת שיטת תשלום
  const savePaymentMethod = async () => {
    try {
      setErrorMessage(null);
      
      if (!newPaymentMethod.name) {
        setErrorMessage('חובה להזין שם לאמצעי התשלום');
        return;
      }
      
      if (editingPaymentMethodId) {
        // עדכון שיטת תשלום קיימת
        await updatePaymentMethod(newPaymentMethod);
        setSuccessMessage(`אמצעי התשלום "${newPaymentMethod.name}" עודכן בהצלחה`);
      } else {
        // הוספת שיטת תשלום חדשה
        const saved = await addPaymentMethod(newPaymentMethod);
        console.log('אמצעי תשלום נשמר:', saved);
        setSuccessMessage(`אמצעי התשלום "${saved.name}" נוסף בהצלחה`);
      }
      
      // איפוס טופס העריכה
      resetPaymentMethodForm();
      
      // הסתרת הודעת ההצלחה אחרי 3 שניות
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('שגיאה בשמירת שיטת תשלום:', error);
      setErrorMessage('אירעה שגיאה בשמירת שיטת התשלום');
    }
  };
      
  // איפוס טופס עריכת שיטת תשלום
  const resetPaymentMethodForm = () => {
    setNewPaymentMethod({
      id: '',
      name: '',
      icon: '💲',
      color: '#6366f1',
      initialBalance: 0,
      currentBalance: 0,
      keywords: []
    });
    setEditingPaymentMethodId(null);
    setIsEditingPaymentMethod(false);
  };
  
  // עריכת קטגוריה
  const startEditingCategory = (category: FinancialCategory) => {
    setNewCategory({ ...category });
    setEditingCategoryId(category.id);
    setIsEditingCategory(true);
  };
  
  // סיום עריכת קטגוריה
  const saveCategory = async () => {
    try {
      if (editingCategoryId) {
        // עדכון קטגוריה קיימת
        await updateCategory(newCategory);
      } else {
        // הוספת קטגוריה חדשה
        await addCategory(newCategory);
      }
      
      // איפוס טופס העריכה
      resetCategoryForm();
    } catch (error) {
      console.error('שגיאה בשמירת קטגוריה:', error);
      alert('אירעה שגיאה בשמירת הקטגוריה');
    }
  };
  
  // איפוס טופס עריכת קטגוריה
  const resetCategoryForm = () => {
    setNewCategory({
      id: '',
      name: '',
      icon: '📁',
      color: '#6366f1',
      type: 'expense',
      keywords: []
    });
    setEditingCategoryId(null);
    setIsEditingCategory(false);
  };
  
  // אייקונים פופולריים לבחירה
  const popularIcons = [
    // כסף ובנקאות
    '💰', '💵', '💸', '💳', '💴', '💶', '💷', '🏦', '🪙', '💹', '📈', '📉', '🧾', '🏧',
    
    // קניות ומזון
    '🛒', '🛍️', '🧺', '🛒', '🏪', '🏬', 
    '🍔', '🍕', '🍟', '🌭', '🍿', '🥤', '🍦', '🍩', '🍰', '☕', '🍷', '🍺', '🍱', '🥗', '🥘', '🍲', '🥡',
    
    // קטגוריות נוספות
    '🏠', '🚗', '🏥', '👕', '📱', '🎮', '📚', '✈️', '💼', '🏛️', '🏖️', '👨‍👩‍👧‍👦', '🎁'
  ];
  
  // צבעים פופולריים לבחירה
  const popularColors = [
    // אדומים
    '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d',
    
    // כתומים
    '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12',
    
    // צהובים
    '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f',
    '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12',
    
    // ירוקים
    '#84cc16', '#65a30d', '#4d7c0f', '#3f6212', '#365314',
    '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d',
    '#10b981', '#059669', '#047857', '#065f46', '#064e3b',
    
    // תכלת וטורקיז
    '#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a',
    '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63',
    
    // כחולים
    '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e',
    '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a',
    '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81',
    
    // סגולים
    '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95',
    '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87',
    
    // ורודים
    '#d946ef', '#c026d3', '#a21caf', '#86198f', '#701a75',
    '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843',
    
    // אפורים
    '#64748b', '#475569', '#334155', '#1e293b', '#0f172a',
  ];
  
  // הוספת מילת מפתח לאמצעי תשלום
  const addPaymentMethodKeyword = (keyword: string) => {
    if (!keyword.trim()) return;
    if ((newPaymentMethod.keywords || []).includes(keyword)) return;
    
    setNewPaymentMethod({
      ...newPaymentMethod,
      keywords: [...(newPaymentMethod.keywords || []), keyword.trim()]
    });
  };
  
  // הסרת מילת מפתח מאמצעי תשלום
  const removePaymentMethodKeyword = (keyword: string) => {
    setNewPaymentMethod({
      ...newPaymentMethod,
      keywords: (newPaymentMethod.keywords || []).filter(k => k !== keyword)
    });
  };
  
  // הוספת מילת מפתח לקטגוריה
  const addCategoryKeyword = (keyword: string) => {
    if (!keyword.trim()) return;
    
    const keywords = newCategory.keywords || [];
    if (!keywords.includes(keyword.trim())) {
      setNewCategory({
        ...newCategory,
        keywords: [...keywords, keyword.trim()]
      });
    }
  };
  
  // הסרת מילת מפתח מקטגוריה
  const removeCategoryKeyword = (keywordToRemove: string) => {
    const keywords = newCategory.keywords || [];
    setNewCategory({
      ...newCategory,
      keywords: keywords.filter(keyword => keyword !== keywordToRemove)
    });
  };
  
  return (
    <div className="space-y-6">
      {/* כותרת וכפתורי ניווט */}
      <motion.div 
        className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
        
        <div className="flex items-center mb-5">
          <motion.div 
            whileHover={{ rotate: isMobile ? 5 : 15, scale: isMobile ? 1.05 : 1.1 }}
            className="w-9 h-9 flex items-center justify-center bg-indigo-500 rounded-full text-white shadow-sm mr-3"
          >
            <FiSettings className="text-xl" />
          </motion.div>
          <h2 className="text-xl font-bold text-gray-800">הגדרות פיננסיות</h2>
        </div>
        
        <div className={`flex ${isMobile ? 'flex-col space-y-2' : 'space-x-2 space-x-reverse'} text-sm`}>
          <motion.button
            whileHover={{ y: isMobile ? -1 : -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('paymentMethods')}
            className={`flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg ${isMobile ? 'justify-center' : 'flex-1'} ${
              activeTab === 'paymentMethods' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <IoWallet className="ml-1 sm:ml-2" />
            <span className="text-xs sm:text-sm">אמצעי תשלום</span>
          </motion.button>
          
          <motion.button
            whileHover={{ y: isMobile ? -1 : -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('categories')}
            className={`flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg ${isMobile ? 'justify-center' : 'flex-1'} ${
              activeTab === 'categories' 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FiTag className="ml-1 sm:ml-2" />
            <span className="text-xs sm:text-sm">קטגוריות</span>
          </motion.button>
          
          <motion.button
            whileHover={{ y: isMobile ? -1 : -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveTab('backup')}
            className={`flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg ${isMobile ? 'justify-center' : 'flex-1'} ${
              activeTab === 'backup' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
            }`}
          >
            <FiDatabase className="ml-1 sm:ml-2" />
            <span className="text-xs sm:text-sm">גיבוי ושחזור</span>
          </motion.button>
        </div>
      </motion.div>
      
      {/* הודעות הצלחה ושגיאה */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            className="bg-green-50 border border-green-100 rounded-lg p-4 text-green-700 flex items-center shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-green-100 w-8 h-8 rounded-full flex items-center justify-center text-green-500 mr-3">
              <FiCheck className="text-lg" />
            </div>
            {successMessage}
          </motion.div>
        )}
        
        {errorMessage && (
          <motion.div 
            className="bg-red-50 border border-red-100 rounded-lg p-4 text-red-700 flex items-center shadow-sm"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <div className="bg-red-100 w-8 h-8 rounded-full flex items-center justify-center text-red-500 mr-3">
              <FiX className="text-lg" />
            </div>
            {errorMessage}
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* תוכן לפי טאב */}
      <AnimatePresence mode="wait">
        {activeTab === 'backup' ? (
          <motion.div
            key="backup"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <FinanceBackup />
          </motion.div>
        ) : activeTab === 'paymentMethods' ? (
          <div className="space-y-4 sm:space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-base sm:text-lg font-medium">אמצעי תשלום</h3>
              
              {!isEditingPaymentMethod && (
                <button
                  onClick={() => setIsEditingPaymentMethod(true)}
                  className="btn-primary flex items-center text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5"
                >
                  <FiPlus className="ml-1" />
                  חדש
                </button>
              )}
            </div>
            
            {/* טופס עריכה/הוספה */}
            {isEditingPaymentMethod && (
              <div className="card p-3 sm:p-4 bg-gray-50 space-y-3 sm:space-y-4">
                <h4 className="font-medium text-sm sm:text-base">
                  {editingPaymentMethodId ? 'עריכת אמצעי תשלום' : 'הוספת אמצעי תשלום חדש'}
                </h4>
              
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">שם</label>
                    <input
                      type="text"
                      value={newPaymentMethod.name}
                      onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, name: e.target.value })}
                      className="w-full p-1.5 sm:p-2 border rounded-md text-sm"
                      placeholder="לדוגמה: מזומן, אשראי, PayPal"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">אייקון</label>
                    <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 sm:gap-2 mb-2 max-h-32 sm:max-h-40 overflow-y-auto p-1.5 sm:p-2 border rounded-md">
                      {popularIcons.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          className={`w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-md ${
                            newPaymentMethod.icon === icon ? 'bg-primary-100 border-2 border-primary-500' : 'bg-white border border-gray-300'
                          }`}
                          onClick={() => setNewPaymentMethod({ ...newPaymentMethod, icon })}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={newPaymentMethod.icon}
                      onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, icon: e.target.value })}
                      className="w-full p-1.5 sm:p-2 border rounded-md text-sm"
                      placeholder="אמוג'י"
                      maxLength={8}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">צבע</label>
                    <div className="grid grid-cols-8 sm:grid-cols-10 gap-1 sm:gap-2 mb-2 max-h-32 sm:max-h-40 overflow-y-auto p-1.5 sm:p-2 border rounded-md">
                      {popularColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-6 h-6 sm:w-8 sm:h-8 rounded-md ${
                            newPaymentMethod.color === color ? 'ring-2 ring-primary-500' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewPaymentMethod({ ...newPaymentMethod, color })}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={newPaymentMethod.color}
                      onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, color: e.target.value })}
                      className="w-full p-1 h-8 sm:h-10 border rounded-md"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        יתרה התחלתית
                        <span className="mr-1 text-2xs sm:text-xs text-gray-500">(ניתן להזין גם ערכים שליליים)</span>
                      </label>
                      <input
                        type="number"
                        inputMode="decimal"
                        value={newPaymentMethod.initialBalance}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          setNewPaymentMethod({ 
                            ...newPaymentMethod, 
                            initialBalance: value,
                            // עדכון יתרה נוכחית גם כן אם זו שיטת תשלום חדשה
                            currentBalance: editingPaymentMethodId ? newPaymentMethod.currentBalance : value 
                          });
                        }}
                        step="any"
                        className="w-full p-1.5 sm:p-2 border rounded-md text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                    מילות מפתח לזיהוי אוטומטי
                    <span className="mr-1 text-2xs sm:text-xs text-gray-500">(לדוגמה: 4 ספרות אחרונות של כרטיס אשראי)</span>
                  </label>
                  
                  <div className="flex flex-wrap gap-1 sm:gap-2 mb-2">
                    {(newPaymentMethod.keywords || []).map((keyword, index) => (
                      <div 
                        key={index}
                        className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-primary-100 text-primary-800 rounded-md flex items-center"
                      >
                        <span className="text-xs sm:text-sm">{keyword}</span>
                        <button 
                          type="button"
                          className="ml-0.5 sm:ml-1 text-primary-600 hover:text-primary-800"
                          onClick={() => removePaymentMethodKeyword(keyword)}
                        >
                          <FiX size={isMobile ? 14 : 16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex">
                    <input
                      type="text"
                      id="newPaymentMethodKeyword"
                      placeholder="הוסף מילת מפתח ולחץ על הוסף"
                      className="w-full p-1.5 sm:p-2 border rounded-md rounded-l-none text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          addPaymentMethodKeyword(input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="px-4 py-2 bg-primary-600 text-white rounded-md rounded-r-none"
                      onClick={() => {
                        const input = document.getElementById('newPaymentMethodKeyword') as HTMLInputElement;
                        addPaymentMethodKeyword(input.value);
                        input.value = '';
                      }}
                    >
                      הוסף
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 space-x-reverse">
                  <button
                    onClick={resetPaymentMethodForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <FiX className="ml-1" />
                    ביטול
                  </button>
                  
                  <button
                    onClick={savePaymentMethod}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
                    disabled={!newPaymentMethod.name}
                  >
                    <FiSave className="ml-1" />
                    שמירה
                  </button>
                </div>
              </div>
            )}
            
            {/* רשימת שיטות תשלום */}
            <div className="space-y-3">
              {paymentMethods.length === 0 ? (
                <div className="text-center py-6 text-gray-500">
                  אין שיטות תשלום להצגה
                </div>
              ) : (
                paymentMethods.map((method) => (
                  <div key={method.id} className="card p-4 flex justify-between items-center hover:bg-gray-50">
                    <div className="flex items-center">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center mr-3"
                        style={{ backgroundColor: `${method.color}25`, color: method.color }}
                      >
                        {method.icon}
                      </div>
                      
                      <div>
                        <h4 className="font-medium">{method.name}</h4>
                        <div className="text-sm text-gray-600">
                          יתרה: {method.currentBalance.toLocaleString()} ₪
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 space-x-reverse">
                      <button
                        onClick={() => startEditingPaymentMethod(method)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                        title="עריכה"
                      >
                        <FiEdit size={18} />
                      </button>
                      
                      <button
                        onClick={() => deletePaymentMethod(method.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                        title="מחיקה"
                      >
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">קטגוריות</h3>
              
              {!isEditingCategory && (
                <button
                  onClick={() => setIsEditingCategory(true)}
                  className="btn-primary flex items-center"
                >
                  <FiPlus className="ml-1" />
                  חדש
                </button>
              )}
            </div>
            
            {/* טופס עריכה/הוספה */}
            {isEditingCategory && (
              <div className="card p-4 bg-gray-50 space-y-4">
                <h4 className="font-medium">
                  {editingCategoryId ? 'עריכת קטגוריה' : 'הוספת קטגוריה חדשה'}
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
                    <input
                      type="text"
                      value={newCategory.name}
                      onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      placeholder="לדוגמה: מזון, תחבורה, בידור"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">סוג</label>
                    <div className="flex">
                      <button
                        type="button"
                        className={`flex-1 py-2 border-l ${
                          newCategory.type === 'income'
                            ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                        }`}
                        onClick={() => setNewCategory({ ...newCategory, type: 'income' })}
                      >
                        הכנסה
                      </button>
                      
                      <button
                        type="button"
                        className={`flex-1 py-2 ${
                          newCategory.type === 'expense'
                            ? 'bg-red-100 text-red-800 border-red-300'
                            : 'bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200'
                        }`}
                        onClick={() => setNewCategory({ ...newCategory, type: 'expense' })}
                      >
                        הוצאה
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">אייקון</label>
                    <div className="grid grid-cols-10 gap-2 mb-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                      {popularIcons.map((icon) => (
                        <button
                          key={icon}
                          type="button"
                          className={`w-8 h-8 flex items-center justify-center rounded-md ${
                            newCategory.icon === icon ? 'bg-primary-100 border-2 border-primary-500' : 'bg-white border border-gray-300'
                          }`}
                          onClick={() => setNewCategory({ ...newCategory, icon })}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={newCategory.icon}
                      onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                      className="w-full p-2 border rounded-md"
                      placeholder="אמוג'י"
                      maxLength={8}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">צבע</label>
                    <div className="grid grid-cols-10 gap-2 mb-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                      {popularColors.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-8 h-8 rounded-md ${
                            newCategory.color === color ? 'ring-2 ring-primary-500' : ''
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setNewCategory({ ...newCategory, color })}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={newCategory.color}
                      onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                      className="w-full p-1 h-10 border rounded-md"
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    מילות מפתח לזיהוי אוטומטי
                    <span className="mr-1 text-xs text-gray-500">(שמות של בתי עסק או ביטויים שמופיעים בתיאור)</span>
                  </label>
                  
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(newCategory.keywords || []).map((keyword, index) => (
                      <div 
                        key={index} 
                        className="px-2 py-1 bg-primary-100 text-primary-800 rounded-md flex items-center"
                      >
                        <span>{keyword}</span>
                        <button
                          type="button"
                          className="ml-1 text-primary-600 hover:text-primary-800"
                          onClick={() => removeCategoryKeyword(keyword)}
                        >
                          <FiX size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex">
                    <input
                      type="text"
                      id="newCategoryKeyword"
                      placeholder="הוסף מילת מפתח ולחץ על הוסף"
                      className="w-full p-2 border rounded-md rounded-l-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const input = e.target as HTMLInputElement;
                          addCategoryKeyword(input.value);
                          input.value = '';
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="px-4 py-2 bg-primary-600 text-white rounded-md rounded-r-none"
                      onClick={() => {
                        const input = document.getElementById('newCategoryKeyword') as HTMLInputElement;
                        addCategoryKeyword(input.value);
                        input.value = '';
                      }}
                    >
                      הוסף
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 space-x-reverse">
                  <button
                    onClick={resetCategoryForm}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
                  >
                    <FiX className="ml-1" />
                    ביטול
                  </button>
                  
                  <button
                    onClick={saveCategory}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 flex items-center"
                    disabled={!newCategory.name}
                  >
                    <FiSave className="ml-1" />
                    שמירה
                  </button>
                </div>
              </div>
            )}
            
            {/* רשימת קטגוריות */}
            <div>
              <h4 className="font-medium mb-2">קטגוריות הכנסה</h4>
              <div className="space-y-2 mb-4">
                {categories.filter(cat => cat.type === 'income').length === 0 ? (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                    אין קטגוריות הכנסה להצגה
                  </div>
                ) : (
                  categories
                    .filter(cat => cat.type === 'income')
                    .map((category) => (
                      <div key={category.id} className="card p-3 flex justify-between items-center hover:bg-gray-50">
                        <div className="flex items-center">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
                            style={{ backgroundColor: `${category.color}25`, color: category.color }}
                          >
                            {category.icon}
                          </div>
                          
                          <h4 className="font-medium">{category.name}</h4>
                        </div>
                        
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => startEditingCategory(category)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                            title="עריכה"
                          >
                            <FiEdit size={16} />
                          </button>
                          
                          <button
                            onClick={() => deleteCategory(category.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                            title="מחיקה"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
              
              <h4 className="font-medium mb-2">קטגוריות הוצאה</h4>
              <div className="space-y-2">
                {categories.filter(cat => cat.type === 'expense').length === 0 ? (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                    אין קטגוריות הוצאה להצגה
                  </div>
                ) : (
                  categories
                    .filter(cat => cat.type === 'expense')
                    .map((category) => (
                      <div key={category.id} className="card p-3 flex justify-between items-center hover:bg-gray-50">
                        <div className="flex items-center">
                          <div 
                            className="w-8 h-8 rounded-full flex items-center justify-center mr-2"
                            style={{ backgroundColor: `${category.color}25`, color: category.color }}
                          >
                            {category.icon}
                          </div>
                          
                          <h4 className="font-medium">{category.name}</h4>
                        </div>
                        
                        <div className="flex space-x-2 space-x-reverse">
                          <button
                            onClick={() => startEditingCategory(category)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full"
                            title="עריכה"
                          >
                            <FiEdit size={16} />
                          </button>
                          
                          <button
                            onClick={() => deleteCategory(category.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-full"
                            title="מחיקה"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
      
      {/* כפתור לשחזור יתרות */}
      <motion.div 
        className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-amber-200 via-amber-300 to-amber-400"></div>
        
        <div className="flex items-center mb-4">
          <motion.div 
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="w-9 h-9 flex items-center justify-center bg-amber-500 rounded-full text-white shadow-sm ml-3"
          >
            <FiTool className="text-lg" />
          </motion.div>
          
          <h3 className="text-lg font-medium text-gray-800">תחזוקת מערכת</h3>
        </div>
        
        <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
          <h4 className="font-medium text-amber-800 mb-2 flex items-center">
            <IoSwapVertical className="ml-2 text-amber-600" />
            שחזור יתרות
          </h4>
          <p className="text-sm text-amber-700 mb-3">
            אם הופיעו בעיות בחישוב היתרות לאחר ייבוא עסקאות או מחיקתן, לחץ על הכפתור כדי לחשב מחדש את היתרות.
            פעולה זו תאפס את היתרות הנוכחיות לפי היתרות ההתחלתיות, ואז תחשב מחדש את כל העסקאות.
          </p>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 shadow-sm flex items-center mx-auto"
            onClick={() => {
              if (window.confirm('האם אתה בטוח שברצונך לחשב מחדש את כל היתרות? פעולה זו תאפס ותחשב מחדש את כל היתרות לפי העסקאות שבמערכת.')) {
                // קריאה לפונקציה החדשה במקום רענון הדף
                recalculateBalances();
                alert('היתרות חושבו מחדש בהצלחה!');
              }
            }}
          >
            <IoSwapVertical className="ml-2" />
            חשב מחדש יתרות
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

export default FinanceSettings; 