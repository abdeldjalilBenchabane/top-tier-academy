import React from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/navigation/Navbar';
import Sidebar from '@/components/navigation/Sidebar';
import { toast } from '@/lib/toast';

export const AppLayout = () => {
  const { user, isLoading, isAdmin, isProfessor } = useAuth();
  const location = useLocation();

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/schoolhouse/login" replace />;
  }

  // Check role-based access
  const isAdminRoute = location.pathname.startsWith('/admin');
  const isProfessorRoute = location.pathname.startsWith('/professor');

  // Redirect unauthorized users
  if (isAdminRoute && !isAdmin) {
    toast.error('Access denied. Admin privileges required.');
    return <Navigate to="/schoolhouse/login" replace />;
  }

  if (isProfessorRoute && !isProfessor) {
    toast.error('Access denied. Professor privileges required.');
    return <Navigate to="/schoolhouse/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
