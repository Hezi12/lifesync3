'use client';

import { useState, useRef, useEffect } from 'react';
import { FiX, FiSend } from 'react-icons/fi';
import { EventCategory, CalendarEvent } from '../../types';

interface QuickAddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (events: Omit<CalendarEvent, 'id'>[]) => void;
  selectedDate: Date;
  categories: EventCategory[];
  defaultText?: string;
}

const QuickAddEventModal: React.FC<QuickAddEventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  categories,
  defaultText = ''
}) => {
  const [text, setText] = useState(defaultText);
  const [parsedEvents, setParsedEvents] = useState<Omit<CalendarEvent, 'id'>[]>([]);
  const [error, setError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // איפוס השדות כאשר החלון נפתח
  useEffect(() => {
    if (isOpen) {
      setText(defaultText);
      setParsedEvents([]);
      setError('');
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 100);
    }
  }, [isOpen, defaultText]);
  
  // הגדלת גובה הטקסט אריה אוטומטית
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [text]);
  
  // בדיקת תצוגה מקדימה וניתוח הטקסט
  useEffect(() => {
    if (!text.trim()) {
      setParsedEvents([]);
      setError('');
      return;
    }
    
    try {
      const events = parseEventsFromText(text, selectedDate, categories);
      setParsedEvents(events);
      setError('');
    } catch (err) {
      setParsedEvents([]);
      setError((err as Error).message);
    }
  }, [text, selectedDate, categories]);
  
  // ניתוח הטקסט ויצירת אירועים
  const parseEventsFromText = (
    inputText: string, 
    date: Date, 
    categoryList: EventCategory[]
  ): Omit<CalendarEvent, 'id'>[] => {
    // פיצול הטקסט לשורות
    const lines = inputText.trim().split('\n');
    if (lines.length === 0) return [];
    
    const parsedEvents: Omit<CalendarEvent, 'id'>[] = [];
    
    // מעבר על כל שורה וניתוח שלה
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // ניסיון לחלץ שעה מתחילת השורה - תמיכה בשני פורמטים: 08:00 או 0800
      const timeWithColonRegex = /^(\d{1,2}):(\d{2})/;
      const timeWithoutColonRegex = /^(\d{3,4})/;
      
      const timeWithColonMatch = line.match(timeWithColonRegex);
      const timeWithoutColonMatch = !timeWithColonMatch && line.match(timeWithoutColonRegex);
      
      let hours = 0;
      let minutes = 0;
      let matchLength = 0;
      
      if (timeWithColonMatch) {
        hours = parseInt(timeWithColonMatch[1]);
        minutes = parseInt(timeWithColonMatch[2]);
        matchLength = timeWithColonMatch[0].length;
      } else if (timeWithoutColonMatch) {
        const timeStr = timeWithoutColonMatch[1].padStart(4, '0');
        hours = parseInt(timeStr.substring(0, 2));
        minutes = parseInt(timeStr.substring(2, 4));
        matchLength = timeWithoutColonMatch[0].length;
      } else {
        throw new Error(`שגיאה בשורה ${i + 1}: לא נמצאה שעה בתחילת השורה. הפורמט צריך להיות "שעה:דקות תיאור האירוע" או "שעהדקות תיאור האירוע"`);
      }
      
      // בדיקת תקינות השעה
      if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error(`שגיאה בשורה ${i + 1}: שעה לא תקינה (${hours}:${minutes})`);
      }
      
      // חילוץ תיאור האירוע - כל הטקסט אחרי השעה
      const description = line.substring(matchLength).trim();
      
      if (!description) {
        throw new Error(`שגיאה בשורה ${i + 1}: חסר תיאור לאירוע`);
      }
      
      // יצירת תאריך התחלה
      const startDate = new Date(date);
      startDate.setHours(hours, minutes, 0, 0);
      
      // בדיקה אם יש אירוע הבא כדי לקבוע את שעת הסיום
      let endDate;
      
      if (i < lines.length - 1) {
        // ננסה למצוא את שעת ההתחלה של האירוע הבא
        const nextLine = lines[i + 1].trim();
        const nextTimeWithColonMatch = nextLine.match(timeWithColonRegex);
        const nextTimeWithoutColonMatch = !nextTimeWithColonMatch && nextLine.match(timeWithoutColonRegex);
        
        let nextHours = 0;
        let nextMinutes = 0;
        
        if (nextTimeWithColonMatch) {
          nextHours = parseInt(nextTimeWithColonMatch[1]);
          nextMinutes = parseInt(nextTimeWithColonMatch[2]);
        } else if (nextTimeWithoutColonMatch) {
          const timeStr = nextTimeWithoutColonMatch[1].padStart(4, '0');
          nextHours = parseInt(timeStr.substring(0, 2));
          nextMinutes = parseInt(timeStr.substring(2, 4));
        }
        
        if (nextTimeWithColonMatch || nextTimeWithoutColonMatch) {
          endDate = new Date(date);
          endDate.setHours(nextHours, nextMinutes, 0, 0);
          
          // אם שעת הסיום מוקדמת משעת ההתחלה, כנראה זה ליום הבא
          if (endDate < startDate) {
            endDate.setDate(endDate.getDate() + 1);
          }
        } else {
          // אם אין שעה תקינה באירוע הבא, שעת הסיום תהיה שעה אחת אחרי ההתחלה
          endDate = new Date(startDate);
          endDate.setHours(endDate.getHours() + 1);
        }
      } else {
        // אם זה האירוע האחרון, שעת הסיום תהיה שעה אחת אחרי ההתחלה
        endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1);
      }
      
      // קביעת קטגוריה לפי מילות מפתח
      let categoryId = '';
      const lowerDesc = description.toLowerCase();
      
      // חיפוש קטגוריה מתאימה לפי מילות מפתח
      for (const category of categoryList) {
        if (category.keywords && category.keywords.length > 0) {
          if (category.keywords.some(keyword => keyword && lowerDesc.includes(keyword.toLowerCase()))) {
            categoryId = category.id;
            break;
          }
        }
      }
      
      // אם לא נמצאה קטגוריה, נשתמש בברירת מחדל
      if (!categoryId) {
        const defaultCategory = categoryList.find(cat => cat.isDefault);
        categoryId = defaultCategory?.id || (categoryList.length > 0 ? categoryList[0].id : '');
      }
      
      // הוספת האירוע למערך
      parsedEvents.push({
        title: description,
        start: startDate,
        end: endDate,
        categoryId
      });
    }
    
    return parsedEvents;
  };
  
  // שמירת האירועים
  const handleSave = () => {
    if (!text.trim() || parsedEvents.length === 0) return;
    onSave(parsedEvents);
    onClose();
  };
  
  // פורמט של שעה לתצוגה
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };
  
  // מציאת הקטגוריה לפי מזהה
  const getCategoryById = (id: string): EventCategory | undefined => {
    return categories.find(cat => cat.id === id);
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-semibold">הוספה מהירה של אירועים</h2>
            <p className="text-sm text-gray-500">
              {selectedDate.toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <label htmlFor="quickAdd" className="block text-sm font-medium text-gray-700 mb-1">
            הזן רשימת אירועים (אירוע אחד בכל שורה, בפורמט "שעה:דקות תיאור")
          </label>
          <textarea
            ref={textareaRef}
            id="quickAdd"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="block w-full py-2 px-3 border rounded-md focus:ring-primary-500 focus:border-primary-500 min-h-[100px] resize-none overflow-hidden"
            placeholder="לדוגמה:
08:00 השכמה וקפה
09:30 פגישת עבודה
12:00 ארוחת צהריים
13:30 המשך עבודה
17:00 הליכון
19:00 ארוחת ערב"
            dir="rtl"
          />
          
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
        
        {parsedEvents.length > 0 && (
          <div className="mb-4 overflow-y-auto flex-grow">
            <h3 className="text-md font-medium mb-2">תצוגה מקדימה:</h3>
            <div className="border rounded-md overflow-hidden">
              {parsedEvents.map((event, index) => {
                const category = getCategoryById(event.categoryId);
                return (
                  <div 
                    key={index} 
                    className="p-3 flex items-center border-b last:border-b-0"
                    style={{ borderRight: `4px solid ${category?.color || '#ccc'}` }}
                  >
                    <div className="flex-shrink-0 ml-3">
                      <div 
                        className="flex items-center justify-center w-8 h-8 rounded-full"
                        style={{ backgroundColor: `${category?.color || '#ccc'}20`, color: category?.color || '#888' }}
                      >
                        {category?.icon || '📅'}
                      </div>
                    </div>
                    <div className="flex-grow mr-1">
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-gray-500">
                        {formatTime(event.start)} - {formatTime(event.end)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        <div className="flex justify-end mt-auto pt-4 border-t">
          <button
            onClick={handleSave}
            disabled={parsedEvents.length === 0 || !!error}
            className={`px-4 py-2 rounded-md flex items-center ${
              parsedEvents.length === 0 || !!error
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            }`}
          >
            <FiSend className="ml-1" />
            הוסף {parsedEvents.length} אירועים
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAddEventModal; 