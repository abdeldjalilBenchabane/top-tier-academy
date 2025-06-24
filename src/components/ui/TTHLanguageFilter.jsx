import React, { useState } from 'react';
import { FaChevronDown, FaSearch, FaFilter } from 'react-icons/fa';

const languageOptions = [
  { label: 'العربية', value: 'arabic' },
  { label: 'الإنجليزية', value: 'english' },
  { label: 'الفرنسية', value: 'french' },
  { label: 'الإسبانية', value: 'spanish' },
  { label: 'الألمانية', value: 'german' },
];

const levelOptions = [
  { label: 'A1', value: 'A1' },
  { label: 'A2', value: 'A2' },
  { label: 'B1', value: 'B1' },
  { label: 'B2', value: 'B2' },
  { label: 'C1', value: 'C1' },
  { label: 'C2', value: 'C2' },
];

const LanguageFilter = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(languageOptions[0].value);
  const [selectedLevel, setSelectedLevel] = useState(levelOptions[0].value);

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
  };

  const handleLevelChange = (e) => {
    setSelectedLevel(e.target.value);
  };

  const handleSearch = () => {
    alert(`البحث عن دورات:\nاللغة: ${languageOptions.find(l => l.value === selectedLanguage).label}\nالمستوى: ${selectedLevel}`);
  };

  return (
    <div className="w-full flex justify-center mb-8 sm:mb-10" dir="rtl">
      <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl shadow-xl px-4 sm:px-6 py-4 sm:py-4 flex flex-col items-center gap-4 w-full max-w-6xl backdrop-blur-sm relative z-10">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <FaFilter className="text-white text-sm sm:text-lg" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            اختر اللغة والمستوى
          </h3>
        </div>
        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full items-center">
          {/* Language */}
          <div className="relative w-full flex flex-col justify-end min-w-[200px] sm:min-w-[220px] group">
            <label className="block text-gray-700 font-bold mb-2 pr-1 text-sm sm:text-base text-right group-hover:text-blue-600 transition-colors">اللغة</label>
            <div className="relative flex items-center">
              <select
                value={selectedLanguage}
                onChange={handleLanguageChange}
                className="appearance-none w-full bg-white border-2 border-gray-200 text-sm sm:text-base font-bold font-poppins rounded-xl py-2 sm:py-3 pr-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-300 shadow-sm text-right min-w-[200px] sm:min-w-[220px] group-hover:border-blue-300 group-hover:shadow-md"
                dir="rtl"
              >
                {languageOptions.map(lang => (
                  <option key={lang.value} value={lang.value}>{lang.label}</option>
                ))}
              </select>
              <FaChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
          {/* Level */}
          <div className="relative w-full flex flex-col justify-end min-w-[200px] sm:min-w-[220px] group">
            <label className="block text-gray-700 font-bold mb-2 pr-1 text-sm sm:text-base text-right group-hover:text-green-600 transition-colors">المستوى</label>
            <div className="relative flex items-center">
              <select
                value={selectedLevel}
                onChange={handleLevelChange}
                className="appearance-none w-full bg-white border-2 border-gray-200 text-sm sm:text-base font-bold font-poppins rounded-xl py-2 sm:py-3 pr-4 pl-10 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all duration-300 shadow-sm text-right min-w-[200px] sm:min-w-[220px] group-hover:border-green-300 group-hover:shadow-md"
                dir="rtl"
              >
                {levelOptions.map(level => (
                  <option key={level.value} value={level.value}>{level.label}</option>
                ))}
              </select>
              <FaChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-green-500 transition-colors" />
            </div>
          </div>
        </div>
        {/* Search Button */}
        <button 
          onClick={handleSearch}
          className="flex items-center gap-2 sm:gap-3 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold font-poppins leading-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
          style={{ minWidth: '120px' }}
        >
          <FaSearch className="text-lg sm:text-xl" />
          ابحث
        </button>
        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
        <div className="absolute bottom-4 left-4 w-3 h-3 bg-purple-400 rounded-full opacity-40"></div>
      </div>
    </div>
  );
};

export default LanguageFilter; 