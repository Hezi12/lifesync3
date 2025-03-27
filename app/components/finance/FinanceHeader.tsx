import { useRef } from 'react';
import { useFinanceContext } from '@/app/context/FinanceContext';

export default function FinanceHeader() {
  const { exportData, importData } = useFinanceContext();
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
      <div className="flex gap-2">
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