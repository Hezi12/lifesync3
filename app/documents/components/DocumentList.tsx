import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { Document } from '../types';
import { formatDate } from '../utils/dateFormatter';

interface DocumentListProps {
  documents: Document[];
  selectedDocId: string | null;
  onSelectDocument: (id: string) => void;
  onDeleteDocument: (id: string) => void;
  onCreateDocument: () => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  selectedDocId,
  onSelectDocument,
  onDeleteDocument,
  onCreateDocument
}) => {
  return (
    <div className="w-64 bg-gray-50 p-4 rounded-lg shadow-sm">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">המסמכים שלי</h2>
        <button
          onClick={onCreateDocument}
          className="p-2 rounded-full bg-primary-100 text-primary-600 hover:bg-primary-200"
          title="צור מסמך חדש"
        >
          <FiPlus />
        </button>
      </div>
      
      <div className="space-y-2">
        {documents.length > 0 ? (
          documents.map(doc => (
            <div 
              key={doc.id}
              className={`p-2 rounded cursor-pointer hover:bg-gray-100 flex justify-between ${
                selectedDocId === doc.id ? 'bg-primary-50 border-r-4 border-primary-500' : ''
              }`}
              onClick={() => onSelectDocument(doc.id)}
            >
              <div className="overflow-hidden">
                <div className="font-medium truncate">{doc.title}</div>
                <div className="text-xs text-gray-500 truncate">
                  {formatDate(doc.updatedAt)}
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteDocument(doc.id);
                }}
                className="text-gray-400 hover:text-red-500 p-1"
                title="מחק מסמך"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">אין מסמכים, צור את המסמך הראשון שלך!</p>
        )}
      </div>
    </div>
  );
};

export default DocumentList; 