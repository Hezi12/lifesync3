import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '../config';
import { WeightRecord, WeightGoal, PhysicalActivity } from '../../types';

const WEIGHT_RECORDS_COLLECTION = 'weightRecords';
const WEIGHT_GOALS_COLLECTION = 'weightGoals';
const PHYSICAL_ACTIVITIES_COLLECTION = 'physicalActivities';

// המרות עבור רשומות משקל

const convertWeightRecordFromFirestore = (doc: DocumentData): WeightRecord => {
  const data = doc.data();
  return {
    id: doc.id,
    date: data.date.toDate(),
    weight: data.weight,
    fromCalendar: data.fromCalendar
  };
};

const convertWeightRecordToFirestore = (record: WeightRecord) => {
  return {
    date: Timestamp.fromDate(record.date),
    weight: record.weight,
    fromCalendar: record.fromCalendar
  };
};

// המרות עבור יעדי משקל

const convertWeightGoalFromFirestore = (doc: DocumentData): WeightGoal => {
  const data = doc.data();
  return {
    id: doc.id,
    startWeight: data.startWeight,
    targetWeight: data.targetWeight,
    startDate: data.startDate.toDate(),
    targetDate: data.targetDate.toDate()
  };
};

const convertWeightGoalToFirestore = (goal: WeightGoal) => {
  return {
    startWeight: goal.startWeight,
    targetWeight: goal.targetWeight,
    startDate: Timestamp.fromDate(goal.startDate),
    targetDate: Timestamp.fromDate(goal.targetDate)
  };
};

// המרות עבור פעילות גופנית

const convertPhysicalActivityFromFirestore = (doc: DocumentData): PhysicalActivity => {
  const data = doc.data();
  return {
    id: doc.id,
    date: data.date.toDate(),
    type: data.type,
    duration: data.duration,
    distance: data.distance,
    speed: data.speed,
    fromCalendar: data.fromCalendar
  };
};

const convertPhysicalActivityToFirestore = (activity: PhysicalActivity) => {
  return {
    date: Timestamp.fromDate(activity.date),
    type: activity.type,
    duration: activity.duration,
    distance: activity.distance,
    speed: activity.speed,
    fromCalendar: activity.fromCalendar
  };
};

