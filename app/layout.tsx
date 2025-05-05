'use client';

import './globals.css';
import Sidebar from './components/layout/Sidebar';
import { AppProvider } from './context/AppContext';
import { CalendarProvider } from './context/CalendarContext';
import { DocumentsProvider } from './context/DocumentsContext';
import { FinanceProvider } from './context/FinanceContext';
import { AuthProvider } from './context/AuthContext';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="he" dir="rtl">
      <head>
        <title>Life</title>
        <meta name="description" content="אפליקציה לניהול החיים היומיומיים - לוח שנה, ניהול כספים, בריאות, והערות אישיות" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-title" content="Life" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon/apple-touch-icon.png" />
        <link rel="manifest" href="/favicon/manifest.json" />
        <meta name="theme-color" content="#FF8C00" />
      </head>
      <body className="font-sfhebrew">
        <AuthProvider>
          <AppProvider>
            <CalendarProvider>
              <DocumentsProvider>
                <FinanceProvider>
                  <div className="flex">
                    <Sidebar />
                    <main className="flex-grow min-h-screen mr-16 p-6">
                      {children}
                    </main>
                  </div>
                </FinanceProvider>
              </DocumentsProvider>
            </CalendarProvider>
          </AppProvider>
        </AuthProvider>
      </body>
    </html>
  );
} 