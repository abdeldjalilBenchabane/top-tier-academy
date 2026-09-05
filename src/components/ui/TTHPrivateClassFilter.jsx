import React from 'react';
import { FaCalendarAlt, FaChevronDown, FaSearch, FaFilter, FaUserTie, FaSpinner, FaGraduationCap, FaBook, FaLayerGroup } from 'react-icons/fa';
import CustomDatePicker from './TTHCustomDatePicker';

const PrivateClassFilter = ({ 
  selectedLevel, 
  selectedYear, 
  selectedSpeciality,
  selectedMaterial,
  selectedDate,
  selectedTeacher,
  availableTeachers,
  levels,
  years,
  specialities,
  materials,
  isProfessor,
  loading,
  hierarchyLoading,
  onLevelChange,
  onYearChange,
  onSpecialityChange,
  onMaterialChange,
  onDateChange,
  onTeacherChange,
  onSearch
}) => {
  // If a level is picked (and no teacher is locked-in yet), restrict teacher list to that level
  const teachersForDropdown =
    selectedLevel && !selectedTeacher
      ? availableTeachers.filter((t) => String(t.level_id) === String(selectedLevel))
      : availableTeachers;

  return (
    <div className="w-full flex justify-center mb-8 sm:mb-10" dir="rtl">
      <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl shadow-xl px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center gap-6 w-full max-w-7xl backdrop-blur-sm relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-r from-[#194cbf] to-[#61a1ff] rounded-full flex items-center justify-center shadow-lg">
            <FaFilter className="text-white text-lg" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-[#194cbf] to-[#61a1ff] bg-clip-text text-transparent">
            {isProfessor ? 'إدارة حصصك الخاصة' : 'حدد المرحلة الدراسية المناسبة لك'}
          </h3>
        </div>

        {/* First Row - Teacher, Level, Year */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 w-full">
          {/* Teacher Filter - Only show if not a professor */}
          {!isProfessor && (
            <div className="relative w-full group">
              <label className="block text-gray-700 font-bold mb-2 pr-1 text-sm sm:text-base text-right group-hover:text-orange-600 transition-colors">
                <FaUserTie className="inline mr-2" />
                الأستاذ
              </label>
              <div className="relative flex items-center">
                <select
                  value={selectedTeacher}
                  onChange={onTeacherChange}
                  disabled={loading}
                  className="appearance-none w-full bg-white border-2 border-gray-200 text-sm sm:text-base font-bold font-poppins rounded-xl py-3 pr-4 pl-10 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all duration-300 shadow-sm text-right group-hover:border-orange-300 group-hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  dir="rtl"
                >
                  <option value="">
                    {loading
                      ? 'جاري التحميل...'
                      : selectedLevel && teachersForDropdown.length === 0
                      ? 'لا يوجد أساتذة في هذه المرحلة'
                      : 'اختر الأستاذ'}
                  </option>
                  {!loading && teachersForDropdown.map(teacher => (
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

          {/* Level */}
          <div className="relative w-full group">
            <label className="block text-gray-700 font-bold mb-2 pr-1 text-sm sm:text-base text-right group-hover:text-[#194cbf] transition-colors">
              <FaGraduationCap className="inline mr-2" />
              المرحلة
            </label>
            <div className="relative flex items-center">
              <select
                value={selectedLevel}
                onChange={onLevelChange}
                disabled={hierarchyLoading || !!selectedTeacher}
                title={selectedTeacher ? 'المرحلة محددة من الأستاذ المختار' : ''}
                className="appearance-none w-full bg-white border-2 border-gray-200 text-sm sm:text-base font-bold font-poppins rounded-xl py-3 pr-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-300 shadow-sm text-right group-hover:border-blue-300 group-hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                dir="rtl"
              >
                <option value="">
                  {hierarchyLoading ? 'جاري التحميل...' : 'اختر المرحلة'}
                </option>
                {!hierarchyLoading && levels.map(level => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                ))}
              </select>
              {hierarchyLoading ? (
                <FaSpinner className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
              ) : (
              <FaChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
              )}
            </div>
          </div>

          {/* Year */}
          <div className="relative w-full group">
            <label className="block text-gray-700 font-bold mb-2 pr-1 text-sm sm:text-base text-right group-hover:text-green-600 transition-colors">
              <FaBook className="inline mr-2" />
              السنة
            </label>
            <div className="relative flex items-center">
              <select
                value={selectedYear}
                onChange={onYearChange}
                disabled={!selectedLevel || hierarchyLoading}
                className="appearance-none w-full bg-white border-2 border-gray-200 text-sm sm:text-base font-bold font-poppins rounded-xl py-3 pr-4 pl-10 focus:outline-none focus:ring-2 focus:ring-green-300 focus:border-green-400 transition-all duration-300 shadow-sm text-right group-hover:border-green-300 group-hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                dir="rtl"
              >
                <option value="">
                  {!selectedLevel 
                    ? "اختر المرحلة أولاً" 
                    : hierarchyLoading 
                      ? "جاري التحميل..." 
                      : "اختر السنة"
                  }
                </option>
                {years.map(year => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </select>
              <FaChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-green-500 transition-colors" />
            </div>
          </div>
        </div>
          
        {/* Second Row - Speciality and Material */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 w-full">
          {/* Speciality - Only show if specialities exist */}
          {specialities.length > 0 ? (
            <div className="relative w-full group">
              <label className="block text-gray-700 font-bold mb-2 pr-1 text-sm sm:text-base text-right group-hover:text-[#61a1ff] transition-colors">
                <FaLayerGroup className="inline mr-2" />
                التخصص
              </label>
              <div className="relative flex items-center">
                <select
                  value={selectedSpeciality}
                  onChange={onSpecialityChange}
                  disabled={!selectedYear || hierarchyLoading}
                  className="appearance-none w-full bg-white border-2 border-gray-200 text-sm sm:text-base font-bold font-poppins rounded-xl py-3 pr-4 pl-10 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all duration-300 shadow-sm text-right group-hover:border-blue-300 group-hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  dir="rtl"
                >
                  <option value="">
                    {!selectedYear 
                      ? "اختر السنة أولاً" 
                      : hierarchyLoading 
                        ? "جاري التحميل..." 
                        : "اختر التخصص"
                    }
                  </option>
                  {specialities.map(speciality => (
                    <option key={speciality.id} value={speciality.id}>{speciality.name}</option>
                  ))}
                </select>
                <FaChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-blue-500 transition-colors" />
              </div>
            </div>
          ) : selectedYear && !hierarchyLoading ? (
            <div className="relative w-full group">
              <label className="block text-gray-700 font-bold mb-2 pr-1 text-sm sm:text-base text-right">
                <FaLayerGroup className="inline mr-2" />
                التخصص
              </label>
              <div className="relative flex items-center">
                <select
                  value=""
                  disabled={true}
                  className="appearance-none w-full bg-gray-100 border-2 border-gray-200 text-sm sm:text-base font-bold font-poppins rounded-xl py-3 pr-4 pl-10 text-gray-500 text-right cursor-not-allowed"
                  dir="rtl"
                >
                  <option value="">لا توجد تخصصات لهذه السنة</option>
                </select>
                <FaLayerGroup className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          ) : (
            <div className="relative w-full group">
              <label className="block text-gray-700 font-bold mb-2 pr-1 text-sm sm:text-base text-right">
                <FaLayerGroup className="inline mr-2" />
                التخصص
              </label>
              <div className="relative flex items-center">
                <select
                  value=""
                  disabled={true}
                  className="appearance-none w-full bg-gray-100 border-2 border-gray-200 text-sm sm:text-base font-bold font-poppins rounded-xl py-3 pr-4 pl-10 text-gray-500 text-right cursor-not-allowed"
                  dir="rtl"
                >
                  <option value="">اختر السنة أولاً</option>
                </select>
                <FaLayerGroup className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
          )}
          
          {/* Material */}
          <div className="relative w-full group">
            <label className="block text-gray-700 font-bold mb-2 pr-1 text-sm sm:text-base text-right group-hover:text-indigo-600 transition-colors">
              <FaBook className="inline mr-2" />
              المادة
            </label>
            <div className="relative flex items-center">
              <select
                value={selectedMaterial}
                onChange={onMaterialChange}
                disabled={
                  !selectedYear || 
                  hierarchyLoading || 
                  (specialities.length > 0 && !selectedSpeciality)
                }
                className="appearance-none w-full bg-white border-2 border-gray-200 text-sm sm:text-base font-bold font-poppins rounded-xl py-3 pr-4 pl-10 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all duration-300 shadow-sm text-right group-hover:border-indigo-300 group-hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                dir="rtl"
              >
                <option value="">
                  {!selectedYear 
                    ? "اختر السنة أولاً" 
                    : specialities.length > 0 && !selectedSpeciality
                      ? "اختر التخصص أولاً"
                      : hierarchyLoading 
                        ? "جاري التحميل..." 
                        : materials.length === 0
                          ? "لا توجد مواد متاحة"
                          : "اختر المادة"
                  }
                </option>
                {materials.map(material => (
                  <option key={material.id} value={material.id}>{material.name}</option>
                ))}
              </select>
              <FaChevronDown className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-hover:text-indigo-500 transition-colors" />
            </div>
          </div>
        </div>
        
        {/* Search Button */}
        <button 
          onClick={onSearch}
          disabled={hierarchyLoading || loading}
          className="flex items-center gap-3 text-white px-8 py-4 rounded-xl text-lg font-bold font-poppins leading-6 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-r from-[#194cbf] to-[#61a1ff] hover:from-[#1340a0] hover:to-[#4a8de8] w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          style={{ minWidth: '150px' }}
        >
          <FaSearch className="text-xl" />
          {isProfessor ? 'عرض الحصص' : 'طلب'}
        </button>

        {/* Decorative Elements */}
        <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full opacity-60"></div>
        <div className="absolute bottom-4 left-4 w-3 h-3 bg-blue-400 rounded-full opacity-40"></div>
      </div>
    </div>
  );
};

export default PrivateClassFilter; 