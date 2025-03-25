'use client';

import { useState, useRef, useEffect } from 'react';
import { CalendarEvent } from '../../types';
import { 
  FiImage, 
  FiClock, 
  FiSun, 
  FiMoon, 
  FiCoffee, 
  FiActivity, 
  FiMonitor, 
  FiEdit3,
  FiCalendar
} from 'react-icons/fi';

interface DailyTimelineProps {
  events: CalendarEvent[];
  date: Date;
  onEventUpdate: (event: CalendarEvent) => void;
}

const DailyTimeline: React.FC<DailyTimelineProps> = ({ events, date, onEventUpdate }) => {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  
  // גלילה אוטומטית לשעה הנוכחית בטעינה
  useEffect(() => {
    if (timelineRef.current) {
      const now = new Date();
      const currentHour = now.getHours();
      const scrollPosition = currentHour * 72; // 72px לכל שעה
      timelineRef.current.scrollTop = scrollPosition - 200; // גלילה כך שהשעה הנוכחית תהיה קצת מעל המרכז
    }
  }, []);
  
  // מיקום האירוע על פי שעת ההתחלה והסיום
  const getEventStyle = (event: CalendarEvent) => {
    const startHour = event.start.getHours();
    const startMinutes = event.start.getMinutes();
    const endHour = event.end.getHours();
    const endMinutes = event.end.getMinutes();
    
    const start = startHour * 72 + (startMinutes / 60) * 72;
    const end = endHour * 72 + (endMinutes / 60) * 72;
    
    // טיפול באירועים שמתפרסים על יותר מיום אחד (למשל שינה)
    let height = end - start;
    if (end < start) {
      height = (24 * 72) - start + end;
    }
    
    // גובה מינימלי לאירועים קצרים
    height = Math.max(height, 30);
    
    return {
      top: `${start}px`,
      height: `${height}px`,
    };
  };
  
  // צבע רקע והתאמות בהתאם לסוג האירוע
  const getEventClasses = (event: CalendarEvent) => {
    if (event.isWakeUp) return 'bg-gradient-to-r from-yellow-100 to-yellow-50 border-l-4 border-yellow-400';
    if (event.isTreadmill) return 'bg-gradient-to-r from-green-100 to-green-50 border-l-4 border-green-400';
    if (event.title.toLowerCase().includes('ארוחת')) return 'bg-gradient-to-r from-orange-100 to-orange-50 border-l-4 border-orange-400';
    if (event.title.toLowerCase().includes('עבודה')) return 'bg-gradient-to-r from-blue-100 to-blue-50 border-l-4 border-blue-400';
    if (event.title.toLowerCase().includes('שינה')) return 'bg-gradient-to-r from-purple-100 to-purple-50 border-l-4 border-purple-400';
    return 'bg-gradient-to-r from-primary-100 to-primary-50 border-l-4 border-primary-400';
  };
  
  // אייקון בהתאם לסוג האירוע
  const getEventIcon = (event: CalendarEvent) => {
    if (event.isWakeUp) return <FiSun className="text-yellow-500" />;
    if (event.isTreadmill) return <FiActivity className="text-green-500" />;
    if (event.title.toLowerCase().includes('ארוחת בוקר')) return <FiCoffee className="text-orange-500" />;
    if (event.title.toLowerCase().includes('ארוחת')) return <FiCoffee className="text-orange-500" />;
    if (event.title.toLowerCase().includes('עבודה')) return <FiMonitor className="text-blue-500" />;
    if (event.title.toLowerCase().includes('שינה')) return <FiMoon className="text-purple-500" />;
    return <FiCalendar className="text-primary-500" />;
  };
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
  };
  
  // פורמט שעה בצורה נוחה לקריאה
  const formatTime = (date: Date): string => {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };
  
  // יצירת שעות היום (24 שעות)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  
  return (
    <div className="card p-0 bg-white shadow-md rounded-lg overflow-hidden">
      <div className="text-center p-4 bg-primary-50 border-b">
        <h2 className="text-xl font-bold">
          יום {date.toLocaleDateString('he-IL', { weekday: 'long' })}, {date.toLocaleDateString('he-IL')}
        </h2>
      </div>
      
      <div 
        ref={timelineRef}
        className="relative h-[600px] overflow-y-auto pr-16 border-r"
        style={{ scrollbarWidth: 'thin' }}
      >
        {/* מיכל כללי המכיל את כל השעות - 24 שעות */}
        <div className="absolute right-14 left-0" style={{ height: `${24 * 72}px` }}>
          {/* שעות הטיימליין */}
          <div className="absolute right-0 top-0 w-14 h-full bg-gray-50 border-l border-gray-200">
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute right-0 flex items-center justify-center w-14 h-6 text-sm font-medium"
                style={{ top: `${hour * 72}px` }}
              >
                <span className={hour === new Date().getHours() ? 'text-primary-500' : 'text-gray-500'}>
                  {hour}:00
                </span>
              </div>
            ))}
          </div>
          
          {/* קווי השעות */}
          {hours.map((hour) => (
            <div
              key={hour}
              className={`absolute right-0 left-0 border-t ${hour === new Date().getHours() ? 'border-primary-200' : 'border-gray-100'}`}
              style={{ top: `${hour * 72}px` }}
            >
              {/* מיכל עבור כל שעה - שדה כדי לאפשר הוספת אירוע בלחיצה */}
              <div className="w-full h-[72px] bg-white/30 cursor-pointer hover:bg-primary-50/30 transition-colors"></div>
            </div>
          ))}
          
          {/* חצאי שעות */}
          {hours.map((hour) => (
            <div
              key={`half-${hour}`}
              className="absolute right-0 left-0 border-t border-dashed border-gray-100"
              style={{ top: `${hour * 72 + 36}px` }}
            />
          ))}
          
          {/* האירועים */}
          {events.map((event) => (
            <div
              key={event.id}
              className={`absolute right-16 left-3 rounded-md shadow-sm overflow-hidden transition-all duration-200 hover:shadow cursor-pointer ${getEventClasses(event)}`}
              style={getEventStyle(event)}
              onClick={() => handleEventClick(event)}
            >
              <div className="absolute top-0 right-0 bottom-0 left-0 p-2 flex flex-col">
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className="p-1 mr-1">
                      {getEventIcon(event)}
                    </div>
                    <h4 className="font-medium text-gray-800 line-clamp-1">{event.title}</h4>
                  </div>
                  <span className="text-xs bg-white bg-opacity-70 px-1.5 py-0.5 rounded text-gray-600 flex items-center">
                    {formatTime(event.start)} - {formatTime(event.end)}
                  </span>
                </div>
                
                {event.description && (
                  <p className="text-sm mt-1 text-gray-600 line-clamp-2 ml-6">{event.description}</p>
                )}
                
                {/* אייקונים מיוחדים לפי סוג האירוע */}
                <div className="mt-auto flex flex-wrap pt-1">
                  {event.imageUrl && (
                    <div className="flex items-center bg-white bg-opacity-60 rounded px-1.5 py-0.5 ml-1 mt-1">
                      <FiImage className="text-gray-500 ml-1" size={12} />
                      <span className="text-xs">תמונה</span>
                    </div>
                  )}
                  {event.isWakeUp && event.weight && (
                    <div className="flex items-center bg-white bg-opacity-60 rounded px-1.5 py-0.5 ml-1 mt-1">
                      <span className="text-xs font-medium">{event.weight} ק"ג</span>
                    </div>
                  )}
                  {event.isTreadmill && (
                    <div className="flex items-center bg-white bg-opacity-60 rounded px-1.5 py-0.5 ml-1 mt-1">
                      <FiClock className="text-gray-500 ml-1" size={12} />
                      <span className="text-xs">
                        {event.duration} דק', {event.distance} ק"מ
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {/* קו השעה הנוכחית */}
          <div 
            className="absolute right-0 left-0 h-[2px] bg-red-500 z-10"
            style={{ 
              top: `${new Date().getHours() * 72 + (new Date().getMinutes() / 60) * 72}px` 
            }}
          >
            <div className="absolute right-[-4px] w-4 h-4 bg-red-500 rounded-full transform -translate-y-1/2" />
          </div>
        </div>
      </div>
      
      {/* מידע מפורט על האירוע הנבחר */}
      {selectedEvent && (
        <div className="p-4 border-t bg-white">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-lg flex items-center">
              {getEventIcon(selectedEvent)}
              <span className="mr-2">{selectedEvent.title}</span>
            </h4>
            <button
              className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
              onClick={() => onEventUpdate(selectedEvent)}
              title="ערוך אירוע"
            >
              <FiEdit3 />
            </button>
          </div>
          
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <FiClock className="ml-1" />
            <span>
              {formatTime(selectedEvent.start)} - {formatTime(selectedEvent.end)}
            </span>
          </div>
          
          {selectedEvent.description && (
            <p className="text-gray-600 mb-2">{selectedEvent.description}</p>
          )}
          
          {selectedEvent.imageUrl && (
            <div className="mt-2">
              <img 
                src={selectedEvent.imageUrl} 
                alt={selectedEvent.title} 
                className="max-h-32 rounded border"
              />
            </div>
          )}
          
          {selectedEvent.isWakeUp && selectedEvent.weight && (
            <div className="mt-2 p-2 bg-yellow-50 rounded flex items-center">
              <FiSun className="ml-2 text-yellow-500" />
              <span className="font-medium">משקל בוקר:</span>
              <span className="mr-2">{selectedEvent.weight} ק"ג</span>
            </div>
          )}
          
          {selectedEvent.isTreadmill && (
            <div className="mt-2 p-2 bg-green-50 rounded">
              <div className="font-medium flex items-center">
                <FiActivity className="ml-2 text-green-500" />
                פעילות הליכון:
              </div>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div className="text-center p-1 bg-white rounded">
                  <div className="text-sm text-gray-500">זמן</div>
                  <div className="font-medium">{selectedEvent.duration} דקות</div>
                </div>
                <div className="text-center p-1 bg-white rounded">
                  <div className="text-sm text-gray-500">מהירות</div>
                  <div className="font-medium">{selectedEvent.speed} קמ"ש</div>
                </div>
                <div className="text-center p-1 bg-white rounded">
                  <div className="text-sm text-gray-500">מרחק</div>
                  <div className="font-medium">{selectedEvent.distance} ק"מ</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailyTimeline; 