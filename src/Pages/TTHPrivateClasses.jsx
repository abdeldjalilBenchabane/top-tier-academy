import React, { useState } from "react";
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";
import PrivateClassFilter from "../components/ui/TTHPrivateClassFilter";
import PrivateClassSidebar from "../components/ui/TTHPrivateClassSidebar";
import PrivateClassCard from "../components/ui/TTHPrivateClassCard";
import PrivateClassModal from "../components/ui/TTHPrivateClassModal";
import { usePrivateClasses } from "../hooks/TTHUsePrivateClasses";
import { useNavigate } from 'react-router-dom';

const PrivateClasses = () => {
  const {
    selectedGrade,
    selectedYear,
    selectedSubject,
    selectedDate,
    selectedTeacher,
    availableTeachers,
    filteredSessions,
    isModalOpen,
    selectedSession,
    isProfessor,
    loading,
    isRequestModalOpen,
    requestForm,
    pendingRequests,
    handleGradeChange,
    handleYearChange,
    handleSubjectChange,
    handleDateChange,
    handleTeacherChange,
    handleSearch,
    handleRequestClick,
    closeRequestModal,
    handleRequestFormChange,
    handleSubmitRequest,
    handleDetailsClick,
    closeModal,
    requestsLoading,
    myPendingRequests,
    selectedLevel,
    selectedSpeciality,
    selectedMaterial,
    levels,
    years,
    specialities,
    materials,
    hierarchyLoading,
    handleLevelChange,
    handleSpecialityChange,
    handleMaterialChange,
    pricingSettings,
    refreshRequests,
    refreshAllOrders
  } = usePrivateClasses();

  const navigate = useNavigate();

  const handleFilterChange = (filters) => {
    console.log('Filter changed:', filters);
  };

  const handleSidebarSearch = (filters) => {
    console.log('Searching with sidebar filters:', filters);
  };

  const handleJoinLive = (session) => {
    const channel = `private_class_${session.id}`;
    navigate(`/streaming/${channel}`);
  };

  const [purchaseLoading, setPurchaseLoading] = useState({});

  const handlePurchase = async (session) => {
    // Prevent double clicks
    if (purchaseLoading[session.id]) {
      return;
    }
    
    setPurchaseLoading(prev => ({ ...prev, [session.id]: true }));
    
    try {
      const response = await fetch(`/api/private-class-requests/${session.id}/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(`تم شراء الحصة بنجاح! تم خصم ${data.pointsDeducted} نقطة من رصيدك.`);
        
        // Refresh both datasets to get the latest state from the server
        await Promise.all([
          refreshRequests(),
          refreshAllOrders()
        ]);
        
        // Trigger points update event to refresh navbar
        window.dispatchEvent(new CustomEvent('pointsUpdated', { 
          detail: { points: data.newBalance } 
        }));
      } else {
        const errorData = await response.json();
        alert(`خطأ في الشراء: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error purchasing private class:', error);
      alert('حدث خطأ أثناء الشراء. يرجى المحاولة مرة أخرى.');
    } finally {
      setPurchaseLoading(prev => ({ ...prev, [session.id]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50" dir="rtl">
      <Navbar />
      <main className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        {/* Page Header */}
        <div className="mr-28 mt-10 mb-8 sm:mb-12">
          <div className="inline-flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-2xl">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="text-center sm:text-right">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-blue-600  mb-4">
                {isProfessor ? 'إدارة الحصص الخاصة' : 'تحتاج دعم أكثر؟'}
              </h1>
              <h2 className="text-sm sm:text-lg md:text-lg lg:text-2xl  opacity-75     font-semibold text-purple-600 ">
                {isProfessor ? 'عرض وإدارة طلبات الحصص الخاصة' : 'اطلب حصة خاصة مع أستاذك المفضل'}
              </h2>
            </div>
          </div>
        </div>

        {/* Top Filter */}
        <div className="mb-8 sm:mb-12">
          <PrivateClassFilter
            selectedLevel={selectedLevel}
            selectedYear={selectedYear}
            selectedSpeciality={selectedSpeciality}
            selectedMaterial={selectedMaterial}
            selectedTeacher={selectedTeacher}
            availableTeachers={availableTeachers}
            levels={levels}
            years={years}
            specialities={specialities}
            materials={materials}
            isProfessor={isProfessor}
            onLevelChange={handleLevelChange}
            onYearChange={handleYearChange}
            onSpecialityChange={handleSpecialityChange}
            onMaterialChange={handleMaterialChange}
            onTeacherChange={handleTeacherChange}
            onSearch={isProfessor ? handleSearch : handleRequestClick}
            loading={loading}
            hierarchyLoading={hierarchyLoading}
          />
        </div>

        {/* Pending Requests Section - Only for students */}
        {!isProfessor && (
          <div className="mb-8 sm:mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">طلباتك</h2>
              </div>
              <button
                onClick={async () => {
                  await Promise.all([
                    refreshRequests(),
                    refreshAllOrders()
                  ]);
                }}
                disabled={requestsLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className={`w-4 h-4 ${requestsLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                تحديث
              </button>
            </div>
            
            {requestsLoading ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <p className="text-gray-500">جاري تحميل الطلبات...</p>
              </div>
            ) : myPendingRequests.filter(r => r.status !== 'مرفوض').length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                {myPendingRequests.filter(r => r.status !== 'مرفوض').map((request, index) => (
                  <div 
                    key={request.id} 
                    className="animate-fadeIn"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <PrivateClassCard
                      session={request}
                      onDetailsClick={handleDetailsClick}
                      onJoinLive={handleJoinLive}
                      onPurchase={handlePurchase}
                      purchaseLoading={purchaseLoading}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد طلبات حالياً</h3>
                <p className="text-gray-500">قم بإنشاء طلب جديد للحصول على حصة خاصة</p>
              </div>
            )}
          </div>
        )}

        {/* Main Content with Sidebar */}
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="flex-1 order-2 lg:order-2">
            {/* Content Header */}
            <div className="mb-6 sm:mb-8">
             
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
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    {isProfessor ? 'لا توجد حصص خاصة' : 'لا توجد حصص مطابقة'}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-500">
                    {isProfessor ? 'لم يتم طلب أي حصص خاصة منك بعد' : 'جرب تغيير الفلاتر للعثور على حصص أخرى'}
                  </p>
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
                      onJoinLive={handleJoinLive}
                      onPurchase={handlePurchase}
                      purchaseLoading={purchaseLoading}
                    />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="order-1 mt-6 lg:order-1 lg:w-80">
            <PrivateClassSidebar
              onFilterChange={handleFilterChange}
              onSearch={handleSidebarSearch}
            />
          </div>
        </div>
      </main>
      
      {/* Session Details Modal */}
      <PrivateClassModal
        isOpen={isModalOpen}
        onClose={closeModal}
        session={selectedSession}
      />
      
      {/* Request Form Modal */}
      <PrivateClassModal
        isOpen={isRequestModalOpen}
        onClose={closeRequestModal}
        session={null}
        isRequestForm={true}
        requestForm={requestForm}
        onRequestFormChange={handleRequestFormChange}
        onSubmitRequest={handleSubmitRequest}
        selectedTeacher={selectedTeacher}
        selectedLevel={selectedLevel}
        selectedYear={selectedYear}
        selectedSpeciality={selectedSpeciality}
        selectedMaterial={selectedMaterial}
        levels={levels}
        years={years}
        specialities={specialities}
        materials={materials}
        pricingSettings={pricingSettings}
      />
      
      <Footer />
    </div>
  );
};

export default PrivateClasses; 