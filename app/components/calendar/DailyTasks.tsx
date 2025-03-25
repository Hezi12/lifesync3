'use client';

import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import { DailyTask } from '../../types';

interface DailyTasksProps {
  date: Date;
}

const DailyTasks: React.FC<DailyTasksProps> = ({ date }) => {
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [newTaskText, setNewTaskText] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // מפתח מבוסס תאריך לשמירה ב-localStorage
  const getTasksKey = (dateObj: Date) => `tasks_${dateObj.toISOString().split('T')[0]}`;
  const tasksKey = getTasksKey(date);

  // הטעינה של המשימות - מתבצעת רק כאשר התאריך משתנה
  useEffect(() => {
    const savedTasks = localStorage.getItem(tasksKey);
    
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks);
        // המרת מחרוזות תאריך חזרה לאובייקטי Date
        const tasksWithDates = parsedTasks.map((task: any) => ({
          ...task,
          date: new Date(task.date)
        }));
        setTasks(tasksWithDates);
        console.log('נטענו משימות מה־localStorage:', tasksKey, tasksWithDates);
      } catch (error) {
        console.error('שגיאה בטעינת המשימות:', error);
        setTasks([]);
      }
    } else {
      console.log('אין משימות שמורות למפתח:', tasksKey);
      setTasks([]);
    }
    
    setIsInitialized(true);
  }, [date, tasksKey]);

  // שמירת המשימות בכל שינוי
  useEffect(() => {
    // וודא שה-component אותחל לפני שמירה
    if (!isInitialized) return;
    
    if (tasks.length === 0) {
      const existingTasks = localStorage.getItem(tasksKey);
      
      if (existingTasks) {
        // אם היו משימות בעבר אבל עכשיו אין, נמחק את הערך
        localStorage.removeItem(tasksKey);
        console.log('נמחקו כל המשימות מה־localStorage:', tasksKey);
      }
      return;
    }
    
    // שמירה מידית ב-localStorage בכל שינוי במשימות
    try {
      // המרת אובייקט התאריך לפורמט שניתן לשמור בצורה תקינה ב-JSON
      const tasksToSave = tasks.map(task => ({
        ...task,
        date: task.date.toISOString()  // המרת התאריך למחרוזת ISO
      }));
      localStorage.setItem(tasksKey, JSON.stringify(tasksToSave));
      console.log('משימות נשמרו בהצלחה (useEffect):', tasksKey, tasksToSave);
    } catch (error) {
      console.error('שגיאה בשמירת המשימות (useEffect):', error);
    }
  }, [tasks, tasksKey, isInitialized]);

  const formatDate = (dateStr: string) => {
    const taskDate = new Date(dateStr);
    return new Intl.DateTimeFormat('he-IL', {
      month: 'numeric',
      day: 'numeric'
    }).format(taskDate);
  };

  const addTask = () => {
    if (newTaskText.trim()) {
      const newTask: DailyTask = {
        id: Date.now().toString(),
        text: newTaskText,
        completed: false,
        date: new Date(date)
      };
      
      // עדכון מצב המשימות באופן מידי
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      setNewTaskText('');
      
      // הערה: אין צורך לשמור כאן שוב ב-localStorage כי ה-useEffect ישמור אוטומטית
    }
  };

  const toggleTaskCompletion = (id: string) => {
    const updatedTasks = tasks.map((task) =>
      task.id === id ? { ...task, completed: !task.completed } : task
    );
    setTasks(updatedTasks);
    
    // הערה: אין צורך לשמור כאן שוב ב-localStorage כי ה-useEffect ישמור אוטומטית
  };

  const deleteTask = (id: string) => {
    const updatedTasks = tasks.filter((task) => task.id !== id);
    setTasks(updatedTasks);
    
    // הערה: אין צורך לשמור כאן שוב ב-localStorage כי ה-useEffect ישמור אוטומטית
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addTask();
    }
  };

  // מעקב אחרי משימות מימים קודמים שלא הושלמו
  const getHistoricalTasks = () => {
    const allTasks: DailyTask[] = [];
    const currentDateStr = date.toISOString().split('T')[0];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('tasks_')) {
          const dateStr = key.replace('tasks_', '');
          
          // רק משימות מימים קודמים (לא היום)
          if (dateStr < currentDateStr) {
            try {
              const tasksJson = localStorage.getItem(key);
              if (tasksJson) {
                const parsedTasks = JSON.parse(tasksJson);
                
                // סינון רק משימות לא מושלמות
                const incompleteTasks = parsedTasks
                  .filter((task: any) => !task.completed)
                  .map((task: any) => ({
                    ...task,
                    date: new Date(task.date)
                  }));
                
                allTasks.push(...incompleteTasks);
              }
            } catch (error) {
              console.error(`שגיאה בטעינת משימות היסטוריות מהמפתח ${key}:`, error);
            }
          }
        }
      }
    } catch (error) {
      console.error('שגיאה כללית בטעינת משימות היסטוריות:', error);
    }
    
    console.log('משימות היסטוריות שנטענו:', allTasks.length);
    return allTasks;
  };

  const historicalTasks = getHistoricalTasks();
  
  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">משימות מרכזיות</h3>
      
      <div className="flex mb-4">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="הוסף משימה חדשה..."
          className="input-field ml-2"
          maxLength={100}
        />
        <button
          onClick={addTask}
          className="btn-primary"
          disabled={!newTaskText.trim() || tasks.length >= 3}
        >
          <FiPlus />
        </button>
      </div>
      
      {tasks.length < 3 && (
        <p className="text-sm text-gray-500 mb-4">
          נותרו {3 - tasks.length} משימות להיום
        </p>
      )}
      
      <div className="space-y-2 mb-6">
        {tasks.length > 0 ? (
          tasks.map((task) => (
            <div key={task.id} className="flex items-center p-2 border rounded-md">
              <input
                type="checkbox"
                checked={task.completed}
                onChange={() => toggleTaskCompletion(task.id)}
                className="ml-2 w-4 h-4 text-primary-500"
              />
              <p className={`flex-grow ${task.completed ? 'line-through text-gray-400' : ''}`}>
                {task.text}
              </p>
              <button
                onClick={() => deleteTask(task.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <FiTrash2 />
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-2">אין משימות מוגדרות להיום</p>
        )}
      </div>
      
      {/* משימות מימים קודמים שלא הושלמו */}
      {historicalTasks.length > 0 && (
        <div>
          <h4 className="text-md font-medium mb-2 border-t pt-3">משימות שלא הושלמו:</h4>
          <div className="space-y-2">
            {historicalTasks.map((task) => (
              <div key={task.id} className="flex items-center p-2 border rounded-md bg-gray-50">
                <span className="text-xs text-gray-500 ml-2">
                  {formatDate(task.date.toISOString())}
                </span>
                <p className="flex-grow text-sm text-gray-600">{task.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyTasks;

 