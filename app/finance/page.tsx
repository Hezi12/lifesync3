'use client';

import { useState } from 'react';
import { FiDollarSign, FiCreditCard, FiFileText, FiSettings } from 'react-icons/fi';
import FinanceBalance from '../components/finance/FinanceBalance';
import FinanceTransactions from '../components/finance/FinanceTransactions';
import FinanceDebts from '../components/finance/FinanceDebts';
import FinanceSettings from '../components/finance/FinanceSettings';
import { useFinanceContext } from '../context/FinanceContext';

type FinanceView = 'balance' | 'transactions' | 'debts' | 'settings';

export default function FinancePage() {
  const [selectedView, setSelectedView] = useState<FinanceView>('balance');
  const { isLoading, error, totalBalance, isOnline, pendingChanges } = useFinanceContext();

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
      default:
        return <FinanceBalance />;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">ניהול פיננסי</h1>
        <div className="flex items-center gap-2 rtl:space-x-reverse">
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
        </div>
      </div>
      
      <div className="mb-6">
        <div className="flex space-x-4 rtl:space-x-reverse">
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