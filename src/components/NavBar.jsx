import React, { useState } from 'react';
import { FaBars, FaTimes, FaGlobe, FaBook, FaVideo, FaUserLock, FaHistory } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
  

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

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

                    {/* Auth actions */}
                    <div className="flex items-center gap-3 whitespace-nowrap">
                        <Link to="/login" className="hover:text-blue-200 transition">تسجيل الدخول</Link>
                        <Link to="/register" className="bg-white text-blue-600 px-4 py-1 rounded transition font-bold">تلميذ جديد</Link>
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
                            <Link to="/login" className="block py-2 px-4 rounded">تسجيل الدخول</Link>
                            <Link to="/register" className="block bg-white text-blue-600 py-2 px-4 rounded text-center font-medium">تلميذ جديد</Link>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
};

export default Navbar;