import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  setPersistence as firebasePersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { auth } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const setPersistence = async () => {
    try {
      if (typeof firebasePersistence === 'function' && auth) {
        await firebasePersistence(auth, browserLocalPersistence);
        console.log('התמדה לאימות הוגדרה בהצלחה');
      } else {
        console.warn('setPersistence אינה זמינה או auth לא מוגדר כראוי');
      }
    } catch (error) {
      console.error('שגיאה בהגדרת התמדה לאימות:', error);
    }
  };

  useEffect(() => {
    setPersistence();

    let unsubscribe = () => {};
    
    try {
      if (auth && typeof onAuthStateChanged === 'function') {
        unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          setUser(currentUser);
          setIsLoading(false);
          console.log('מצב אימות השתנה:', currentUser?.uid || 'לא מחובר');
        });
      } else {
        console.error('אובייקט auth או פונקציית onAuthStateChanged לא זמינים');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('שגיאה בהאזנה לשינויים במצב האימות:', error);
      setIsLoading(false);
    }

    return () => {
      try {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      } catch (error) {
        console.error('שגיאה בביטול האזנה לשינויים במצב האימות:', error);
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      if (auth && typeof signInWithEmailAndPassword === 'function') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        throw new Error('פונקציית התחברות לא זמינה');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'שגיאה לא ידועה בהתחברות';
      setError('שגיאה בהתחברות: ' + errorMessage);
      throw error;
    }
  };

  const register = async (email: string, password: string) => {
    setError(null);
    try {
      if (auth && typeof createUserWithEmailAndPassword === 'function') {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        throw new Error('פונקציית הרשמה לא זמינה');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'שגיאה לא ידועה בהרשמה';
      setError('שגיאה בהרשמה: ' + errorMessage);
      throw error;
    }
  };

  const logout = async () => {
    setError(null);
    try {
      if (auth && typeof signOut === 'function') {
        await signOut(auth);
      } else {
        throw new Error('פונקציית התנתקות לא זמינה');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'שגיאה לא ידועה בהתנתקות';
      setError('שגיאה בהתנתקות: ' + errorMessage);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}; 