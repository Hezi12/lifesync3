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
  addPaymentMethod: (method: PaymentMethod) => Promise<void>;
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
  addPaymentMethod: async () => {},
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
  getCategoryById: () => undefined
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
  },
  {
    id: 'paypal',
    name: 'PayPal',
    icon: '🌐',
    color: '#9C27B0',
    initialBalance: 500,
    currentBalance: 700
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

  // פונקציה לסנכרון נתונים מקומיים עם Firebase
  const syncLocalDataWithFirebase = async () => {
    if (!user || !db) return;

    try {
      // סנכרון שיטות תשלום
      const localPaymentMethods = localStorage.getItem('paymentMethods');
      if (localPaymentMethods) {
        const methods = JSON.parse(localPaymentMethods);
        for (const method of methods) {
          await setDoc(doc(db, `users/${user.uid}/paymentMethods/${method.id}`), method, { merge: true });
        }
      }

      // סנכרון קטגוריות
      const localCategories = localStorage.getItem('financialCategories');
      if (localCategories) {
        const categories = JSON.parse(localCategories);
        for (const category of categories) {
          await setDoc(doc(db, `users/${user.uid}/categories/${category.id}`), category, { merge: true });
        }
      }

      // סנכרון עסקאות
      const localTransactions = localStorage.getItem('transactions');
      if (localTransactions) {
        const transactions = JSON.parse(localTransactions);
        for (const transaction of transactions) {
          await setDoc(doc(db, `users/${user.uid}/transactions/${transaction.id}`), 
            { ...transaction, date: new Date(transaction.date) }, 
            { merge: true }
          );
        }
      }

      // סנכרון חובות והלוואות
      const localDebtLoans = localStorage.getItem('debtLoans');
      if (localDebtLoans) {
        const debtLoans = JSON.parse(localDebtLoans);
        for (const debtLoan of debtLoans) {
          await setDoc(doc(db, `users/${user.uid}/debtLoans/${debtLoan.id}`),
            { ...debtLoan, dueDate: debtLoan.dueDate ? new Date(debtLoan.dueDate) : null },
            { merge: true }
          );
        }
      }
    } catch (error) {
      console.error('שגיאה בסנכרון נתונים עם Firebase:', error);
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
  }, [paymentMethods, debtLoans]);

  // פונקציה לטעינת נתונים מ-localStorage
  const loadLocalData = () => {
    try {
      console.log('טוען נתונים מקומיים...');
      // טעינת שיטות תשלום
      const savedPaymentMethods = localStorage.getItem('paymentMethods');
      if (savedPaymentMethods) {
        setPaymentMethods(JSON.parse(savedPaymentMethods));
      } else {
        setPaymentMethods(defaultPaymentMethods);
        localStorage.setItem('paymentMethods', JSON.stringify(defaultPaymentMethods));
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
        setCategories(defaultCategories);
        localStorage.setItem('financialCategories', JSON.stringify(defaultCategories));
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
    // חישוב היתרה משיטות התשלום
    let balance = paymentMethods.reduce((sum, method) => sum + method.currentBalance, 0);
    
    // עדכון לפי חובות והלוואות פתוחים
    debtLoans.forEach(item => {
      if (!item.isPaid) {
        if (item.isDebt) {
          // אם זה חוב שאני חייב, מורידים מהיתרה
          balance -= item.amount;
        } else {
          // אם זו הלוואה שאני נתתי, מוסיפים ליתרה
          balance += item.amount;
        }
      }
    });
    
    setTotalBalance(balance);
  };

  // פונקציות לעדכון נתונים עם טיפול במצב לא מקוון

  // שיטות תשלום
  const updatePaymentMethod = async (method: PaymentMethod) => {
    try {
      const updatedMethods = paymentMethods.map(m => 
        m.id === method.id ? method : m
      );
      
      setPaymentMethods(updatedMethods);
      localStorage.setItem('paymentMethods', JSON.stringify(updatedMethods));
      
      if (user && isOnline) {
        const methodRef = doc(db, `users/${user.uid}/paymentMethods/${method.id}`);
        await updateDoc(methodRef, { ...method });
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
      // אם אין מזהה, צור אחד
      if (!method.id) {
        method.id = uuidv4();
      }
      
      const newMethods = [...paymentMethods, method];
      setPaymentMethods(newMethods);
      localStorage.setItem('paymentMethods', JSON.stringify(newMethods));
      
      if (user && isOnline) {
        const methodsRef = collection(db, `users/${user.uid}/paymentMethods`);
        await setDoc(doc(methodsRef, method.id), method);
      } else if (user) {
        setPendingChanges(true);
      }
    } catch (error) {
      console.error('שגיאה בהוספת שיטת תשלום:', error);
      throw error;
    }
  };

  const deletePaymentMethod = async (id: string) => {
    try {
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
      
      const newTransactions = [...transactions, transaction];
      setTransactions(newTransactions);
      localStorage.setItem('transactions', JSON.stringify(newTransactions));
      
      // עדכון היתרה של שיטת התשלום
      const method = paymentMethods.find(m => m.id === transaction.paymentMethodId);
      if (method) {
        const updatedMethod = { ...method };
        if (transaction.type === 'income') {
          updatedMethod.currentBalance += transaction.amount;
        } else {
          updatedMethod.currentBalance -= transaction.amount;
        }
        
        await updatePaymentMethod(updatedMethod);
      }
      
      if (user && isOnline) {
        const transactionsRef = collection(db, `users/${user.uid}/transactions`);
        await setDoc(doc(transactionsRef, transaction.id), transaction);
      } else if (user) {
        setPendingChanges(true);
      }
    } catch (error) {
      console.error('שגיאה בהוספת עסקה:', error);
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
            const updatedOldMethod = { ...oldMethod };
            if (oldTransaction.type === 'income') {
              updatedOldMethod.currentBalance -= oldTransaction.amount;
            } else {
              updatedOldMethod.currentBalance += oldTransaction.amount;
            }
            
            await updatePaymentMethod(updatedOldMethod);
          }
          
          // מוסיף את ההשפעה של העסקה החדשה
          const newMethod = paymentMethods.find(m => m.id === transaction.paymentMethodId);
          if (newMethod) {
            const updatedNewMethod = { ...newMethod };
            if (transaction.type === 'income') {
              updatedNewMethod.currentBalance += transaction.amount;
            } else {
              updatedNewMethod.currentBalance -= transaction.amount;
            }
            
            await updatePaymentMethod(updatedNewMethod);
          }
        } 
        // אם רק הסכום או הסוג השתנה
        else {
          const method = paymentMethods.find(m => m.id === transaction.paymentMethodId);
          if (method) {
            const updatedMethod = { ...method };
            
            // ביטול ההשפעה של העסקה הישנה
            if (oldTransaction.type === 'income') {
              updatedMethod.currentBalance -= oldTransaction.amount;
            } else {
              updatedMethod.currentBalance += oldTransaction.amount;
            }
            
            // הוספת ההשפעה של העסקה החדשה
            if (transaction.type === 'income') {
              updatedMethod.currentBalance += transaction.amount;
            } else {
              updatedMethod.currentBalance -= transaction.amount;
            }
            
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
        // עדכון היתרה של שיטת התשלום
        const method = paymentMethods.find(m => m.id === transaction.paymentMethodId);
        if (method) {
          const updatedMethod = { ...method };
          if (transaction.type === 'income') {
            updatedMethod.currentBalance -= transaction.amount;
          } else {
            updatedMethod.currentBalance += transaction.amount;
          }
          
          await updatePaymentMethod(updatedMethod);
        }
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
    } catch (error) {
      console.error('שגיאה במחיקת עסקה:', error);
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
      
      const newDebtLoans = [...debtLoans, debtLoan];
      setDebtLoans(newDebtLoans);
      localStorage.setItem('debtLoans', JSON.stringify(newDebtLoans));
      
      if (user && isOnline) {
        const debtLoansRef = collection(db, `users/${user.uid}/debtLoans`);
        await setDoc(doc(debtLoansRef, debtLoan.id), debtLoan);
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
      const updatedDebtLoans = debtLoans.map(d => 
        d.id === debtLoan.id ? debtLoan : d
      );
      
      setDebtLoans(updatedDebtLoans);
      localStorage.setItem('debtLoans', JSON.stringify(updatedDebtLoans));
      
      if (user && isOnline) {
        const debtLoanRef = doc(db, `users/${user.uid}/debtLoans/${debtLoan.id}`);
        await updateDoc(debtLoanRef, { ...debtLoan });
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
      // יצירת שיטות תשלום ברירת מחדל
      const paymentMethodsRef = collection(db, `users/${user.uid}/paymentMethods`);
      for (const method of defaultPaymentMethods) {
        await setDoc(doc(paymentMethodsRef, method.id), method);
      }

      // יצירת קטגוריות ברירת מחדל
      const categoriesRef = collection(db, `users/${user.uid}/categories`);
      for (const category of defaultCategories) {
        await setDoc(doc(categoriesRef, category.id), category);
      }

      console.log('נתוני ברירת מחדל נוצרו בהצלחה');
    } catch (error) {
      console.error('שגיאה ביצירת נתוני ברירת מחדל:', error);
      setError('אירעה שגיאה ביצירת נתוני ברירת מחדל');
    }
  };

  // ערך הקונטקסט
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
    getCategoryById
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