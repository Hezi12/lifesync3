'use client';

import { useState, useEffect } from 'react';
import { FiArrowUp, FiArrowDown, FiInfo, FiFilter, FiDownload } from 'react-icons/fi';
import { PaymentMethod, Transaction, DebtLoan, FinancialCategory } from '../../types';
import { useFinanceContext } from '../../context/FinanceContext';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import * as XLSX from 'xlsx';

const FinanceOverview = () => {
  const { 
    paymentMethods, 
    transactions, 
    categories,
    debtLoans,
    isLoading
  } = useFinanceContext();

  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [dateRange, setDateRange] = useState<'week' | 'month' | 'year' | 'all'>('month');
  const [searchTerm, setSearchTerm] = useState('');

  // סינון עסקאות לפי טווח תאריכים
  useEffect(() => {
    if (!transactions.length) return;

    const now = new Date();
    let startDate = new Date();

    switch (dateRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'all':
        startDate = new Date(0);
        break;
    }

    const filtered = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && 
             transactionDate <= now &&
             (searchTerm === '' || 
              t.description.toLowerCase().includes(searchTerm.toLowerCase()));
    });

    setFilteredTransactions(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, [transactions, dateRange, searchTerm]);

  // חישוב סטטיסטיקות
  const stats = {
    totalIncome: filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0),
    totalExpenses: filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0),
    netChange: filteredTransactions
      .reduce((sum, t) => sum + (t.type === 'income' ? t.amount : -t.amount), 0),
    openDebts: debtLoans
      .filter(d => d.isDebt && !d.isPaid)
      .reduce((sum, d) => sum + d.amount, 0),
    openLoans: debtLoans
      .filter(d => !d.isDebt && !d.isPaid)
      .reduce((sum, d) => sum + d.amount, 0),
  };

  // קבלת שם קטגוריה
  const getCategoryName = (categoryId: string) => {
    return categories.find(c => c.id === categoryId)?.name || 'לא ידוע';
  };

  // קבלת שם אמצעי תשלום
  const getPaymentMethodName = (methodId: string) => {
    return paymentMethods.find(m => m.id === methodId)?.name || 'לא ידוע';
  };

  // פונקציה לייצוא לאקסל
  const exportToExcel = () => {
    // יצירת חוברת עבודה חדשה
    const wb = XLSX.utils.book_new();

    // 1. גיליון אמצעי תשלום
    const paymentMethodsData = paymentMethods.map(method => {
      const methodTransactions = filteredTransactions.filter(t => t.paymentMethodId === method.id);
      const totalChange = methodTransactions.reduce((sum, t) => 
        sum + (t.type === 'income' ? t.amount : -t.amount), 0
      );
      
      return {
        'שם': method.name,
        'יתרה התחלתית': method.initialBalance,
        'יתרה נוכחית': method.currentBalance,
        'שינוי': totalChange
      };
    });
    const wsPaymentMethods = XLSX.utils.json_to_sheet(paymentMethodsData);
    XLSX.utils.book_append_sheet(wb, wsPaymentMethods, 'אמצעי תשלום');

    // 2. גיליון חובות והלוואות
    const debtLoansData = debtLoans.map(d => ({
      'שם': d.personName,
      'סוג': d.isDebt ? 'חוב' : 'הלוואה',
      'סכום': d.amount,
      'תאריך יעד': d.dueDate ? format(new Date(d.dueDate), 'dd/MM/yyyy', { locale: he }) : 'ללא תאריך',
      'סטטוס': d.isPaid ? 'שולם' : 'פתוח'
    }));
    const wsDebtLoans = XLSX.utils.json_to_sheet(debtLoansData);
    XLSX.utils.book_append_sheet(wb, wsDebtLoans, 'חובות והלוואות');

    // 3. גיליון עסקאות
    const transactionsData = filteredTransactions.map(t => ({
      'תאריך': format(new Date(t.date), 'dd/MM/yyyy', { locale: he }),
      'תיאור': t.description,
      'קטגוריה': getCategoryName(t.categoryId),
      'אמצעי תשלום': getPaymentMethodName(t.paymentMethodId),
      'סכום': t.type === 'income' ? t.amount : -t.amount,
      'סוג': t.type === 'income' ? 'הכנסה' : 'הוצאה'
    }));
    const wsTransactions = XLSX.utils.json_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(wb, wsTransactions, 'עסקאות');

    // 4. גיליון סיכום
    const summaryData = [{
      'סה"כ הכנסות': stats.totalIncome,
      'סה"כ הוצאות': stats.totalExpenses,
      'שינוי נטו': stats.netChange,
      'חובות פתוחים': stats.openDebts,
      'הלוואות פתוחות': stats.openLoans
    }];
    const wsSummary = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'סיכום');

    // הגדרת רוחב עמודות
    const wscols = [
      { wch: 20 }, // שם
      { wch: 15 }, // יתרה התחלתית
      { wch: 15 }, // יתרה נוכחית
      { wch: 15 }, // שינוי
    ];
    wsPaymentMethods['!cols'] = wscols;

    // שמירת הקובץ
    const fileName = `דוח_פיננסי_${format(new Date(), 'dd-MM-yyyy', { locale: he })}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* סינון וחיפוש */}
      <div className="flex flex-wrap gap-4 items-center justify-between bg-white p-4 rounded-lg shadow">
        <div className="flex gap-4">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value as any)}
            className="border rounded px-3 py-2"
          >
            <option value="week">שבוע אחרון</option>
            <option value="month">חודש אחרון</option>
            <option value="month">שנה אחרונה</option>
            <option value="all">הכל</option>
          </select>
          <input
            type="text"
            placeholder="חיפוש..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded px-3 py-2"
          />
        </div>
        <button 
          onClick={exportToExcel}
          className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded hover:bg-primary-600"
        >
          <FiDownload />
          ייצוא לאקסל
        </button>
      </div>

      {/* סקירת אמצעי תשלום */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">אמצעי תשלום</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-right">שם</th>
                <th className="px-4 py-2 text-right">יתרה התחלתית</th>
                <th className="px-4 py-2 text-right">יתרה נוכחית</th>
                <th className="px-4 py-2 text-right">שינוי</th>
              </tr>
            </thead>
            <tbody>
              {paymentMethods.map(method => {
                const methodTransactions = filteredTransactions.filter(t => t.paymentMethodId === method.id);
                const totalChange = methodTransactions.reduce((sum, t) => 
                  sum + (t.type === 'income' ? t.amount : -t.amount), 0
                );
                
                return (
                  <tr key={method.id} className="border-t hover:bg-gray-50">
                    <td className="px-4 py-2 text-right">{method.name}</td>
                    <td className="px-4 py-2 text-right">₪{method.initialBalance.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">₪{method.currentBalance.toLocaleString()}</td>
                    <td className={`px-4 py-2 text-right ${totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ₪{totalChange.toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* סקירת חובות והלוואות */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">חובות והלוואות</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-right">שם</th>
                <th className="px-4 py-2 text-right">סוג</th>
                <th className="px-4 py-2 text-right">סכום</th>
                <th className="px-4 py-2 text-right">תאריך יעד</th>
                <th className="px-4 py-2 text-right">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {debtLoans.map(d => (
                <tr key={d.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 text-right">{d.personName}</td>
                  <td className="px-4 py-2 text-right">{d.isDebt ? 'חוב' : 'הלוואה'}</td>
                  <td className={`px-4 py-2 text-right ${d.isDebt ? 'text-red-600' : 'text-green-600'}`}>
                    ₪{d.amount.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {d.dueDate ? format(new Date(d.dueDate), 'dd/MM/yyyy', { locale: he }) : 'ללא תאריך'}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      d.isPaid 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {d.isPaid ? 'שולם' : 'פתוח'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* סקירת עסקאות */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">היסטוריית עסקאות</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-right">תאריך</th>
                <th className="px-4 py-2 text-right">תיאור</th>
                <th className="px-4 py-2 text-right">קטגוריה</th>
                <th className="px-4 py-2 text-right">אמצעי תשלום</th>
                <th className="px-4 py-2 text-right">סכום</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map(transaction => (
                <tr key={transaction.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-2 text-right">
                    {format(new Date(transaction.date), 'dd/MM/yyyy', { locale: he })}
                  </td>
                  <td className="px-4 py-2 text-right">{transaction.description}</td>
                  <td className="px-4 py-2 text-right">{getCategoryName(transaction.categoryId)}</td>
                  <td className="px-4 py-2 text-right">{getPaymentMethodName(transaction.paymentMethodId)}</td>
                  <td className={`px-4 py-2 text-right ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                    ₪{transaction.amount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* סיכום כולל */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">סה"כ הכנסות</div>
          <div className="text-2xl font-bold text-green-600">
            ₪{stats.totalIncome.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">סה"כ הוצאות</div>
          <div className="text-2xl font-bold text-red-600">
            ₪{stats.totalExpenses.toLocaleString()}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="text-sm text-gray-500">שינוי נטו</div>
          <div className={`text-2xl font-bold ${stats.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ₪{stats.netChange.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceOverview; 