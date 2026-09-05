import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/common/PageHeader';
import LiveSessions from '@/components/professor/LiveSessions';

const LiveSessionsPage = () => {
  const { user } = useAuth();

  if (!user?.id) {
    return (
      <div className="space-y-6">
        <PageHeader 
          title="Live Sessions"
          description="Manage your live teaching sessions"
        />
        <div className="text-red-500">You must be logged in to view live sessions.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <PageHeader 
          title="Live Sessions"
          description="Schedule and manage your live teaching sessions"
        />
        
        <LiveSessions professorId={user.id} />
      </div>
    </div>
  );
};

export default LiveSessionsPage; 