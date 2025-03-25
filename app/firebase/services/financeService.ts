import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '../config';
import { Transaction, PaymentMethod, FinancialCategory, DebtLoan } from '../../types';

const TRANSACTIONS_COLLECTION = 'transactions';
const PAYMENT_METHODS_COLLECTION = 'paymentMethods';
const CATEGORIES_COLLECTION = 'financialCategories';
const DEBT_LOANS_COLLECTION = 'debtLoans';

// המרות עבור עסקאות (הכנסות והוצאות)

const convertTransactionFromFirestore = (doc: DocumentData): Transaction => {
  const data = doc.data();
  return {
    id: doc.id,
    amount: data.amount,
    date: data.date.toDate(),
    description: data.description,
    categoryId: data.categoryId,
    paymentMethodId: data.paymentMethodId,
    type: data.type
  };
};

const convertTransactionToFirestore = (transaction: Transaction) => {
  return {
    amount: transaction.amount,
    date: Timestamp.fromDate(transaction.date),
    description: transaction.description,
    categoryId: transaction.categoryId,
    paymentMethodId: transaction.paymentMethodId,
    type: transaction.type
  };
};

// המרות עבור שיטות תשלום

const convertPaymentMethodFromFirestore = (doc: DocumentData): PaymentMethod => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    initialBalance: data.initialBalance,
    currentBalance: data.currentBalance,
    icon: data.icon,
    color: data.color
  };
};

const convertPaymentMethodToFirestore = (paymentMethod: PaymentMethod) => {
  return {
    name: paymentMethod.name,
    initialBalance: paymentMethod.initialBalance,
    currentBalance: paymentMethod.currentBalance,
    icon: paymentMethod.icon,
    color: paymentMethod.color
  };
};

// המרות עבור קטגוריות פיננסיות

const convertFinancialCategoryFromFirestore = (doc: DocumentData): FinancialCategory => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    icon: data.icon,
    color: data.color,
    parentId: data.parentId,
    type: data.type
  };
};

const convertFinancialCategoryToFirestore = (category: FinancialCategory) => {
  return {
    name: category.name,
    icon: category.icon,
    color: category.color,
    parentId: category.parentId,
    type: category.type
  };
};

// המרות עבור חובות והלוואות

const convertDebtLoanFromFirestore = (doc: DocumentData): DebtLoan => {
  const data = doc.data();
  return {
    id: doc.id,
    personName: data.personName,
    amount: data.amount,
    dueDate: data.dueDate ? data.dueDate.toDate() : undefined,
    notes: data.notes,
    paymentMethodId: data.paymentMethodId,
    isDebt: data.isDebt,
    isPaid: data.isPaid
  };
};

const convertDebtLoanToFirestore = (debtLoan: DebtLoan) => {
  return {
    personName: debtLoan.personName,
    amount: debtLoan.amount,
    dueDate: debtLoan.dueDate ? Timestamp.fromDate(debtLoan.dueDate) : null,
    notes: debtLoan.notes,
    paymentMethodId: debtLoan.paymentMethodId,
    isDebt: debtLoan.isDebt,
    isPaid: debtLoan.isPaid
  };
};

// עסקאות - קבלת כל העסקאות של המשתמש
export const getUserTransactions = async (userId: string): Promise<Transaction[]> => {
  try {
    const q = query(
      collection(db, TRANSACTIONS_COLLECTION),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const transactions: Transaction[] = [];
    
    querySnapshot.forEach((doc) => {
      transactions.push(convertTransactionFromFirestore(doc));
    });
    
    return transactions;
  } catch (error) {
    console.error('שגיאה בקבלת עסקאות:', error);
    throw error;
  }
};

// יצירת עסקה חדשה
export const createTransaction = async (userId: string, transaction: Omit<Transaction, 'id'>): Promise<Transaction> => {
  try {
    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), {
      ...convertTransactionToFirestore(transaction as Transaction),
      userId,
    });
    
    return {
      id: docRef.id,
      ...transaction,
    };
  } catch (error) {
    console.error('שגיאה ביצירת עסקה:', error);
    throw error;
  }
};

