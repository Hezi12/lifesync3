'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FiChevronRight, FiChevronLeft, FiPlus, FiEdit2, FiTrash2, FiList, FiEdit, FiBook, FiClock, FiImage } from 'react-icons/fi';
import DailyTimeline from './DailyTimeline';
import DailyTasks from './DailyTasks';
import AddEventModal from '../modals/AddEventModal';
import QuickAddEventModal from '../modals/QuickAddEventModal';
import { CalendarEvent, EventCategory, JournalEntry, DailyLog } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { format, addHours, startOfDay, endOfDay, isWithinInterval, addDays, subDays } from 'date-fns';
import { useRouter } from 'next/navigation';
import { he } from 'date-fns/locale';

interface DailyViewProps {
  date: Date;
  onDateChange: (date: Date) => void;
  events: CalendarEvent[];
  onEventsUpdate: (events: CalendarEvent[]) => void;
  categories: EventCategory[];
}

// יצירת קטגוריות ברירת מחדל (בפועל יגיעו מהשרת)
const defaultCategories: EventCategory[] = [
  {
    id: 'wakeup',
    name: 'השכמה',
    icon: '🌞',
    color: '#eab308',
    isDefault: true
  },
  {
    id: 'treadmill',
    name: 'הליכון',
    icon: '🏃',
    color: '#22c55e',
    isDefault: true
  },
  {
    id: 'work',
    name: 'עבודה',
    icon: '💼',
    color: '#0ea5e9',
    isDefault: true
  },
  {
    id: 'meal',
    name: 'ארוחה',
    icon: '🍔',
    color: '#f97316',
    isDefault: true
  },
  {
    id: 'sleep',
    name: 'שינה',
    icon: '🛌',
    color: '#8b5cf6',
    isDefault: true
  },
  {
    id: 'general',
    name: 'כללי',
    icon: '📅',
    color: '#64748b',
    isDefault: true
  }
];

