import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// התצורה הקבועה למקרה שמשתני הסביבה חסרים
const hardcodedConfig = {
  apiKey: "AIzaSyAoDeDUMNx2Jf9eNLmlrakp7xkKUz3Uoho",
  authDomain: "lifesync3-6a6d1.firebaseapp.com",
  projectId: "lifesync3-6a6d1",
  storageBucket: "lifesync3-6a6d1.firebasestorage.app",
  messagingSenderId: "1088422467645",
  appId: "1:1088422467645:web:242dd12441992c4e8df254"
};

// איתחול Firebase עם ערכים מקובץ .env.local או ערכים קבועים אם חסרים
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || hardcodedConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || hardcodedConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || hardcodedConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || hardcodedConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || hardcodedConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || hardcodedConfig.appId,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;

// בדיקה שכל המשתנים הנדרשים קיימים
const validateFirebaseConfig = () => {
  const configToValidate = { ...firebaseConfig };
  const missingKeys = Object.keys(configToValidate).filter(key => !configToValidate[key as keyof typeof configToValidate]);
  
  if (missingKeys.length > 0) {
    console.error('חסרים פרמטרים בתצורת Firebase:', missingKeys);
    return false;
  }
  
  return true;
};

console.log("Firebase config being used:", { 
  ...firebaseConfig, 
  apiKey: firebaseConfig.apiKey ? "***" : "missing", 
  appId: firebaseConfig.appId ? "***" : "missing" 
});

if (!getApps().length) {
  try {
    if (!validateFirebaseConfig()) {
      throw new Error('תצורת Firebase לא תקינה - חסרים פרמטרים חיוניים');
    }

    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    try {
      // הגדרת התמדה לאימות כדי שפרטי המשתמש ישמרו בין רענונים
      setPersistence(auth, browserLocalPersistence)
        .catch(error => {
          console.error('שגיאה בהגדרת התמדה לאימות:', error);
        });
    } catch (error) {
      console.error('שגיאה בהגדרת התמדה לאימות (חריגה תוך כדי קריאה):', error);
    }
  } catch (error) {
    console.error('שגיאה בהתחברות ל-Firebase:', error);
    // יצירת אובייקטים ריקים במקרה של שגיאה
    try {
      // ניסיון אחרון עם הקונפיגורציה הקבועה
      app = initializeApp(hardcodedConfig);
      auth = getAuth(app);
      db = getFirestore(app);
      storage = getStorage(app);
      console.log('Firebase initialized with hardcoded config');
    } catch (initError) {
      console.error('שגיאה גם בניסיון האחרון ליצירת חיבור ל-Firebase:', initError);
      app = {} as FirebaseApp;
      auth = {} as Auth;
      db = {} as Firestore;
      storage = {} as FirebaseStorage;
    }
  }
} else {
  app = getApps()[0];
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
  
  try {
    // הגדרת התמדה לאימות גם במקרה של שימוש באפליקציה קיימת
    setPersistence(auth, browserLocalPersistence)
      .catch(error => {
        console.error('שגיאה בהגדרת התמדה לאימות במצב אפליקציה קיימת:', error);
      });
  } catch (error) {
    console.error('שגיאה בהגדרת התמדה לאימות (חריגה תוך כדי קריאה):', error);
  }
}

export { app, auth, db, storage }; 