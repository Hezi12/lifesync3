'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WeightRecord, WeightGoal, PhysicalActivity } from '../types';
import { useAuth } from './AuthContext';
import { 
  getUserWeightRecords, 
  createWeightRecord, 
  updateWeightRecord, 
  deleteWeightRecord,
  getUserWeightGoals,
  createWeightGoal,
  updateWeightGoal,
  deleteWeightGoal,
  getUserPhysicalActivities,
  createPhysicalActivity,
  updatePhysicalActivity,
  deletePhysicalActivity
} from '../firebase/services/healthService';

interface HealthContextType {
  // מצב טעינה ושגיאות
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  
  // נתוני משקל
  weightRecords: WeightRecord[];
  weightGoal: WeightGoal | null;
  
  // פעילות גופנית
  activities: PhysicalActivity[];
  
  // פעולות משקל
  addWeightRecord: (record: Omit<WeightRecord, 'id'>) => Promise<void>;
  updateWeightRecord: (record: WeightRecord) => Promise<void>;
  deleteWeightRecord: (id: string) => Promise<void>;
  
  // פעולות יעדי משקל
  setWeightGoal: (goal: Omit<WeightGoal, 'id'>) => Promise<void>;
  updateWeightGoal: (goal: WeightGoal) => Promise<void>;
  deleteWeightGoal: () => Promise<void>;
  
  // פעולות פעילות גופנית
  addActivity: (activity: Omit<PhysicalActivity, 'id'>) => Promise<void>;
  updateActivity: (activity: PhysicalActivity) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  
  // סנכרון נתונים מלוח שנה
  syncFromCalendar: () => void;
}

// ערך ברירת מחדל לקונטקסט
const defaultContextValue: HealthContextType = {
  isLoading: true,
  error: null,
  isOnline: true,
  
  weightRecords: [],
  weightGoal: null,
  activities: [],
  
  addWeightRecord: async () => {},
  updateWeightRecord: async () => {},
  deleteWeightRecord: async () => {},
  
  setWeightGoal: async () => {},
  updateWeightGoal: async () => {},
  deleteWeightGoal: async () => {},
  
  addActivity: async () => {},
  updateActivity: async () => {},
  deleteActivity: async () => {},
  
  syncFromCalendar: () => {}
};

// יצירת הקונטקסט
const HealthContext = createContext<HealthContextType>(defaultContextValue);

// הוק שימושי לגישה לקונטקסט
export const useHealthContext = () => useContext(HealthContext);

