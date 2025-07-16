import React, { useState } from 'react';
import { FaChevronDown, FaSearch, FaFilter, FaTimes } from 'react-icons/fa';

const gradeOptions = [
  { label: 'ابتدائي', years: ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'], subjects: ['اللغة العربية', 'الرياضيات', 'التربية الإسلامية', 'التربية العلمية', 'التربية المدنية', 'اللغة الفرنسية', 'اللغة الإنجليزية'] },
  { label: 'متوسط', years: ['الأولى', 'الثانية', 'الثالثة', 'الرابعة'], subjects: ['اللغة العربية', 'الرياضيات', 'العلوم الطبيعية', 'الفيزياء', 'التاريخ والجغرافيا', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'التربية الإسلامية'] },
  { label: 'ثانوي', years: ['الأولى', 'الثانية', 'الثالثة'], subjects: ['اللغة العربية', 'الرياضيات', 'العلوم الطبيعية', 'الفيزياء', 'الكيمياء', 'التاريخ والجغرافيا', 'الفلسفة', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'العلوم الإسلامية'] },
];

const SearchFilter = () => {
  const [selectedGrade, setSelectedGrade] = useState(gradeOptions[0].label);
  const [selectedYear, setSelectedYear] = useState(gradeOptions[0].years[0]);
  const [selectedSubject, setSelectedSubject] = useState(gradeOptions[0].subjects[0]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Find the current grade object
  const currentGrade = gradeOptions.find(g => g.label === selectedGrade);

  // Update year and subject when grade changes
  const handleGradeChange = (e) => {
    const newGrade = e.target.value;
    const gradeObj = gradeOptions.find(g => g.label === newGrade);
    setSelectedGrade(newGrade);
    setSelectedYear(gradeObj.years[0]);
    setSelectedSubject(gradeObj.subjects[0]);
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  const handleSearch = () => {
    console.log('Searching with filters:', {
      grade: selectedGrade,
      year: selectedYear,
      subject: selectedSubject
    });
    alert(`البحث عن الدورات:\nالمرحلة: ${selectedGrade}\nالسنة: ${selectedYear}\nالمادة: ${selectedSubject}`);
  };

  const resetFilters = () => {
    setSelectedGrade(gradeOptions[0].label);
    setSelectedYear(gradeOptions[0].years[0]);
    setSelectedSubject(gradeOptions[0].subjects[0]);
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
                    البحث المتقدم
                  </h3>
                  <p className="text-sm text-gray-600 mt-1 hidden sm:block">
                    حدد المرحلة الدراسية والمادة المناسبة لك
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
              {/* Filters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 mb-6">
                {/* Grade Filter */}
                <div className="group">
                  <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-blue-600 transition-colors duration-200">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                      المرحلة الدراسية
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedGrade}
                      onChange={handleGradeChange}
                      className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer"
                      dir="rtl"
                    >
                      {gradeOptions.map(g => (
                        <option key={g.label} value={g.label}>{g.label}</option>
                      ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <FaChevronDown className="text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                    </div>
                  </div>
                </div>

                {/* Year Filter */}
                <div className="group">
                  <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-green-600 transition-colors duration-200">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      السنة الدراسية
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedYear}
                      onChange={handleYearChange}
                      className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-green-300 focus:border-green-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-green-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer"
                      dir="rtl"
                    >
                      {currentGrade?.years.map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <FaChevronDown className="text-gray-400 group-hover:text-green-500 transition-colors duration-200" />
                    </div>
                  </div>
                </div>

                {/* Subject Filter */}
                <div className="group">
                  <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-purple-600 transition-colors duration-200">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                      المادة الدراسية
                    </span>
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSubject}
                      onChange={handleSubjectChange}
                      className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer"
                      dir="rtl"
                    >
                      {currentGrade?.subjects.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <FaChevronDown className="text-gray-400 group-hover:text-purple-500 transition-colors duration-200" />
                    </div>
                  </div>
                </div>

                {/* Action Buttons - span full width on mobile, fit content on larger screens */}
                <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1 flex flex-col sm:flex-row xl:flex-col gap-3 xl:justify-end">
                  <button
                    onClick={handleSearch}
                    className="flex items-center justify-center gap-3 text-white px-6 py-3 lg:py-4 rounded-2xl text-sm lg:text-base font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-600 hover:from-blue-700 hover:via-purple-700 hover:to-purple-700 relative overflow-hidden group"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <FaSearch className="text-lg relative z-10" />
                    <span className="relative z-10">البحث الآن</span>
                  </button>

                </div>
              </div>

              {/* Selected Filters Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
                <h4 className="text-sm font-bold text-gray-700 mb-2 text-right">الفلاتر المحددة:</h4>
                <div className="flex flex-wrap gap-2 justify-end">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {selectedGrade}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {selectedYear}
                  </span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {selectedSubject}
                  </span>
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

export default SearchFilter;