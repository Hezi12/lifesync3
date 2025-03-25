'use client';

import { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { UserSettings } from '../types';

interface AppContextType {
  theme: 'light' | 'dark' | 'system';
  language: 'he' | 'en';
  userSettings: UserSettings | null;
  isAuthenticated: boolean;
  toggleTheme: () => void;
  updateUserSettings: (settings: Partial<UserSettings>) => void;
  setAuthenticated: (value: boolean) => void;
}

const defaultSettings: UserSettings = {
  theme: 'light',
  language: 'he',
  notifications: true,
  weekStartsOn: 0
};

const defaultContextValue: AppContextType = {
  theme: 'light',
  language: 'he',
  userSettings: defaultSettings,
  isAuthenticated: false,
  toggleTheme: () => {},
  updateUserSettings: () => {},
  setAuthenticated: () => {}
};

const AppContext = createContext<AppContextType>(defaultContextValue);

export const useAppContext = () => useContext(AppContext);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');
  const [language, setLanguage] = useState<'he' | 'en'>('he');
  const [userSettings, setUserSettings] = useState<UserSettings | null>(defaultSettings);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // טעינת הגדרות מה-localStorage
  useEffect(() => {
    const savedSettings = localStorage.getItem('userSettings');
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setUserSettings(parsedSettings);
        setTheme(parsedSettings.theme || 'light');
        setLanguage(parsedSettings.language || 'he');
      } catch (error) {
        console.error('שגיאה בטעינת הגדרות משתמש:', error);
      }
    }
  }, []);

  // שמירת הגדרות ב-localStorage
  useEffect(() => {
    if (userSettings) {
      localStorage.setItem('userSettings', JSON.stringify(userSettings));
    }
  }, [userSettings]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    updateUserSettings({ theme: newTheme });
  };

  const updateUserSettings = (settings: Partial<UserSettings>) => {
    setUserSettings(prev => {
      if (!prev) return { ...defaultSettings, ...settings };
      return { ...prev, ...settings };
    });
  };

  const setAuthenticated = (value: boolean) => {
    setIsAuthenticated(value);
  };

  return (
    <AppContext.Provider value={{
      theme,
      language,
      userSettings,
      isAuthenticated,
      toggleTheme,
      updateUserSettings,
      setAuthenticated
    }}>
      {children}
    </AppContext.Provider>
  );
}; 