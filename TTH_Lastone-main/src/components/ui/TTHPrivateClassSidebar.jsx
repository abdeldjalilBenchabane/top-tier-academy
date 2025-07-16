import React, { useState } from 'react';
import { FaSearch, FaGraduationCap, FaBookOpen, FaCalendarAlt, FaFilter } from 'react-icons/fa';

const PrivateClassSidebar = ({ onFilterChange, onSearch }) => {
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const gradeOptions = [
    {
      name: 'إبتدائي',
      icon: FaGraduationCap,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
      years: [
        'الأولى إبتدائي',
        'الثانية إبتدائي',
        'الثالثة إبتدائي',
        'الرابعة إبتدائي',
        'الخامسة إبتدائي'
      ]
    },
    {
      name: 'متوسط',
      icon: FaBookOpen,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      years: [
        'الأولى متوسط',
        'الثانية متوسط',
        'الثالثة متوسط',
        'الرابعة متوسط'
      ]
    },
    {
      name: 'ثانوي',
      icon: FaCalendarAlt,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
      years: [
        'الأولى ج م علوم ثانوي',
        'الثانية علوم تجريبية ثانوي',
        'الثالثة علوم تجريبية ثانوي',
        'الأولى ج م آداب ثانوي',
        'الثانية آداب و فلسفة ثانوي',
        'الثانية رياضيات ثانوي',
        'الثانية لغات أجنبية ثانوي',
        'الثانية تقني رياضي ثانوي',
        'الثانية تسيير واقتصاد ثانوي',
        'الثالثة آداب و فلسفة ثانوي',
        'الثالثة رياضيات ثانوي',
        'الثالثة لغات أجنبية ثانوي',
        'الثالثة تقني رياضي ثانوي',
        'الثالثة تسيير و اقتصاد ثانوي'
      ]
    }
  ];

  const handleGradeClick = (gradeName) => {
    setSelectedGrade(gradeName);
    setSelectedYear('');
    onFilterChange({ grade: gradeName, year: '' });
  };

  const handleYearClick = (yearName) => {
    setSelectedYear(yearName);
    onFilterChange({ grade: selectedGrade, year: yearName });
  };

  const handleSearch = () => {
    onSearch({ grade: selectedGrade, year: selectedYear });
  };

  const currentGrade = gradeOptions.find(g => g.name === selectedGrade);

  return (
    <div className="w-full lg:w-80" dir="rtl">
      <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl shadow-xl p-4 sm:p-6 backdrop-blur-sm" >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <FaFilter className="text-white text-lg" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            السنة الدراسية
          </h3>
        </div>

        {/* Subtitle */}
        <p className="text-sm sm:text-base text-gray-600 mb-6 text-right">
          اختر المرحلة والسنة
        </p>

        {/* Grade Selection */}
        <div className="space-y-4 mb-6">
          {gradeOptions.map((grade) => (
            <div key={grade.name} className="relative">
              <input
                type="radio"
                id={grade.name}
                name="grade"
                value={grade.name}
                className="sr-only"
                onChange={() => handleGradeClick(grade.name)}
                checked={selectedGrade === grade.name}
              />
              <label
                htmlFor={grade.name}
                className={`block w-full p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 text-right font-bold text-sm sm:text-base ${
                  selectedGrade === grade.name
                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-lg'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {grade.name}
              </label>
            </div>
          ))}
        </div>

        {/* Year Selection */}
        {selectedGrade && (
          <div className="space-y-4 mb-6">
            <h4 className="text-sm sm:text-base font-bold text-gray-700 text-right mb-3">
              اختر السنة:
            </h4>
            <div className="grid grid-cols-2 gap-3">
              {gradeOptions.find(g => g.name === selectedGrade)?.years.map((year) => (
                <div key={year} className="relative">
                  <input
                    type="radio"
                    id={year}
                    name="year"
                    value={year}
                    className="sr-only"
                    onChange={() => handleYearClick(year)}
                    checked={selectedYear === year}
                  />
                  <label
                    htmlFor={year}
                    className={`block w-full p-2 sm:p-3 rounded-lg border-2 cursor-pointer transition-all duration-300 text-center font-medium text-xs sm:text-sm ${
                      selectedYear === year
                        ? 'border-green-500 bg-green-50 text-green-700 shadow-md'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-green-300 hover:bg-green-50'
                    }`}
                  >
                    {year}
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Button */}
        <button
          onClick={handleSearch}
          disabled={!selectedGrade || !selectedYear}
          className={`w-full py-3 sm:py-4 px-6 rounded-xl font-bold text-sm sm:text-base transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 ${
            selectedGrade && selectedYear
              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 hover:scale-105'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <FaSearch className="text-sm sm:text-base" />
          بحث
        </button>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
        <div className="absolute bottom-4 left-4 w-3 h-3 bg-purple-400 rounded-full opacity-40"></div>
      </div>
    </div>
  );
};

export default PrivateClassSidebar; 