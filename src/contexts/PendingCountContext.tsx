import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

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
      const pendingCourses = await api.getPendingCourses();
      const count = pendingCourses.filter((course: any) => course.status === 'pending').length;
      console.log(`🔄 Pending count updated: ${count} courses`);
      setPendingCount(count);
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
    console.log('🔄 Initializing pending count provider...');
    fetchPendingCount();
    
    // Refresh count every 10 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing pending count...');
      fetchPendingCount();
    }, 10000);
    
    return () => {
      console.log('🔄 Cleaning up pending count interval...');
      clearInterval(interval);
    };
  }, [isAdmin]);

  return (
    <PendingCountContext.Provider value={{ pendingCount, refreshPendingCount }}>
      {children}
    </PendingCountContext.Provider>
  );
}; 