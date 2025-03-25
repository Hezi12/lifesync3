'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { PaymentMethod, FinancialCategory } from '../../types';

const FinanceSettings = () => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [activeTab, setActiveTab] = useState<'methods' | 'categories'>('methods');
  
  // תצורת עריכה
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('');
  const [newItemColor, setNewItemColor] = useState('#0ea5e9');
  const [newItemType, setNewItemType] = useState<'income' | 'expense'>('expense');
  const [newItemBalance, setNewItemBalance] = useState('');
  
  // מערך של אייקונים נפוצים לבחירה
  const icons = ['💵', '💳', '🏦', '🌐', '💸', '💼', '🎁', '🏠', '🍕', '🎬', '💡', '🚗', '👕', '🏥', '📚', '✈️', '🎮', '🎵', '🎓', '💊', '🛒', '📱', '💻', '🏋️‍♂️', '🧘‍♀️'];
  
  // מערך של צבעים לבחירה
  const colors = [
    '#0ea5e9', // כחול
    '#14b8a6', // טורקיז
    '#8b5cf6', // סגול
    '#ec4899', // ורוד
    '#f43f5e', // אדום
    '#f97316', // כתום
    '#eab308', // צהוב
    '#84cc16', // ירוק בהיר
    '#22c55e', // ירוק
    '#64748b', // אפור
  ];
  
  // טעינת נתונים מ-localStorage
  useEffect(() => {
    // טעינת שיטות תשלום
    const savedPaymentMethods = localStorage.getItem('paymentMethods');
    if (savedPaymentMethods) {
      try {
        setPaymentMethods(JSON.parse(savedPaymentMethods));
      } catch (error) {
        console.error('שגיאה בטעינת שיטות תשלום:', error);
        createDefaultPaymentMethods();
      }
    } else {
      createDefaultPaymentMethods();
    }
    
    // טעינת קטגוריות
    const savedCategories = localStorage.getItem('financialCategories');
    if (savedCategories) {
      try {
        setCategories(JSON.parse(savedCategories));
      } catch (error) {
        console.error('שגיאה בטעינת קטגוריות:', error);
        createDefaultCategories();
      }
    } else {
      createDefaultCategories();
    }
  }, []);
  
  // שמירת נתונים ב-localStorage בכל שינוי
  useEffect(() => {
    if (paymentMethods.length > 0) {
      localStorage.setItem('paymentMethods', JSON.stringify(paymentMethods));
      
      // שליחת אירוע מותאם אישית לעדכון כל הרכיבים באתר
      const event = new CustomEvent('payment-methods-updated', { 
        detail: { paymentMethods }
      });
      window.dispatchEvent(event);
    }
  }, [paymentMethods]);
  
  useEffect(() => {
    if (categories.length > 0) {
      localStorage.setItem('financialCategories', JSON.stringify(categories));
      
      // שליחת אירוע מותאם אישית לעדכון כל הרכיבים באתר
      const event = new CustomEvent('financial-categories-updated', { 
        detail: { categories }
      });
      window.dispatchEvent(event);
    }
  }, [categories]);
  
  // יצירת שיטות תשלום ברירת מחדל
  const createDefaultPaymentMethods = () => {
    const samplePaymentMethods: PaymentMethod[] = [
      {
        id: '1',
        name: 'מזומן',
        icon: '💵',
        color: '#4CAF50',
        initialBalance: 1000,
        currentBalance: 800
      },
      {
        id: '2',
        name: 'אשראי',
        icon: '💳',
        color: '#2196F3',
        initialBalance: 2000,
        currentBalance: 1500
      },
      {
        id: '3',
        name: 'PayPal',
        icon: '🌐',
        color: '#9C27B0',
        initialBalance: 500,
        currentBalance: 700
      }
    ];
    
    setPaymentMethods(samplePaymentMethods);
    localStorage.setItem('paymentMethods', JSON.stringify(samplePaymentMethods));
  };
  
  // יצירת קטגוריות ברירת מחדל
  const createDefaultCategories = () => {
    const sampleCategories: FinancialCategory[] = [
      {
        id: 'salary',
        name: 'משכורת',
        icon: '💼',
        color: '#4CAF50',
        type: 'income'
      },
      {
        id: 'bonus',
        name: 'בונוס',
        icon: '🎁',
        color: '#8BC34A',
        type: 'income'
      },
      {
        id: 'rent',
        name: 'שכר דירה',
        icon: '🏠',
        color: '#F44336',
        type: 'expense'
      },
      {
        id: 'food',
        name: 'מזון',
        icon: '🍕',
        color: '#FF9800',
        type: 'expense'
      },
      {
        id: 'entertainment',
        name: 'בידור',
        icon: '🎬',
        color: '#9C27B0',
        type: 'expense'
      },
      {
        id: 'utilities',
        name: 'חשבונות',
        icon: '💡',
        color: '#2196F3',
        type: 'expense'
      }
    ];
    
    setCategories(sampleCategories);
    localStorage.setItem('financialCategories', JSON.stringify(sampleCategories));
  };
  
  // הוספת שיטת תשלום חדשה
  const addPaymentMethod = () => {
    if (newItemName.trim() === '') return;
    
    const newMethod: PaymentMethod = {
      id: Date.now().toString(),
      name: newItemName,
      icon: newItemIcon || '💵',
      color: newItemColor,
      initialBalance: Number(newItemBalance) || 0,
      currentBalance: Number(newItemBalance) || 0
    };
    
    setPaymentMethods([...paymentMethods, newMethod]);
    
    // איפוס השדות
    setNewItemName('');
    setNewItemIcon('');
    setNewItemColor('#0ea5e9');
    setNewItemBalance('');
  };
  
  // הוספת קטגוריה חדשה
  const addCategory = () => {
    if (newItemName.trim() === '') return;
    
    const newCategory: FinancialCategory = {
      id: Date.now().toString(),
      name: newItemName,
      icon: newItemIcon || '📝',
      color: newItemColor,
      type: newItemType
    };
    
    setCategories([...categories, newCategory]);
    
    // איפוס השדות
    setNewItemName('');
    setNewItemIcon('');
    setNewItemColor('#0ea5e9');
  };
  
  // מחיקת שיטת תשלום - ישירות ללא אישור
  const deletePaymentMethod = (id: string) => {
    // בדיקה אם אמצעי התשלום בשימוש בעסקאות
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      try {
        const transactions = JSON.parse(savedTransactions, (key, value) => {
          if (key === 'date') return new Date(value);
          return value;
        });
        
        const isUsed = transactions.some((transaction: any) => 
          transaction.paymentMethodId === id
        );
        
        if (isUsed) {
          alert('לא ניתן למחוק אמצעי תשלום שנמצא בשימוש בעסקאות. עדכן קודם את העסקאות.');
          return;
        }
      } catch (error) {
        console.error('שגיאה בבדיקת עסקאות:', error);
      }
    }
    
    // בדיקה אם אמצעי התשלום בשימוש בחובות/הלוואות
    const savedDebtLoans = localStorage.getItem('debtLoans');
    if (savedDebtLoans) {
      try {
        const debtLoans = JSON.parse(savedDebtLoans, (key, value) => {
          if (key === 'dueDate' && value) return new Date(value);
          return value;
        });
        
        const isUsed = debtLoans.some((debtLoan: any) => 
          debtLoan.paymentMethodId === id
        );
        
        if (isUsed) {
          alert('לא ניתן למחוק אמצעי תשלום שנמצא בשימוש בחובות/הלוואות. עדכן קודם את החובות/הלוואות.');
          return;
        }
      } catch (error) {
        console.error('שגיאה בבדיקת חובות/הלוואות:', error);
      }
    }
    
    // הכל בסדר, אפשר למחוק
    const updatedMethods = paymentMethods.filter(method => method.id !== id);
    setPaymentMethods(updatedMethods);
    
    // שמירה מיידית ב-localStorage והפעלת אירוע עדכון
    localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
    const event = new CustomEvent('payment-methods-updated', { 
      detail: { paymentMethods: updatedMethods }
    });
    window.dispatchEvent(event);
  };
  
  // מחיקת קטגוריה - ישירות ללא אישור
  const deleteCategory = (id: string) => {
    // בדיקה אם הקטגוריה בשימוש בעסקאות
    const savedTransactions = localStorage.getItem('transactions');
    if (savedTransactions) {
      try {
        const transactions = JSON.parse(savedTransactions, (key, value) => {
          if (key === 'date') return new Date(value);
          return value;
        });
        
        const isUsed = transactions.some((transaction: any) => 
          transaction.categoryId === id
        );
        
        if (isUsed) {
          alert('לא ניתן למחוק קטגוריה שנמצאת בשימוש בעסקאות. עדכן קודם את העסקאות.');
          return;
        }
      } catch (error) {
        console.error('שגיאה בבדיקת עסקאות:', error);
      }
    }
    
    // הכל בסדר, אפשר למחוק
    const updatedCategories = categories.filter(category => category.id !== id);
    setCategories(updatedCategories);
    
    // שמירה מיידית ב-localStorage והפעלת אירוע עדכון
    localStorage.setItem('financialCategories', JSON.stringify(updatedCategories));
    const event = new CustomEvent('financial-categories-updated', { 
      detail: { categories: updatedCategories }
    });
    window.dispatchEvent(event);
  };
  
  // התחלת עריכת שיטת תשלום
  const startEditPaymentMethod = (method: PaymentMethod) => {
    setEditingItem(method.id);
    setNewItemName(method.name);
    setNewItemIcon(method.icon);
    setNewItemColor(method.color);
    setNewItemBalance(method.initialBalance.toString());
  };
  
  // התחלת עריכת קטגוריה
  const startEditCategory = (category: FinancialCategory) => {
    setEditingItem(category.id);
    setNewItemName(category.name);
    setNewItemIcon(category.icon);
    setNewItemColor(category.color);
    setNewItemType(category.type);
  };
  
  // שמירת עריכת שיטת תשלום
  const saveEditPaymentMethod = (id: string) => {
    if (newItemName.trim() === '') return;
    
    setPaymentMethods(paymentMethods.map(method => {
      if (method.id === id) {
        const currentBalance = 
          method.initialBalance === method.currentBalance
            ? Number(newItemBalance) || 0
            : method.currentBalance - method.initialBalance + (Number(newItemBalance) || 0);
        
        return {
          ...method,
          name: newItemName,
          icon: newItemIcon,
          color: newItemColor,
          initialBalance: Number(newItemBalance) || 0,
          currentBalance
        };
      }
      return method;
    }));
    
    // איפוס מצב העריכה
    setEditingItem(null);
    setNewItemName('');
    setNewItemIcon('');
    setNewItemColor('#0ea5e9');
    setNewItemBalance('');
  };
  
  // שמירת עריכת קטגוריה
  const saveEditCategory = (id: string) => {
    if (newItemName.trim() === '') return;
    
    setCategories(categories.map(category => {
      if (category.id === id) {
        return {
          ...category,
          name: newItemName,
          icon: newItemIcon,
          color: newItemColor,
          type: newItemType
        };
      }
      return category;
    }));
    
    // איפוס מצב העריכה
    setEditingItem(null);
    setNewItemName('');
    setNewItemIcon('');
    setNewItemColor('#0ea5e9');
  };
  
  // ביטול עריכה
  const cancelEdit = () => {
    setEditingItem(null);
    setNewItemName('');
    setNewItemIcon('');
    setNewItemColor('#0ea5e9');
    setNewItemBalance('');
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">הגדרות פיננסיות</h2>
      
      {/* לשוניות */}
      <div className="flex border-b">
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'methods'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('methods')}
        >
          שיטות תשלום
        </button>
        <button
          className={`py-2 px-4 font-medium ${
            activeTab === 'categories'
              ? 'border-b-2 border-primary-500 text-primary-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveTab('categories')}
        >
          קטגוריות
        </button>
      </div>
      
      {/* תוכן לשונית שיטות תשלום */}
      {activeTab === 'methods' && (
        <div className="space-y-4">
          {/* טופס הוספה */}
          <div className="card space-y-4">
            <h3 className="text-lg font-medium">הוספת שיטת תשלום חדשה</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="methodName" className="block text-sm font-medium text-gray-700 mb-1">
                  שם
                </label>
                <input
                  type="text"
                  id="methodName"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="הזן שם"
                  className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="methodBalance" className="block text-sm font-medium text-gray-700 mb-1">
                  יתרה התחלתית
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500">₪</span>
                  </div>
                  <input
                    type="number"
                    id="methodBalance"
                    value={newItemBalance}
                    onChange={(e) => setNewItemBalance(e.target.value)}
                    placeholder="הזן סכום"
                    min="0"
                    step="0.01"
                    className="block w-full pr-10 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                אייקון
              </label>
              <div className="grid grid-cols-10 gap-2 mb-2">
                {icons.map((icon, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setNewItemIcon(icon)}
                    className={`p-2 text-xl rounded-md ${
                      newItemIcon === icon
                        ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                צבע
              </label>
              <div className="grid grid-cols-10 gap-2">
                {colors.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setNewItemColor(color)}
                    className={`w-8 h-8 rounded-full ${
                      newItemColor === color
                        ? 'ring-2 ring-offset-2 ring-gray-400'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="pt-2">
              <button
                onClick={addPaymentMethod}
                disabled={!newItemName.trim()}
                className={`px-4 py-2 rounded-md flex items-center ${
                  newItemName.trim()
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <FiPlus className="ml-1" />
                הוסף שיטת תשלום
              </button>
            </div>
          </div>
          
          {/* רשימת שיטות תשלום */}
          <div className="card">
            <h3 className="text-lg font-medium mb-4">שיטות תשלום קיימות</h3>
            
            <div className="space-y-3">
              {paymentMethods.length > 0 ? (
                paymentMethods.map((method) => (
                  <div key={method.id} className="border rounded-md p-3">
                    {editingItem === method.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              שם
                            </label>
                            <input
                              type="text"
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              יתרה התחלתית
                            </label>
                            <div className="relative">
                              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-gray-500">₪</span>
                              </div>
                              <input
                                type="number"
                                value={newItemBalance}
                                onChange={(e) => setNewItemBalance(e.target.value)}
                                min="0"
                                step="0.01"
                                className="block w-full pr-10 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                              />
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            אייקון
                          </label>
                          <div className="grid grid-cols-10 gap-2">
                            {icons.map((icon, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setNewItemIcon(icon)}
                                className={`p-2 text-xl rounded-md ${
                                  newItemIcon === icon
                                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            צבע
                          </label>
                          <div className="grid grid-cols-10 gap-2">
                            {colors.map((color, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setNewItemColor(color)}
                                className={`w-8 h-8 rounded-full ${
                                  newItemColor === color
                                    ? 'ring-2 ring-offset-2 ring-gray-400'
                                    : ''
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2 space-x-reverse">
                          <button
                            onClick={cancelEdit}
                            className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                          >
                            <FiX />
                          </button>
                          
                          <button
                            onClick={() => saveEditPaymentMethod(method.id)}
                            disabled={!newItemName.trim()}
                            className={`p-2 rounded-md ${
                              newItemName.trim()
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <FiCheck />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-xl"
                            style={{ backgroundColor: `${method.color}20`, color: method.color }}
                          >
                            {method.icon}
                          </div>
                          <div>
                            <h4 className="font-medium">{method.name}</h4>
                            <p className="text-sm text-gray-500">
                              יתרה נוכחית: ₪{method.currentBalance.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => startEditPaymentMethod(method)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                          >
                            <FiEdit />
                          </button>
                          
                          <button
                            onClick={() => deletePaymentMethod(method.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                            title="מחק"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">אין שיטות תשלום</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* תוכן לשונית קטגוריות */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          {/* טופס הוספה */}
          <div className="card space-y-4">
            <h3 className="text-lg font-medium">הוספת קטגוריה חדשה</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
                  שם
                </label>
                <input
                  type="text"
                  id="categoryName"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="הזן שם"
                  className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="categoryType" className="block text-sm font-medium text-gray-700 mb-1">
                  סוג
                </label>
                <div className="flex w-full rounded-md overflow-hidden border">
                  <button
                    type="button"
                    className={`flex-1 py-2 text-center ${
                      newItemType === 'expense' 
                        ? 'bg-red-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setNewItemType('expense')}
                  >
                    הוצאה
                  </button>
                  <button
                    type="button"
                    className={`flex-1 py-2 text-center ${
                      newItemType === 'income' 
                        ? 'bg-green-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    onClick={() => setNewItemType('income')}
                  >
                    הכנסה
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                אייקון
              </label>
              <div className="grid grid-cols-10 gap-2 mb-2">
                {icons.map((icon, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setNewItemIcon(icon)}
                    className={`p-2 text-xl rounded-md ${
                      newItemIcon === icon
                        ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                צבע
              </label>
              <div className="grid grid-cols-10 gap-2">
                {colors.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setNewItemColor(color)}
                    className={`w-8 h-8 rounded-full ${
                      newItemColor === color
                        ? 'ring-2 ring-offset-2 ring-gray-400'
                        : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div className="pt-2">
              <button
                onClick={addCategory}
                disabled={!newItemName.trim()}
                className={`px-4 py-2 rounded-md flex items-center ${
                  newItemName.trim()
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                <FiPlus className="ml-1" />
                הוסף קטגוריה
              </button>
            </div>
          </div>
          
          {/* רשימת קטגוריות */}
          <div className="card">
            <h3 className="text-lg font-medium mb-4">קטגוריות קיימות</h3>
            
            <div className="space-y-3">
              {categories.length > 0 ? (
                categories.map((category) => (
                  <div key={category.id} className="border rounded-md p-3">
                    {editingItem === category.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              שם
                            </label>
                            <input
                              type="text"
                              value={newItemName}
                              onChange={(e) => setNewItemName(e.target.value)}
                              className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              סוג
                            </label>
                            <div className="flex w-full rounded-md overflow-hidden border">
                              <button
                                type="button"
                                className={`flex-1 py-2 text-center ${
                                  newItemType === 'expense' 
                                    ? 'bg-red-500 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                onClick={() => setNewItemType('expense')}
                              >
                                הוצאה
                              </button>
                              <button
                                type="button"
                                className={`flex-1 py-2 text-center ${
                                  newItemType === 'income' 
                                    ? 'bg-green-500 text-white' 
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                                onClick={() => setNewItemType('income')}
                              >
                                הכנסה
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            אייקון
                          </label>
                          <div className="grid grid-cols-10 gap-2">
                            {icons.map((icon, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setNewItemIcon(icon)}
                                className={`p-2 text-xl rounded-md ${
                                  newItemIcon === icon
                                    ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                                    : 'bg-gray-100 hover:bg-gray-200'
                                }`}
                              >
                                {icon}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            צבע
                          </label>
                          <div className="grid grid-cols-10 gap-2">
                            {colors.map((color, index) => (
                              <button
                                key={index}
                                type="button"
                                onClick={() => setNewItemColor(color)}
                                className={`w-8 h-8 rounded-full ${
                                  newItemColor === color
                                    ? 'ring-2 ring-offset-2 ring-gray-400'
                                    : ''
                                }`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-end space-x-2 space-x-reverse">
                          <button
                            onClick={cancelEdit}
                            className="p-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200"
                          >
                            <FiX />
                          </button>
                          
                          <button
                            onClick={() => saveEditCategory(category.id)}
                            disabled={!newItemName.trim()}
                            className={`p-2 rounded-md ${
                              newItemName.trim()
                                ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <FiCheck />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center mr-3 text-xl"
                            style={{ backgroundColor: `${category.color}20`, color: category.color }}
                          >
                            {category.icon}
                          </div>
                          <div>
                            <h4 className="font-medium">{category.name}</h4>
                            <p className="text-sm text-gray-500">
                              סוג: {category.type === 'income' ? 'הכנסה' : 'הוצאה'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 space-x-reverse">
                          <button
                            onClick={() => startEditCategory(category)}
                            className="p-2 bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200"
                          >
                            <FiEdit />
                          </button>
                          
                          <button
                            onClick={() => deleteCategory(category.id)}
                            className="p-2 bg-red-100 text-red-600 rounded-md hover:bg-red-200"
                            title="מחק"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500 py-4">אין קטגוריות</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceSettings; 