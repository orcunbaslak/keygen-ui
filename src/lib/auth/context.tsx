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

async function storeTokenInCookie(token: string): Promise<void> {
  await fetch('/api/auth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
}

async function clearTokenCookie(): Promise<void> {
  await fetch('/api/auth/token', { method: 'DELETE' });
}

async function hasStoredToken(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/token');
    const data = await res.json();
    return !!data.hasToken;
  } catch {
    return false;
  }
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

      // Check if we have a token stored in the httpOnly cookie
      const tokenExists = await hasStoredToken();
      if (!tokenExists) {
        setLoading(false);
        return;
      }

      // Verify token by calling the server-side /me proxy
      const meResponse = await fetch('/api/auth/me');
      if (!meResponse.ok) {
        // Token is invalid or expired — clear it
        await clearTokenCookie();
        setLoading(false);
        return;
      }

      const data = await meResponse.json();
      if (data.data) {
        setUser(data.data as User);
      }
    } catch (err: unknown) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Auth check failed:', err instanceof Error ? err.message : 'Unknown error');
      }
      setError('Authentication failed');
      await clearTokenCookie();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // Authenticate via the API client to get a token
      const api = getKeygenApi();
      const token = await api.authenticate(email, password, 'Keygen UI Session');

      // Store token in httpOnly cookie (secure, not accessible to JS)
      await storeTokenInCookie(token);

      // Also set it on the client for the current session's API calls
      api.setToken(token);

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

  const logout = async () => {
    setUser(null);
    setError(null);
    await clearTokenCookie();
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
