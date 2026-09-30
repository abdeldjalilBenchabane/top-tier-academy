import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { pollWhileVisible, COUNTER_POLL_MS } from '@/lib/pollWhileVisible';

interface PendingPrivateClassesCountContextType {
  pendingPrivateClassesCount: number;
  refreshPendingPrivateClassesCount: () => void;
}

const PendingPrivateClassesCountContext = createContext<PendingPrivateClassesCountContextType | undefined>(undefined);

export const usePendingPrivateClassesCount = () => {
  const context = useContext(PendingPrivateClassesCountContext);
  if (context === undefined) {
    throw new Error('usePendingPrivateClassesCount must be used within a PendingPrivateClassesCountProvider');
  }
  return context;
};

interface PendingPrivateClassesCountProviderProps {
  children: React.ReactNode;
}

export const PendingPrivateClassesCountProvider: React.FC<PendingPrivateClassesCountProviderProps> = ({ children }) => {
  const [pendingPrivateClassesCount, setPendingPrivateClassesCount] = useState(0);
  const { user, isProfessor } = useAuth();

  const fetchPendingPrivateClassesCount = useCallback(async () => {
    if (!isProfessor || !user) {
      console.log('Not professor or no user, setting count to 0');
      console.log('isProfessor:', isProfessor, 'user:', user);
      setPendingPrivateClassesCount(0);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found in localStorage');
      setPendingPrivateClassesCount(0);
      return;
    }

    try {
      console.log('Fetching pending private classes count for professor:', user.id);
      console.log('Token exists:', !!token);
      const response = await fetch('/api/professor/pending-private-classes-count', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      if (response.ok) {
        const data = await response.json();
        console.log('Pending private classes count response:', data);
        setPendingPrivateClassesCount(data.count);
      } else {
        const errorText = await response.text();
        console.error('Failed to fetch pending private classes count, status:', response.status, 'error:', errorText);
        setPendingPrivateClassesCount(0);
      }
    } catch (error) {
      console.error('Error fetching pending private classes count:', error);
      setPendingPrivateClassesCount(0);
    }
  }, [isProfessor, user]);

  const refreshPendingPrivateClassesCount = () => {
    fetchPendingPrivateClassesCount();
  };

  useEffect(() => {
    console.log('PendingPrivateClassesCountContext useEffect triggered');
    console.log('User:', user);
    console.log('isProfessor:', isProfessor);
    
    fetchPendingPrivateClassesCount();
    
    return pollWhileVisible(fetchPendingPrivateClassesCount, COUNTER_POLL_MS);
  }, [user, isProfessor, fetchPendingPrivateClassesCount]);

  return (
    <PendingPrivateClassesCountContext.Provider value={{ 
      pendingPrivateClassesCount, 
      refreshPendingPrivateClassesCount 
    }}>
      {children}
    </PendingPrivateClassesCountContext.Provider>
  );
}; 