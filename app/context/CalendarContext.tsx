'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CalendarEvent, EventCategory } from '../types';
import { defaultCategories } from '../calendar/defaultCategories';

interface CalendarContextType {
  events: CalendarEvent[];
  categories: EventCategory[];
  isLoading: boolean;
  updateCategories: (categories: EventCategory[]) => void;
  updateEvents: (events: CalendarEvent[]) => void;
  addEvent: (event: CalendarEvent) => void;
  deleteEvent: (eventId: string) => void;
  updateEvent: (eventId: string, updatedEvent: Partial<CalendarEvent>) => void;
  filterEventsForDay: (date: Date) => CalendarEvent[];
}

const defaultContextValue: CalendarContextType = {
  events: [],
  categories: [],
  isLoading: true,
  updateCategories: () => {},
  updateEvents: () => {},
  addEvent: () => {},
  deleteEvent: () => {},
  updateEvent: () => {},
  filterEventsForDay: () => []
};

const CalendarContext = createContext<CalendarContextType>(defaultContextValue);

export const useCalendarContext = () => useContext(CalendarContext);

export const CalendarProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>(defaultCategories);
  const [isLoading, setIsLoading] = useState(true);

  // העלאת קטגוריות ואירועים מה־localStorage בעת טעינת הדף
  useEffect(() => {
    setIsLoading(true);
    try {
      // ניסיון לקרוא קטגוריות מה־localStorage
      const savedCategories = localStorage.getItem('eventCategories');
      
      if (savedCategories) {
        const parsedCategories: EventCategory[] = JSON.parse(savedCategories);
        setCategories(parsedCategories);
      } else {
        // אם אין קטגוריות שמורות, יצירת קטגוריות ברירת מחדל
        setCategories(defaultCategories);
        
        // שמירת קטגוריות ברירת המחדל ב־localStorage
        localStorage.setItem('eventCategories', JSON.stringify(defaultCategories));
      }
      
      // ניסיון לקרוא אירועים מה־localStorage
      const savedEvents = localStorage.getItem('calendarEvents');
      
      if (savedEvents) {
        // בדיקה אם ה-localStorage מכיל מערך ריק
        if (savedEvents === '[]') {
          setEvents([]);
          return;
        }
        
        try {
          // המרת תאריכים מחרוזות חזרה לאובייקטי Date
          const parsedEvents: any[] = JSON.parse(savedEvents);
          const eventsWithDates = parsedEvents.map(event => ({
            ...event,
            start: new Date(event.start),
            end: new Date(event.end)
          }));
          setEvents(eventsWithDates);
        } catch (error) {
          console.error('שגיאה בפענוח אירועים מה־localStorage:', error);
          setEvents([]);
        }
      } else {
        // יצירת אירועים לדוגמא רק אם אין אירועים כלל ב-localStorage
        const currentDate = new Date();
        const sampleEvents: CalendarEvent[] = [
          {
            id: '1',
            title: 'השכמה',
            start: new Date(currentDate.setHours(6, 0, 0, 0)),
            end: new Date(currentDate.setHours(6, 30, 0, 0)),
            categoryId: 'wakeup'
          },
          {
            id: '2',
            title: 'הליכון',
            start: new Date(currentDate.setHours(7, 0, 0, 0)),
            end: new Date(currentDate.setHours(8, 0, 0, 0)),
            categoryId: 'treadmill'
          },
          {
            id: '3',
            title: 'ארוחת בוקר',
            start: new Date(currentDate.setHours(8, 30, 0, 0)),
            end: new Date(currentDate.setHours(9, 0, 0, 0)),
            categoryId: 'meal'
          },
          {
            id: '4',
            title: 'עבודה',
            start: new Date(currentDate.setHours(10, 0, 0, 0)),
            end: new Date(currentDate.setHours(16, 0, 0, 0)),
            categoryId: 'work'
          }
        ];
        
        setEvents(sampleEvents);
        
        // שמירת אירועים לדוגמה ב־localStorage
        localStorage.setItem('calendarEvents', JSON.stringify(sampleEvents));
      }
    } catch (error) {
      console.error('שגיאה בטעינת נתונים מה־localStorage:', error);
      // במקרה של שגיאה, נגדיר מערכים ריקים
      setCategories([]);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // שמירת קטגוריות ב־localStorage בכל פעם שהן משתנות
  useEffect(() => {
    if (!isLoading && categories.length > 0) {
      try {
        localStorage.setItem('eventCategories', JSON.stringify(categories));
      } catch (error) {
        console.error('שגיאה בשמירת קטגוריות ב־localStorage:', error);
      }
    }
  }, [categories, isLoading]);
  
  // שמירת אירועים ב־localStorage בכל פעם שהם משתנים
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('calendarEvents', JSON.stringify(events));
      } catch (error) {
        console.error('שגיאה בשמירת אירועים ב־localStorage:', error);
      }
    }
  }, [events, isLoading]);
  
  // עדכון הקטגוריות
  const updateCategories = (updatedCategories: EventCategory[]) => {
    setCategories(updatedCategories);
  };
  
  // עדכון האירועים
  const updateEvents = (updatedEvents: CalendarEvent[]) => {
    setEvents(updatedEvents);
  };

  // הוספת אירוע חדש
  const addEvent = (event: CalendarEvent) => {
    setEvents(prevEvents => [...prevEvents, event]);
  };

  // מחיקת אירוע
  const deleteEvent = (eventId: string) => {
    setEvents(prevEvents => prevEvents.filter(event => event.id !== eventId));
  };

  // עדכון אירוע קיים
  const updateEvent = (eventId: string, updatedEvent: Partial<CalendarEvent>) => {
    setEvents(prevEvents => prevEvents.map(event => 
      event.id === eventId ? { ...event, ...updatedEvent } : event
    ));
  };
  
  // פונקציה לסינון אירועים ביום ספציפי
  const filterEventsForDay = (date: Date): CalendarEvent[] => {
    return events.filter(event => {
      const eventStartDay = new Date(event.start);
      eventStartDay.setHours(0, 0, 0, 0);
      
      const eventEndDay = new Date(event.end);
      eventEndDay.setHours(0, 0, 0, 0);
      
      const currentDay = new Date(date);
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
  };

  return (
    <CalendarContext.Provider value={{
      events,
      categories,
      isLoading,
      updateCategories,
      updateEvents,
      addEvent,
      deleteEvent,
      updateEvent,
      filterEventsForDay
    }}>
      {children}
    </CalendarContext.Provider>
  );
}; 