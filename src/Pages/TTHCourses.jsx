import React, { useEffect, useState } from "react";
import useStickySearch from "../hooks/useStickySearch";
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";
import CourseCard from "../components/ui/TTHCourseCard";
import { pointsAPI } from '@/services/api';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function Courses() {
  const [coursesByPath, setCoursesByPath] = useState({});
  const [allCourses, setAllCourses] = useState([]);
  const [availableLevels, setAvailableLevels] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(true); // Changed to true to show filters by default
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState(''); // Added professor filter state

  // The search box on this page was rendered with no value and no onChange,
  // so typing in it did nothing at all. Wire it up and keep it across
  // navigation so returning from a course does not reset it.
  const [searchTerm, setSearchTerm] = useStickySearch('courses');

  function applySearch(grouped) {
    const q = (searchTerm || '').trim().toLowerCase();
    if (!q) return grouped;
    const out = {};
    Object.keys(grouped || {}).forEach(pathName => {
      const matches = (grouped[pathName] || []).filter(course =>
        course.title?.toLowerCase().includes(q) ||
        course.description?.toLowerCase().includes(q) ||
        course.material_name?.toLowerCase().includes(q) ||
        course.created_by_name?.toLowerCase().includes(q) ||
        pathName?.toLowerCase().includes(q)
      );
      if (matches.length > 0) out[pathName] = matches;
    });
    return out;
  }
  const [levels, setLevels] = useState([]);
  const [years, setYears] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [professors, setProfessors] = useState([]);

  useEffect(() => {
    async function fetchAllCourses() {
      setLoading(true);
      try {
        const res = await fetch('/api/courses?status=approved');
        let allCourses = await res.json();
        
        let purchasedIds = [];
        if (localStorage.getItem('token')) {
          try {
            const purchasedRes = await pointsAPI.getMyCourses();
            purchasedIds = purchasedRes.courseIds || [];
          } catch (e) { /* ignore if not logged in */ }
        }

        // Also check localStorage for purchased courses (iOS Safari fallback)
        try {
          const localPurchased = JSON.parse(localStorage.getItem('purchasedCourses') || '[]');
          purchasedIds = [...new Set([...purchasedIds, ...localPurchased])];
        } catch (e) {
          // Ignore localStorage errors
        }

        allCourses = allCourses.map(course => ({ ...course, purchased: purchasedIds.includes(course.id) }));

        // Fetch material prices for education courses
        let materialsData = [];
        try {
          const materialsRes = await fetch('/api/courses/materials/list');
          if (materialsRes.ok) {
            materialsData = await materialsRes.json();
          }
        } catch (e) { /* ignore */ }

        allCourses = allCourses.map(course => {
          // For education courses, use material price if course price is 0/null
          if (!course.language_level_id) {
            let price = course.price;
            if (!price || price === 0) {
              price = course.material_price || 0;
            }
            return { ...course, price };
          }
          return course;
        });

        // Extract available levels from courses
        const levels = [...new Set(allCourses
          .filter(course => course.level_name && !course.language_level_id)
          .map(course => course.level_name)
        )].sort();
        setAvailableLevels(levels);

        // Store all courses for filtering
        setAllCourses(allCourses);

        // Debug: Log course data structure
        console.log('=== COURSE DATA DEBUG ===');
        console.log('Total courses:', allCourses.length);
        console.log('Educational courses:', allCourses.filter(c => !c.language_level_id).length);
        console.log('Language courses:', allCourses.filter(c => c.language_level_id).length);
        console.log('Sample educational course:', allCourses.find(c => !c.language_level_id));
        console.log('Courses with professor data:', allCourses.filter(c => c.createdBy && c.created_by_name).map(c => ({
          title: c.title,
          createdBy: c.createdBy,
          created_by_name: c.created_by_name,
          isEducational: !c.language_level_id
        })));

        // Extract hierarchical data from courses for filters
        try {
          console.log('=== DEBUGGING FRONTEND ===');
          console.log('All courses:', allCourses);
          console.log('Sample course:', allCourses[0]);
          
          // Extract levels from courses (using level_name as both id and name since we don't have level_id)
          const levelMap = new Map();
          allCourses.forEach(course => {
            if (course.level_name && !course.language_level_id) {
              levelMap.set(course.level_name, {
                id: course.level_name, // Use name as ID since we don't have level_id
                name: course.level_name
              });
            }
          });
          const levelsData = Array.from(levelMap.values());
          setLevels(levelsData);
          console.log('Extracted levels:', levelsData);

          // Extract years from courses (using year_name as both id and name)
          const yearMap = new Map();
          allCourses.forEach(course => {
            if (course.year_name && !course.language_level_id) {
              yearMap.set(course.year_name, {
                id: course.year_name, // Use name as ID since we don't have year_id
                name: course.year_name,
                levelId: course.level_name
              });
            }
          });
          const yearsData = Array.from(yearMap.values());
          setYears(yearsData);
          console.log('Extracted years:', yearsData);

          // Extract specialities from courses (using speciality_name as both id and name)
          const specialityMap = new Map();
          allCourses.forEach(course => {
            if (course.speciality_name && !course.language_level_id) {
              specialityMap.set(course.speciality_name, {
                id: course.speciality_name, // Use name as ID since we don't have speciality_id
                name: course.speciality_name,
                yearId: course.year_name
              });
            }
          });
          const specialitiesData = Array.from(specialityMap.values());
          setSpecialities(specialitiesData);
          console.log('Extracted specialities:', specialitiesData);

          // Extract materials from courses (using material_name as both id and name)
          const materialMap = new Map();
          allCourses.forEach(course => {
            if (course.material_name && !course.language_level_id) {
              materialMap.set(course.material_name, {
                id: course.material_name, // Use name as ID since we don't have material_id
                name: course.material_name,
                specialityId: course.speciality_name,
                yearId: course.year_name,
                price: course.price
              });
            }
          });
          const materialsData = Array.from(materialMap.values());
          setMaterials(materialsData);
          console.log('Extracted materials:', materialsData);

          // Extract professors from courses
          const professorMap = new Map();
          allCourses.forEach(course => {
            if (course.created_by_name && course.createdBy && !course.language_level_id) {
              professorMap.set(course.createdBy, {
                id: course.createdBy,
                name: course.created_by_name
              });
            }
          });
          const professorsData = Array.from(professorMap.values());
          setProfessors(professorsData);
          console.log('Extracted professors:', professorsData);
          console.log('Sample course with professor data:', allCourses.find(c => c.createdBy && c.created_by_name));
        } catch (e) {
          console.error('Error extracting hierarchical data:', e);
        }

        // Group courses by path
        const groupedCourses = allCourses.reduce((acc, course) => {
          if (course.material_name && !course.language_level_id) {
            // Include courses with materials (both with and without specialities)
            const pathName = course.level_name && course.year_name 
              ? `${course.level_name} - ${course.year_name}`
              : 'Other Courses';
            if (!acc[pathName]) {
              acc[pathName] = [];
            }
            acc[pathName].push(course);
          }
          return acc;
        }, {});
        
        setCoursesByPath(groupedCourses);

      } catch (e) {
        console.error("Failed to fetch or group courses:", e);
        setCoursesByPath({});
      } finally {
        setLoading(false);
      }
    }
    fetchAllCourses();
  }, []);

  // Filter courses by selected level (for the level filter buttons)
  const getFilteredCourses = () => {
    if (!selectedLevel) {
      return coursesByPath;
    }
    
    const filtered = {};
    Object.keys(coursesByPath).forEach(pathName => {
      const coursesInPath = coursesByPath[pathName].filter(course => 
        course.level_name === selectedLevel
      );
      if (coursesInPath.length > 0) {
        filtered[pathName] = coursesInPath;
      }
    });
    
    return filtered;
  };

  // Get courses with advanced filtering
  const getDisplayCourses = () => {
    // If advanced filters are active, use them
    if (selectedLevelId || selectedYearId || selectedSpeciality || selectedMaterial || selectedProfessor) {
      const advancedFiltered = getAdvancedFilteredCourses();
      console.log('=== DISPLAY DEBUG ===');
      console.log('Advanced filtered courses for display:', advancedFiltered);
      
      // Group by path for display
      const grouped = {};
      advancedFiltered.forEach(course => {
        console.log('Processing course for grouping:', {
          title: course.title,
          level_name: course.level_name,
          year_name: course.year_name,
          speciality_name: course.speciality_name,
          material_name: course.material_name,
          createdBy: course.createdBy,
          created_by_name: course.created_by_name
        });
        
        let pathName = '';
        
        // Handle cases where level_name or year_name might be missing
        if (course.level_name && course.year_name) {
          if (course.speciality_name) {
            // 4-path: Level > Year > Speciality > Material
            pathName = `${course.level_name} - ${course.year_name}`;
          } else {
            // 3-path: Level > Year > Material
            pathName = `${course.level_name} - ${course.year_name}`;
          }
        } else if (course.level_name) {
          // Only level available
          pathName = `${course.level_name} - دورات أخرى`;
        } else {
          // No level or year info
          pathName = 'دورات أخرى';
        }
        
        console.log('Generated path name:', pathName);
        
        if (!grouped[pathName]) {
          grouped[pathName] = [];
        }
        grouped[pathName].push(course);
      });
      
      console.log('Grouped courses for display:', grouped);
      return grouped;
    }
    
    // Otherwise use the regular level filter
    return getFilteredCourses();
  };

  const handleLevelFilter = (level) => {
    setSelectedLevel(selectedLevel === level ? null : level);
  };

  // Filter data for the advanced filters
  const gradeOptions = [
    { label: 'ابتدائي', years: ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة'], subjects: ['اللغة العربية', 'الرياضيات', 'التربية الإسلامية', 'التربية العلمية', 'التربية المدنية', 'اللغة الفرنسية', 'اللغة الإنجليزية'] },
    { label: 'متوسط', years: ['الأولى', 'الثانية', 'الثالثة', 'الرابعة'], subjects: ['اللغة العربية', 'الرياضيات', 'العلوم الطبيعية', 'الفيزياء', 'التاريخ والجغرافيا', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'التربية الإسلامية'] },
    { label: 'ثانوي', years: ['الأولى', 'الثانية', 'الثالثة'], subjects: ['اللغة العربية', 'الرياضيات', 'العلوم الطبيعية', 'الفيزياء', 'الكيمياء', 'التاريخ والجغرافيا', 'الفلسفة', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'العلوم الإسلامية'] },
  ];

  // Find the current grade object
  const currentGrade = gradeOptions.find(g => g.label === selectedGrade);

  // Update year and subject when grade changes
  const handleGradeChange = (e) => {
    const newGrade = e.target.value;
    const gradeObj = gradeOptions.find(g => g.label === newGrade);
    setSelectedGrade(newGrade);
    setSelectedYear(gradeObj ? gradeObj.years[0] : '');
    setSelectedSubject(gradeObj ? gradeObj.subjects[0] : '');
  };

  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };

  const handleSubjectChange = (e) => {
    setSelectedSubject(e.target.value);
  };

  // Dynamic filtering functions
  const getFilteredYears = () => {
    if (!selectedLevelId || selectedLevelId === 'all') return [];
    
    // Get unique years from courses that belong to the selected level
    const yearMap = new Map();
    allCourses.forEach(course => {
      if (course.level_name === selectedLevelId && course.year_name && !course.language_level_id) {
        yearMap.set(course.year_name, {
          id: course.year_name,
          name: course.year_name,
          levelId: course.level_name
        });
      }
    });
    const years = Array.from(yearMap.values());
    return years;
  };
  
  const getFilteredSpecialities = () => {
    if (!selectedYearId || selectedYearId === 'all') return [];
    
    // Check if the selected year has any specialities by looking at actual course data
    // BUT only for the selected level and year combination
    const specialityMap = new Map();
    allCourses.forEach(course => {
      if (course.year_name === selectedYearId && 
          course.level_name === selectedLevelId && 
          course.speciality_name && 
          course.speciality_name.trim() !== '' && 
          !course.language_level_id) {
        specialityMap.set(course.speciality_name, {
          id: course.speciality_name,
          name: course.speciality_name,
          yearId: course.year_name
        });
      }
    });
    const specialities = Array.from(specialityMap.values());
    console.log(`Specialities for level "${selectedLevelId}" and year "${selectedYearId}":`, specialities);
    return specialities;
  };
  
  const getFilteredMaterials = () => {
    if (!selectedYearId || selectedYearId === 'all') return [];
    
    // Get materials for the selected year, but only for the selected level and year combination
    const materialMap = new Map();
    allCourses.forEach(course => {
      if (course.year_name === selectedYearId && 
          course.level_name === selectedLevelId && 
          course.material_name && 
          !course.language_level_id) {
        materialMap.set(course.material_name, {
          id: course.material_name,
          name: course.material_name,
          specialityId: course.speciality_name,
          yearId: course.year_name,
          price: course.material_price
        });
      }
    });
    const materials = Array.from(materialMap.values());
    console.log(`Materials for level "${selectedLevelId}" and year "${selectedYearId}":`, materials);
    return materials;
  };

  // Get filtered professors based on current filters
  const getFilteredProfessors = () => {
    let filtered = allCourses.filter(course => !course.language_level_id);

    // Apply the same filters as in getAdvancedFilteredCourses
    if (selectedLevelId && selectedLevelId !== 'all') {
      filtered = filtered.filter(course => course.level_name === selectedLevelId);
    }
    if (selectedYearId && selectedYearId !== 'all') {
      filtered = filtered.filter(course => course.year_name === selectedYearId);
    }
    if (selectedSpeciality && selectedSpeciality !== 'all') {
      filtered = filtered.filter(course => course.speciality_name === selectedSpeciality);
    }
    if (selectedMaterial && selectedMaterial !== 'all') {
      filtered = filtered.filter(course => course.material_name === selectedMaterial);
    }

    // Extract unique professors from filtered courses
    const professorMap = new Map();
    filtered.forEach(course => {
      if (course.created_by_name && course.createdBy) {
        professorMap.set(course.createdBy, {
          id: course.createdBy,
          name: course.created_by_name
        });
      }
    });

    return Array.from(professorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get all available professors (for independent professor filter)
  const getAllProfessors = () => {
    const professorMap = new Map();
    allCourses.forEach(course => {
      if (course.created_by_name && course.createdBy && !course.language_level_id) {
        professorMap.set(course.createdBy, {
          id: course.createdBy,
          name: course.created_by_name
        });
      }
    });
    return Array.from(professorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Apply advanced filters to courses
  const getAdvancedFilteredCourses = () => {
    console.log('=== FILTERING DEBUG ===');
    console.log('Selected filters:', {
      selectedLevelId,
      selectedYearId,
      selectedSpeciality,
      selectedMaterial,
      selectedProfessor
    });

    let filtered = allCourses.filter(course => !course.language_level_id); // Only educational courses
    console.log('Educational courses count:', filtered.length);

    // Filter by level
    if (selectedLevelId && selectedLevelId !== 'all') {
      const beforeLevel = filtered.length;
      filtered = filtered.filter(course => course.level_name === selectedLevelId);
      console.log(`Level filter: ${beforeLevel} -> ${filtered.length} courses`);
      console.log('Courses after level filter:', filtered.map(c => ({ title: c.title, level: c.level_name })));
    }

    // Filter by year
    if (selectedYearId && selectedYearId !== 'all') {
      const beforeYear = filtered.length;
      filtered = filtered.filter(course => course.year_name === selectedYearId);
      console.log(`Year filter: ${beforeYear} -> ${filtered.length} courses`);
      console.log('Courses after year filter:', filtered.map(c => ({ title: c.title, year: c.year_name })));
    }

    // Filter by speciality (only if speciality is selected and exists)
    if (selectedSpeciality && selectedSpeciality !== 'all') {
      const beforeSpeciality = filtered.length;
      filtered = filtered.filter(course => course.speciality_name === selectedSpeciality);
      console.log(`Speciality filter: ${beforeSpeciality} -> ${filtered.length} courses`);
      console.log('Courses after speciality filter:', filtered.map(c => ({ title: c.title, speciality: c.speciality_name })));
    }

    // Filter by material
    if (selectedMaterial && selectedMaterial !== 'all') {
      const beforeMaterial = filtered.length;
      filtered = filtered.filter(course => course.material_name === selectedMaterial);
      console.log(`Material filter: ${beforeMaterial} -> ${filtered.length} courses`);
      console.log('Courses after material filter:', filtered.map(c => ({ title: c.title, material: c.material_name })));
    }

    // Filter by professor
    if (selectedProfessor && selectedProfessor !== 'all') {
      const beforeProfessor = filtered.length;
      console.log('=== PROFESSOR FILTER DEBUG ===');
      console.log('Selected professor ID:', selectedProfessor, 'Type:', typeof selectedProfessor);
      console.log('Courses before professor filter:', filtered.map(c => ({ 
        title: c.title, 
        createdBy: c.createdBy, 
        createdByType: typeof c.createdBy,
        created_by_name: c.created_by_name,
        matches: c.createdBy == selectedProfessor // Using == for type coercion
      })));
      
      filtered = filtered.filter(course => course.createdBy == selectedProfessor); // Using == for type coercion
      console.log(`Professor filter: ${beforeProfessor} -> ${filtered.length} courses`);
      console.log('Courses after professor filter:', filtered.map(c => ({ title: c.title, professor: c.created_by_name })));
    }

    console.log('Final filtered courses:', filtered);
    return filtered;
  };

  // Test function to verify professor filtering
  const testProfessorFilter = () => {
    console.log('=== PROFESSOR FILTER TEST ===');
    console.log('All courses count:', allCourses.length);
    console.log('Educational courses count:', allCourses.filter(c => !c.language_level_id).length);
    console.log('Courses with professor data:', allCourses.filter(c => c.createdBy && c.created_by_name && !c.language_level_id).length);
    
    const professors = getAllProfessors();
    console.log('Available professors:', professors);
    
    if (professors.length > 0) {
      const testProfessor = professors[0];
      console.log('Testing with professor:', testProfessor);
      
      const coursesForProfessor = allCourses.filter(c => 
        !c.language_level_id && c.createdBy == testProfessor.id
      );
      console.log('Courses for this professor:', coursesForProfessor.map(c => c.title));
    }
  };

  // Call test function when component mounts
  useEffect(() => {
    if (allCourses.length > 0) {
      testProfessorFilter();
    }
  }, [allCourses]);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 flex flex-col">
      <Navbar />
      
      <main className="flex-grow">
        
        <section className="relative overflow-hidden mt-[2px] bg-gradient-to-r from-[#194cbf] via-[#2d6fd8] to-[#61a1ff]">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
          </div>
          
          <div className="relative container mx-auto px-4 py-12 md:py-16">
            <div className="text-right max-w-4xl mx-auto">
              <h1 className="text-white text-2xl md:text-4xl lg:text-5xl font-bold font-nunito leading-tight mb-4">
                <span className="block mb-1">انضم الى</span>
                <span className="bg-gradient-to-r from-blue-200 to-blue-50 bg-clip-text text-transparent">
                  نخبة من الحصص الفريدة
                </span>
              </h1>
              <p className="text-blue-100 text-base md:text-lg lg:text-xl font-bold font-poppins leading-relaxed mb-6">
                حدد المرحلة الدراسية المناسبة لك
              </p>
              
              {/* Stats ou badges */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-end mt-8">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                  <span className="font-bold">100+</span> حصة متاحة
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
                            <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-[#194cbf] transition-colors duration-200">
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
                            <label className="block text-gray-700 font-bold mb-3 text-sm lg:text-base text-right group-hover:text-[#61a1ff] transition-colors duration-200">
                              <span className="inline-flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
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
                                className="appearance-none w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 hover:border-blue-300 focus:border-blue-500 text-sm lg:text-base font-semibold rounded-2xl py-3 lg:py-4 pr-4 pl-12 focus:outline-none focus:ring-4 focus:ring-blue-100 transition-all duration-300 shadow-sm hover:shadow-md text-right cursor-pointer disabled:bg-gray-100"
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
                                <svg className="text-gray-400 group-hover:text-blue-500 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                {getAllProfessors().length === 0 ? (
                                  <option value="" disabled>لا يوجد أساتذة متاحون</option>
                                ) : (
                                  getAllProfessors().map(professor => (
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
                              className="flex items-center justify-center gap-2 text-white px-5 py-2 rounded-xl text-sm font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 bg-gradient-to-r from-blue-600 via-blue-500 to-blue-600 hover:from-blue-700 hover:via-blue-600 hover:to-blue-700 relative overflow-hidden group"
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
                        <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-100">
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
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
                    <div className="absolute bottom-8 left-8 w-2 h-2 bg-blue-400 rounded-full opacity-40 animate-pulse" style={{ animationDelay: '1s' }}></div>
                    <div className="absolute top-1/2 left-4 w-1 h-1 bg-blue-400 rounded-full opacity-50 animate-pulse" style={{ animationDelay: '2s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Level Filter Section */}
        {!loading && availableLevels.length > 0 && (
          <section className="py-8 bg-white shadow-sm">
            <div className="container mx-auto px-4">

              
              <div className="flex flex-wrap justify-center gap-4">
                <button
                  onClick={() => handleLevelFilter(null)}
                  className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                    selectedLevel === null 
                      ? 'bg-gradient-to-r from-[#194cbf] to-[#61a1ff] text-white shadow-lg' 
                      : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  جميع المراحل
                  {selectedLevel === null && (
                    <span className="ml-2 bg-white/20 px-2 py-1 rounded-full text-xs">
                      {Object.values(coursesByPath).flat().length}
                    </span>
                  )}
                </button>
                
                {availableLevels.map((level) => {
                  const levelCourseCount = Object.values(coursesByPath)
                    .flat()
                    .filter(course => course.level_name === level).length;
                  
                  return (
                    <button
                      key={level}
                      onClick={() => handleLevelFilter(level)}
                      className={`px-6 py-3 rounded-full font-semibold transition-all duration-300 ${
                        selectedLevel === level 
                          ? 'bg-gradient-to-r from-[#194cbf] to-[#61a1ff] text-white shadow-lg' 
                          : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-blue-300 hover:shadow-md'
                      }`}
                    >
                      {level}
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                        selectedLevel === level 
                          ? 'bg-white/20' 
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {levelCourseCount}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Courses Section by Path */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 space-y-16">
            {loading ? (
              <div className="text-center">Loading...</div>
            ) : Object.keys(applySearch(getDisplayCourses())).length > 0 ? (
              Object.keys(applySearch(getDisplayCourses())).map(pathName => {
                const filteredCourses = applySearch(getDisplayCourses())[pathName];
                return filteredCourses && filteredCourses.length > 0 ? (
                  <div key={pathName}>
            <div className="text-center mb-12">
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-rowdies mb-4 relative">
                  <span className="text-gray-800">حصص </span>
                  <span className="bg-gradient-to-r from-[#194cbf] to-[#61a1ff] bg-clip-text text-transparent">
                          {pathName}
                  </span>
                </h2>
              </div>
              <div 
                dir="rtl" 
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8 justify-items-center"
              >
                      {filteredCourses.map((course, index) => (
                  <div
                    key={course.id}
                          className="w-full max-w-sm"
                          style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CourseCard course={course} />
                  </div>
                ))}
              </div>
                  </div>
                ) : null;
              })
            ) : (
                <div className="text-center py-16">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-50 to-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد دروس متاحة حالياً</h3>
                  <p className="text-gray-600">سيتم إضافة دروس جديدة قريباً</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}