'use client';

import { useState } from 'react';
import { FiDollarSign, FiFileText, FiCreditCard, FiUpload, FiSettings } from 'react-icons/fi';
import { useFinanceContext } from '../context/FinanceContext';
import AuthGuard from '../components/AuthGuard';
import FinanceHeader from '../components/finance/FinanceHeader';

type FinanceView = 'balance' | 'transactions' | 'debts' | 'settings' | 'import';

export default function FinancePage() {
  const [selectedView, setSelectedView] = useState<FinanceView>('balance');
  const { isOnline, pendingChanges, totalBalance } = useFinanceContext();

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
    <AuthGuard>
      <div className="container mx-auto p-4">
        <FinanceHeader />
        
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
    </AuthGuard>
  );
} 