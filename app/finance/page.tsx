'use client';

import { useState, useRef } from 'react';
import { FiDollarSign, FiFileText, FiCreditCard, FiUpload, FiSettings } from 'react-icons/fi';
import { useFinanceContext, FinanceProvider } from '../context/FinanceContext';
import AuthGuard from '../components/AuthGuard';

type FinanceView = 'balance' | 'transactions' | 'debts' | 'settings' | 'import';

function FinancePageContent() {
  const [selectedView, setSelectedView] = useState<FinanceView>('balance');
  const { isOnline, pendingChanges, totalBalance, exportData, importData } = useFinanceContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      await exportData();
    } catch (error) {
      console.error('שגיאה בייצוא:', error);
      alert('אירעה שגיאה בייצוא הנתונים');
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      await importData(file);
      alert('הנתונים יובאו בהצלחה');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('שגיאה בייבוא:', error);
      alert('אירעה שגיאה בייבוא הנתונים');
    }
  };

  const renderView = () => {
    switch (selectedView) {
      case 'balance':
        return <div>תצוגת מצב הון</div>;
      case 'transactions':
        return <div>תצוגת עסקאות</div>;
      case 'debts':
        return <div>תצוגת חובות והלוואות</div>;
      case 'import':
        return <div>תצוגת ייבוא חיובי אשראי</div>;
      case 'settings':
        return <div>תצוגת הגדרות</div>;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ניהול פיננסי</h1>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-md flex items-center text-sm">
              <span className="ml-1">מצב לא מקוון</span>
              <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
            </div>
          )}
          {pendingChanges && (
            <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-md flex items-center text-sm">
              <span>שינויים בהמתנה לסנכרון</span>
            </div>
          )}
          <div className="bg-primary-100 text-primary-800 px-3 py-1 rounded-md">
            <span className="font-bold">{totalBalance.toLocaleString()} ₪</span>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImport}
            accept=".json"
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            ייבוא נתונים
          </button>
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
          >
            ייצוא נתונים
          </button>
        </div>
      </div>
      
      <div className="mb-6 overflow-x-auto">
        <div className="flex space-x-4 rtl:space-x-reverse min-w-max">
          <button
            onClick={() => setSelectedView('balance')}
            className={`px-4 py-2 rounded-md flex items-center ${
              selectedView === 'balance' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FiDollarSign className="ml-2" />
            <span>מצב הון</span>
          </button>
          <button
            onClick={() => setSelectedView('transactions')}
            className={`px-4 py-2 rounded-md flex items-center ${
              selectedView === 'transactions' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FiFileText className="ml-2" />
            <span>הכנסות והוצאות</span>
          </button>
          <button
            onClick={() => setSelectedView('debts')}
            className={`px-4 py-2 rounded-md flex items-center ${
              selectedView === 'debts' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FiCreditCard className="ml-2" />
            <span>חובות והלוואות</span>
          </button>
          <button
            onClick={() => setSelectedView('import')}
            className={`px-4 py-2 rounded-md flex items-center ${
              selectedView === 'import' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FiUpload className="ml-2" />
            <span>ייבוא חיובי אשראי</span>
          </button>
          <button
            onClick={() => setSelectedView('settings')}
            className={`px-4 py-2 rounded-md flex items-center ${
              selectedView === 'settings' 
                ? 'bg-primary-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <FiSettings className="ml-2" />
            <span>הגדרות</span>
          </button>
        </div>
      </div>
      
      {renderView()}
    </div>
  );
}

export default function FinancePage() {
  return (
    <AuthGuard>
      <FinanceProvider>
        <FinancePageContent />
      </FinanceProvider>
    </AuthGuard>
  );
} 