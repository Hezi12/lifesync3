'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FiHome, 
  FiCalendar, 
  FiDollarSign, 
  FiHeart, 
  FiFileText,
  FiSun,
  FiMoon,
  FiLogOut,
  FiUser
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const isActive = (path: string) => {
    return pathname === path;
  };
  
  const links = [
    { href: '/', icon: <FiHome size={22} />, label: 'ראשי' },
    { href: '/calendar', icon: <FiCalendar size={22} />, label: 'לוח שנה' },
    { href: '/finance', icon: <FiDollarSign size={22} />, label: 'פיננסי' },
    { href: '/health', icon: <FiHeart size={22} />, label: 'בריאות' },
    { href: '/documents', icon: <FiFileText size={22} />, label: 'מסמכים' },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('שגיאה בהתנתקות:', error);
    }
  };

  const getUserInitials = () => {
    if (!user) return '?';
    
    if (user.displayName) {
      const nameParts = user.displayName.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[1][0]}`.toUpperCase();
      }
      return nameParts[0][0].toUpperCase();
    }
    
    if (user.email) {
      return user.email[0].toUpperCase();
    }
    
    return '?';
  };

  return (
    <div className="h-screen w-16 fixed right-0 top-0 bg-white shadow-md z-10 flex flex-col items-center py-6">
      <div className="mb-6">
        <Link href="/" className="text-primary-500 font-bold">
          <span className="text-lg block">LS</span>
          <span className="text-xs block">3</span>
        </Link>
      </div>
      
      <div className="flex flex-col items-center space-y-8 flex-grow">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`p-2 rounded-full transition-colors duration-200 flex items-center justify-center ${
              isActive(link.href)
                ? 'bg-primary-100 text-primary-600'
                : 'text-gray-500 hover:text-primary-500 hover:bg-gray-100'
            }`}
            title={link.label}
          >
            {link.icon}
          </Link>
        ))}
      </div>
      
      <div className="mt-auto mb-6 flex flex-col items-center space-y-4">
        <button
          className="p-2 rounded-full text-gray-500 hover:text-primary-500 hover:bg-gray-100"
          title="מצב לילה/יום"
        >
          <FiSun size={22} />
        </button>
        
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              user ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
            }`}
            title={user?.email || 'משתמש לא מחובר'}
          >
            {user ? getUserInitials() : <FiUser size={18} />}
          </button>
          
          {showUserMenu && (
            <div className="absolute left-16 bottom-0 bg-white rounded-md shadow-md py-2 w-48 text-right">
              {user ? (
                <>
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-medium truncate">{user.email}</p>
                    <p className="text-xs text-gray-500">מחובר</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 text-sm text-right flex items-center text-gray-700 hover:bg-gray-100"
                  >
                    <FiLogOut className="ml-2" />
                    <span>התנתק</span>
                  </button>
                </>
              ) : (
                <Link 
                  href="/login"
                  className="w-full px-4 py-2 text-sm text-right flex items-center text-gray-700 hover:bg-gray-100"
                >
                  <FiUser className="ml-2" />
                  <span>התחבר</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 