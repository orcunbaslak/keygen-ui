'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getKeygenApi } from '@/lib/api';
import { User } from '@/lib/types/keygen';
import { handleAuthError } from '@/lib/utils/error-handling';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is authenticated on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // Try to get token from localStorage or cookies
      const token = localStorage.getItem('keygen_token');
      if (!token) {
        setLoading(false);
        return;
      }

      // Get API client and set token
      const api = getKeygenApi();
      api.setToken(token);

      // Verify token by getting current user
      const response = await api.me();
      if (response.data) {
        setUser(response.data as User);
      }
    } catch (err: unknown) {
      // Log with JSON.stringify for plain objects that don't serialize well
      console.error('Auth check failed:', typeof err === 'object' ? JSON.stringify(err, null, 2) : err);
      setError('Authentication failed');
      // Clear invalid token
      localStorage.removeItem('keygen_token');
      const api = getKeygenApi();
      api.setToken('');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // Get API client and authenticate with Keygen API
      const api = getKeygenApi();
      const token = await api.authenticate(email, password, 'Keygen UI Session');

      // Store token
      localStorage.setItem('keygen_token', token);

      // Get user info
      const response = await api.me();
      if (response.data) {
        setUser(response.data as User);
      }
    } catch (err: unknown) {
      handleAuthError(err);
      setError('Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setError(null);
    localStorage.removeItem('keygen_token');
    const api = getKeygenApi();
    api.setToken('');
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}