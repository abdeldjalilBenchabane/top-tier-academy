import { Link } from 'react-router-dom';

const TTHDashboardStudent = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex w-full" dir="rtl">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      {/* المحتوى الرئيسي */}
      <div className="flex-1 lg:mr-0">
        <main className="p-6 lg:p-8 pt-16 lg:pt-8">
          <div className="max-w-7xl mx-auto">
            {/* Points Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
              <Link to="/points" className="col-span-1">
                <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white rounded-xl shadow-md p-6 flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-pointer">
                  <div className="text-lg font-semibold mb-2">رصيد النقاط</div>
                  <div className="text-3xl font-bold mb-1">0</div>
                  <div className="text-sm">دج</div>
                </div>
              </Link>
              {/* Other stats cards can go here, or you can merge with existing cards */}
            </div>
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default TTHDashboardStudent; 