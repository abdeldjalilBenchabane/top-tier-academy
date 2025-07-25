import React, { useEffect, useState } from "react";
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";
import CourseCard from "../components/ui/TTHCourseCard";
import LanguageFilter from "../components/ui/TTHLanguageFilter";
import { languageCourses } from "../data";
import { pointsAPI } from '@/services/api';

export default function Languages() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState([]);
  const [languageLevels, setLanguageLevels] = useState([]);
  const [professors, setProfessors] = useState([]);
  
  // Filter states
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch courses first (this doesn't require auth)
        const coursesRes = await fetch('/api/courses');
        const coursesData = await coursesRes.json();
        
        console.log('LANG COURSES DATA', coursesData);
        
        // Filter for language courses
        let languageCourses = coursesData.filter(course => 
          course.languageLevelId !== null && 
          course.languageLevelId !== undefined && 
          course.languageLevelId !== '' &&
          (course.status === 'approved' || course.status === 'pending')
        );

        // Extract language and level data from courses instead of making separate API calls
        let languagesData = [];
        let languageLevelsData = [];
        let professorsData = [];
        
        // Extract unique languages and levels from the courses data
        const languageMap = new Map();
        const levelMap = new Map();
        const professorMap = new Map();
        
        languageCourses.forEach(course => {
          // Extract language info from course data
          if (course.language_name) {
            languageMap.set(course.language_name, {
              id: course.language_name,
              name: course.language_name,
              code: course.language_name.toLowerCase()
            });
          }
          
          // Extract level info from course data
          if (course.language_level_name) {
            levelMap.set(course.language_level_name, {
              id: course.language_level_name,
              name: course.language_level_name,
              language_id: course.language_name
            });
          }
          
          // Extract professor info from course data
          if (course.created_by_name && course.createdBy) {
            professorMap.set(course.createdBy, {
              id: course.createdBy,
              name: course.created_by_name
            });
          }
        });
        
        languagesData = Array.from(languageMap.values());
        languageLevelsData = Array.from(levelMap.values());
        professorsData = Array.from(professorMap.values());

        console.log('Languages data:', languagesData);
        console.log('Language levels data:', languageLevelsData);
        console.log('Professors data:', professorsData);
        console.log('Sample course:', languageCourses[0]);
        console.log('All language courses:', languageCourses.map(c => ({ 
          id: c.id, 
          title: c.title, 
          createdBy: c.createdBy, 
          created_by_name: c.created_by_name,
          language_name: c.language_name 
        })));

        // Fetch language course prices
        try {
          const priceRes = await fetch('/api/courses/language-course-prices');
          if (priceRes.ok) {
            const priceData = await priceRes.json();
            languageCourses = languageCourses.map(course => {
              const langPrice = priceData.find(p => p.course_id === course.id && p.language_level_id === course.languageLevelId);
              return langPrice ? { ...course, price: langPrice.price } : course;
            });
          }
        } catch (e) {
          console.warn('Error fetching language course prices:', e);
        }
        
        // Fetch purchased course IDs
        let purchasedIds = [];
        try {
          const purchasedRes = await pointsAPI.getMyCourses();
          purchasedIds = purchasedRes.courseIds || [];
        } catch (e) { /* ignore if not logged in */ }

        // Mark purchased courses
        languageCourses = languageCourses.map(course => ({ 
          ...course, 
          purchased: purchasedIds.includes(course.id) 
        }));

        setCourses(languageCourses);
        setFilteredCourses(languageCourses);
        setLanguages(Array.isArray(languagesData) ? languagesData : []);
        setLanguageLevels(Array.isArray(languageLevelsData) ? languageLevelsData : []);
        setProfessors(Array.isArray(professorsData) ? professorsData : []);

      } catch (e) {
        console.error('Error fetching data:', e);
        setCourses([]);
        setFilteredCourses([]);
        setLanguages([]);
        setLanguageLevels([]);
        setProfessors([]);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Apply filters whenever filter states change
  useEffect(() => {
    let filtered = [...courses];

    // Filter by language
    if (selectedLanguage) {
      filtered = filtered.filter(course => course.language_name === selectedLanguage);
    }

    // Filter by level (only if language is selected)
    if (selectedLevel && selectedLanguage) {
      filtered = filtered.filter(course => course.language_level_name === selectedLevel);
    }

    // Filter by professor
    if (selectedProfessor) {
      console.log('Filtering by professor:', selectedProfessor);
      console.log('Available professors:', professors.map(p => ({ id: p.id, name: p.name })));
      filtered = filtered.filter(course => {
        console.log('Course professor:', course.createdBy, 'Course professor name:', course.created_by_name);
        // Convert both to strings for comparison to handle type mismatches
        return String(course.createdBy) === String(selectedProfessor);
      });
      console.log('Filtered courses count:', filtered.length);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(course => 
        course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredCourses(filtered);
  }, [courses, selectedLanguage, selectedLevel, selectedProfessor, searchTerm, languages, languageLevels]);

  // Group courses by language
  const groupCoursesByLanguage = () => {
    const grouped = {};
    
    if (!Array.isArray(filteredCourses)) {
      return grouped;
    }
    
    filteredCourses.forEach(course => {
      const languageName = course.language_name || 'Unknown Language';
      
      if (!grouped[languageName]) {
        grouped[languageName] = [];
      }
      grouped[languageName].push(course);
    });

    return grouped;
  };

  const groupedCourses = groupCoursesByLanguage();

  // Filter courses by selected language for the button filter
  const getFilteredCoursesByLanguage = () => {
    if (!selectedLanguageFilter) {
      return groupedCourses;
    }
    
    const filtered = {};
    Object.keys(groupedCourses).forEach(languageName => {
      if (languageName === selectedLanguageFilter) {
        filtered[languageName] = groupedCourses[languageName];
      }
    });
    
    return filtered;
  };

  const handleLanguageFilter = (language) => {
    setSelectedLanguageFilter(selectedLanguageFilter === language ? null : language);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <section className="relative overflow-hidden mt-[2px] bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
          </div>
          <div className="relative container mx-auto px-4 py-12 md:py-16">
            <div className="text-right max-w-4xl mx-auto">
              <h1 className="text-white text-2xl md:text-4xl lg:text-5xl font-bold font-nunito leading-tight mb-4">
                <span className="block mb-1">تعلّم</span>
                <span className="bg-gradient-to-r from-purple-300 to-purple-100 bg-clip-text text-transparent">
                  اللغات العالمية
                </span>
              </h1>
              <p className="text-blue-100 text-base md:text-lg lg:text-xl font-bold font-poppins leading-relaxed mb-6">
                اختر اللغة والمستوى المناسب لك
              </p>

              {/* Stats ou badges */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-end mt-8">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                  <span className="font-bold">{filteredCourses.length}</span> حصة متاحة
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                  <span className="font-bold">1000+</span> طالب
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                  <span className="font-bold">⭐ 4.9</span> تقييم
                </div>
              </div>
            </div>
          </div>
        </section>

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
                  placeholder="البحث في الدورات..."
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
                            فلاتر متقدمة
                          </h3>
                          <p className="text-sm text-gray-600 mt-1 hidden sm:block">
                            حدد اللغة والمستوى والأستاذ المناسب لك
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Filters Section */}
                    <div className="relative z-10">
                      <div className="p-4 sm:p-6">
                        {/* Filters Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mb-6">
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
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer"
                                dir="rtl"
                              >
                                <option value="">جميع اللغات</option>
                                {languages.map((language) => (
                                  <option key={language.id} value={language.name}>
                                    {language.name}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
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
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                disabled={!selectedLanguage}
                                className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-green-300 focus:border-green-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-green-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer disabled:bg-gray-100"
                                dir="rtl"
                              >
                                <option value="">جميع المستويات</option>
                                {languageLevels
                                  .filter(level => !selectedLanguage || level.language_id === selectedLanguage)
                                  .map((level) => (
                                    <option key={level.id} value={level.name}>
                                      {level.name}
                                    </option>
                                  ))}
                              </select>
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="text-gray-400 group-hover:text-green-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
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
                                onChange={(e) => setSelectedProfessor(e.target.value)}
                                className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-purple-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer"
                                dir="rtl"
                              >
                                <option value="">جميع الأساتذة</option>
                                {professors.map((professor) => (
                                  <option key={professor.id} value={professor.id}>
                                    {professor.name}
                                  </option>
                                ))}
                              </select>
                              <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                                <svg className="text-gray-400 group-hover:text-purple-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </div>
                            </div>
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
                            {!selectedLanguage && !selectedLevel && !selectedProfessor && (
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

        {/* Language Filter Section */}
        {!loading && Object.keys(groupedCourses).length > 0 && (
          <section className="py-8 bg-white shadow-sm">
            <div className="container mx-auto px-4">
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => handleLanguageFilter(null)}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    selectedLanguageFilter === null 
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  جميع اللغات
                  {selectedLanguageFilter === null && (
                    <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
                      {Object.values(groupedCourses).flat().length}
                    </span>
                  )}
                </button>
                
                {Object.keys(groupedCourses).map((languageName) => {
                  const languageCourseCount = groupedCourses[languageName].length;
                  
                  return (
                    <button
                      key={languageName}
                      onClick={() => handleLanguageFilter(languageName)}
                      className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                        selectedLanguageFilter === languageName 
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg' 
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      {languageName}
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        selectedLanguageFilter === languageName 
                          ? 'bg-white/20' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {languageCourseCount}
                      </span>
                    </button>
                  );
                })}
              </div>
        </div>
          </section>
        )}



        {/* Languages Grid */}
        <div className="relative">
          {loading ? (
            <div className="text-center py-16">Loading...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد دورات لغات متاحة حالياً</h3>
              <p className="text-gray-600">سيتم إضافة دورات جديدة قريباً</p>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.entries(getFilteredCoursesByLanguage()).map(([languageName, languageCourses]) => (
                <div key={languageName} className="space-y-6">
                  {/* Language Header */}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{languageName}</h3>
                    <p className="text-gray-600">{languageCourses.length} دورة متاحة</p>
                  </div>
                  
                  {/* Courses Grid for this language */}
                  <div dir="rtl" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 justify-items-center relative z-10">
                    {languageCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
              />
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