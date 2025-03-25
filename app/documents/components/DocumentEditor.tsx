import { FiEdit3, FiSave, FiPlus } from 'react-icons/fi';
import { Document } from '../types';
import { renderRichContent } from '../utils/richTextRenderer';
import { formatDate } from '../utils/dateFormatter';

interface DocumentEditorProps {
  selectedDocument: Document | null;
  isCreating: boolean;
  isEditing: boolean;
  title: string;
  content: string;
  onTitleChange: (title: string) => void;
  onContentChange: (content: string) => void;
  onSave: () => void;
  onEdit: () => void;
  onCreateNew: () => void;
}

const DocumentEditor: React.FC<DocumentEditorProps> = ({
  selectedDocument,
  isCreating,
  isEditing,
  title,
  content,
  onTitleChange,
  onContentChange,
  onSave,
  onEdit,
  onCreateNew
}) => {
  if (selectedDocument || isCreating) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-4">
          {isEditing ? (
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="כותרת המסמך..."
              className="text-2xl font-bold w-full border-none focus:ring-0 focus:outline-none py-2"
            />
          ) : (
            <h1 className="text-2xl font-bold">{selectedDocument?.title}</h1>
          )}
          
          <div className="flex space-x-2 space-x-reverse">
            {isEditing ? (
              <button
                onClick={onSave}
                className="p-2 bg-primary-100 text-primary-600 rounded hover:bg-primary-200 flex items-center"
                disabled={!title.trim()}
              >
                <FiSave className="ml-1" />
                שמור
              </button>
            ) : (
              <button
                onClick={onEdit}
                className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 flex items-center"
              >
                <FiEdit3 className="ml-1" />
                ערוך
              </button>
            )}
          </div>
        </div>
        
        <div className="flex-grow">
          {isEditing ? (
            <textarea
              value={content}
              onChange={(e) => onContentChange(e.target.value)}
              placeholder={`כתוב את תוכן המסמך שלך כאן...

# כותרת ראשית
## כותרת משנית
### כותרת קטנה

**טקסט מודגש** ו*טקסט נטוי*

- פריט ברשימה
- עוד פריט ברשימה
              `}
              className="w-full h-full p-4 border rounded-md resize-none focus:ring-primary-200 focus:border-primary-400"
            />
          ) : (
            <div className="p-4 border rounded-md bg-white h-full overflow-y-auto">
              <div 
                className="prose max-w-none prose-headings:font-bold prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg"
                dangerouslySetInnerHTML={renderRichContent(selectedDocument?.content || '')} 
              />
            </div>
          )}
        </div>
        
        {!isEditing && selectedDocument && (
          <div className="mt-2 text-sm text-gray-500">
            נערך לאחרונה: {formatDate(selectedDocument.updatedAt)}
          </div>
        )}
      </div>
    );
  }
  
  // אין מסמך נבחר
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md">
        <h2 className="text-xl font-semibold mb-2">אין מסמך נבחר</h2>
        <p className="text-gray-600 mb-4">בחר מסמך מהרשימה או צור מסמך חדש כדי להתחיל</p>
        <button
          onClick={onCreateNew}
          className="btn-primary flex items-center mx-auto"
        >
          <FiPlus className="ml-1" />
          צור מסמך חדש
        </button>
      </div>
    </div>
  );
};

export default DocumentEditor; 