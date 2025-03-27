import { useRef } from 'react';
import { useFinanceContext } from '@/app/context/FinanceContext';

export default function FinanceHeader() {
  const { exportData, importData, isOnline, pendingChanges, totalBalance } = useFinanceContext();
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
      // ניקוי ה-input כדי לאפשר ייבוא של אותו קובץ שוב
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('שגיאה בייבוא:', error);
      alert('אירעה שגיאה בייבוא הנתונים');
    }
  };

  return (
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
  );
} 