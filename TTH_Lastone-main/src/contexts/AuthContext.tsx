import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { authAPI, getAuthToken, removeAuthToken } from '@/services/api';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isProfessor: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
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
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have a token and validate it
    const token = getAuthToken();
    if (token) {
      authAPI.getCurrentUser()
        .then((response) => {
          // Attach agoraUid/agoraRtmToken to user object
          setUser({ ...response.user, agoraUid: response.agoraUid, agoraRtmToken: response.agoraRtmToken });
          console.log('[DEBUG] AuthContext setUser (getCurrentUser):', { ...response.user, agoraUid: response.agoraUid, agoraRtmToken: response.agoraRtmToken });
        })
        .catch((error) => {
          console.error('Token validation failed:', error);
          removeAuthToken();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);

    try {
      const response = await authAPI.login(email, password);
      setUser({ ...response.user, agoraUid: response.agoraUid, agoraRtmToken: response.agoraRtmToken });
      console.log('[DEBUG] AuthContext setUser (login):', { ...response.user, agoraUid: response.agoraUid, agoraRtmToken: response.agoraRtmToken });
      setIsLoading(false);
      return { ...response.user, agoraUid: response.agoraUid, agoraRtmToken: response.agoraRtmToken };
    } catch (error) {
      setIsLoading(false);
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
