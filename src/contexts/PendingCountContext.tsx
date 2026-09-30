import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';
import { pollWhileVisible, COUNTER_POLL_MS } from '@/lib/pollWhileVisible';

interface PendingCountContextType {
  pendingCount: number;
  refreshPendingCount: () => void;
}

const PendingCountContext = createContext<PendingCountContextType | undefined>(undefined);

export const usePendingCount = () => {
  const context = useContext(PendingCountContext);
  if (context === undefined) {
    throw new Error('usePendingCount must be used within a PendingCountProvider');
  }
  return context;
};

interface PendingCountProviderProps {
  children: React.ReactNode;
}

export const PendingCountProvider: React.FC<PendingCountProviderProps> = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const { isAdmin } = useAuth();

  const fetchPendingCount = async () => {
    if (!isAdmin) {
      setPendingCount(0);
      return;
    }

    try {
      // Fetch pending courses
      const pendingCourses = await api.getPendingCourses();
      const pendingCoursesCount = pendingCourses.filter((course: any) => course.status === 'pending').length;
      
      // Fetch pending live sections using admin endpoint
      const pendingLiveSections = await api.get('/admin/live-sections/pending');
      const pendingLiveSectionsCount = pendingLiveSections.length;
      
      const totalPendingCount = pendingCoursesCount + pendingLiveSectionsCount;
      console.log(`🔄 Pending count updated: ${pendingCoursesCount} courses + ${pendingLiveSectionsCount} live sections = ${totalPendingCount} total`);
      setPendingCount(totalPendingCount);
    } catch (error) {
      console.error('Failed to fetch pending count:', error);
      setPendingCount(0);
    }
  };

  const refreshPendingCount = () => {
    console.log('🔄 Manually refreshing pending count...');
    fetchPendingCount();
  };

  useEffect(() => {
    fetchPendingCount();
    // Was every five seconds, and each round asks for pending courses and
    // pending live sections, so an open dashboard made two requests every five
    // seconds for the life of the tab.
    return pollWhileVisible(fetchPendingCount, COUNTER_POLL_MS);
  }, [isAdmin]);

  return (
    <PendingCountContext.Provider value={{ pendingCount, refreshPendingCount }}>
      {children}
    </PendingCountContext.Provider>
  );
}; 