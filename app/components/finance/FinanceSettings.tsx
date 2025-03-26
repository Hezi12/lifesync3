'use client';

import { useState } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import { PaymentMethod, FinancialCategory } from '../../types';
import { useFinanceContext } from '../../context/FinanceContext';

const FinanceSettings = () => {
  const { 
    paymentMethods, 
    categories, 
    updatePaymentMethod, 
    addPaymentMethod, 
    deletePaymentMethod,
    addCategory,
    updateCategory,
    deleteCategory
  } = useFinanceContext();
  
  const [activeTab, setActiveTab] = useState<'paymentMethods' | 'categories'>('paymentMethods');
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
  
  // עריכת שיטת תשלום
  const startEditingPaymentMethod = (method: PaymentMethod) => {
    setNewPaymentMethod({ ...method });
    setEditingPaymentMethodId(method.id);
    setIsEditingPaymentMethod(true);
  };
  
  // סיום עריכת שיטת תשלום
  const savePaymentMethod = async () => {
    try {
      if (editingPaymentMethodId) {
        // עדכון שיטת תשלום קיימת
        await updatePaymentMethod(newPaymentMethod);
    } else {
        // הוספת שיטת תשלום חדשה
        await addPaymentMethod(newPaymentMethod);
    }
    
      // איפוס טופס העריכה
      resetPaymentMethodForm();
      } catch (error) {
      console.error('שגיאה בשמירת שיטת תשלום:', error);
      alert('אירעה שגיאה בשמירת שיטת התשלום');
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
    
    // בית וחשבונות
    '🏠', '🏡', '🏢', '🏣', '🏘️', '🏚️', '🪑', '🛋️', '🛏️', '🚿', '🧹', '🧺', '🧼', '🧽', '💡', '💸', '📝',
    
    // תחבורה
    '🚗', '🚙', '🏎️', '🚕', '🚌', '🚎', '🚐', '🚓', '🚑', '🚒', '🚚', '🛵', '🏍️', '🚲', '🚁', '✈️', '🚢', '🚆', '🚉', '🚏', '⛽', '🛣️',
    
    // בריאות
    '🏥', '💊', '💉', '🩺', '🩹', '🧬', '👨‍⚕️', '👩‍⚕️', '🦷', '👁️', '🤒', '😷', '🧠', '🫀', '🫁', '🦴', '🦾', '🧘‍♂️', '🧘‍♀️',
    
    // ביגוד ואופנה
    '👕', '👖', '👔', '👗', '👘', '👚', '👛', '👜', '👝', '🧣', '🧤', '🧥', '🧦', '👞', '👟', '👠', '👡', '👢', '👒', '🎩', '👑', '💍', '⌚', '🕶️',
    
    // טכנולוגיה ומחשבים
    '📱', '💻', '⌨️', '🖥️', '🖨️', '🖱️', '🔌', '💾', '💿', '📀', '📼', '📷', '📹', '🎥', '📽️', '📺', '📻', '📟', '📞', '☎️', '📠', '⏰',
    
    // בידור וספורט
    '🎮', '🕹️', '🎯', '🎲', '🧩', '🎨', '🎭', '🎬', '🎤', '🎧', '🎷', '🎸', '🎹', '🎺', '🎻', '🥁', '🎬', '🏋️', '🤸', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🎱', '🏓', '🏸', 
    
    // חינוך ועבודה
    '📚', '📖', '📝', '✏️', '🖊️', '🖋️', '✒️', '🖌️', '🖍️', '📏', '📐', '📓', '📔', '📒', '📕', '📗', '📘', '📙', '📋', '📊', '📇', '🗂️', '📂', '📁', '📰', '🗞️', '📑',
    '💼', '🗄️', '📌', '📎', '📏',
    
    // מיסים וממשלה
    '🏛️', '⚖️', '📜', '📃', '📄', '📑', '🔐', '🗝️',
    
    // חופשה ופנאי
    '🏖️', '🏝️', '🏕️', '🏔️', '⛰️', '🏞️', '🏜️', '🌋', '🗻', '🏯', '🏰', '🛕', '⛪', '🕌', '🕍', '⛩️', '🏙️', 
    
    // משפחה
    '👨‍👩‍👧‍👦', '👨‍👩‍👧', '👨‍👩‍👦', '👶', '🧒', '👦', '👧', '🧑', '👩', '👨', '👵', '👴',
    
    // שונות
    '🎁', '🎀', '🎈', '🎊', '🎉', '🧶', '🧵', '🔨', '🪓', '⛏️', '⚒️', '🛠️', '🧰', '🔧', '🪛', '🪚', '🪝', '🪜', '🧯',
  ];
  
  // צבעים פופולריים לבחירה
  const popularColors = [
    // אדומים
    '#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d', '#fecaca', '#fca5a5', '#f87171',
    
    // כתומים
    '#f97316', '#ea580c', '#c2410c', '#9a3412', '#7c2d12', '#fed7aa', '#fdba74', '#fb923c',
    
    // צהובים
    '#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f', '#fef3c7', '#fde68a', '#fcd34d',
    '#eab308', '#ca8a04', '#a16207', '#854d0e', '#713f12', '#fef9c3', '#fef08a', '#fde047',
    
    // ירוקים
    '#84cc16', '#65a30d', '#4d7c0f', '#3f6212', '#365314', '#d9f99d', '#bef264', '#a3e635',
    '#22c55e', '#16a34a', '#15803d', '#166534', '#14532d', '#bbf7d0', '#86efac', '#4ade80',
    '#10b981', '#059669', '#047857', '#065f46', '#064e3b', '#a7f3d0', '#6ee7b7', '#34d399',
    
    // תכלת וטורקיז
    '#14b8a6', '#0d9488', '#0f766e', '#115e59', '#134e4a', '#b9e4e0', '#5eead4', '#2dd4bf',
    '#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63', '#cffafe', '#a5f3fc', '#67e8f9',
    
    // כחולים
    '#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e', '#bae6fd', '#7dd3fc', '#38bdf8',
    '#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a', '#bfdbfe', '#93c5fd', '#60a5fa',
    '#6366f1', '#4f46e5', '#4338ca', '#3730a3', '#312e81', '#c7d2fe', '#a5b4fc', '#818cf8',
    
    // סגולים
    '#8b5cf6', '#7c3aed', '#6d28d9', '#5b21b6', '#4c1d95', '#ddd6fe', '#c4b5fd', '#a78bfa',
    '#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87', '#e9d5ff', '#d8b4fe', '#c084fc',
    
    // ורודים
    '#d946ef', '#c026d3', '#a21caf', '#86198f', '#701a75', '#f5d0fe', '#f0abfc', '#e879f9',
    '#ec4899', '#db2777', '#be185d', '#9d174d', '#831843', '#fbcfe8', '#f9a8d4', '#f472b6',
    
    // אדום-וורודים
    '#f43f5e', '#e11d48', '#be123c', '#9f1239', '#881337', '#fee2e2', '#fecdd3', '#fda4af',
    
    // חומים
    '#78350f', '#92400e', '#b45309', '#d97706', '#a16207', '#fbbf24', '#d9f99d', '#f59e0b',
    
    // אפורים
    '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#cbd5e1', '#94a3b8', '#64748b',
  ];
  
  // הוספת מילת מפתח לאמצעי תשלום
  const addPaymentMethodKeyword = (keyword: string) => {
    if (!keyword.trim()) return;
    
    const keywords = newPaymentMethod.keywords || [];
    if (!keywords.includes(keyword.trim())) {
      setNewPaymentMethod({
        ...newPaymentMethod,
        keywords: [...keywords, keyword.trim()]
      });
    }
  };
  
  // הסרת מילת מפתח מאמצעי תשלום
  const removePaymentMethodKeyword = (keywordToRemove: string) => {
    const keywords = newPaymentMethod.keywords || [];
    setNewPaymentMethod({
      ...newPaymentMethod,
      keywords: keywords.filter(keyword => keyword !== keywordToRemove)
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
      <h2 className="text-xl font-semibold">הגדרות פיננסיות</h2>
      
      {/* טאבים */}
      <div className="flex border-b">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'paymentMethods' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('paymentMethods')}
        >
          אמצעי תשלום
        </button>
        
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'categories' ? 'border-b-2 border-primary-500 text-primary-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('categories')}
        >
          קטגוריות
        </button>
      </div>
      
      {/* תוכן לפי טאב */}
      {activeTab === 'paymentMethods' ? (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">אמצעי תשלום</h3>
            
            {!isEditingPaymentMethod && (
              <button
                onClick={() => setIsEditingPaymentMethod(true)}
                className="btn-primary flex items-center"
              >
                <FiPlus className="ml-1" />
                חדש
              </button>
            )}
          </div>
          
          {/* טופס עריכה/הוספה */}
          {isEditingPaymentMethod && (
            <div className="card p-4 bg-gray-50 space-y-4">
              <h4 className="font-medium">
                {editingPaymentMethodId ? 'עריכת אמצעי תשלום' : 'הוספת אמצעי תשלום חדש'}
              </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">שם</label>
                <input
                  type="text"
                    value={newPaymentMethod.name}
                    onChange={(e) => setNewPaymentMethod({ ...newPaymentMethod, name: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    placeholder="לדוגמה: מזומן, אשראי, PayPal"
                />
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">אייקון</label>
                  <div className="grid grid-cols-10 gap-2 mb-2 max-h-40 overflow-y-auto p-2 border rounded-md">
                    {popularIcons.map((icon) => (
                  <button
                        key={icon}
                    type="button"
                        className={`w-8 h-8 flex items-center justify-center rounded-md ${
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
                    className="w-full p-1 h-10 border rounded-md"
                            />
                          </div>
                          
                          <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">יתרה התחלתית</label>
                              <input
                                type="number"
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
                    className="w-full p-2 border rounded-md"
                    placeholder="0"
                  />
                          </div>
                        </div>
                        
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            מילות מפתח לזיהוי אוטומטי
                            <span className="mr-1 text-xs text-gray-500">(לדוגמה: 4 ספרות אחרונות של כרטיס אשראי)</span>
                          </label>
                          
                          <div className="flex flex-wrap gap-2 mb-2">
                            {(newPaymentMethod.keywords || []).map((keyword, index) => (
                              <div 
                                key={index}
                                className="px-2 py-1 bg-primary-100 text-primary-800 rounded-md flex items-center"
                              >
                                <span>{keyword}</span>
                                <button 
                                type="button"
                                  className="ml-1 text-primary-600 hover:text-primary-800"
                                  onClick={() => removePaymentMethodKeyword(keyword)}
                                >
                                  <FiX size={16} />
                              </button>
                              </div>
                            ))}
                        </div>
                        
                          <div className="flex">
                            <input
                              type="text"
                              id="newPaymentMethodKeyword"
                              placeholder="הוסף מילת מפתח ולחץ על הוסף"
                              className="w-full p-2 border rounded-md rounded-l-none"
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
    </div>
  );
};

export default FinanceSettings; 