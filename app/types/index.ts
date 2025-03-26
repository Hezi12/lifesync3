// משתמש
export interface User {
  id: string;
  name: string;
  email: string;
  imageUrl: string;
}

// הגדרות משתמש
export interface UserSettings {
  theme: 'light' | 'dark' | 'system';
  language: 'he' | 'en';
  notifications: boolean;
  weekStartsOn: 0 | 1 | 6; // 0 = ראשון, 1 = שני, 6 = שבת
}

// קטגוריה של אירוע בלוח שנה
export interface EventCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  isDefault?: boolean;
  keywords?: string[]; // מילות מפתח לזיהוי אוטומטי
}

// אירוע בלוח שנה
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  categoryId: string; // מזהה של קטגוריה
  description?: string; // תיאור מורחב או הערות
  imageUrl?: string; // כתובת תמונה לאירוע
  
  // שדות לאירועי השכמה
  isWakeUp?: boolean;
  weight?: number; // משקל בק"ג
  
  // שדות לאירועי הליכון
  isTreadmill?: boolean;
  distance?: number; // מרחק בק"מ
  speed?: number; // מהירות בקמ"ש
  duration?: number; // זמן בדקות
}

export type CalendarViewType = 'daily' | 'weekly' | 'monthly' | 'agenda';

// משימה יומית
export interface DailyTask {
  id: string;
  text: string;
  completed: boolean;
  date: Date;
}

// רשומת יומן
export interface JournalEntry {
  id: string;
  date: Date;
  content: string;
  attachments?: string[]; // מערך URL של קבצים מצורפים
}

// תיעוד יומי
export interface DailyLog {
  id: string;
  date: Date;
  content: string;
}

// מסמך
export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

// פתק בדף הראשי
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  tags?: string[];
}

// שיטת תשלום
export interface PaymentMethod {
  id: string;
  name: string;
  initialBalance: number;
  currentBalance: number;
  icon: string;
  color: string;
  keywords?: string[]; // מילות מפתח לזיהוי אוטומטי של אמצעי תשלום
}

// קטגוריה פיננסית
export interface FinancialCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentId?: string; // לתתי-קטגוריות
  type: 'income' | 'expense';
  keywords?: string[]; // מילות מפתח לזיהוי אוטומטי של קטגוריה
}

// עסקה (הכנסה או הוצאה)
export interface Transaction {
  id: string;
  amount: number;
  date: Date;
  description: string;
  categoryId: string;
  paymentMethodId: string;
  type: 'income' | 'expense';
}

// חוב או הלוואה
export interface DebtLoan {
  id: string;
  personName: string;
  amount: number;
  dueDate?: Date | null; // מאפשר גם null וגם undefined
  notes?: string;
  paymentMethodId?: string;
  isDebt: boolean; // true = חוב (אני חייב), false = הלוואה (חייבים לי)
  isPaid: boolean;
}

// התראה או תזכורת
export interface Notification {
  id: string;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  type: 'reminder' | 'alert' | 'info';
}

// נתוני משקל
export interface WeightRecord {
  id: string;
  date: Date;
  weight: number;
  fromCalendar?: boolean; // האם רשומת המשקל מקורה באירוע מלוח השנה
}

// יעד משקל
export interface WeightGoal {
  id: string;
  startWeight: number;
  targetWeight: number;
  startDate: Date;
  targetDate: Date;
}

// פעילות גופנית
export interface PhysicalActivity {
  id: string;
  date: Date;
  type: string; // למשל: 'הליכון', 'ריצה', 'אופניים'
  duration: number; // בדקות
  distance?: number; // בק"מ
  speed?: number; // בקמ"ש
  fromCalendar?: boolean; // האם הפעילות מקורה באירוע מלוח השנה
}

// פירוט נסיעה
export interface TravelLog {
  id: string;
  date: Date;
  startLocation: string;
  endLocation: string;
  distance: number;
  purpose: string;
  vehicleId: string;
}

// רכב
export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  make: string;
  model: string;
  year: number;
  fuelType: 'petrol' | 'diesel' | 'electric' | 'hybrid';
  fuelEfficiency: number; // ליטר/100 ק"מ
} 