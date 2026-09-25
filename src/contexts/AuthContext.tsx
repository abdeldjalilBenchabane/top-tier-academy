import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { User } from '@/types';
import { authAPI, getAuthToken, removeAuthToken, removeSessionToken, getSessionToken } from '@/services/api';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isProfessor: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  refreshToken: () => Promise<User>;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  isProfessor: false,
  login: async () => { throw new Error('Login function not implemented'); },
  register: async () => { throw new Error('Register function not implemented'); },
  logout: () => { },
  updateUser: () => { },
  refreshToken: async () => { throw new Error('RefreshToken function not implemented'); },
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const sessionCheckInterval = useRef<NodeJS.Timeout | null>(null);

  // Function to handle session invalidation
  const handleSessionInvalidation = () => {
    console.log('Session has been invalidated on another device');
    setUser(null);
    removeAuthToken();
    removeSessionToken();
    
    // Clear the interval
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
    }
    
    // Redirect to login
    window.location.href = '/login';
  };

  // Counts consecutive network/server failures of the session poll, so a
  // hiccup can be told apart from a session that is genuinely gone.
  const transientSessionFailures = useRef(0);

  // Function to validate session periodically.
  //
  // This poll runs every 30 seconds. It used to sign the user out on ANY
  // failure, so a dropped request, a slow network or one 500 from the server
  // threw them back to the login page mid-lesson — indistinguishable from a
  // real session eviction. Only an explicit rejection from the server means
  // the session is actually gone; everything else is noise and is retried on
  // the next tick.
  const validateSession = async () => {
    const token = getAuthToken();
    const sessionToken = getSessionToken();
    
    if (!token || !sessionToken) {
      return;
    }
    
    try {
      await authAPI.validateSession();
      transientSessionFailures.current = 0;
    } catch (error: any) {
      const message = String(error?.message || '');
      // These are the only replies /auth/validate-session gives when the
      // session itself is no longer usable.
      const sessionReallyGone =
        /Invalid session|Session has been invalidated|Session has expired|Session token is required|Invalid token/i
          .test(message);

      if (sessionReallyGone) {
        console.warn('Session invalidated by the server:', message);
        handleSessionInvalidation();
        return;
      }

      transientSessionFailures.current += 1;
      console.warn(
        `Session check failed (attempt ${transientSessionFailures.current}), staying signed in:`,
        message
      );
    }
  };

  useEffect(() => {
    // Check if we have a token and validate it
    const token = getAuthToken();
    if (token) {
      authAPI.getCurrentUser()
        .then((response) => {
          // Attach agoraUid/agoraRtmToken to user object
          setUser({ ...response.user, agoraUid: response.agoraUid, agoraRtmToken: response.agoraRtmToken });
          console.log('[DEBUG] AuthContext setUser (getCurrentUser):', { ...response.user, agoraUid: response.agoraUid, agoraRtmToken: response.agoraRtmToken });
          
          // Start periodic session validation (every 30 seconds)
          if (getSessionToken()) {
            sessionCheckInterval.current = setInterval(validateSession, 30000);
          }
        })
        .catch((error: any) => {
          // Only a refusal from the server means the token is no good. Any
          // failure used to clear it — so a moment without network, or the
          // backend restarting during a deploy, signed the person out and made
          // them log in again. Now that happens only when the server actually
          // says the token is invalid.
          const rejected = error?.sessionInvalid === true
            || error?.status === 400
            || error?.status === 401;
          if (rejected) {
            console.warn('Signed out: the server rejected the token.', error?.message);
            removeAuthToken();
            removeSessionToken();
          } else {
            console.warn('Could not reach the server; staying signed in.', error?.message);
          }
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
    
    // Listen for session invalidation events
    const handleSessionInvalidatedEvent = (event: Event) => {
      handleSessionInvalidation();
    };
    
    window.addEventListener('sessionInvalidated', handleSessionInvalidatedEvent as EventListener);
    
    // Cleanup
    return () => {
      if (sessionCheckInterval.current) {
        clearInterval(sessionCheckInterval.current);
      }
      window.removeEventListener('sessionInvalidated', handleSessionInvalidatedEvent as EventListener);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await authAPI.login(email, password);
      setUser({ ...response.user, agoraUid: response.agoraUid, agoraRtmToken: response.agoraRtmToken });
      console.log('[DEBUG] AuthContext setUser (login):', { ...response.user, agoraUid: response.agoraUid, agoraRtmToken: response.agoraRtmToken });
      
      // Start periodic session validation
      if (response.sessionToken && sessionCheckInterval.current === null) {
        sessionCheckInterval.current = setInterval(validateSession, 30000);
      }
      
      setIsLoading(false);
      return { ...response.user, agoraUid: response.agoraUid, agoraRtmToken: response.agoraRtmToken };
    } catch (error) {
      setIsLoading(false);
      throw error;
    }
  };

  // Refresh token function for streaming sessions
  const refreshToken = async () => {
    try {
      const response = await authAPI.refreshToken();
      setUser({ ...response.user, agoraUid: response.agoraUid, agoraRtmToken: response.agoraRtmToken });
      console.log('[DEBUG] AuthContext setUser (refreshToken):', { ...response.user, agoraUid: response.agoraUid, agoraRtmToken: response.agoraRtmToken });
      return { ...response.user, agoraUid: response.agoraUid, agoraRtmToken: response.agoraRtmToken };
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  };

  const register = async (userData: any) => {
    setIsLoading(true);

    try {
      const response = await authAPI.register(userData);
      setUser({ ...response.user, agoraUid: response.agoraUid, agoraRtmToken: response.agoraRtmToken });
      setIsLoading(false);
      return { ...response.user, agoraUid: response.agoraUid, agoraRtmToken: response.agoraRtmToken };
    } catch (error) {
      console.error('AuthContext: Registration error:', error);
      setIsLoading(false);
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    removeAuthToken();
    removeSessionToken();
    
    // Clear the session validation interval
    if (sessionCheckInterval.current) {
      clearInterval(sessionCheckInterval.current);
      sessionCheckInterval.current = null;
    }
    
    // Optionally call the logout endpoint
    authAPI.logout().catch(console.error);
  };

  const updateUser = (userData: Partial<User>) => {
    setUser(prevUser => prevUser ? { ...prevUser, ...userData } : null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.role === 'admin',
        isProfessor: user?.role === 'professor',
        login,
        register,
        logout,
        updateUser,
        refreshToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
