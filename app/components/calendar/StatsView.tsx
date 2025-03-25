'use client';

import { useState, useEffect } from 'react';
import { CalendarEvent } from '../../types';
import { 
  FiClock, 
  FiChevronLeft,
  FiChevronRight,
  FiSun, 
  FiMoon, 
  FiCoffee, 
  FiActivity, 
  FiMonitor,
  FiCalendar,
  FiPieChart,
  FiBarChart2,
  FiTrendingUp,
  FiAward,
  FiDroplet,
  FiZap,
  FiList
} from 'react-icons/fi';

interface StatsViewProps {
  events: CalendarEvent[];
  period: 'week' | 'month' | 'year';
  startDate: Date;
}

interface EventStats {
  category: string;
  minutes: number;
  percentage: number;
  color: string;
  icon: JSX.Element;
}

interface TimeDistribution {
  hour: number;
  activities: number;
}

interface TaskStats {
  total: number;
  completed: number;
  completionRate: number;
}

const StatsView: React.FC<StatsViewProps> = ({ events, period, startDate }) => {
  const [stats, setStats] = useState<EventStats[]>([]);
  const [totalMinutes, setTotalMinutes] = useState<number>(0);
  const [dateRangeText, setDateRangeText] = useState<string>('');
  const [activeDays, setActiveDays] = useState<number>(0);
  const [timeDistribution, setTimeDistribution] = useState<TimeDistribution[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<Date>(startDate);
  const [taskStats, setTaskStats] = useState<TaskStats>({ total: 0, completed: 0, completionRate: 0 });
  
  // חישוב סטטיסטיקות
  useEffect(() => {
    // חישוב טווח תאריכים
    const endDate = new Date(currentPeriod);
    if (period === 'week') {
      endDate.setDate(currentPeriod.getDate() + 7);
      setDateRangeText(`${currentPeriod.getDate()}.${currentPeriod.getMonth() + 1} - ${endDate.getDate()}.${endDate.getMonth() + 1}`);
    } else if (period === 'month') {
      endDate.setMonth(currentPeriod.getMonth() + 1);
      setDateRangeText(`${getHebrewMonthName(currentPeriod.getMonth())} ${currentPeriod.getFullYear()}`);
    } else {
      endDate.setFullYear(currentPeriod.getFullYear() + 1);
      setDateRangeText(`${currentPeriod.getFullYear()}`);
    }
    
    // סינון אירועים לפי טווח התאריכים
    const filteredEvents = events.filter(event => {
      return event.start >= currentPeriod && event.start < endDate;
    });
    
    // חישוב ימים פעילים
    const activeDaysSet = new Set<string>();
    filteredEvents.forEach(event => {
      const dateString = event.start.toISOString().split('T')[0];
      activeDaysSet.add(dateString);
    });
    setActiveDays(activeDaysSet.size);
    
    // חלוקה לקטגוריות
    const categories: { [key: string]: { minutes: number, color: string, icon: JSX.Element } } = {
      'עבודה': { minutes: 0, color: '#3b82f6', icon: <FiMonitor className="text-blue-500" /> },
      'שינה': { minutes: 0, color: '#8b5cf6', icon: <FiMoon className="text-purple-500" /> },
      'אוכל': { minutes: 0, color: '#f97316', icon: <FiCoffee className="text-orange-500" /> },
      'פעילות גופנית': { minutes: 0, color: '#22c55e', icon: <FiActivity className="text-green-500" /> },
      'אחר': { minutes: 0, color: '#64748b', icon: <FiCalendar className="text-gray-500" /> },
    };
    
    // חישוב דקות לכל קטגוריה
    let total = 0;
    
    filteredEvents.forEach(event => {
      const durationMs = event.end.getTime() - event.start.getTime();
      const minutes = Math.round(durationMs / (1000 * 60));
      
      // הקצאה לקטגוריה המתאימה
      if (event.title.toLowerCase().includes('עבודה') || event.categoryId === 'work') {
        categories['עבודה'].minutes += minutes;
      } else if (event.title.toLowerCase().includes('שינה') || event.categoryId === 'sleep') {
        categories['שינה'].minutes += minutes;
      } else if (event.title.toLowerCase().includes('ארוחת') || event.title.toLowerCase().includes('אוכל') || event.categoryId === 'meal') {
        categories['אוכל'].minutes += minutes;
      } else if (event.isTreadmill || event.title.toLowerCase().includes('ריצה') || event.title.toLowerCase().includes('אימון') || event.categoryId === 'treadmill') {
        categories['פעילות גופנית'].minutes += minutes;
      } else {
        categories['אחר'].minutes += minutes;
      }
      
      total += minutes;
    });
    
    setTotalMinutes(total);
    
    // המרה לאחוזים ויצירת מערך סטטיסטיקות
    const statsArray: EventStats[] = Object.entries(categories).map(([category, data]) => ({
      category,
      minutes: data.minutes,
      percentage: total > 0 ? Math.round((data.minutes / total) * 100) : 0,
      color: data.color,
      icon: data.icon
    }));
    
    // מיון לפי כמות דקות בסדר יורד
    statsArray.sort((a, b) => b.minutes - a.minutes);
    
    setStats(statsArray);
    
    // יצירת התפלגות פעילות לפי שעות
    const hourDistribution: TimeDistribution[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      activities: 0
    }));
    
    filteredEvents.forEach(event => {
      const hour = event.start.getHours();
      hourDistribution[hour].activities++;
    });
    
    setTimeDistribution(hourDistribution);
    
  }, [events, period, currentPeriod]);
  
  // חישוב סטטיסטיקות משימות
  useEffect(() => {
    // חישוב טווח תאריכים
    const endDate = new Date(currentPeriod);
    if (period === 'week') {
      endDate.setDate(currentPeriod.getDate() + 7);
    } else if (period === 'month') {
      endDate.setMonth(currentPeriod.getMonth() + 1);
    } else {
      endDate.setFullYear(currentPeriod.getFullYear() + 1);
    }
    
    // קריאת כל המשימות מה-localStorage עבור התקופה
    let totalTasks = 0;
    let completedTasks = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tasks_')) {
        const dateStr = key.replace('tasks_', '');
        const taskDate = new Date(dateStr);
        
        // בדיקה אם התאריך בטווח הנבחר
        if (taskDate >= currentPeriod && taskDate < endDate) {
          try {
            const tasksJson = localStorage.getItem(key);
            if (tasksJson) {
              const tasks = JSON.parse(tasksJson);
              
              // ספירת המשימות וסטטוס השלמה
              totalTasks += tasks.length;
              completedTasks += tasks.filter((task: any) => task.completed).length;
            }
          } catch (error) {
            console.error('שגיאה בקריאת משימות לסטטיסטיקה:', error);
          }
        }
      }
    }
    
    // חישוב שיעור השלמה
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    setTaskStats({ total: totalTasks, completed: completedTasks, completionRate });
    
  }, [period, currentPeriod]);
  
  // המרת דקות לשעות ודקות בפורמט קריא
  const formatMinutesToHM = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) {
      return `${mins} דקות`;
    } else if (mins === 0) {
      return `${hours} שעות`;
    } else {
      return `${hours} שעות ו-${mins} דקות`;
    }
  };
  
  // השמות העבריים של החודשים
  const getHebrewMonthName = (monthIndex: number): string => {
    const hebrewMonths = [
      'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
      'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
    ];
    return hebrewMonths[monthIndex];
  };
  
  // העברה לתקופה הקודמת
  const goToPreviousPeriod = () => {
    const newDate = new Date(currentPeriod);
    if (period === 'week') {
      newDate.setDate(currentPeriod.getDate() - 7);
    } else if (period === 'month') {
      newDate.setMonth(currentPeriod.getMonth() - 1);
    } else {
      newDate.setFullYear(currentPeriod.getFullYear() - 1);
    }
    setCurrentPeriod(newDate);
  };
  
  // העברה לתקופה הבאה
  const goToNextPeriod = () => {
    const newDate = new Date(currentPeriod);
    if (period === 'week') {
      newDate.setDate(currentPeriod.getDate() + 7);
    } else if (period === 'month') {
      newDate.setMonth(currentPeriod.getMonth() + 1);
    } else {
      newDate.setFullYear(currentPeriod.getFullYear() + 1);
    }
    setCurrentPeriod(newDate);
  };
  
  // מציאת שעה עם הכי הרבה פעילויות
  const busyHour = timeDistribution.length > 0 ? 
    timeDistribution.reduce((prev, current) => 
      (prev.activities > current.activities) ? prev : current, timeDistribution[0]) 
    : { hour: 0, activities: 0 };
  
  return (
    <div className="space-y-6">
      {/* כותרת וניווט - עיצוב עדין יותר */}
      <div className="card p-4 bg-white border-b-4 border-primary-500 shadow-sm rounded-lg">
        <div className="flex justify-between items-center">
          <button 
            onClick={goToPreviousPeriod}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
          >
            <FiChevronRight className="h-5 w-5" />
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-800">סטטיסטיקות זמן</h2>
            <div className="text-sm mt-1 text-gray-500">{dateRangeText}</div>
          </div>
          
          <button 
            onClick={goToNextPeriod}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
          >
            <FiChevronLeft className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      {/* אריחי מידע עיקרי */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card p-4 bg-white shadow-sm rounded-lg border-t-4 border-primary-500">
          <div className="flex items-center mb-2">
            <FiClock className="text-primary-500 ml-2" size={18} />
            <div className="text-sm text-gray-600">סה"כ זמן</div>
          </div>
          <div className="text-lg font-bold">
            {formatMinutesToHM(totalMinutes)}
          </div>
        </div>
        
        <div className="card p-4 bg-white shadow-sm rounded-lg border-t-4 border-green-500">
          <div className="flex items-center mb-2">
            <FiCalendar className="text-green-500 ml-2" size={18} />
            <div className="text-sm text-gray-600">ימים פעילים</div>
          </div>
          <div className="text-lg font-bold">
            {activeDays} ימים
          </div>
        </div>
        
        <div className="card p-4 bg-white shadow-sm rounded-lg border-t-4 border-blue-500">
          <div className="flex items-center mb-2">
            <FiAward className="text-blue-500 ml-2" size={18} />
            <div className="text-sm text-gray-600">פעילות מובילה</div>
          </div>
          <div className="text-lg font-bold">
            {stats.length > 0 ? stats[0].category : 'אין נתונים'}
          </div>
        </div>
        
        <div className="card p-4 bg-white shadow-sm rounded-lg border-t-4 border-purple-500">
          <div className="flex items-center mb-2">
            <FiZap className="text-purple-500 ml-2" size={18} />
            <div className="text-sm text-gray-600">שעה עמוסה</div>
          </div>
          <div className="text-lg font-bold">
            {busyHour ? `${busyHour.hour}:00` : 'אין נתונים'}
          </div>
        </div>
      </div>
      
      {/* אריח סטטיסטיקות משימות */}
      <div className="card p-4 bg-white shadow-sm rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <FiList className="text-primary-500 ml-2" size={18} />
          סטטיסטיקות משימות
        </h3>
        
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="p-3 bg-gray-50 rounded-lg text-center">
            <div className="text-sm text-gray-600 mb-1">סה"כ משימות</div>
            <div className="text-2xl font-bold text-gray-800">{taskStats.total}</div>
          </div>
          
          <div className="p-3 bg-green-50 rounded-lg text-center">
            <div className="text-sm text-gray-600 mb-1">הושלמו</div>
            <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
          </div>
          
          <div className="p-3 bg-blue-50 rounded-lg text-center">
            <div className="text-sm text-gray-600 mb-1">שיעור השלמה</div>
            <div className="text-2xl font-bold text-blue-600">{taskStats.completionRate}%</div>
          </div>
        </div>
        
        {/* סרגל התקדמות */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-primary-500 h-2.5 rounded-full"
              style={{ width: `${taskStats.completionRate}%` }}
            ></div>
          </div>
        </div>
      </div>
      
      {/* תרשים עוגה */}
      <div className="card p-4 bg-white shadow-sm rounded-lg">
        <h3 className="text-lg font-bold mb-4 border-r-4 border-primary-500 pr-2">חלוקת זמן לפי קטגוריות</h3>
        
        <div className="flex flex-col md:flex-row">
          {/* תרשים עוגה */}
          <div className="md:w-1/2 flex justify-center mb-6 md:mb-0">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {stats.map((stat, index, array) => {
                  let offset = 0;
                  for (let i = 0; i < index; i++) {
                    offset += array[i].percentage;
                  }
                  
                  // חישוב נקודות המעגל עבור ה-path
                  const startAngle = (offset / 100) * 2 * Math.PI - Math.PI / 2;
                  const endAngle = ((offset + stat.percentage) / 100) * 2 * Math.PI - Math.PI / 2;
                  
                  const startX = 50 + 45 * Math.cos(startAngle);
                  const startY = 50 + 45 * Math.sin(startAngle);
                  const endX = 50 + 45 * Math.cos(endAngle);
                  const endY = 50 + 45 * Math.sin(endAngle);
                  
                  const largeArcFlag = stat.percentage > 50 ? 1 : 0;
                  
                  return (
                    <path
                      key={stat.category}
                      d={`M 50 50 L ${startX} ${startY} A 45 45 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                      fill={stat.color}
                      stroke="white"
                      strokeWidth="1"
                    />
                  );
                })}
                <circle cx="50" cy="50" r="25" fill="white" />
              </svg>
              
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <FiPieChart className="mx-auto text-primary-500 mb-1" size={20} />
                  <div className="text-xs text-gray-500 font-medium">סה"כ שעות</div>
                  <div className="text-sm font-bold">{Math.round(totalMinutes / 60)}</div>
                </div>
              </div>
            </div>
          </div>
          
          {/* רשימת קטגוריות */}
          <div className="md:w-1/2 space-y-3">
            {stats.map((stat) => (
              <div key={stat.category} className="flex items-center">
                <div 
                  className="w-3 h-3 ml-2 rounded-full" 
                  style={{ backgroundColor: stat.color }}
                />
                
                <div className="flex-grow font-medium">
                  {stat.category}
                </div>
                
                <div className="flex items-center">
                  <div className="text-sm font-bold ml-2">
                    {formatMinutesToHM(stat.minutes)}
                  </div>
                  <div className="text-xs bg-gray-100 rounded-full py-1 px-2 min-w-[2.5rem] text-center">
                    {stat.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* השוואות ותובנות */}
      <div className="card p-4 bg-white shadow-sm rounded-lg">
        <h3 className="text-lg font-bold mb-4 border-r-4 border-green-500 pr-2">תובנות ונתונים מעניינים</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <FiActivity className="text-green-500 ml-2" />
              <h4 className="font-medium">איזון עבודה-חיים</h4>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">עבודה</span>
                <span className="font-bold">{formatMinutesToHM(stats.find(s => s.category === 'עבודה')?.minutes || 0)}</span>
              </div>
              
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500"
                  style={{ 
                    width: `${(stats.find(s => s.category === 'עבודה')?.minutes || 0) / 
                            (stats.find(s => s.category === 'עבודה')?.minutes || 0) + 
                            (stats.find(s => s.category === 'פעילות גופנית')?.minutes || 0) * 100}%`
                  }}
                />
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">פעילות גופנית</span>
                <span className="font-bold">{formatMinutesToHM(stats.find(s => s.category === 'פעילות גופנית')?.minutes || 0)}</span>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center mb-2">
              <FiDroplet className="text-blue-500 ml-2" />
              <h4 className="font-medium">זמן באחוזים</h4>
            </div>
            
            <div className="space-y-3">
              {stats.length > 0 && (
                <div className="flex items-center">
                  <div className="w-full bg-gray-200 h-4 rounded-full overflow-hidden flex">
                    {stats.map((stat, index) => (
                      <div
                        key={index}
                        className="h-full"
                        style={{ 
                          width: `${stat.percentage}%`,
                          backgroundColor: stat.color,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
              
              <div className="text-sm">
                {activeDays > 0 && (
                  <div className="flex justify-between">
                    <span>ממוצע יומי</span>
                    <span className="font-bold">{formatMinutesToHM(Math.round(totalMinutes / activeDays))}</span>
                  </div>
                )}
                
                {stats.find(s => s.category === 'שינה')?.minutes ? (
                  <div className="flex justify-between mt-1">
                    <span>שינה ממוצעת</span>
                    <span className="font-bold">
                      {Math.round((stats.find(s => s.category === 'שינה')?.minutes || 0) / (activeDays || 1) / 60)} שעות
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StatsView; 