// ספק הקונטקסט
export const HealthProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  
  // נתוני בריאות
  const [weightRecords, setWeightRecords] = useState<WeightRecord[]>([]);
  const [weightGoal, setWeightGoal] = useState<WeightGoal | null>(null);
  const [activities, setActivities] = useState<PhysicalActivity[]>([]);
  
  // האזנה למצב החיבור לאינטרנט
  useEffect(() => {
    const handleOnline = () => {
      console.log('המכשיר מחובר לאינטרנט');
      setIsOnline(true);
      
      // אם חזרנו למצב מקוון ויש משתמש מחובר, ננסה לסנכרן עם Firebase
      if (user) {
        syncDataWithFirebase();
      }
    };
    
    const handleOffline = () => {
      console.log('המכשיר אינו מחובר לאינטרנט');
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // בדיקה ראשונית של מצב החיבור
    setIsOnline(navigator.onLine);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);
  
  // האזנה לשינויי משתמש וטעינת נתונים ראשונית
  useEffect(() => {
    if (user) {
      loadUserData();
    } else {
      // אם אין משתמש מחובר, ננסה לטעון מהזיכרון המקומי
      loadLocalData();
    }
  }, [user]);
  
  // טעינת נתוני המשתמש מ-Firebase
  const loadUserData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // טעינת נתוני משקל
      const remoteWeightRecords = await getUserWeightRecords(user.uid);
      const remoteWeightGoals = await getUserWeightGoals(user.uid);
      const remoteActivities = await getUserPhysicalActivities(user.uid);
      
      // נבדוק אם יש נתונים מקומיים חדשים יותר
      const localWeightRecords = loadLocalWeightRecords();
      const localWeightGoal = loadLocalWeightGoal();
      const localActivities = loadLocalActivities();
      
      // מיזוג הנתונים - עדיפות לנתונים המקומיים אם הם חדשים יותר
      const mergedWeightRecords = mergeRecords(remoteWeightRecords, localWeightRecords);
      const mergedActivities = mergeRecords(remoteActivities, localActivities);
      
      // היעד האחרון הוא הרלוונטי
      const latestGoal = localWeightGoal || (remoteWeightGoals.length > 0 ? remoteWeightGoals[0] : null);
      
      // עדכון המצב
      setWeightRecords(mergedWeightRecords);
      setWeightGoal(latestGoal);
      setActivities(mergedActivities);
      
      // שמירת הנתונים המעודכנים ב-localStorage
      saveLocalWeightRecords(mergedWeightRecords);
      if (latestGoal) saveLocalWeightGoal(latestGoal);
      saveLocalActivities(mergedActivities);
      
      // סנכרון חזרה ל-Firebase אם היו הבדלים
      if (
        JSON.stringify(mergedWeightRecords) !== JSON.stringify(remoteWeightRecords) ||
        JSON.stringify(mergedActivities) !== JSON.stringify(remoteActivities) ||
        (latestGoal && (!remoteWeightGoals.length || JSON.stringify(latestGoal) !== JSON.stringify(remoteWeightGoals[0])))
      ) {
        syncDataWithFirebase();
      }
      
    } catch (error) {
      console.error('שגיאה בטעינת נתוני המשתמש:', error);
      setError('שגיאה בטעינת נתוני בריאות. נא לנסות שוב מאוחר יותר.');
      
      // במקרה של שגיאה, ננסה לטעון מהזיכרון המקומי
      loadLocalData();
    } finally {
      setIsLoading(false);
    }
  };
  
  // טעינת נתונים מהזיכרון המקומי
  const loadLocalData = () => {
    setIsLoading(true);
    
    try {
      const localWeightRecords = loadLocalWeightRecords();
      const localWeightGoal = loadLocalWeightGoal();
      const localActivities = loadLocalActivities();
      
      setWeightRecords(localWeightRecords);
      setWeightGoal(localWeightGoal);
      setActivities(localActivities);
      
    } catch (error) {
      console.error('שגיאה בטעינת נתונים מקומיים:', error);
      setError('שגיאה בטעינת נתונים מקומיים');
      
      // אם גם הנתונים המקומיים לא נטענים, נתחיל עם מערכים ריקים
      setWeightRecords([]);
      setWeightGoal(null);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // מיזוג רשומות מקומיות ומרוחקות - עדיפות לפי מזהה ותאריך עדכון
  const mergeRecords = <T extends { id: string, date: Date }>(remote: T[], local: T[]): T[] => {
    const merged = [...remote];
    
    // מיפוי רשומות מרוחקות לפי מזהה
    const remoteMap = new Map(remote.map(item => [item.id, item]));
    
    // הוספת רשומות מקומיות שלא קיימות ברשומות המרוחקות
    local.forEach(localItem => {
      if (!remoteMap.has(localItem.id)) {
        merged.push(localItem);
      } else {
        // אם הרשומה קיימת בשני המקורות, עדיפות לחדשה יותר
        const remoteItem = remoteMap.get(localItem.id)!;
        if (localItem.date > remoteItem.date) {
          const index = merged.findIndex(item => item.id === localItem.id);
          if (index !== -1) {
            merged[index] = localItem;
          }
        }
      }
    });
    
    // מיון לפי תאריך
    return merged.sort((a, b) => a.date.getTime() - b.date.getTime());
  };
  
  // סנכרון נתונים עם Firebase
  const syncDataWithFirebase = async () => {
    if (!user || !isOnline) return;
    
    try {
      // קבלת הנתונים המעודכנים ביותר מ-Firebase
      const remoteWeightRecords = await getUserWeightRecords(user.uid);
      const remoteWeightGoals = await getUserWeightGoals(user.uid);
      const remoteActivities = await getUserPhysicalActivities(user.uid);
      
      // מיפוי רשומות מרוחקות לפי מזהה
      const remoteWeightMap = new Map(remoteWeightRecords.map(record => [record.id, record]));
      const remoteActivityMap = new Map(remoteActivities.map(activity => [activity.id, activity]));
      
      // סנכרון רשומות משקל
      for (const record of weightRecords) {
        // אם המזהה מתחיל ב- uid, זו רשומה שנוצרה מקומית
        if (record.id.startsWith('local-')) {
          // יצירת רשומה חדשה ב-Firebase
          const { id, ...recordData } = record;
          const newRecord = await createWeightRecord(user.uid, recordData);
          
          // עדכון המזהה ברשימה המקומית
          record.id = newRecord.id;
        } else if (!remoteWeightMap.has(record.id)) {
          // רשומה שיש רק מקומית אבל לא ב-Firebase
          const { id, ...recordData } = record;
          await createWeightRecord(user.uid, recordData);
        }
      }
      
      // סנכרון פעילויות גופניות
      for (const activity of activities) {
        if (activity.id.startsWith('local-')) {
          const { id, ...activityData } = activity;
          const newActivity = await createPhysicalActivity(user.uid, activityData);
          activity.id = newActivity.id;
        } else if (!remoteActivityMap.has(activity.id)) {
          const { id, ...activityData } = activity;
          await createPhysicalActivity(user.uid, activityData);
        }
      }
      
      // סנכרון יעד משקל
      if (weightGoal) {
        if (weightGoal.id.startsWith('local-')) {
          const { id, ...goalData } = weightGoal;
          const newGoal = await createWeightGoal(user.uid, goalData);
          weightGoal.id = newGoal.id;
        } else {
          // בדיקה אם היעד קיים כבר ב-Firebase
          const goalExists = remoteWeightGoals.some(g => g.id === weightGoal.id);
          if (!goalExists) {
            const { id, ...goalData } = weightGoal;
            await createWeightGoal(user.uid, goalData);
          }
        }
      }
      
      // שמירת הנתונים המעודכנים בזיכרון המקומי
      saveLocalWeightRecords(weightRecords);
      if (weightGoal) saveLocalWeightGoal(weightGoal);
      saveLocalActivities(activities);
      
      console.log('סנכרון נתוני בריאות עם Firebase הושלם בהצלחה');
      
    } catch (error) {
      console.error('שגיאה בסנכרון נתונים עם Firebase:', error);
    }
  };
  
  // טעינת רשומות משקל מהזיכרון המקומי
  const loadLocalWeightRecords = (): WeightRecord[] => {
    const storageKey = user ? `weightRecords_${user.uid}` : 'weightRecords';
    const savedRecords = localStorage.getItem(storageKey);
    
    if (savedRecords) {
      try {
        return JSON.parse(savedRecords, (key, value) => {
          if (key === 'date') {
            return new Date(value);
          }
          return value;
        });
      } catch (error) {
        console.error('שגיאה בפענוח רשומות משקל מקומיות:', error);
      }
    }
    
    return [];
  };
  
  // טעינת יעד משקל מהזיכרון המקומי
  const loadLocalWeightGoal = (): WeightGoal | null => {
    const storageKey = user ? `weightGoal_${user.uid}` : 'weightGoal';
    const savedGoal = localStorage.getItem(storageKey);
    
    if (savedGoal) {
      try {
        return JSON.parse(savedGoal, (key, value) => {
          if (key === 'startDate' || key === 'targetDate') {
            return new Date(value);
          }
          return value;
        });
      } catch (error) {
        console.error('שגיאה בפענוח יעד משקל מקומי:', error);
      }
    }
    
    return null;
  };
  
  // טעינת פעילויות גופניות מהזיכרון המקומי
  const loadLocalActivities = (): PhysicalActivity[] => {
    const storageKey = user ? `activities_${user.uid}` : 'activities';
    const savedActivities = localStorage.getItem(storageKey);
    
    if (savedActivities) {
      try {
        return JSON.parse(savedActivities, (key, value) => {
          if (key === 'date') {
            return new Date(value);
          }
          return value;
        });
      } catch (error) {
        console.error('שגיאה בפענוח פעילויות גופניות מקומיות:', error);
      }
    }
    
    return [];
  };
  
  // שמירת רשומות משקל בזיכרון המקומי
  const saveLocalWeightRecords = (records: WeightRecord[]) => {
    const storageKey = user ? `weightRecords_${user.uid}` : 'weightRecords';
    localStorage.setItem(storageKey, JSON.stringify(records));
  };
  
  // שמירת יעד משקל בזיכרון המקומי
  const saveLocalWeightGoal = (goal: WeightGoal) => {
    const storageKey = user ? `weightGoal_${user.uid}` : 'weightGoal';
    localStorage.setItem(storageKey, JSON.stringify(goal));
  };
  
  // שמירת פעילויות גופניות בזיכרון המקומי
  const saveLocalActivities = (activitiesList: PhysicalActivity[]) => {
    const storageKey = user ? `activities_${user.uid}` : 'activities';
    localStorage.setItem(storageKey, JSON.stringify(activitiesList));
  };
  
  // הוספת רשומת משקל חדשה
  const addWeightRecord = async (record: Omit<WeightRecord, 'id'>) => {
    // יצירת מזהה מקומי אם אין משתמש מחובר
    const newRecord: WeightRecord = {
      id: user ? `local-${Date.now()}` : `local-${Date.now()}`,
      ...record
    };
    
    // עדכון המצב המקומי
    const updatedRecords = [...weightRecords, newRecord].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    
    setWeightRecords(updatedRecords);
    saveLocalWeightRecords(updatedRecords);
    
    // סנכרון עם Firebase אם יש משתמש מחובר
    if (user && isOnline) {
      try {
        const { id, ...recordData } = newRecord;
        const createdRecord = await createWeightRecord(user.uid, recordData);
        
        // עדכון המזהה ברשימה המקומית
        const updatedWithId = updatedRecords.map(r => 
          r.id === newRecord.id ? { ...r, id: createdRecord.id } : r
        );
        
        setWeightRecords(updatedWithId);
        saveLocalWeightRecords(updatedWithId);
        
      } catch (error) {
        console.error('שגיאה בשמירת רשומת משקל ב-Firebase:', error);
      }
    }
  };
  
  // עדכון רשומת משקל קיימת
  const updateWeightRecordFn = async (record: WeightRecord) => {
    // עדכון המצב המקומי
    const updatedRecords = weightRecords.map(r => 
      r.id === record.id ? record : r
    );
    
    setWeightRecords(updatedRecords);
    saveLocalWeightRecords(updatedRecords);
    
    // סנכרון עם Firebase אם יש משתמש מחובר
    if (user && isOnline && !record.id.startsWith('local-')) {
      try {
        await updateWeightRecord(record.id, record);
      } catch (error) {
        console.error('שגיאה בעדכון רשומת משקל ב-Firebase:', error);
      }
    }
  };
  
  // מחיקת רשומת משקל
  const deleteWeightRecordFn = async (id: string) => {
    // עדכון המצב המקומי
    const updatedRecords = weightRecords.filter(r => r.id !== id);
    
    setWeightRecords(updatedRecords);
    saveLocalWeightRecords(updatedRecords);
    
    // סנכרון עם Firebase אם יש משתמש מחובר
    if (user && isOnline && !id.startsWith('local-')) {
      try {
        await deleteWeightRecord(id);
      } catch (error) {
        console.error('שגיאה במחיקת רשומת משקל מ-Firebase:', error);
      }
    }
  };
  
  // הגדרת יעד משקל חדש
  const setWeightGoalFn = async (goal: Omit<WeightGoal, 'id'>) => {
    // יצירת מזהה מקומי אם אין משתמש מחובר
    const newGoal: WeightGoal = {
      id: user ? `local-${Date.now()}` : `local-${Date.now()}`,
      ...goal
    };
    
    // עדכון המצב המקומי
    setWeightGoal(newGoal);
    saveLocalWeightGoal(newGoal);
    
    // סנכרון עם Firebase אם יש משתמש מחובר
    if (user && isOnline) {
      try {
        const { id, ...goalData } = newGoal;
        const createdGoal = await createWeightGoal(user.uid, goalData);
        
        // עדכון המזהה ברשימה המקומית
        setWeightGoal({ ...newGoal, id: createdGoal.id });
        saveLocalWeightGoal({ ...newGoal, id: createdGoal.id });
        
      } catch (error) {
        console.error('שגיאה בשמירת יעד משקל ב-Firebase:', error);
      }
    }
  };
  
  // עדכון יעד משקל קיים
  const updateWeightGoalFn = async (goal: WeightGoal) => {
    // עדכון המצב המקומי
    setWeightGoal(goal);
    saveLocalWeightGoal(goal);
    
    // סנכרון עם Firebase אם יש משתמש מחובר
    if (user && isOnline && !goal.id.startsWith('local-')) {
      try {
        await updateWeightGoal(goal.id, goal);
      } catch (error) {
        console.error('שגיאה בעדכון יעד משקל ב-Firebase:', error);
      }
    }
  };
  
  // מחיקת יעד משקל
  const deleteWeightGoalFn = async () => {
    if (!weightGoal) return;
    
    // עדכון המצב המקומי
    setWeightGoal(null);
    const storageKey = user ? `weightGoal_${user.uid}` : 'weightGoal';
    localStorage.removeItem(storageKey);
    
    // סנכרון עם Firebase אם יש משתמש מחובר
    if (user && isOnline && !weightGoal.id.startsWith('local-')) {
      try {
        await deleteWeightGoal(weightGoal.id);
      } catch (error) {
        console.error('שגיאה במחיקת יעד משקל מ-Firebase:', error);
      }
    }
  };
  
  // הוספת פעילות גופנית חדשה
  const addActivity = async (activity: Omit<PhysicalActivity, 'id'>) => {
    // יצירת מזהה מקומי אם אין משתמש מחובר
    const newActivity: PhysicalActivity = {
      id: user ? `local-${Date.now()}` : `local-${Date.now()}`,
      ...activity
    };
    
    // עדכון המצב המקומי
    const updatedActivities = [...activities, newActivity].sort((a, b) => 
      a.date.getTime() - b.date.getTime()
    );
    
    setActivities(updatedActivities);
    saveLocalActivities(updatedActivities);
    
    // סנכרון עם Firebase אם יש משתמש מחובר
    if (user && isOnline) {
      try {
        const { id, ...activityData } = newActivity;
        const createdActivity = await createPhysicalActivity(user.uid, activityData);
        
        // עדכון המזהה ברשימה המקומית
        const updatedWithId = updatedActivities.map(a => 
          a.id === newActivity.id ? { ...a, id: createdActivity.id } : a
        );
        
        setActivities(updatedWithId);
        saveLocalActivities(updatedWithId);
        
      } catch (error) {
        console.error('שגיאה בשמירת פעילות גופנית ב-Firebase:', error);
      }
    }
  };
  
  // עדכון פעילות גופנית קיימת
  const updateActivity = async (activity: PhysicalActivity) => {
    // עדכון המצב המקומי
    const updatedActivities = activities.map(a => 
      a.id === activity.id ? activity : a
    );
    
    setActivities(updatedActivities);
    saveLocalActivities(updatedActivities);
    
    // סנכרון עם Firebase אם יש משתמש מחובר
    if (user && isOnline && !activity.id.startsWith('local-')) {
      try {
        await updatePhysicalActivity(activity.id, activity);
      } catch (error) {
        console.error('שגיאה בעדכון פעילות גופנית ב-Firebase:', error);
      }
    }
  };
  
  // מחיקת פעילות גופנית
  const deleteActivity = async (id: string) => {
    // עדכון המצב המקומי
    const updatedActivities = activities.filter(a => a.id !== id);
    
    setActivities(updatedActivities);
    saveLocalActivities(updatedActivities);
    
    // סנכרון עם Firebase אם יש משתמש מחובר
    if (user && isOnline && !id.startsWith('local-')) {
      try {
        await deletePhysicalActivity(id);
      } catch (error) {
        console.error('שגיאה במחיקת פעילות גופנית מ-Firebase:', error);
      }
    }
  };
  
  // סנכרון נתונים מלוח שנה
  const syncFromCalendar = () => {
    try {
      // בדיקה אם קיימים אירועי לוח שנה בזיכרון המקומי
      const eventsString = localStorage.getItem('calendarEvents');
      if (!eventsString) return;
      
      const parsedEvents = JSON.parse(eventsString);
      if (!Array.isArray(parsedEvents)) return;
      
      // סנכרון נתוני משקל מאירועי השכמה
      const wakeupEvents = parsedEvents.filter(event => 
        event.isWakeUp === true && 
        event.weight && 
        event.weight > 0
      );
      
      if (wakeupEvents.length > 0) {
        // הפיכת אירועי לוח שנה לרשומות משקל
        const wakeupWeightRecords = wakeupEvents.map(event => ({
          id: `calendar-${event.id}`,
          date: new Date(event.start),
          weight: event.weight,
          fromCalendar: true
        }));
        
        // סינון רשומות ישנות מהלוח שנה
        const calendarIds = wakeupWeightRecords.map(record => record.id);
        const filteredRecords = weightRecords.filter(record => {
          if (record.fromCalendar) {
            return calendarIds.includes(record.id);
          }
          
          // עבור רשומות רגילות, נבדוק אם יש רשומה מלוח השנה באותו יום
          const recordDate = record.date.toISOString().split('T')[0];
          const calendarDates = wakeupWeightRecords.map(r => r.date.toISOString().split('T')[0]);
          return !calendarDates.includes(recordDate);
        });
        
        // מיזוג הרשומות החדשות עם הקיימות
        const mergedRecords = [...filteredRecords, ...wakeupWeightRecords].sort(
          (a, b) => a.date.getTime() - b.date.getTime()
        );
        
        // עדכון רק אם יש שינוי
        if (JSON.stringify(mergedRecords) !== JSON.stringify(weightRecords)) {
          setWeightRecords(mergedRecords);
          saveLocalWeightRecords(mergedRecords);
        }
      }
      
      // סנכרון נתוני פעילות מאירועי הליכון
      const treadmillEvents = parsedEvents.filter(event => 
        event.isTreadmill === true && 
        event.duration && 
        (event.distance || event.speed)
      );
      
      if (treadmillEvents.length > 0) {
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
            fromCalendar: true
          };
        });
        
        // בדיקה אם כבר יש לנו פעילויות מאירועי לוח שנה
        const calendarIds = treadmillActivities.map(activity => activity.id);
        const filteredActivities = activities.filter(activity => 
          !activity.fromCalendar || !calendarIds.includes(activity.id)
        );
        
        // מיזוג ומיון של הפעילויות
        const mergedActivities = [...filteredActivities, ...treadmillActivities].sort(
          (a, b) => a.date.getTime() - b.date.getTime()
        );
        
        // עדכון רק אם יש שינוי
        if (JSON.stringify(mergedActivities) !== JSON.stringify(activities)) {
          setActivities(mergedActivities);
          saveLocalActivities(mergedActivities);
        }
      }
      
    } catch (error) {
      console.error('שגיאה בסנכרון נתונים מלוח השנה:', error);
    }
  };
  
  // סנכרון ראשוני עם לוח השנה
  useEffect(() => {
    syncFromCalendar();
    
    // הגדרת בדיקה תקופתית כל 2 דקות
    const intervalId = setInterval(syncFromCalendar, 2 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, []);
  
  return (
    <HealthContext.Provider
      value={{
        isLoading,
        error,
        isOnline,
        
        weightRecords,
        weightGoal,
        activities,
        
        addWeightRecord,
        updateWeightRecord: updateWeightRecordFn,
        deleteWeightRecord: deleteWeightRecordFn,
        
        setWeightGoal: setWeightGoalFn,
        updateWeightGoal: updateWeightGoalFn,
        deleteWeightGoal: deleteWeightGoalFn,
        
        addActivity,
        updateActivity,
        deleteActivity,
        
        syncFromCalendar
      }}
    >
      {children}
    </HealthContext.Provider>
  );
}; 