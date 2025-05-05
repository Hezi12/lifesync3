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
  FiUser,
  FiMenu,
  FiX
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  
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
  
  // סגירת התפריט אחרי לחיצה על לינק במובייל
  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };
  
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

  // אנימציות לתפריט הנפתח
  const sidebarVariants = {
    open: { 
      x: 0,
      transition: { type: "spring", stiffness: 300, damping: 30 }
    },
    closed: { 
      x: "100%",
      transition: { type: "spring", stiffness: 300, damping: 30 }
    }
  };

  // כפתור ההמבורגר במובייל
  const MobileMenuButton = () => (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white shadow-md text-primary-600"
      aria-label={isOpen ? "סגור תפריט" : "פתח תפריט"}
    >
      {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
    </button>
  );

  return (
    <>
      {/* כפתור המבורגר למובייל */}
      {isMobile && <MobileMenuButton />}
      
      {/* אוברליי כהה מאחורי התפריט במובייל */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* התפריט עצמו */}
      <AnimatePresence>
        {(!isMobile || (isMobile && isOpen)) && (
          <motion.div
            className={`h-screen w-16 fixed right-0 top-0 bg-white shadow-md z-30 flex flex-col items-center py-6 ${
              isMobile ? "w-64" : "w-16"
            }`}
            variants={sidebarVariants}
            initial={isMobile ? "closed" : "open"}
            animate="open"
            exit="closed"
          >
            <div className="mb-6">
              <Link href="/" className="text-primary-500 font-bold" onClick={handleLinkClick}>
                <span className="text-lg block">LS</span>
                <span className="text-xs block">3</span>
              </Link>
            </div>
            
            <div className="flex flex-col items-center space-y-8 flex-grow w-full">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleLinkClick}
                  className={`p-2 rounded-full transition-colors duration-200 flex items-center justify-center ${
                    isMobile ? "w-full justify-start px-6 rounded-full" : ""
                  } ${
                    isActive(link.href)
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-500 hover:text-primary-500 hover:bg-gray-100'
                  }`}
                  title={link.label}
                >
                  {link.icon}
                  {isMobile && <span className="mr-3">{link.label}</span>}
                </Link>
              ))}
            </div>
            
            <div className="mt-auto mb-6 flex flex-col items-center space-y-4 w-full">
              <button
                className={`p-2 rounded-full text-gray-500 hover:text-primary-500 hover:bg-gray-100 ${
                  isMobile ? "w-full flex items-center px-6" : ""
                }`}
                title="מצב לילה/יום"
              >
                <FiSun size={22} />
                {isMobile && <span className="mr-3">מצב יום/לילה</span>}
              </button>
              
              <div className={`relative ${isMobile ? "w-full" : ""}`}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`${isMobile ? "w-full flex items-center px-6 py-2 rounded-lg" : "w-10 h-10 rounded-full flex items-center justify-center"} ${
                    user ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'
                  }`}
                  title={user?.email || 'משתמש לא מחובר'}
                >
                  {isMobile ? (
                    <>
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary-200">
                        {user ? getUserInitials() : <FiUser size={18} />}
                      </div>
                      <span className="mr-3 text-sm truncate">
                        {user?.email || 'משתמש לא מחובר'}
                      </span>
                    </>
                  ) : (
                    <>{user ? getUserInitials() : <FiUser size={18} />}</>
                  )}
                </button>
                
                {!isMobile && showUserMenu && (
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
                        onClick={handleLinkClick}
                      >
                        <FiUser className="ml-2" />
                        <span>התחבר</span>
                      </Link>
                    )}
                  </div>
                )}
                
                {isMobile && user && (
                  <button
                    onClick={handleLogout}
                    className="w-full mt-2 px-6 py-2 text-sm text-right flex items-center text-red-600 hover:bg-red-50"
                  >
                    <FiLogOut className="ml-2" />
                    <span>התנתק</span>
                  </button>
                )}
                
                {isMobile && !user && (
                  <Link 
                    href="/login"
                    className="w-full mt-2 px-6 py-2 text-sm text-right flex items-center text-primary-600 hover:bg-primary-50"
                    onClick={handleLinkClick}
                  >
                    <FiUser className="ml-2" />
                    <span>התחבר</span>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 