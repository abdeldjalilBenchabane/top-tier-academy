import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import useStickySearch from "../hooks/useStickySearch";
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";
import LiveSectionCard from "../components/ui/TTHLiveSectionCard";
import SearchFilter from "../components/ui/TTHSearchFilter";

export default function Session() {
  const [liveSections, setLiveSections] = useState([]);
  const [filteredLiveSections, setFilteredLiveSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useStickySearch('session');
  
  // Filter states
  const [showFilters, setShowFilters] = useState(true);
  const [selectedLevelId, setSelectedLevelId] = useState('');
  const [selectedYearId, setSelectedYearId] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  const [selectedProfessor, setSelectedProfessor] = useState('');

  // Arriving from the landing page with ?level=&material= should land on the
  // already-filtered result, not on an unfiltered list.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const level = searchParams.get('level');
    const material = searchParams.get('material');
    const speciality = searchParams.get('speciality');
    const year = searchParams.get('year');
    if (level) setSelectedLevelId(level);
    if (year) setSelectedYearId(year);
    if (speciality) setSelectedSpeciality(speciality);
    if (material) setSelectedMaterial(material);
  }, [searchParams]);
  
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
          console.log('=== LIVE SECTIONS API RESPONSE ===');
          console.log('Raw API response:', liveSectionsData);
          console.log('Sample section:', liveSectionsData[0]);
          
          // Filter for live sections with education hierarchy (material_id is not null)
          const educationLiveSections = liveSectionsData.filter(section => 
            section.material_id !== null && 
            section.material_id !== undefined && 
            section.material_id !== '' &&
            section.status === 'approved'
          );
          
          console.log('=== FILTERED EDUCATION SECTIONS ===');
          console.log('Total sections:', liveSectionsData.length);
          console.log('Education sections:', educationLiveSections.length);
          console.log('Sample education section:', educationLiveSections[0]);
          
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
    console.log('=== EXTRACTING FILTER DATA ===');
    console.log('Sections to extract from:', sections);
    
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
    console.log('Extracted levels:', levelsData);

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
    console.log('Extracted years:', yearsData);

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
    console.log('Extracted specialities:', specialitiesData);

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
    console.log('Extracted materials:', materialsData);

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
    console.log('Extracted professors:', professorsData);
  };

  // Dynamic filtering functions (same logic as TTHCourses)
  const getFilteredYears = () => {
    if (!selectedLevelId || selectedLevelId === 'all') return [];
    
    console.log('=== GET FILTERED YEARS ===');
    console.log('Selected level ID:', selectedLevelId);
    console.log('Available live sections:', liveSections.length);
    
    // Get unique years from live sections that belong to the selected level
    const yearMap = new Map();
    liveSections.forEach(section => {
      console.log('Processing section:', {
        title: section.title,
        level_name: section.level_name,
        year_name: section.year_name,
        level_id: section.level_id
      });
      
      if (section.level_name === selectedLevelId && section.year_name) {
        yearMap.set(section.year_name, {
          id: section.year_name,
          name: section.year_name,
          levelId: section.level_name
        });
      }
    });
    const years = Array.from(yearMap.values());
    console.log(`Years for level "${selectedLevelId}":`, years);
    return years;
  };
  
  const getFilteredSpecialities = () => {
    if (!selectedYearId || selectedYearId === 'all') return [];
    
    console.log('=== GET FILTERED SPECIALITIES ===');
    console.log('Selected level ID:', selectedLevelId);
    console.log('Selected year ID:', selectedYearId);
    
    // Check if the selected year has any specialities by looking at actual live section data
    // BUT only for the selected level and year combination
    const specialityMap = new Map();
    liveSections.forEach(section => {
      console.log('Processing section for specialities:', {
        title: section.title,
        level_name: section.level_name,
        year_name: section.year_name,
        speciality_name: section.speciality_name
      });
      
      if (section.year_name === selectedYearId && 
          section.level_name === selectedLevelId && 
          section.speciality_name && 
          section.speciality_name.trim() !== '') {
        specialityMap.set(section.speciality_name, {
          id: section.speciality_name,
          name: section.speciality_name,
          yearId: section.year_name
        });
      }
    });
    const specialities = Array.from(specialityMap.values());
    console.log(`Specialities for level "${selectedLevelId}" and year "${selectedYearId}":`, specialities);
    return specialities;
  };
  
  const getFilteredMaterials = () => {
    if (!selectedYearId || selectedYearId === 'all') return [];
    
    console.log('=== GET FILTERED MATERIALS ===');
    console.log('Selected level ID:', selectedLevelId);
    console.log('Selected year ID:', selectedYearId);
    
    // Get materials for the selected year, but only for the selected level and year combination
    const materialMap = new Map();
    liveSections.forEach(section => {
      console.log('Processing section for materials:', {
        title: section.title,
        level_name: section.level_name,
        year_name: section.year_name,
        material_name: section.material_name
      });
      
      if (section.year_name === selectedYearId && 
          section.level_name === selectedLevelId && 
          section.material_name) {
        materialMap.set(section.material_name, {
          id: section.material_name,
          name: section.material_name,
          specialityId: section.speciality_name,
          yearId: section.year_name
        });
      }
    });
    const materials = Array.from(materialMap.values());
    console.log(`Materials for level "${selectedLevelId}" and year "${selectedYearId}":`, materials);
    return materials;
  };

  // Get filtered professors based on current filters
  const getFilteredProfessors = () => {
    let filtered = liveSections;

    // Apply the same filters as in getAdvancedFilteredLiveSections
    if (selectedLevelId && selectedLevelId !== 'all') {
      filtered = filtered.filter(section => section.level_name === selectedLevelId);
    }
    if (selectedYearId && selectedYearId !== 'all') {
      filtered = filtered.filter(section => section.year_name === selectedYearId);
    }
    if (selectedSpeciality && selectedSpeciality !== 'all') {
      filtered = filtered.filter(section => section.speciality_name === selectedSpeciality);
    }
    if (selectedMaterial && selectedMaterial !== 'all') {
      filtered = filtered.filter(section => section.material_name === selectedMaterial);
    }

    // Extract unique professors from filtered live sections
    const professorMap = new Map();
    filtered.forEach(section => {
      if (section.professor_name && section.professor_id) {
        professorMap.set(section.professor_id, {
          id: section.professor_id,
          name: section.professor_name
        });
      }
    });

    return Array.from(professorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Get all available professors (for independent professor filter)
  const getAllProfessors = () => {
    const professorMap = new Map();
    liveSections.forEach(section => {
      if (section.professor_name && section.professor_id) {
        professorMap.set(section.professor_id, {
          id: section.professor_id,
          name: section.professor_name
        });
      }
    });
    return Array.from(professorMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  // Apply advanced filters to live sections (same logic as TTHCourses)
  const getAdvancedFilteredLiveSections = () => {
    console.log('=== FILTERING DEBUG ===');
    console.log('Selected filters:', {
      selectedLevelId,
      selectedYearId,
      selectedSpeciality,
      selectedMaterial,
      selectedProfessor
    });

    let filtered = liveSections;
    console.log('Total live sections count:', filtered.length);

    // Filter by level
    if (selectedLevelId && selectedLevelId !== 'all') {
      const beforeLevel = filtered.length;
      filtered = filtered.filter(section => section.level_name === selectedLevelId);
      console.log(`Level filter: ${beforeLevel} -> ${filtered.length} sections`);
      console.log('Sections after level filter:', filtered.map(s => ({ title: s.title, level: s.level_name })));
    }

    // Filter by year
    if (selectedYearId && selectedYearId !== 'all') {
      const beforeYear = filtered.length;
      filtered = filtered.filter(section => section.year_name === selectedYearId);
      console.log(`Year filter: ${beforeYear} -> ${filtered.length} sections`);
      console.log('Sections after year filter:', filtered.map(s => ({ title: s.title, year: s.year_name })));
    }

    // Filter by speciality (only if speciality is selected and exists)
    if (selectedSpeciality && selectedSpeciality !== 'all') {
      const beforeSpeciality = filtered.length;
      filtered = filtered.filter(section => section.speciality_name === selectedSpeciality);
      console.log(`Speciality filter: ${beforeSpeciality} -> ${filtered.length} sections`);
      console.log('Sections after speciality filter:', filtered.map(s => ({ title: s.title, speciality: s.speciality_name })));
    }

    // Filter by material
    if (selectedMaterial && selectedMaterial !== 'all') {
      const beforeMaterial = filtered.length;
      filtered = filtered.filter(section => section.material_name === selectedMaterial);
      console.log(`Material filter: ${beforeMaterial} -> ${filtered.length} sections`);
      console.log('Sections after material filter:', filtered.map(s => ({ title: s.title, material: s.material_name })));
    }

    // Filter by professor
    if (selectedProfessor && selectedProfessor !== 'all') {
      const beforeProfessor = filtered.length;
      console.log('=== PROFESSOR FILTER DEBUG ===');
      console.log('Selected professor ID:', selectedProfessor, 'Type:', typeof selectedProfessor);
      console.log('Sections before professor filter:', filtered.map(s => ({ 
        title: s.title, 
        professor_id: s.professor_id, 
        professor_idType: typeof s.professor_id,
        professor_name: s.professor_name,
        matches: s.professor_id == selectedProfessor // Using == for type coercion
      })));
      
      filtered = filtered.filter(section => section.professor_id == selectedProfessor); // Using == for type coercion
      console.log(`Professor filter: ${beforeProfessor} -> ${filtered.length} sections`);
      console.log('Sections after professor filter:', filtered.map(s => ({ title: s.title, professor: s.professor_name })));
    }

    console.log('Final filtered sections:', filtered);
    return filtered;
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
        section.speciality_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        section.professor_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredLiveSections(filtered);
  }, [searchTerm, selectedLevelId, selectedYearId, selectedSpeciality, selectedMaterial, selectedProfessor, liveSections]);

  // Group live sections by level and year (like TTHCourses)
  const groupLiveSectionsByLevelYear = () => {
    const grouped = {};
    
    filteredLiveSections.forEach(section => {
      let pathName = '';
      
      // Handle cases where level_name or year_name might be missing
      if (section.level_name && section.year_name) {
        pathName = `${section.level_name} - ${section.year_name}`;
      } else if (section.level_name) {
        pathName = `${section.level_name} - دورات أخرى`;
      } else if (section.year_name) {
        pathName = `${section.year_name} - دورات أخرى`;
      } else {
        pathName = 'دورات أخرى';
      }
      
      if (!grouped[pathName]) {
        grouped[pathName] = [];
      }
      grouped[pathName].push(section);
    });
    
    return grouped;
  };

  // Group live sections by material (existing function)
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100 flex flex-col" dir="rtl">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative overflow-hidden mt-[2px] bg-gradient-to-r from-[#194cbf] via-[#2d6fd8] to-[#61a1ff]">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
            <div className="absolute top-0 right-0 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
          </div>
          
          {/* Hero Content */}
          <div className="relative z-10 container mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-white text-3xl md:text-5xl lg:text-6xl font-bold font-nunito leading-tight mb-6">
                <span className="block mb-2">انضم الى</span>
                <span className="bg-gradient-to-r from-blue-200 to-blue-50 bg-clip-text text-transparent">
                  الدورات
                </span>
              </h1>
              <p className="text-blue-100 text-lg md:text-xl lg:text-2xl font-bold font-poppins leading-relaxed mb-8">
                حدد المادة الدراسية المناسبة لك
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-4 justify-center mt-8">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                  <span className="font-bold">{filteredLiveSections.length}+</span> دورة متاحة
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                  <span className="font-bold">500+</span> طالب
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                  <span className="font-bold">⭐ 4.9</span> تقييم
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-8">
        
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
                  placeholder="البحث في الدورات المتاحة..."
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

        {/* Section Title */}
        <div className="text-center mb-8">
          <h2 className="text-primary text-3xl font-bold font-rowdies leading-[24px]">
            <span className="text-primary">الدورات </span>
            <span style={{ color: '#22d3ee' }}>المتاحة</span> 
          </h2>
        </div>

        {/* Live Sections Grid */}
        <div className="relative">
          {loading ? (
            <div className="text-center py-16">Loading...</div>
          ) : filteredLiveSections.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                لا توجد دورات متاحة حالياً
              </h3>
              <p className="text-gray-600">
                سيتم إضافة دورات جديدة قريباً
              </p>
            </div>
          ) : (
            <div className="space-y-16">
              {/* Show Live Sections grouped by level and year */}
              {Object.entries(groupLiveSectionsByLevelYear()).map(([pathName, pathLiveSections]) => (
                <div key={pathName}>
                  {/* Level-Year Header */}
                  <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-rowdies mb-4 relative">
                      <span className="text-gray-800">دورات </span>
                      <span className="bg-gradient-to-r from-[#194cbf] to-blue-600 bg-clip-text text-transparent">
                        {pathName}
                      </span>
                    </h2>
                  </div>
                  
                  {/* Live Sections Grid for this level-year */}
                  <div dir="rtl" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8 justify-items-center">
                    {pathLiveSections.map((section, index) => (
                      <div
                        key={section.id}
                        className="w-full max-w-sm"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <LiveSectionCard section={section} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 