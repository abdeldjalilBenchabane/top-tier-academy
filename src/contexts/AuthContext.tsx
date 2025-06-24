import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  isProfessor: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
};

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  isProfessor: false,
  login: async () => { throw new Error('Login function not implemented'); },
  logout: () => {},
});

// Mock user data - in a real app, you would fetch this from an API
const mockUsers = [
  {
    id: "user_1",
    name: "Admin User",
    email: "admin@school.edu",
    role: "admin" as const,
  },
  {
    id: "user_2",
    name: "Professor Smith",
    email: "smith@school.edu",
    role: "professor" as const,
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if we have a user in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login function - in a real app, this would make an API call
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Find user by email - in a real app, API would validate password
    const foundUser = mockUsers.find(u => u.email === email);
    
    if (foundUser) {
      setUser(foundUser);
      localStorage.setItem('user', JSON.stringify(foundUser));
      setIsLoading(false);
      return foundUser;
    } else {
      setIsLoading(false);
      throw new Error('Invalid credentials');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAdmin: user?.role === 'admin',
        isProfessor: user?.role === 'professor',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
