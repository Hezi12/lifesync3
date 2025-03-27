'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PaymentMethod, Transaction, DebtLoan, FinancialCategory } from '../types';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  setDoc, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';

// טיפוס הקונטקסט של הפיננסים
interface FinanceContextType {
  paymentMethods: PaymentMethod[];
  transactions: Transaction[];
  debtLoans: DebtLoan[];
  categories: FinancialCategory[];
  isLoading: boolean;
  error: string | null;
  totalBalance: number;
  isOnline: boolean;
  pendingChanges: boolean;
  updatePaymentMethod: (method: PaymentMethod) => Promise<void>;
  addPaymentMethod: (method: PaymentMethod) => Promise<PaymentMethod>;
  deletePaymentMethod: (id: string) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  updateTransaction: (transaction: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addDebtLoan: (debtLoan: DebtLoan) => Promise<void>;
  updateDebtLoan: (debtLoan: DebtLoan) => Promise<void>;
  deleteDebtLoan: (id: string) => Promise<void>;
  toggleDebtLoanPaid: (id: string, isPaid: boolean) => Promise<void>;
  addCategory: (category: FinancialCategory) => Promise<void>;
  updateCategory: (category: FinancialCategory) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getPaymentMethodById: (id: string) => PaymentMethod | undefined;
  getCategoryById: (id: string) => FinancialCategory | undefined;
  recalculateBalances: () => void;
  exportAllData: () => Promise<void>;
  importAllData: (file: File) => Promise<void>;
}

// ערך ברירת מחדל לקונטקסט
const defaultContextValue: FinanceContextType = {
  paymentMethods: [],
  transactions: [],
  debtLoans: [],
  categories: [],
  isLoading: true,
  error: null,
  totalBalance: 0,
  isOnline: true,
  pendingChanges: false,
  updatePaymentMethod: async () => {},
  addPaymentMethod: async () => ({ id: '', name: '', icon: '', color: '', initialBalance: 0, currentBalance: 0, keywords: [] }),
  deletePaymentMethod: async () => {},
  addTransaction: async () => {},
  updateTransaction: async () => {},
  deleteTransaction: async () => {},
  addDebtLoan: async () => {},
  updateDebtLoan: async () => {},
  deleteDebtLoan: async () => {},
  toggleDebtLoanPaid: async () => {},
  addCategory: async () => {},
  updateCategory: async () => {},
  deleteCategory: async () => {},
  getPaymentMethodById: () => undefined,
  getCategoryById: () => undefined,
  recalculateBalances: () => {},
  exportAllData: async () => {},
  importAllData: async () => {}
};

// יצירת הקונטקסט
const FinanceContext = createContext<FinanceContextType>(defaultContextValue);

// הוק שימושי לגישה לקונטקסט
export const useFinanceContext = () => useContext(FinanceContext);

// קטגוריות ברירת מחדל
const defaultCategories: FinancialCategory[] = [
  {
    id: 'salary',
    name: 'משכורת',
    icon: '💼',
    color: '#4CAF50',
    type: 'income'
  },
  {
    id: 'bonus',
    name: 'בונוס',
    icon: '🎁',
    color: '#8BC34A',
    type: 'income'
  },
  {
    id: 'misc_income',
    name: 'שונות',
    icon: '📋',
    color: '#607D8B',
    type: 'income'
  },
  {
    id: 'rent',
    name: 'שכר דירה',
    icon: '🏠',
    color: '#F44336',
    type: 'expense'
  },
  {
    id: 'food',
    name: 'מזון',
    icon: '🍕',
    color: '#FF9800',
    type: 'expense'
  },
  {
    id: 'entertainment',
    name: 'בידור',
    icon: '🎬',
    color: '#9C27B0',
    type: 'expense'
  },
  {
    id: 'utilities',
    name: 'חשבונות',
    icon: '💡',
    color: '#2196F3',
    type: 'expense'
  },
  {
    id: 'misc_expense',
    name: 'שונות',
    icon: '📋',
    color: '#607D8B',
    type: 'expense'
  }
];

// שיטות תשלום ברירת מחדל
const defaultPaymentMethods: PaymentMethod[] = [
  {
    id: 'cash',
    name: 'מזומן',
    icon: '💵',
    color: '#4CAF50',
    initialBalance: 1000,
    currentBalance: 800
  },
  {
    id: 'credit',
    name: 'אשראי',
    icon: '💳',
    color: '#2196F3',
    initialBalance: 2000,
    currentBalance: 1500
  }
];

// ספק הקונטקסט
export const FinanceProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debtLoans, setDebtLoans] = useState<DebtLoan[]>([]);
  const [categories, setCategories] = useState<FinancialCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingChanges, setPendingChanges] = useState<boolean>(false);

  // האזנה למצב החיבור לאינטרנט
  useEffect(() => {
    const handleOnline = () => {
      console.log('המכשיר מחובר לאינטרנט');
      setIsOnline(true);
      // אם חזרנו למצב מקוון ויש משתמש מחובר, ננסה לסנכרן שינויים
      if (user && pendingChanges) {
        syncLocalDataWithFirebase()
          .then(() => setPendingChanges(false))
          .catch(err => console.error('שגיאה בסנכרון נתונים:', err));
      }
    };
    
    const handleOffline = () => {
      console.log('המכשיר אינו מחובר לאינטרנט');
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // בדיקה ראשונית של מצב החיבור
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, pendingChanges]);

  // האזנה לשינויים בזמן אמת מ-Firebase
  useEffect(() => {
    if (!user || !db) return;

    setIsLoading(true);
    setError(null);

    // פונקציה לניסיונות חוזרים לחיבור לפיירבייס
    const connectToFirebase = async (retries = 3) => {
      let attempt = 0;
      
      while (attempt < retries) {
        try {
          // בדיקת חיבור לפיירבייס
          const testRef = collection(db, `users/${user.uid}/connection-test`);
          await getDocs(testRef);
          console.log('חיבור לפיירבייס נוצר בהצלחה');
          return true;
        } catch (error) {
          console.error(`ניסיון חיבור לפיירבייס נכשל (${attempt + 1}/${retries}):`, error);
          attempt++;
          
          if (attempt >= retries) {
            setError('לא ניתן להתחבר לשרת. נסה שוב מאוחר יותר.');
            loadLocalData(); // טעינת נתונים מקומיים במקרה של כשל
            return false;
          }
          
          // המתנה לפני ניסיון נוסף
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      return false;
    };

    const setupFirebaseConnection = async () => {
      // ניסיון להתחבר לפיירבייס
      const connected = await connectToFirebase();
      if (!connected) return;

      try {
        // בדיקה אם למשתמש יש כבר נתונים או שצריך ליצור ברירות מחדל
        const checkUserData = async () => {
          const paymentMethodsRef = collection(db, `users/${user.uid}/paymentMethods`);
          const paymentSnapshot = await getDocs(paymentMethodsRef);
          
          if (paymentSnapshot.empty) {
            console.log('יוצר נתוני ברירת מחדל למשתמש חדש');
            await createDefaultData();
          }
        };
        
        await checkUserData();

        // האזנה לשינויים בשיטות תשלום
        const paymentMethodsRef = collection(db, `users/${user.uid}/paymentMethods`);
        const unsubPaymentMethods = onSnapshot(
          paymentMethodsRef, 
          (snapshot) => {
            const methodsData: PaymentMethod[] = [];
            snapshot.forEach((doc) => {
              methodsData.push({ id: doc.id, ...doc.data() } as PaymentMethod);
            });
            setPaymentMethods(methodsData);
            localStorage.setItem('paymentMethods', JSON.stringify(methodsData));
          },
          (error) => {
            console.error('שגיאה בהאזנה לשיטות תשלום:', error);
            setError('שגיאה בהאזנה לנתונים מהשרת');
          }
        );

        // האזנה לשינויים בקטגוריות
        const categoriesRef = collection(db, `users/${user.uid}/categories`);
        const unsubCategories = onSnapshot(
          categoriesRef, 
          (snapshot) => {
            const categoriesData: FinancialCategory[] = [];
            snapshot.forEach((doc) => {
              categoriesData.push({ id: doc.id, ...doc.data() } as FinancialCategory);
            });
            setCategories(categoriesData);
            localStorage.setItem('financialCategories', JSON.stringify(categoriesData));
          },
          (error) => {
            console.error('שגיאה בהאזנה לקטגוריות:', error);
          }
        );

        // האזנה לשינויים בעסקאות
        const transactionsRef = collection(db, `users/${user.uid}/transactions`);
        const unsubTransactions = onSnapshot(
          transactionsRef,
          (snapshot) => {
            const transactionsData: Transaction[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              transactionsData.push({
                id: doc.id,
                ...data,
                date: data.date ? new Date(data.date.toDate()) : new Date()
              } as Transaction);
            });
            setTransactions(transactionsData);
            localStorage.setItem('transactions', JSON.stringify(transactionsData));
          },
          (error) => {
            console.error('שגיאה בהאזנה לעסקאות:', error);
          }
        );

        // האזנה לשינויים בחובות והלוואות
        const debtLoansRef = collection(db, `users/${user.uid}/debtLoans`);
        const unsubDebtLoans = onSnapshot(
          debtLoansRef,
          (snapshot) => {
            const debtLoansData: DebtLoan[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              debtLoansData.push({
                id: doc.id,
                ...data,
                dueDate: data.dueDate ? new Date(data.dueDate.toDate()) : undefined
              } as DebtLoan);
            });
            setDebtLoans(debtLoansData);
            localStorage.setItem('debtLoans', JSON.stringify(debtLoansData));
          },
          (error) => {
            console.error('שגיאה בהאזנה לחובות והלוואות:', error);
          }
        );

        setIsLoading(false);

        // ניקוי ההאזנות בעת עזיבת הקומפוננטה
        return () => {
          unsubPaymentMethods();
          unsubCategories();
          unsubTransactions();
          unsubDebtLoans();
        };
      } catch (error) {
        console.error('שגיאה בהאזנה לשינויים מ-Firebase:', error);
        setError('אירעה שגיאה בהתחברות ל-Firebase');
        loadLocalData();
        setIsLoading(false);
      }
    };

    setupFirebaseConnection();
  }, [user]);

  // לאחר ה-useEffect שעושה setupFirebaseConnection
  // נוסיף useEffect נוסף שיבדוק אם קיימת שיטת תשלום PayPal וימחק אותה

  useEffect(() => {
    // פונקציה למחיקת שיטת תשלום PayPal
    const removePayPalPaymentMethod = async () => {
      if (!user || !db || !isOnline) return;
      
      try {
        // בדיקה אם קיימת שיטת תשלום PayPal
        const paypalMethod = paymentMethods.find(method => method.id === 'paypal');
        
        if (paypalMethod) {
          console.log('מוחק את שיטת התשלום PayPal מפיירבייס...');
          const methodRef = doc(db, `users/${user.uid}/paymentMethods/paypal`);
          await deleteDoc(methodRef);
          console.log('שיטת התשלום PayPal נמחקה בהצלחה');
        }
      } catch (error) {
        console.error('שגיאה במחיקת שיטת תשלום PayPal:', error);
      }
    };
    
    // הרצת הפונקציה
    if (paymentMethods.length > 0) {
      removePayPalPaymentMethod();
    }
  }, [user, db, isOnline, paymentMethods]);

  // פונקציה לסנכרון נתונים מקומיים עם Firebase
  const syncLocalDataWithFirebase = async () => {
    try {
      if (!user) return;

      // קבלת נתונים מ-Firebase
      const paymentMethodsRef = collection(db, `users/${user.uid}/paymentMethods`);
      const paymentMethodsSnapshot = await getDocs(paymentMethodsRef);
      const firebasePaymentMethods = paymentMethodsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PaymentMethod[];

      // קבלת נתונים מ-localStorage
      const localPaymentMethods = JSON.parse(localStorage.getItem('paymentMethods') || '[]') as PaymentMethod[];

      // אם אין נתונים ב-Firebase, נמחק את הנתונים המקומיים
      if (firebasePaymentMethods.length === 0) {
        setPaymentMethods([]);
        localStorage.removeItem('paymentMethods');
        return;
      }

      // מיזוג נתונים חכם
      const mergedPaymentMethods = firebasePaymentMethods.map(fbMethod => {
        const localMethod = localPaymentMethods.find(lm => lm.id === fbMethod.id);
        if (!localMethod) return fbMethod;
        
        // אם יש הבדל בתאריכי עדכון, נשתמש בגרסה העדכנית יותר
        const fbUpdated = fbMethod.updatedAt || new Date(0);
        const localUpdated = localMethod.updatedAt || new Date(0);
        
        return fbUpdated > localUpdated ? fbMethod : localMethod;
      });

      // הוספת שיטות תשלום מקומיות שלא קיימות ב-Firebase
      localPaymentMethods.forEach(localMethod => {
        if (!mergedPaymentMethods.find(m => m.id === localMethod.id)) {
          mergedPaymentMethods.push(localMethod);
        }
      });

      // עדכון הנתונים
      setPaymentMethods(mergedPaymentMethods);
      localStorage.setItem('paymentMethods', JSON.stringify(mergedPaymentMethods));

      // סנכרון חזרה ל-Firebase
      for (const method of mergedPaymentMethods) {
        const methodRef = doc(db, `users/${user.uid}/paymentMethods/${method.id}`);
        await setDoc(methodRef, {
          ...method,
          updatedAt: new Date()
        });
      }

      setPendingChanges(false);
    } catch (error) {
      console.error('שגיאה בסנכרון נתונים:', error);
      throw error;
    }
  };

  // ניסיון לסנכרן נתונים מקומיים כשהמשתמש מתחבר
  useEffect(() => {
    if (user) {
      syncLocalDataWithFirebase().catch(error => {
        console.error('שגיאה בסנכרון ראשוני:', error);
      });
    }
  }, [user]);

  // חישוב היתרה הכוללת כשיש שינויים בנתונים
  useEffect(() => {
    calculateTotalBalance();
  }, [paymentMethods, debtLoans, transactions]);

  // פונקציה לטעינת נתונים מ-localStorage
  const loadLocalData = () => {
    try {
      console.log('טוען נתונים מקומיים...');
      // טעינת שיטות תשלום
      const savedPaymentMethods = localStorage.getItem('paymentMethods');
      if (savedPaymentMethods) {
        setPaymentMethods(JSON.parse(savedPaymentMethods));
      } else {
        // לא טוען אמצעי תשלום ברירת מחדל - המערך יישאר ריק
        setPaymentMethods([]);
        localStorage.setItem('paymentMethods', JSON.stringify([]));
      }

      // טעינת עסקאות
      const savedTransactions = localStorage.getItem('transactions');
      if (savedTransactions) {
        // המרת תאריכים ממחרוזות לאובייקטי Date
        const parsedTransactions = JSON.parse(savedTransactions, (key, value) => {
          if (key === 'date') {
            return new Date(value);
          }
          return value;
        });
        setTransactions(parsedTransactions);
      } else {
        setTransactions([]);
      }

      // טעינת חובות והלוואות
      const savedDebtLoans = localStorage.getItem('debtLoans');
      if (savedDebtLoans) {
        // המרת תאריכים ממחרוזות לאובייקטי Date
        const parsedDebtLoans = JSON.parse(savedDebtLoans, (key, value) => {
          if (key === 'dueDate' && value) {
            return new Date(value);
          }
          return value;
        });
        setDebtLoans(parsedDebtLoans);
      } else {
        setDebtLoans([]);
      }

      // טעינת קטגוריות
      const savedCategories = localStorage.getItem('financialCategories');
      if (savedCategories) {
        setCategories(JSON.parse(savedCategories));
      } else {
        // לא טוען קטגוריות ברירת מחדל - המערך יישאר ריק
        setCategories([]);
        localStorage.setItem('financialCategories', JSON.stringify([]));
      }
    } catch (error) {
      console.error('שגיאה בטעינת נתונים מקומיים:', error);
      setError('אירעה שגיאה בטעינת הנתונים המקומיים');
    } finally {
      setIsLoading(false);
    }
  };

  // חישוב היתרה הכוללת
  const calculateTotalBalance = () => {
    try {
      console.group('חישוב יתרה כוללת');
      
      // חישוב היתרה משיטות התשלום
      let balance = 0;
      console.log('אמצעי תשלום:');
      paymentMethods.forEach(method => {
        console.log(`- ${method.name}: ${method.currentBalance}`);
        balance += method.currentBalance;
      });
      
      console.log('יתרה אחרי אמצעי תשלום:', balance);
      
      // עדכון לפי חובות והלוואות פתוחים
      console.log('התחשבות בחובות והלוואות:');
      
      debtLoans.forEach(item => {
        if (!item.isPaid) {
          if (item.isDebt) {
            // אם זה חוב שאני חייב, מורידים מהיתרה
            console.log(`- חוב: ${item.personName}, ${item.amount} (מופחת מהיתרה)`);
            balance -= item.amount;
          } else {
            // אם זו הלוואה שאני נתתי, מוסיפים ליתרה
            console.log(`- הלוואה: ${item.personName}, ${item.amount} (מתווסף ליתרה)`);
            balance += item.amount;
          }
        }
      });
      
      console.log('יתרה סופית:', balance);
      setTotalBalance(balance);
      
      console.groupEnd();
    } catch (error) {
      console.error('שגיאה בחישוב היתרה הכוללת:', error);
      console.groupEnd();
    }
  };

  // פונקציה חדשה לחישוב מחדש של היתרות
  const recalculateBalances = () => {
    try {
      console.group('חישוב מחדש של היתרות');
      
      // יצירת עותק של אמצעי התשלום עם איפוס מצב היתרה הנוכחית ליתרה ההתחלתית
      const recalculatedMethods = paymentMethods.map(method => {
        console.log(`איפוס ${method.name}: ${method.currentBalance} -> ${method.initialBalance}`);
        return {
          ...method,
          currentBalance: method.initialBalance
        };
      });
      
      // חישוב מחדש של השפעת כל העסקאות על היתרות
      console.log('מחשב מחדש לפי עסקאות:');
      transactions.forEach((transaction, index) => {
        const methodIndex = recalculatedMethods.findIndex(m => m.id === transaction.paymentMethodId);
        if (methodIndex >= 0) {
          const prevBalance = recalculatedMethods[methodIndex].currentBalance;
          
          if (transaction.type === 'income') {
            recalculatedMethods[methodIndex].currentBalance += transaction.amount;
            console.log(`עסקה ${index+1}: ${transaction.description}, +${transaction.amount} ל-${recalculatedMethods[methodIndex].name} (${prevBalance} -> ${recalculatedMethods[methodIndex].currentBalance})`);
          } else {
            recalculatedMethods[methodIndex].currentBalance -= transaction.amount;
            console.log(`עסקה ${index+1}: ${transaction.description}, -${transaction.amount} מ-${recalculatedMethods[methodIndex].name} (${prevBalance} -> ${recalculatedMethods[methodIndex].currentBalance})`);
          }
        } else {
          console.warn(`עסקה ${index+1}: לא נמצא אמצעי תשלום עם ID: ${transaction.paymentMethodId}`);
        }
      });
      
      // סיכום סופי
      recalculatedMethods.forEach(method => {
        const originalMethod = paymentMethods.find(m => m.id === method.id);
        const originalBalance = originalMethod?.currentBalance || 0;
        console.log(`${method.name}: ${originalBalance} -> ${method.currentBalance}, שינוי: ${method.currentBalance - originalBalance}`);
      });
      
      // עדכון אמצעי התשלום עם היתרות המחושבות מחדש
      setPaymentMethods(recalculatedMethods);
      localStorage.setItem('paymentMethods', JSON.stringify(recalculatedMethods));
      
      // חישוב היתרה הכוללת ייעשה באופן אוטומטי בזכות ה-useEffect
      
      console.groupEnd();
    } catch (error) {
      console.error('שגיאה בחישוב מחדש של היתרות:', error);
      console.groupEnd();
    }
  };

  // פונקציות לעדכון נתונים עם טיפול במצב לא מקוון

  // שיטות תשלום
  const updatePaymentMethod = async (method: PaymentMethod) => {
    try {
      // בדיקה אם כבר קיימת שיטת תשלום אחרת עם אותו שם
      const existingMethod = paymentMethods.find(m => 
        m.id !== method.id && // לא אותה שיטת תשלום
        m.name.toLowerCase().trim() === method.name.toLowerCase().trim()
      );

      if (existingMethod) {
        throw new Error(`כבר קיימת שיטת תשלום בשם "${method.name}". אנא בחר שם אחר.`);
      }

      const updatedMethod = {
        ...method,
        updatedAt: new Date(),
        name: method.name.trim() // הסרת רווחים מיותרים
      };
      
      const newMethods = paymentMethods.map(m => 
        m.id === method.id ? updatedMethod : m
      );
      
      setPaymentMethods(newMethods);
      localStorage.setItem('paymentMethods', JSON.stringify(newMethods));
      
      if (user && isOnline) {
        const methodRef = doc(db, `users/${user.uid}/paymentMethods/${method.id}`);
        await updateDoc(methodRef, updatedMethod);
      } else if (user) {
        setPendingChanges(true);
      }
    } catch (error) {
      console.error('שגיאה בעדכון שיטת תשלום:', error);
      throw error;
    }
  };

  const addPaymentMethod = async (method: PaymentMethod) => {
    try {
      // בדיקה אם כבר קיימת שיטת תשלום עם אותו שם
      const existingMethod = paymentMethods.find(m => 
        m.name.toLowerCase().trim() === method.name.toLowerCase().trim()
      );

      if (existingMethod) {
        throw new Error(`כבר קיימת שיטת תשלום בשם "${method.name}". אנא בחר שם אחר.`);
      }

      const newMethod = {
        ...method,
        id: method.id || uuidv4(),
        updatedAt: new Date(),
        name: method.name.trim() // הסרת רווחים מיותרים
      };
      
      const newMethods = [...paymentMethods, newMethod];
      setPaymentMethods(newMethods);
      localStorage.setItem('paymentMethods', JSON.stringify(newMethods));
      
      if (user && isOnline) {
        const methodRef = doc(db, `users/${user.uid}/paymentMethods/${newMethod.id}`);
        await setDoc(methodRef, newMethod);
      } else if (user) {
        setPendingChanges(true);
      }
      
      return newMethod;
    } catch (error) {
      console.error('שגיאה בהוספת שיטת תשלום:', error);
      throw error;
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
      // מחיקת כל העסקאות הקשורות לשיטת התשלום
      const relatedTransactions = transactions.filter(t => t.paymentMethodId === id);
      for (const transaction of relatedTransactions) {
        await deleteTransaction(transaction.id);
      }

      // מחיקת שיטת התשלום
      const newMethods = paymentMethods.filter(m => m.id !== id);
      setPaymentMethods(newMethods);
      localStorage.setItem('paymentMethods', JSON.stringify(newMethods));
      
      if (user && isOnline) {
        const methodRef = doc(db, `users/${user.uid}/paymentMethods/${id}`);
        await deleteDoc(methodRef);
      } else if (user) {
        setPendingChanges(true);
      }
    } catch (error) {
      console.error('שגיאה במחיקת שיטת תשלום:', error);
      throw error;
    }
  };

  // עסקאות
  const addTransaction = async (transaction: Transaction) => {
    try {
      // אם אין מזהה, צור אחד
      if (!transaction.id) {
        transaction.id = uuidv4();
      }
      
      console.group(`הוספת עסקה: ${transaction.description} (${transaction.id})`);
      console.log('סכום:', transaction.amount, 'סוג:', transaction.type, 'אמצעי תשלום:', transaction.paymentMethodId);
      
      const newTransactions = [...transactions, transaction];
      setTransactions(newTransactions);
      localStorage.setItem('transactions', JSON.stringify(newTransactions));
      
      // עדכון היתרה של שיטת התשלום
      const method = paymentMethods.find(m => m.id === transaction.paymentMethodId);
      if (method) {
        console.log('אמצעי תשלום לפני עדכון:', method.name, 'יתרה:', method.currentBalance, 'יתרה התחלתית:', method.initialBalance);
        
        const updatedMethod = { 
          ...method,
          currentBalance: transaction.type === 'income' 
            ? method.currentBalance + transaction.amount 
            : method.currentBalance - transaction.amount
        };
        
        console.log('אמצעי תשלום אחרי עדכון:', updatedMethod.name, 'יתרה:', updatedMethod.currentBalance, 'יתרה התחלתית:', updatedMethod.initialBalance);
        
        await updatePaymentMethod(updatedMethod);
      } else {
        console.warn('לא נמצא אמצעי תשלום עם ID:', transaction.paymentMethodId);
      }
      
      if (user && isOnline) {
        const transactionsRef = collection(db, `users/${user.uid}/transactions`);
        await setDoc(doc(transactionsRef, transaction.id), transaction);
      } else if (user) {
        setPendingChanges(true);
      }
      
      console.log('עסקה נוספה בהצלחה');
      console.groupEnd();
    } catch (error) {
      console.error('שגיאה בהוספת עסקה:', error);
      console.groupEnd();
      throw error;
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    try {
      // תחילה, מוצאים את העסקה הנוכחית לפני העדכון
      const oldTransaction = transactions.find(t => t.id === transaction.id);
      
      const updatedTransactions = transactions.map(t => 
        t.id === transaction.id ? transaction : t
      );
      
      setTransactions(updatedTransactions);
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
      
      // עדכון היתרה של שיטות התשלום
      if (oldTransaction) {
        // אם שיטת התשלום השתנתה, עדכן את שתי שיטות התשלום
        if (oldTransaction.paymentMethodId !== transaction.paymentMethodId) {
          // מבטל את ההשפעה של העסקה הישנה
          const oldMethod = paymentMethods.find(m => m.id === oldTransaction.paymentMethodId);
          if (oldMethod) {
            const updatedOldMethod = { 
              ...oldMethod,
              currentBalance: oldTransaction.type === 'income'
                ? oldMethod.currentBalance - oldTransaction.amount
                : oldMethod.currentBalance + oldTransaction.amount
            };
            
            await updatePaymentMethod(updatedOldMethod);
          }
          
          // מוסיף את ההשפעה של העסקה החדשה
          const newMethod = paymentMethods.find(m => m.id === transaction.paymentMethodId);
          if (newMethod) {
            const updatedNewMethod = { 
              ...newMethod,
              currentBalance: transaction.type === 'income'
                ? newMethod.currentBalance + transaction.amount
                : newMethod.currentBalance - transaction.amount
            };
            
            await updatePaymentMethod(updatedNewMethod);
          }
        } 
        // אם רק הסכום או הסוג השתנה
        else {
          const method = paymentMethods.find(m => m.id === transaction.paymentMethodId);
          if (method) {
            const updatedMethod = { 
              ...method,
              currentBalance: method.currentBalance + 
                (oldTransaction.type === 'income' ? -oldTransaction.amount : oldTransaction.amount) +
                (transaction.type === 'income' ? transaction.amount : -transaction.amount)
            };
            
            await updatePaymentMethod(updatedMethod);
          }
        }
      }
      
      if (user && isOnline) {
        const transactionRef = doc(db, `users/${user.uid}/transactions/${transaction.id}`);
        await updateDoc(transactionRef, { ...transaction });
      } else if (user) {
        setPendingChanges(true);
      }
    } catch (error) {
      console.error('שגיאה בעדכון עסקה:', error);
      throw error;
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      // מוצאים את העסקה לפני מחיקה
      const transaction = transactions.find(t => t.id === id);
      
      if (transaction) {
        console.group(`מחיקת עסקה: ${transaction.description} (${transaction.id})`);
        console.log('סכום:', transaction.amount, 'סוג:', transaction.type, 'אמצעי תשלום:', transaction.paymentMethodId);
        
        // עדכון היתרה של שיטת התשלום
        const method = paymentMethods.find(m => m.id === transaction.paymentMethodId);
        if (method) {
          console.log('אמצעי תשלום לפני עדכון:', method.name, 'יתרה:', method.currentBalance, 'יתרה התחלתית:', method.initialBalance);
          
          const updatedMethod = { 
            ...method,
            currentBalance: transaction.type === 'income'
              ? method.currentBalance - transaction.amount
              : method.currentBalance + transaction.amount
          };
          
          console.log('אמצעי תשלום אחרי עדכון:', updatedMethod.name, 'יתרה:', updatedMethod.currentBalance, 'יתרה התחלתית:', updatedMethod.initialBalance);
          
          await updatePaymentMethod(updatedMethod);
        } else {
          console.warn('לא נמצא אמצעי תשלום עם ID:', transaction.paymentMethodId);
        }
      } else {
        console.warn('לא נמצאה עסקה למחיקה עם ID:', id);
      }
      
      const newTransactions = transactions.filter(t => t.id !== id);
      setTransactions(newTransactions);
      localStorage.setItem('transactions', JSON.stringify(newTransactions));
      
      if (user && isOnline) {
        const transactionRef = doc(db, `users/${user.uid}/transactions/${id}`);
        await deleteDoc(transactionRef);
      } else if (user) {
        setPendingChanges(true);
      }
      
      console.log('עסקה נמחקה בהצלחה');
      console.groupEnd();
    } catch (error) {
      console.error('שגיאה במחיקת עסקה:', error);
      console.groupEnd();
      throw error;
    }
  };

  // חובות והלוואות
  const addDebtLoan = async (debtLoan: DebtLoan) => {
    try {
      // אם אין מזהה, צור אחד
      if (!debtLoan.id) {
        debtLoan.id = uuidv4();
      }
      
      // טיפול בערכים חסרים
      const processedDebtLoan = {
        ...debtLoan,
        dueDate: debtLoan.dueDate || null,
        notes: debtLoan.notes || '',
        paymentMethodId: debtLoan.paymentMethodId || ''
      };
      
      const newDebtLoans = [...debtLoans, processedDebtLoan];
      setDebtLoans(newDebtLoans);
      localStorage.setItem('debtLoans', JSON.stringify(newDebtLoans));
      
      if (user && isOnline) {
        const debtLoansRef = collection(db, `users/${user.uid}/debtLoans`);
        await setDoc(doc(debtLoansRef, processedDebtLoan.id), processedDebtLoan);
      } else if (user) {
        setPendingChanges(true);
      }
    } catch (error) {
      console.error('שגיאה בהוספת חוב/הלוואה:', error);
      throw error;
    }
  };

  const updateDebtLoan = async (debtLoan: DebtLoan) => {
    try {
      // טיפול בערכים חסרים
      const processedDebtLoan = {
        ...debtLoan,
        dueDate: debtLoan.dueDate || null,
        notes: debtLoan.notes || '',
        paymentMethodId: debtLoan.paymentMethodId || ''
      };
      
      const updatedDebtLoans = debtLoans.map(d => 
        d.id === processedDebtLoan.id ? processedDebtLoan : d
      );
      
      setDebtLoans(updatedDebtLoans);
      localStorage.setItem('debtLoans', JSON.stringify(updatedDebtLoans));
      
      if (user && isOnline) {
        const debtLoanRef = doc(db, `users/${user.uid}/debtLoans/${processedDebtLoan.id}`);
        await updateDoc(debtLoanRef, { ...processedDebtLoan });
      } else if (user) {
        setPendingChanges(true);
      }
    } catch (error) {
      console.error('שגיאה בעדכון חוב/הלוואה:', error);
      throw error;
    }
  };

  const deleteDebtLoan = async (id: string) => {
    try {
      const newDebtLoans = debtLoans.filter(d => d.id !== id);
      setDebtLoans(newDebtLoans);
      localStorage.setItem('debtLoans', JSON.stringify(newDebtLoans));
      
      if (user && isOnline) {
        const debtLoanRef = doc(db, `users/${user.uid}/debtLoans/${id}`);
        await deleteDoc(debtLoanRef);
      } else if (user) {
        setPendingChanges(true);
      }
    } catch (error) {
      console.error('שגיאה במחיקת חוב/הלוואה:', error);
      throw error;
    }
  };

  const toggleDebtLoanPaid = async (id: string, isPaid: boolean) => {
    try {
      const debtLoan = debtLoans.find(d => d.id === id);
      if (debtLoan) {
        const updatedDebtLoan = { ...debtLoan, isPaid };
        await updateDebtLoan(updatedDebtLoan);
      }
    } catch (error) {
      console.error('שגיאה בעדכון סטטוס תשלום:', error);
      throw error;
    }
  };

  // קטגוריות
  const addCategory = async (category: FinancialCategory) => {
    try {
      // אם אין מזהה, צור אחד
      if (!category.id) {
        category.id = uuidv4();
      }
      
      const newCategories = [...categories, category];
      setCategories(newCategories);
      localStorage.setItem('financialCategories', JSON.stringify(newCategories));
      
      if (user && isOnline) {
        const categoriesRef = collection(db, `users/${user.uid}/categories`);
        await setDoc(doc(categoriesRef, category.id), category);
      } else if (user) {
        setPendingChanges(true);
      }
    } catch (error) {
      console.error('שגיאה בהוספת קטגוריה:', error);
      throw error;
    }
  };

  const updateCategory = async (category: FinancialCategory) => {
    try {
      const updatedCategories = categories.map(c => 
        c.id === category.id ? category : c
      );
      
      setCategories(updatedCategories);
      localStorage.setItem('financialCategories', JSON.stringify(updatedCategories));
      
      if (user && isOnline) {
        const categoryRef = doc(db, `users/${user.uid}/categories/${category.id}`);
        await updateDoc(categoryRef, { ...category });
      } else if (user) {
        setPendingChanges(true);
      }
    } catch (error) {
      console.error('שגיאה בעדכון קטגוריה:', error);
      throw error;
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const newCategories = categories.filter(c => c.id !== id);
      setCategories(newCategories);
      localStorage.setItem('financialCategories', JSON.stringify(newCategories));
      
      if (user && isOnline) {
        const categoryRef = doc(db, `users/${user.uid}/categories/${id}`);
        await deleteDoc(categoryRef);
      } else if (user) {
        setPendingChanges(true);
      }
    } catch (error) {
      console.error('שגיאה במחיקת קטגוריה:', error);
      throw error;
    }
  };

  // פונקציות עזר
  const getPaymentMethodById = (id: string) => {
    return paymentMethods.find(method => method.id === id);
  };

  const getCategoryById = (id: string) => {
    return categories.find(category => category.id === id);
  };

  // פונקציה ליצירת נתוני ברירת מחדל ב-Firebase למשתמש חדש
  const createDefaultData = async () => {
    if (!user || !db) return;

    try {
      // במקום ליצור נתוני ברירת מחדל, נשאיר את המערכים ריקים
      console.log('לא נוצרו נתוני ברירת מחדל - המערכת תחכה להזנה מהמשתמש');
      
      // יצירת אוספים ריקים עבור המשתמש
      const paymentMethodsRef = collection(db, `users/${user.uid}/paymentMethods`);
      const categoriesRef = collection(db, `users/${user.uid}/categories`);
      
      // ללא יצירת נתוני דמה
    } catch (error) {
      console.error('שגיאה ביצירת אוספים למשתמש:', error);
      setError('אירעה שגיאה בהכנת המערכת');
    }
  };

  // פונקציה לייצוא כל הנתונים
  const exportAllData = async () => {
    try {
      // איסוף כל הנתונים
      const data = {
        paymentMethods,
        transactions,
        debtLoans,
        categories,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      // המרה לקובץ JSON
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      
      // יצירת קישור להורדה
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lifesync_backup_${new Date().toISOString().split('T')[0]}.json`;
      
      // הורדת הקובץ
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      console.log('נתונים יוצאו בהצלחה');
    } catch (error) {
      console.error('שגיאה בייצוא נתונים:', error);
      throw new Error('אירעה שגיאה בייצוא הנתונים');
    }
  };

  // פונקציה לייבוא כל הנתונים
  const importAllData = async (file: File) => {
    try {
      // קריאת הקובץ
      const text = await file.text();
      const data = JSON.parse(text);

      // בדיקת תקינות הקובץ
      if (!data.version || !data.paymentMethods || !data.transactions || !data.categories) {
        throw new Error('קובץ לא תקין');
      }

      // מחיקת כל הנתונים הקיימים
      // מחיקת שיטות תשלום
      for (const method of paymentMethods) {
        await deletePaymentMethod(method.id);
      }

      // מחיקת עסקאות
      for (const transaction of transactions) {
        await deleteTransaction(transaction.id);
      }

      // מחיקת קטגוריות
      for (const category of categories) {
        await deleteCategory(category.id);
      }

      // מחיקת חובות והלוואות
      for (const debtLoan of debtLoans) {
        await deleteDebtLoan(debtLoan.id);
      }

      // הוספת הנתונים החדשים
      // הוספת קטגוריות
      for (const category of data.categories) {
        await addCategory(category);
      }

      // הוספת שיטות תשלום
      for (const method of data.paymentMethods) {
        await addPaymentMethod(method);
      }

      // הוספת עסקאות
      for (const transaction of data.transactions) {
        await addTransaction({
          ...transaction,
          date: new Date(transaction.date)
        });
      }

      // הוספת חובות והלוואות
      for (const debtLoan of data.debtLoans) {
        await addDebtLoan({
          ...debtLoan,
          dueDate: debtLoan.dueDate ? new Date(debtLoan.dueDate) : null
        });
      }

      console.log('נתונים יובאו בהצלחה');
    } catch (error) {
      console.error('שגיאה בייבוא נתונים:', error);
      throw new Error('אירעה שגיאה בייבוא הנתונים');
    }
  };

  // עדכון ערך הקונטקסט עם הפונקציות החדשות
  const value: FinanceContextType = {
    paymentMethods,
    transactions,
    debtLoans,
    categories,
    isLoading,
    error,
    totalBalance,
    isOnline,
    pendingChanges,
    updatePaymentMethod,
    addPaymentMethod,
    deletePaymentMethod,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addDebtLoan,
    updateDebtLoan,
    deleteDebtLoan,
    toggleDebtLoanPaid,
    addCategory,
    updateCategory,
    deleteCategory,
    getPaymentMethodById,
    getCategoryById,
    recalculateBalances,
    exportAllData,
    importAllData
  };

  // עדכון סנכרון עם Firebase כשנטענים נתונים מקומיים במצב מחובר
  useEffect(() => {
    if (user && isOnline && pendingChanges) {
      console.log('מסנכרן שינויים מקומיים עם Firebase...');
      syncLocalDataWithFirebase()
        .then(() => {
          console.log('סנכרון הושלם בהצלחה');
          setPendingChanges(false);
        })
        .catch(err => {
          console.error('שגיאה בסנכרון:', err);
        });
    }
  }, [user, isOnline, pendingChanges]);

  return (
    <FinanceContext.Provider value={value}>
      {children}
    </FinanceContext.Provider>
  );
}; 