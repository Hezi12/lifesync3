import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
  UserCredential,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '../config';
import { User } from '../../types';

// רישום משתמש חדש עם אימייל וסיסמה
export const registerWithEmail = async (email: string, password: string, name: string): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    // עדכון פרופיל המשתמש עם השם שהתקבל
    await updateProfile(firebaseUser, { displayName: name });
    
    return {
      id: firebaseUser.uid,
      name: name,
      email: firebaseUser.email || email,
      imageUrl: firebaseUser.photoURL || '',
    };
  } catch (error) {
    console.error('שגיאה ברישום משתמש:', error);
    throw error;
  }
};

// התחברות עם אימייל וסיסמה
export const loginWithEmail = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;
    
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'משתמש',
      email: firebaseUser.email || email,
      imageUrl: firebaseUser.photoURL || '',
    };
  } catch (error) {
    console.error('שגיאה בהתחברות:', error);
    throw error;
  }
};

// התחברות עם חשבון גוגל
export const loginWithGoogle = async (): Promise<User> => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const firebaseUser = userCredential.user;
    
    return {
      id: firebaseUser.uid,
      name: firebaseUser.displayName || 'משתמש גוגל',
      email: firebaseUser.email || '',
      imageUrl: firebaseUser.photoURL || '',
    };
  } catch (error) {
    console.error('שגיאה בהתחברות עם גוגל:', error);
    throw error;
  }
};

// שליחת אימייל לאיפוס סיסמה
export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('שגיאה בשליחת אימייל לאיפוס סיסמה:', error);
    throw error;
  }
};

// התנתקות מהמערכת
export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('שגיאה בהתנתקות:', error);
    throw error;
  }
};

// המרת משתמש Firebase למשתמש באפליקציה
export const convertFirebaseUserToAppUser = (firebaseUser: FirebaseUser): User => {
  return {
    id: firebaseUser.uid,
    name: firebaseUser.displayName || 'משתמש',
    email: firebaseUser.email || '',
    imageUrl: firebaseUser.photoURL || '',
  };
};

// קבלת המשתמש הנוכחי
export const getCurrentUser = (): FirebaseUser | null => {
  return auth.currentUser;
};

// האזנה לשינויים במצב האימות
export const onAuthStateChange = (callback: (user: User | null) => void): () => void => {
  return onAuthStateChanged(auth, (firebaseUser) => {
    if (firebaseUser) {
      const appUser = convertFirebaseUserToAppUser(firebaseUser);
      callback(appUser);
    } else {
      callback(null);
    }
  });
}; 