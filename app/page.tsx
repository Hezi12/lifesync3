'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from './context/AuthContext';
import { FiCalendar, FiFileText, FiDollarSign, FiHeart } from 'react-icons/fi';
import Link from 'next/link';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // אם המשתמש לא מחובר, ניתוב לדף התחברות
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-xl text-gray-500">טוען...</div>
        </div>
      </div>
    );
  }

  // אם המשתמש לא מחובר, לא מציגים תוכן
  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-8">ברוך הבא ל-LifeSync</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/calendar" className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center">
          <div className="bg-blue-100 p-4 rounded-full mr-4">
            <FiCalendar className="text-blue-600 text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">לוח שנה</h2>
            <p className="text-gray-600">נהל את האירועים והפגישות שלך</p>
          </div>
        </Link>
        
        <Link href="/documents" className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center">
          <div className="bg-green-100 p-4 rounded-full mr-4">
            <FiFileText className="text-green-600 text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">מסמכים</h2>
            <p className="text-gray-600">נהל את המסמכים והרשימות שלך</p>
          </div>
        </Link>
        
        <Link href="/finance" className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center">
          <div className="bg-yellow-100 p-4 rounded-full mr-4">
            <FiDollarSign className="text-yellow-600 text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">ניהול פיננסי</h2>
            <p className="text-gray-600">עקוב אחר ההוצאות וההכנסות שלך</p>
          </div>
        </Link>
        
        <Link href="/health" className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex items-center">
          <div className="bg-red-100 p-4 rounded-full mr-4">
            <FiHeart className="text-red-600 text-2xl" />
          </div>
          <div>
            <h2 className="text-xl font-semibold mb-2">בריאות</h2>
            <p className="text-gray-600">עקוב אחר הבריאות והכושר שלך</p>
          </div>
        </Link>
      </div>
    </div>
  );
} 