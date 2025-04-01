'use client';

import { useState, useEffect } from 'react';
import { FiPlusCircle, FiEdit, FiTrash2, FiTarget } from 'react-icons/fi';
import { WeightRecord, WeightGoal } from '../../types';
import WeightChart from './WeightChart';
import { motion } from 'framer-motion';
import Modal from '../Modal';

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
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* סיכום משקל נוכחי */}
        <motion.div 
          className="col-span-1 md:col-span-4 bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
          
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800 flex items-center">
              <span className="w-9 h-9 flex items-center justify-center bg-blue-500 rounded-full mr-4 text-white shadow-sm">
                <FiTarget className="text-lg" />
              </span>
              מעקב משקל
            </h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddingRecord(true)}
              className="w-9 h-9 flex items-center justify-center bg-blue-500 rounded-full text-white shadow-sm hover:bg-blue-600 transition-colors"
            >
              <FiPlusCircle className="text-lg" />
            </motion.button>
          </div>

          {weightRecords.length > 0 && (
            <div className="mb-4">
              <div className="text-3xl font-bold text-gray-800 flex items-baseline">
                <motion.span
                  key={weightRecords[weightRecords.length - 1].weight}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {weightRecords[weightRecords.length - 1].weight}
                </motion.span>
                <span className="text-lg text-gray-500 mr-1">ק"ג</span>
              </div>
              
              <div className="text-sm text-gray-500 mt-1">
                עדכון אחרון: {weightRecords[weightRecords.length - 1].date.toLocaleDateString('he-IL')}
              </div>
            </div>
          )}

          {weightGoal && (
            <motion.div 
              className="bg-gray-50 rounded-lg p-3 border border-gray-200 shadow-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">יעד נוכחי:</span>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={deleteWeightGoal}
                  className="text-red-500 hover:text-red-600 transition-colors"
                >
                  <FiTrash2 className="text-sm" />
                </motion.button>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span>{weightGoal.targetWeight} ק"ג</span>
                <span className="text-gray-500">
                  עד {weightGoal.targetDate.toLocaleDateString('he-IL')}
                </span>
              </div>
              
              {calculateGoalProgress().daysLeft > 0 && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>התקדמות:</span>
                    <span>{Math.round(calculateGoalProgress().current)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-green-500 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${calculateGoalProgress().current}%` }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {!weightGoal && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsSettingGoal(true)}
              className="w-full p-3 rounded-lg border border-blue-200 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors flex items-center justify-center"
            >
              <FiTarget className="mr-4" />
              הגדר יעד משקל
            </motion.button>
          )}
        </motion.div>

        {/* BMI ונתונים נוספים */}
        <motion.div 
          className="col-span-1 md:col-span-4 bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
          
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="w-9 h-9 flex items-center justify-center bg-purple-500 rounded-full mr-4 text-white shadow-sm">
              <FiTarget className="text-lg" />
            </span>
            מדדי בריאות
          </h3>

          {weightRecords.length > 0 && (
            <div className="space-y-4">
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-gray-700">BMI נוכחי:</span>
                  <span className={`text-sm font-bold ${getBMICategory(calculateBMI(weightRecords[weightRecords.length - 1].weight)).color}`}>
                    {calculateBMI(weightRecords[weightRecords.length - 1].weight).toFixed(1)}
                  </span>
                </div>
                <div className="text-xs text-gray-500">
                  {getBMICategory(calculateBMI(weightRecords[weightRecords.length - 1].weight)).text}
                </div>
              </div>

              {weightRecords.length > 1 && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">שינוי מהמדידה הקודמת:</span>
                    <span className={`text-sm font-bold ${
                      weightRecords[weightRecords.length - 1].weight - weightRecords[weightRecords.length - 2].weight > 0
                        ? 'text-red-500'
                        : weightRecords[weightRecords.length - 1].weight - weightRecords[weightRecords.length - 2].weight < 0
                        ? 'text-green-600'
                        : 'text-gray-600'
                    }`}>
                      {(weightRecords[weightRecords.length - 1].weight - weightRecords[weightRecords.length - 2].weight).toFixed(1)} ק"ג
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(weightRecords[weightRecords.length - 2].date).toLocaleDateString('he-IL')}
                  </div>
                </div>
              )}

              {weightGoal && calculateGoalProgress().daysLeft > 0 && (
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">קצב נדרש ליעד:</span>
                    <span className="text-sm font-bold text-blue-600">
                      {calculateGoalProgress().daily.toFixed(2)} ק"ג ליום
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    נותרו {calculateGoalProgress().daysLeft} ימים
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* היסטוריית משקל */}
        <motion.div 
          className="col-span-1 md:col-span-4 bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
          
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <span className="w-9 h-9 flex items-center justify-center bg-cyan-500 rounded-full mr-4 text-white shadow-sm">
              <FiEdit className="text-lg" />
            </span>
            היסטוריה
          </h3>

          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar">
            {weightRecords.length === 0 ? (
              <div className="text-center py-3 text-gray-500 text-sm">
                אין רשומות משקל
              </div>
            ) : (
              [...weightRecords].reverse().map((record) => (
                <motion.div
                  key={record.id}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  whileHover={{ scale: 1.02, x: 3 }}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center mr-4 bg-white border border-gray-200 shadow-sm text-gray-600">
                      <span className="text-sm font-medium">{record.weight}</span>
                    </div>
                    <span className="text-sm text-gray-700">
                      {record.date.toLocaleDateString('he-IL')}
                    </span>
                  </div>
                  {!record.fromCalendar && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => deleteWeightRecord(record.id)}
                      className="text-red-500 hover:text-red-600 transition-colors"
                    >
                      <FiTrash2 className="text-sm" />
                    </motion.button>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </motion.div>
      </div>

      {/* גרף משקל */}
      <motion.div 
        className="bg-white rounded-xl p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
      >
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200"></div>
        
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          מגמת משקל
        </h3>
        
        <div className="h-[280px]">
          <WeightChart weightRecords={weightRecords} weightGoal={weightGoal} />
        </div>
      </motion.div>

      {/* מודל הוספת משקל */}
      <Modal
        isOpen={isAddingRecord}
        onClose={() => setIsAddingRecord(false)}
        title="הוספת מדידת משקל"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-1">
              משקל (ק"ג)
            </label>
            <input
              type="number"
              id="weight"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="הכנס משקל"
              step="0.1"
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
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          
          <div className="flex justify-end space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => setIsAddingRecord(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={addWeightRecord}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              disabled={!newWeight}
            >
              הוסף
            </button>
          </div>
        </div>
      </Modal>

      {/* מודל הגדרת יעד */}
      <Modal
        isOpen={isSettingGoal}
        onClose={() => setIsSettingGoal(false)}
        title="הגדרת יעד משקל"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="startWeight" className="block text-sm font-medium text-gray-700 mb-1">
              משקל התחלתי (ק"ג)
            </label>
            <input
              type="number"
              id="startWeight"
              value={startWeight}
              onChange={(e) => setStartWeight(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="הכנס משקל התחלתי"
              step="0.1"
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
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              placeholder="הכנס משקל יעד"
              step="0.1"
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
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
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
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>
          
          <div className="flex justify-end space-x-2 rtl:space-x-reverse">
            <button
              onClick={() => setIsSettingGoal(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              ביטול
            </button>
            <button
              onClick={setNewWeightGoal}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
              disabled={!startWeight || !targetWeight || !startDate || !targetDate}
            >
              הגדר יעד
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WeightTracker; 