const DailyView: React.FC<DailyViewProps> = ({ date, onDateChange, events, onEventsUpdate, categories }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(date);
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [isQuickAddModalOpen, setIsQuickAddModalOpen] = useState(false);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const [eventToEdit, setEventToEdit] = useState<CalendarEvent | null>(null);
  
  // תיעוד יומי ויומן אישי
  const [isJournalModalOpen, setIsJournalModalOpen] = useState(false);
  const [isDailyLogModalOpen, setIsDailyLogModalOpen] = useState(false);
  const [journalContent, setJournalContent] = useState('');
  const [logContent, setLogContent] = useState('');
  
  // פילטור אירועים ליום הנבחר
  const filteredEvents = events.filter(event => {
    const eventStartDay = new Date(event.start);
    eventStartDay.setHours(0, 0, 0, 0);
    
    const eventEndDay = new Date(event.end);
    eventEndDay.setHours(0, 0, 0, 0);
    
    const currentDay = new Date(selectedDate);
    currentDay.setHours(0, 0, 0, 0);
    
    // האירוע מתחיל ביום הנוכחי
    if (eventStartDay.getTime() === currentDay.getTime()) {
      return true;
    }
    
    // האירוע מסתיים ביום הנוכחי
    if (eventEndDay.getTime() === currentDay.getTime()) {
      return true;
    }
    
    // האירוע מתפרס על פני מספר ימים וכולל את היום הנוכחי
    if (eventStartDay < currentDay && eventEndDay > currentDay) {
      return true;
    }
    
    return false;
  });
  
  // מיון האירועים לפי שעת התחלה
  const sortedEvents = [...filteredEvents].sort((a, b) => a.start.getTime() - b.start.getTime());
  
  // ניווט בין ימים
  const goToNextDay = () => {
    setSelectedDate(currentDate => addDays(currentDate, 1));
  };
  
  const goToPreviousDay = () => {
    setSelectedDate(currentDate => subDays(currentDate, 1));
  };
  
  const goToToday = () => {
    setSelectedDate(new Date());
  };
  
  // הוספת אירוע
  const handleAddEvent = (newEvent: Omit<CalendarEvent, 'id'>) => {
    const eventWithId: CalendarEvent = {
      ...newEvent,
      id: Date.now().toString()
    };
    
    onEventsUpdate([...events, eventWithId]);
  };
  
  // הוספת מספר אירועים בבת אחת (להוספה מהירה)
  const handleAddEvents = (newEvents: Omit<CalendarEvent, 'id'>[]) => {
    const eventsWithIds: CalendarEvent[] = newEvents.map(event => ({
      ...event,
      id: Date.now() + Math.random().toString(36).substring(2, 9)
    }));
    
    onEventsUpdate([...events, ...eventsWithIds]);
  };
  
  // עריכת אירוע
  const handleEditEvent = (eventId: string, updatedEvent: Partial<CalendarEvent>) => {
    const updatedEvents = events.map(event => {
      if (event.id === eventId) {
        return { ...event, ...updatedEvent };
      }
      return event;
    });
    
    onEventsUpdate(updatedEvents);
  };
  
  // מחיקת אירוע
  const handleDeleteEvent = (eventId: string) => {
    const updatedEvents = events.filter(event => event.id !== eventId);
    onEventsUpdate(updatedEvents);
  };
  
  // מציאת קטגוריה לפי מזהה
  const getCategoryById = useCallback(
    (categoryId: string): EventCategory | undefined => {
      return categories.find(cat => cat.id === categoryId);
    },
    [categories]
  );
  
  // פורמט של שעה לתצוגה
  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString('he-IL', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };
  
  // פתיחת מודל עריכה
  const openEditModal = (event: CalendarEvent) => {
    setEventToEdit(event);
    setIsAddEventModalOpen(true);
  };
  
  // טעינת תיעוד יומי ויומן אישי
  useEffect(() => {
    const dayKey = selectedDate.toISOString().split('T')[0];
    
    // טעינת יומן אישי
    const savedJournal = localStorage.getItem(`journal_${dayKey}`);
    if (savedJournal) {
      try {
        const parsedJournal = JSON.parse(savedJournal);
        setJournalContent(parsedJournal.content || '');
      } catch (error) {
        console.error('שגיאה בטעינת יומן אישי:', error);
        setJournalContent('');
      }
    } else {
      setJournalContent('');
    }
    
    // טעינת תיעוד יומי
    const savedLog = localStorage.getItem(`dailyLog_${dayKey}`);
    if (savedLog) {
      try {
        const parsedLog = JSON.parse(savedLog);
        setLogContent(parsedLog.content || '');
      } catch (error) {
        console.error('שגיאה בטעינת תיעוד יומי:', error);
        setLogContent('');
      }
    } else {
      setLogContent('');
    }
  }, [selectedDate]);
  
  // פתיחת יומן אישי
  const openJournalModal = () => {
    setIsJournalModalOpen(true);
  };
  
  // פתיחת תיעוד יומי
  const openDailyLogModal = () => {
    setIsDailyLogModalOpen(true);
  };
  
  // שמירת יומן אישי
  const saveJournal = () => {
    const dayKey = selectedDate.toISOString().split('T')[0];
    const journalEntry: JournalEntry = {
      id: `journal-${dayKey}`,
      date: new Date(selectedDate),
      content: journalContent
    };
    
    localStorage.setItem(`journal_${dayKey}`, JSON.stringify(journalEntry));
    setIsJournalModalOpen(false);
  };
  
  // שמירת תיעוד יומי
  const saveLog = () => {
    const dayKey = selectedDate.toISOString().split('T')[0];
    const logEntry: DailyLog = {
      id: `log-${dayKey}`,
      date: new Date(selectedDate),
      content: logContent
    };
    
    localStorage.setItem(`dailyLog_${dayKey}`, JSON.stringify(logEntry));
    setIsDailyLogModalOpen(false);
  };
  
  // פונקציה שבודקת אם יש יומן או תיעוד ליום הנבחר
  const hasJournal = (): boolean => {
    const dayKey = selectedDate.toISOString().split('T')[0];
    return !!localStorage.getItem(`journal_${dayKey}`);
  };
  
  const hasLog = (): boolean => {
    const dayKey = selectedDate.toISOString().split('T')[0];
    return !!localStorage.getItem(`dailyLog_${dayKey}`);
  };
  
  return (
    <div className="p-4">
      {/* כותרת וניווט */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToPreviousDay}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <FiChevronRight />
        </button>
        <div className="text-center">
          <h2 className="text-xl font-semibold">
            {format(selectedDate, 'EEEE', { locale: he })}
          </h2>
          <p className="text-gray-500">
            {format(selectedDate, 'd בMMMM yyyy', { locale: he })}
          </p>
        </div>
        <button
          onClick={goToNextDay}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <FiChevronLeft />
        </button>
      </div>
      
      {/* כפתורי פעולה */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goToToday}
          className="text-sm py-1 px-3 bg-gray-100 hover:bg-gray-200 rounded-md"
        >
          היום
        </button>
        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={() => setIsQuickAddModalOpen(true)}
            className="py-1 px-3 bg-green-50 text-green-600 rounded-md hover:bg-green-100 flex items-center"
          >
            <FiList className="ml-1" />
            הוספה מהירה
          </button>
          <button
            onClick={() => setIsAddEventModalOpen(true)}
            className="py-1 px-3 bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100 flex items-center"
          >
            <FiPlus className="ml-1" />
            אירוע חדש
          </button>
        </div>
      </div>
      
      {/* משימות מרכזיות ליום ואייקוני תיעוד */}
      <div className="mb-4 flex gap-4 items-start">
        <div className="flex-1">
          <DailyTasks date={selectedDate} />
        </div>
        
        {/* אייקוני תיעוד יומי ויומן אישי */}
        <div className="flex flex-col gap-4 mt-5 ml-2">
          <button
            onClick={openDailyLogModal}
            className={`p-3 rounded-full flex items-center justify-center ${
              hasLog() ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
            } hover:bg-primary-200 transition-colors`}
            title="תיעוד יומי"
          >
            <FiEdit size={20} />
          </button>
          
          <button
            onClick={openJournalModal}
            className={`p-3 rounded-full flex items-center justify-center ${
              hasJournal() ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
            } hover:bg-purple-200 transition-colors`}
            title="יומן אישי"
          >
            <FiBook size={20} />
          </button>
        </div>
      </div>
      
      {/* רשימת אירועים */}
      <div className="space-y-2">
        {sortedEvents.length > 0 ? (
          sortedEvents.map(event => {
            const category = getCategoryById(event.categoryId || '');
            return (
              <div
                key={event.id}
                className="p-3 rounded-lg border shadow-sm relative"
                style={{ 
                  borderRight: `4px solid ${category?.color || '#ccc'}`,
                  backgroundColor: `${category?.color || '#ccc'}10`
                }}
                onMouseEnter={() => setHoveredEvent(event.id)}
                onMouseLeave={() => setHoveredEvent(null)}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0 ml-3">
                    <div 
                      className="flex items-center justify-center w-10 h-10 rounded-full"
                      style={{ backgroundColor: `${category?.color || '#ccc'}20`, color: category?.color || '#888' }}
                    >
                      {category?.icon || '📅'}
                    </div>
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-medium">{event.title}</h3>
                    <p className="text-sm text-gray-500">
                      {formatTime(event.start)} - {formatTime(event.end)}
                      {!isSameDay(event.start, event.end) && ' (חוצה יום)'}
                    </p>
                    
                    {/* הצגת פרטי משקל ופרטי הליכון */}
                    <div className="flex flex-wrap mt-1">
                      {event.isWakeUp && event.weight && (
                        <div className="flex items-center bg-yellow-50 rounded px-2 py-0.5 ml-2 mt-1 text-sm border border-yellow-200">
                          <span className="font-medium">{event.weight} ק"ג</span>
                        </div>
                      )}
                      
                      {event.isTreadmill && (
                        <div className="flex items-center bg-green-50 rounded px-2 py-0.5 ml-2 mt-1 text-sm border border-green-200">
                          <FiClock className="text-gray-500 ml-1" size={14} />
                          <span>
                            {event.duration} דק', {event.distance} ק"מ
                          </span>
                        </div>
                      )}
                      
                      {event.imageUrl && (
                        <div className="flex items-center bg-primary-50 rounded px-2 py-0.5 ml-2 mt-1 text-sm border border-primary-200">
                          <FiImage className="text-gray-500 ml-1" size={14} />
                          <span>תמונה</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* כפתורי עריכה ומחיקה */}
                {hoveredEvent === event.id && (
                  <div className="absolute top-2 left-2 flex space-x-1">
                    <button
                      onClick={() => openEditModal(event)}
                      className="p-1.5 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 ml-1"
                    >
                      <FiEdit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteEvent(event.id)}
                      className="p-1.5 bg-red-100 text-red-600 rounded-full hover:bg-red-200"
                    >
                      <FiTrash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>אין אירועים ליום זה</p>
            <p className="text-sm mt-1">לחץ על &quot;אירוע חדש&quot; כדי להוסיף אירוע</p>
          </div>
        )}
      </div>
      
      {/* מודל יומן אישי */}
      {isJournalModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                יומן אישי - {format(selectedDate, 'd בMMMM yyyy', { locale: he })}
              </h3>
              <button 
                onClick={() => setIsJournalModalOpen(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              <textarea
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                className="w-full h-64 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="כתוב את המחשבות והחוויות שלך מהיום..."
              />
            </div>
            
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setIsJournalModalOpen(false)}
                className="px-4 py-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                ביטול
              </button>
              <button
                onClick={saveJournal}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600"
              >
                שמירה
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* מודל תיעוד יומי */}
      {isDailyLogModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl">
            <div className="p-4 border-b flex justify-between items-center">
              <h3 className="text-xl font-semibold">
                תיעוד יומי - {format(selectedDate, 'd בMMMM yyyy', { locale: he })}
              </h3>
              <button 
                onClick={() => setIsDailyLogModalOpen(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="p-4">
              <textarea
                value={logContent}
                onChange={(e) => setLogContent(e.target.value)}
                className="w-full h-64 border rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="תעד את מה שעשית היום, דברים חשובים שקרו..."
              />
            </div>
            
            <div className="p-4 border-t flex justify-end">
              <button
                onClick={() => setIsDailyLogModalOpen(false)}
                className="px-4 py-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-md"
              >
                ביטול
              </button>
              <button
                onClick={saveLog}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              >
                שמירה
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* מודל להוספת אירוע */}
      <AddEventModal
        isOpen={isAddEventModalOpen}
        onClose={() => {
          setIsAddEventModalOpen(false);
          setEventToEdit(null);
        }}
        onSave={eventToEdit ? 
          (updatedEvent) => {
            handleEditEvent(eventToEdit.id, updatedEvent);
            setEventToEdit(null);
          } : 
          handleAddEvent
        }
        selectedDate={selectedDate}
        categories={categories}
        editEvent={eventToEdit}
      />
      
      {/* מודל להוספה מהירה */}
      <QuickAddEventModal
        isOpen={isQuickAddModalOpen}
        onClose={() => setIsQuickAddModalOpen(false)}
        onSave={handleAddEvents}
        selectedDate={selectedDate}
        categories={categories}
      />
    </div>
  );
};

// פונקציית עזר לבדיקה אם שני תאריכים הם באותו יום
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default DailyView; 