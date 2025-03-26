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
    currentBalance: 0
  });
  
  const [isEditingCategory, setIsEditingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<FinancialCategory>({
    id: '',
    name: '',
    icon: '📁',
    color: '#6366f1',
    type: 'expense'
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
      currentBalance: 0
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
      type: 'expense'
    });
    setEditingCategoryId(null);
    setIsEditingCategory(false);
  };
  
  // אייקונים פופולריים לבחירה
  const popularIcons = [
    '💰', '💵', '💳', '💲', '🏦', '🪙', '📈', '📉', '🛒', '🛍️', '🍔', '🍕', 
    '🏠', '🚗', '⛽', '🚌', '✈️', '🏥', '💊', '👕', '👖', '📱', '💻', '🎮',
    '📚', '🎬', '🎭', '🎵', '🏋️', '🎁', '👶', '🏫', '📝', '💼', '🔧', '🧹'
  ];
  
  // צבעים פופולריים לבחירה
  const popularColors = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', 
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b'
  ];
  
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
                  <div className="flex flex-wrap gap-2 mb-2">
                    {popularIcons.slice(0, 10).map((icon) => (
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
                    maxLength={2}
                  />
                        </div>
                        
                        <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">צבע</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {popularColors.slice(0, 10).map((color) => (
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
                  <div className="flex flex-wrap gap-2 mb-2">
                    {popularIcons.map((icon, index) => index < 10 && (
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
                    maxLength={2}
                  />
                        </div>
                        
                        <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">צבע</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {popularColors.map((color, index) => index < 10 && (
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