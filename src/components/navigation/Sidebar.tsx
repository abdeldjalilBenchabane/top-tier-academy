import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
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
  Key
} from 'lucide-react';

const Sidebar = () => {
  const { isAdmin, isProfessor } = useAuth();

  const adminLinks = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: <Home className="h-5 w-5" /> },
    { name: 'Education Structure', path: '/admin/structure', icon: <Layers className="h-5 w-5" /> },
    { name: 'Courses', path: '/admin/courses', icon: <BookOpen className="h-5 w-5" /> },
    { name: 'Course Files', path: '/admin/course-files', icon: <FolderOpen className="h-5 w-5" /> },
    { name: 'Pending Approvals', path: '/admin/pending', icon: <Clock className="h-5 w-5" /> },
    { name: 'Quiz Management', path: '/admin/quizzes', icon: <HelpCircle className="h-5 w-5" /> },
    { name: 'Live Sessions', path: '/admin/live-sessions', icon: <Video className="h-5 w-5" /> },
    { name: 'User Management', path: '/admin/users', icon: <Users className="h-5 w-5" /> },
    { name: 'Enhanced Slides', path: '/admin/enhanced-slides', icon: <Image className="h-5 w-5" /> },
    { name: 'Points', path: '/admin/points', icon: <DollarSign className="h-5 w-5" /> },
    { name: 'Point Codes', path: '/admin/point-codes', icon: <Key className="h-5 w-5" /> },
    { name: 'Point Transactions', path: '/admin/point-transactions', icon: <TrendingUp className="h-5 w-5" /> },
    { name: 'Private Class Settings', path: '/admin/private-class-settings', icon: <Settings className="h-5 w-5" /> },
    { name: 'Settings', path: '/admin/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const professorLinks = [
    { name: 'Dashboard', path: '/professor/dashboard', icon: <Home className="h-5 w-5" /> },
    { name: 'My Courses', path: '/professor/courses', icon: <BookOpen className="h-5 w-5" /> },
    { name: 'Create Course', path: '/professor/create', icon: <FileText className="h-5 w-5" /> },
    { name: 'Create Quiz', path: '/professor/quiz', icon: <HelpCircle className="h-5 w-5" /> },
    { name: 'Quiz Results', path: '/professor/results', icon: <BarChart className="h-5 w-5" /> },
    { name: 'تعليقات الطلاب', path: '/professor/comments', icon: <MessageCircle className="h-5 w-5" /> },
    { name: 'الحصص الخاصة', path: '/professor/private-classes', icon: <Clock className="h-5 w-5" /> },
    { name: 'Settings', path: '/professor/settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const links = isAdmin ? adminLinks : professorLinks;

  return (
    <aside className="hidden md:block w-64 bg-white border-r min-h-[calc(100vh-4rem)] p-4">
      <nav className="space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-md transition-colors ${isActive
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
              }`
            }
          >
            {link.icon}
            {link.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
