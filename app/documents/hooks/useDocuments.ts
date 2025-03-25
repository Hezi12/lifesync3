import { useState, useEffect } from 'react';
import { Document } from '../../types';

export const useDocuments = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // טעינת מסמכים מהזיכרון המקומי
  useEffect(() => {
    const savedDocs = localStorage.getItem('documents');
    if (savedDocs) {
      try {
        const parsedDocs = JSON.parse(savedDocs);
        const docsWithDates = parsedDocs.map((doc: any) => ({
          ...doc,
          createdAt: new Date(doc.createdAt),
          updatedAt: new Date(doc.updatedAt)
        }));
        setDocuments(docsWithDates);
        
        // בחירת המסמך האחרון שנערך אם קיים
        const lastEditedId = localStorage.getItem('lastEditedDocId');
        if (lastEditedId && docsWithDates.some((doc: Document) => doc.id === lastEditedId)) {
          setSelectedDocId(lastEditedId);
          const selectedDoc = docsWithDates.find((doc: Document) => doc.id === lastEditedId);
          if (selectedDoc) {
            setTitle(selectedDoc.title);
            setContent(selectedDoc.content);
            setIsEditing(true);
          }
        }
      } catch (error) {
        console.error('שגיאה בטעינת המסמכים:', error);
      }
    }
  }, []);

  // שמירת מסמכים בכל שינוי
  useEffect(() => {
    localStorage.setItem('documents', JSON.stringify(documents));
    
    // שמירת המסמך האחרון שנערך
    if (selectedDocId) {
      localStorage.setItem('lastEditedDocId', selectedDocId);
    }
  }, [documents, selectedDocId]);

  // מסנן את המסמך שנבחר
  const selectedDocument = selectedDocId 
    ? documents.find(doc => doc.id === selectedDocId) 
    : null;

  // יצירת מסמך חדש
  const createNewDocument = () => {
    setIsCreating(true);
    setIsEditing(true);
    setSelectedDocId(null);
    setTitle('');
    setContent('');
  };

  // בחירת מסמך לעריכה
  const selectDocument = (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (doc) {
      setSelectedDocId(id);
      setTitle(doc.title);
      setContent(doc.content);
      setIsEditing(true);
      setIsCreating(false);
    }
  };

  // שמירת מסמך
  const saveDocument = () => {
    if (!title.trim()) return;

    const now = new Date();
    
    if (isCreating) {
      // יצירת מסמך חדש
      const newDoc: Document = {
        id: Date.now().toString(),
        title,
        content,
        createdAt: now,
        updatedAt: now
      };
      
      setDocuments([...documents, newDoc]);
      setSelectedDocId(newDoc.id);
      setIsCreating(false);
    } else if (selectedDocId) {
      // עדכון מסמך קיים
      const updatedDocs = documents.map(doc => 
        doc.id === selectedDocId 
          ? { ...doc, title, content, updatedAt: now } 
          : doc
      );
      
      setDocuments(updatedDocs);
    }
    
    setIsEditing(false);
  };

  // מחיקת מסמך
  const deleteDocument = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
    
    if (selectedDocId === id) {
      setSelectedDocId(null);
      setTitle('');
      setContent('');
      setIsEditing(false);
      setIsCreating(false);
    }
  };

  return {
    documents,
    selectedDocId,
    title,
    content,
    isEditing,
    isCreating,
    selectedDocument,
    setTitle,
    setContent,
    setIsEditing,
    createNewDocument,
    selectDocument,
    saveDocument,
    deleteDocument
  };
}; 