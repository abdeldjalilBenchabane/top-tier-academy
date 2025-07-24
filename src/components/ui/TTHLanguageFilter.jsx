import React, { useState } from 'react';
import { FaChevronDown, FaSearch, FaFilter, FaUser, FaTimes } from 'react-icons/fa';

const LanguageFilter = ({ 
  languages = [], 
  languageLevels = [], 
  professors = [],
  selectedLanguage,
  selectedLevel,
  selectedProfessor,
  searchTerm,
  onLanguageChange,
  onLevelChange,
  onProfessorChange,
  onSearchChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Get unique levels from language levels data (filtered by selected language)
  const getLevelOptions = () => {
    if (!selectedLanguage) return [];
    
    const levels = [...new Set(languageLevels
      .filter(ll => ll.language_id === selectedLanguage)
      .map(ll => ll.name))];
    return levels.map(level => ({ label: level, value: level }));
  };

  const levelOptions = getLevelOptions();

  // Get language options from real data
  const getLanguageOptions = () => {
    return languages.map(lang => ({ label: lang.name, value: lang.name }));
  };

  const languageOptions = getLanguageOptions();

  const handleLanguageChange = (e) => {
    onLanguageChange(e.target.value);
    // Reset level when language changes
    onLevelChange('');
  };

  const handleLevelChange = (e) => {
    onLevelChange(e.target.value);
  };

  const handleProfessorChange = (e) => {
    onProfessorChange(e.target.value);
  };

  const handleSearchChange = (e) => {
    onSearchChange(e.target.value);
  };

  const handleClearFilters = () => {
    onLanguageChange('');
    onLevelChange('');
    onProfessorChange('');
    onSearchChange('');
  };

  return (
    <div className="w-full px-4 mb-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        {/* Container principal */}
        <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl overflow-hidden relative">
          {/* Background animé */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-purple-50/30"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>

          {/* Header avec toggle mobile */}
          <div className="relative z-10 p-4 sm:p-6 border-b border-gray-100/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <FaFilter className="text-white text-sm sm:text-lg" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-purple-600 bg-clip-text text-transparent">
                    البحث في دورات اللغات
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 hidden sm:block">
                    حدد اللغة والمستوى والأستاذ المناسب لك
                  </p>
                </div>
              </div>

              {/* Toggle mobile */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="lg:hidden w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-colors duration-200"
              >
                <FaChevronDown className={`text-gray-600 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filters Section */}
          <div className={`relative z-10 transition-all duration-500 ease-in-out ${isCollapsed ? 'max-h-0 overflow-hidden lg:max-h-none lg:overflow-visible' : 'max-h-[1000px]'}`}>
            <div className="p-4 sm:p-6">
              {/* Search Input */}
              <div className="mb-6">
                <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                    البحث في الدورات
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="ابحث في عنوان أو وصف الدورة..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-sm hover:shadow-md text-right"
                    dir="rtl"
                  />
                  <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 mb-6">
                {/* Language Filter */}
                <div className="group">
                  <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-blue-600 transition-colors duration-200">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      اللغة
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedLanguage}
                      onChange={handleLanguageChange}
                      className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer"
                      dir="rtl"
                    >
                      <option value="">جميع اللغات</option>
                      {languageOptions.map(lang => (
                        <option key={lang.value} value={lang.value}>{lang.label}</option>
                      ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <FaChevronDown className="text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                    </div>
                  </div>
                </div>

                {/* Level Filter */}
                <div className="group">
                  <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-green-600 transition-colors duration-200">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      المستوى
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedLevel}
                      onChange={handleLevelChange}
                      disabled={!selectedLanguage}
                      className={`appearance-none w-full backdrop-blur-sm border-2 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none transition-all duration-300 shadow-sm text-right cursor-pointer ${
                        !selectedLanguage 
                          ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed' 
                          : 'bg-white/90 border-gray-200 hover:border-green-300 focus:border-green-500 focus:ring-4 focus:ring-green-100 hover:shadow-md'
                      }`}
                      dir="rtl"
                    >
                      <option value="">
                        {selectedLanguage ? "جميع المستويات" : "اختر اللغة أولاً"}
                      </option>
                      {levelOptions.map(level => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                      ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <FaChevronDown className={`transition-colors duration-200 ${
                        !selectedLanguage ? 'text-gray-300' : 'text-gray-400 group-hover:text-green-500'
                      }`} />
                    </div>
                  </div>
                </div>

                {/* Professor Filter */}
                <div className="group">
                  <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-purple-600 transition-colors duration-200">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      الأستاذ
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedProfessor}
                      onChange={handleProfessorChange}
                      className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer"
                      dir="rtl"
                    >
                      <option value="">جميع الأساتذة</option>
                      {professors.map(professor => (
                        <option key={professor.id} value={professor.id}>{professor.name}</option>
                      ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <FaUser className="text-gray-400 group-hover:text-purple-500 transition-colors duration-200" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1 flex flex-col sm:flex-row xl:flex-col gap-3 xl:justify-end">
                  <button
                    onClick={handleClearFilters}
                    className="flex items-center justify-center gap-3 text-gray-600 px-6 py-3 lg:py-4 rounded-2xl text-sm lg:text-base font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 bg-white border-2 border-gray-200 hover:border-gray-300 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-gray-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <FaTimes className="text-lg relative z-10" />
                    <span className="relative z-10">مسح الفلاتر</span>
                  </button>
                </div>
              </div>

              {/* Selected Filters Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
                <h4 className="text-sm font-bold text-gray-700 mb-2 text-right">الفلاتر المحددة:</h4>
                <div className="flex flex-wrap gap-2 justify-end">
                  {selectedLanguage && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {selectedLanguage}
                    </span>
                  )}
                  {selectedLevel && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {selectedLevel}
                    </span>
                  )}
                  {selectedProfessor && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {professors.find(p => p.id === selectedProfessor)?.name || selectedProfessor}
                    </span>
                  )}
                  {searchTerm && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      "{searchTerm}"
                    </span>
                  )}
                  {!selectedLanguage && !selectedLevel && !selectedProfessor && !searchTerm && (
                    <span className="text-gray-500 text-xs">لا توجد فلاتر محددة</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-8 right-8 w-3 h-3 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
          <div className="absolute bottom-8 left-8 w-2 h-2 bg-purple-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-4 w-1 h-1 bg-purple-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
        </div>
      </div>
    </div>
  );
};

export default LanguageFilter; 