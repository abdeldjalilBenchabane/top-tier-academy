import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

interface PendingQuizzesCountContextType {
  pendingQuizzesCount: {
    pending: number;
    total: number;
  };
  refreshPendingQuizzesCount: () => void;
}

const PendingQuizzesCountContext = createContext<PendingQuizzesCountContextType | undefined>(undefined);

export const usePendingQuizzesCount = () => {
  const context = useContext(PendingQuizzesCountContext);
  if (context === undefined) {
    throw new Error('usePendingQuizzesCount must be used within a PendingQuizzesCountProvider');
  }
  return context;
};

interface PendingQuizzesCountProviderProps {
  children: React.ReactNode;
}

export const PendingQuizzesCountProvider: React.FC<PendingQuizzesCountProviderProps> = ({ children }) => {
  const [pendingQuizzesCount, setPendingQuizzesCount] = useState({
    pending: 0,
    total: 0
  });
  const { isAdmin } = useAuth();

  const fetchPendingQuizzesCount = async () => {
    if (!isAdmin) {
      setPendingQuizzesCount({ pending: 0, total: 0 });
      return;
    }

    try {
      const response = await api.get('/admin/pending-quizzes-count');
      console.log(`🔄 Pending quizzes count updated: ${response.pending} pending = ${response.total} total`);
      setPendingQuizzesCount(response);
    } catch (error) {
      console.error('Failed to fetch pending quizzes count:', error);
      setPendingQuizzesCount({ pending: 0, total: 0 });
    }
  };

  const refreshPendingQuizzesCount = () => {
    console.log('🔄 Manually refreshing pending quizzes count...');
    fetchPendingQuizzesCount();
  };

  useEffect(() => {
    console.log('🔄 Initializing pending quizzes count provider...');
    fetchPendingQuizzesCount();
    
    // Refresh count every 10 seconds
    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing pending quizzes count...');
      fetchPendingQuizzesCount();
    }, 10000);
    
    return () => {
      console.log('🔄 Cleaning up pending quizzes count interval...');
      clearInterval(interval);
    };
  }, [isAdmin]);

  return (
    <PendingQuizzesCountContext.Provider value={{ pendingQuizzesCount, refreshPendingQuizzesCount }}>
      {children}
    </PendingQuizzesCountContext.Provider>
  );
}; 