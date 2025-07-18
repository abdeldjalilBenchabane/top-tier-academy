import React from 'react';
import { FaCalendarAlt, FaChevronDown, FaSearch, FaFilter, FaUserTie, FaSpinner } from 'react-icons/fa';
import CustomDatePicker from './TTHCustomDatePicker';

const gradeOptions = [
  { label: 'ابتدائي', years: ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'], subjects: ['اللغة العربية', 'الرياضيات', 'التربية الإسلامية', 'التربية العلمية', 'التربية المدنية', 'اللغة الفرنسية', 'اللغة الإنجليزية'] },
  { label: 'متوسط', years: ['الأولى', 'الثانية', 'الثالثة', 'الرابعة'], subjects: ['اللغة العربية', 'الرياضيات', 'العلوم الطبيعية', 'الفيزياء', 'التاريخ والجغرافيا', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'التربية الإسلامية'] },
  { label: 'ثانوي', years: ['الأولى', 'الثانية', 'الثالثة'], subjects: ['اللغة العربية', 'الرياضيات', 'العلوم الطبيعية', 'الفيزياء', 'الكيمياء', 'التاريخ والجغرافيا', 'الفلسفة', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'العلوم الإسلامية'] },
];

const PrivateClassFilter = ({ 
  selectedGrade, 
  selectedYear, 
  selectedSubject, 
  selectedDate,
  selectedTeacher,
  availableTeachers,
  isProfessor,
  loading,
  onGradeChange,
  onYearChange,
  onSubjectChange,
  onDateChange,
  onTeacherChange,
  onSearch 
}) => {
  const currentGrade = gradeOptions.find(g => g.label === selectedGrade);

  return (
    <div className="w-full  flex justify-center mb-8 sm:mb-10" dir="rtl">
      <div className="bg-gradient-to-br from-white  to-gray-50 border border-gray-200 rounded-2xl shadow-xl px-4 sm:px-6 py-4 sm:py-4 flex flex-col items-center gap-4 w-full max-w-6xl backdrop-blur-sm relative z-10 ]" >
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
            <FaFilter className="text-white text-sm sm:text-lg" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            {isProfessor ? 'إدارة حصصك الخاصة' : 'حدد المرحلة الدراسية المناسبة لك'}
          </h3>
        </div>

        {/* Filters Row */}
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 w-full items-center">
          {/* Teacher Filter - Only show if not a professor or if admin */}
          {!isProfessor && (
            <div className="relative w-full flex flex-col justify-end min-w-[200px] sm:min-w-[220px] group">
              <label className="block text-gray-700 font-bold mb-2 pr-1 text-sm sm:text-base text-right group-hover:text-orange-600 transition-colors">الأستاذ</label>
              <div className="relative flex items-center">
                <select
                  value={selectedTeacher}
                  onChange={onTeacherChange}
                  disabled={loading}
                  className="appearance-none w-full bg-white border-2 border-gray-200 text-sm sm:text-base font-bold font-poppins rounded-xl py-2 sm:py-3 pr-4 pl-10 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-300 shadow-sm text-right min-w-[200px] sm:min-w-[220px] group-hover:border-orange-300 group-hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  dir="rtl"
                >
                  <option value="">
                    {loading ? 'جاري التحميل...' : 'اختر الأستاذ'}
                  </option>
                  {!loading && availableTeachers.map(teacher => (
                    <option key={teacher.id} value={teacher.name}>{teacher.name}</option>
                  ))}
                </select>
                {loading ? (
                  <FaSpinner className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                ) : (
                  <FaUserTie className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-orange-500 transition-colors" />
                )}
              </div>
            </div>
          )}

          {/* Grade */}
          <div className="relative w-full flex flex-col justify-end min-w-[200px] sm:min-w-[220px] group">
            <label className="block text-gray-700 font-bold mb-2 pr-1 text-sm sm:text-base text-right group-hover:text-blue-600 transition-colors">المرحلة</label>
            <div className="relative flex items-center">
              <select
                value={selectedGrade}
                onChange={onGradeChange}
                className="appearance-none w-full bg-white border-2 border-gray-200 text-sm sm:text-base font-bold font-poppins rounded-xl py-2 sm:py-3 pr-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-300 shadow-sm text-right min-w-[200px] sm:min-w-[220px] group-hover:border-blue-300 group-hover:shadow-md"
                dir="rtl"
              >
                <option value="">اختر المرحلة</option>
                {gradeOptions.map(g => (
                  <option key={g.label} value={g.label}>{g.label}</option>
                ))}
              </select>
              <FaChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
            </div>
          </div>
          
          {/* Year */}
          <div className="relative w-full flex flex-col justify-end min-w-[200px] sm:min-w-[220px] group">
            <label className="block text-gray-700 font-bold mb-2 pr-1 text-sm sm:text-base text-right group-hover:text-green-600 transition-colors">السنة</label>
            <div className="relative flex items-center">
              <select
                value={selectedYear}
                onChange={onYearChange}
                className="appearance-none w-full bg-white border-2 border-gray-200 text-sm sm:text-base font-bold font-poppins rounded-xl py-2 sm:py-3 pr-4 pl-10 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all duration-300 shadow-sm text-right min-w-[200px] sm:min-w-[220px] group-hover:border-green-300 group-hover:shadow-md"
                dir="rtl"
              >
                <option value="">اختر السنة</option>
                {currentGrade?.years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
              <FaChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-green-500 transition-colors" />
            </div>
          </div>
          
          {/* Subject */}
          <div className="relative w-full flex flex-col justify-end min-w-[200px] sm:min-w-[220px] group">
            <label className="block text-gray-700 font-bold mb-2 pr-1 text-sm sm:text-base text-right group-hover:text-purple-600 transition-colors">المادة</label>
            <div className="relative flex items-center">
              <select
                value={selectedSubject}
                onChange={onSubjectChange}
                className="appearance-none w-full bg-white border-2 border-gray-200 text-sm sm:text-base font-bold font-poppins rounded-xl py-2 sm:py-3 pr-4 pl-10 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-purple-400 transition-all duration-300 shadow-sm text-right min-w-[200px] sm:min-w-[220px] group-hover:border-purple-300 group-hover:shadow-md"
                dir="rtl"
              >
                <option value="">اختر المادة</option>
                {currentGrade?.subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              <FaChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-purple-500 transition-colors" />
            </div>
          </div>
          
          {/* Custom Date Picker */}
          <div className="w-full sm:w-auto">
            <CustomDatePicker
              value={selectedDate}
              onChange={onDateChange}
              label="اليوم"
            />
          </div>
        </div>
        
        {/* Search Button */}
        <button 
          onClick={onSearch}
          className="flex items-center gap-2 sm:gap-3 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold font-poppins leading-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 w-full sm:w-auto"
          style={{ minWidth: '120px' }}
        >
          <FaSearch className="text-lg sm:text-xl" />
          {isProfessor ? 'عرض الحصص' : 'طلب'}
        </button>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
        <div className="absolute bottom-4 left-4 w-3 h-3 bg-purple-400 rounded-full opacity-40"></div>
      </div>
    </div>
  );
};

export default PrivateClassFilter; 