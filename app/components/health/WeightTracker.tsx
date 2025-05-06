'use client';

import { useState, useEffect } from 'react';
import { FiPlusCircle, FiEdit, FiTrash2, FiTarget } from 'react-icons/fi';
import { WeightRecord, WeightGoal } from '../../types';
import WeightChart from './WeightChart';
import { motion } from 'framer-motion';
import Modal from '../Modal';
import { useHealthContext } from '../../context/HealthContext';

const WeightTracker = () => {
  const { 
    weightRecords, 
    weightGoal, 
    addWeightRecord, 
    updateWeightRecord, 
    deleteWeightRecord,
    setWeightGoal: setWeightGoalFn,
    updateWeightGoal,
    deleteWeightGoal,
    isLoading
  } = useHealthContext();
  
  const [isAddingRecord, setIsAddingRecord] = useState(false);
  const [isSettingGoal, setIsSettingGoal] = useState(false);
  
  // מצבים לטופס הוספת משקל
  const [newWeight, setNewWeight] = useState('');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  
  // מצבים לטופס הגדרת יעד
  const [startWeight, setStartWeight] = useState('');
  const [targetWeight, setTargetWeight] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState('');
  
  // עדכון הטופס כאשר יש שינוי במצב הבחירת יעד או ביעד עצמו
  useEffect(() => {
    if (isSettingGoal && weightGoal) {
      // מילוי הטופס עם נתוני היעד הקיים
      setStartWeight(weightGoal.startWeight.toString());
      setTargetWeight(weightGoal.targetWeight.toString());
      setStartDate(weightGoal.startDate.toISOString().split('T')[0]);
      setTargetDate(weightGoal.targetDate.toISOString().split('T')[0]);
    } else if (isSettingGoal && weightRecords.length > 0) {
      // אם אין יעד אבל יש רשומות משקל, השתמש במשקל האחרון כמשקל התחלתי
      const latestWeight = weightRecords[weightRecords.length - 1].weight;
      setStartWeight(latestWeight.toString());
      
      // אם אין יעד, איפוס שאר השדות
      if (!weightGoal) {
        setTargetWeight('');
        setStartDate(new Date().toISOString().split('T')[0]);
        const defaultTargetDate = new Date();
        defaultTargetDate.setMonth(defaultTargetDate.getMonth() + 3); // יעד ל-3 חודשים קדימה כברירת מחדל
        setTargetDate(defaultTargetDate.toISOString().split('T')[0]);
      }
    }
  }, [weightGoal, isSettingGoal, weightRecords]);
  
  // חישוב BMI
  const calculateBMI = (weight: number, height: number = 175): number => {
    const heightInMeters = height / 100;
    return weight / (heightInMeters * heightInMeters);
  };
  
  // הוספת רשומת משקל חדשה
  const handleAddWeightRecord = () => {
    if (!newWeight || isNaN(Number(newWeight)) || Number(newWeight) <= 0) return;
    
    addWeightRecord({
      date: new Date(newDate),
      weight: parseFloat(Number(newWeight).toFixed(1))
    });
    
    // איפוס הטופס
    setNewWeight('');
    setNewDate(new Date().toISOString().split('T')[0]);
    setIsAddingRecord(false);
  };
  
  // הגדרת יעד משקל
  const handleSetWeightGoal = () => {
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
    
    if (weightGoal) {
      // עדכון יעד קיים
      updateWeightGoal({
        ...weightGoal,
        startWeight: parseFloat(Number(startWeight).toFixed(1)),
        targetWeight: parseFloat(Number(targetWeight).toFixed(1)),
        startDate: new Date(startDate),
        targetDate: new Date(targetDate)
      });
    } else {
      // יצירת יעד חדש
      setWeightGoalFn({
        startWeight: parseFloat(Number(startWeight).toFixed(1)),
        targetWeight: parseFloat(Number(targetWeight).toFixed(1)),
        startDate: new Date(startDate),
        targetDate: new Date(targetDate)
      });
    }
    
    setIsSettingGoal(false);
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
  
  // חישוב קצב ההתקדמות בפועל
  const calculateActualProgress = (): { 
    dailyRate: number; 
    predictedDate: Date | null;
    predictedDaysLeft: number;
    isFasterThanGoal: boolean
  } => {
    if (!weightGoal || weightRecords.length === 0) {
      return { 
        dailyRate: 0, 
        predictedDate: null,
        predictedDaysLeft: 0,
        isFasterThanGoal: false
      };
    }
    
    // נחפש רשומות שהן אחרי תאריך התחלת היעד
    const recordsAfterGoalStart = weightRecords.filter(
      record => record.date >= weightGoal.startDate
    ).sort((a, b) => a.date.getTime() - b.date.getTime());
    
    // אם אין רשומות אחרי תאריך ההתחלה, נחזיר ערכי ברירת מחדל
    if (recordsAfterGoalStart.length === 0) {
      return { 
        dailyRate: 0, 
        predictedDate: null,
        predictedDaysLeft: 0,
        isFasterThanGoal: false
      };
    }
    
    // חישוב קצב ההתקדמות
    let firstRecord, lastRecord, daysPassed, weightChange;
    
    if (recordsAfterGoalStart.length === 1) {
      // אם יש רק רשומה אחת, נשתמש במשקל ההתחלתי של היעד בתור הרשומה הראשונה
      firstRecord = {
        id: 'goal-start',
        date: weightGoal.startDate,
        weight: weightGoal.startWeight
      };
      lastRecord = recordsAfterGoalStart[0];
    } else {
      // אם יש לפחות שתי רשומות, ניקח את הראשונה והאחרונה
      firstRecord = recordsAfterGoalStart[0];
      lastRecord = recordsAfterGoalStart[recordsAfterGoalStart.length - 1];
    }
    
    // חישוב מספר הימים שעברו (לפחות יום אחד)
    daysPassed = Math.max(1, (lastRecord.date.getTime() - firstRecord.date.getTime()) / (1000 * 60 * 60 * 24));
    
    // חישוב השינוי במשקל
    weightChange = firstRecord.weight - lastRecord.weight;
    
    // חישוב הקצב היומי (ק"ג ליום)
    const dailyRate = weightChange / daysPassed;
    
    // המשקל הנוכחי והיעד
    const currentWeight = lastRecord.weight;
    const targetWeight = weightGoal.targetWeight;
    
    // כמה נשאר להוריד/להעלות
    const remaining = Math.abs(currentWeight - targetWeight);
    
    // הקצב הנדרש המקורי
    const goalDuration = (weightGoal.targetDate.getTime() - weightGoal.startDate.getTime()) / (1000 * 60 * 60 * 24);
    const originalDailyRate = Math.abs(weightGoal.startWeight - weightGoal.targetWeight) / goalDuration;
    
    // בדיקה האם הקצב מהיר יותר מהמתוכנן
    const isFasterThanGoal = dailyRate > originalDailyRate;
    
    // חישוב זמן משוער להשגת היעד
    let predictedDaysLeft = 0;
    let predictedDate = null;
    
    if (dailyRate > 0) {
      predictedDaysLeft = Math.ceil(remaining / dailyRate);
      predictedDate = new Date();
      predictedDate.setDate(predictedDate.getDate() + predictedDaysLeft);
    }
    
    return {
      dailyRate,
      predictedDate,
      predictedDaysLeft,
      isFasterThanGoal
    };
  };
  
  const goalProgress = calculateGoalProgress();
  const actualProgress = calculateActualProgress();
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
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-xl text-gray-500">טוען נתונים...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
        {/* סיכום משקל נוכחי */}
        <motion.div 
          className="col-span-1 md:col-span-4 bg-white rounded-xl p-3 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 overflow-hidden"
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
              <FiPlusCircle size={18} />
            </motion.button>
          </div>

            <div className="mb-4">
            {latestWeight > 0 ? (
              <div className="flex flex-col">
                <span className="text-gray-500 text-sm mb-1">משקל נוכחי</span>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-gray-800">{latestWeight}</span>
                  <span className="text-gray-500 mr-1 text-xl">ק"ג</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500">אין נתוני משקל להצגה</div>
            )}
              </div>
              
          <div className="mb-4">
            <span className="text-gray-500 text-sm mb-1">BMI</span>
            <div className="flex items-baseline">
              <span className="text-xl font-bold text-gray-800">{bmi.toFixed(1)}</span>
              <span className={`mr-2 text-sm font-medium ${bmiCategory.color}`}>
                {bmiCategory.text}
              </span>
            </div>
          </div>

          {weightGoal && (
            <div className="pt-3 border-t border-gray-100">
              <div className="flex justify-between items-center mb-1">
                <span className="text-gray-500 text-sm">יעד</span>
                <div className="flex items-center">
                  <span className="text-primary-500 font-bold">
                    {weightGoal.targetWeight} ק"ג
                  </span>
                  <span className="text-gray-400 mx-2">|</span>
                  <span className="text-gray-500 text-sm">
                    {goalProgress.daysLeft} ימים
                  </span>
                </div>
              </div>
              
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                <div 
                  className="bg-primary-500 h-2.5 rounded-full" 
                  style={{ width: `${goalProgress.current}%` }}
                ></div>
              </div>
              
              <div className="text-xs text-gray-500 flex justify-between">
                <span>עוד {goalProgress.required.toFixed(1)} ק"ג</span>
                <span>{goalProgress.current.toFixed(0)}%</span>
                  </div>
                </div>
          )}
          
          {!weightGoal && weightRecords.length > 0 && (
            <button
              onClick={() => setIsSettingGoal(true)}
              className="w-full mt-2 py-2 text-center text-primary-600 bg-primary-50 rounded-md hover:bg-primary-100 transition-colors text-sm"
            >
              הגדר יעד משקל
            </button>
          )}
        </motion.div>

        {/* גרף משקל */}
        <motion.div 
          className="col-span-1 md:col-span-8 bg-white rounded-xl p-3 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100 h-60 sm:h-64"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-green-200 via-blue-200 to-purple-200"></div>
          
          <WeightChart weightRecords={weightRecords} weightGoal={weightGoal} />
        </motion.div>

        {/* אריח תחזית משקל */}
        {weightGoal && weightRecords.some(record => record.date >= weightGoal.startDate) && (
          <motion.div 
            className="col-span-1 md:col-span-12 bg-white rounded-xl p-3 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-purple-200 via-pink-200 to-red-200"></div>
            
            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">תחזית השגת יעד</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
              {/* קצב התקדמות בפועל */}
              <div className="bg-gray-50 p-3 sm:p-4 rounded-lg">
                <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">קצב ההתקדמות שלך:</h4>
                
                {actualProgress.dailyRate > 0 ? (
                  <div className="flex flex-col">
                    <span className="text-base sm:text-xl font-bold text-primary-600">
                      {actualProgress.dailyRate.toFixed(2)} ק"ג ליום
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500 mt-1">
                      בהתבסס על {weightRecords.filter(r => r.date >= weightGoal.startDate).length} מדידות מאז תחילת היעד
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-500">אין מספיק נתונים לחישוב</span>
                )}
              </div>
              
              {/* השוואה לקצב הנדרש */}
              <div className={`p-3 sm:p-4 rounded-lg ${actualProgress.isFasterThanGoal ? 'bg-green-50' : 'bg-yellow-50'}`}>
                <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">הקצב שלך:</h4>
                
                {actualProgress.dailyRate > 0 ? (
                  <div className="flex flex-col">
                    <span className={`text-base sm:text-xl font-bold ${actualProgress.isFasterThanGoal ? 'text-green-600' : 'text-yellow-600'}`}>
                      {actualProgress.isFasterThanGoal ? 'מהיר יותר' : 'איטי יותר'} מהמתוכנן
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500 mt-1">
                      {actualProgress.isFasterThanGoal 
                        ? 'אתה מתקדם מהר יותר ממה שתכננת!' 
                        : 'ייתכן שתצטרך להגביר את הקצב להשגת היעד'}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-500">ממתין לנתונים נוספים</span>
                )}
              </div>
              
              {/* תאריך צפוי להשגת היעד */}
              <div className="bg-blue-50 p-3 sm:p-4 rounded-lg">
                <h4 className="text-xs sm:text-sm font-medium text-gray-500 mb-2">צפי להשגת היעד:</h4>
                
                {actualProgress.predictedDate ? (
                  <div className="flex flex-col">
                    <span className="text-xl font-bold text-blue-600">
                      {actualProgress.predictedDate.toLocaleDateString('he-IL', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric'
                      })}
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500 mt-1">
                      עוד {actualProgress.predictedDaysLeft} ימים לעומת {goalProgress.daysLeft} ימים מקוריים
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-500">לא ניתן לחשב תחזית</span>
                )}
              </div>
            </div>
            
            <div className="mt-3 sm:mt-4 p-2 sm:p-3 rounded-lg border border-gray-200">
              <div className="flex items-center mb-1 sm:mb-2">
                <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                <span className="font-medium text-sm">שינוי במשקל: </span>
                {weightGoal && weightRecords.length > 0 && (
                  <span className="mr-1 text-xs sm:text-sm">
                    {(weightGoal.startWeight - weightRecords[weightRecords.length - 1].weight).toFixed(1)} ק"ג מתוך {Math.abs(weightGoal.startWeight - weightGoal.targetWeight).toFixed(1)} ק"ג
                  </span>
                )}
              </div>
              <div className="flex items-start sm:items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 mt-1 flex-shrink-0"></span>
                <span className="font-medium text-sm">עצה: </span>
                {actualProgress.isFasterThanGoal ? (
                  <span className="mr-1 text-2xs sm:text-sm text-gray-600">
                    אתה מתקדם בקצב טוב! זכור שירידה במשקל איטית ויציבה בריאה יותר לטווח ארוך.
                  </span>
                ) : (
                  <span className="mr-1 text-2xs sm:text-sm text-gray-600">
                    כדי לעמוד ביעד, שקול להגביר את הפעילות הגופנית או לבצע התאמות בתזונה.
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* טבלת נתוני משקל */}
      <motion.div 
        className="bg-white rounded-xl p-3 sm:p-5 shadow-md hover:shadow-lg transition-all duration-300 relative border border-gray-100"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div className="absolute top-0 right-0 left-0 h-0.5 bg-gradient-to-r from-purple-200 via-pink-200 to-red-200"></div>
        
        <div className="flex flex-wrap justify-between items-center mb-3 sm:mb-4">
          <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2 sm:mb-0">היסטוריית משקלים</h3>
          
          <div className="flex gap-2 w-full sm:w-auto justify-end">
            {weightGoal && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSettingGoal(true)}
                className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-primary-50 text-primary-600 rounded-md hover:bg-primary-100 transition-colors flex items-center"
              >
                <FiEdit size={14} className="ml-1" />
                <span>ערוך יעד</span>
              </motion.button>
            )}
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsAddingRecord(true)}
              className="px-2 sm:px-3 py-1 text-xs sm:text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors flex items-center"
            >
              <FiPlusCircle size={14} className="ml-1" />
              <span>הוסף משקל</span>
            </motion.button>
          </div>
        </div>
        
        {weightRecords.length > 0 ? (
          <div className="overflow-x-auto -mx-3 sm:mx-0">
            <table className="w-full text-xs sm:text-sm text-right">
              <thead className="text-2xs sm:text-xs uppercase bg-gray-50 rounded-lg">
                <tr>
                  <th className="px-2 sm:px-4 py-2 font-medium text-gray-500">תאריך</th>
                  <th className="px-2 sm:px-4 py-2 font-medium text-gray-500">משקל</th>
                  <th className="px-2 sm:px-4 py-2 font-medium text-gray-500">שינוי</th>
                  <th className="px-2 sm:px-4 py-2 font-medium text-gray-500 hidden sm:table-cell">מקור</th>
                  <th className="px-2 sm:px-4 py-2 font-medium text-gray-500">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {weightRecords.slice().reverse().map((record, index, arr) => {
                  const prevRecord = index < arr.length - 1 ? arr[index + 1] : null;
                  const weightDiff = prevRecord ? (record.weight - prevRecord.weight).toFixed(1) : "-";
                  const weightDiffColor = 
                    weightDiff === "-" || weightDiff === "0.0" 
                      ? "text-gray-500" 
                      : Number(weightDiff) > 0 
                        ? "text-red-500" 
                        : "text-green-500";
                  
                  return (
                    <tr key={record.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 sm:px-4 py-2 sm:py-3 font-medium">
                        {record.date.toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 font-bold text-gray-700">{record.weight} ק"ג</td>
                      <td className={`px-2 sm:px-4 py-2 sm:py-3 ${weightDiffColor}`}>
                        {weightDiff !== "-" && weightDiff !== "0.0" && (
                          <span>{weightDiff.startsWith('-') ? '' : '+'}{weightDiff}</span>
                        )}
                        {(weightDiff === "-" || weightDiff === "0.0") && "-"}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3 text-gray-500 hidden sm:table-cell">
                        {record.fromCalendar ? 'לוח שנה' : 'ידני'}
                      </td>
                      <td className="px-2 sm:px-4 py-2 sm:py-3">
                        <button
                          onClick={() => deleteWeightRecord(record.id)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                          title="מחק"
                          disabled={record.fromCalendar}
                        >
                          <FiTrash2 size={14} className={record.fromCalendar ? 'opacity-30' : ''} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>אין נתוני משקל להצגה.</p>
            <button
              onClick={() => setIsAddingRecord(true)}
              className="mt-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              הוסף משקל ראשון
            </button>
          </div>
        )}
      </motion.div>

      {/* מודאל להוספת משקל */}
      <Modal
        isOpen={isAddingRecord}
        onClose={() => setIsAddingRecord(false)}
        title="הוספת רשומת משקל"
      >
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">תאריך</label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              className="w-full p-1.5 sm:p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">משקל (ק"ג)</label>
            <input
              type="number"
              step="0.1"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              placeholder="לדוגמה: 70.5"
              className="w-full p-1.5 sm:p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
          </div>
          
          <div className="mt-4 flex justify-end space-x-2 space-x-reverse">
            <button
              type="button"
              onClick={() => setIsAddingRecord(false)}
              className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
            >
              ביטול
            </button>
            <button
              type="button"
              onClick={handleAddWeightRecord}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-xs sm:text-sm"
              disabled={!newWeight || isNaN(Number(newWeight)) || Number(newWeight) <= 0}
            >
              שמור
            </button>
          </div>
        </div>
      </Modal>

      {/* מודאל להגדרת יעד */}
      <Modal
        isOpen={isSettingGoal}
        onClose={() => setIsSettingGoal(false)}
        title={weightGoal ? "עריכת יעד משקל" : "הגדרת יעד משקל"}
      >
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">משקל התחלתי (ק"ג)</label>
              <input
                type="number"
                step="0.1"
                value={startWeight}
                onChange={(e) => setStartWeight(e.target.value)}
                className="w-full p-1.5 sm:p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">משקל יעד (ק"ג)</label>
              <input
                type="number"
                step="0.1"
                value={targetWeight}
                onChange={(e) => setTargetWeight(e.target.value)}
                className="w-full p-1.5 sm:p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">תאריך התחלה</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-1.5 sm:p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">תאריך יעד</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-1.5 sm:p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-between">
            <div>
              {weightGoal && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('האם אתה בטוח שברצונך למחוק את יעד המשקל הנוכחי?')) {
                      deleteWeightGoal();
                      setIsSettingGoal(false);
                    }
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 text-xs sm:text-sm"
                >
                  מחק יעד
                </button>
              )}
            </div>
            
            <div className="flex space-x-2 space-x-reverse">
              <button
                type="button"
                onClick={() => setIsSettingGoal(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-xs sm:text-sm"
              >
                ביטול
              </button>
              <button
                type="button"
                onClick={handleSetWeightGoal}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 text-xs sm:text-sm"
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
              >
                שמור
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default WeightTracker; 