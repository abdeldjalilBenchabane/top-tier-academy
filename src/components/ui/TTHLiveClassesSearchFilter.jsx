import React from 'react';
import { FaVideo, FaChevronDown, FaSearch, FaGraduationCap, FaBook, FaLayerGroup, FaSpinner, FaTimes } from 'react-icons/fa';

const TTHLiveClassesSearchFilter = ({ 
  selectedLevel,
  selectedYear, 
  selectedSpeciality,
  selectedMaterial,
  levels,
  years,
  specialities,
  materials,
  hierarchyLoading,
  onLevelChange,
  onYearChange,
  onSpecialityChange,
  onMaterialChange,
  onSearch,
  onClearFilters,
  getFilteredYears,
  getFilteredSpecialities,
  getFilteredMaterials,
  getAllYears,
  getAllSpecialities,
  getAllMaterials
}) => {
  const hasActiveFilters = selectedLevel || selectedYear || selectedSpeciality || selectedMaterial;

  return (
    <div className="w-full flex justify-center mb-8 sm:mb-10" dir="rtl">
      <div className="bg-gradient-to-br from-white to-gray-50 border border-gray-200 rounded-2xl shadow-xl px-4 sm:px-6 py-6 sm:py-8 flex flex-col items-center gap-6 w-full max-w-7xl backdrop-blur-sm relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#194cbf] to-[#61a1ff] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
              <FaVideo className="text-white text-sm sm:text-lg" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent">
                البحث في البث المباشر
              </h3>
            </div>
          </div>
          
          {/* Clear Filters Button */}
          {hasActiveFilters && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-2 text-gray-600 hover:text-red-600 px-4 py-2 rounded-xl font-medium transition-colors duration-200 hover:bg-red-50"
            >
              <FaTimes className="text-sm" />
              <span>مسح الفلاتر</span>
            </button>
          )}
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
          {/* Level Filter */}
          <div className="group">
            <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-[#194cbf] transition-colors duration-200">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                المرحلة الدراسية
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedLevel}
                onChange={onLevelChange}
                disabled={hierarchyLoading}
                className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                dir="rtl"
              >
                <option value="">
                  {hierarchyLoading ? 'جاري التحميل...' : 'اختر المرحلة'}
                </option>
                {!hierarchyLoading && levels.length === 0 ? (
                  <option value="" disabled>لا توجد مراحل متاحة</option>
                ) : (
                  levels.map(level => (
                  <option key={level.id} value={level.id}>{level.name}</option>
                  ))
                )}
              </select>

              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                {hierarchyLoading ? (
                  <FaSpinner className="text-gray-400 animate-spin" />
                ) : (
                  <FaChevronDown className="text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
                )}
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
                onChange={onYearChange}
                disabled={hierarchyLoading}
                className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-green-300 focus:border-green-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-green-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                dir="rtl"
              >
                <option value="">اختر السنة</option>
                {(selectedLevel ? getFilteredYears() : getAllYears()).map(year => (
                  <option key={year.id} value={year.id}>{year.name}</option>
                ))}
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <FaChevronDown className="text-gray-400 group-hover:text-green-500 transition-colors duration-200" />
              </div>
            </div>
          </div>

          {/* Speciality Filter */}
          <div className="group">
            <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-[#61a1ff] transition-colors duration-200">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                التخصص
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedSpeciality}
                onChange={onSpecialityChange}
                disabled={!selectedYear || hierarchyLoading}
                className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                dir="rtl"
              >
                <option value="">اختر التخصص</option>
                {(selectedLevel && selectedYear ? getFilteredSpecialities() : getAllSpecialities()).length === 0 ? (
                  <option value="" disabled>لا توجد تخصصات متاحة (3-path)</option>
                ) : (
                  (selectedLevel && selectedYear ? getFilteredSpecialities() : getAllSpecialities()).map(speciality => (
                  <option key={speciality.id} value={speciality.id}>{speciality.name}</option>
                  ))
                )}
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <FaChevronDown className="text-gray-400 group-hover:text-blue-500 transition-colors duration-200" />
              </div>
            </div>
          </div>

          {/* Material Filter */}
          <div className="group">
            <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-indigo-600 transition-colors duration-200">
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                المادة الدراسية
              </span>
            </label>
            <div className="relative">
              <select
                value={selectedMaterial}
                onChange={onMaterialChange}
                disabled={!selectedYear || hierarchyLoading}
                className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-indigo-300 focus:border-indigo-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-indigo-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                dir="rtl"
              >
                <option value="">اختر المادة</option>
                {(selectedLevel && selectedYear ? getFilteredMaterials() : getAllMaterials()).length === 0 ? (
                  <option value="" disabled>لا توجد مواد متاحة</option>
                ) : (
                  (selectedLevel && selectedYear ? getFilteredMaterials() : getAllMaterials()).map(material => (
                  <option key={material.id} value={material.id}>{material.name}</option>
                  ))
                )}
              </select>
              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <FaChevronDown className="text-gray-400 group-hover:text-indigo-500 transition-colors duration-200" />
              </div>
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="flex justify-center w-full">
          <button
            onClick={onSearch}
            disabled={hierarchyLoading}
            className="flex items-center justify-center gap-3 text-white px-6 py-3 lg:py-4 rounded-2xl text-sm lg:text-base font-bold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <FaSearch className="relative z-10 text-lg" />
            <span className="relative z-10">البحث الآن</span>
          </button>
        </div>

        {/* Selected Filters Summary */}
        {(selectedLevel || selectedYear || selectedSpeciality || selectedMaterial) && (
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-100">
            <h4 className="text-sm font-bold text-gray-700 mb-2 text-right">الفلاتر المحددة:</h4>
            <div className="flex flex-wrap gap-2 justify-end">
              {selectedLevel && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {levels.find(l => l.id === parseInt(selectedLevel))?.name}
                </span>
              )}
              {selectedYear && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  {years.find(y => y.id === parseInt(selectedYear))?.name}
                </span>
              )}
              {selectedSpeciality && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {specialities.find(s => s.id === parseInt(selectedSpeciality))?.name}
                </span>
              )}
              {selectedMaterial && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {materials.find(m => m.id === parseInt(selectedMaterial))?.name}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Decorative Elements */}
        <div className="absolute top-8 right-8 w-3 h-3 bg-blue-400 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute bottom-8 left-8 w-2 h-2 bg-blue-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-4 w-1 h-1 bg-blue-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>
    </div>
  );
};

export default TTHLiveClassesSearchFilter; 