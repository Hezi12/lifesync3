'use client';

import './globals.css';
import Sidebar from './components/layout/Sidebar';
import { AppProvider } from './context/AppContext';
import { CalendarProvider } from './context/CalendarContext';
import { DocumentsProvider } from './context/DocumentsContext';
import { FinanceProvider } from './context/FinanceContext';
import { AuthProvider } from './context/AuthContext';
import { HealthProvider } from './context/HealthContext';
import { useState, useEffect } from 'react';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobile, setIsMobile] = useState(false);
  
  // בדיקה האם המכשיר הוא מובייל
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  return (
    <html lang="he" dir="rtl">
      <head>
        <title>Life</title>
        <meta name="description" content="אפליקציה לניהול החיים היומיומיים - לוח שנה, ניהול כספים, בריאות, והערות אישיות" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-title" content="Life" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="icon" href="/favicon/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.svg" />
        <link rel="apple-touch-icon" sizes="180x180" href="/favicon/apple-touch-icon.svg" />
        <link rel="manifest" href="/favicon/manifest.json" />
        <meta name="theme-color" content="#FF8C00" />
      </head>
      <body className="font-sfhebrew">
        <AuthProvider>
          <AppProvider>
            <CalendarProvider>
              <DocumentsProvider>
                <FinanceProvider>
                  <HealthProvider>
                    <div className="flex">
                      <Sidebar />
                      <main className={`flex-grow min-h-screen p-4 sm:p-6 ${isMobile ? 'pb-16' : 'mr-16'}`}>
                        {children}
                      </main>
                    </div>
                  </HealthProvider>
                </FinanceProvider>
              </DocumentsProvider>
            </CalendarProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 