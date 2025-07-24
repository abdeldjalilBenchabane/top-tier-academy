import { useState, useEffect } from 'react';

export const useLiveClasses = () => {
  // Filter state
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const [selectedMaterial, setSelectedMaterial] = useState('');
  
  // Hierarchy data state
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

  // Fetch hierarchy data
  useEffect(() => {
    const fetchHierarchy = async () => {
      try {
        setHierarchyLoading(true);
        const response = await fetch('/api/public/hierarchy');
        if (response.ok) {
          const data = await response.json();
          setLevels(data);
        }
      } catch (error) {
        console.error('Error fetching hierarchy:', error);
      } finally {
        setHierarchyLoading(false);
      }
    };

    fetchHierarchy();
  }, []);

  // Fetch all live sessions on page load
  useEffect(() => {
    const fetchAllLiveSessions = async () => {
      try {
        setInitialLoading(true);
        const response = await fetch('/api/live-sessions');
        if (response.ok) {
          const data = await response.json();
          console.log('📡 Live sessions API response:', data);
          const sessions = data.sessions || data || [];
          console.log('📋 Processed sessions:', sessions);
          setAllLiveSessions(sessions);
          
          // Group sessions by material or show all together
          const groupedSessions = sessions.reduce((acc, session) => {
            // For now, group all sessions under "Live Sessions" since we don't have level/year info
            const pathName = 'البث المباشر';
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
      }
    };

    fetchAllLiveSessions();
  }, []);

  // Fetch years when level changes
  useEffect(() => {
    if (selectedLevel) {
      const level = levels.find(l => l.id === parseInt(selectedLevel));
      if (level) {
        setYears(level.years || []);
        setSelectedYear('');
        setSelectedSpeciality('');
        setSelectedMaterial('');
      }
    } else {
      setYears([]);
      setSelectedYear('');
      setSelectedSpeciality('');
      setSelectedMaterial('');
    }
  }, [selectedLevel, levels]);

  // Fetch specialities when year changes
  useEffect(() => {
    if (selectedYear) {
      const year = years.find(y => y.id === parseInt(selectedYear));
      if (year) {
        setSpecialities(year.specialities || []);
        setSelectedSpeciality('');
        setSelectedMaterial('');
      }
    } else {
      setSpecialities([]);
      setSelectedSpeciality('');
      setSelectedMaterial('');
    }
  }, [selectedYear, years]);

  // Fetch materials when speciality changes
  useEffect(() => {
    if (selectedSpeciality) {
      const speciality = specialities.find(s => s.id === parseInt(selectedSpeciality));
      if (speciality) {
        setMaterials(speciality.materials || []);
        setSelectedMaterial('');
      }
    } else {
      setMaterials([]);
      setSelectedMaterial('');
    }
  }, [selectedSpeciality, specialities]);

  // Filter handlers
  const handleLevelChange = (e) => setSelectedLevel(e.target.value);
  const handleYearChange = (e) => setSelectedYear(e.target.value);
  const handleSpecialityChange = (e) => setSelectedSpeciality(e.target.value);
  const handleMaterialChange = (e) => setSelectedMaterial(e.target.value);

  const handleSearch = async () => {
    try {
      setLoading(true);
      setIsFiltered(true);
      
      // Build search parameters
      const searchParams = new URLSearchParams();
      if (selectedLevel) searchParams.append('level', selectedLevel);
      if (selectedYear) searchParams.append('year', selectedYear);
      if (selectedSpeciality) searchParams.append('speciality', selectedSpeciality);
      if (selectedMaterial) searchParams.append('material', selectedMaterial);

      const response = await fetch(`/api/live-sessions/search?${searchParams.toString()}`);
      if (response.ok) {
        const data = await response.json();
        const sessions = data.sessions || [];
        setFilteredSessions(sessions);
      } else {
        console.error('Error searching live sessions');
        setFilteredSessions([]);
      }
    } catch (error) {
      console.error('Error searching live sessions:', error);
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

  // Refresh live sessions data
  const refreshSessions = async () => {
    try {
      const response = await fetch('/api/live-sessions');
      if (response.ok) {
        const data = await response.json();
        console.log('🔄 Refreshed live sessions:', data);
        const sessions = data.sessions || data || [];
        setAllLiveSessions(sessions);
        
        // Re-group sessions
        const groupedSessions = sessions.reduce((acc, session) => {
          const pathName = 'البث المباشر';
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