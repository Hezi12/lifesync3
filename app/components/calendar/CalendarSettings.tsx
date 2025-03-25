'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiEdit, FiTrash2, FiCheck, FiX, FiTag } from 'react-icons/fi';
import { EventCategory } from '../../types';

interface CalendarSettingsProps {
  categories: EventCategory[];
  onUpdateCategories: (categories: EventCategory[]) => void;
}

const CalendarSettings: React.FC<CalendarSettingsProps> = ({ categories, onUpdateCategories }) => {
  const [localCategories, setLocalCategories] = useState<EventCategory[]>([]);
  
  // תצורת עריכה
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('');
  const [newItemColor, setNewItemColor] = useState('#0ea5e9');
  const [newItemIsDefault, setNewItemIsDefault] = useState(false);
  const [newItemKeywords, setNewItemKeywords] = useState('');
  
  // מערך של אייקונים נפוצים לבחירה
  const icons = [
    '🌞', '🏃', '🏋️', '🍔', '💼', '🧠', '📚', '🎮', '🎵', '🖥️', '🛌', '🚶', '📝', '📅', '⏰', '🙏', '🧘', '🛒', 
    '🚗', '✈️', '💊', '💬', '👨‍👩‍👧‍👦', '🏠', '🎬', '🏊', '🚴', '⚽', '🎾', '🏀', '🏓', '🎯', '🏆', '🎨', '🎭', 
    '🎪', '🛍️', '💻', '📱', '📸', '🎤', '🎧', '📺', '🍽️', '🍕', '🍣', '☕', '🍰', '🥗', '🍷', '🧘‍♀️', '🌊', '🏔️',
    '🚿', '🧹', '🧼', '🧺', '👕', '🛒', '🛋️', '📱', '📞', '📨', '🔍', '🔑', '🔒', '🔓', '🔔', '🔕', '🔖',
    '🕍', '📿', '📖', '✡️', '🕯️', '🙏'
  ];
  
  // מערך של צבעים לבחירה - הרחבה משמעותית
  const colors = [
    // כחולים
    '#0ea5e9', // כחול בהיר
    '#3b82f6', // כחול
    '#2563eb', // כחול עז
    '#1d4ed8', // כחול חזק
    '#1e40af', // כחול כהה
    '#1e3a8a', // כחול כהה מאוד
    '#0369a1', // כחול אוקיינוס
    
    // טורקיז וכחול-ירוק
    '#14b8a6', // טורקיז
    '#0d9488', // טורקיז כהה
    '#0891b2', // כחול-טורקיז
    '#0e7490', // כחול-טורקיז כהה
    '#22d3ee', // ציאן
    
    // סגולים
    '#8b5cf6', // סגול
    '#7c3aed', // סגול חזק
    '#6d28d9', // סגול כהה
    '#7e22ce', // סגול עז
    '#9333ea', // סגול-ורוד
    '#a855f7', // לבנדר
    '#c084fc', // לבנדר בהיר
    
    // ורודים
    '#ec4899', // ורוד
    '#db2777', // ורוד עז
    '#be185d', // ורוד כהה
    '#d946ef', // מגנטה
    '#a21caf', // פוקסיה
    '#f472b6', // ורוד בהיר
    
    // אדומים
    '#f43f5e', // אדום-ורוד
    '#e11d48', // אדום
    '#b91c1c', // אדום כהה
    '#dc2626', // אדום עז
    '#ef4444', // אדום בהיר
    '#991b1b', // בורדו
    
    // כתומים וחומים
    '#f97316', // כתום
    '#ea580c', // כתום עז
    '#c2410c', // כתום-חום
    '#fb923c', // כתום בהיר
    '#fdba74', // כתום-שזוף
    '#a16207', // חום
    '#854d0e', // חום כהה
    '#713f12', // חום שוקולד
    '#d97706', // כתום-אמבר
    
    // צהובים
    '#eab308', // צהוב
    '#facc15', // צהוב בהיר
    '#fef08a', // צהוב פסטל
    '#fbbf24', // צהוב זהוב
    '#f59e0b', // צהוב-כתום
    
    // ירוקים
    '#84cc16', // ירוק-ליים
    '#4ade80', // ירוק בהיר
    '#22c55e', // ירוק
    '#16a34a', // ירוק עז
    '#15803d', // ירוק כהה
    '#166534', // ירוק יער
    '#65a30d', // ירוק-זית
    '#4d7c0f', // ירוק אבוקדו
    '#3f6212', // ירוק כהה מאוד
    
    // אפורים וניטרליים
    '#64748b', // אפור-כחול
    '#475569', // אפור
    '#334155', // אפור כהה
    '#1e293b', // כחול-שחור
    '#94a3b8', // אפור בהיר
    '#cbd5e1', // אפור-לבן
    
    // צבעים מיוחדים
    '#d8b4fe', // סגול בהיר
    '#f0abfc', // ורוד-סגול בהיר
    '#6ee7b7', // מנטה
    '#67e8f9', // תכלת בהיר
    '#fda4af', // אדום פסטל
    '#fed7aa', // כתום פסטל
    '#fef3c7', // צהוב פסטל
    '#bbf7d0', // ירוק פסטל
    '#bae6fd', // כחול פסטל
    '#a7f3d0', // טורקיז פסטל
  ];
  
  // עדכון הקטגוריות המקומיות כאשר הקטגוריות החיצוניות משתנות
  useEffect(() => {
    setLocalCategories(categories);
  }, [categories]);
  
  // הוספת קטגוריה חדשה
  const addCategory = () => {
    if (newItemName.trim() === '') return;
    
    const keywordsArray = newItemKeywords.trim() === '' 
      ? [] 
      : newItemKeywords.split(',').map(keyword => keyword.trim());
    
    const newCategory: EventCategory = {
      id: Date.now().toString(),
      name: newItemName,
      icon: newItemIcon || '📅',
      color: newItemColor,
      isDefault: newItemIsDefault,
      keywords: keywordsArray
    };
    
    const updatedCategories = [...localCategories, newCategory];
    setLocalCategories(updatedCategories);
    onUpdateCategories(updatedCategories);
    
    // איפוס השדות
    setNewItemName('');
    setNewItemIcon('');
    setNewItemColor('#0ea5e9');
    setNewItemIsDefault(false);
    setNewItemKeywords('');
  };
  
  // מחיקת קטגוריה
  const deleteCategory = (id: string) => {
    const updatedCategories = localCategories.filter(category => category.id !== id);
    setLocalCategories(updatedCategories);
    onUpdateCategories(updatedCategories);
  };
  
  // התחלת עריכת קטגוריה
  const startEditCategory = (category: EventCategory) => {
    setEditingItem(category.id);
    setNewItemName(category.name);
    setNewItemIcon(category.icon);
    setNewItemColor(category.color);
    setNewItemIsDefault(category.isDefault || false);
    setNewItemKeywords(category.keywords?.join(', ') || '');
  };
  
  // שמירת עריכת קטגוריה
  const saveEditCategory = (id: string) => {
    if (newItemName.trim() === '') return;
    
    const keywordsArray = newItemKeywords.trim() === '' 
      ? [] 
      : newItemKeywords.split(',').map(keyword => keyword.trim());
    
    const updatedCategories = localCategories.map(category => {
      if (category.id === id) {
        return {
          ...category,
          name: newItemName,
          icon: newItemIcon,
          color: newItemColor,
          isDefault: newItemIsDefault,
          keywords: keywordsArray
        };
      }
      return category;
    });
    
    setLocalCategories(updatedCategories);
    onUpdateCategories(updatedCategories);
    
    // איפוס מצב העריכה
    setEditingItem(null);
    setNewItemName('');
    setNewItemIcon('');
    setNewItemColor('#0ea5e9');
    setNewItemIsDefault(false);
    setNewItemKeywords('');
  };
  
  // ביטול עריכה
  const cancelEdit = () => {
    setEditingItem(null);
    setNewItemName('');
    setNewItemIcon('');
    setNewItemColor('#0ea5e9');
    setNewItemIsDefault(false);
    setNewItemKeywords('');
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">הגדרות לוח שנה</h2>
      
      {/* טופס הוספה */}
      <div className="card bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">הוספת קטגוריה חדשה</h3>
        
        <div className="mb-4">
          <label htmlFor="categoryName" className="block text-sm font-medium text-gray-700 mb-1">
            שם
          </label>
          <input
            type="text"
            id="categoryName"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
            placeholder="הזן שם קטגוריה"
            className="block w-full py-2 px-3 border rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            אייקון
          </label>
          <div className="grid grid-cols-10 gap-2 mb-2 max-h-40 overflow-y-auto">
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
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            צבע
          </label>
          <div className="grid grid-cols-10 gap-2 max-h-24 overflow-y-auto">
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
        
        <div className="mb-4">
          <label htmlFor="categoryKeywords" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <FiTag className="ml-1" />
            מילות מפתח
          </label>
          <input
            type="text"
            id="categoryKeywords"
            value={newItemKeywords}
            onChange={(e) => setNewItemKeywords(e.target.value)}
            placeholder="הזן מילות מפתח מופרדות בפסיקים (כושר, ספורט, אימון)"
            className="block w-full py-2 px-3 border rounded-md focus:ring-primary-500 focus:border-primary-500"
          />
          <p className="text-xs text-gray-500 mt-1">
            הפרד מילות מפתח בפסיקים. מילים אלו ישמשו לזיהוי אוטומטי של הקטגוריה בעת יצירת אירוע.
          </p>
        </div>
        
        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={newItemIsDefault}
              onChange={(e) => setNewItemIsDefault(e.target.checked)}
              className="h-4 w-4 text-primary-500 border-gray-300 rounded ml-2"
            />
            <span className="text-sm text-gray-700">קטגוריית ברירת מחדל</span>
          </label>
          <p className="text-xs text-gray-500 mt-1">
            קטגוריות ברירת מחדל משמשות לזיהוי אוטומטי של סוגי אירועים
          </p>
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
      <div className="card bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-medium mb-4">קטגוריות קיימות</h3>
        
        <div className="space-y-3">
          {localCategories.length > 0 ? (
            localCategories.map((category) => (
              <div key={category.id} className="border rounded-md p-3">
                {editingItem === category.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        שם
                      </label>
                      <input
                        type="text"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        className="block w-full py-2 px-3 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        אייקון
                      </label>
                      <div className="grid grid-cols-10 gap-2 max-h-40 overflow-y-auto">
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
                      <div className="grid grid-cols-10 gap-2 max-h-24 overflow-y-auto">
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
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <FiTag className="ml-1" />
                        מילות מפתח
                      </label>
                      <input
                        type="text"
                        value={newItemKeywords}
                        onChange={(e) => setNewItemKeywords(e.target.value)}
                        placeholder="הזן מילות מפתח מופרדות בפסיקים"
                        className="block w-full py-2 px-3 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                      />
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={newItemIsDefault}
                          onChange={(e) => setNewItemIsDefault(e.target.checked)}
                          className="h-4 w-4 text-primary-500 border-gray-300 rounded ml-2"
                        />
                        <span className="text-sm text-gray-700">קטגוריית ברירת מחדל</span>
                      </label>
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
                        {category.isDefault && (
                          <p className="text-xs text-gray-500">
                            קטגוריית ברירת מחדל
                          </p>
                        )}
                        {category.keywords && category.keywords.length > 0 && (
                          <p className="text-xs text-gray-500">
                            מילות מפתח: {category.keywords.join(', ')}
                          </p>
                        )}
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
  );
};

export default CalendarSettings; 