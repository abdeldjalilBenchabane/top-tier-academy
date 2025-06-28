import React, { useState, useEffect, useRef } from 'react';
import { FaBars, FaTimes, FaGlobe, FaBook, FaVideo, FaUserLock, FaHistory, FaUser, FaSignOutAlt, FaCog } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
    const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Get first letter of user's name for avatar
    const getInitials = (name) => {
        if (!name) return '?';
        return name.charAt(0).toUpperCase();
    };

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        };

        if (isDropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isDropdownOpen]);

    return (
        <nav dir="rtl" className="bg-gradient-to-r from-blue-600 to-purple-700 text-white shadow-lg">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between py-3 w-full">
                    {/* Logo (TTH) on the far right for RTL */}
                    <Link to="/" className="font-bold mr-6 text-xl md:text-2xl  whitespace-nowrap">TTH</Link>

                    {/* Main navigation links */}
                    <div className="hidden md:flex flex-1 items-center justify-start mr-16 gap-6">
                        <Link to="/TTHCourses" className="hover:underline transition flex items-center whitespace-nowrap"><FaHistory className="ml-2" /> الحصص المسجلة</Link>
                        <Link to="/TTHPrivateClasses" className="hover:underline transition flex items-center whitespace-nowrap"><FaUserLock className="ml-2" /> الحصص الخاصة</Link>
                        <Link to="/TTHLiveClasses" className="hover:underline transition flex items-center whitespace-nowrap"><FaVideo className="ml-2" /> الحصص المباشرة</Link>
                        <Link to="/TTHSession" className="hover:underline transition flex items-center whitespace-nowrap"><FaBook className="ml-2" /> الدورات</Link>
                        <Link to="/TTHLanguages" className="hover:underline transition flex items-center whitespace-nowrap"><FaGlobe className="ml-2" /> لغات</Link>
                    </div>

                    {/* Auth actions - Show user avatar when logged in, login/register when not */}
                    <div className="flex items-center gap-3 whitespace-nowrap">
                        {user ? (
                            // User is logged in - show avatar with dropdown
                            <div className="relative" ref={dropdownRef}>
                                <button 
                                    onClick={toggleDropdown}
                                    className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-full p-2 transition-all duration-200"
                                >
                                    <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                                        {getInitials(user.name)}
                                    </div>
                                    <span className="hidden md:block text-sm font-medium">{user.name}</span>
                                </button>
                                
                                {/* Dropdown Menu */}
                                {isDropdownOpen && (
                                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                        <div className="py-2">
                                            <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                                                <div className="font-medium">{user.name}</div>
                                                <div className="text-gray-500">{user.email}</div>
                                            </div>
                                            <Link 
                                                to="/profile" 
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <FaUser className="w-4 h-4" />
                                                الملف الشخصي
                                            </Link>
                                            <Link 
                                                to="/settings" 
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                onClick={() => setIsDropdownOpen(false)}
                                            >
                                                <FaCog className="w-4 h-4" />
                                                الإعدادات
                                            </Link>
                                            <button 
                                                onClick={handleLogout}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-right"
                                            >
                                                <FaSignOutAlt className="w-4 h-4" />
                                                تسجيل الخروج
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // User is not logged in - show login/register buttons
                            <>
                                <Link to="/login" className="hover:text-blue-200 transition">تسجيل الدخول</Link>
                                <Link to="/register" className="bg-white text-blue-600 px-4 py-1 rounded transition font-bold">تلميذ جديد</Link>
                            </>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <div className="md:hidden">
                        <button onClick={toggleMenu} className="text-white focus:outline-none">
                            {isMenuOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-gradient-to-r from-blue-700 to-purple-700 pb-4">
                        <div className="px-2 pt-2 space-y-3">
                            <Link to="/TTHCourses" className="block py-2 px-4 rounded items-center"><FaHistory className="ml-2" /> الحصص المسجلة</Link>
                            <Link to="/TTHPrivateClasses" className="block py-2 px-4 rounded items-center"><FaUserLock className="ml-2" /> الحصص الخاصة</Link>
                            <Link to="/TTHLiveClasses" className="block py-2 px-4 rounded items-center"><FaVideo className="ml-2" /> الحصص المباشرة</Link>
                            <Link to="/TTHSession" className="block py-2 px-4 rounded items-center"><FaBook className="ml-2" /> الدورات</Link>
                            <Link to="/TTHLanguages" className="block py-2 px-4 rounded items-center"><FaGlobe className="ml-2" /> لغات</Link>
                        </div>
                        <div className="mt-4 pt-4 border-t border-blue-500 px-4 space-y-3">
                            {user ? (
                                // Mobile user menu when logged in
                                <>
                                    <div className="flex items-center gap-3 py-2 px-4">
                                        <div className="w-8 h-8 bg-white text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                                            {getInitials(user.name)}
                                        </div>
                                        <div>
                                            <div className="text-sm font-medium">{user.name}</div>
                                            <div className="text-xs text-blue-200">{user.email}</div>
                                        </div>
                                    </div>
                                    <Link to="/profile" className="block py-2 px-4 rounded hover:bg-blue-600">الملف الشخصي</Link>
                                    <Link to="/settings" className="block py-2 px-4 rounded hover:bg-blue-600">الإعدادات</Link>
                                    <button 
                                        onClick={handleLogout}
                                        className="block w-full text-right py-2 px-4 rounded hover:bg-red-600 text-red-200"
                                    >
                                        تسجيل الخروج
                                    </button>
                                </>
                            ) : (
                                // Mobile login/register when not logged in
                                <>
                                    <Link to="/login" className="block py-2 px-4 rounded">تسجيل الدخول</Link>
                                    <Link to="/register" className="block bg-white text-blue-600 py-2 px-4 rounded text-center font-medium">تلميذ جديد</Link>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;