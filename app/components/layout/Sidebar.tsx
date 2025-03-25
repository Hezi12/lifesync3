'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  FiHome, 
  FiCalendar, 
  FiDollarSign, 
  FiHeart, 
  FiFileText,
  FiSun,
  FiMoon
} from 'react-icons/fi';

export default function Sidebar() {
  const pathname = usePathname();
  
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
      
      <div className="mt-auto mb-6">
        <button
          className="p-2 rounded-full text-gray-500 hover:text-primary-500 hover:bg-gray-100"
          title="מצב לילה/יום"
        >
          <FiSun size={22} />
        </button>
      </div>
    </div>
  );
} 