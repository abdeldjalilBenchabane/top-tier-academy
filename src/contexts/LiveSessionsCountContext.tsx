import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';
import { pollWhileVisible, COUNTER_POLL_MS } from '@/lib/pollWhileVisible';

interface LiveSessionsCountContextType {
  liveSessionsCount: {
    pending: number;
    notEnded: number;
    total: number;
  };
  refreshLiveSessionsCount: () => void;
}

const LiveSessionsCountContext = createContext<LiveSessionsCountContextType | undefined>(undefined);

export const useLiveSessionsCount = () => {
  const context = useContext(LiveSessionsCountContext);
  if (context === undefined) {
    throw new Error('useLiveSessionsCount must be used within a LiveSessionsCountProvider');
  }
  return context;
};

interface LiveSessionsCountProviderProps {
  children: React.ReactNode;
}

export const LiveSessionsCountProvider: React.FC<LiveSessionsCountProviderProps> = ({ children }) => {
  const [liveSessionsCount, setLiveSessionsCount] = useState({
    pending: 0,
    notEnded: 0,
    total: 0
  });
  const { isAdmin } = useAuth();

  const fetchLiveSessionsCount = async () => {
    if (!isAdmin) {
      setLiveSessionsCount({ pending: 0, notEnded: 0, total: 0 });
      return;
    }

    try {
      const response = await api.get('/admin/live-sessions-count');
      console.log(`🔄 Live sessions count updated: ${response.pending} pending + ${response.notEnded} not ended = ${response.total} total`);
      setLiveSessionsCount(response);
    } catch (error) {
      console.error('Failed to fetch live sessions count:', error);
      setLiveSessionsCount({ pending: 0, notEnded: 0, total: 0 });
    }
  };

  const refreshLiveSessionsCount = () => {
    console.log('🔄 Manually refreshing live sessions count...');
    fetchLiveSessionsCount();
  };

  useEffect(() => {
    fetchLiveSessionsCount();
    return pollWhileVisible(fetchLiveSessionsCount, COUNTER_POLL_MS);
  }, [isAdmin]);

  return (
    <LiveSessionsCountContext.Provider value={{ liveSessionsCount, refreshLiveSessionsCount }}>
      {children}
    </LiveSessionsCountContext.Provider>
  );
}; 