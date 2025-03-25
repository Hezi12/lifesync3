'use client';

import { useState, useEffect } from 'react';
import { FiPlusCircle, FiEdit, FiTrash2, FiActivity, FiClock, FiMapPin } from 'react-icons/fi';
import { PhysicalActivity } from '../../types';

const ActivityTracker = () => {
  const [activities, setActivities] = useState<PhysicalActivity[]>([]);
  const [isAddingActivity, setIsAddingActivity] = useState(false);
  
  // מצבים לטופס הוספת פעילות
  const [newActivityType, setNewActivityType] = useState('הליכון');
  const [newActivityDuration, setNewActivityDuration] = useState('');
  const [newActivityDistance, setNewActivityDistance] = useState('');
  const [newActivityDate, setNewActivityDate] = useState(new Date().toISOString().split('T')[0]);
  
  // הכנת רשימת סוגי הפעילויות
  const activityTypes = ['הליכון', 'ריצה', 'הליכה', 'שחייה', 'אופניים', 'כדורסל', 'אימון כוח', 'יוגה', 'אחר'];
  
  // טעינת נתונים מ-localStorage
  useEffect(() => {
    const savedActivities = localStorage.getItem('activities');
    if (savedActivities) {
      try {
        // המרת תאריכים ממחרוזות לאובייקטי Date
        const parsedActivities = JSON.parse(savedActivities, (key, value) => {
          if (key === 'date') {
            return new Date(value);
          }
          return value;
        });
        
        setActivities(parsedActivities);
      } catch (error) {
        console.error('שגיאה בטעינת פעילויות:', error);
        createSampleActivities();
      }
    } else {
      createSampleActivities();
    }
  }, []);
  
  // סנכרון עם אירועי הליכון מלוח השנה
  useEffect(() => {
    try {
      // בדיקה אם קיימים אירועי לוח שנה בזיכרון המקומי
      const eventsString = localStorage.getItem('calendarEvents');
      if (!eventsString) return;
      
      const parsedEvents = JSON.parse(eventsString);
      if (!Array.isArray(parsedEvents)) return;
      
      // פילטור אירועי הליכון בלבד
      const treadmillEvents = parsedEvents.filter(event => 
        event.isTreadmill === true && 
        event.duration && 
        (event.distance || event.speed)
      );
      
      if (treadmillEvents.length === 0) return;
      
      // הפיכת אירועי לוח שנה לפעילויות
      const treadmillActivities = treadmillEvents.map(event => {
        // אם יש לנו מהירות ומשך ואין מרחק, נחשב את המרחק
        let distance = event.distance;
        let speed = event.speed;
        const duration = event.duration;
        
        if (!distance && speed && duration) {
          const durationInHours = duration / 60;
          distance = parseFloat((durationInHours * speed).toFixed(1));
        }
        
        if (!speed && distance && duration) {
          const durationInHours = duration / 60;
          speed = parseFloat((distance / durationInHours).toFixed(1));
        }
        
        return {
          id: `calendar-${event.id}`,
          date: new Date(event.start),
          type: 'הליכון',
          duration: duration,
          distance: distance || 0,
          speed: speed || 0,
          fromCalendar: true // סימון שהפעילות מגיעה מלוח השנה
        };
      });
      
      // בדיקה אם כבר יש לנו פעילויות מאירועי לוח שנה כדי למנוע כפילויות
      const calendarIds = treadmillActivities.map(activity => activity.id);
      const filteredActivities = activities.filter(activity => 
        !activity.fromCalendar || !calendarIds.includes(activity.id)
      );
      
      // מיזוג ומיון של הפעילויות
      const mergedActivities = [...filteredActivities, ...treadmillActivities].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );
      
      setActivities(mergedActivities);
      localStorage.setItem('activities', JSON.stringify(mergedActivities));
      
    } catch (error) {
      console.error('שגיאה בסנכרון אירועי הליכון:', error);
    }
  }, []);
  
  // שמירת פעילויות ב-localStorage בכל פעם שיש שינוי
  useEffect(() => {
    if (activities.length > 0) {
      localStorage.setItem('activities', JSON.stringify(activities));
    }
  }, [activities]);
  
  // יצירת נתוני פעילות גופנית לדוגמה
  const createSampleActivities = () => {
    const sampleActivities: PhysicalActivity[] = [];
    const today = new Date();
    
    // יצירת 10 פעילויות אחרונות לדוגמה
    for (let i = 20; i >= 0; i -= 2) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // בחירת סוג פעילות רנדומלי
      const types = ['הליכון', 'ריצה', 'הליכה', 'אופניים'];
      const randomType = types[Math.floor(Math.random() * types.length)];
      
      // יצירת משך זמן ומרחק רנדומליים
      const randomDuration = Math.floor(Math.random() * 30) + 15; // 15-45 דקות
      const randomDistance = parseFloat(((randomDuration / 10) + Math.random()).toFixed(1)); // מרחק שיהיה הגיוני ביחס לזמן
      
      sampleActivities.push({
        id: `activity-${i}`,
        date: new Date(date),
        type: randomType,
        duration: randomDuration,
        distance: randomDistance,
        speed: randomDistance / (randomDuration / 60) // מהירות בקמ"ש
      });
    }
    
    // מיון לפי תאריך (מהישן לחדש)
    sampleActivities.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    setActivities(sampleActivities);
    localStorage.setItem('activities', JSON.stringify(sampleActivities));
  };
  
  // הוספת פעילות גופנית חדשה
  const addActivity = () => {
    if (
      !newActivityType || 
      !newActivityDuration || 
      isNaN(Number(newActivityDuration)) || 
      Number(newActivityDuration) <= 0 ||
      !newActivityDate
    ) return;
    
    // המרת משך לדקות
    const duration = Number(newActivityDuration);
    
    // חישוב מהירות אם הוזן מרחק
    let distance = undefined;
    let speed = undefined;
    
    if (newActivityDistance && !isNaN(Number(newActivityDistance)) && Number(newActivityDistance) > 0) {
      distance = parseFloat(Number(newActivityDistance).toFixed(1));
      speed = distance / (duration / 60); // מהירות בקמ"ש
    }
    
    const newActivity: PhysicalActivity = {
      id: Date.now().toString(),
      date: new Date(newActivityDate),
      type: newActivityType,
      duration,
      distance,
      speed
    };
    
    // מיון הפעילויות לפי תאריך (מהישן לחדש)
    const updatedActivities = [...activities, newActivity].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    
    setActivities(updatedActivities);
    localStorage.setItem('activities', JSON.stringify(updatedActivities));
    
    // איפוס הטופס
    setNewActivityType('הליכון');
    setNewActivityDuration('');
    setNewActivityDistance('');
    setNewActivityDate(new Date().toISOString().split('T')[0]);
    setIsAddingActivity(false);
  };
  
  // מחיקת פעילות - ישירות ללא אישור
  const deleteActivity = (id: string) => {
    const updatedActivities = activities.filter(activity => activity.id !== id);
    setActivities(updatedActivities);
    localStorage.setItem('activities', JSON.stringify(updatedActivities));
  };
  
  // חישוב סטטיסטיקות
  const calculateStats = () => {
    if (activities.length === 0) {
      return {
        totalActivities: 0,
        totalDuration: 0,
        totalDistance: 0,
        weeklyActivities: 0,
        weeklyDuration: 0,
        weeklyDistance: 0
      };
    }
    
    const now = new Date();
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(now.getDate() - 7);
    
    let totalDuration = 0;
    let totalDistance = 0;
    let weeklyDuration = 0;
    let weeklyDistance = 0;
    let weeklyActivities = 0;
    
    activities.forEach(activity => {
      totalDuration += activity.duration;
      totalDistance += activity.distance || 0;
      
      if (activity.date >= oneWeekAgo) {
        weeklyDuration += activity.duration;
        weeklyDistance += activity.distance || 0;
        weeklyActivities++;
      }
    });
    
    return {
      totalActivities: activities.length,
      totalDuration,
      totalDistance: parseFloat(totalDistance.toFixed(1)),
      weeklyActivities,
      weeklyDuration,
      weeklyDistance: parseFloat(weeklyDistance.toFixed(1))
    };
  };
  
  const stats = calculateStats();
  
  // פורמט תאריך בעברית
  const formatDate = (date: Date): string => {
    const options: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    return date.toLocaleDateString('he-IL', options);
  };
  
  return (
    <div className="space-y-6">
      {/* כרטיסי סיכום */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-green-50">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-full ml-3">
              <FiActivity className="text-green-600 text-xl" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">סה"כ פעילויות השבוע</h3>
              <p className="text-2xl font-bold text-green-600">{stats.weeklyActivities}</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-blue-50">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full ml-3">
              <FiClock className="text-blue-600 text-xl" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">זמן אימון השבוע</h3>
              <p className="text-2xl font-bold text-blue-600">{stats.weeklyDuration} דקות</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-purple-50">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-full ml-3">
              <FiMapPin className="text-purple-600 text-xl" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">מרחק השבוע</h3>
              <p className="text-2xl font-bold text-purple-600">{stats.weeklyDistance} ק"מ</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* רשימת פעילויות */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">מעקב פעילות גופנית</h2>
          <button
            onClick={() => setIsAddingActivity(true)}
            className="btn-primary text-sm flex items-center"
          >
            <FiPlusCircle className="ml-1" />
            הוסף פעילות
          </button>
        </div>
        
        {activities.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">סוג פעילות</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">משך (דקות)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">מרחק (ק"מ)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">מהירות (קמ"ש)</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activities.map((activity) => (
                  <tr key={activity.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(activity.date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.duration}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{activity.distance ? activity.distance : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {activity.speed ? activity.speed.toFixed(1) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex space-x-2 space-x-reverse">
                      <button 
                        onClick={() => deleteActivity(activity.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FiTrash2 />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">אין פעילויות גופניות, הוסף את הפעילות הראשונה שלך!</p>
        )}
      </div>
      
      {/* טופס הוספת פעילות */}
      {isAddingActivity && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-2xl w-full">
            <h3 className="text-lg font-semibold mb-4">הוספת פעילות גופנית</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">סוג פעילות</label>
                  <select
                    value={newActivityType}
                    onChange={(e) => setNewActivityType(e.target.value)}
                    className="input-field"
                  >
                    {activityTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">תאריך</label>
                  <input
                    type="date"
                    value={newActivityDate}
                    onChange={(e) => setNewActivityDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">משך (דקות)</label>
                  <input
                    type="number"
                    value={newActivityDuration}
                    onChange={(e) => setNewActivityDuration(e.target.value)}
                    placeholder="למשל: 30"
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">מרחק (ק"מ, אופציונלי)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newActivityDistance}
                    onChange={(e) => setNewActivityDistance(e.target.value)}
                    placeholder="למשל: 2.5"
                    className="input-field"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-4 space-x-reverse mt-6">
                <button
                  onClick={() => setIsAddingActivity(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  ביטול
                </button>
                <button
                  onClick={addActivity}
                  className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
                  disabled={!newActivityType || !newActivityDuration || isNaN(Number(newActivityDuration)) || Number(newActivityDuration) <= 0}
                >
                  הוסף פעילות
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityTracker; 