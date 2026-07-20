import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, setAccessToken } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'STUDENT' | 'FACULTY' | 'HOD' | 'ADMIN';
  rollNumber?: string;
  department?: string;
  class?: string;
  section?: string;
  emailNotificationsEnabled?: boolean;
  clubMembers?: {
    clubId: string;
    role: string;
  }[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, passwordHash: string) => Promise<void>;
  googleLogin: (token: string) => Promise<{ isNewUser: boolean }>;
  register: (data: {
    email: string;
    passwordHash: string;
    name: string;
    rollNumber?: string;
    department?: string;
    class?: string;
    section?: string;
    role?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; rollNumber?: string; department?: string; class?: string; section?: string; emailNotificationsEnabled?: boolean }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const res = await api.post('/auth/refresh');
        const { accessToken } = res.data.data;
        setAccessToken(accessToken);

        const userRes = await api.get('/auth/me');
        setUser(userRes.data.data.user);
        connectSocket();
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    restoreSession();

    const handleUnauthorized = () => {
      setUser(null);
      setAccessToken(null);
      disconnectSocket();
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, passwordHash: string) => {
    const res = await api.post('/auth/login', { email, password: passwordHash });
    const { user: loggedInUser, accessToken } = res.data.data;
    setAccessToken(accessToken);
    setUser(loggedInUser);
    connectSocket();
  };

  const googleLogin = async (token: string) => {
    const res = await api.post('/auth/google-login', { token });
    const { user: loggedInUser, accessToken, isNewUser } = res.data.data;
    setAccessToken(accessToken);
    setUser(loggedInUser);
    connectSocket();
    return { isNewUser };
  };

  const register = async (data: {
    email: string;
    passwordHash: string;
    name: string;
    rollNumber?: string;
    department?: string;
    class?: string;
    section?: string;
    role?: string;
  }) => {
    await api.post('/auth/register', {
      email: data.email,
      password: data.passwordHash,
      name: data.name,
      rollNumber: data.rollNumber,
      department: data.department,
      class: data.class,
      section: data.section,
      role: data.role,
    });
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setAccessToken(null);
      disconnectSocket();
    }
  };

  const updateProfile = async (data: { name?: string; rollNumber?: string; department?: string; class?: string; section?: string; emailNotificationsEnabled?: boolean }) => {
    const res = await api.put('/users/profile', data);
    setUser(res.data.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
