'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiCalendar, FiDollarSign, FiHeart, FiHome, FiMenu, FiX } from 'react-icons/fi';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navigation = [
    { name: 'ראשי', href: '/', icon: FiHome },
    { name: 'לוח שנה', href: '/calendar', icon: FiCalendar },
    { name: 'פיננסי', href: '/finance', icon: FiDollarSign },
    { name: 'בריאות', href: '/health', icon: FiHeart },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <nav className="bg-white shadow-md px-4 py-3">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            LifeSync<span className="text-secondary-500">3</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 space-x-reverse">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-300 ${
                  isActive
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
                }`}
              >
                <item.icon className="ml-1.5 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button
            type="button"
            className="text-gray-700 hover:text-primary-500 focus:outline-none"
            onClick={toggleMobileMenu}
          >
            {mobileMenuOpen ? (
              <FiX className="h-6 w-6" />
            ) : (
              <FiMenu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white py-2 absolute z-10 w-full shadow-md">
          <div className="space-y-1 px-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium flex items-center ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <item.icon className="ml-2 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar; 