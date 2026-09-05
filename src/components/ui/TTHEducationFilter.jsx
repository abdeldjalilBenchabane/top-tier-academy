import React, { useState, useEffect } from 'react';
import { api } from '@/services/api'; // Assuming you have an API service

const TTHEducationFilter = ({ onFilterChange }) => {
  const [levels, setLevels] = useState([]);
  const [years, setYears] = useState([]);
  const [specialities, setSpecialities] = useState([]);
  
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedSpeciality, setSelectedSpeciality] = useState('');

  useEffect(() => {
    // Fetch all filter data on component mount
    const fetchFilterData = async () => {
      try {
        const [levelsData, yearsData, specialitiesData] = await Promise.all([
          api.getLevels(), 
          api.getYears(), 
          api.getSpecialities()
        ]);
        setLevels(levelsData);
        setYears(yearsData);
        setSpecialities(specialitiesData);
      } catch (error) {
        console.error("Failed to fetch filter data:", error);
      }
    };
    fetchFilterData();
  }, []);

  const handleFilter = () => {
    onFilterChange({
      level: selectedLevel,
      year: selectedYear,
      speciality: selectedSpeciality,
    });
  };

  const handleReset = () => {
    setSelectedLevel('');
    setSelectedYear('');
    setSelectedSpeciality('');
    onFilterChange({
      level: '',
      year: '',
      speciality: '',
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Level Filter */}
        <select 
          value={selectedLevel} 
          onChange={(e) => setSelectedLevel(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">كل المراحل</option>
          {levels.map(level => (
            <option key={level.id} value={level.id}>{level.name}</option>
          ))}
        </select>

        {/* Year Filter */}
        <select 
          value={selectedYear} 
          onChange={(e) => setSelectedYear(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">كل السنوات</option>
          {years
            .filter(year => !selectedLevel || year.level_id === parseInt(selectedLevel))
            .map(year => (
              <option key={year.id} value={year.id}>{year.name}</option>
          ))}
        </select>

        {/* Speciality Filter */}
        <select 
          value={selectedSpeciality} 
          onChange={(e) => setSelectedSpeciality(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">كل الشعب</option>
          {specialities
            .filter(spec => !selectedYear || spec.year_id === parseInt(selectedYear))
            .map(spec => (
              <option key={spec.id} value={spec.id}>{spec.name}</option>
          ))}
        </select>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button onClick={handleFilter} className="bg-[#194cbf] text-white px-4 py-2 rounded-lg flex-grow">
            تصفية
          </button>
          <button onClick={handleReset} className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg">
            إعادة تعيين
          </button>
        </div>
      </div>
    </div>
  );
};

export default TTHEducationFilter; 