// עדכון עסקה קיימת
export const updateTransaction = async (transactionId: string, changes: Partial<Transaction>): Promise<void> => {
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    
    const updates: any = {};
    if (changes.amount !== undefined) updates.amount = changes.amount;
    if (changes.date !== undefined) updates.date = Timestamp.fromDate(changes.date);
    if (changes.description !== undefined) updates.description = changes.description;
    if (changes.categoryId !== undefined) updates.categoryId = changes.categoryId;
    if (changes.paymentMethodId !== undefined) updates.paymentMethodId = changes.paymentMethodId;
    if (changes.type !== undefined) updates.type = changes.type;
    
    await updateDoc(transactionRef, updates);
  } catch (error) {
    console.error('שגיאה בעדכון עסקה:', error);
    throw error;
  }
};

// מחיקת עסקה
export const deleteTransaction = async (transactionId: string): Promise<void> => {
  try {
    const transactionRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    await deleteDoc(transactionRef);
  } catch (error) {
    console.error('שגיאה במחיקת עסקה:', error);
    throw error;
  }
};

// שיטות תשלום - קבלת כל שיטות התשלום של המשתמש
export const getUserPaymentMethods = async (userId: string): Promise<PaymentMethod[]> => {
  try {
    const q = query(
      collection(db, PAYMENT_METHODS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const paymentMethods: PaymentMethod[] = [];
    
    querySnapshot.forEach((doc) => {
      paymentMethods.push(convertPaymentMethodFromFirestore(doc));
    });
    
    return paymentMethods;
  } catch (error) {
    console.error('שגיאה בקבלת שיטות תשלום:', error);
    throw error;
  }
};

// יצירת שיטת תשלום חדשה
export const createPaymentMethod = async (userId: string, paymentMethod: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> => {
  try {
    const docRef = await addDoc(collection(db, PAYMENT_METHODS_COLLECTION), {
      ...convertPaymentMethodToFirestore(paymentMethod as PaymentMethod),
      userId,
    });
    
    return {
      id: docRef.id,
      ...paymentMethod,
    };
  } catch (error) {
    console.error('שגיאה ביצירת שיטת תשלום:', error);
    throw error;
  }
};

// עדכון שיטת תשלום קיימת
export const updatePaymentMethod = async (paymentMethodId: string, changes: Partial<PaymentMethod>): Promise<void> => {
  try {
    const paymentMethodRef = doc(db, PAYMENT_METHODS_COLLECTION, paymentMethodId);
    
    const updates: any = {};
    if (changes.name !== undefined) updates.name = changes.name;
    if (changes.initialBalance !== undefined) updates.initialBalance = changes.initialBalance;
    if (changes.currentBalance !== undefined) updates.currentBalance = changes.currentBalance;
    if (changes.icon !== undefined) updates.icon = changes.icon;
    if (changes.color !== undefined) updates.color = changes.color;
    
    await updateDoc(paymentMethodRef, updates);
  } catch (error) {
    console.error('שגיאה בעדכון שיטת תשלום:', error);
    throw error;
  }
};

// מחיקת שיטת תשלום
export const deletePaymentMethod = async (paymentMethodId: string): Promise<void> => {
  try {
    const paymentMethodRef = doc(db, PAYMENT_METHODS_COLLECTION, paymentMethodId);
    await deleteDoc(paymentMethodRef);
  } catch (error) {
    console.error('שגיאה במחיקת שיטת תשלום:', error);
    throw error;
  }
};

// קטגוריות פיננסיות - קבלת כל הקטגוריות של המשתמש
export const getUserFinancialCategories = async (userId: string): Promise<FinancialCategory[]> => {
  try {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const categories: FinancialCategory[] = [];
    
    querySnapshot.forEach((doc) => {
      categories.push(convertFinancialCategoryFromFirestore(doc));
    });
    
    return categories;
  } catch (error) {
    console.error('שגיאה בקבלת קטגוריות פיננסיות:', error);
    throw error;
  }
};

// יצירת קטגוריה פיננסית חדשה
export const createFinancialCategory = async (userId: string, category: Omit<FinancialCategory, 'id'>): Promise<FinancialCategory> => {
  try {
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
      ...convertFinancialCategoryToFirestore(category as FinancialCategory),
      userId,
    });
    
    return {
      id: docRef.id,
      ...category,
    };
  } catch (error) {
    console.error('שגיאה ביצירת קטגוריה פיננסית:', error);
    throw error;
  }
};

// עדכון קטגוריה פיננסית קיימת
export const updateFinancialCategory = async (categoryId: string, changes: Partial<FinancialCategory>): Promise<void> => {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    
    const updates: any = {};
    if (changes.name !== undefined) updates.name = changes.name;
    if (changes.icon !== undefined) updates.icon = changes.icon;
    if (changes.color !== undefined) updates.color = changes.color;
    if (changes.parentId !== undefined) updates.parentId = changes.parentId;
    if (changes.type !== undefined) updates.type = changes.type;
    
    await updateDoc(categoryRef, updates);
  } catch (error) {
    console.error('שגיאה בעדכון קטגוריה פיננסית:', error);
    throw error;
  }
};

