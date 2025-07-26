import { useState, useEffect } from 'react';

export const useLiveClasses = () => {
  // Filter state
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  
  // Dynamic hierarchy data state (extracted from live sessions)
  const [levels, setLevels] = useState([]);
  const [years, setYears] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [hierarchyLoading, setHierarchyLoading] = useState(false);
  
  // Live sessions state
  const [allLiveSessions, setAllLiveSessions] = useState([]);
  const [liveSessionsByPath, setLiveSessionsByPath] = useState({});
  const [filteredSessions, setFilteredSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isFiltered, setIsFiltered] = useState(false);

  // Extract hierarchical data from live sessions
  const extractHierarchyFromSessions = (sessions) => {
    try {
      console.log('=== EXTRACTING HIERARCHY FROM LIVE SESSIONS ===');
      console.log('Total sessions:', sessions.length);
      
      // Debug: Log the first session to see its structure (only once)
      if (sessions.length > 0 && !extractHierarchyFromSessions.hasLogged) {
        console.log('Sample session structure:', sessions[0]);
        console.log('Available fields:', Object.keys(sessions[0]));
        extractHierarchyFromSessions.hasLogged = true;
      }
      
      // Extract levels from sessions (handle both 3-path and 4-path)
      const levelMap = new Map();
      console.log('🔍 Extracting levels from sessions...');
      sessions.forEach((session, index) => {
        const levelName = session.level_name;
        console.log(`Session ${index + 1}: level_name = "${levelName}"`);
        if (levelName) {
          levelMap.set(levelName, {
            id: levelName,
            name: levelName
          });
        }
      });
      const levelsData = Array.from(levelMap.values());
      console.log('🔍 Extracted levels:', levelsData);
      
      // If no levels found, create a default level for all sessions
      if (levelsData.length === 0 && sessions.length > 0) {
        console.log('🔍 No levels found in data, creating default level');
        levelsData.push({
          id: 'all',
          name: 'جميع المراحل'
        });
      }
      
      setLevels(levelsData);
      
      // Only log once to avoid spam
      if (!extractHierarchyFromSessions.hasLogged) {
        console.log('Extracted levels:', levelsData);
      }

              // Extract years from sessions (handle both 3-path and 4-path)
        const yearMap = new Map();
        sessions.forEach(session => {
          const yearName = session.year_name;
          const levelName = session.level_name;
          if (yearName) {
            yearMap.set(yearName, {
              id: yearName,
              name: yearName,
              levelId: levelName
            });
          }
        });
      const yearsData = Array.from(yearMap.values());
      
      // If no years found, create a default year for all sessions
      if (yearsData.length === 0 && sessions.length > 0) {
        console.log('🔍 No years found in data, creating default year');
        yearsData.push({
          id: 'all',
          name: 'جميع السنوات',
          levelId: null
        });
      }
      
      setYears(yearsData);
      
      if (!extractHierarchyFromSessions.hasLogged) {
        console.log('Extracted years:', yearsData);
      }

              // Extract specialities from sessions (handle both 3-path and 4-path)
        const specialityMap = new Map();
        sessions.forEach(session => {
          const specialityName = session.speciality_name;
          const yearName = session.year_name;
          // Include specialities even if they're null (for 3-path sessions)
          if (specialityName) {
            specialityMap.set(specialityName, {
              id: specialityName,
              name: specialityName,
              yearId: yearName
            });
          }
        });
      const specialitiesData = Array.from(specialityMap.values());
      setSpecialities(specialitiesData);
      
      if (!extractHierarchyFromSessions.hasLogged) {
        console.log('Extracted specialities:', specialitiesData);
      }

              // Extract materials from sessions (handle both 3-path and 4-path)
        const materialMap = new Map();
        sessions.forEach(session => {
          const materialName = session.material_name;
          const specialityName = session.speciality_name;
          const yearName = session.year_name;
          if (materialName) {
            materialMap.set(materialName, {
              id: materialName,
              name: materialName,
              specialityId: specialityName,
              yearId: yearName
            });
          }
        });
      const materialsData = Array.from(materialMap.values());
      
      // If no materials found, create a default material for all sessions
      if (materialsData.length === 0 && sessions.length > 0) {
        console.log('🔍 No materials found in data, creating default material');
        materialsData.push({
          id: 'all',
          name: 'جميع المواد',
          specialityId: null,
          yearId: null
        });
      }
      
      setMaterials(materialsData);
      
      if (!extractHierarchyFromSessions.hasLogged) {
        console.log('Extracted materials:', materialsData);
      }
    } catch (error) {
      console.error('Error extracting hierarchy from sessions:', error);
    }
  };

  // Get all available data for independent filters (similar to TTHCourses)
  const getAllYears = () => {
    const yearMap = new Map();
    allLiveSessions.forEach(session => {
      const yearName = session.year_name;
      const levelName = session.level_name;
      if (yearName) {
        yearMap.set(yearName, {
          id: yearName,
          name: yearName,
          levelId: levelName
        });
      }
    });
    return Array.from(yearMap.values());
  };

  const getAllSpecialities = () => {
    const specialityMap = new Map();
    allLiveSessions.forEach(session => {
      const specialityName = session.speciality_name;
      const yearName = session.year_name;
      const hasSpeciality = !!session.speciality_id; // Only include if session has speciality_id
      if (specialityName && hasSpeciality) {
        specialityMap.set(specialityName, {
          id: specialityName,
          name: specialityName,
          yearId: yearName
        });
      }
    });
    return Array.from(specialityMap.values());
  };

  const getAllMaterials = () => {
    const materialMap = new Map();
    allLiveSessions.forEach(session => {
      const materialName = session.material_name;
      const specialityName = session.speciality_name;
      const yearName = session.year_name;
      if (materialName) {
        materialMap.set(materialName, {
          id: materialName,
          name: materialName,
          specialityId: specialityName,
          yearId: yearName
        });
      }
    });
    return Array.from(materialMap.values());
  };

  // Fetch all live sessions on page load
  useEffect(() => {
    const fetchAllLiveSessions = async () => {
      try {
        setInitialLoading(true);
        setHierarchyLoading(true);
        const response = await fetch('/api/live-sessions');
        if (response.ok) {
                  const data = await response.json();
        console.log('📡 Live sessions API response:', data);
        const sessions = data.sessions || data || [];
        console.log('📋 Processed sessions:', sessions);
        
        // Log session count
        if (sessions.length > 0) {
          console.log('📋 Loaded', sessions.length, 'live sessions');
        }
          setAllLiveSessions(sessions);
          
          // Extract hierarchical data from sessions
          extractHierarchyFromSessions(sessions);
          
          // Group sessions by path (level + year)
          const groupedSessions = sessions.reduce((acc, session) => {
            let pathName = 'البث المباشر';
            
            // Use the same field name detection logic
            const levelName = session.level_name || session.level || session.education_level || session.grade;
            const yearName = session.year_name || session.year || session.academic_year || session.class_year;
            const specialityName = session.speciality_name;
            const hasSpeciality = !!session.speciality_id; // Check if session has speciality_id
            
            if (levelName && yearName && specialityName && hasSpeciality) {
              // 4-path: Level - Year - Speciality
              pathName = `${levelName} - ${yearName} - ${specialityName}`;
            } else if (levelName && yearName) {
              // 3-path: Level - Year (no speciality)
              pathName = `${levelName} - ${yearName}`;
            } else if (levelName) {
              // 2-path: Level only
              pathName = `${levelName} - بث مباشر`;
            }
            
            if (!acc[pathName]) {
              acc[pathName] = [];
            }
            acc[pathName].push(session);
            return acc;
          }, {});
          
          setLiveSessionsByPath(groupedSessions);
        }
      } catch (error) {
        console.error('Error fetching live sessions:', error);
        setAllLiveSessions([]);
        setLiveSessionsByPath({});
      } finally {
        setInitialLoading(false);
        setHierarchyLoading(false);
      }
    };

    fetchAllLiveSessions();
  }, []);

  // Dynamic filtering functions (similar to TTHCourses)
  const getFilteredYears = () => {
    if (!selectedLevel || selectedLevel === 'all' || selectedLevel === '') return [];
    
    console.log('🔍 getFilteredYears called with selectedLevel:', selectedLevel);
    console.log('🔍 Total sessions:', allLiveSessions.length);
    
    // Get unique years from sessions that belong to the selected level
    const yearMap = new Map();
    allLiveSessions.forEach((session, index) => {
      const levelName = session.level_name;
      const yearName = session.year_name;
      console.log(`Session ${index + 1}: level_name = "${levelName}", year_name = "${yearName}"`);
      if (levelName === selectedLevel && yearName) {
        console.log(`✅ Match found: level "${levelName}" matches selectedLevel "${selectedLevel}"`);
        yearMap.set(yearName, {
          id: yearName,
          name: yearName,
          levelId: levelName
        });
      }
    });
    const years = Array.from(yearMap.values());
    console.log('🔍 Filtered years:', years);
    return years;
  };
  
  const getFilteredSpecialities = () => {
    if (!selectedYear || selectedYear === 'all' || selectedYear === '') return [];
    
    console.log('🔍 getFilteredSpecialities called with selectedLevel:', selectedLevel, 'selectedYear:', selectedYear);
    
    // Check if the selected year has any specialities by looking at actual session data
    // BUT only for the selected level and year combination
    const specialityMap = new Map();
    allLiveSessions.forEach((session, index) => {
      const levelName = session.level_name;
      const yearName = session.year_name;
      const specialityName = session.speciality_name;
      const hasSpeciality = !!session.speciality_id; // Check if session has speciality_id
      
      console.log(`Session ${index + 1}: level="${levelName}", year="${yearName}", speciality="${specialityName}", hasSpeciality=${hasSpeciality}`);
      
      if (yearName === selectedYear && 
          levelName === selectedLevel && 
          specialityName && 
          hasSpeciality) {
        console.log(`✅ Speciality match found: "${specialityName}"`);
        specialityMap.set(specialityName, {
          id: specialityName,
          name: specialityName,
          yearId: yearName
        });
      }
    });
    const specialities = Array.from(specialityMap.values());
    console.log('🔍 Filtered specialities:', specialities);
    return specialities;
  };
  
  const getFilteredMaterials = () => {
    if (!selectedYear || selectedYear === 'all' || selectedYear === '') return [];
    
    // Get materials for the selected year, but only for the selected level and year combination
    const materialMap = new Map();
    allLiveSessions.forEach(session => {
      const levelName = session.level_name;
      const yearName = session.year_name;
      const materialName = session.material_name;
      const specialityName = session.speciality_name;
      const hasSpeciality = !!session.speciality_id; // Check if session has speciality_id
      
      if (yearName === selectedYear && 
          levelName === selectedLevel && 
          materialName) {
        materialMap.set(materialName, {
          id: materialName,
          name: materialName,
          specialityId: specialityName,
          yearId: yearName,
          hasSpeciality: hasSpeciality
        });
      }
    });
    const materials = Array.from(materialMap.values());
    // Only log if there are materials to avoid spam
    if (materials.length > 0) {
      console.log(`Materials for level "${selectedLevel}" and year "${selectedYear}":`, materials);
    }
    return materials;
  };

  // Filter handlers with dynamic filtering
  const handleLevelChange = (e) => {
    setSelectedLevel(e.target.value);
    setSelectedYear('');
    setSelectedSpeciality('');
    setSelectedMaterial('');
  };
  
  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
    setSelectedSpeciality('');
    setSelectedMaterial('');
  };
  
  const handleSpecialityChange = (e) => {
    setSelectedSpeciality(e.target.value);
    setSelectedMaterial('');
  };
  
  const handleMaterialChange = (e) => {
    setSelectedMaterial(e.target.value);
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      setIsFiltered(true);
      
      // Advanced filtering (similar to TTHCourses)
      let filtered = allLiveSessions;
      
      // Only log filtering details if there are active filters
      const hasActiveFilters = selectedLevel || selectedYear || selectedSpeciality || selectedMaterial;
      if (hasActiveFilters) {
        console.log('=== LIVE SESSIONS FILTERING DEBUG ===');
        console.log('Selected filters:', {
          selectedLevel,
          selectedYear,
          selectedSpeciality,
          selectedMaterial
        });
        console.log('Total sessions count:', filtered.length);
      }

              // Filter by level (only if level is selected and exists and is not "all")
        if (selectedLevel && selectedLevel !== 'all' && selectedLevel !== '') {
          const beforeLevel = filtered.length;
          filtered = filtered.filter(session => session.level_name === selectedLevel);
          console.log(`Level filter: ${beforeLevel} -> ${filtered.length} sessions`);
        }

              // Filter by year (only if year is selected and exists)
        if (selectedYear && selectedYear !== 'all' && selectedYear !== '') {
          const beforeYear = filtered.length;
          filtered = filtered.filter(session => session.year_name === selectedYear);
          console.log(`Year filter: ${beforeYear} -> ${filtered.length} sessions`);
        }

              // Filter by speciality (only if speciality is selected and exists)
        if (selectedSpeciality && selectedSpeciality !== 'all' && selectedSpeciality !== '') {
          const beforeSpeciality = filtered.length;
          filtered = filtered.filter(session => session.speciality_name === selectedSpeciality);
          console.log(`Speciality filter: ${beforeSpeciality} -> ${filtered.length} sessions`);
        }

              // Filter by material (only if material is selected and exists)
        if (selectedMaterial && selectedMaterial !== 'all' && selectedMaterial !== '') {
          const beforeMaterial = filtered.length;
          filtered = filtered.filter(session => session.material_name === selectedMaterial);
          console.log(`Material filter: ${beforeMaterial} -> ${filtered.length} sessions`);
        }

      if (hasActiveFilters) {
        console.log('Final filtered sessions:', filtered);
      }
      setFilteredSessions(filtered);
    } catch (error) {
      console.error('Error filtering live sessions:', error);
      setFilteredSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setSelectedLevel('');
    setSelectedYear('');
    setSelectedSpeciality('');
    setSelectedMaterial('');
    setFilteredSessions([]);
    setIsFiltered(false);
  };

  // Refresh live sessions data with debouncing
  const refreshSessions = async () => {
    // Prevent multiple simultaneous refresh calls
    if (refreshSessions.isRefreshing) {
      console.log('🔄 Refresh already in progress, skipping...');
      return;
    }
    
    refreshSessions.isRefreshing = true;
    
    try {
      const response = await fetch('/api/live-sessions');
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 Refreshed live sessions:', data);
        const sessions = data.sessions || data || [];
        setAllLiveSessions(sessions);
        
        // Extract hierarchical data from sessions
        extractHierarchyFromSessions(sessions);
        
        // Re-group sessions by path (handle both 3-path and 4-path)
        const groupedSessions = sessions.reduce((acc, session) => {
          let pathName = 'البث المباشر';
          
          // Use the hierarchy fields from the API
          const levelName = session.level_name;
          const yearName = session.year_name;
          const specialityName = session.speciality_name;
          
          // Create path name based on available hierarchy
          const hasSpeciality = !!session.speciality_id; // Check if session has speciality_id
          
          if (levelName && yearName && specialityName && hasSpeciality) {
            // 4-path: Level - Year - Speciality
            pathName = `${levelName} - ${yearName} - ${specialityName}`;
          } else if (levelName && yearName) {
            // 3-path: Level - Year (no speciality)
            pathName = `${levelName} - ${yearName}`;
          } else if (levelName) {
            // 2-path: Level only
            pathName = `${levelName} - بث مباشر`;
          }
          
          if (!acc[pathName]) {
            acc[pathName] = [];
          }
          acc[pathName].push(session);
          return acc;
        }, {});
        
        setLiveSessionsByPath(groupedSessions);
      }
    } catch (error) {
      console.error('Error refreshing live sessions:', error);
    } finally {
      refreshSessions.isRefreshing = false;
    }
  };

  // Determine which sessions to show
  const sessionsToShow = isFiltered ? filteredSessions : allLiveSessions;
  const sessionsByPathToShow = isFiltered ? {} : liveSessionsByPath;

  return {
    // Filter state
    selectedLevel,
    selectedYear,
    selectedSpeciality,
    selectedMaterial,
    
    // Hierarchy data
    levels,
    years,
    specialities,
    materials,
    hierarchyLoading,
    
    // Live sessions
    allLiveSessions,
    liveSessionsByPath: sessionsByPathToShow,
    filteredSessions,
    sessionsToShow,
    loading,
    initialLoading,
    isFiltered,
    
    // Dynamic filtering functions
    getFilteredYears,
    getFilteredSpecialities,
    getFilteredMaterials,
    getAllYears,
    getAllSpecialities,
    getAllMaterials,
    
    // Handlers
    handleLevelChange,
    handleYearChange,
    handleSpecialityChange,
    handleMaterialChange,
    handleSearch,
    clearFilters,
    refreshSessions
  };
}; 