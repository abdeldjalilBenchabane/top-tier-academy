import { useState } from 'react';
import { privateClassesData, gradeOptions } from '../data/index';

export const usePrivateClasses = () => {
  const [selectedGrade, setSelectedGrade] = useState(gradeOptions[0].label);
  const [selectedYear, setSelectedYear] = useState(gradeOptions[0].years[0]);
  const [selectedSubject, setSelectedSubject] = useState(gradeOptions[0].subjects[0]);
  const [selectedDate, setSelectedDate] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  const handleGradeChange = (e) => {
    const newGrade = e.target.value;
    const gradeObj = gradeOptions.find(g => g.label === newGrade);
    setSelectedGrade(newGrade);
    setSelectedYear(gradeObj.years[0]);
    setSelectedSubject(gradeObj.subjects[0]);
  };

  const handleYearChange = (e) => setSelectedYear(e.target.value);
  const handleSubjectChange = (e) => setSelectedSubject(e.target.value);
  const handleDateChange = (e) => setSelectedDate(e.target.value);

  const handleSearch = () => {
    console.log('Searching with filters:', {
      grade: selectedGrade,
      year: selectedYear,
      subject: selectedSubject,
      date: selectedDate
    });
  };

  const handleDetailsClick = (sessionId) => {
    const session = privateClassesData.find(s => s.id === sessionId);
    setSelectedSession(session);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedSession(null);
  };

  // For now, show all sessions (no filtering)
  const filteredSessions = privateClassesData;

  return {
    selectedGrade,
    selectedYear,
    selectedSubject,
    selectedDate,
    filteredSessions,
    isModalOpen,
    selectedSession,
    handleGradeChange,
    handleYearChange,
    handleSubjectChange,
    handleDateChange,
    handleSearch,
    handleDetailsClick,
    closeModal
  };
}; 