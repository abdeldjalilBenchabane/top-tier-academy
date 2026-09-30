import React, { useState, useEffect, useRef } from 'react';
import {
  FaBars, FaTimes, FaGlobe, FaBook, FaVideo, FaUserLock,
  FaHistory, FaUser, FaSignOutAlt, FaCog, FaCoins
} from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { pointsAPI } from '@/services/api';
import { UserAvatar } from './ui';
import NotificationBell from './ui/NotificationBell';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userPoints, setUserPoints] = useState(0);
  const { user, logout, isAdmin, isProfessor } = useAuth();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  // Check if user is a student (not admin or professor)
  const isStudent = user && !isAdmin && !isProfessor;

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name) => {
    if (!name) return '?';
    return name.charAt(0).toUpperCase();
  };

  // Function to refresh points balance
  const refreshPoints = async () => {
    if (isStudent) {
      try {
        const response = await pointsAPI.getBalance();
        setUserPoints(response.balance || 0);
        console.log('Points refreshed:', response.balance);
      } catch (error) {
        console.error('Error refreshing user points:', error);
      }
    }
  };

  // Expose refresh function globally for admin use
  useEffect(() => {
    if (isStudent) {
      window.refreshUserPoints = refreshPoints;
    }
    return () => {
      delete window.refreshUserPoints;
    };
  }, [isStudent]);

  // Fetch user points on component mount (only for students)
  useEffect(() => {
    const fetchUserPoints = async () => {
      if (isStudent) {
        try {
          const response = await pointsAPI.getBalance();
          setUserPoints(response.balance || 0);
        } catch (error) {
          console.error('Error fetching user points:', error);
        }
      }
    };

    fetchUserPoints();
  }, [isStudent]);

  // Listen for points updates from payment success (only for students)
  useEffect(() => {
    if (!isStudent) return;

    const handlePointsUpdate = (event) => {
      const { points } = event.detail;
      console.log('Points update event received:', points);
      // Refresh the entire balance instead of just adding
      const fetchUserPoints = async () => {
        try {
          const response = await pointsAPI.getBalance();
          setUserPoints(response.balance || 0);
        } catch (error) {
          console.error('Error fetching user points after update:', error);
        }
      };
      fetchUserPoints();
    };

    window.addEventListener('pointsUpdated', handlePointsUpdate);
    return () => window.removeEventListener('pointsUpdated', handlePointsUpdate);
  }, [isStudent]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target) &&
        !document.querySelector('.mobile-menu-button')?.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div dir="rtl">
      {/* Contact Bar - Top Static Bar */}
      <div className="bg-gradient-to-r from-red-600 via-red-500 to-red-600 text-white py-2 overflow-hidden relative z-50">
        <div className="relative w-full">
          <div className="animate-scroll-left-to-right-mobile md:animate-scroll-left-to-right whitespace-nowrap flex items-center gap-4 md:gap-8 text-xs md:text-sm font-medium">
            {/* Multiple duplicates to ensure all info appears on mobile */}
            <span className="inline-block">للاستفسار إتصلوا على الأرقام التالية:</span>
            <span className="inline-block">0777768983</span>
            <span className="inline-block">036008230</span>
            <span className="inline-block">|</span>
            <a href="mailto:toptieracademy.setif@gmail.com" className="inline-block hover:underline whitespace-nowrap">toptieracademy.setif@gmail.com</a>
            {/* Duplicate for seamless loop */}
            <span className="inline-block">للاستفسار إتصلوا على الأرقام التالية:</span>
            <span className="inline-block">0777768983</span>
            <span className="inline-block">036008230</span>
            <span className="inline-block">|</span>
            <a href="mailto:toptieracademy.setif@gmail.com" className="inline-block hover:underline whitespace-nowrap">toptieracademy.setif@gmail.com</a>
          </div>
        </div>
      </div>

      <nav dir="rtl" className="bg-gradient-to-r from-[#194cbf] to-[#61a1ff] text-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3 w-full">

            {/* Logo - Left on mobile, left on desktop */}
            <div className="flex justify-start">
              <Link to="/" className="hover:opacity-90 transition">
                <img 
                  src="/1.png" 
                  alt="TTH Logo" 
                  className="h-10 md:h-16 w-auto"
                />
              </Link>
            </div>

            {/* Mobile Burger Menu - Right side on mobile */}
            <div className="custom:hidden">
              <button onClick={toggleMenu} className="mobile-menu-button text-white focus:outline-none hover:bg-white/20 p-2 rounded transition">
                {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
              </button>
            </div>

            {/* Desktop menu */}
            <div className="hidden custom:flex flex-1 items-center justify-start mr-16 gap-6">
              <Link to="/TTHCourses" className="hover:underline flex items-center whitespace-nowrap hover:text-white/90">
                <FaHistory className="ml-2" /> الحصص المسجلة
              </Link>
              <Link to="/TTHPrivateClasses" className="hover:underline flex items-center whitespace-nowrap hover:text-white/90">
                <FaUserLock className="ml-2" /> الحصص الخاصة
              </Link>
              <Link to="/TTHLiveClasses" className="hover:underline flex items-center whitespace-nowrap hover:text-white/90">
                <FaVideo className="ml-2" /> الحصص المباشرة
              </Link>
              <Link to="/TTHSession" className="hover:underline flex items-center whitespace-nowrap hover:text-white/90">
                <FaBook className="ml-2" /> الدورات
              </Link>
              <Link to="/TTHLanguages" className="hover:underline flex items-center whitespace-nowrap hover:text-white/90">
                <FaGlobe className="ml-2" /> لغات
              </Link>
            </div>

            {/* Auth zone */}
            <div className="flex items-center gap-3 whitespace-nowrap">
              {user && isStudent ? (
                <>
                  {/* Notification Bell for Students */}
                  <NotificationBell />
                  
                  {/* Points/Money Icon for Students */}
                  <Link to="/points" className="flex items-center gap-2 bg-yellow-500 hover:bg-yellow-600 rounded-full px-3 py-2 transition-all duration-200 text-white font-medium">
                    <FaCoins className="w-4 h-4" />
                    <span className="hidden custom:block text-sm">{userPoints.toLocaleString()} دج</span>
                  </Link>
                  
                  <div className="relative" ref={dropdownRef}>
                    <button onClick={toggleDropdown}
                      className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all duration-200">
                      <UserAvatar size="sm" name={user.name} />
                      <span className="hidden custom:block text-sm font-medium hover:text-white/90">
                        {user.name}
                      </span>
                    </button>

                    {/* Dropdown for Students */}
                    {isDropdownOpen && (
                      <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                        <div className="py-2">
                          <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-gray-500">{user.email}</div>
                          </div>
                          <Link to="/profile?tab=overview" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setIsDropdownOpen(false)}>
                            <FaUser className="w-4 h-4" /> الملف الشخصي
                          </Link>
                          <Link to="/profile" className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors" onClick={() => setIsDropdownOpen(false)}>
                            <FaCog className="w-4 h-4" /> الإعدادات
                          </Link>
                          <button onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-right">
                            <FaSignOutAlt className="w-4 h-4" /> تسجيل الخروج
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : !user || (!isStudent && user) ? (
                <>
                  {/* Login/Register buttons for not logged in OR for professors/admins */}
                  <Link to="/login" className="hover:text-blue-200 transition hover:underline">تسجيل الدخول</Link>
                  <Link to="/register" className="bg-white text-blue-600 px-4 py-1 rounded font-bold hover:bg-gray-100 hover:text-blue-700">
                    تلميذ جديد
                  </Link>
                </>
              ) : null}
            </div>

            {/* Empty div for mobile layout balance */}
            <div className="custom:hidden w-10"></div>
          </div>

          {/* Mobile menu */}
          {isMenuOpen && (
            <div ref={mobileMenuRef} className="custom:hidden bg-gradient-to-r from-[#194cbf] via-[#2d6fd8] to-[#61a1ff] pb-4 animate-fadeIn">
              <div className="px-2 pt-2 space-y-3">
                <Link to="/TTHCourses" className="block py-2 px-4 rounded hover:bg-white/20 transition flex items-center" onClick={() => setIsMenuOpen(false)}>
                  <FaHistory className="ml-2" /> الحصص المسجلة
                </Link>
                <Link to="/TTHPrivateClasses" className="block py-2 px-4 rounded hover:bg-white/20 transition flex items-center" onClick={() => setIsMenuOpen(false)}>
                  <FaUserLock className="ml-2" /> الحصص الخاصة
                </Link>
                <Link to="/TTHLiveClasses" className="block py-2 px-4 rounded hover:bg-white/20 transition flex items-center" onClick={() => setIsMenuOpen(false)}>
                  <FaVideo className="ml-2" /> الحصص المباشرة
                </Link>
                <Link to="/TTHSession" className="block py-2 px-4 rounded hover:bg-white/20 transition flex items-center" onClick={() => setIsMenuOpen(false)}>
                  <FaBook className="ml-2" /> الدورات
                </Link>
                <Link to="/TTHLanguages" className="block py-2 px-4 rounded hover:bg-white/20 transition flex items-center" onClick={() => setIsMenuOpen(false)}>
                  <FaGlobe className="ml-2" /> لغات
                </Link>
              </div>
              <div className="mt-4 pt-4 border-t border-blue-500 px-4 space-y-3">
                {user && isStudent ? (
                  <>
                    {/* Notification Bell in mobile menu for Students */}
                    <div className="px-4 py-2">
                      <NotificationBell />
                    </div>
                    
                    {/* Points in mobile menu for Students */}
                    <Link to="/points" className="flex items-center gap-2 py-2 px-4 rounded hover:bg-white/20 transition" onClick={() => setIsMenuOpen(false)}>
                      <FaCoins className="w-4 h-4 text-yellow-400" />
                      <span className="text-sm">{userPoints.toLocaleString()} دج - شراء النقاط</span>
                    </Link>
                    
                    <div className="flex items-center gap-3 py-2 px-4">
                      <UserAvatar size="sm" name={user.name} />
                      <div>
                        <div className="text-sm font-medium">{user.name}</div>
                        <div className="text-xs text-blue-200">{user.email}</div>
                      </div>
                    </div>
                    <Link to="/profile?tab=overview" className="block py-2 px-4 rounded hover:bg-white/20 transition" onClick={() => setIsMenuOpen(false)}>
                      الملف الشخصي
                    </Link>
                    <Link to="/profile" className="block py-2 px-4 rounded hover:bg-white/20 transition" onClick={() => setIsMenuOpen(false)}>
                      الإعدادات
                    </Link>
                    <button onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }} className="block w-full text-right py-2 px-4 rounded hover:bg-red-600/20 text-red-200 transition">
                      تسجيل الخروج
                    </button>
                  </>
                ) : !user || (!isStudent && user) ? (
                  <>
                    {/* Login/Register buttons for not logged in OR for professors/admins */}
                    <Link to="/login" className="block py-2 px-4 rounded hover:bg-white/20 transition text-center" onClick={() => setIsMenuOpen(false)}>
                      تسجيل الدخول
                    </Link>
                    <Link to="/register" className="block bg-white text-blue-600 py-2 px-4 rounded text-center font-medium hover:bg-gray-100 transition" onClick={() => setIsMenuOpen(false)}>
                      تلميذ جديد
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </nav>
    </div>
  );
};

export default Navbar;
