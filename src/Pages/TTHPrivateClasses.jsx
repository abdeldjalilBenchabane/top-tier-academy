import React, { useState } from "react";
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";
import PrivateClassFilter from "../components/ui/TTHPrivateClassFilter";
import PrivateClassSidebar from "../components/ui/TTHPrivateClassSidebar";
import PrivateClassCard from "../components/ui/TTHPrivateClassCard";
import PrivateClassModal from "../components/ui/TTHPrivateClassModal";
import { usePrivateClasses } from "../hooks/TTHUsePrivateClasses";

const PrivateClasses = () => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  const {
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
  } = usePrivateClasses();

  const handleFilterChange = (filters) => {
    console.log('Filter changed:', filters);
  };

  const handleSidebarSearch = (filters) => {
    console.log('Searching with sidebar filters:', filters);
  };

  const handleRequestClick = () => {
    setIsRequestModalOpen(true);
  };

  const closeRequestModal = () => {
    setIsRequestModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50" dir="rtl">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Page Header */}
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="text-center sm:text-right">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-600 leading-tight mb-2">
                تحتاج دعم أكثر؟
              </h1>
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-purple-600 leading-tight">
                اطلب حصة خاصة مع أستاذك المفضل
              </h2>
            </div>
          </div>
        </div>

        {/* Top Filter */}
        <div className="mb-8 sm:mb-12">
          <PrivateClassFilter
            selectedGrade={selectedGrade}
            selectedYear={selectedYear}
            selectedSubject={selectedSubject}
            selectedDate={selectedDate}
            onGradeChange={handleGradeChange}
            onYearChange={handleYearChange}
            onSubjectChange={handleSubjectChange}
            onDateChange={handleDateChange}
            onSearch={handleRequestClick}
          />
        </div>

        {/* Main Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="flex-1 order-2 lg:order-2">
            {/* Content Header */}
            <div className="mb-6 sm:mb-8">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">الحصص المتاحة</h2>
                <p className="text-sm sm:text-base text-gray-600">تم العثور على {filteredSessions.length} حصة</p>
              </div>
            </div>

            {/* Sessions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
              {filteredSessions.length === 0 ? (
                <div className="col-span-1 sm:col-span-1 lg:col-span-2 text-center py-12 sm:py-16">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                    <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                    </svg>
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">لا توجد حصص مطابقة</h3>
                  <p className="text-sm sm:text-base text-gray-500">جرب تغيير الفلاتر للعثور على حصص أخرى</p>
                </div>
              ) : (
                filteredSessions.map((session, index) => (
                  <div 
                    key={session.id} 
                    className="animate-fadeIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <PrivateClassCard
                      session={session}
                      onDetailsClick={handleDetailsClick}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="order-1 lg:order-1 lg:w-80">
            <PrivateClassSidebar
              onFilterChange={handleFilterChange}
              onSearch={handleSidebarSearch}
            />
          </div>
        </div>
      </main>
      
      <PrivateClassModal
        isOpen={isModalOpen}
        onClose={closeModal}
        session={selectedSession}
      />
      
      <PrivateClassModal
        isOpen={isRequestModalOpen}
        onClose={closeRequestModal}
        session={null}
      />
      
      <Footer />
    </div>
  );
};

export default PrivateClasses; 