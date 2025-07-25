import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { usePendingCount } from '@/contexts/PendingCountContext';
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
  RefreshCw,
  Globe
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
  const [isRefreshing, setIsRefreshing] = useState(false);

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
    { name: 'Course Files', path: '/admin/course-files', icon: <FolderOpen className="h-5 w-5" /> },
    { name: 'Pending Approvals', path: '/admin/pending', icon: <Clock className="h-5 w-5" />, badge: pendingCount },
    { name: 'Quiz Management', path: '/admin/quizzes', icon: <HelpCircle className="h-5 w-5" /> },
    { name: 'Live Sessions', path: '/admin/live-sessions', icon: <Video className="h-5 w-5" /> },
    { name: 'User Management', path: '/admin/users', icon: <Users className="h-5 w-5" /> },
    { name: 'Enhanced Slides', path: '/admin/enhanced-slides', icon: <Image className="h-5 w-5" /> },
    { name: 'Points', path: '/admin/points', icon: <DollarSign className="h-5 w-5" /> },
    { name: 'Point Codes', path: '/admin/point-codes', icon: <Key className="h-5 w-5" /> },
    { name: 'Point Transactions', path: '/admin/point-transactions', icon: <TrendingUp className="h-5 w-5" /> },
    { name: 'Private Class Settings', path: '/admin/private-class-settings', icon: <Settings className="h-5 w-5" /> },
    { name: 'Homepage Materials', path: '/admin/homepage-materials', icon: <Globe className="h-5 w-5" /> },
    { name: 'Footer Content', path: '/admin/footer-content', icon: <FileText className="h-5 w-5" /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const professorLinks: SidebarLink[] = [
    { name: 'Dashboard', path: '/professor/dashboard', icon: <Home className="h-5 w-5" /> },
    { name: 'My Courses', path: '/professor/courses', icon: <BookOpen className="h-5 w-5" /> },
    { name: 'Create Course', path: '/professor/create', icon: <FileText className="h-5 w-5" /> },
    { name: 'Create Quiz', path: '/professor/quiz', icon: <HelpCircle className="h-5 w-5" /> },
    { name: 'Quiz Results', path: '/professor/results', icon: <BarChart className="h-5 w-5" /> },
    { name: 'تعليقات الطلاب', path: '/professor/comments', icon: <MessageCircle className="h-5 w-5" /> },
    { name: 'الحصص الخاصة', path: '/professor/private-classes', icon: <Clock className="h-5 w-5" /> },
    { name: 'Settings', path: '/professor/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const links: SidebarLink[] = isAdmin ? adminLinks : professorLinks;

  return (
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
  );
};

export default Sidebar;
