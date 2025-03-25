'use client';

import { useState, useEffect } from 'react';
import { FiPlusCircle, FiEdit, FiTrash2, FiTarget } from 'react-icons/fi';
import { WeightRecord, WeightGoal } from '../../types';
import WeightChart from './WeightChart';

const WeightTracker = () => {
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(null);
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [isSettingGoal, setIsSettingGoal] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<number>(0);
  
  // מצבים לטופס הוספת משקל
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  
  // מצבים לטופס הגדרת יעד
  const [startWeight, setStartWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState('');
  
  // טעינת נתונים מ-localStorage
  useEffect(() => {
    // טעינת רשומות משקל
    const savedWeightRecords = localStorage.getItem('weightRecords');
    
    if (savedWeightRecords) {
      try {
        const parsedRecords = JSON.parse(savedWeightRecords, (key, value) => {
          if (key === 'date') {
            return new Date(value);
          }
          return value;
        });
        setWeightRecords(parsedRecords);
      } catch (error) {
        console.error('שגיאה בטעינת רשומות משקל:', error);
        createSampleWeightRecords();
      }
    } else {
      createSampleWeightRecords();
    }
    
    // טעינת יעד משקל
    const savedWeightGoal = localStorage.getItem('weightGoal');
    
    if (savedWeightGoal) {
      try {
        const parsedGoal = JSON.parse(savedWeightGoal, (key, value) => {
          if (key === 'startDate' || key === 'targetDate') {
            return new Date(value);
          }
          return value;
        });
        setWeightGoal(parsedGoal);
        
        // אתחול מצבי טופס היעד
        setStartWeight(parsedGoal.startWeight.toString());
        setTargetWeight(parsedGoal.targetWeight.toString());
        setStartDate(parsedGoal.startDate.toISOString().split('T')[0]);
        setTargetDate(parsedGoal.targetDate.toISOString().split('T')[0]);
      } catch (error) {
        console.error('שגיאה בטעינת יעד משקל:', error);
      }
    }
    
    // האזנה לשינויים באירועי לוח שנה
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'calendarEvents') {
        console.log('זוהה שינוי באירועי לוח שנה, מסנכרן נתוני משקל...');
        // הפעלת סנכרון חד פעמי
        syncWeightFromCalendar();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // בדיקה ראשונית וסנכרון בטעינה
    setTimeout(() => syncWeightFromCalendar(), 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);
  
  // הוספת האזנה לשינויים מקומיים ב-localStorage
  useEffect(() => {
    // הגדרת בדיקה תקופתית כל 2 דקות
    const intervalId = setInterval(() => {
      const now = Date.now();
      // בדיקת סנכרון רק אם עברו לפחות 2 דקות מהסנכרון האחרון
      if (now - lastSyncTime > 2 * 60 * 1000) {
        syncWeightFromCalendar();
      }
    }, 2 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [lastSyncTime]);
  
  // פונקציה לסנכרון נתוני משקל מלוח השנה - מחוץ ל-useEffect
  const syncWeightFromCalendar = () => {
    // מניעת סנכרון כפול
    if (isSyncingCalendar) return;
    
    try {
      setIsSyncingCalendar(true);
      
      // בדיקה אם קיימים אירועי לוח שנה בזיכרון המקומי
      const eventsString = localStorage.getItem('calendarEvents');
      if (!eventsString) {
        setIsSyncingCalendar(false);
        return;
      }
      
      const parsedEvents = JSON.parse(eventsString);
      if (!Array.isArray(parsedEvents)) {
        setIsSyncingCalendar(false);
        return;
      }
      
      // פילטור אירועי השכמה עם נתוני משקל
      const wakeupEvents = parsedEvents.filter(event => 
        event.isWakeUp === true && 
        event.weight && 
        event.weight > 0
      );
      
      if (wakeupEvents.length === 0) {
        setIsSyncingCalendar(false);
        return;
      }
      
      console.log('נמצאו', wakeupEvents.length, 'אירועי השכמה עם נתוני משקל');
      
      // הפיכת אירועי לוח שנה לרשומות משקל
      const wakeupWeightRecords = wakeupEvents.map(event => ({
        id: `calendar-${event.id}`,
        date: new Date(event.start),
        weight: event.weight,
        fromCalendar: true // סימון שהרשומה מגיעה מלוח השנה
      }));
      
      // העתקת הרשומות הנוכחיות - כדי לא לגרום לשינוי מצב באמצע הפונקציה
      const currentRecords = [...weightRecords];
      
      // נסנן את הרשומות הקיימות כדי להסיר רשומות מלוח שנה שכבר אין להן התאמה
      // או שהתאריך והמשקל שלהן זהים לרשומה מלוח השנה
      const calendarIds = wakeupWeightRecords.map(record => record.id);
      const calendarDates = wakeupWeightRecords.map(record => 
        record.date.toISOString().split('T')[0]
      );
      
      const filteredRecords = currentRecords.filter(record => {
        // אם זו רשומה מלוח השנה, נשמור אותה רק אם היא עדיין קיימת
        if (record.fromCalendar) {
          return calendarIds.includes(record.id);
        }
        
        // עבור רשומות רגילות, נבדוק אם יש רשומה מלוח השנה באותו יום
        const recordDate = record.date.toISOString().split('T')[0];
        return !calendarDates.includes(recordDate);
      });
      
      // מיזוג הרשומות החדשות עם הקיימות
      const mergedRecords = [...filteredRecords, ...wakeupWeightRecords].sort(
        (a, b) => a.date.getTime() - b.date.getTime()
      );
      
      // בדיקה אם יש שינוי באמת
      const currentRecordsJson = JSON.stringify(currentRecords);
      const newRecordsJson = JSON.stringify(mergedRecords);
      
      if (currentRecordsJson !== newRecordsJson) {
        // עדכון הרשומות רק אם יש שינוי
        setWeightRecords(mergedRecords);
        localStorage.setItem('weightRecords', JSON.stringify(mergedRecords));
        console.log('עודכנו רשומות משקל עם נתונים מלוח שנה, סה"כ:', mergedRecords.length);
      }
      
      // עדכון זמן הסנכרון האחרון
      setLastSyncTime(Date.now());
      
    } catch (error) {
      console.error('שגיאה בסנכרון נתוני משקל מלוח השנה:', error);
    } finally {
      setIsSyncingCalendar(false);
    }
  };
  
  // שמירת רשומות משקל ב-localStorage בכל פעם שיש שינוי
  useEffect(() => {
    if (weightRecords.length > 0) {
      localStorage.setItem('weightRecords', JSON.stringify(weightRecords));
    }
  }, [weightRecords]);
  
  // שמירת יעד משקל ב-localStorage בכל פעם שיש שינוי
  useEffect(() => {
    if (weightGoal) {
      localStorage.setItem('weightGoal', JSON.stringify(weightGoal));
    } else {
      localStorage.removeItem('weightGoal');
    }
  }, [weightGoal]);
  
  // יצירת נתוני משקל לדוגמה
  const createSampleWeightRecords = () => {
    // יצירת נתוני משקל לחודש האחרון
    const records: WeightRecord[] = [];
    const today = new Date();
    
    for (let i = 30; i >= 0; i -= 2) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      // יוצר משקל רנדומלי סביב 80 ק"ג עם מגמת ירידה קלה
      const randomWeight = 80 - (i * 0.03) + (Math.random() * 0.6 - 0.3);
      
      records.push({
        id: `weight-${i}`,
        date: new Date(date),
        weight: parseFloat(randomWeight.toFixed(1))
      });
    }
    
    setWeightRecords(records);
    localStorage.setItem('weightRecords', JSON.stringify(records));
    
    // יצירת יעד משקל
    const goalTarget = 75;
    const goalEnd = new Date();
    goalEnd.setDate(today.getDate() + 60); // יעד לעוד חודשיים
    
    const sampleGoal = {
      id: 'goal-1',
      startWeight: records[records.length - 1].weight,
      targetWeight: goalTarget,
      startDate: new Date(today),
      targetDate: new Date(goalEnd)
    };
    
    setWeightGoal(sampleGoal);
    localStorage.setItem('weightGoal', JSON.stringify(sampleGoal));
    
    // אתחול מצבי טופס היעד
    setStartWeight(records[records.length - 1].weight.toString());
    setTargetWeight(goalTarget.toString());
    setTargetDate(goalEnd.toISOString().split('T')[0]);
  };
  
  // חישוב BMI
  const calculateBMI = (weight: number, height: number = 175): number => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };
  
  // הוספת רשומת משקל חדשה
  const addWeightRecord = () => {
    if (!newWeight || isNaN(Number(newWeight)) || Number(newWeight) <= 0) return;
    
    const newRecord: WeightRecord = {
      id: Date.now().toString(),
      date: new Date(newDate),
      weight: parseFloat(Number(newWeight).toFixed(1))
    };
    
    // מיון הרשומות לפי תאריך (מהישן לחדש)
    const updatedRecords = [...weightRecords, newRecord].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    
    setWeightRecords(updatedRecords);
    
    // איפוס הטופס
    setNewWeight('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setIsAddingRecord(false);
  };
  
  // הגדרת יעד משקל
  const setNewWeightGoal = () => {
    if (
      !startWeight || 
      !targetWeight ||
      isNaN(Number(startWeight)) || 
      isNaN(Number(targetWeight)) ||
      Number(startWeight) <= 0 ||
      Number(targetWeight) <= 0 ||
      !startDate ||
      !targetDate
    ) return;
    
    const newGoal: WeightGoal = {
      id: weightGoal ? weightGoal.id : Date.now().toString(),
      startWeight: parseFloat(Number(startWeight).toFixed(1)),
      targetWeight: parseFloat(Number(targetWeight).toFixed(1)),
      startDate: new Date(startDate),
      targetDate: new Date(targetDate)
    };
    
    setWeightGoal(newGoal);
    setIsSettingGoal(false);
  };
  
  // מחיקת רשומת משקל
  const deleteWeightRecord = (id: string) => {
    const updatedRecords = weightRecords.filter(record => record.id !== id);
    setWeightRecords(updatedRecords);
    localStorage.setItem('weightRecords', JSON.stringify(updatedRecords));
  };
  
  // מחיקת יעד משקל
  const deleteWeightGoal = () => {
    setWeightGoal(null);
    localStorage.removeItem('weightGoal');
  };
  
  // חישוב התקדמות ליעד
  const calculateGoalProgress = (): { current: number; required: number; daily: number; daysLeft: number } => {
    if (!weightGoal || weightRecords.length === 0) {
      return { current: 0, required: 0, daily: 0, daysLeft: 0 };
    }
    
    // משקל נוכחי (האחרון שנרשם)
    const currentWeight = weightRecords[weightRecords.length - 1].weight;
    
    // כמה נשאר להוריד
    const remaining = currentWeight - weightGoal.targetWeight;
    
    // כמה צריך להוריד סה"כ
    const total = weightGoal.startWeight - weightGoal.targetWeight;
    
    // אחוז השלמה
    const progress = total > 0 ? Math.max(0, Math.min(100, 100 * (1 - (remaining / total)))) : 0;
    
    // ימים שנותרו
    const today = new Date();
    const daysLeft = Math.ceil((weightGoal.targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // כמה צריך להוריד כל יום שנותר
    const dailyRequired = daysLeft > 0 ? remaining / daysLeft : 0;
    
    return {
      current: progress,
      required: remaining,
      daily: dailyRequired,
      daysLeft
    };
  };
  
  const goalProgress = calculateGoalProgress();
  const latestWeight = weightRecords.length > 0 ? weightRecords[weightRecords.length - 1].weight : 0;
  const bmi = calculateBMI(latestWeight);
  
  // פונקציה המחזירה תיאור מילולי ל-BMI
  const getBMICategory = (bmi: number): { text: string; color: string } => {
    if (bmi < 18.5) return { text: 'תת-משקל', color: 'text-blue-500' };
    if (bmi < 25) return { text: 'תקין', color: 'text-green-500' };
    if (bmi < 30) return { text: 'עודף משקל', color: 'text-yellow-500' };
    if (bmi < 35) return { text: 'השמנה - דרגה 1', color: 'text-orange-500' };
    if (bmi < 40) return { text: 'השמנה - דרגה 2', color: 'text-red-500' };
    return { text: 'השמנה - דרגה 3', color: 'text-red-700' };
  };
  
  const bmiCategory = getBMICategory(bmi);
  
  return (
    <div className="space-y-6">
      {/* כרטיס סיכום */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card bg-blue-50">
          <div className="flex items-center">
            <div className="bg-blue-100 p-3 rounded-full ml-3">
              <FiTarget className="text-blue-600 text-xl" />
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500">משקל נוכחי</h3>
              <p className="text-2xl font-bold text-blue-600">{latestWeight} ק"ג</p>
            </div>
          </div>
        </div>
        
        <div className="card bg-green-50">
          <h3 className="text-sm font-medium text-gray-500">מדד BMI</h3>
          <p className="text-2xl font-bold text-green-600">{bmi.toFixed(1)}</p>
          <p className={`text-sm ${bmiCategory.color}`}>{bmiCategory.text}</p>
        </div>
        
        <div className="card bg-purple-50">
          <h3 className="text-sm font-medium text-gray-500">יעד משקל</h3>
          {weightGoal ? (
            <>
              <p className="text-2xl font-bold text-purple-600">{weightGoal.targetWeight} ק"ג</p>
              <p className="text-sm text-gray-600">
                נותרו {goalProgress.daysLeft} ימים ({goalProgress.required.toFixed(1)} ק"ג)
              </p>
            </>
          ) : (
            <p className="text-lg text-gray-500">לא הוגדר יעד</p>
          )}
        </div>
      </div>
      
      {/* כרטיס גרף */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">מעקב משקל</h2>
          
          <div className="flex space-x-2 space-x-reverse">
            <button
              onClick={() => setIsAddingRecord(true)}
              className="btn-primary text-sm flex items-center"
            >
              <FiPlusCircle className="ml-1" />
              הוסף משקל
            </button>
            
            <button
              onClick={() => setIsSettingGoal(true)}
              className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-sm py-2 px-3 rounded-md flex items-center"
            >
              <FiTarget className="ml-1" />
              הגדר יעד
            </button>
          </div>
        </div>
        
        {/* גרף משקל */}
        <div className="h-80">
          <WeightChart 
            weightRecords={weightRecords} 
            weightGoal={weightGoal}
          />
        </div>
      </div>
      
      {/* טופס הוספת משקל */}
      {isAddingRecord && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">הוספת רשומת משקל</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
                  משקל (ק"ג)
                </label>
                <input
                  type="number"
                  id="weight"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  step="0.1"
                  min="30"
                  max="250"
                  className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  תאריך
                </label>
                <input
                  type="date"
                  id="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <button
                onClick={() => setIsAddingRecord(false)}
                className="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-50"
              >
                ביטול
              </button>
              
              <button
                onClick={addWeightRecord}
                disabled={!newWeight || isNaN(Number(newWeight)) || Number(newWeight) <= 0}
                className={`px-4 py-2 rounded-md ${
                  newWeight && !isNaN(Number(newWeight)) && Number(newWeight) > 0
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                הוסף
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* טופס הגדרת יעד */}
      {isSettingGoal && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">הגדרת יעד משקל</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startWeight" className="block text-sm font-medium text-gray-700 mb-1">
                  משקל התחלתי (ק"ג)
                </label>
                <input
                  type="number"
                  id="startWeight"
                  value={startWeight}
                  onChange={(e) => setStartWeight(e.target.value)}
                  step="0.1"
                  min="30"
                  max="250"
                  className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="targetWeight" className="block text-sm font-medium text-gray-700 mb-1">
                  משקל יעד (ק"ג)
                </label>
                <input
                  type="number"
                  id="targetWeight"
                  value={targetWeight}
                  onChange={(e) => setTargetWeight(e.target.value)}
                  step="0.1"
                  min="30"
                  max="250"
                  className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
                  תאריך התחלה
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              
              <div>
                <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">
                  תאריך יעד
                </label>
                <input
                  type="date"
                  id="targetDate"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="block w-full py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 space-x-reverse">
              <button
                onClick={() => setIsSettingGoal(false)}
                className="px-4 py-2 border text-gray-700 rounded-md hover:bg-gray-50"
              >
                ביטול
              </button>
              
              <button
                onClick={setNewWeightGoal}
                disabled={
                  !startWeight || 
                  !targetWeight ||
                  isNaN(Number(startWeight)) || 
                  isNaN(Number(targetWeight)) ||
                  Number(startWeight) <= 0 ||
                  Number(targetWeight) <= 0 ||
                  !startDate ||
                  !targetDate
                }
                className={`px-4 py-2 rounded-md ${
                  startWeight && 
                  targetWeight &&
                  !isNaN(Number(startWeight)) && 
                  !isNaN(Number(targetWeight)) &&
                  Number(startWeight) > 0 &&
                  Number(targetWeight) > 0 &&
                  startDate &&
                  targetDate
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                שמור יעד
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* רשימת רשומות משקל */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">היסטוריית משקל</h3>
          
          <div className="flex space-x-2 space-x-reverse">
            <button 
              onClick={() => setIsAddingRecord(true)} 
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
            >
              הוסף רשומת משקל
            </button>
            <button 
              onClick={syncWeightFromCalendar} 
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded flex items-center"
              disabled={isSyncingCalendar}
            >
              {isSyncingCalendar ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  מסנכרן...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                  </svg>
                  סנכרן עם לוח שנה
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="mb-4 p-3 bg-blue-50 rounded-md text-sm text-blue-800 border border-blue-200">
          <p className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <span className="font-medium">נתוני המשקל מסונכרנים אוטומטית עם אירועי השכמה בלוח השנה.</span>
          </p>
          <p className="mr-7 mt-1">רשומות המסומנות ב"השכמה" מקורן באירועי השכמה בלוח שנה ולכן לא ניתן למחוק אותן מכאן.</p>
        </div>
        
        <div className="overflow-hidden rounded-md border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">תאריך</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">משקל (ק"ג)</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">שינוי</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">פעולות</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {weightRecords
                .slice()
                .reverse()
                .map((record, index) => {
                  // חישוב השינוי מהרשומה הקודמת
                  const prevRecord = index < weightRecords.length - 1 
                    ? weightRecords[weightRecords.length - index - 2] 
                    : null;
                  const change = prevRecord ? record.weight - prevRecord.weight : 0;
                  
                  return (
                    <tr key={record.id} className={record.fromCalendar ? 'bg-yellow-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.date.toLocaleDateString('he-IL')}
                        {record.fromCalendar && (
                          <span className="mr-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            השכמה
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {record.weight}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {index < weightRecords.length - 1 && (
                          <span
                            className={`inline-flex items-center ${
                              change > 0
                                ? 'text-red-600'
                                : change < 0
                                ? 'text-green-600'
                                : 'text-gray-500'
                            }`}
                          >
                            {change > 0 ? '+' : ''}
                            {change.toFixed(1)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {!record.fromCalendar && (
                          <button 
                            onClick={() => deleteWeightRecord(record.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <FiTrash2 />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* תיבת מידע על היעד */}
      {weightGoal && (
        <div className="card bg-purple-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">פרטי יעד משקל</h3>
            <button
              onClick={deleteWeightGoal}
              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full"
              title="מחק יעד"
            >
              <FiTrash2 size={18} />
            </button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <div className="mb-2">
                <p className="text-sm text-gray-500">משקל התחלתי</p>
                <p className="text-lg font-semibold">{weightGoal.startWeight} ק"ג</p>
              </div>
              
              <div className="mb-2">
                <p className="text-sm text-gray-500">משקל יעד</p>
                <p className="text-lg font-semibold">{weightGoal.targetWeight} ק"ג</p>
              </div>
              
              <div className="mb-2">
                <p className="text-sm text-gray-500">סה"כ לירידה</p>
                <p className="text-lg font-semibold">
                  {(weightGoal.startWeight - weightGoal.targetWeight).toFixed(1)} ק"ג
                </p>
              </div>
            </div>
            
            <div>
              <div className="mb-2">
                <p className="text-sm text-gray-500">תאריך התחלה</p>
                <p className="text-lg font-semibold">
                  {weightGoal.startDate.toLocaleDateString('he-IL')}
                </p>
              </div>
              
              <div className="mb-2">
                <p className="text-sm text-gray-500">תאריך יעד</p>
                <p className="text-lg font-semibold">
                  {weightGoal.targetDate.toLocaleDateString('he-IL')}
                </p>
              </div>
              
              <div className="mb-2">
                <p className="text-sm text-gray-500">נותרו</p>
                <p className="text-lg font-semibold">
                  {goalProgress.daysLeft} ימים ({goalProgress.daily.toFixed(2)} ק"ג ליום)
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <p className="text-sm text-gray-500 mb-1">התקדמות</p>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-purple-600 h-2.5 rounded-full"
                style={{ width: `${goalProgress.current}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-left">
              {goalProgress.current.toFixed(0)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeightTracker; 