import React, { useEffect, useState } from "react";
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";
import LiveSectionCard from "../components/ui/TTHLiveSectionCard";
import SearchFilter from "../components/ui/TTHSearchFilter";

export default function Session() {
  const [liveSections, setLiveSections] = useState([]);
  const [filteredLiveSections, setFilteredLiveSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter states
  const [showFilters, setShowFilters] = useState(true);
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState('');
  
  // Filter data
  const [levels, setLevels] = useState([]);
  const [years, setYears] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [professors, setProfessors] = useState([]);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch live sections with education hierarchy (material_id is not null)
        const liveSectionsRes = await fetch('/api/live-sections/approved');
        if (liveSectionsRes.ok) {
          const liveSectionsData = await liveSectionsRes.json();
          console.log('EDUCATION LIVE SECTIONS DATA', liveSectionsData);
          
          // Filter for live sections with education hierarchy (material_id is not null)
          const educationLiveSections = liveSectionsData.filter(section => 
            section.material_id !== null && 
            section.material_id !== undefined && 
            section.material_id !== '' &&
            section.status === 'approved'
          );
          
          setLiveSections(educationLiveSections);
          setFilteredLiveSections(educationLiveSections);
          
          // Extract hierarchical data from live sections for filters
          extractFilterData(educationLiveSections);
        } else {
          console.warn('Failed to fetch live sections:', liveSectionsRes.status);
        }
      } catch (error) {
        console.warn('Error fetching live sections:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  const extractFilterData = (sections) => {
    // Extract levels from live sections
    const levelMap = new Map();
    sections.forEach(section => {
      if (section.level_name) {
        levelMap.set(section.level_name, {
          id: section.level_name,
          name: section.level_name
        });
      }
    });
    const levelsData = Array.from(levelMap.values());
    setLevels(levelsData);

    // Extract years from live sections
    const yearMap = new Map();
    sections.forEach(section => {
      if (section.year_name) {
        yearMap.set(section.year_name, {
          id: section.year_name,
          name: section.year_name,
          levelId: section.level_name
        });
      }
    });
    const yearsData = Array.from(yearMap.values());
    setYears(yearsData);

    // Extract specialities from live sections
    const specialityMap = new Map();
    sections.forEach(section => {
      if (section.speciality_name) {
        specialityMap.set(section.speciality_name, {
          id: section.speciality_name,
          name: section.speciality_name,
          yearId: section.year_name
        });
      }
    });
    const specialitiesData = Array.from(specialityMap.values());
    setSpecialities(specialitiesData);

    // Extract materials from live sections
    const materialMap = new Map();
    sections.forEach(section => {
      if (section.material_name) {
        materialMap.set(section.material_name, {
          id: section.material_name,
          name: section.material_name,
          specialityId: section.speciality_name,
          yearId: section.year_name
        });
      }
    });
    const materialsData = Array.from(materialMap.values());
    setMaterials(materialsData);

    // Extract professors from live sections
    const professorMap = new Map();
    sections.forEach(section => {
      if (section.professor_name && section.professor_id) {
        professorMap.set(section.professor_id, {
          id: section.professor_id,
          name: section.professor_name
        });
      }
    });
    const professorsData = Array.from(professorMap.values());
    setProfessors(professorsData);
  };

  // Filter functions
  const getFilteredYears = () => {
    if (!selectedLevelId) return years;
    return years.filter(year => year.levelId === selectedLevelId);
  };

  const getFilteredSpecialities = () => {
    if (!selectedYearId) return specialities;
    return specialities.filter(spec => spec.yearId === selectedYearId);
  };

  const getFilteredMaterials = () => {
    if (!selectedYearId) return materials;
    return materials.filter(material => material.yearId === selectedYearId);
  };

  const getAdvancedFilteredLiveSections = () => {
    return liveSections.filter(section => {
      // Level filter
      if (selectedLevelId && section.level_name !== selectedLevelId) return false;
      
      // Year filter
      if (selectedYearId && section.year_name !== selectedYearId) return false;
      
      // Speciality filter
      if (selectedSpeciality && section.speciality_name !== selectedSpeciality) return false;
      
      // Material filter
      if (selectedMaterial && section.material_name !== selectedMaterial) return false;
      
      // Professor filter
      if (selectedProfessor && section.professor_id !== selectedProfessor) return false;
      
      return true;
    });
  };

  // Filter live sections based on search term and advanced filters
  useEffect(() => {
    let filtered = getAdvancedFilteredLiveSections();
    
    if (searchTerm.trim() !== '') {
      filtered = filtered.filter(section =>
        section.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.material_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.level_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.year_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.speciality_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredLiveSections(filtered);
  }, [searchTerm, selectedLevelId, selectedYearId, selectedSpeciality, selectedMaterial, selectedProfessor, liveSections]);

  // Group live sections by material (subject)
  const groupLiveSectionsByMaterial = () => {
    const grouped = {};
    filteredLiveSections.forEach(section => {
      const materialName = section.material_name || 'غير محدد';
      if (!grouped[materialName]) {
        grouped[materialName] = [];
      }
      grouped[materialName].push(section);
    });
    return grouped;
  };

  const groupedLiveSections = groupLiveSectionsByMaterial();

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between" >
      <Navbar />
      <main className="container mx-auto px-4 py-8 flex-grow">
        {/* Hero Section */}
        <div className="text-right mb-12">
          <h1 className="text-brand text-4xl font-bold font-nunito leading-[55px] mb-4">
            <span className="text-brand">انضم الى </span>
            <span style={{ color: '#22d3ee' }}>الجلسات المباشرة</span>
          </h1>
          <p className="text-primary text-2xl text-gray-600 font-bold font-poppins leading-[30px] mb-8">
            حدد المادة الدراسية المناسبة لك
          </p>
        </div>
        
        {/* Search and Filter Section */}
        <section className="py-6 bg-white shadow-sm">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:shadow-xl"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                </svg>
                {showFilters ? 'إخفاء' : 'إظهار'}
              </button>
              
              <div className="w-80">
                <input
                  type="text"
                  placeholder="البحث في الجلسات المباشرة..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-full border-2 border-gray-200 focus:border-blue-500 focus:outline-none transition-colors duration-300"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Advanced Filters Section */}
        {showFilters && (
          <section className="py-6 bg-white shadow-sm">
            <div className="container mx-auto px-4">
              <div className="w-full px-4 mb-8" dir="rtl">
                <div className="max-w-7xl mx-auto">
                  {/* Container principal */}
                  <div className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-3xl shadow-2xl overflow-hidden relative">
                    {/* Background animé */}
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-purple-50/20 to-purple-50/30"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-purple-400/10 to-blue-400/10 rounded-full blur-3xl"></div>

                    {/* Header */}
                    <div className="relative z-10 p-4 sm:p-6 border-b border-gray-100/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                          <svg className="text-white text-sm sm:text-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                          </svg>
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
                    </div>

                    {/* Filters Section */}
                    <div className="relative z-10">
                      <div className="p-4 sm:p-6">
                        {/* Filters Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6 mb-6">
                          {/* Level Filter */}
                          <div className="group">
                            <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-blue-600 transition-colors duration-200">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                المرحلة الدراسية
                              </span>
                            </label>
                            <div className="relative">
                              <select
                                value={selectedLevelId}
                                onChange={(e) => {
                                  setSelectedLevelId(e.target.value);
                                  setSelectedYearId('');
                                  setSelectedSpeciality('');
                                  setSelectedMaterial('');
                                }}
                                className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer"
                                dir="rtl"
                              >
                                <option value="">جميع المراحل</option>
                                {levels.map(level => (
                                  <option key={level.id} value={level.id}>{level.name}</option>
                                ))}
                              </select>
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
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
                                value={selectedYearId}
                                onChange={(e) => {
                                  setSelectedYearId(e.target.value);
                                  setSelectedSpeciality('');
                                  setSelectedMaterial('');
                                }}
                                disabled={!selectedLevelId}
                                className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-green-300 focus:border-green-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-green-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer disabled:bg-gray-100"
                                dir="rtl"
                              >
                                <option value="">جميع السنوات</option>
                                {getFilteredYears().map(year => (
                                  <option key={year.id} value={year.id}>{year.name}</option>
                                ))}
                              </select>
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="text-gray-400 group-hover:text-green-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Speciality Filter */}
                          <div className="group">
                            <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-purple-600 transition-colors duration-200">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                                التخصص
                              </span>
                            </label>
                            <div className="relative">
                              <select
                                value={selectedSpeciality}
                                onChange={(e) => {
                                  setSelectedSpeciality(e.target.value);
                                  setSelectedMaterial('');
                                }}
                                disabled={(() => {
                                  const isDisabled = !selectedYearId || getFilteredSpecialities().length === 0;
                                  return isDisabled;
                                })()}
                                className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer disabled:bg-gray-100"
                                dir="rtl"
                              >
                                <option value="">جميع التخصصات</option>
                                {getFilteredSpecialities().length === 0 ? (
                                  <option value="" disabled>لا توجد تخصصات لهذه السنة</option>
                                ) : (
                                  getFilteredSpecialities().map(spec => (
                                    <option key={spec.id} value={spec.id}>{spec.name}</option>
                                  ))
                                )}
                              </select>
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="text-gray-400 group-hover:text-purple-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Material Filter */}
                          <div className="group">
                            <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-orange-600 transition-colors duration-200">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                                المادة
                              </span>
                            </label>
                            <div className="relative">
                              <select
                                value={selectedMaterial}
                                onChange={(e) => {
                                  setSelectedMaterial(e.target.value);
                                }}
                                disabled={(() => {
                                  const isDisabled = !selectedYearId;
                                  return isDisabled;
                                })()}
                                className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-orange-300 focus:border-orange-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-orange-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer disabled:bg-gray-100"
                                dir="rtl"
                              >
                                <option value="">جميع المواد</option>
                                {getFilteredMaterials().length === 0 ? (
                                  <option value="" disabled>لا توجد مواد لهذه السنة</option>
                                ) : (
                                  getFilteredMaterials().map(material => (
                                    <option key={material.id} value={material.id}>{material.name}</option>
                                  ))
                                )}
                              </select>
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="text-gray-400 group-hover:text-orange-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Professor Filter */}
                          <div className="group">
                            <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-red-600 transition-colors duration-200">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                                الأستاذ
                              </span>
                            </label>
                            <div className="relative">
                              <select
                                value={selectedProfessor}
                                onChange={(e) => setSelectedProfessor(e.target.value)}
                                className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-red-300 focus:border-red-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-red-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer"
                                dir="rtl"
                              >
                                <option value="">جميع الأساتذة</option>
                                {professors.length === 0 ? (
                                  <option value="" disabled>لا يوجد أساتذة متاحون</option>
                                ) : (
                                  professors.map(professor => (
                                    <option key={professor.id} value={professor.id}>{professor.name}</option>
                                  ))
                                )}
                              </select>
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="text-gray-400 group-hover:text-red-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="sm:col-span-2 lg:col-span-3 xl:col-span-1 flex flex-col sm:flex-row xl:flex-col gap-3 xl:justify-end">
                            <button
                              onClick={() => {
                                // Reset filters
                                setSelectedLevelId('');
                                setSelectedYearId('');
                                setSelectedSpeciality('');
                                setSelectedMaterial('');
                                setSelectedProfessor('');
                              }}
                              className="flex items-center justify-center gap-2 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 bg-gradient-to-r from-blue-600 via-purple-600 to-purple-600 hover:from-blue-700 hover:via-purple-700 hover:to-purple-700 relative overflow-hidden group"
                            >
                              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                              <span className="relative z-10">إعادة تعيين</span>
                            </button>
                          </div>
                        </div>

                        {/* Selected Filters Summary */}
                        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-4 border border-blue-100">
                          <h4 className="text-sm font-bold text-gray-700 mb-2 text-right">الفلاتر المحددة:</h4>
                          <div className="flex flex-wrap gap-2 justify-end">
                            {selectedLevelId && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {selectedLevelId}
                              </span>
                            )}
                            {selectedYearId && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {selectedYearId}
                              </span>
                            )}
                            {selectedSpeciality && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                {selectedSpeciality}
                              </span>
                            )}
                            {selectedMaterial && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                {selectedMaterial}
                              </span>
                            )}
                            {selectedProfessor && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                {professors.find(p => p.id === selectedProfessor)?.name || selectedProfessor}
                              </span>
                            )}
                            {!selectedLevelId && !selectedYearId && !selectedSpeciality && !selectedMaterial && !selectedProfessor && (
                              <span className="text-gray-500 text-xs">لم يتم تحديد أي فلاتر</span>
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
            </div>
          </section>
        )}

        {/* Section Title */}
        <div className="text-center mb-8">
          <h2 className="text-primary text-3xl font-bold font-rowdies leading-[24px]">
            <span className="text-primary">الجلسات المباشرة </span>
            <span style={{ color: '#22d3ee' }}>المتاحة</span> 
          </h2>
        </div>

        {/* Live Sections Grid */}
        <div className="relative">
          {loading ? (
            <div className="text-center py-16">Loading...</div>
          ) : filteredLiveSections.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                لا توجد جلسات مباشرة متاحة حالياً
              </h3>
              <p className="text-gray-600">
                سيتم إضافة جلسات مباشرة جديدة قريباً
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Show Live Sections grouped by material */}
              {Object.entries(groupedLiveSections).map(([materialName, materialLiveSections]) => (
                <div key={materialName} className="space-y-6">
                  {/* Material Header */}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{materialName}</h3>
                    <p className="text-gray-600">{materialLiveSections.length} جلسة مباشرة متاحة</p>
                  </div>
                  
                  {/* Live Sections Grid for this material */}
                  <div dir="rtl" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 justify-items-center relative z-10">
                    {materialLiveSections.map((section) => (
                      <LiveSectionCard key={section.id} section={section} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
} 