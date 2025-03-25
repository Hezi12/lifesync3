'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { Document } from '../types';

// הגדרת הטיפוס של קונטקסט המסמכים
interface DocumentsContextType {
  documents: Document[];
  selectedDocId: string | null;
  createDocument: () => Document;
  updateDocument: (id: string, content: string, title: string) => void;
  deleteDocument: (id: string) => void;
  selectDocument: (id: string) => void;
  getDocumentById: (id: string) => Document | null;
}

// יצירת ערך ברירת מחדל לקונטקסט
const defaultDocumentsContext: DocumentsContextType = {
  documents: [],
  selectedDocId: null,
  createDocument: () => {
    throw new Error('createDocument not implemented');
    return {} as Document;
  },
  updateDocument: () => {
    throw new Error('updateDocument not implemented');
  },
  deleteDocument: () => {
    throw new Error('deleteDocument not implemented');
  },
  selectDocument: () => {
    throw new Error('selectDocument not implemented');
  },
  getDocumentById: () => {
    throw new Error('getDocumentById not implemented');
    return null;
  },
};

// יצירת הקונטקסט
const DocumentsContext = createContext<DocumentsContextType>(defaultDocumentsContext);

// יצירת ספק הקונטקסט
export const DocumentsProvider = ({ children }: { children: React.ReactNode }) => {
  // ניהול מצב המסמכים והמסמך הנבחר
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // טעינת מסמכים מהאחסון המקומי בטעינת הקומפוננטה
  useEffect(() => {
    const loadDocuments = () => {
      try {
        // נסיון לטעון מסמכים מהאחסון המקומי
        const documentsJson = localStorage.getItem('documents');
        if (documentsJson) {
          const parsedDocuments = JSON.parse(documentsJson);
          // המרת מחרוזות תאריך לאובייקטי תאריך
          const docsWithDates = parsedDocuments.map((doc: any) => ({
            ...doc,
            createdAt: new Date(doc.createdAt),
            updatedAt: new Date(doc.updatedAt)
          }));
          setDocuments(docsWithDates);

          // בחירת המסמך האחרון שנערך, אם קיים
          const lastEditedDocId = localStorage.getItem('selectedDocId');
          if (lastEditedDocId && docsWithDates.some((doc: Document) => doc.id === lastEditedDocId)) {
            setSelectedDocId(lastEditedDocId);
          } else if (docsWithDates.length > 0) {
            // אחרת, בחירת המסמך הראשון
            setSelectedDocId(docsWithDates[0].id);
          }
        }
      } catch (error) {
        console.error('שגיאה בטעינת מסמכים:', error);
        // במקרה של שגיאה, איפוס המסמכים
        setDocuments([]);
      }
    };

    loadDocuments();
  }, []);

  // שמירת מסמכים באחסון המקומי בכל שינוי
  useEffect(() => {
    if (documents.length > 0) {
      localStorage.setItem('documents', JSON.stringify(documents));
    }
  }, [documents]);

  // שמירת המסמך הנבחר באחסון המקומי
  useEffect(() => {
    if (selectedDocId) {
      localStorage.setItem('selectedDocId', selectedDocId);
    }
  }, [selectedDocId]);

  // יצירת מסמך חדש
  const createDocument = (): Document => {
    const newDoc: Document = {
      id: Date.now().toString(),
      title: 'מסמך חדש',
      content: '',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setDocuments([...documents, newDoc]);
    setSelectedDocId(newDoc.id);
    return newDoc;
  };

  // עדכון מסמך קיים
  const updateDocument = (id: string, content: string, title: string) => {
    const updatedDocs = documents.map(doc => {
      if (doc.id === id) {
        return {
          ...doc,
          content,
          title,
          updatedAt: new Date()
        };
      }
      return doc;
    });

    setDocuments(updatedDocs);
  };

  // מחיקת מסמך
  const deleteDocument = (id: string) => {
    const filteredDocs = documents.filter(doc => doc.id !== id);
    setDocuments(filteredDocs);

    // אם המסמך שנמחק היה הנבחר, בחירת מסמך אחר
    if (selectedDocId === id) {
      if (filteredDocs.length > 0) {
        setSelectedDocId(filteredDocs[0].id);
      } else {
        setSelectedDocId(null);
      }
    }
  };

  // בחירת מסמך
  const selectDocument = (id: string) => {
    setSelectedDocId(id);
  };

  // קבלת מסמך לפי מזהה
  const getDocumentById = (id: string): Document | null => {
    return documents.find(doc => doc.id === id) || null;
  };

  // ערך הקונטקסט
  const value = {
    documents,
    selectedDocId,
    createDocument,
    updateDocument,
    deleteDocument,
    selectDocument,
    getDocumentById
  };

  return (
    <DocumentsContext.Provider value={value}>
      {children}
    </DocumentsContext.Provider>
  );
};

// הוק לשימוש בקונטקסט
export const useDocumentsContext = (): DocumentsContextType => {
  const context = useContext(DocumentsContext);
  if (context === undefined) {
    throw new Error('useDocumentsContext חייב להיות בתוך DocumentsProvider');
  }
  return context;
}; 