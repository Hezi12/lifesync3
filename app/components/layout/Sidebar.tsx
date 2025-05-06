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
      className="fixed bottom-4 right-4 z-50 p-4 rounded-full bg-gradient-to-tr from-primary-500 to-primary-400 shadow-lg shadow-primary-200/50 text-white hover:shadow-xl hover:scale-105 transition-all duration-300"
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
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 transition-all duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* התפריט עצמו */}
      <AnimatePresence>
        {(!isMobile || (isMobile && isOpen)) && (
          <motion.div
            className={`h-screen fixed right-0 top-0 bg-white/90 backdrop-blur-md z-30 flex flex-col items-center py-6 border-l border-gray-100 shadow-xl ${
              isMobile ? "w-64" : "w-16"
            }`}
            variants={sidebarVariants}
            initial={isMobile ? "closed" : "open"}
            animate="open"
            exit="closed"
          >
            <div className="mb-8">
              <Link href="/" className="relative p-2 block" onClick={handleLinkClick}>
                <div className="absolute inset-0 bg-gradient-to-tr from-primary-500 to-primary-400 rounded-xl opacity-10"></div>
                <div className="relative flex flex-col items-center justify-center font-bold">
                  <span className="text-2xl text-primary-600 tracking-tighter">LS</span>
                  <span className="text-xs text-primary-500 -mt-1">3</span>
                </div>
              </Link>
            </div>
            
            <div className="flex flex-col items-center space-y-6 flex-grow w-full">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={handleLinkClick}
                  className={`group relative overflow-hidden p-3 rounded-xl transition-all duration-300 flex items-center justify-center ${
                    isMobile ? "w-[90%] justify-start px-6" : "w-12 h-12"
                  } ${
                    isActive(link.href)
                      ? 'bg-gradient-to-tr from-primary-500 to-primary-400 text-white shadow-md shadow-primary-200/40'
                      : 'text-gray-500 hover:text-primary-500 hover:bg-gray-50'
                  }`}
                  title={link.label}
                >
                  <motion.span
                    className={isActive(link.href) ? "" : "group-hover:scale-110 transition-transform duration-300"}
                  >
                    {link.icon}
                  </motion.span>
                  {isMobile && <span className={`mr-3 font-medium ${isActive(link.href) ? 'text-white' : ''}`}>{link.label}</span>}
                  {!isActive(link.href) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 group-hover:w-1/2 bg-primary-400 transition-all duration-300"></span>
                  )}
                </Link>
              ))}
            </div>
            
            <div className="mt-auto mb-6 flex flex-col items-center space-y-5 w-full">
              <button
                className={`relative p-3 rounded-xl transition-all duration-300 ${
                  isMobile ? "w-[90%] flex items-center px-6" : "w-12 h-12"
                } text-gray-500 hover:text-primary-500 hover:bg-gray-50 group`}
                title="מצב לילה/יום"
              >
                <motion.span className="group-hover:rotate-45 transition-transform duration-500">
                  <FiSun size={22} />
                </motion.span>
                {isMobile && <span className="mr-3 font-medium">מצב יום/לילה</span>}
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-0 group-hover:w-1/2 bg-primary-400 transition-all duration-300"></span>
              </button>
              
              <div className={`relative ${isMobile ? "w-[90%]" : ""}`}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className={`${isMobile ? "w-full flex items-center px-6 py-3 rounded-xl" : "w-12 h-12 rounded-full flex items-center justify-center"} ${
                    user ? 'bg-gradient-to-tr from-primary-500/10 to-primary-400/10 hover:from-primary-500/20 hover:to-primary-400/20 text-primary-600 transition-all duration-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-300'
                  }`}
                  title={user?.email || 'משתמש לא מחובר'}
                >
                  {isMobile ? (
                    <>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center bg-gradient-to-tr from-primary-500 to-primary-400 text-white shadow-sm">
                        {user ? getUserInitials() : <FiUser size={18} />}
                      </div>
                      <span className="mr-3 text-sm truncate font-medium">
                        {user?.email || 'משתמש לא מחובר'}
                      </span>
                    </>
                  ) : (
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-tr from-primary-500 to-primary-400 text-white shadow-sm">
                      {user ? getUserInitials() : <FiUser size={18} />}
                    </div>
                  )}
                </button>
                
                {!isMobile && showUserMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute left-16 bottom-0 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg py-2 w-56 text-right border border-gray-100"
                  >
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium truncate text-gray-700">{user.email}</p>
                          <p className="text-xs text-primary-500 mt-1 flex items-center">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full inline-block ml-1"></span>
                            מחובר
                          </p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full px-4 py-2.5 text-sm text-right flex items-center text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <FiLogOut className="ml-2" />
                          <span>התנתק</span>
                        </button>
                      </>
                    ) : (
                      <Link 
                        href="/login"
                        className="w-full px-4 py-2.5 text-sm text-right flex items-center text-gray-700 hover:bg-primary-50 hover:text-primary-600 transition-colors"
                        onClick={handleLinkClick}
                      >
                        <FiUser className="ml-2" />
                        <span>התחבר</span>
                      </Link>
                    )}
                  </motion.div>
                )}
                
                {isMobile && user && (
                  <button
                    onClick={handleLogout}
                    className="w-full mt-3 px-6 py-2.5 text-sm text-right flex items-center text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                  >
                    <FiLogOut className="ml-2" />
                    <span>התנתק</span>
                  </button>
                )}
                
                {isMobile && !user && (
                  <Link 
                    href="/login"
                    className="w-full mt-3 px-6 py-2.5 text-sm text-right flex items-center text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-xl transition-colors"
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