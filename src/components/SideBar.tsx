
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Bell,
  Award,
  Settings,
  HelpCircle,
  Menu,
  X
} from "lucide-react"
import { UserAvatar } from './ui';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const Sidebar = ({ activeSection, onSectionChange }: SidebarProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const { user } = useAuth();

  const menuItems = [
    { id: "overview", label: "نظرة عامة", icon: LayoutDashboard },
    { id: "courses", label: "دوراتي", icon: BookOpen },
    { id: "calendar", label: "الجدول الزمني", icon: Calendar },
    { id: "notifications", label: "الإشعارات", icon: Bell },
    { id: "certificates", label: "الشهادات", icon: Award },
    { id: "settings", label: "الإعدادات", icon: Settings },
    { id: "support", label: "الدعم", icon: HelpCircle }
  ]

  const handleSectionChange = (section: string) => {
    onSectionChange(section)
    setIsOpen(false) // إغلاق القائمة المحمولة بعد الاختيار
  }

  return (
    <>
      {/* زر الهاتف المحمول */}
      <Button
        variant="ghost"
        size="sm"
        className="fixed top-4 right-4 z-50 lg:hidden bg-white shadow-md"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </Button>

      {/* طبقة تغطية الهاتف المحمول */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* الشريط الجانبي */}
      <div className={`
        fixed lg:static inset-y-0 right-0 z-40 w-64 bg-white border-l border-gray-200 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        lg:translate-x-0 lg:block
      `} dir="rtl">
        <div className="flex flex-col h-full">
          {/* الرأس */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">تع</span>
              </div>
              <div>
                <h1 className="font-bold text-gray-900">التعلم الإلكتروني</h1>
                <p className="text-xs text-gray-500">لوحة تحكم الطالب</p>
              </div>
            </div>
          </div>

          {/* ملف المستخدم */}
          <div className="p-4 border-b border-gray-100">
            <div className="flex items-center space-x-3 space-x-reverse">
              <UserAvatar size="md" name={user?.name} />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{user?.name || 'اسم المستخدم'}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email || 'البريد الإلكتروني'}</p>
              </div>
            </div>
          </div>

          {/* التنقل */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = activeSection === item.id
                return (
                  <li key={item.id}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start h-11 ${isActive
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                        }`}
                      onClick={() => handleSectionChange(item.id)}
                    >
                      <item.icon className={`h-4 w-4 ml-3 ${isActive ? "text-white" : "text-gray-500"}`} />
                      {item.label}
                      {item.id === "notifications" && (
                        <span className="mr-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                          3
                        </span>
                      )}
                    </Button>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* التذييل */}
          <div className="p-4 border-t border-gray-100">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3">
              <h3 className="text-sm font-medium text-gray-900 mb-1">تقدم بشكل أسرع!</h3>
              <p className="text-xs text-gray-600 mb-2">
                انضم إلى جلساتنا المباشرة لطرح أسئلتك
              </p>
              <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-xs">
                عرض الجلسات
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar