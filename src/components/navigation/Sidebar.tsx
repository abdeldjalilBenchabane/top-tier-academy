import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingCount } from '@/contexts/PendingCountContext';
import { useLiveSessionsCount } from '@/contexts/LiveSessionsCountContext';
import { usePendingQuizzesCount } from '@/contexts/PendingQuizzesCountContext';
import { Badge } from '@/components/ui/badge';
import {
  BookOpen,
  Layers,
  FileText,
  Settings,
  Clock,
  Home,
  Users,
  Image,
  Video,
  FolderOpen,
  HelpCircle,
  BarChart,
  DollarSign,
  MessageCircle,
  TrendingUp,
  Key,
  Shield,
  RefreshCw,
  Globe,
  Menu,
  X
} from 'lucide-react';

interface SidebarLink {
  name: string;
  path: string;
  icon: React.ReactElement;
  badge?: number;
}

const Sidebar = () => {
  const { isAdmin, isProfessor } = useAuth();
  const { pendingCount } = usePendingCount();
  const { liveSessionsCount } = useLiveSessionsCount();
  const { pendingQuizzesCount } = usePendingQuizzesCount();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Add visual feedback when count changes
  useEffect(() => {
    setIsRefreshing(true);
    const timer = setTimeout(() => setIsRefreshing(false), 1000);
    return () => clearTimeout(timer);
  }, [pendingCount]);

  const adminLinks: SidebarLink[] = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <Home className="h-5 w-5" /> },
    { name: 'Education Structure', path: '/admin/structure', icon: <Layers className="h-5 w-5" /> },
    { name: 'Courses', path: '/admin/courses', icon: <BookOpen className="h-5 w-5" /> },
    { name: 'Pending Approvals', path: '/admin/pending', icon: <Clock className="h-5 w-5" />, badge: pendingCount },
    { name: 'Quiz Management', path: '/admin/quizzes', icon: <HelpCircle className="h-5 w-5" />, badge: pendingQuizzesCount.total },
    { name: 'Live Sessions', path: '/admin/live-sessions', icon: <Video className="h-5 w-5" />, badge: liveSessionsCount.total },
    { name: 'User Management', path: '/admin/users', icon: <Users className="h-5 w-5" /> },
    { name: 'Enhanced Slides', path: '/admin/enhanced-slides', icon: <Image className="h-5 w-5" /> },
    { name: 'Points', path: '/admin/points', icon: <DollarSign className="h-5 w-5" /> },
    { name: 'Point Codes', path: '/admin/point-codes', icon: <Key className="h-5 w-5" /> },
    { name: 'Point Transactions', path: '/admin/point-transactions', icon: <TrendingUp className="h-5 w-5" /> },
    { name: 'Private Classes', path: '/admin/private-classes', icon: <Shield className="h-5 w-5" /> },
    { name: 'Private Class Settings', path: '/admin/private-class-settings', icon: <Settings className="h-5 w-5" /> },
    { name: 'Homepage Materials', path: '/admin/homepage-materials', icon: <Globe className="h-5 w-5" /> },
    { name: 'Footer Content', path: '/admin/footer-content', icon: <FileText className="h-5 w-5" /> },
  ];

  const professorLinks: SidebarLink[] = [
    { name: 'Dashboard', path: '/professor/dashboard', icon: <Home className="h-5 w-5" /> },
    { name: 'My Courses', path: '/professor/courses', icon: <BookOpen className="h-5 w-5" /> },
    { name: 'Create Course', path: '/professor/create', icon: <FileText className="h-5 w-5" /> },
    { name: 'Live Sessions', path: '/professor/live-sessions', icon: <Video className="h-5 w-5" /> },
    { name: 'Create Live Session', path: '/professor/create-live-session', icon: <Video className="h-5 w-5" /> },
    { name: 'Live Sections', path: '/professor/live-sections', icon: <Video className="h-5 w-5" /> },
    { name: 'Create Quiz', path: '/professor/quiz', icon: <HelpCircle className="h-5 w-5" /> },
    { name: 'My Quizzes', path: '/professor/my-quizzes', icon: <FileText className="h-5 w-5" /> },
    { name: 'Quiz Results', path: '/professor/results', icon: <BarChart className="h-5 w-5" /> },
    { name: 'تعليقات الطلاب', path: '/professor/comments', icon: <MessageCircle className="h-5 w-5" /> },
    { name: 'الحصص الخاصة', path: '/professor/private-classes', icon: <Clock className="h-5 w-5" /> },
    { name: 'Settings', path: '/professor/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const links: SidebarLink[] = isAdmin ? adminLinks : professorLinks;

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Burger Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="p-2 bg-white rounded-md shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-700" />
          ) : (
            <Menu className="h-6 w-6 text-gray-700" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" onClick={closeMobileMenu} />
      )}

      {/* Mobile Menu Sidebar */}
      <div className={`md:hidden fixed top-0 left-0 h-full w-64 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Header - Fixed at top */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
            <h2 className="text-lg font-semibold text-gray-800">
              {isAdmin ? 'Admin Menu' : 'Professor Menu'}
            </h2>
            <button
              onClick={closeMobileMenu}
              className="p-1 hover:bg-gray-100 rounded-md transition-colors"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
          
          {/* Scrollable Navigation */}
          <div className="flex-1 overflow-y-auto">
            <nav className="p-4 space-y-1">
              {links.map((link) => (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    {link.icon}
                    {link.name}
                  </div>
                  {link.badge && link.badge > 0 && (
                    <Badge variant="destructive" className={`ml-auto transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}>
                      {isRefreshing ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        link.badge
                      )}
                    </Badge>
                  )}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-white border-r min-h-[calc(100vh-4rem)] p-4">
        <nav className="space-y-1">
          {links.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
                }`
              }
            >
              <div className="flex items-center gap-3">
                {link.icon}
                {link.name}
              </div>
              {link.badge && link.badge > 0 && (
                <Badge variant="destructive" className={`ml-auto transition-all duration-300 ${isRefreshing ? 'animate-pulse' : ''}`}>
                  {isRefreshing ? (
                    <RefreshCw className="h-3 w-3 animate-spin" />
                  ) : (
                    link.badge
                  )}
                </Badge>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;
