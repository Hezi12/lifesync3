'use client';

import { useState, useRef, useCallback } from 'react';
import { FiUpload, FiX, FiCheckCircle, FiAlertCircle, FiTrash2, FiFile } from 'react-icons/fi';
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
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappedHeaders, setMappedHeaders] = useState<{
    cardNumber: string | null;
    businessName: string | null;
    chargeDate: string | null;
    chargeAmount: string | null;
  }>({
    cardNumber: null,
    businessName: null,
    chargeDate: null,
    chargeAmount: null
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [charges, setCharges] = useState<CreditCardCharge[]>([]);
  const [mappedCharges, setMappedCharges] = useState<MappedCharge[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [manualMappingMode, setManualMappingMode] = useState(false);
  
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
      
      // הפוך את שם העסק לאותיות קטנות לחיפוש מדויק יותר
      const businessNameLower = charge.businessName.toLowerCase();
      console.log(`בודק זיהוי קטגוריה עבור בית עסק: "${charge.businessName}"`);
      
      // זיהוי קטגוריה לפי שם בית העסק
      let matchedCategory = null;
      
      // עבור על כל הקטגוריות ובדוק אם שם העסק מכיל את אחת ממילות המפתח
      for (const category of categories) {
        // בדיקה רק על קטגוריות של הוצאות
        if (category.type !== 'expense') continue;
        
        // אם אין מילות מפתח, דלג
        if (!category.keywords || category.keywords.length === 0) continue;
        
        // בדוק כל מילת מפתח
        for (const keyword of category.keywords) {
          const keywordLower = keyword.toLowerCase().trim();
          
          // אם מצאנו התאמה
          if (keywordLower && businessNameLower.includes(keywordLower)) {
            console.log(`נמצאה התאמה: בית עסק "${charge.businessName}" מכיל את מילת המפתח "${keyword}" של הקטגוריה "${category.name}"`);
            matchedCategory = category;
            break;
          }
        }
        
        // אם מצאנו התאמה, אין צורך להמשיך לחפש
        if (matchedCategory) break;
      }
      
      if (!matchedCategory) {
        console.log(`לא נמצאה קטגוריה מתאימה לבית העסק "${charge.businessName}"`);
      }
      
      // יצירת עסקה חדשה
      const transaction: Transaction = {
        id: uuidv4(),
        amount: charge.chargeAmount,
        date: new Date(charge.chargeDate),
        description: charge.businessName,
        categoryId: matchedCategory?.id || categories.find(c => c.type === 'expense')?.id || '',
        paymentMethodId: paymentMethod?.id || paymentMethods[0]?.id || '',
        type: 'expense'
      };
      
      return {
        charge,
        paymentMethodId: paymentMethod?.id || null,
        categoryId: matchedCategory?.id || null,
        transaction
      };
    });
  };
  
  // פונקציה לעיבוד קובץ אקסל
  const processExcelFile = (file: File) => {
    setIsProcessing(true);
    setError(null);
    setFile(file);
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        setWorkbook(wb);
        
        // הנחה שהגיליון הראשון מכיל את הנתונים
        const worksheet = wb.Sheets[wb.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
        
        if (jsonData.length === 0) {
          setError('הקובץ ריק או לא במבנה הנכון');
          setIsProcessing(false);
          return;
        }
        
        // זיהוי הכותרות בקובץ
        const firstRow = jsonData[0] as any;
        const headersList = Object.keys(firstRow);
        
        // שמירת הכותרות לשימוש מאוחר יותר
        setHeaders(headersList);
        
        // מיפוי שדות לפי תבנית ידועה - התאמה טובה יותר לכותרות
        let cardNumberField = headersList.find(h => 
          h.includes('כרטיס') || h.includes('מספר') || h.includes('card') || h.includes('number')
        );
        
        let businessNameField = headersList.find(h => 
          h.includes('עסק') || h.includes('שם בית') || h.includes('business') ||
          h.includes('name') || h.includes('סק')
        );
        
        // אם לא מצאנו שדה שם בית עסק, ננסה למצוא שדה דומה
        if (!businessNameField) {
          businessNameField = headersList.find(h => 
            h.toLowerCase().includes('שם') || h.includes('תיאור') || h.includes('desc')
          );
        }
        
        let chargeDateField = headersList.find(h => 
          (h.includes('חיוב') && h.includes('תאריך')) || 
          (h.includes('date') && h.includes('charge')) ||
          h.includes('תאריך חיוב')
        );
        
        let chargeAmountField = headersList.find(h => 
          (h.includes('חיוב') && h.includes('סכום')) || 
          (h.includes('amount') && h.includes('charge')) ||
          h.includes('סכום') || h.includes('חיוב')
        );
        
        console.log('זוהו השדות הבאים:', {
          cardNumberField,
          businessNameField,
          chargeDateField,
          chargeAmountField
        });
        
        // התחלת מיפוי ידני אם לא מצאנו את כל השדות
        if (!cardNumberField || !businessNameField || !chargeDateField || !chargeAmountField) {
          setError('לא ניתן לזהות את כל השדות הנדרשים בקובץ. יש לבצע מיפוי ידני');
          setMappedHeaders({
            cardNumber: cardNumberField || null,
            businessName: businessNameField || null,
            chargeDate: chargeDateField || null,
            chargeAmount: chargeAmountField || null
          });
          setManualMappingMode(true);
          setIsProcessing(false);
          return;
        }
        
        // המרת הנתונים לפורמט הפנימי שלנו
        const charges: CreditCardCharge[] = jsonData.map((row: any, index) => {
          // ניקוי והמרת הסכום למספר
          let amountStr = "";
          try {
            amountStr = row[chargeAmountField!].toString().replace(/[^\d.-]/g, '');
          } catch (e) {
            amountStr = "0";
            console.error("שגיאה בהמרת סכום החיוב:", e);
          }
          const amount = parseFloat(amountStr) || 0;
          
          // טיפול בשם בית עסק
          let businessNameValue = "";
          try {
            businessNameValue = row[businessNameField!].toString() || "";
            if (!businessNameValue) {
              console.warn(`שורה ${index + 2}: שם בית עסק ריק או לא קיים`);
              businessNameValue = "בית עסק לא ידוע";
            }
          } catch (e) {
            console.error("שגיאה בהמרת שם בית העסק:", e);
            businessNameValue = "בית עסק לא ידוע";
          }
          
          // טיפול במספר כרטיס
          let cardNumberValue = "";
          try {
            cardNumberValue = row[cardNumberField!].toString() || "";
            if (!cardNumberValue) {
              console.warn(`שורה ${index + 2}: מספר כרטיס ריק או לא קיים`);
              cardNumberValue = "0000";
            }
          } catch (e) {
            console.error("שגיאה בהמרת מספר כרטיס:", e);
            cardNumberValue = "0000";
          }
          
          // טיפול בתאריך חיוב
          let chargeDateValue = "";
          try {
            chargeDateValue = row[chargeDateField!].toString() || "";
            if (!chargeDateValue) {
              console.warn(`שורה ${index + 2}: תאריך חיוב ריק או לא קיים`);
              chargeDateValue = new Date().toISOString();
            }
          } catch (e) {
            console.error("שגיאה בהמרת תאריך חיוב:", e);
            chargeDateValue = new Date().toISOString();
          }
          
          console.log(`נתוני שורה ${index + 2}:`, {
            businessName: businessNameValue,
            cardNumber: cardNumberValue,
            chargeDate: chargeDateValue,
            chargeAmount: amount
          });
          
          return {
            cardNumber: cardNumberValue,
            transactionDate: '', // לא בשימוש
            businessName: businessNameValue,
            transactionAmount: 0, // לא בשימוש
            chargeAmount: amount,
            chargeDate: chargeDateValue,
            currency: 'ILS', // תמיד בשקלים
            rowIndex: index + 2 // +2 כי האינדקס מתחיל מ-0 ויש שורת כותרת
          };
        });
        
        console.log('נתונים מהקובץ:', charges);
        
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
      setWorkbook(null);
      setHeaders([]);
      setManualMappingMode(false);
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
  
  // פונקציה לביצוע מיפוי ידני
  const applyManualMapping = () => {
    if (!workbook || !file) return;
    
    const { cardNumber, businessName, chargeDate, chargeAmount } = mappedHeaders;
    
    if (!cardNumber || !businessName || !chargeDate || !chargeAmount) {
      setError('יש לבחור את כל העמודות הנדרשות');
      return;
    }
    
    try {
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
      
      // המרת הנתונים לפורמט הפנימי שלנו
      const charges: CreditCardCharge[] = jsonData.map((row: any, index) => {
        // ניקוי והמרת הסכום למספר
        let amountStr = "";
        try {
          amountStr = row[chargeAmount].toString().replace(/[^\d.-]/g, '');
        } catch (e) {
          amountStr = "0";
          console.error("שגיאה בהמרת סכום החיוב:", e);
        }
        const amount = parseFloat(amountStr) || 0;
        
        // טיפול בשם בית עסק
        let businessNameValue = "";
        try {
          businessNameValue = row[businessName]?.toString() || "";
          if (!businessNameValue) {
            console.warn(`שורה ${index + 2}: שם בית עסק ריק או לא קיים`);
            businessNameValue = "בית עסק לא ידוע";
          }
        } catch (e) {
          console.error("שגיאה בהמרת שם בית העסק:", e);
          businessNameValue = "בית עסק לא ידוע";
        }
        
        // טיפול במספר כרטיס
        let cardNumberValue = "";
        try {
          cardNumberValue = row[cardNumber]?.toString() || "";
          if (!cardNumberValue) {
            console.warn(`שורה ${index + 2}: מספר כרטיס ריק או לא קיים`);
            cardNumberValue = "0000";
          }
        } catch (e) {
          console.error("שגיאה בהמרת מספר כרטיס:", e);
          cardNumberValue = "0000";
        }
        
        // טיפול בתאריך חיוב
        let chargeDateValue = "";
        try {
          chargeDateValue = row[chargeDate]?.toString() || "";
          if (!chargeDateValue) {
            console.warn(`שורה ${index + 2}: תאריך חיוב ריק או לא קיים`);
            chargeDateValue = new Date().toISOString();
          }
        } catch (e) {
          console.error("שגיאה בהמרת תאריך חיוב:", e);
          chargeDateValue = new Date().toISOString();
        }
        
        console.log(`נתוני שורה ${index + 2}:`, {
          businessName: businessNameValue,
          cardNumber: cardNumberValue,
          chargeDate: chargeDateValue,
          chargeAmount: amount
        });
        
        return {
          cardNumber: cardNumberValue,
          transactionDate: '', // לא בשימוש
          businessName: businessNameValue,
          transactionAmount: 0, // לא בשימוש
          chargeAmount: amount,
          chargeDate: chargeDateValue,
          currency: 'ILS', // תמיד בשקלים
          rowIndex: index + 2 // +2 כי האינדקס מתחיל מ-0 ויש שורת כותרת
        };
      });
      
      setCharges(charges);
      const mapped = mapChargesToTransactions(charges);
      setMappedCharges(mapped);
      setManualMappingMode(false);
    } catch (error) {
      console.error('שגיאה בעיבוד הקובץ:', error);
      setError('שגיאה בעיבוד הקובץ. ודא שהקובץ הוא במבנה אקסל או CSV תקין.');
    }
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">ייבוא חיובי כרטיס אשראי</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}
      
      {!file && (
        <div 
          className="border-2 border-dashed border-gray-300 rounded-md p-8 text-center hover:border-blue-500 transition-colors"
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            if (e.dataTransfer.files.length) {
              processExcelFile(e.dataTransfer.files[0]);
            }
          }}
        >
          <div className="mb-4">
            <FiFile className="mx-auto h-12 w-12 text-gray-400" />
          </div>
          <p className="mb-4">גרור קובץ אקסל או CSV לכאן, או לחץ לבחירת קובץ</p>
          <label className="cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded">
            בחר קובץ
            <input
              type="file"
              className="hidden"
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  processExcelFile(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>
      )}
      
      {manualMappingMode && headers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-md my-4">
          <h3 className="font-bold text-lg mb-2">מיפוי ידני של שדות</h3>
          <p className="mb-4">נא בחר את העמודות המתאימות:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">מספר כרטיס</label>
              <select 
                className="w-full p-2 border rounded"
                value={mappedHeaders.cardNumber || ''}
                onChange={(e) => setMappedHeaders({...mappedHeaders, cardNumber: e.target.value})}
              >
                <option value="">בחר עמודה</option>
                {headers.map((header, index) => (
                  <option key={index} value={header}>{header}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">שם בית עסק</label>
              <select 
                className="w-full p-2 border rounded"
                value={mappedHeaders.businessName || ''}
                onChange={(e) => setMappedHeaders({...mappedHeaders, businessName: e.target.value})}
              >
                <option value="">בחר עמודה</option>
                {headers.map((header, index) => (
                  <option key={index} value={header}>{header}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">תאריך חיוב</label>
              <select 
                className="w-full p-2 border rounded"
                value={mappedHeaders.chargeDate || ''}
                onChange={(e) => setMappedHeaders({...mappedHeaders, chargeDate: e.target.value})}
              >
                <option value="">בחר עמודה</option>
                {headers.map((header, index) => (
                  <option key={index} value={header}>{header}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">סכום חיוב</label>
              <select 
                className="w-full p-2 border rounded"
                value={mappedHeaders.chargeAmount || ''}
                onChange={(e) => setMappedHeaders({...mappedHeaders, chargeAmount: e.target.value})}
              >
                <option value="">בחר עמודה</option>
                {headers.map((header, index) => (
                  <option key={index} value={header}>{header}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            onClick={applyManualMapping}
            disabled={isProcessing}
          >
            החל מיפוי
          </button>
        </div>
      )}
      
      {mappedCharges.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xl font-bold mb-4">חיובים שזוהו ({mappedCharges.length})</h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-200 shadow-md rounded-lg overflow-hidden">
              <thead className="bg-gray-50">
                <tr>
                  <th className="py-2 px-3 text-right">שם בית עסק</th>
                  <th className="py-2 px-3 text-right">תאריך</th>
                  <th className="py-2 px-3 text-right">סכום</th>
                  <th className="py-2 px-3 text-right">מספר כרטיס</th>
                  <th className="py-2 px-3 text-right">אמצעי תשלום</th>
                  <th className="py-2 px-3 text-right">קטגוריה</th>
                  <th className="py-2 px-3 text-right">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {mappedCharges.map((item, index) => {
                  // מציאת הקטגוריה והאייקון שלה
                  const category = categories.find(c => c.id === item.transaction.categoryId);
                  // מציאת אמצעי התשלום והאייקון שלו
                  const paymentMethod = paymentMethods.find(p => p.id === item.transaction.paymentMethodId);
                  
                  return (
                    <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                      <td className="py-2 px-3">{item.charge.businessName}</td>
                      <td className="py-2 px-3">{new Date(item.charge.chargeDate).toLocaleDateString('he-IL')}</td>
                      <td className="py-2 px-3 text-left">{item.charge.chargeAmount.toFixed(2)} ₪</td>
                      <td className="py-2 px-3">{item.charge.cardNumber}</td>
                      <td className="py-2 px-3">
                        <select
                          className="w-full p-1 border rounded"
                          value={item.transaction.paymentMethodId}
                          onChange={(e) => {
                            const updatedMappedCharges = [...mappedCharges];
                            updatedMappedCharges[index].transaction.paymentMethodId = e.target.value;
                            setMappedCharges(updatedMappedCharges);
                          }}
                        >
                          {paymentMethods.map((method) => (
                            <option key={method.id} value={method.id}>
                              {method.icon} {method.name}
                            </option>
                          ))}
                        </select>
                        {paymentMethod && (
                          <div className="text-xs text-gray-500 mt-1">
                            זוהה לפי: {paymentMethod.keywords?.find(keyword => 
                              item.charge.cardNumber.includes(keyword)
                            ) || "ברירת מחדל"}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <select
                          className="w-full p-1 border rounded"
                          value={item.transaction.categoryId}
                          onChange={(e) => {
                            const updatedMappedCharges = [...mappedCharges];
                            updatedMappedCharges[index].transaction.categoryId = e.target.value;
                            setMappedCharges(updatedMappedCharges);
                          }}
                        >
                          {categories
                            .filter(category => category.type === 'expense')
                            .map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.icon} {category.name}
                              </option>
                            ))}
                        </select>
                        {category && category.keywords && category.keywords.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {category.keywords.some(keyword => 
                              item.charge.businessName.toLowerCase().includes(keyword.toLowerCase())
                            ) ? (
                              <span>
                                זוהה לפי: {category.keywords.find(keyword => 
                                  item.charge.businessName.toLowerCase().includes(keyword.toLowerCase())
                                )}
                              </span>
                            ) : (
                              <span>קטגוריה לא זוהתה אוטומטית</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <button
                          className="text-red-500 hover:text-red-700"
                          onClick={() => {
                            const updatedMappedCharges = mappedCharges.filter((_, i) => i !== index);
                            setMappedCharges(updatedMappedCharges);
                          }}
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          <div className="mt-4 flex justify-end">
            <button
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
              onClick={() => {
                setCharges([]);
                setMappedCharges([]);
                setFile(null);
                setWorkbook(null);
                setHeaders([]);
                setManualMappingMode(false);
              }}
            >
              ביטול
            </button>
            <button
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded"
              onClick={saveAllTransactions}
              disabled={isProcessing}
            >
              {isProcessing ? 'מעבד...' : 'שמור כל העסקאות'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditCardImport; 