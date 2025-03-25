'use client';

import { useState } from 'react';
import { FiDollarSign, FiCreditCard, FiFileText } from 'react-icons/fi';
import FinanceBalance from '../components/finance/FinanceBalance';
import FinanceTransactions from '../components/finance/FinanceTransactions';
import FinanceDebts from '../components/finance/FinanceDebts';
import FinanceSettings from '../components/finance/FinanceSettings';

type FinanceView = 'balance' | 'transactions' | 'debts' | 'settings';

export default function FinancePage() {
  const [selectedView, setSelectedView] = useState<FinanceView>('balance');

  const renderView = () => {
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
    <div className="flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">פיננסי</h1>
        
        <div className="flex space-x-4 space-x-reverse">
          <button
            className={`px-4 py-2 rounded-md flex items-center ${
              selectedView === 'balance' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedView('balance')}
          >
            <FiDollarSign className="ml-2" />
            <span>מצב הון</span>
          </button>
          
          <button
            className={`px-4 py-2 rounded-md flex items-center ${
              selectedView === 'transactions' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedView('transactions')}
          >
            <FiFileText className="ml-2" />
            <span>הכנסות והוצאות</span>
          </button>
          
          <button
            className={`px-4 py-2 rounded-md flex items-center ${
              selectedView === 'debts' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedView('debts')}
          >
            <FiCreditCard className="ml-2" />
            <span>חובות והלוואות</span>
          </button>
          
          <button
            className={`px-4 py-2 rounded-md flex items-center ${
              selectedView === 'settings' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setSelectedView('settings')}
          >
            <span>⚙️</span>
            <span className="mr-2">הגדרות</span>
          </button>
        </div>
      </div>
      
      {renderView()}
    </div>
  );
} 