// רשומות משקל - קבלת כל רשומות המשקל של המשתמש
export const getUserWeightRecords = async (userId: string): Promise<WeightRecord[]> => {
  try {
    const q = query(
      collection(db, WEIGHT_RECORDS_COLLECTION),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const records: WeightRecord[] = [];
    
    querySnapshot.forEach((doc) => {
      records.push(convertWeightRecordFromFirestore(doc));
    });
    
    return records;
  } catch (error) {
    console.error('שגיאה בקבלת רשומות משקל:', error);
    throw error;
  }
};

// יצירת רשומת משקל חדשה
export const createWeightRecord = async (userId: string, record: Omit<WeightRecord, 'id'>): Promise<WeightRecord> => {
  try {
    const docRef = await addDoc(collection(db, WEIGHT_RECORDS_COLLECTION), {
      ...convertWeightRecordToFirestore(record as WeightRecord),
      userId,
    });
    
    return {
      id: docRef.id,
      ...record,
    };
  } catch (error) {
    console.error('שגיאה ביצירת רשומת משקל:', error);
    throw error;
  }
};

// עדכון רשומת משקל קיימת
export const updateWeightRecord = async (recordId: string, changes: Partial<WeightRecord>): Promise<void> => {
  try {
    const recordRef = doc(db, WEIGHT_RECORDS_COLLECTION, recordId);
    
    const updates: any = {};
    if (changes.date !== undefined) updates.date = Timestamp.fromDate(changes.date);
    if (changes.weight !== undefined) updates.weight = changes.weight;
    if (changes.fromCalendar !== undefined) updates.fromCalendar = changes.fromCalendar;
    
    await updateDoc(recordRef, updates);
  } catch (error) {
    console.error('שגיאה בעדכון רשומת משקל:', error);
    throw error;
  }
};

// מחיקת רשומת משקל
export const deleteWeightRecord = async (recordId: string): Promise<void> => {
  try {
    const recordRef = doc(db, WEIGHT_RECORDS_COLLECTION, recordId);
    await deleteDoc(recordRef);
  } catch (error) {
    console.error('שגיאה במחיקת רשומת משקל:', error);
    throw error;
  }
};

// יעדי משקל - קבלת כל יעדי המשקל של המשתמש
export const getUserWeightGoals = async (userId: string): Promise<WeightGoal[]> => {
  try {
    const q = query(
      collection(db, WEIGHT_GOALS_COLLECTION),
      where('userId', '==', userId),
      orderBy('startDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const goals: WeightGoal[] = [];
    
    querySnapshot.forEach((doc) => {
      goals.push(convertWeightGoalFromFirestore(doc));
    });
    
    return goals;
  } catch (error) {
    console.error('שגיאה בקבלת יעדי משקל:', error);
    throw error;
  }
};

// יצירת יעד משקל חדש
export const createWeightGoal = async (userId: string, goal: Omit<WeightGoal, 'id'>): Promise<WeightGoal> => {
  try {
    const docRef = await addDoc(collection(db, WEIGHT_GOALS_COLLECTION), {
      ...convertWeightGoalToFirestore(goal as WeightGoal),
      userId,
    });
    
    return {
      id: docRef.id,
      ...goal,
    };
  } catch (error) {
    console.error('שגיאה ביצירת יעד משקל:', error);
    throw error;
  }
};

// עדכון יעד משקל קיים
export const updateWeightGoal = async (goalId: string, changes: Partial<WeightGoal>): Promise<void> => {
  try {
    const goalRef = doc(db, WEIGHT_GOALS_COLLECTION, goalId);
    
    const updates: any = {};
    if (changes.startWeight !== undefined) updates.startWeight = changes.startWeight;
    if (changes.targetWeight !== undefined) updates.targetWeight = changes.targetWeight;
    if (changes.startDate !== undefined) updates.startDate = Timestamp.fromDate(changes.startDate);
    if (changes.targetDate !== undefined) updates.targetDate = Timestamp.fromDate(changes.targetDate);
    
    await updateDoc(goalRef, updates);
  } catch (error) {
    console.error('שגיאה בעדכון יעד משקל:', error);
    throw error;
  }
};

// מחיקת יעד משקל
export const deleteWeightGoal = async (goalId: string): Promise<void> => {
  try {
    const goalRef = doc(db, WEIGHT_GOALS_COLLECTION, goalId);
    await deleteDoc(goalRef);
  } catch (error) {
    console.error('שגיאה במחיקת יעד משקל:', error);
    throw error;
  }
};

// פעילות גופנית - קבלת כל הפעילויות הגופניות של המשתמש
export const getUserPhysicalActivities = async (userId: string): Promise<PhysicalActivity[]> => {
  try {
    const q = query(
      collection(db, PHYSICAL_ACTIVITIES_COLLECTION),
      where('userId', '==', userId),
      orderBy('date', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const activities: PhysicalActivity[] = [];
    
    querySnapshot.forEach((doc) => {
      activities.push(convertPhysicalActivityFromFirestore(doc));
    });
    
    return activities;
  } catch (error) {
    console.error('שגיאה בקבלת פעילויות גופניות:', error);
    throw error;
  }
};

// יצירת פעילות גופנית חדשה
export const createPhysicalActivity = async (userId: string, activity: Omit<PhysicalActivity, 'id'>): Promise<PhysicalActivity> => {
  try {
    const docRef = await addDoc(collection(db, PHYSICAL_ACTIVITIES_COLLECTION), {
      ...convertPhysicalActivityToFirestore(activity as PhysicalActivity),
      userId,
    });
    
    return {
      id: docRef.id,
      ...activity,
    };
  } catch (error) {
    console.error('שגיאה ביצירת פעילות גופנית:', error);
    throw error;
  }
};

// עדכון פעילות גופנית קיימת
export const updatePhysicalActivity = async (activityId: string, changes: Partial<PhysicalActivity>): Promise<void> => {
  try {
    const activityRef = doc(db, PHYSICAL_ACTIVITIES_COLLECTION, activityId);
    
    const updates: any = {};
    if (changes.date !== undefined) updates.date = Timestamp.fromDate(changes.date);
    if (changes.type !== undefined) updates.type = changes.type;
    if (changes.duration !== undefined) updates.duration = changes.duration;
    if (changes.distance !== undefined) updates.distance = changes.distance;
    if (changes.speed !== undefined) updates.speed = changes.speed;
    if (changes.fromCalendar !== undefined) updates.fromCalendar = changes.fromCalendar;
    
    await updateDoc(activityRef, updates);
  } catch (error) {
    console.error('שגיאה בעדכון פעילות גופנית:', error);
    throw error;
  }
};

// מחיקת פעילות גופנית
export const deletePhysicalActivity = async (activityId: string): Promise<void> => {
  try {
    const activityRef = doc(db, PHYSICAL_ACTIVITIES_COLLECTION, activityId);
    await deleteDoc(activityRef);
  } catch (error) {
    console.error('שגיאה במחיקת פעילות גופנית:', error);
    throw error;
  }
}; 