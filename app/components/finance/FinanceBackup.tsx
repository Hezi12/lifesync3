'use client';

import { useState } from 'react';
import { FiDownload, FiUpload, FiTrash2, FiCheck, FiX } from 'react-icons/fi';
import { useFinanceContext } from '../../context/FinanceContext';
import { Transaction, DebtLoan } from '../../types';

const FinanceBackup = () => {
  const { 
    paymentMethods, 
    transactions, 
    debtLoans, 
    categories,
    addPaymentMethod,
    addTransaction,
    addDebtLoan,
    addCategory,
    deletePaymentMethod,
    deleteTransaction,
    deleteDebtLoan,
    deleteCategory
  } = useFinanceContext();

  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ייצוא נתונים
  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);
      setSuccess(null);

      // איסוף כל הנתונים
      const backupData = {
        paymentMethods,
        transactions,
        debtLoans,
        categories,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      // המרה לקובץ JSON
      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      // יצירת קישור להורדה
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifesync_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess('הנתונים יוצאו בהצלחה!');
    } catch (error) {
      console.error('שגיאה בייצוא נתונים:', error);
      setError('אירעה שגיאה בייצוא הנתונים');
    } finally {
      setIsExporting(false);
    }
  };

  // ייבוא נתונים
  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsImporting(true);
      setError(null);
      setSuccess(null);

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target?.result as string);

          // בדיקת תקינות הקובץ
          if (!backupData.version || !backupData.paymentMethods || !backupData.transactions || !backupData.debtLoans || !backupData.categories) {
            throw new Error('קובץ גיבוי לא תקין');
          }

          // המרת תאריכים בעסקאות
          const processedTransactions = backupData.transactions.map((transaction: Partial<Transaction>) => {
            // המרת התאריך למחרוזת ISO ואז ליצירת אובייקט Date חדש
            const dateStr = typeof transaction.date === 'string' ? transaction.date : transaction.date?.toISOString();
            return {
              ...transaction,
              date: dateStr ? new Date(dateStr) : new Date()
            };
          });

          // וידוא שכל התאריכים תקינים
          const validTransactions = processedTransactions.filter((transaction: Transaction) => {
            const isValidDate = !isNaN(transaction.date.getTime());
            if (!isValidDate) {
              console.error('נמצא תאריך לא תקין בעסקה:', transaction);
            }
            return isValidDate;
          });

          // המרת תאריכים בחובות והלוואות
          const processedDebtLoans = backupData.debtLoans.map((debtLoan: Partial<DebtLoan>) => {
            if (!debtLoan.dueDate) return { ...debtLoan, dueDate: null };
            
            // המרת התאריך למחרוזת ISO ואז ליצירת אובייקט Date חדש
            const dueDateStr = typeof debtLoan.dueDate === 'string' ? debtLoan.dueDate : debtLoan.dueDate?.toISOString();
            return {
              ...debtLoan,
              dueDate: dueDateStr ? new Date(dueDateStr) : null
            };
          });

          // וידוא שכל התאריכים תקינים
          const validDebtLoans = processedDebtLoans.filter((debtLoan: DebtLoan) => {
            if (!debtLoan.dueDate) return true;
            const isValidDate = !isNaN(debtLoan.dueDate.getTime());
            if (!isValidDate) {
              console.error('נמצא תאריך לא תקין בחוב/הלוואה:', debtLoan);
            }
            return isValidDate;
          });

          // מחיקת כל הנתונים הקיימים
          await clearAllData();

          // ייבוא הנתונים החדשים
          console.log('מתחיל ייבוא קטגוריות...');
          for (const category of backupData.categories) {
            await addCategory(category);
          }

          console.log('מתחיל ייבוא אמצעי תשלום...');
          for (const paymentMethod of backupData.paymentMethods) {
            await addPaymentMethod(paymentMethod);
          }

          console.log('מתחיל ייבוא עסקאות...', validTransactions.length);
          for (const transaction of validTransactions) {
            await addTransaction(transaction);
          }

          console.log('מתחיל ייבוא חובות והלוואות...', validDebtLoans.length);
          for (const debtLoan of validDebtLoans) {
            await addDebtLoan(debtLoan);
          }

          setSuccess(`הנתונים יובאו בהצלחה! (${validTransactions.length} עסקאות, ${validDebtLoans.length} חובות/הלוואות)`);
        } catch (error) {
          console.error('שגיאה בייבוא נתונים:', error);
          setError('אירעה שגיאה בייבוא הנתונים. הקובץ לא תקין או פגום.');
        } finally {
          setIsImporting(false);
        }
      };

      reader.readAsText(file);
    } catch (error) {
      console.error('שגיאה בקריאת הקובץ:', error);
      setError('אירעה שגיאה בקריאת הקובץ');
      setIsImporting(false);
    }
  };

  // מחיקת כל הנתונים
  const clearAllData = async () => {
    try {
      setIsClearing(true);
      setError(null);
      setSuccess(null);

      // מחיקת כל העסקאות
      for (const transaction of transactions) {
        await deleteTransaction(transaction.id);
      }

      // מחיקת כל החובות וההלוואות
      for (const debtLoan of debtLoans) {
        await deleteDebtLoan(debtLoan.id);
      }

      // מחיקת כל אמצעי התשלום
      for (const paymentMethod of paymentMethods) {
        await deletePaymentMethod(paymentMethod.id);
      }

      // מחיקת כל הקטגוריות
      for (const category of categories) {
        await deleteCategory(category.id);
      }

      setSuccess('כל הנתונים נמחקו בהצלחה!');
    } catch (error) {
      console.error('שגיאה במחיקת נתונים:', error);
      setError('אירעה שגיאה במחיקת הנתונים');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">גיבוי ושחזור נתונים</h2>

      {/* הודעות שגיאה והצלחה */}
      {(error || success) && (
        <div className={`p-4 rounded-md ${error ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {error ? (
            <div className="flex items-center">
              <FiX className="ml-2" />
              {error}
            </div>
          ) : (
            <div className="flex items-center">
              <FiCheck className="ml-2" />
              {success}
            </div>
          )}
        </div>
      )}

      {/* כפתורי פעולה */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ייצוא נתונים */}
        <button
          onClick={handleExport}
          disabled={isExporting}
          className="btn-primary flex items-center justify-center"
        >
          {isExporting ? (
            <span className="animate-spin mr-2">⏳</span>
          ) : (
            <FiDownload className="ml-2" />
          )}
          ייצא נתונים
        </button>

        {/* ייבוא נתונים */}
        <label className="btn-primary flex items-center justify-center cursor-pointer">
          {isImporting ? (
            <span className="animate-spin mr-2">⏳</span>
          ) : (
            <FiUpload className="ml-2" />
          )}
          ייבא נתונים
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            className="hidden"
            disabled={isImporting}
          />
        </label>

        {/* מחיקת נתונים */}
        <button
          onClick={clearAllData}
          disabled={isClearing}
          className="btn-danger flex items-center justify-center"
        >
          {isClearing ? (
            <span className="animate-spin mr-2">⏳</span>
          ) : (
            <FiTrash2 className="ml-2" />
          )}
          מחק כל הנתונים
        </button>
      </div>

      {/* הסבר */}
      <div className="bg-gray-50 p-4 rounded-md text-sm text-gray-600">
        <h3 className="font-medium mb-2">מידע חשוב:</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>ייצוא נתונים יוצר קובץ JSON עם כל המידע הפיננסי שלך</li>
          <li>ייבוא נתונים מחליף את כל הנתונים הקיימים בנתונים מהקובץ</li>
          <li>מחיקת נתונים מוחקת את כל המידע הפיננסי ללא אפשרות שחזור</li>
          <li>מומלץ ליצור גיבוי לפני מחיקת נתונים</li>
        </ul>
      </div>
    </div>
  );
};

export default FinanceBackup; 