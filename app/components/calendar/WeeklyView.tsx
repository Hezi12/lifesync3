'use client';

import { useState, useEffect } from 'react';
import { FiChevronRight, FiChevronLeft, FiPlus } from 'react-icons/fi';
import { CalendarEvent, EventCategory } from '../../types';

interface WeeklyViewProps {
  date: Date;
  onDateChange: (date: Date) => void;
  events: CalendarEvent[];
  onEventsUpdate: (updatedEvents: CalendarEvent[]) => void;
  categories?: EventCategory[];
}

const WeeklyView: React.FC<WeeklyViewProps> = ({ date, onDateChange, events, onEventsUpdate, categories = [] }) => {
  // חישוב תאריך היום הראשון בשבוע (יום ראשון)
  const getStartOfWeek = (date: Date) => {
    const newDate = new Date(date);
    const day = newDate.getDay(); // 0 = יום ראשון, 6 = שבת
    const diff = newDate.getDate() - day;
    return new Date(newDate.setDate(diff));
  };
  
  const startOfWeek = getStartOfWeek(date);
  
  // יצירת מערך של 7 ימים בשבוע
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const day = new Date(startOfWeek);
    day.setDate(startOfWeek.getDate() + i);
    return day;
  });
  
  // השמות העבריים של ימות השבוע
  const hebrewDayNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  
  // השעות ביום
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  const goToPreviousWeek = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() - 7);
    onDateChange(newDate);
  };
  
  const goToNextWeek = () => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + 7);
    onDateChange(newDate);
  };
  
  const goToToday = () => {
    onDateChange(new Date());
  };
  
  const formatWeekRange = () => {
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    const startMonth = startOfWeek.getMonth() + 1;
    const endMonth = endOfWeek.getMonth() + 1;
    
    // אם השבוע באותו חודש
    if (startMonth === endMonth) {
      return `${startOfWeek.getDate()}-${endOfWeek.getDate()} ${getHebrewMonth(startMonth)}`;
    }
    
    return `${startOfWeek.getDate()} ${getHebrewMonth(startMonth)} - ${endOfWeek.getDate()} ${getHebrewMonth(endMonth)}`;
  };
  
  const getHebrewMonth = (month: number): string => {
    const months = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    return months[month - 1];
  };
  
  const isToday = (day: Date) => {
    const today = new Date();
    return day.getDate() === today.getDate() &&
           day.getMonth() === today.getMonth() &&
           day.getFullYear() === today.getFullYear();
  };
  
  const getEventsByDay = (day: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    return events.filter(event => {
      // האירוע מתחיל ביום הזה
      if (event.start >= dayStart && event.start <= dayEnd) {
        return true;
      }
      
      // האירוע מסתיים ביום הזה
      if (event.end >= dayStart && event.end <= dayEnd) {
        return true;
      }
      
      // האירוע מתפרס על פני היום הזה (מתחיל לפני ומסתיים אחרי)
      if (event.start < dayStart && event.end > dayEnd) {
        return true;
      }
      
      return false;
    });
  };
  
  // מיקום האירוע על פי שעת ההתחלה והסיום
  const getEventStyle = (event: CalendarEvent, day: Date) => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    
    let startTime = event.start;
    if (startTime < dayStart) {
      startTime = dayStart;
    }
    
    const startHour = startTime.getHours();
    const startMinutes = startTime.getMinutes();
    
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);
    
    let endTime = event.end;
    if (endTime > dayEnd) {
      endTime = dayEnd;
    }
    
    const endHour = endTime.getHours();
    const endMinutes = endTime.getMinutes();
    
    const start = (startHour * 60 + startMinutes) / 15; // כל 15 דקות = יחידה 1
    const end = (endHour * 60 + endMinutes) / 15;
    const height = end - start;
    
    return {
      top: `${start * 8}px`, // גובה כל יחידה = 8px
      height: `${height * 8}px`,
    };
  };
  
  // מציאת קטגוריה של אירוע לפי ה-id
  const getEventCategory = (event: CalendarEvent): EventCategory | undefined => {
    return categories.find(cat => cat.id === event.categoryId);
  };
  
  return (
    <div className="mt-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={goToPreviousWeek}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <FiChevronRight className="h-5 w-5 text-gray-600" />
          </button>
          
          <h2 className="text-xl font-semibold mx-4">{formatWeekRange()}</h2>
          
          <button
            onClick={goToNextWeek}
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
      
      {/* תצוגת לוח שנה שבועי */}
      <div className="card overflow-x-auto">
        <div className="min-w-[900px]">
          {/* כותרות ימים */}
          <div className="flex border-b">
            <div className="w-16 flex-shrink-0"></div> {/* תא ריק לשעות */}
            
            {weekDays.map((day, index) => (
              <div 
                key={index} 
                className={`flex-1 p-2 text-center font-medium ${
                  isToday(day) ? 'bg-primary-50 text-primary-700' : ''
                }`}
              >
                <div>{hebrewDayNames[index]}</div>
                <div className={`text-sm ${isToday(day) ? 'text-primary-700' : 'text-gray-500'}`}>
                  {day.getDate()}/{day.getMonth() + 1}
                </div>
              </div>
            ))}
          </div>
          
          {/* לוח שעות */}
          <div className="relative" style={{ height: '800px' }}>
            {/* שעות בצד */}
            <div className="absolute right-0 top-0 w-16 h-full bg-gray-50 border-l border-gray-200 z-10">
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute right-0 flex items-center justify-center w-16 h-8 text-xs text-gray-500"
                  style={{ top: `${hour * 4 * 8}px` }} // 4 יחידות של 15 דקות, כל יחידה 8px
                >
                  {hour}:00
                </div>
              ))}
            </div>
            
            {/* קווי השעות */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-0 left-0 border-t border-gray-100"
                style={{ top: `${hour * 4 * 8}px` }}
              />
            ))}
            
            {/* עמודות הימים */}
            <div className="flex absolute right-16 left-0 top-0 bottom-0">
              {weekDays.map((day, dayIndex) => {
                const dayEvents = getEventsByDay(day);
                
                return (
                  <div 
                    key={dayIndex} 
                    className={`flex-1 relative border-l ${
                      isToday(day) ? 'bg-primary-50/20' : ''
                    }`}
                  >
                    {/* האירועים של היום */}
                    {dayEvents.map((event) => (
                      <div
                        key={event.id}
                        className={`absolute w-full px-1 text-xs border rounded overflow-hidden`}
                        style={{
                          ...getEventStyle(event, day),
                          borderRightColor: getEventCategory(event)?.color || '#ccc',
                          backgroundColor: `${getEventCategory(event)?.color || '#ccc'}10`
                        }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
            
            {/* קו השעה הנוכחית */}
            <div 
              className="absolute right-0 left-0 h-[2px] bg-red-500 z-20"
              style={{ 
                top: `${(new Date().getHours() * 60 + new Date().getMinutes()) / 15 * 8}px` 
              }}
            >
              <div className="absolute right-16 w-3 h-3 bg-red-500 rounded-full transform -translate-y-1/2 -translate-x-1/2" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeeklyView; 