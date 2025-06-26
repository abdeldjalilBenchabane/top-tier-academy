
import { useState } from "react"
import Sidebar from "../components/SideBar.tsx"
import DashboardOverview from "../components/DashboardOverview.tsx"
import CoursesList from "../components/CoursesList"
import Calendar from "../components/Calendar"
import Notifications from "../components/Notifications"
// import Certificates from "@/components/Certificates"
import ProfileSettings from "../components/ProfileSettings"
import Support from "../components/Support.tsx"

const TTHDashboardStudent = () => {
  const [activeSection, setActiveSection] = useState("overview")

  const renderContent = () => {
    switch (activeSection) {
      case "overview":
        return <DashboardOverview />
      case "courses":
        return <CoursesList />
      case "calendar":
        return <Calendar />
      case "notifications":
        return <Notifications />
    //   case "certificates":
    //     return <Certificates />
      case "settings":
        return <ProfileSettings />
      case "support":
        return <Support />
      default:
        return <DashboardOverview />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex w-full" dir="rtl">
      <Sidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      
      {/* المحتوى الرئيسي */}
      <div className="flex-1 lg:mr-0">
        <main className="p-6 lg:p-8 pt-16 lg:pt-8">
          <div className="max-w-7xl mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  )
}

export default TTHDashboardStudent