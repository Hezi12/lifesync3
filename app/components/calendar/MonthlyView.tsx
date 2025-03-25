'use client';

import { useState, useEffect } from 'react';
import { FiChevronRight, FiChevronLeft } from 'react-icons/fi';
import { CalendarEvent } from '../../types';

interface MonthlyViewProps {
  date: Date;
  onDateChange: (date: Date) => void;
}

const MonthlyView: React.FC<MonthlyViewProps> = ({ date, onDateChange }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  // קביעת היום הראשון בחודש
  const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  // קביעת היום האחרון בחודש
  const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  
  // היום הראשון בתצוגה (יכול להיות בחודש הקודם)
  const firstDayOfCalendar = new Date(firstDayOfMonth);
  firstDayOfCalendar.setDate(firstDayOfCalendar.getDate() - firstDayOfCalendar.getDay());
  
  // היום האחרון בתצוגה (יכול להיות בחודש הבא)
  const lastDayOfCalendar = new Date(lastDayOfMonth);
  const remainingDays = 6 - lastDayOfMonth.getDay();
  lastDayOfCalendar.setDate(lastDayOfCalendar.getDate() + remainingDays);
  
  // השמות העבריים של ימות השבוע
  const hebrewDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  
  // יצירת מערך של שבועות וימים לתצוגה
  const calendarDays: Date[][] = [];
  let currentWeek: Date[] = [];
  
  let currentDate = new Date(firstDayOfCalendar);
  while (currentDate <= lastDayOfCalendar) {
    if (currentDate.getDay() === 0 && currentWeek.length > 0) {
      calendarDays.push(currentWeek);
      currentWeek = [];
    }
    
    currentWeek.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  if (currentWeek.length > 0) {
    calendarDays.push(currentWeek);
  }
  
  // בהמשך נחליף את הלוגיקה הזו בקריאה ל-Firebase
  useEffect(() => {
    // נשתמש בנתונים אמיתיים מה-localStorage במקום ליצור דוגמאות
    try {
      // קריאת אירועים מה-localStorage
      const savedEvents = localStorage.getItem('calendarEvents');
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents);
        // המרת תאריכים מחרוזות חזרה לאובייקטי Date
        const eventsWithDates = parsedEvents.map((event: any) => ({
          ...event,
          start: new Date(event.start),
          end: new Date(event.end)
        }));
        setEvents(eventsWithDates);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error('שגיאה בטעינת נתונים מה־localStorage:', error);
      setEvents([]);
    }
  }, [date.getMonth(), date.getFullYear()]);
  
  const goToPreviousMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() - 1);
    onDateChange(newDate);
  };
  
  const goToNextMonth = () => {
    const newDate = new Date(date);
    newDate.setMonth(date.getMonth() + 1);
    onDateChange(newDate);
  };
  
  const goToToday = () => {
    onDateChange(new Date());
  };
  
  const formatMonthYear = (): string => {
    const hebrewMonths = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    return `${hebrewMonths[date.getMonth()]} ${date.getFullYear()}`;
  };
  
  const isToday = (day: Date): boolean => {
    const today = new Date();
    return day.getDate() === today.getDate() &&
           day.getMonth() === today.getMonth() &&
           day.getFullYear() === today.getFullYear();
  };
  
  const isCurrentMonth = (day: Date): boolean => {
    return day.getMonth() === date.getMonth();
  };
  
  // קבלת אירועים עם תמונות ליום מסוים
  const getDayImagesEvents = (day: Date): CalendarEvent[] => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    return events.filter(event => 
      event.imageUrl && 
      ((event.start >= dayStart && event.start <= dayEnd) ||
       (event.end >= dayStart && event.end <= dayEnd) ||
       (event.start <= dayStart && event.end >= dayEnd))
    );
  };
  
  // פונקציה ללחיצה על יום להצגת התצוגה היומית
  const handleDayClick = (day: Date) => {
    // התאריך הנבחר נשלח דרך onDateChange
    onDateChange(day);
    // שינוי לתצוגה יומית יבוצע בקומפוננטה האב
  };
  
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiChevronRight className="h-5 w-5 text-gray-600" />
          </button>
          
          <h2 className="text-xl font-semibold mx-4">{formatMonthYear()}</h2>
          
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <button
            onClick={goToToday}
            className="ml-4 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            היום
          </button>
        </div>
      </div>
      
      {/* לוח שנה חודשי */}
      <div className="card">
        {/* ימי השבוע */}
        <div className="grid grid-cols-7 text-center font-medium mb-2">
          {hebrewDayNames.map((name, index) => (
            <div key={index} className="py-2">
              {name}
            </div>
          ))}
        </div>
        
        {/* ימים בחודש */}
        <div className="border-t">
          {calendarDays.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 border-b">
              {week.map((day, dayIndex) => {
                const dayImagesEvents = getDayImagesEvents(day);
                const hasImages = dayImagesEvents.length > 0;
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`min-h-[120px] border-l relative overflow-hidden ${
                      isCurrentMonth(day)
                        ? isToday(day)
                          ? 'bg-primary-50'
                          : 'bg-white'
                        : 'bg-gray-50 text-gray-400'
                    } hover:bg-gray-50 cursor-pointer`}
                    onClick={() => handleDayClick(day)}
                  >
                    {/* ההחלטה אם להציג את המספר כעיגול מעל התמונה או כרגיל בתוך התא */}
                    {hasImages ? (
                      <div className="absolute top-1 right-2 z-10 font-medium bg-white bg-opacity-70 rounded-full w-6 h-6 flex items-center justify-center shadow-sm">
                        {day.getDate()}
                      </div>
                    ) : (
                      <div className="p-2">
                        <div className="font-medium">
                          {day.getDate()}
                        </div>
                      </div>
                    )}
                    
                    {/* תמונה ראשית - אם יש תמונות */}
                    {hasImages && dayImagesEvents[0].imageUrl && (
                      <div className="absolute inset-0 w-full h-full">
                        <img 
                          src={dayImagesEvents[0].imageUrl} 
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        {/* שכבת צבע כהה מעל התמונה */}
                        <div className="absolute inset-0 bg-black bg-opacity-10 hover:bg-opacity-20 transition-opacity"></div>
                      </div>
                    )}
                    
                    {/* תמונות נוספות בפינה השמאלית התחתונה */}
                    {dayImagesEvents.length > 1 && (
                      <div className="absolute bottom-1 left-1 flex gap-1">
                        {dayImagesEvents.slice(1, 4).map((event, imgIndex) => (
                          <div
                            key={imgIndex}
                            className="w-8 h-8 rounded-md overflow-hidden border border-white shadow-sm"
                          >
                            {event.imageUrl && (
                              <img 
                                src={event.imageUrl} 
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                        ))}
                        
                        {/* אינדיקציה לאירועים נוספים */}
                        {dayImagesEvents.length > 4 && (
                          <div className="w-8 h-8 rounded-md bg-primary-100 border border-white text-xs flex items-center justify-center text-primary-700 shadow-sm">
                            +{dayImagesEvents.length - 4}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MonthlyView; 