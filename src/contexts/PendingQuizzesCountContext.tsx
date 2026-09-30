import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';
import { pollWhileVisible, COUNTER_POLL_MS } from '@/lib/pollWhileVisible';

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
    fetchPendingQuizzesCount();
    return pollWhileVisible(fetchPendingQuizzesCount, COUNTER_POLL_MS);
  }, [isAdmin]);

  return (
    <PendingQuizzesCountContext.Provider value={{ pendingQuizzesCount, refreshPendingQuizzesCount }}>
      {children}
    </PendingQuizzesCountContext.Provider>
  );
}; 