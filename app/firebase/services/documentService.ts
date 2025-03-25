import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '../config';
import { Document } from '../../types';

const COLLECTION_NAME = 'documents';

// המרת מסמך מ-Firestore למסמך באפליקציה
const convertFromFirestore = (doc: DocumentData): Document => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    content: data.content,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  };
};

// המרת מסמך מהאפליקציה למסמך ב-Firestore
const convertToFirestore = (document: Document) => {
  return {
    title: document.title,
    content: document.content,
    createdAt: Timestamp.fromDate(document.createdAt),
    updatedAt: Timestamp.fromDate(document.updatedAt),
  };
};

// קבלת כל המסמכים של המשתמש
export const getUserDocuments = async (userId: string): Promise<Document[]> => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const documents: Document[] = [];
    
    querySnapshot.forEach((doc) => {
      documents.push(convertFromFirestore(doc));
    });
    
    return documents;
  } catch (error) {
    console.error('שגיאה בקבלת מסמכים:', error);
    throw error;
  }
};

// יצירת מסמך חדש
export const createDocument = async (userId: string, document: Omit<Document, 'id'>): Promise<Document> => {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...convertToFirestore(document as Document),
      userId,
    });
    
    return {
      id: docRef.id,
      ...document,
    };
  } catch (error) {
    console.error('שגיאה ביצירת מסמך:', error);
    throw error;
  }
};

// עדכון מסמך קיים
export const updateDocument = async (documentId: string, changes: Partial<Document>): Promise<void> => {
  try {
    const documentRef = doc(db, COLLECTION_NAME, documentId);
    
    const updates: any = {};
    if (changes.title !== undefined) updates.title = changes.title;
    if (changes.content !== undefined) updates.content = changes.content;
    updates.updatedAt = Timestamp.now();
    
    await updateDoc(documentRef, updates);
  } catch (error) {
    console.error('שגיאה בעדכון מסמך:', error);
    throw error;
  }
};

// מחיקת מסמך
export const deleteDocument = async (documentId: string): Promise<void> => {
  try {
    const documentRef = doc(db, COLLECTION_NAME, documentId);
    await deleteDoc(documentRef);
  } catch (error) {
    console.error('שגיאה במחיקת מסמך:', error);
    throw error;
  }
}; 