import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// איתחול Firebase עם ערכים מקובץ .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// בדיקה שכל המשתנים הנדרשים קיימים
const validateFirebaseConfig = () => {
  const requiredVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('חסרים משתני סביבה הנדרשים לחיבור ל-Firebase:', missingVars);
    return false;
  }
  
  return true;
};

if (!getApps().length) {
  try {
    if (!validateFirebaseConfig()) {
      throw new Error('תצורת Firebase לא תקינה - חסרים משתני סביבה');
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // הגדרת התמדה לאימות כדי שפרטי המשתמש ישמרו בין רענונים
    setPersistence(auth, browserLocalPersistence)
      .catch(error => {
        console.error('שגיאה בהגדרת התמדה לאימות:', error);
      });
  } catch (error) {
    console.error('שגיאה בהתחברות ל-Firebase:', error);
    // יצירת אובייקטים ריקים במקרה של שגיאה
    app = {} as FirebaseApp;
    auth = {} as Auth;
    db = {} as Firestore;
    storage = {} as FirebaseStorage;
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  // הגדרת התמדה לאימות גם במקרה של שימוש באפליקציה קיימת
  setPersistence(auth, browserLocalPersistence)
    .catch(error => {
      console.error('שגיאה בהגדרת התמדה לאימות:', error);
    });
}

export { app, auth, db, storage }; 