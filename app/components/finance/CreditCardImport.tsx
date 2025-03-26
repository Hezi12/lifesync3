'use client';

import { useState, useRef, useCallback } from 'react';
import { FiUpload, FiX, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import * as XLSX from 'xlsx';
import { useFinanceContext } from '../../context/FinanceContext';
import { Transaction } from '../../types';
import { v4 as uuidv4 } from 'uuid';

// ממשק לנתוני חיוב כרטיס אשראי כפי שנקראים מהקובץ
interface CreditCardCharge {
  cardNumber: string;      // מספר כרטיס
  transactionDate: string; // תאריך עסקה (לא בשימוש)
  businessName: string;    // שם בית העסק
  transactionAmount: number; // סכום עסקה (לא בשימוש)
  chargeAmount: number;    // סכום חיוב
  chargeDate: string;      // תאריך חיוב
  currency: string;        // מטבע (לא בשימוש)
  rowIndex: number;        // מספר השורה בקובץ המקורי
}

// ממשק לחיוב שכבר מופה לעסקה במערכת
interface MappedCharge {
  charge: CreditCardCharge;
  paymentMethodId: string | null;
  categoryId: string | null;
  transaction: Transaction;
}

const CreditCardImport = () => {
  const { 
    paymentMethods, 
    categories, 
    addTransaction 
  } = useFinanceContext();
  
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [charges, setCharges] = useState<CreditCardCharge[]>([]);
  const [mappedCharges, setMappedCharges] = useState<MappedCharge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // טיפול בפעולת הגרירה
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  
  // פונקציה למיפוי אוטומטי של חיובים לעסקאות
  const mapChargesToTransactions = (charges: CreditCardCharge[]): MappedCharge[] => {
    return charges.map(charge => {
      // זיהוי אמצעי תשלום לפי מספר כרטיס
      const paymentMethod = paymentMethods.find(method => 
        method.keywords?.some(keyword => 
          charge.cardNumber.includes(keyword)
        )
      );
      
      // זיהוי קטגוריה לפי שם בית העסק
      const category = categories.find(category => 
        category.type === 'expense' && // רק קטגוריות של הוצאות
        category.keywords?.some(keyword => 
          charge.businessName.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      // יצירת עסקה חדשה
      const transaction: Transaction = {
        id: uuidv4(),
        amount: charge.chargeAmount,
        date: new Date(charge.chargeDate),
        description: charge.businessName,
        categoryId: category?.id || categories.find(c => c.type === 'expense')?.id || '',
        paymentMethodId: paymentMethod?.id || paymentMethods[0]?.id || '',
        type: 'expense'
      };
      
      return {
        charge,
        paymentMethodId: paymentMethod?.id || null,
        categoryId: category?.id || null,
        transaction
      };
    });
  };
  
  // פונקציה לעיבוד קובץ אקסל
  const processExcelFile = (file: File) => {
    setIsProcessing(true);
    setError(null);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // הנחה שהגיליון הראשון מכיל את הנתונים
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
        
        if (jsonData.length === 0) {
          setError('הקובץ ריק או לא במבנה הנכון');
          setIsProcessing(false);
          return;
        }
        
        // זיהוי הכותרות בקובץ
        const firstRow = jsonData[0] as any;
        const headers = Object.keys(firstRow);
        
        // מיפוי שדות לפי תבנית ידועה
        let cardNumberField = headers.find(h => 
          h.includes('כרטיס') || h.includes('מספר') || h.includes('card') || h.includes('number')
        );
        
        let businessNameField = headers.find(h => 
          h.includes('עסק') || h.includes('שם') || h.includes('business') || h.includes('name')
        );
        
        let chargeDateField = headers.find(h => 
          h.includes('חיוב') && h.includes('תאריך') || h.includes('date') && h.includes('charge')
        );
        
        let chargeAmountField = headers.find(h => 
          h.includes('חיוב') && h.includes('סכום') || h.includes('amount') && h.includes('charge')
        );
        
        if (!cardNumberField || !businessNameField || !chargeDateField || !chargeAmountField) {
          setError('לא ניתן לזהות את כל השדות הנדרשים בקובץ');
          setIsProcessing(false);
          return;
        }
        
        // המרת הנתונים לפורמט הפנימי שלנו
        const charges: CreditCardCharge[] = jsonData.map((row: any, index) => {
          // ניקוי והמרת הסכום למספר
          const amountStr = row[chargeAmountField!].toString().replace(/[^\d.-]/g, '');
          const amount = parseFloat(amountStr);
          
          return {
            cardNumber: row[cardNumberField!].toString(),
            transactionDate: '', // לא בשימוש
            businessName: row[businessNameField!].toString(),
            transactionAmount: 0, // לא בשימוש
            chargeAmount: amount,
            chargeDate: row[chargeDateField!].toString(),
            currency: 'ILS', // תמיד בשקלים
            rowIndex: index + 2 // +2 כי האינדקס מתחיל מ-0 ויש שורת כותרת
          };
        });
        
        setCharges(charges);
        const mapped = mapChargesToTransactions(charges);
        setMappedCharges(mapped);
        setIsProcessing(false);
      } catch (error) {
        console.error('שגיאה בעיבוד הקובץ:', error);
        setError('שגיאה בעיבוד הקובץ. ודא שהקובץ הוא במבנה אקסל או CSV תקין.');
        setIsProcessing(false);
      }
    };
    
    reader.onerror = () => {
      setError('שגיאה בקריאת הקובץ');
      setIsProcessing(false);
    };
    
    reader.readAsArrayBuffer(file);
  };
  
  // טיפול בבחירת קובץ
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
      processExcelFile(selectedFile);
    }
  };
  
  // טיפול בשחרור קובץ שנגרר
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    
    if (files && files.length > 0) {
      const droppedFile = files[0];
      setFile(droppedFile);
      processExcelFile(droppedFile);
    }
  };
  
  // פתיחת חלון בחירת קבצים
  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // עדכון עסקה ממופה
  const updateMappedCharge = (index: number, field: keyof Transaction, value: any) => {
    const updatedCharges = [...mappedCharges];
    updatedCharges[index].transaction = {
      ...updatedCharges[index].transaction,
      [field]: value
    };
    
    if (field === 'paymentMethodId') {
      updatedCharges[index].paymentMethodId = value;
    } else if (field === 'categoryId') {
      updatedCharges[index].categoryId = value;
    }
    
    setMappedCharges(updatedCharges);
  };
  
  // שמירת כל העסקאות
  const saveAllTransactions = async () => {
    try {
      setIsProcessing(true);
      
      for (const item of mappedCharges) {
        await addTransaction(item.transaction);
      }
      
      setSuccess(`${mappedCharges.length} עסקאות נוספו בהצלחה!`);
      setCharges([]);
      setMappedCharges([]);
      setFile(null);
      setIsProcessing(false);
      
      // ניקוי הודעת ההצלחה אחרי 5 שניות
      setTimeout(() => {
        setSuccess(null);
      }, 5000);
    } catch (error) {
      console.error('שגיאה בשמירת העסקאות:', error);
      setError('שגיאה בשמירת העסקאות');
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">יבוא חיובי כרטיס אשראי</h2>
      
      {/* הודעות */}
      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded-md flex items-center">
          <FiAlertCircle className="ml-2" />
          {error}
        </div>
      )}
      
      {success && (
        <div className="p-3 bg-green-100 text-green-700 rounded-md flex items-center">
          <FiCheckCircle className="ml-2" />
          {success}
        </div>
      )}
      
      {/* אזור גרירה והעלאה */}
      {!file && (
        <div 
          className={`border-2 border-dashed p-8 rounded-lg text-center cursor-pointer transition-colors ${
            isDragging 
              ? 'border-primary-500 bg-primary-50' 
              : 'border-gray-300 hover:border-primary-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".xlsx,.xls,.csv"
            onChange={handleFileChange}
          />
          
          <FiUpload className="mx-auto text-3xl mb-3 text-gray-400" />
          <p className="text-lg mb-1">גרור לכאן קובץ אקסל של חיובי כרטיס אשראי</p>
          <p className="text-sm text-gray-500">או לחץ לבחירת קובץ</p>
          <p className="mt-3 text-xs text-gray-400">פורמטים נתמכים: XLSX, XLS, CSV</p>
        </div>
      )}
      
      {/* טבלת תצוגה מקדימה של חיובים ממופים */}
      {mappedCharges.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">תצוגה מקדימה ({mappedCharges.length} עסקאות)</h3>
            <div className="flex space-x-2 space-x-reverse">
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setCharges([]);
                  setMappedCharges([]);
                  setFile(null);
                }}
                disabled={isProcessing}
              >
                <FiX className="inline ml-1" />
                ביטול
              </button>
              
              <button
                type="button"
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                onClick={saveAllTransactions}
                disabled={isProcessing}
              >
                <FiCheckCircle className="inline ml-1" />
                שמור {mappedCharges.length} עסקאות
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-3 text-right">שם בית עסק</th>
                  <th className="py-2 px-3 text-right">סכום</th>
                  <th className="py-2 px-3 text-right">תאריך חיוב</th>
                  <th className="py-2 px-3 text-right">אמצעי תשלום</th>
                  <th className="py-2 px-3 text-right">קטגוריה</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {mappedCharges.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-2 px-3">{item.charge.businessName}</td>
                    <td className="py-2 px-3 text-left" dir="ltr">₪ {item.charge.chargeAmount.toFixed(2)}</td>
                    <td className="py-2 px-3">{new Date(item.transaction.date).toLocaleDateString('he-IL')}</td>
                    <td className="py-2 px-3">
                      <select
                        value={item.transaction.paymentMethodId}
                        onChange={(e) => updateMappedCharge(index, 'paymentMethodId', e.target.value)}
                        className="w-full p-1 border rounded"
                      >
                        {paymentMethods.map(method => (
                          <option key={method.id} value={method.id}>
                            {method.icon} {method.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-3">
                      <select
                        value={item.transaction.categoryId}
                        onChange={(e) => updateMappedCharge(index, 'categoryId', e.target.value)}
                        className="w-full p-1 border rounded"
                      >
                        {categories
                          .filter(category => category.type === 'expense')
                          .map(category => (
                            <option key={category.id} value={category.id}>
                              {category.icon} {category.name}
                            </option>
                          ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCardImport; 