// מחיקת קטגוריה פיננסית
export const deleteFinancialCategory = async (categoryId: string): Promise<void> => {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error('שגיאה במחיקת קטגוריה פיננסית:', error);
    throw error;
  }
};

// חובות והלוואות - קבלת כל החובות וההלוואות של המשתמש
export const getUserDebtLoans = async (userId: string): Promise<DebtLoan[]> => {
  try {
    const q = query(
      collection(db, DEBT_LOANS_COLLECTION),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const debtLoans: DebtLoan[] = [];
    
    querySnapshot.forEach((doc) => {
      debtLoans.push(convertDebtLoanFromFirestore(doc));
    });
    
    return debtLoans;
  } catch (error) {
    console.error('שגיאה בקבלת חובות והלוואות:', error);
    throw error;
  }
};

// יצירת חוב/הלוואה חדש/ה
export const createDebtLoan = async (userId: string, debtLoan: Omit<DebtLoan, 'id'>): Promise<DebtLoan> => {
  try {
    const docRef = await addDoc(collection(db, DEBT_LOANS_COLLECTION), {
      ...convertDebtLoanToFirestore(debtLoan as DebtLoan),
      userId,
    });
    
    return {
      id: docRef.id,
      ...debtLoan,
    };
  } catch (error) {
    console.error('שגיאה ביצירת חוב/הלוואה:', error);
    throw error;
  }
};

// עדכון חוב/הלוואה קיים/ת
export const updateDebtLoan = async (debtLoanId: string, changes: Partial<DebtLoan>): Promise<void> => {
  try {
    const debtLoanRef = doc(db, DEBT_LOANS_COLLECTION, debtLoanId);
    
    const updates: any = {};
    if (changes.personName !== undefined) updates.personName = changes.personName;
    if (changes.amount !== undefined) updates.amount = changes.amount;
    if (changes.dueDate !== undefined) updates.dueDate = changes.dueDate ? Timestamp.fromDate(changes.dueDate) : null;
    if (changes.notes !== undefined) updates.notes = changes.notes;
    if (changes.paymentMethodId !== undefined) updates.paymentMethodId = changes.paymentMethodId;
    if (changes.isDebt !== undefined) updates.isDebt = changes.isDebt;
    if (changes.isPaid !== undefined) updates.isPaid = changes.isPaid;
    
    await updateDoc(debtLoanRef, updates);
  } catch (error) {
    console.error('שגיאה בעדכון חוב/הלוואה:', error);
    throw error;
  }
};

// מחיקת חוב/הלוואה
export const deleteDebtLoan = async (debtLoanId: string): Promise<void> => {
  try {
    const debtLoanRef = doc(db, DEBT_LOANS_COLLECTION, debtLoanId);
    await deleteDoc(debtLoanRef);
  } catch (error) {
    console.error('שגיאה במחיקת חוב/הלוואה:', error);
    throw error;
  }
}; 