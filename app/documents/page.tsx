'use client';

import { useState } from 'react';
import { useDocumentsContext } from '../context/DocumentsContext';
import DocumentList from './components/DocumentList';
import DocumentEditor from './components/DocumentEditor';
import AuthGuard from '../components/AuthGuard';

export default function DocumentsPage() {
  const {
    documents,
    selectedDocId,
    selectDocument,
    deleteDocument,
    createDocument,
    updateDocument,
    getDocumentById
  } = useDocumentsContext();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  const selectedDocument = selectedDocId ? getDocumentById(selectedDocId) : null;
  
  // עדכון הכותרת והתוכן כאשר המסמך הנבחר משתנה
  const handleSelectDocument = (id: string) => {
    const doc = getDocumentById(id);
    if (doc) {
      setTitle(doc.title);
      setContent(doc.content);
      setIsEditing(false);
      setIsCreating(false);
      selectDocument(id);
    }
  };
  
  // יצירת מסמך חדש
  const handleCreateDocument = () => {
    setTitle('מסמך חדש');
    setContent('');
    setIsEditing(true);
    setIsCreating(true);
  };
  
  // שמירת מסמך
  const handleSaveDocument = () => {
    if (!title.trim()) return;
    
    if (isCreating) {
      const newDoc = createDocument();
      updateDocument(newDoc.id, content, title);
    } else if (selectedDocId) {
      updateDocument(selectedDocId, content, title);
    }
    
    setIsEditing(false);
    setIsCreating(false);
  };

  return (
    <AuthGuard>
      <div className="h-full flex gap-6">
        <DocumentList 
          documents={documents}
          selectedDocId={selectedDocId}
          onSelectDocument={handleSelectDocument}
          onDeleteDocument={deleteDocument}
          onCreateDocument={handleCreateDocument}
        />
        
        <div className="flex-grow">
          <DocumentEditor 
            selectedDocument={selectedDocument}
            isCreating={isCreating}
            isEditing={isEditing}
            title={title}
            content={content}
            onTitleChange={setTitle}
            onContentChange={setContent}
            onSave={handleSaveDocument}
            onEdit={() => setIsEditing(true)}
            onCreateNew={handleCreateDocument}
          />
        </div>
      </div>
    </AuthGuard>
  );
} 