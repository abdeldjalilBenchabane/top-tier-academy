import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";
import CourseCard from "../components/ui/TTHCourseCard";
import LiveSectionCard from "../components/ui/TTHLiveSectionCard";
import LiveCard from "../components/ui/TTHLiveCard";
import LanguageFilter from "../components/ui/TTHLanguageFilter";
import { languageCourses } from "../data";
import { pointsAPI } from '@/services/api';
import usePageMeta from '@/hooks/usePageMeta';

export default function Languages() {

  usePageMeta({

    title: 'دورات اللغات',

    description: 'تعلم الإنجليزية والفرنسية والإسبانية أونلاين مع أساتذة Top Tier Academy. مستويات من المبتدئ إلى المتقدم، ودروس مباشرة ومسجلة.',

    path: '/TTHLanguages',

  });

  const [courses, setCourses] = useState([]);
  const [liveSections, setLiveSections] = useState([]);
  // Standalone live sessions on the language path. They used to sit on the
  // school live page, where a language lesson has no business being.
  const [languageSessions, setLanguageSessions] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [filteredLiveSections, setFilteredLiveSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [languages, setLanguages] = useState([]);
  const [languageLevels, setLanguageLevels] = useState([]);
  const [professors, setProfessors] = useState([]);
  const [liveLanguages, setLiveLanguages] = useState([]);
  const [liveLanguageLevels, setLiveLanguageLevels] = useState([]);
  const [liveProfessors, setLiveProfessors] = useState([]);
  
  // Filter states
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguageFilter, setSelectedLanguageFilter] = useState(null);

  // Coming from the landing page's اللغات card with ?language=
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const language = searchParams.get('language');
    if (language) setSelectedLanguage(language);
  }, [searchParams]);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('live'); // 'all' or 'live' - default to 'live'

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

        // Fetch live sections
        let languageLiveSections = [];
        try {
          // Live sessions whose path is a language. The list endpoint returns the
        // path columns, so the page can pick its own out.
        try {
          const sessionsRes = await fetch('/api/live-sessions');
          if (sessionsRes.ok) {
            const payload = await sessionsRes.json();
            const all = payload.sessions || payload || [];
            setLanguageSessions(all.filter((session) =>
              (session.root_type === 'language' || session.language_level_id) &&
              session.is_approved !== false && session.is_rejected !== true));
          }
        } catch (error) {
          console.error('Could not load language live sessions:', error);
        }

          const liveSectionsRes = await fetch('/api/live-sections/approved');
          if (liveSectionsRes.ok) {
            const liveSectionsData = await liveSectionsRes.json();
            console.log('LIVE SECTIONS DATA', liveSectionsData);
            
            // Filter for language live sections
            languageLiveSections = liveSectionsData.filter(section => 
              section.language_id !== null && 
              section.language_id !== undefined && 
              section.language_id !== '' &&
              section.status === 'approved'
            );
          } else {
            console.warn('Failed to fetch live sections:', liveSectionsRes.status);
          }
        } catch (error) {
          console.warn('Error fetching live sections:', error);
        }

        // Extract language and level data from courses only (for regular courses filter)
        let languagesData = [];
        let languageLevelsData = [];
        let professorsData = [];
        
        // Extract unique languages and levels from the courses data only
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

        // Extract language and level data from live sections only (for live sections filter)
        const liveLanguageMap = new Map();
        const liveLevelMap = new Map();
        const liveProfessorMap = new Map();
        
        languageLiveSections.forEach(section => {
          // Extract language info from live section data
          if (section.language_name) {
            liveLanguageMap.set(section.language_name, {
              id: section.language_name,
              name: section.language_name,
              code: section.language_name.toLowerCase()
            });
          }
          
          // Extract level info from live section data
          if (section.language_level_name) {
            liveLevelMap.set(section.language_level_name, {
              id: section.language_level_name,
              name: section.language_level_name,
              language_id: section.language_name
            });
          }
          
          // Extract professor info from live section data
          if (section.professor_name && section.professor_id) {
            liveProfessorMap.set(section.professor_id, {
              id: section.professor_id,
              name: section.professor_name
            });
          }
        });
        
        const liveLanguagesData = Array.from(liveLanguageMap.values());
        const liveLanguageLevelsData = Array.from(liveLevelMap.values());
        const liveProfessorsData = Array.from(liveProfessorMap.values());

        console.log('Languages data:', languagesData);
        console.log('Live Languages data:', liveLanguagesData);
        console.log('Language levels data:', languageLevelsData);
        console.log('Professors data:', professorsData);
        console.log('Sample course:', languageCourses[0]);
        console.log('Sample live section:', languageLiveSections[0]);
        console.log('All language courses:', languageCourses.map(c => ({ 
          id: c.id, 
          title: c.title, 
          createdBy: c.createdBy, 
          created_by_name: c.created_by_name,
          language_name: c.language_name 
        })));
        console.log('All language live sections:', languageLiveSections.map(s => ({ 
          id: s.id, 
          title: s.title, 
          professor_id: s.professor_id, 
          professor_name: s.professor_name,
          language_name: s.language_name 
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
        setLiveSections(languageLiveSections);
        setFilteredCourses(languageCourses);
        setFilteredLiveSections(languageLiveSections);
        setLanguages(Array.isArray(languagesData) ? languagesData : []);
        setLanguageLevels(Array.isArray(languageLevelsData) ? languageLevelsData : []);
        setProfessors(Array.isArray(professorsData) ? professorsData : []);
        setLiveLanguages(Array.isArray(liveLanguagesData) ? liveLanguagesData : []);
        setLiveLanguageLevels(Array.isArray(liveLanguageLevelsData) ? liveLanguageLevelsData : []);
        setLiveProfessors(Array.isArray(liveProfessorsData) ? liveProfessorsData : []);

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

  // Apply filters whenever filter states change (for regular courses)
  useEffect(() => {
    // Only apply filters if we're in the 'all' filter mode
    if (activeFilter !== 'all') {
      setFilteredCourses(courses);
      return;
    }

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
  }, [courses, selectedLanguage, selectedLevel, selectedProfessor, searchTerm, languages, languageLevels, activeFilter]);

  // Apply filters for live sections
  useEffect(() => {
    // Only apply filters if we're in the 'live' filter mode
    if (activeFilter !== 'live') {
      setFilteredLiveSections(liveSections);
      return;
    }

    let filtered = [...liveSections];

    // Filter by language
    if (selectedLanguage) {
      filtered = filtered.filter(section => section.language_name === selectedLanguage);
    }

    // Filter by level (only if language is selected)
    if (selectedLevel && selectedLanguage) {
      filtered = filtered.filter(section => section.language_level_name === selectedLevel);
    }

    // Filter by professor
    if (selectedProfessor) {
      filtered = filtered.filter(section => {
        return String(section.professor_id) === String(selectedProfessor);
      });
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(section => 
        section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredLiveSections(filtered);
  }, [liveSections, selectedLanguage, selectedLevel, selectedProfessor, searchTerm, liveLanguages, liveLanguageLevels, activeFilter]);

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

  // Group live sections by language
  const groupLiveSectionsByLanguage = () => {
    const grouped = {};
    
    if (!Array.isArray(filteredLiveSections)) {
      return grouped;
    }
    
    filteredLiveSections.forEach(section => {
      const languageName = section.language_name || 'Unknown Language';
      
      if (!grouped[languageName]) {
        grouped[languageName] = [];
      }
      grouped[languageName].push(section);
    });

    return grouped;
  };

  const groupedLiveSections = groupLiveSectionsByLanguage();

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

  // Filter live sections by selected language for the button filter
  const getFilteredLiveSectionsByLanguage = () => {
    if (!selectedLanguageFilter) {
      return groupedLiveSections;
    }
    
    const filtered = {};
    Object.keys(groupedLiveSections).forEach(languageName => {
      if (languageName === selectedLanguageFilter) {
        filtered[languageName] = groupedLiveSections[languageName];
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
        <section className="relative overflow-hidden mt-[2px] bg-gradient-to-r from-[#194cbf] via-[#2d6fd8] to-[#61a1ff]">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
          </div>
          <div className="relative container mx-auto px-4 py-12 md:py-16">
            <div className="text-right max-w-4xl mx-auto">
              <h1 className="text-white text-2xl md:text-4xl lg:text-5xl font-bold font-nunito leading-tight mb-4">
                <span className="block mb-1">تعلّم</span>
                <span className="bg-gradient-to-r from-blue-200 to-blue-50 bg-clip-text text-transparent">
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
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-blue-100/20 to-blue-50/30"></div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/10 to-blue-300/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-blue-300/10 to-blue-400/10 rounded-full blur-3xl"></div>

                    {/* Header */}
                    <div className="relative z-10 p-4 sm:p-6 border-b border-gray-100/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#194cbf] to-[#61a1ff] rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                          <svg className="text-white text-sm sm:text-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 bg-clip-text text-transparent">
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
                            <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-[#194cbf] transition-colors duration-200">
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
                                {(activeFilter === 'all' ? languages : liveLanguages).map((language) => (
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
                                {(activeFilter === 'all' ? languageLevels : liveLanguageLevels)
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
                            <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-[#61a1ff] transition-colors duration-200">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                                الأستاذ
                              </span>
                            </label>
                            <div className="relative">
                              <select
                                value={selectedProfessor}
                                onChange={(e) => setSelectedProfessor(e.target.value)}
                                className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer"
                                dir="rtl"
                              >
                                <option value="">جميع الأساتذة</option>
                                {(activeFilter === 'all' ? professors : liveProfessors).map((professor) => (
                                  <option key={professor.id} value={professor.id}>
                                    {professor.name}
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
                        </div>

                        {/* Selected Filters Summary */}
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-100">
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
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {(activeFilter === 'all' ? professors : liveProfessors).find(p => p.id === selectedProfessor)?.name || selectedProfessor}
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
                    <div className="absolute bottom-8 left-8 w-2 h-2 bg-blue-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 left-4 w-1 h-1 bg-blue-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Language Filter Section */}
        {!loading && (Object.keys(groupedCourses).length > 0 || Object.keys(groupedLiveSections).length > 0) && (
          <section className="py-8 bg-white shadow-sm">
            <div className="container mx-auto px-4">
              {/* Combined Filter Buttons - Language Specific Filters Only */}
              <div className="flex flex-col md:flex-row md:justify-between items-center gap-4 mb-6 px-4 md:px-10">
                {/* Hidden - الدورات المحفوظة button removed per client request */}
                <div className="hidden">
                  <button
                    onClick={() => setActiveFilter('all')}
                    className="px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold transition-all duration-300 text-sm md:text-base bg-white text-gray-700 border-2 border-gray-200"
                  >
                    الدورات المحفوظة 
                  </button>
                </div>

                {/* Language Specific Filter Buttons - Show only for live sections */}
                {Object.keys(groupedLiveSections).length > 0 && (
                  <div className="flex flex-wrap justify-center md:justify-end gap-2 md:gap-4 w-full md:w-auto">
                    <button
                      onClick={() => handleLanguageFilter(null)}
                      className={`px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold transition-all duration-300 text-sm md:text-base ${
                        selectedLanguageFilter === null 
                          ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg' 
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300 hover:shadow-md'
                      }`}
                    >
                     جميع اللغات 
                      {selectedLanguageFilter === null && (
                        <span className="ml-1 md:ml-2 bg-white/20 px-1 md:px-2 py-0.5 md:py-1 rounded-full text-xs">
                          {Object.values(groupedLiveSections).flat().length}
                        </span>
                      )}
                    </button>
                    
                    {Object.keys(groupedLiveSections).map((languageName) => {
                      const languageLiveSectionCount = groupedLiveSections[languageName].length;
                      
                      return (
                        <button
                          key={languageName}
                          onClick={() => handleLanguageFilter(languageName)}
                          className={`px-4 md:px-6 py-2 md:py-3 rounded-full font-semibold transition-all duration-300 text-sm md:text-base ${
                            selectedLanguageFilter === languageName 
                              ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg' 
                              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-red-300 hover:shadow-md'
                          }`}
                        >
                          {languageName}
                          <span className={`ml-1 md:ml-2 px-1 md:px-2 py-0.5 md:py-1 rounded-full text-xs ${
                            selectedLanguageFilter === languageName 
                              ? 'bg-white/20' 
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {languageLiveSectionCount}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}



        {/* Languages Grid */}
        <div className="relative">
          {loading ? (
            <div className="text-center py-16">Loading...</div>
          ) : (activeFilter === 'all' && filteredCourses.length === 0) || (activeFilter === 'live' && filteredLiveSections.length === 0 && languageSessions.length === 0) ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                {activeFilter === 'all' ? 'لا توجد دورات لغات متاحة حالياً' : 'لا توجد جلسات لايف متاحة حالياً'}
              </h3>
              <p className="text-gray-600">
                {activeFilter === 'all' ? 'سيتم إضافة دورات جديدة قريباً' : 'سيتم إضافة جلسات لايف جديدة قريباً'}
              </p>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Show Regular Courses */}
              {activeFilter === 'all' && Object.entries(getFilteredCoursesByLanguage()).map(([languageName, languageCourses]) => (
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

              {/* Standalone live sessions on a language path, under the دورات and
                  filtered by the same language chip. */}
              {activeFilter === 'live' && (() => {
                const shown = languageSessions.filter((session) =>
                  !selectedLanguageFilter || session.language_name === selectedLanguageFilter);
                if (shown.length === 0) return null;
                return (
                  <div className="space-y-6">
                    <div className="text-center">
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">حصص مباشرة</h3>
                      <p className="text-gray-600">{shown.length} حصة متاحة</p>
                    </div>
                    <div dir="rtl" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center relative z-10">
                      {shown.map((session) => (
                        <LiveCard key={session.id} session={session} />
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Show Live Sections */}
              {activeFilter === 'live' && Object.entries(getFilteredLiveSectionsByLanguage()).map(([languageName, languageLiveSections]) => (
                <div key={languageName} className="space-y-6">
                  {/* Language Header */}
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">{languageName}</h3>
                    <p className="text-gray-600">{languageLiveSections.length} جلسة لايف متاحة</p>
                  </div>
                  
                  {/* Live Sections Grid for this language */}
                  <div dir="rtl" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8 justify-items-center relative z-10">
                    {languageLiveSections.map((section) => (
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