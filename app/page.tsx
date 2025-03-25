'use client';

import { useState, useEffect } from 'react';
import { FiTrash2 } from 'react-icons/fi';
import { useAppContext } from './context/AppContext';

export default function Home() {
  const [noteContent, setNoteContent] = useState('');
  const { userSettings } = useAppContext();

  // בשלב הבא נחבר את זה ל-Firebase
  useEffect(() => {
    // בינתיים נשתמש ב-localStorage לשמירת הפתק
    const savedNote = localStorage.getItem('mainNote');
    if (savedNote) {
      try {
        setNoteContent(savedNote);
      } catch (error) {
        console.error('שגיאה בטעינת הפתק:', error);
      }
    }
  }, []);

  // שמירת הפתק בכל שינוי
  useEffect(() => {
    localStorage.setItem('mainNote', noteContent);
  }, [noteContent]);

  const clearNote = () => {
    setNoteContent('');
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">LifeSync3</h1>
      
      <div className="card bg-yellow-50 p-6 shadow-md border-t-4 border-yellow-400">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">פתק מהיר</h2>
          {noteContent && (
            <button
              onClick={clearNote}
              className="text-gray-400 hover:text-red-500 transition-colors duration-300"
              title="נקה פתק"
            >
              <FiTrash2 size={20} />
            </button>
          )}
        </div>
        
        <textarea
          value={noteContent}
          onChange={(e) => setNoteContent(e.target.value)}
          placeholder="כתוב כאן את הפתק שלך..."
          className="w-full min-h-[200px] bg-yellow-50 border-none outline-none resize-none font-medium text-gray-700 focus:ring-0"
          style={{ fontSize: '1.1rem', lineHeight: '1.5' }}
        />
      </div>
    </div>
  );
} 