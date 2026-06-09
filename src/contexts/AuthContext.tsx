import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { API_URL } from '@/constants/config';

type UserRole = 'admin' | 'super-admin' | null;

type AuthContextType = {
  role: UserRole;
  isAuthenticated: boolean;
  signIn: (email: string, password: string, role: UserRole) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<UserRole>(null);
  const isAuthenticated = !!role;

  // Load stored role on mount
  useEffect(() => {
    const load = async () => {
      const storedRole = await AsyncStorage.getItem('userRole');
      if (storedRole === 'admin' || storedRole === 'super-admin') {
        setRole(storedRole as UserRole);
      }
    };
    load();
  }, []);

  const signIn = async (email: string, password: string, chosenRole: UserRole) => {
    if (!email || !password || !chosenRole) {
      throw new Error('Please enter email and password');
    }

    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password, role: chosenRole }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.success && data.user) {
        await AsyncStorage.setItem('userRole', data.user.role);
        if (data.token) {
          await AsyncStorage.setItem('authToken', data.token);
        }
        setRole(data.user.role as UserRole);
        router.replace('/');
      } else {
        throw new Error('Invalid credentials');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      throw err;
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('userRole');
    await AsyncStorage.removeItem('authToken');
    setRole(null);
    router.replace('/');
  };

  return (
    <AuthContext.Provider value={{ role, isAuthenticated, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};
