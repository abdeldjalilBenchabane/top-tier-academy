import React from "react";
import Navbar from "../components/NavBar";
import Footer from "../components/TTHFooter";
import TTHLiveClassesSearchFilter from "../components/ui/TTHLiveClassesSearchFilter";
import TTHLiveCard from "../components/ui/TTHLiveCard";
import { Video } from "lucide-react";
import { useLiveClasses } from "../hooks/TTHUseLiveClasses";

const TTHLiveClasses = () => {
  const {
    selectedLevel,
    selectedYear,
    selectedSpeciality,
    selectedMaterial,
    levels,
    years,
    specialities,
    materials,
    hierarchyLoading,
    allLiveSessions,
    liveSessionsByPath,
    filteredSessions,
    sessionsToShow,
    loading,
    initialLoading,
    isFiltered,
    getFilteredYears,
    getFilteredSpecialities,
    getFilteredMaterials,
    getAllYears,
    getAllSpecialities,
    getAllMaterials,
    handleLevelChange,
    handleYearChange,
    handleSpecialityChange,
    handleMaterialChange,
    handleSearch,
    clearFilters,
    refreshSessions
  } = useLiveClasses();

  // Handle session status changes with debouncing.
  // Stable identity, or memoising the cards below achieves nothing.
  const handleSessionStatusChange = React.useCallback((sessionId: string, newStatus: string) => {
    console.log(`🔄 Session ${sessionId} status changed to: ${newStatus}`);
    // Only refresh if the status change is significant (live/ended)
    if (newStatus === 'live' || newStatus === 'ended') {
      // Debounce the refresh to prevent excessive API calls
      setTimeout(() => {
        if (refreshSessions) {
          refreshSessions();
        }
      }, 2000); // Wait 2 seconds before refreshing
    }
  }, [refreshSessions]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-blue-100" dir="rtl">
      <Navbar />
      
      <main className="flex-grow">
        
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
                  نخبة من البث المباشر الفريد
                </span>
              </h1>
              <p className="text-blue-100 text-lg md:text-xl lg:text-2xl font-bold font-poppins leading-relaxed mb-8">
                حدد المرحلة الدراسية المناسبة لك للبث المباشر
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-end mt-8">
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                  <span className="font-bold">50+</span> بث مباشر متاح
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                  <span className="font-bold">500+</span> طالب
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-full px-6 py-3 text-white">
                  <span className="font-bold">⭐ 4.8</span> تقييم
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Search Filter */}
        <section className="py-8 bg-white shadow-sm">
          <div className="container mx-auto px-4">

            <TTHLiveClassesSearchFilter
              selectedLevel={selectedLevel}
              selectedYear={selectedYear}
              selectedSpeciality={selectedSpeciality}
              selectedMaterial={selectedMaterial}
              levels={levels}
              years={years}
              specialities={specialities}
              materials={materials}
              hierarchyLoading={hierarchyLoading}
              onLevelChange={handleLevelChange}
              onYearChange={handleYearChange}
              onSpecialityChange={handleSpecialityChange}
              onMaterialChange={handleMaterialChange}
              onSearch={handleSearch}
              onClearFilters={clearFilters}
              getFilteredYears={getFilteredYears}
              getFilteredSpecialities={getFilteredSpecialities}
              getFilteredMaterials={getFilteredMaterials}
              getAllYears={getAllYears}
              getAllSpecialities={getAllSpecialities}
              getAllMaterials={getAllMaterials}
            />
          </div>
        </section>

        {/* Live Sessions Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 space-y-16">
            {initialLoading ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">جاري تحميل البث المباشر...</h3>
                <p className="text-gray-600">يرجى الانتظار</p>
              </div>
            ) : isFiltered ? (
              // Show filtered results
              <div>
                <div className="text-center mb-12">
                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-rowdies mb-4 relative">
                    <span className="text-gray-800">نتائج البحث في </span>
                    <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                      البث المباشر
                    </span>
                  </h2>
                  <p className="text-gray-600 text-lg font-medium mb-4">
                    تم العثور على {filteredSessions.length} بث مباشر
                  </p>
                  <button 
                    onClick={clearFilters}
                    className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-xl font-bold hover:from-gray-700 hover:to-gray-800 transition-all duration-300"
                  >
                    عرض جميع البث المباشر
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">جاري البحث...</h3>
                    <p className="text-gray-600">يرجى الانتظار بينما نبحث عن البث المباشر المناسب</p>
                  </div>
                ) : filteredSessions.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                    {filteredSessions.map((session) => (
                      <TTHLiveCard 
                        /* Date.now() here made the key change on every render,
                           remounting the card and resetting all of its state. */
                        key={session.id}
                        session={session} 
                        onStatusChange={handleSessionStatusChange}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                      <Video className="w-12 h-12 text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد نتائج للبحث</h3>
                    <p className="text-gray-600 mb-6">جرب تغيير الفلاتر أو العودة لاحقاً</p>
                    <button 
                      onClick={clearFilters}
                      className="bg-gradient-to-r from-[#194cbf] to-[#61a1ff] text-white px-6 py-3 rounded-xl font-bold hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                    >
                      عرض جميع البث المباشر
                    </button>
                  </div>
                )}
              </div>
            ) : allLiveSessions.length > 0 ? (
              // Show all sessions grouped by path
              Object.keys(liveSessionsByPath).map(pathName => (
                liveSessionsByPath[pathName] && liveSessionsByPath[pathName].length > 0 && (
                  <div key={pathName}>
                    <div className="text-center mb-12">
                      <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-rowdies mb-4 relative">
                        <span className="text-gray-800">حصص </span>
                        <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                          {pathName}
                        </span>
                      </h2>
                    </div>
                    <div 
                      dir="rtl" 
                      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6 md:gap-8 justify-items-center"
                    >
                      {liveSessionsByPath[pathName].map((session, index) => (
                        <div
                          key={session.id}
                          className="w-full max-w-sm"
                          style={{ animationDelay: `${index * 100}ms` }}
                        >
                          <TTHLiveCard 
                            key={session.id}
                            session={session} 
                            onStatusChange={handleSessionStatusChange}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                  <Video className="w-12 h-12 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">لا توجد بث مباشر متاح حالياً</h3>
                <p className="text-gray-600">سيتم إضافة بث مباشر جديد قريباً</p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default TTHLiveClasses;
