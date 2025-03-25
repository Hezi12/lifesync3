import { collection, doc, getDocs, addDoc, updateDoc, deleteDoc, query, where, orderBy, DocumentData, Timestamp } from 'firebase/firestore';
import { db } from '../config';
import { CalendarEvent, EventCategory } from '../../types';

const EVENTS_COLLECTION = 'calendarEvents';
const CATEGORIES_COLLECTION = 'eventCategories';

// המרת אירוע מ-Firestore לאירוע באפליקציה
const convertEventFromFirestore = (doc: DocumentData): CalendarEvent => {
  const data = doc.data();
  return {
    id: doc.id,
    title: data.title,
    start: data.start.toDate(),
    end: data.end.toDate(),
    categoryId: data.categoryId,
    description: data.description,
    imageUrl: data.imageUrl,
    isWakeUp: data.isWakeUp,
    weight: data.weight,
    isTreadmill: data.isTreadmill,
    distance: data.distance,
    speed: data.speed,
    duration: data.duration
  };
};

// המרת אירוע מהאפליקציה לאירוע ב-Firestore
const convertEventToFirestore = (event: CalendarEvent) => {
  return {
    title: event.title,
    start: Timestamp.fromDate(event.start),
    end: Timestamp.fromDate(event.end),
    categoryId: event.categoryId,
    description: event.description,
    imageUrl: event.imageUrl,
    isWakeUp: event.isWakeUp,
    weight: event.weight,
    isTreadmill: event.isTreadmill,
    distance: event.distance,
    speed: event.speed,
    duration: event.duration
  };
};

// המרת קטגוריה מ-Firestore לקטגוריה באפליקציה
const convertCategoryFromFirestore = (doc: DocumentData): EventCategory => {
  const data = doc.data();
  return {
    id: doc.id,
    name: data.name,
    icon: data.icon,
    color: data.color,
    isDefault: data.isDefault,
    keywords: data.keywords
  };
};

// המרת קטגוריה מהאפליקציה לקטגוריה ב-Firestore
const convertCategoryToFirestore = (category: EventCategory) => {
  return {
    name: category.name,
    icon: category.icon,
    color: category.color,
    isDefault: category.isDefault,
    keywords: category.keywords
  };
};

// אירועים - קבלת כל האירועים של המשתמש
export const getUserEvents = async (userId: string): Promise<CalendarEvent[]> => {
  try {
    const q = query(
      collection(db, EVENTS_COLLECTION),
      where('userId', '==', userId),
      orderBy('start', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    const events: CalendarEvent[] = [];
    
    querySnapshot.forEach((doc) => {
      events.push(convertEventFromFirestore(doc));
    });
    
    return events;
  } catch (error) {
    console.error('שגיאה בקבלת אירועים:', error);
    throw error;
  }
};

// יצירת אירוע חדש
export const createEvent = async (userId: string, event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> => {
  try {
    const docRef = await addDoc(collection(db, EVENTS_COLLECTION), {
      ...convertEventToFirestore(event as CalendarEvent),
      userId,
    });
    
    return {
      id: docRef.id,
      ...event,
    };
  } catch (error) {
    console.error('שגיאה ביצירת אירוע:', error);
    throw error;
  }
};

// עדכון אירוע קיים
export const updateEvent = async (eventId: string, changes: Partial<CalendarEvent>): Promise<void> => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    
    const updates: any = {};
    
    // העתקת כל השדות שהשתנו
    if (changes.title !== undefined) updates.title = changes.title;
    if (changes.start !== undefined) updates.start = Timestamp.fromDate(changes.start);
    if (changes.end !== undefined) updates.end = Timestamp.fromDate(changes.end);
    if (changes.categoryId !== undefined) updates.categoryId = changes.categoryId;
    if (changes.description !== undefined) updates.description = changes.description;
    if (changes.imageUrl !== undefined) updates.imageUrl = changes.imageUrl;
    if (changes.isWakeUp !== undefined) updates.isWakeUp = changes.isWakeUp;
    if (changes.weight !== undefined) updates.weight = changes.weight;
    if (changes.isTreadmill !== undefined) updates.isTreadmill = changes.isTreadmill;
    if (changes.distance !== undefined) updates.distance = changes.distance;
    if (changes.speed !== undefined) updates.speed = changes.speed;
    if (changes.duration !== undefined) updates.duration = changes.duration;
    
    await updateDoc(eventRef, updates);
  } catch (error) {
    console.error('שגיאה בעדכון אירוע:', error);
    throw error;
  }
};

// מחיקת אירוע
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    const eventRef = doc(db, EVENTS_COLLECTION, eventId);
    await deleteDoc(eventRef);
  } catch (error) {
    console.error('שגיאה במחיקת אירוע:', error);
    throw error;
  }
};

// קטגוריות - קבלת כל הקטגוריות של המשתמש
export const getUserCategories = async (userId: string): Promise<EventCategory[]> => {
  try {
    const q = query(
      collection(db, CATEGORIES_COLLECTION),
      where('userId', '==', userId)
    );
    
    const querySnapshot = await getDocs(q);
    const categories: EventCategory[] = [];
    
    querySnapshot.forEach((doc) => {
      categories.push(convertCategoryFromFirestore(doc));
    });
    
    return categories;
  } catch (error) {
    console.error('שגיאה בקבלת קטגוריות:', error);
    throw error;
  }
};

// יצירת קטגוריה חדשה
export const createCategory = async (userId: string, category: Omit<EventCategory, 'id'>): Promise<EventCategory> => {
  try {
    const docRef = await addDoc(collection(db, CATEGORIES_COLLECTION), {
      ...convertCategoryToFirestore(category as EventCategory),
      userId,
    });
    
    return {
      id: docRef.id,
      ...category,
    };
  } catch (error) {
    console.error('שגיאה ביצירת קטגוריה:', error);
    throw error;
  }
};

// עדכון קטגוריה קיימת
export const updateCategory = async (categoryId: string, changes: Partial<EventCategory>): Promise<void> => {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    
    const updates: any = {};
    if (changes.name !== undefined) updates.name = changes.name;
    if (changes.icon !== undefined) updates.icon = changes.icon;
    if (changes.color !== undefined) updates.color = changes.color;
    if (changes.isDefault !== undefined) updates.isDefault = changes.isDefault;
    if (changes.keywords !== undefined) updates.keywords = changes.keywords;
    
    await updateDoc(categoryRef, updates);
  } catch (error) {
    console.error('שגיאה בעדכון קטגוריה:', error);
    throw error;
  }
};

// מחיקת קטגוריה
export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    const categoryRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await deleteDoc(categoryRef);
  } catch (error) {
    console.error('שגיאה במחיקת קטגוריה:', error);
    throw error;
  }
}; 